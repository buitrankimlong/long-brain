---
tags: [learning, longbrain, v7, hybrid-search, sqlite-vec, fts5, rrf, plan]
date: 2026-05-21
project: "[[AI-Build-Learning]]"
---

# Longbrain v7 Plan hoàn thành — 6 research agents + hands-on testing

## Boi canh
Cần nâng cấp Longbrain từ keyword search lên hybrid semantic search. Đã chạy 6 research agents song song + test thật trên máy. Plan chi tiết 500+ dòng với code đã verify.

## Giai phap
1) sqlite-vec v0.1.9 + better-sqlite3: PHẢI dùng BigInt cho rowid, Float32Array cho embedding. FTS5 + vec0 cùng DB OK. 2) FTS5 unicode61 remove_diacritics=2: mode 1 có bug với Vietnamese codepoints. snippet() cho search context. bm25() với column weights. 3) V98 embeddings: /v1/embeddings OK, batch 20-50, 512 dims, Vietnamese similarity 0.74 cosine. 4) RRF k=60 confirmed optimal. Query routing: single word → keyword, question → hybrid. 5) Performance: index 353 files 304ms, FTS5 0.4ms/query.

## Duc ket
Plan đầy đủ tại mcp-server/UPGRADE-PLAN-v7.md. Session sau chỉ cần đọc file đó và build theo thứ tự. Critical bugs: BigInt cho sqlite-vec, remove_diacritics=2 cho FTS5, batch 20 cho V98.

## Source Code

PLAN FILE: mcp-server/UPGRADE-PLAN-v7.md (500+ dong, code da test)

Critical test results:
```bash
# sqlite-vec test
sqlite_vec.load(db) → v0.1.9 ✅
insertVec.run(BigInt(id), new Float32Array(512)) ✅  # PHAI BigInt!

# FTS5 Vietnamese test
tokenize='unicode61 remove_diacritics 2'
"cach" match "Cách" ✅
"triển khai" match ✅

# V98 embeddings test
POST https://v98store.com/v1/embeddings
model: text-embedding-3-small, dimensions: 512
Batch 50 OK, Long text 24.5K chars OK
"deploy server VPS" vs "triển khai máy chủ VPS" = 0.74 cosine ✅

# Performance test (real vault)
Index 353 files: 304ms
FTS5 query: 0.4ms average
Vector storage: 0.69 MB
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Build-Learning]]
