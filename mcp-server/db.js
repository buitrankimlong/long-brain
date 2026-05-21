/**
 * Longbrain v7.0 — Database Layer
 * SQLite + FTS5 + sqlite-vec for hybrid search
 */
"use strict";
const Database = require("better-sqlite3");
const sqlite_vec = require("sqlite-vec");
const path = require("path");

class LongbrainDB {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    sqlite_vec.load(this.db);

    // Performance: WAL mode + optimize
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
    this.db.pragma("cache_size = -64000"); // 64MB cache

    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        title TEXT,
        category TEXT,
        content TEXT,
        content_hash TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // FTS5 + vec0 + triggers (idempotent check needed)
    const hasFts = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='docs_fts'"
    ).get();

    if (!hasFts) {
      this.db.exec(`
        CREATE VIRTUAL TABLE docs_fts USING fts5(
          title, content,
          content='documents',
          content_rowid='id',
          tokenize='unicode61 remove_diacritics 2'
        );

        CREATE VIRTUAL TABLE docs_vec USING vec0(embedding float[512]);

        CREATE TRIGGER docs_ai AFTER INSERT ON documents BEGIN
          INSERT INTO docs_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
        END;
        CREATE TRIGGER docs_ad AFTER DELETE ON documents BEGIN
          INSERT INTO docs_fts(docs_fts, rowid, title, content)
            VALUES('delete', old.id, old.title, old.content);
        END;
        CREATE TRIGGER docs_au AFTER UPDATE ON documents BEGIN
          INSERT INTO docs_fts(docs_fts, rowid, title, content)
            VALUES('delete', old.id, old.title, old.content);
          INSERT INTO docs_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
        END;
      `);
    }
  }

  // --- CRUD ---

  upsertDocument(filePath, title, category, content, contentHash) {
    const existing = this.db.prepare("SELECT id FROM documents WHERE path = ?").get(filePath);

    if (existing) {
      this.db.prepare(`
        UPDATE documents SET title=?, category=?, content=?, content_hash=?, updated_at=datetime('now')
        WHERE id=?
      `).run(title, category, content, contentHash, existing.id);
      return { id: existing.id, action: "updated" };
    } else {
      const info = this.db.prepare(`
        INSERT INTO documents (path, title, category, content, content_hash) VALUES (?, ?, ?, ?, ?)
      `).run(filePath, title, category, content, contentHash);
      return { id: Number(info.lastInsertRowid), action: "inserted" };
    }
  }

  upsertVector(docId, embedding) {
    // Delete existing vector if any
    this.db.prepare("DELETE FROM docs_vec WHERE rowid = ?").run(BigInt(docId));
    // Insert new — MUST use BigInt for sqlite-vec rowid (BUG-1)
    this.db.prepare("INSERT INTO docs_vec (rowid, embedding) VALUES (?, ?)")
      .run(BigInt(docId), embedding); // embedding = Float32Array
  }

  deleteDocument(filePath) {
    const doc = this.db.prepare("SELECT id FROM documents WHERE path = ?").get(filePath);
    if (doc) {
      this.db.prepare("DELETE FROM docs_vec WHERE rowid = ?").run(BigInt(doc.id));
      this.db.prepare("DELETE FROM documents WHERE id = ?").run(doc.id); // triggers handle FTS5
    }
  }

  getDocumentByPath(filePath) {
    return this.db.prepare("SELECT * FROM documents WHERE path = ?").get(filePath);
  }

  getDocumentById(id) {
    return this.db.prepare("SELECT * FROM documents WHERE id = ?").get(id);
  }

  getAllHashes() {
    return new Map(
      this.db.prepare("SELECT path, content_hash FROM documents").all()
        .map(r => [r.path, r.content_hash])
    );
  }

  getDocCount() {
    return this.db.prepare("SELECT COUNT(*) as count FROM documents").get().count;
  }

  getVecCount() {
    return this.db.prepare("SELECT COUNT(*) as count FROM docs_vec").get().count;
  }

  hasEmbedding(docId) {
    return !!this.db.prepare("SELECT rowid FROM docs_vec WHERE rowid = ?").get(BigInt(docId));
  }

  getDocsWithoutEmbeddings() {
    return this.db.prepare(`
      SELECT d.id, d.path, d.title, d.content
      FROM documents d
      LEFT JOIN docs_vec v ON v.rowid = d.id
      WHERE v.rowid IS NULL
    `).all();
  }

  // --- SEARCH ---

  searchFTS(query, limit = 100) {
    try {
      return this.db.prepare(`
        SELECT rowid as id, rank FROM docs_fts
        WHERE docs_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `).all(query, limit);
    } catch (e) {
      // Invalid FTS query syntax, try escaping
      const escaped = '"' + query.replace(/"/g, '""') + '"';
      try {
        return this.db.prepare(`
          SELECT rowid as id, rank FROM docs_fts
          WHERE docs_fts MATCH ?
          ORDER BY rank
          LIMIT ?
        `).all(escaped, limit);
      } catch {
        return [];
      }
    }
  }

  searchVector(queryEmbedding, limit = 100) {
    return this.db.prepare(`
      SELECT rowid as id, distance FROM docs_vec
      WHERE embedding MATCH ?
      ORDER BY distance
      LIMIT ?
    `).all(queryEmbedding, limit); // queryEmbedding = Float32Array
  }

  close() {
    this.db.close();
  }
}

module.exports = { LongbrainDB };
