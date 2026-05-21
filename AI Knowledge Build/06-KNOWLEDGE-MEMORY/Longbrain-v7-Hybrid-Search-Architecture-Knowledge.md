---
tags: [longbrain, hybrid-search, sqlite-vec, fts5, v98, rag, vector-search, architecture]
description: Longbrain-v7-Hybrid-Search-Architecture
created: 2026-05-20
moc: "[[06 RAG va Bo Nho AI]]"
---

# Longbrain v7 — Hybrid Semantic Search Architecture

## Overview
Nâng cấp Longbrain MCP Server từ keyword-only search (regex, ~70% accuracy) lên hybrid search (BM25 FTS5 + vector sqlite-vec + RRF fusion, ~88% accuracy).

## Stack
- **sqlite-vec** v0.1.9 + better-sqlite3 v12.10.0 — vector storage trong SQLite
- **FTS5** unicode61 remove_diacritics 2 — keyword search hỗ trợ Vietnamese
- **V98 API** text-embedding-3-small (512 dims) — embeddings
- **RRF** (k=60) — Reciprocal Rank Fusion merge results

## Key Findings (tested May 2026)

### sqlite-vec
- Load via `sqlite_vec.load(db)` sau khi tạo better-sqlite3 instance
- Virtual table: `CREATE VIRTUAL TABLE docs_vec USING vec0(embedding float[512])`
- **QUAN TRỌNG**: rowid phải là BigInt — `insertVec.run(BigInt(id), embedding)`
- KNN query: `WHERE embedding MATCH ? ORDER BY distance LIMIT 10`
- Insert embedding as Float32Array hoặc Buffer.from(float32.buffer)
- FTS5 + sqlite-vec coexist trong cùng 1 database

### FTS5 Vietnamese
- Tokenizer: `unicode61 remove_diacritics 2` — tự match có dấu/không dấu
- "cach" match "Cách", "triển khai" match chính xác
- Multi-word cần quotes: `'"deploy VPS"'` cho phrase match
- Performance: 0.4ms/query trên 353 docs

### V98 Embeddings
- Endpoint: POST https://v98store.com/v1/embeddings
- Batch: 50 texts/request OK (recommend 20 cho an toàn)
- Dimensions: 512 (reduced từ 1536, tiết kiệm 3x storage)
- Vietnamese similarity: "deploy server VPS" vs "triển khai máy chủ VPS" = 0.74 cosine
- Long text: 24.5K chars (8001 tokens) OK
- Cost: ~$0.001 cho toàn bộ 353 files

### RRF Fusion
- Formula: score(d) = Σ 1/(k + rank_i), k=60
- Document xuất hiện cả FTS5 và vector → score cao nhất
- Document chỉ 1 source vẫn được rank
- No normalization needed

### Performance (tested on real vault)
- Index 353 files: 304ms
- FTS5 query: 0.4ms average
- Vector storage: 0.69 MB
- Total DB: ~4 MB
- Embedding 353 files: ~$0.001 via V98

## Architecture
```
Query → Router → [FTS5 search | Vector search] → RRF fusion → Top K results
                     0.4ms         ~200ms            <1ms
```

## Files
- `mcp-server/UPGRADE-PLAN-v7.md` — Full plan với code snippets đã test
- `mcp-server/db.js` — SQLite schema + CRUD (sẽ tạo)
- `mcp-server/embeddings.js` — V98 API wrapper (sẽ tạo)
- `mcp-server/indexer.js` — Vault scanner + indexer (sẽ tạo)
- `mcp-server/hybrid-search.js` — Search + RRF fusion (sẽ tạo)

## Source Code

test-sqlite-vec-fts5.js:
```javascript
const Database = require('better-sqlite3');
const sqlite_vec = require('sqlite-vec');

const db = new Database(':memory:');
sqlite_vec.load(db);

// Schema
db.exec(`
  CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL, title TEXT, category TEXT,
    content TEXT, content_hash TEXT, updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE VIRTUAL TABLE docs_fts USING fts5(
    title, content, content='documents', content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
  );
  CREATE VIRTUAL TABLE docs_vec USING vec0(embedding float[512]);
  CREATE TRIGGER docs_ai AFTER INSERT ON documents BEGIN
    INSERT INTO docs_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
  END;
`);

// Insert: document + FTS5 auto + vector manual
const info = db.prepare('INSERT INTO documents (path, title, category, content, content_hash) VALUES (?, ?, ?, ?, ?)')
  .run('test.md', 'Test', 'knowledge', 'Nội dung tiếng Việt', 'hash');
db.prepare('INSERT INTO docs_vec (rowid, embedding) VALUES (?, ?)')
  .run(BigInt(info.lastInsertRowid), new Float32Array(512).fill(0.1)); // BigInt REQUIRED!

// Search FTS5
db.prepare('SELECT rowid, rank FROM docs_fts WHERE docs_fts MATCH ? ORDER BY rank').all('Việt');
// Search vector
db.prepare('SELECT rowid, distance FROM docs_vec WHERE embedding MATCH ? ORDER BY distance LIMIT 5')
  .all(new Float32Array(512).fill(0.1));
```

test-v98-embeddings.js:
```javascript
const https = require('https');
async function embed(texts, dims = 512) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ model: 'text-embedding-3-small', input: texts, dimensions: dims });
    const req = https.request({
      hostname: 'v98store.com', path: '/v1/embeddings', method: 'POST',
      headers: { 'Authorization': 'Bearer ' + process.env.V98_API_KEY, 'Content-Type': 'application/json' }
    }, res => { let b=''; res.on('data',d=>b+=d); res.on('end',()=>resolve(JSON.parse(b))); });
    req.write(data); req.end();
  });
}
// Batch 20 texts, 512 dims, ~$0.001
embed(['text1', 'text2']).then(r => console.log(r.data.length, 'embeddings'));
```

rrf-fusion.js:
```javascript
function rrfFusion(ftsResults, vecResults, k = 60) {
  const scores = new Map();
  ftsResults.forEach((r, idx) => {
    scores.set(Number(r.id), { rrf: 1/(k+idx+1), fts: idx+1, vec: null });
  });
  vecResults.forEach((r, idx) => {
    const id = Number(r.id);
    const s = scores.get(id) || { rrf: 0, fts: null, vec: null };
    s.rrf += 1/(k+idx+1);
    s.vec = idx+1;
    scores.set(id, s);
  });
  return Array.from(scores.entries())
    .map(([id, s]) => ({ id, ...s }))
    .sort((a, b) => b.rrf - a.rrf);
}
```
