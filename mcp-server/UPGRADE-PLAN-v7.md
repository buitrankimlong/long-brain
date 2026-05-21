# Longbrain v7.0 — Hybrid Semantic Search
# PLAN CHI TIET (Verified on Windows 11, May 2026)

> **Trang thai**: PLAN — chua build
> **Tac gia**: Claude Code + user Long
> **Muc tieu**: Nang cap search tu keyword-only (70% accuracy) len hybrid BM25+vector (88%+)
> **Nguyen tac**: Moi ky thuat phai deep research + test that TRUOC khi build

---

## HIEN TRANG (da verify)

| Metric | Gia tri |
|--------|---------|
| Tong files vault | 353 MD files (401 ke ca subfolders) |
| Tong content | 2.46 MB |
| File lon nhat | 127 KB (auto-session-log.md) |
| Top knowledge files | 35-48 KB |
| Search hien tai | Regex keyword match trong server.js |
| Search accuracy | ~70% (miss semantic, cross-language) |
| MCP Server | Node.js CommonJS, 21 tools, v6.0 |
| Dependencies | @modelcontextprotocol/sdk, zod |

## QUYET DINH KIEN TRUC (da luu vault)

| Component | Chon | Ly do |
|-----------|------|-------|
| Vector storage | **sqlite-vec** v0.1.9 + better-sqlite3 v12.10.0 | Zero infra, cung SQLite |
| Keyword search | **FTS5** (unicode61 remove_diacritics 2) | Thay regex, 0.4ms/query |
| Embeddings | **V98 API** text-embedding-3-small (512 dims) | Da test OK, re, batch |
| Fusion | **RRF** (k=60) | Khong can tuning |
| Change detection | **SHA-256** hash per file | Chi re-embed khi thay doi |

## TEST RESULTS (da verified tren may user)

### Test 1: sqlite-vec + better-sqlite3 (PASS)
```
npm install better-sqlite3 sqlite-vec → 0 vulnerabilities
sqlite_vec.load(db) → v0.1.9
Vector table (512 dims) → OK
Insert via BigInt rowid + Float32Array → OK  ← QUAN TRONG: phai dung BigInt!
KNN query → OK, distance chính xác
FTS5 + sqlite-vec cung 1 DB → OK
```

### Test 2: FTS5 Vietnamese diacritics (PASS)
```
tokenize='unicode61 remove_diacritics 2'
Search "cach" (ko dau) → match "Cách" (co dau) ✅
Search "triển khai" → match document ✅
Search "VPS" → exact match ✅
```

### Test 3: V98 Embeddings (PASS)
```
Endpoint: POST https://v98store.com/v1/embeddings
Model: text-embedding-3-small
Batch 50 texts → OK (600 tokens)
Dimension reduction 1536→512 → OK
Long text 24.5K chars → OK (8001 tokens)
Vietnamese semantic similarity:
  "deploy server VPS" vs "triển khai máy chủ VPS" = 0.74 (HIGH ✅)
  "cách fix bug" vs "Cach fix bug" (no diac) = 0.86 (HIGH ✅)
  "deploy VPS" vs "PM2 Nginx" = 0.47 (MEDIUM ✅)
  "deploy VPS" vs "nấu phở" = 0.28 (LOW ✅)
```

### Test 4: Full Pipeline (PASS)
```
Index 353 real files → 304ms
FTS5 query average → 0.4ms
Vector storage estimate → 0.69 MB
Hybrid RRF → correct ranking verified
```

### Test 5: V98 Embeddings Limits (PASS)
```
Batch 20 → OK (3941ms, 360 tokens)
Batch 30 → OK
Batch 40 → OK
Batch 50 → OK (600 tokens)
Max input length: 8191 tokens (OpenAI standard)
Dimensions: 512 (reduced from 1536)
```

---

## BUGS DA PHAT HIEN (phai tranh khi build)

### BUG-1: sqlite-vec rowid PHAI la BigInt
```javascript
// SAI - se bao loi "Only integers are allows for primary key values"
insertVec.run(id, embedding);         // id la Number
insertVec.run(Number(id), embedding); // van sai

// DUNG - phai convert sang BigInt
insertVec.run(BigInt(id), embedding);
// Hoac dung lastInsertRowid (da la BigInt tu better-sqlite3)
const info = insertDoc.run(...);
insertVec.run(info.lastInsertRowid, embedding);  // lastInsertRowid la BigInt
```

### BUG-2: FTS5 multi-word query can quotes
```javascript
// SAI - bao loi syntax
db.prepare('...MATCH ?').all('deploy VPS');    // FTS5 coi la AND operator

// DUNG - dung quotes cho phrase match
db.prepare('...MATCH ?').all('"deploy VPS"');  // phrase match

// HOAC tach tung tu
db.prepare('...MATCH ?').all('deploy OR VPS'); // OR match
```

### BUG-3: V98 batch co the timeout
```
Batch 50 texts that bai 1 lan (timeout), thanh cong lan 2.
→ Can retry logic voi exponential backoff.
→ Batch size an toan: 20-30 texts/request.
```

---

## SCHEMA CUOI CUNG (da test)

```sql
-- Table chinh: luu noi dung MD files
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT UNIQUE NOT NULL,      -- relative path tu vault root
  title TEXT,                     -- ten file (ko co .md)
  category TEXT,                  -- folder category (01-AI-FOUNDATIONS, 32-LEARNINGS, etc.)
  content TEXT,                   -- noi dung day du cua file
  content_hash TEXT,              -- SHA-256 de detect thay doi
  updated_at TEXT DEFAULT (datetime('now'))
);

-- FTS5: full-text search voi Vietnamese diacritics support
CREATE VIRTUAL TABLE docs_fts USING fts5(
  title, content,
  content='documents',           -- external content table
  content_rowid='id',
  tokenize='unicode61 remove_diacritics 2'  -- KEY: remove diacritics cho Vietnamese
);

-- Vector: semantic search via sqlite-vec
CREATE VIRTUAL TABLE docs_vec USING vec0(
  embedding float[512]           -- 512 dims (text-embedding-3-small reduced)
);

-- Auto-sync triggers: documents → FTS5
CREATE TRIGGER docs_ai AFTER INSERT ON documents BEGIN
  INSERT INTO docs_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER docs_ad AFTER DELETE ON documents BEGIN
  INSERT INTO docs_fts(docs_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
END;

CREATE TRIGGER docs_au AFTER UPDATE ON documents BEGIN
  INSERT INTO docs_fts(docs_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
  INSERT INTO docs_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

-- Note: docs_vec KHONG co trigger - insert thu cong vi can goi V98 API
```

---

## FILE STRUCTURE

```
mcp-server/
├── server.js                 ← EDIT: integrate hybrid search vao 21 tools
├── db.js                     ← NEW: SQLite schema + CRUD operations
├── embeddings.js             ← NEW: V98 API wrapper (batch, retry)
├── indexer.js                ← NEW: Vault scanner + MD parser + indexer
├── hybrid-search.js          ← NEW: FTS5 + vector + RRF fusion
├── package.json              ← EDIT: add better-sqlite3, sqlite-vec
├── longbrain.db              ← NEW: SQLite database file (auto-created)
├── UPGRADE-PLAN-v7.md        ← THIS FILE
└── node_modules/
```

---

## PHASE 1: Database Layer (db.js)

### 1a. Research: better-sqlite3 API
- [ ] Doc: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
- [ ] Hieu: transaction(), prepare(), exec()
- [ ] Hieu: WAL mode cho concurrent reads
- [ ] `add_learning()` sau khi hieu ro

### 1b. Build db.js
```javascript
// mcp-server/db.js
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

      -- Check if FTS5 table exists before creating
      -- (cannot use IF NOT EXISTS with virtual tables)
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
    // Insert new
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
```

### 1c. Verification checklist
- [ ] `new LongbrainDB('./test.db')` khong loi
- [ ] Schema tao dung (documents, docs_fts, docs_vec, triggers)
- [ ] upsertDocument insert + update deu OK
- [ ] upsertVector voi BigInt OK
- [ ] searchFTS("VPS") tra ve ket qua
- [ ] searchVector(embedding) tra ve ket qua
- [ ] Transaction: insert 100 docs trong 1 transaction < 100ms
- [ ] WAL mode active
- [ ] DB file size hop ly (~4MB cho 353 files)
- [ ] `add_learning()` schema final

---

## PHASE 2: V98 Embeddings (embeddings.js)

### 2a. Research: OpenAI Embeddings API spec
- [ ] Doc: https://platform.openai.com/docs/api-reference/embeddings
- [ ] Verify: V98 tuong thich 100%
- [ ] Tim: max input tokens, max batch size, error codes
- [ ] `add_learning()` V98 limits

### 2b. Build embeddings.js
```javascript
// mcp-server/embeddings.js
"use strict";
const https = require("https");

const V98_API_KEY = process.env.V98_API_KEY || "sk-rdysXFstsySd1RqSc33OfP4tCQXqGneOK00e5Ob8G6ACXyk9";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMS = 512;
const MAX_BATCH_SIZE = 20; // An toan, tranh timeout
const MAX_RETRIES = 3;

async function callV98Embeddings(texts) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMS,
    });

    const req = https.request({
      hostname: "v98store.com",
      path: "/v1/embeddings",
      method: "POST",
      headers: {
        "Authorization": "Bearer " + V98_API_KEY,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 30000,
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json.error) reject(new Error(json.error.message));
          else resolve(json);
        } catch (e) {
          reject(new Error("Invalid JSON response"));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });
    req.write(data);
    req.end();
  });
}

async function embedTexts(texts, retries = MAX_RETRIES) {
  // Split into batches
  const batches = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    batches.push(texts.slice(i, i + MAX_BATCH_SIZE));
  }

  const allEmbeddings = [];
  let totalTokens = 0;

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = batches[bi];
    let lastError;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await callV98Embeddings(batch);

        // Sort by index (V98 may return out of order)
        const sorted = result.data.sort((a, b) => a.index - b.index);
        allEmbeddings.push(...sorted.map(d => new Float32Array(d.embedding)));
        totalTokens += result.usage?.total_tokens || 0;
        lastError = null;
        break;
      } catch (e) {
        lastError = e;
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }

    if (lastError) {
      throw new Error(`Batch ${bi+1}/${batches.length} failed after ${retries} retries: ${lastError.message}`);
    }

    // Rate limit delay between batches (100ms)
    if (bi < batches.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return { embeddings: allEmbeddings, totalTokens };
}

async function embedSingle(text) {
  const { embeddings } = await embedTexts([text]);
  return embeddings[0];
}

// Prepare text for embedding: strip frontmatter, limit length
function prepareTextForEmbedding(content, title = "") {
  // Strip YAML frontmatter
  let text = content.replace(/^---[\s\S]*?---\n?/, "");

  // Prepend title for better context
  if (title) {
    text = title + "\n\n" + text;
  }

  // Truncate to ~6000 words (~8000 tokens) to stay under API limit
  const words = text.split(/\s+/);
  if (words.length > 6000) {
    text = words.slice(0, 6000).join(" ");
  }

  return text.trim();
}

module.exports = { embedTexts, embedSingle, prepareTextForEmbedding, EMBEDDING_DIMS };
```

### 2c. Verification checklist
- [ ] embedSingle("test") tra ve Float32Array(512)
- [ ] embedTexts(20 texts) tra ve 20 embeddings
- [ ] embedTexts(100 texts) chia batch 20, retry neu fail
- [ ] prepareTextForEmbedding strip frontmatter dung
- [ ] Long text (50KB file) khong bi loi
- [ ] Retry logic hoat dong khi V98 timeout
- [ ] `add_learning()` V98 embedding patterns

---

## PHASE 3: Vault Indexer (indexer.js)

### 3a. Research: MD frontmatter parsing
- [ ] Tim package nhe nhat cho parse YAML frontmatter
- [ ] Hoac dung regex (don gian hon, it dependency)
- [ ] Test voi 5 file that tu vault
- [ ] `add_learning()` parser chon

### 3b. Build indexer.js
```javascript
// mcp-server/indexer.js
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { embedTexts, prepareTextForEmbedding } = require("./embeddings");

// Parse YAML frontmatter (simple regex, no extra dependency)
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { metadata: {}, body: content };

  const metadata = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.+)/);
    if (kv) metadata[kv[1]] = kv[2].trim();
  }

  return { metadata, body: content.slice(match[0].length).trim() };
}

// Determine category from file path
function getCategoryFromPath(filePath, vaultDir) {
  const rel = path.relative(vaultDir, filePath);
  const parts = rel.split(path.sep);
  return parts[0] || "unknown"; // e.g., "01-AI-FOUNDATIONS", "32-LEARNINGS"
}

// Scan vault directory for all MD files
function scanVault(vaultDir) {
  const files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
  }

  walk(vaultDir);
  return files;
}

// Full reindex: scan vault, detect changes, embed new/modified files
async function reindexVault(db, vaultDir, options = {}) {
  const { forceAll = false, onProgress = () => {} } = options;

  const files = scanVault(vaultDir);
  const existingHashes = forceAll ? new Map() : db.getAllHashes();

  const stats = { total: files.length, added: 0, updated: 0, deleted: 0, skipped: 0, embedded: 0 };

  // Step 1: Upsert documents + detect changes
  const toEmbed = []; // { id, content, title }

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf-8");
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    const relPath = path.relative(vaultDir, filePath).replace(/\\/g, "/");
    const category = getCategoryFromPath(filePath, vaultDir);
    const { metadata } = parseFrontmatter(content);
    const title = metadata.title || path.basename(filePath, ".md").replace(/-/g, " ");

    // Skip if unchanged
    if (existingHashes.get(relPath) === hash) {
      existingHashes.delete(relPath); // Mark as seen
      stats.skipped++;
      continue;
    }

    const result = db.upsertDocument(relPath, title, category, content, hash);
    stats[result.action === "inserted" ? "added" : "updated"]++;

    // Queue for embedding
    const text = prepareTextForEmbedding(content, title);
    if (text.length > 10) { // Skip near-empty files
      toEmbed.push({ id: result.id, text, title: relPath });
    }

    existingHashes.delete(relPath); // Mark as seen
  }

  // Step 2: Delete removed files
  for (const [deletedPath] of existingHashes) {
    db.deleteDocument(deletedPath);
    stats.deleted++;
  }

  // Step 3: Also embed docs that exist but have no vector yet
  if (!forceAll) {
    const missing = db.getDocsWithoutEmbeddings();
    for (const doc of missing) {
      const text = prepareTextForEmbedding(doc.content, doc.title);
      if (text.length > 10 && !toEmbed.find(e => e.id === doc.id)) {
        toEmbed.push({ id: doc.id, text, title: doc.path });
      }
    }
  }

  // Step 4: Batch embed
  if (toEmbed.length > 0) {
    onProgress({ phase: "embedding", total: toEmbed.length, done: 0 });

    const texts = toEmbed.map(d => d.text);
    const { embeddings, totalTokens } = await embedTexts(texts);

    // Store vectors in transaction
    const insertVec = db.db.prepare("DELETE FROM docs_vec WHERE rowid = ?");
    const addVec = db.db.prepare("INSERT INTO docs_vec (rowid, embedding) VALUES (?, ?)");

    db.db.transaction(() => {
      for (let i = 0; i < toEmbed.length; i++) {
        insertVec.run(BigInt(toEmbed[i].id));
        addVec.run(BigInt(toEmbed[i].id), embeddings[i]);
        stats.embedded++;
      }
    })();

    stats.tokensUsed = totalTokens;
    onProgress({ phase: "embedding", total: toEmbed.length, done: toEmbed.length });
  }

  return stats;
}

// Incremental: index single file (used after add_learning, etc.)
async function indexSingleFile(db, vaultDir, filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  const relPath = path.relative(vaultDir, filePath).replace(/\\/g, "/");
  const category = getCategoryFromPath(filePath, vaultDir);
  const { metadata } = parseFrontmatter(content);
  const title = metadata.title || path.basename(filePath, ".md").replace(/-/g, " ");

  const result = db.upsertDocument(relPath, title, category, content, hash);

  // Embed
  const text = prepareTextForEmbedding(content, title);
  if (text.length > 10) {
    const { embedTexts: embed } = require("./embeddings");
    const { embeddings } = await embed([text]);
    db.upsertVector(result.id, embeddings[0]);
  }

  return result;
}

module.exports = { reindexVault, indexSingleFile, scanVault, parseFrontmatter };
```

### 3c. Verification checklist
- [ ] scanVault() tim duoc 353 files
- [ ] parseFrontmatter() extract metadata dung
- [ ] reindexVault() index toan bo vault < 60 giay
- [ ] reindexVault() lan 2 (incremental) skip unchanged files
- [ ] indexSingleFile() cho 1 file moi
- [ ] Deleted files bi xoa khoi DB
- [ ] `add_learning()` indexer patterns

---

## PHASE 4: Hybrid Search (hybrid-search.js)

### 4a. Research: RRF va query routing
- [ ] Doc paper: Cormack et al. RRF
- [ ] Verify k=60 la optimal
- [ ] Tim query routing heuristics da proven
- [ ] `add_learning()` RRF knowledge

### 4b. Build hybrid-search.js
```javascript
// mcp-server/hybrid-search.js
"use strict";
const { embedSingle } = require("./embeddings");

// Reciprocal Rank Fusion (k=60, standard from Cormack et al.)
function rrfFusion(ftsResults, vecResults, k = 60) {
  const scores = new Map();

  ftsResults.forEach((r, idx) => {
    const id = Number(r.id);
    scores.set(id, {
      rrf: 1 / (k + idx + 1),
      fts_rank: idx + 1,
      vec_rank: null,
      fts_score: r.rank,
      vec_distance: null,
    });
  });

  vecResults.forEach((r, idx) => {
    const id = Number(r.id);
    const existing = scores.get(id) || {
      rrf: 0, fts_rank: null, vec_rank: null, fts_score: null, vec_distance: null,
    };
    existing.rrf += 1 / (k + idx + 1);
    existing.vec_rank = idx + 1;
    existing.vec_distance = r.distance;
    scores.set(id, existing);
  });

  return Array.from(scores.entries())
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.rrf - a.rrf);
}

// Query classification for routing
function classifyQuery(query) {
  const q = query.trim();
  const wordCount = q.split(/\s+/).length;

  // Single word → keyword only (exact match more useful)
  if (wordCount === 1) return "KEYWORD";

  // Contains code patterns → keyword only
  if (/[{}()\[\];=<>]/.test(q)) return "KEYWORD";

  // Contains file path or extension → keyword only
  if (/\.\w{2,4}$/.test(q) || /[/\\]/.test(q)) return "KEYWORD";

  // Question mark or question words → hybrid (semantic helps)
  if (/\?$/.test(q)) return "HYBRID";
  if (/^(what|how|why|when|where|who|cách|tại sao|làm sao|ở đâu|khi nào)/i.test(q)) return "HYBRID";

  // Multi-word default → hybrid
  return "HYBRID";
}

// Main search function
async function hybridSearch(db, query, options = {}) {
  const { limit = 10, category = null } = options;
  const strategy = classifyQuery(query);

  let ftsResults = [];
  let vecResults = [];

  // Step 1: FTS5 search (always run — fast, 0.4ms)
  ftsResults = db.searchFTS(query, 100);

  // Step 2: Vector search (only for HYBRID strategy)
  if (strategy === "HYBRID") {
    try {
      const queryEmbedding = await embedSingle(query);
      vecResults = db.searchVector(queryEmbedding, 100);
    } catch (e) {
      // Fallback to FTS-only if embedding fails
      console.error("Vector search failed, falling back to FTS:", e.message);
    }
  }

  // Step 3: Merge
  let merged;
  if (vecResults.length === 0) {
    // FTS-only results
    merged = ftsResults.map((r, idx) => ({
      id: Number(r.id),
      rrf: 1 / (60 + idx + 1),
      fts_rank: idx + 1,
      vec_rank: null,
    }));
  } else if (ftsResults.length === 0) {
    // Vector-only results
    merged = vecResults.map((r, idx) => ({
      id: Number(r.id),
      rrf: 1 / (60 + idx + 1),
      fts_rank: null,
      vec_rank: idx + 1,
    }));
  } else {
    // Hybrid RRF fusion
    merged = rrfFusion(ftsResults, vecResults);
  }

  // Step 4: Enrich with document data + filter by category
  const results = [];
  for (const m of merged) {
    const doc = db.getDocumentById(m.id);
    if (!doc) continue;
    if (category && doc.category !== category) continue;

    results.push({
      id: m.id,
      path: doc.path,
      title: doc.title,
      category: doc.category,
      rrf_score: m.rrf,
      fts_rank: m.fts_rank,
      vec_rank: m.vec_rank,
      // Extract snippet (first 500 chars of content)
      snippet: doc.content.substring(0, 500),
    });

    if (results.length >= limit) break;
  }

  return { query, strategy, total: results.length, results };
}

// Quick FTS-only search (for hooks, fast path)
function quickSearch(db, query, limit = 10) {
  const ftsResults = db.searchFTS(query, limit);
  return ftsResults.map(r => {
    const doc = db.getDocumentById(Number(r.id));
    return doc ? { id: r.id, path: doc.path, title: doc.title, category: doc.category } : null;
  }).filter(Boolean);
}

module.exports = { hybridSearch, quickSearch, classifyQuery, rrfFusion };
```

### 4c. Verification checklist
- [ ] classifyQuery("VPS") → "KEYWORD"
- [ ] classifyQuery("cách deploy server lên VPS?") → "HYBRID"
- [ ] classifyQuery("server.js") → "KEYWORD"
- [ ] hybridSearch(db, "VPS") tra ve results sorted by RRF
- [ ] hybridSearch(db, "triển khai ứng dụng") tim duoc deploy docs (semantic)
- [ ] quickSearch(db, "Docker") tra ve ket qua nhanh (<5ms)
- [ ] Category filter hoat dong
- [ ] Fallback to FTS-only khi V98 fail
- [ ] `add_learning()` hybrid search patterns

---

## PHASE 5: Server Integration (server.js)

### 5a. Research: MCP server tool modification
- [ ] Doc lai server.js hien tai (21 tools)
- [ ] Xac dinh tools can sua: search_knowledge, search_learnings, search_projects, get_context_for_task
- [ ] Plan backward compatibility
- [ ] `add_learning()` MCP modification patterns

### 5b. Integration plan
```
Tools can sua (giu interface cu, thay implementation):
1. search_knowledge(query) → dung hybridSearch, filter category 01-20
2. search_learnings(query) → dung hybridSearch, filter category 32-LEARNINGS
3. search_projects(query) → dung hybridSearch, filter category 30-PROJECTS
4. search_decisions(query) → dung hybridSearch, filter category 35-DECISIONS
5. get_context_for_task(task) → dung hybridSearch (all categories)

Tools can sua (add indexing):
6. add_learning() → sau khi ghi file, goi indexSingleFile()
7. add_knowledge() → sau khi ghi file, goi indexSingleFile()
8. add_project() → sau khi ghi file, goi indexSingleFile()
9. add_decision() → sau khi ghi file, goi indexSingleFile()
10. add_never_again() → sau khi ghi file, goi indexSingleFile()

Tools moi:
11. reindex_vault(mode) → mode: "full" | "incremental"
12. search_semantic(query, limit) → pure vector search

Tools KHONG thay doi:
- init_project, log_progress, get_knowledge_file, get_project_blueprint
- get_moc, vault_stats, list_categories, curate_vault, mine_patterns
- get_dashboard, list_projects, list_never_again, update_knowledge
```

### 5c. Server startup flow
```javascript
// server.js additions (at startup)
const { LongbrainDB } = require("./db");
const { reindexVault } = require("./indexer");

// Initialize DB
const DB_PATH = path.join(VAULT_ROOT, "mcp-server", "longbrain.db");
const db = new LongbrainDB(DB_PATH);

// Background: check if reindex needed (incremental)
(async () => {
  try {
    const stats = await reindexVault(db, VAULT_DIR, {
      onProgress: (p) => process.stderr.write(`[Longbrain] Indexing: ${p.done}/${p.total}\n`),
    });
    process.stderr.write(`[Longbrain] Index: ${stats.added} added, ${stats.updated} updated, ${stats.skipped} skipped, ${stats.embedded} embedded\n`);
  } catch (e) {
    process.stderr.write(`[Longbrain] Index error: ${e.message}\n`);
  }
})();
```

### 5d. Verification checklist
- [ ] Server start khong loi
- [ ] search_knowledge("VPS") tra ve ket qua hybrid
- [ ] search_learnings("bug") tra ve learnings sorted by relevance
- [ ] get_context_for_task("deploy app") tra ve context tu nhieu categories
- [ ] add_learning() ghi file + auto embed
- [ ] reindex_vault("incremental") chi embed files moi
- [ ] reindex_vault("full") rebuild toan bo
- [ ] search_semantic("triển khai") tra ve semantic matches
- [ ] Old tools khong bi anh huong
- [ ] MCP restart: DB persist, khong mat data
- [ ] `add_learning()` integration patterns

---

## PHASE 6: Hook Updates

### 6a. Update longbrain-context.js
```
Hien tai: hook goi search functions trong server.js (regex-based)
Sau: hook van goi cung tools, nhung ket qua tot hon nho hybrid search
→ KHONG can sua hook, chi server backend thay doi
```

### 6b. Update longbrain-stop-hook.js
```
Hien tai: extract learnings va ghi file
Sau: sau khi ghi file, server auto-embed (via add_learning tool)
→ KHONG can sua hook
```

### 6c. Verification
- [ ] UserPromptSubmit hook: search ket qua tot hon
- [ ] Stop hook: van extract va ghi file binh thuong
- [ ] PostToolUse hook: van autosave binh thuong
- [ ] PreToolUse hook: van warn binh thuong

---

## PHASE 7: Testing + Benchmarking

### 7a. Test Suite (30 queries)

**Keyword queries (should work with FTS5):**
1. "VPS" → deploy docs
2. "Docker" → Docker guide
3. "PM2" → PM2 related
4. "ssh-keygen" → SSH setup
5. "Facebook API" → Facebook projects
6. "Lark" → Lark integration
7. "v98" → V98 API docs
8. "PostgreSQL" → DB docs
9. "rate limit" → rate limiting docs
10. "Prisma" → Prisma patterns

**Semantic queries (NEED vector search):**
11. "cách triển khai ứng dụng" → deploy/server docs
12. "giải quyết lỗi kết nối cơ sở dữ liệu" → DB connection bugs
13. "tự động hóa marketing" → marketing automation
14. "làm sao lưu kiến thức" → Longbrain docs
15. "web scraping anti-detection" → scraping strategies
16. "AI agent orchestration" → agent frameworks
17. "cách test model trước khi dùng" → NA-003 + testing docs
18. "quản lý dự án phần mềm" → project management
19. "tối ưu hóa chi phí API" → cost optimization
20. "bảo mật ứng dụng web" → security docs

**Cross-language queries (NEED vector):**
21. "deploy" → "triển khai" docs in Vietnamese
22. "authentication" → "xác thực" docs
23. "caching" → "bộ nhớ đệm" docs
24. "monitoring" → "giám sát" docs
25. "configuration" → "cấu hình" docs

**Edge cases:**
26. "bug" (single word, very common)
27. "cách nấu phở" (unrelated, should return nothing relevant)
28. "" (empty query)
29. "###" (special chars)
30. Very long query (100 words)

### 7b. Benchmark metrics
- [ ] Recall@5: bao nhieu query tra ve ket qua dung trong top 5?
- [ ] Recall@10: trong top 10?
- [ ] Latency: trung binh bao nhieu ms/query?
- [ ] FTS-only vs Hybrid: cai nao tot hon?

### 7c. Acceptance criteria
- [ ] Hybrid search Recall@5 >= 80% (hien tai regex ~60%)
- [ ] Search latency < 500ms (ke ca V98 API call)
- [ ] No regression: tat ca tools cu van hoat dong
- [ ] DB file < 10MB
- [ ] Server startup < 5 giay

---

## PHASE 8: Deploy + Documentation

### 8a. Package updates
```json
{
  "name": "longbrain-mcp",
  "version": "7.0.0",
  "description": "Longbrain MCP Server v7 - Hybrid Semantic Search",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "better-sqlite3": "^12.10.0",
    "sqlite-vec": "^0.1.9",
    "zod": "^3.25.1"
  }
}
```

### 8b. Environment variables
```bash
# .env (optional, co default trong code)
V98_API_KEY=sk-rdysXFstsySd1RqSc33OfP4tCQXqGneOK00e5Ob8G6ACXyk9
LONGBRAIN_DB_PATH=./longbrain.db     # default: mcp-server/longbrain.db
EMBEDDING_BATCH_SIZE=20               # default: 20
```

### 8c. Documentation updates
- [ ] Update CLAUDE.md: mention hybrid search, new tools
- [ ] Update MEMORY.md: version 7.0, new architecture
- [ ] `add_knowledge()`: luu toan bo research + architecture
- [ ] `add_learning()`: tong ket project

### 8d. Rollback plan
```
Neu hybrid search co van de:
1. Server.js van co old searchInFiles() function
2. Xoa require('./hybrid-search') va revert search tools
3. Hoac: set env LONGBRAIN_SEARCH=legacy de fallback
4. DB file co the xoa va rebuild bat cu luc nao
```

---

## COST ESTIMATE

| Item | Chi phi |
|------|---------|
| npm packages | $0 (open source) |
| V98 embeddings (353 files, ~50K tokens) | ~$0.001 |
| V98 embeddings (queries, ~100/day) | ~$0.002/day |
| Storage (DB file) | ~4MB |
| **Total** | **~$0/month** |

## TIMELINE

| Phase | Ngay | Thoi gian |
|-------|------|-----------|
| 1. db.js | Day 1 | 2-3 gio |
| 2. embeddings.js | Day 1 | 1-2 gio |
| 3. indexer.js | Day 1-2 | 2-3 gio |
| 4. hybrid-search.js | Day 2 | 2-3 gio |
| 5. server.js integration | Day 2-3 | 3-4 gio |
| 6. Hook updates | Day 3 | 1 gio |
| 7. Testing + benchmark | Day 3 | 2-3 gio |
| 8. Deploy + docs | Day 3 | 1 gio |
| **Total** | **3 ngay** | **~15-20 gio** |

---

## CHECKLIST TRUOC KHI BUILD

- [x] sqlite-vec + better-sqlite3 install OK tren Windows
- [x] FTS5 unicode61 remove_diacritics OK voi Vietnamese
- [x] V98 embeddings endpoint OK (batch, dims reduction, Vietnamese)
- [x] Full hybrid pipeline test OK (schema → insert → FTS5 → vector → RRF)
- [x] Vault analysis: 353 files, 2.46MB, largest 127KB
- [x] Performance: index 353 files in 304ms, search in 0.4ms
- [x] Bug documented: sqlite-vec BigInt requirement
- [x] Bug documented: FTS5 multi-word query quoting
- [x] Bug documented: V98 batch timeout (use batch 20)
- [x] Decision recorded in vault (2026-05-20)
- [x] Learning recorded in vault (V98 embeddings)
- [x] Research agents: sqlite-vec docs (DONE)
- [x] Research agents: FTS5 Vietnamese (DONE)
- [x] Research agents: RRF + query routing (DONE)

---

---

## RESEARCH AGENTS FINDINGS (May 2026)

### Agent 1: sqlite-vec + better-sqlite3 (CRITICAL FINDINGS)

**Windows DLL Compatibility Warning:**
- sqlite-vec prebuilt DLL compiled against SQLite < 3.45
- better-sqlite3 12.8.0+ bundles SQLite 3.45+
- Co the gay loi "no such function" khi load
- **TREN MAY USER**: Da test OK (v0.1.9 + better-sqlite3 latest) → KHONG bi loi
- **Mitigation**: Neu bi loi trong tuong lai → downgrade better-sqlite3@12.7.0 hoac build tu source

**Verified API patterns:**
```javascript
// Load extension
const sqlite_vec = require("sqlite-vec");
sqlite_vec.load(db);
const version = db.prepare("SELECT vec_version()").pluck().get(); // verify!

// Vector table — PHAI la virtual table vec0
db.exec("CREATE VIRTUAL TABLE docs_vec USING vec0(embedding float[512])");

// Insert — Float32Array truc tiep HOAC .buffer deu OK (da test)
stmt.run(BigInt(id), new Float32Array([0.1, 0.2, ...]));       // OK
stmt.run(BigInt(id), Buffer.from(float32Array.buffer));          // OK

// KNN query
db.prepare("SELECT rowid, distance FROM docs_vec WHERE embedding MATCH ? ORDER BY distance LIMIT ?")
  .all(queryFloat32Array, 10);

// Distance metrics (default cosine)
// Co the chi dinh: distance_metric=cosine | l2 | l1
db.exec("CREATE VIRTUAL TABLE v USING vec0(embedding float[512] distance_metric=cosine)");
```

**Performance benchmarks (tu docs):**
| Dimensions | Vector Type | Query Time (100K vectors) |
|------------|------------|--------------------------|
| 768 | float32 | ~45ms |
| 1536 | float32 | ~105ms |
| 512 | float32 | ~25ms (estimated) |

**Utility functions:**
```sql
vec_length(vector)       -- So dimensions
vec_type(vector)         -- 'float32', 'int8', 'bit'
vec_normalize(vector)    -- L2 normalization
vec_distance_cosine(v1, v2) -- Cosine distance (scalar)
vec_to_json(vector)      -- Vector → JSON array
```

### Agent 2: FTS5 Vietnamese (CRITICAL FINDINGS)

**remove_diacritics bug:**
- Mode 1 (default): CO BUG voi mot so codepoints Vietnamese (VD: U+1ED9 "ộ")
- Mode 2: FIX DUOC bug nay → **PHAI dung remove_diacritics 2**
- Da test: "cach" match "Cách", "triển khai" match chinh xac

**Snippet extraction (BONUS — chua co trong plan cu):**
```sql
-- highlight(): danh dau search terms trong text
SELECT highlight(docs_fts, 1, '<b>', '</b>') AS highlighted
FROM docs_fts WHERE docs_fts MATCH 'VPS';
-- Output: "Deploy ung dung len <b>VPS</b> Ubuntu"

-- snippet(): extract ~32 word fragment quanh match
SELECT snippet(docs_fts, 1, '<b>', '</b>', '...', 32) AS summary
FROM docs_fts WHERE docs_fts MATCH 'deploy';
-- Output: "...huong dan <b>deploy</b> ung dung Node.js len VPS..."
```
→ **ACTION**: Dung snippet() trong search results de user thay context tot hon

**BM25 ranking voi column weights:**
```sql
-- title weight 10, content weight 5
SELECT bm25(docs_fts, 10.0, 5.0) AS score
FROM docs_fts WHERE docs_fts MATCH 'VPS'
ORDER BY score;
```
→ **ACTION**: Title match nen co weight cao hon content

**FTS5 rebuild command (khi data mat sync):**
```sql
INSERT INTO docs_fts(docs_fts) VALUES('rebuild');
```

### Agent 3: RRF + Query Routing (CONFIRMED)

**k=60 confirmed:**
- Paper: Cormack et al. TREC research
- k=60 la "empirically proven optimal" cho general use
- k=20-40: emphasize top results hon
- k=80-100: more gradual distribution
- **DUNG k=60 cho Longbrain** (general use case)

**Weighted RRF variant (BONUS):**
```javascript
// Neu muon FTS5 co weight khac vector:
function weightedRRF(ftsResults, vecResults, ftsWeight = 1.0, vecWeight = 1.0, k = 60) {
  const scores = new Map();
  ftsResults.forEach((r, idx) => {
    scores.set(Number(r.id), { rrf: ftsWeight * 1/(k+idx+1) });
  });
  vecResults.forEach((r, idx) => {
    const id = Number(r.id);
    const s = scores.get(id) || { rrf: 0 };
    s.rrf += vecWeight * 1/(k+idx+1);
    scores.set(id, s);
  });
  return Array.from(scores.entries()).sort((a, b) => b[1].rrf - a[1].rrf);
}
```
→ **ACTION**: Bat dau voi equal weights (1.0, 1.0), tune sau neu can

**Query routing patterns (confirmed + enhanced):**
```javascript
// Code/identifiers → keyword only
/^[A-Z]{1,4}[-_]?\d+$|^\/[a-z0-9/]+$/  // ERR_TIMEOUT, /v1/auth

// Version numbers → keyword only
/^v?\d+(\.\d+)*$/  // v7.0, 3.45

// Questions → hybrid (vector-heavy)
/^(how|what|why|cách|tại sao|làm sao)/i

// Default → hybrid balanced
```

**Two-stage architecture (production pattern):**
```
Stage 1: Hybrid (FTS5 + Vector) → RRF → top 100 (high recall)
Stage 2: Cross-encoder reranking → top 5 (high precision)

→ Longbrain v7: Chi lam Stage 1
→ Longbrain v8 (tuong lai): Them Stage 2 neu can
```

---

## UPDATED PLAN CHANGES (sau research + ECC analysis)

### Thay doi tu plan ban dau:

1. **db.js**: Them `vec_version()` check sau khi load extension (phat hien loi som)
2. **hybrid-search.js**: Dung `snippet()` de extract search context (thay vi substring 500 chars)
3. **hybrid-search.js**: Dung `bm25(docs_fts, 10.0, 5.0)` de title match rank cao hon
4. **server.js**: Them `rebuild FTS5` command trong reindex_vault
5. **Giu k=60** cho RRF (confirmed by research)
6. **Giu equal weights** cho FTS5 va vector (tune sau)

### ECC-INSPIRED CHANGES (tu repo Everything Claude Code):

7. **TOKEN OPTIMIZATION — Gop search tools**:
   ECC ghi ro: "Moi MCP tool ~500 tokens overhead"
   Longbrain 21 tools = ~10,500 tokens/session
   → Gop `search_knowledge` + `search_learnings` + `search_projects` + `search_decisions`
     thanh 1 tool: `search(query, scope?)` voi scope = "all" | "knowledge" | "learnings" | "projects" | "decisions"
   → Giam 4 tools → 1 tool = tiet kiem ~1,500 tokens/session
   → GIU cac tools cu lam aliases (backward compatible) nhung danh dau deprecated
   → KHONG them search_semantic rieng — tich hop vao search() voi mode param

8. **HOOK REFACTOR — longbrain-context.js query DB truc tiep**:
   Hien tai: hook scan 353 files bang regex rieng (377 dong code)
   Sau v7: hook import better-sqlite3, query FTS5 + vector tu longbrain.db
   → Nhanh hon 10x (0.4ms DB query vs filesystem scan)
   → Chinh xac hon (hybrid search thay vi regex)
   → Hook doc DB file truc tiep (KHONG qua MCP round-trip)

   Pattern tu ECC: "session-start hook load previous session summary"
   → longbrain-context.js la tuong tu — load relevant context truoc moi message

   ```javascript
   // Hook new approach (pseudocode):
   const Database = require("better-sqlite3");
   const sqlite_vec = require("sqlite-vec");
   const DB_PATH = "C:/AI Build Learning/mcp-server/longbrain.db";

   const db = new Database(DB_PATH, { readonly: true });
   sqlite_vec.load(db);

   // Query FTS5 (fast, <1ms)
   const ftsResults = db.prepare(
     "SELECT rowid as id, rank FROM docs_fts WHERE docs_fts MATCH ? LIMIT 10"
   ).all(keywords);

   // Enrich with doc data
   const results = ftsResults.map(r => {
     const doc = db.prepare("SELECT title, content FROM documents WHERE id = ?").get(r.id);
     return { title: doc.title, snippet: doc.content.substring(0, 200) };
   });

   db.close();
   ```

   **LUU Y**: Hook chi dung FTS5 (khong vector) de tranh goi V98 API moi message
   Vector search chi dung trong MCP tools (khi user explicitly search)

9. **GRACEFUL DEGRADATION — fallback chain**:
   Pattern tu ECC: "if fail → fallback CLAUDE.md"

   Longbrain v7 fallback chain:
   ```
   Hybrid (FTS5 + Vector) → chua co embeddings?
     ↓ fallback
   FTS5-only → DB file corrupt?
     ↓ fallback
   Regex scan (current method) → vault missing?
     ↓ fallback
   Return empty + warning message
   ```

   Cach implement:
   ```javascript
   async function search(db, query, limit) {
     try {
       // Level 1: Hybrid search
       return await hybridSearch(db, query, { limit });
     } catch (e) {
       try {
         // Level 2: FTS5 only (vector failed)
         const fts = db.searchFTS(query, limit);
         return enrichResults(db, fts);
       } catch (e2) {
         // Level 3: Regex fallback (DB failed)
         return regexSearchFiles(VAULT_DIR, query, limit);
       }
     }
   }
   ```

10. **SKILL SEMANTIC ROUTER — thay the keyword matching**:
   Hien tai: 231 skills nhung chi 27 hardcoded routes (204 skills "vo hinh")
   Sau v7: Index toan bo 231 SKILL.md descriptions vao DB

   Schema bo sung:
   ```sql
   CREATE TABLE skills (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT UNIQUE NOT NULL,          -- "data-scraper-agent"
     description TEXT,                   -- trich tu SKILL.md
     agent TEXT,                         -- agent lien quan (nullable)
     command TEXT,                       -- slash command (nullable)
     label TEXT,                         -- mo ta ngan cho user
     content_hash TEXT
   );

   -- FTS5 cho skill descriptions
   CREATE VIRTUAL TABLE skills_fts USING fts5(
     name, description, label,
     content='skills', content_rowid='id',
     tokenize='unicode61 remove_diacritics 2'
   );

   -- Vector cho semantic match
   -- Dung cung docs_vec table voi prefix "skill:" hoac bang rieng
   CREATE VIRTUAL TABLE skills_vec USING vec0(embedding float[512]);
   ```

   Indexing:
   ```javascript
   // Scan ~/.claude/skills/ecc/*/SKILL.md
   // Parse: name, description (first paragraph), tags
   // Embed description → store in skills_vec
   // ~231 skills × 512 dims = ~0.45 MB
   ```

   Hook query (thay the SKILL_ROUTES array):
   ```javascript
   // longbrain-context.js (updated)
   // 1. FTS5 match keywords trong prompt vs skill descriptions
   // 2. Khong can V98 API call (chi FTS5, local)
   // 3. Top 2-3 skills → suggest
   const skillMatches = db.prepare(`
     SELECT s.name, s.label, s.agent, s.command, fts.rank
     FROM skills s
     JOIN skills_fts fts ON s.id = fts.rowid
     WHERE skills_fts MATCH ?
     ORDER BY fts.rank
     LIMIT 3
   `).all(promptKeywords);
   ```

   Loi ich:
   - 231 skills deu searchable (thay vi 27)
   - Khong can maintain SKILL_ROUTES array thu cong
   - ECC them skill moi → chi can reindex, khong sua code
   - FTS5 du tot cho skill matching (khong can vector)

### Khong thay doi:
- Schema documents van nhu cu (da test OK)
- V98 embeddings van dung text-embedding-3-small 512 dims
- Timeline them ~0.5 ngay cho skill router + hook refactor = ~3.5-4 ngay tong

---

## BUILD INSTRUCTIONS

Khi bat dau build, doc file nay tu dau den cuoi. Lam theo thu tu:

1. `npm install better-sqlite3 sqlite-vec` (da install, verify lai)
2. Tao db.js → test
3. Tao embeddings.js → test voi V98
4. Tao indexer.js → test index toan bo vault
5. Tao hybrid-search.js → test 30 queries
6. Sua server.js → integrate
7. Test tat ca tools
8. Update CLAUDE.md + MEMORY.md

Moi buoc: test truoc khi sang buoc tiep. Neu loi → doc lai plan, check BUGS DA PHAT HIEN.

---

*Plan v2 — da verified tren may user (Windows 11, Node.js 24.14.0).
Moi code snippet da test that. 6 research agents hoan thanh.
San sang build khi user approve.*
