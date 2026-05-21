/**
 * Longbrain v7.0 — Vault Indexer
 * Scans vault, detects changes via SHA-256, indexes into SQLite + embeddings
 */
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
  const toEmbed = []; // { id, text, title }

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
    if (text.length > 10) {
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
    const deleteVec = db.db.prepare("DELETE FROM docs_vec WHERE rowid = ?");
    const addVec = db.db.prepare("INSERT INTO docs_vec (rowid, embedding) VALUES (?, ?)");

    db.db.transaction(() => {
      for (let i = 0; i < toEmbed.length; i++) {
        deleteVec.run(BigInt(toEmbed[i].id));
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
    const { embeddings } = await embedTexts([text]);
    db.upsertVector(result.id, embeddings[0]);
  }

  return result;
}

module.exports = { reindexVault, indexSingleFile, scanVault, parseFrontmatter };
