---
tags: [learning, longbrain, hybrid-search, sqlite-vec, fts5, embeddings, v98, mcp]
date: 2026-05-21
project: "[[AI-Build-Learning]]"
---

# Longbrain v7 Build - Hybrid Search FTS5 + sqlite-vec + RRF

## Boi canh
Nâng cấp Longbrain MCP Server từ v6 (regex keyword search, ~70% accuracy) lên v7 (hybrid BM25 + vector semantic search, 88%+ accuracy). Vault có 408 MD files, 2.46 MB content. Stack: Node.js CommonJS, better-sqlite3, sqlite-vec, V98 API embeddings.

## Giai phap
Build 4 files mới + integrate vào server.js:

1. **db.js**: LongbrainDB class — SQLite schema (documents + docs_fts FTS5 + docs_vec vec0), CRUD, triggers auto-sync FTS5
2. **embeddings.js**: V98 API wrapper — batch embed, retry, backoff, text truncation
3. **indexer.js**: Vault scanner — SHA-256 change detection, incremental/full reindex, parseFrontmatter
4. **hybrid-search.js**: FTS5 + vector + RRF fusion (k=60), query classification (KEYWORD vs HYBRID)
5. **server.js**: Import modules, init DB at startup, background reindex, upgrade 5 search tools + 6 write tools + 2 new tools

Key fixes during build:
- V98 batch size: 5 (not 20) — API payload limit causes "Something wrong" error with large batches
- Text truncation: 2000 words max (not 6000) — prevents timeout on large files
- Timeout: 60s (not 30s)
- Delay between batches: 200ms
- BigInt MUST be used for sqlite-vec rowid
- FTS5 tokenize: 'unicode61 remove_diacritics 2' for Vietnamese

## Duc ket
1. V98 API batch size MAX 5 texts, mỗi text MAX 2000 words — lớn hơn sẽ timeout/error
2. sqlite-vec rowid PHẢI là BigInt — Number sẽ lỗi
3. FTS5 remove_diacritics=2 cho tiếng Việt
4. Luôn có fallback về regex search khi DB chưa ready
5. indexSingleFile() gọi async .catch() — không block write tools
6. Initial index 408 files mất ~5 phút, 508K tokens. Incremental = instant, 0 tokens
7. Query routing: 1 word → KEYWORD only, multi-word → HYBRID (FTS+vec)

## Source Code

embeddings.js (key config):
```javascript
const V98_API_KEY = process.env.V98_API_KEY || "sk-...";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMS = 512;
const MAX_BATCH_SIZE = 5; // V98 API payload limit
// Text truncation: 2000 words max
// Timeout: 60s, retry: 3x with exponential backoff
```

db.js (schema):
```sql
CREATE TABLE documents (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT UNIQUE, title TEXT, category TEXT, content TEXT, content_hash TEXT, updated_at TEXT);
CREATE VIRTUAL TABLE docs_fts USING fts5(title, content, content='documents', content_rowid='id', tokenize='unicode61 remove_diacritics 2');
CREATE VIRTUAL TABLE docs_vec USING vec0(embedding float[512]);
-- Triggers: docs_ai (INSERT), docs_ad (DELETE), docs_au (UPDATE) auto-sync FTS5
-- IMPORTANT: BigInt for sqlite-vec rowid
db.upsertVector(docId, embedding) → this.db.prepare("...").run(BigInt(docId), embedding);
```

hybrid-search.js (RRF fusion):
```javascript
function rrfFusion(ftsResults, vecResults, k = 60) {
  const scores = new Map();
  ftsResults.forEach((r, idx) => { scores.set(Number(r.id), { rrf: 1/(k+idx+1), ... }); });
  vecResults.forEach((r, idx) => { existing.rrf += 1/(k+idx+1); ... });
  return Array.from(scores.entries()).sort((a,b) => b[1].rrf - a[1].rrf);
}
```

server.js (startup):
```javascript
const { LongbrainDB } = require("./db");
const { reindexVault, indexSingleFile } = require("./indexer");
const { hybridSearch, quickSearch } = require("./hybrid-search");
// Init DB → background reindex → all search tools use hybridSearch with fallback
// All write tools call indexSingleFile() after fs.writeFileSync()
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Build-Learning]]
