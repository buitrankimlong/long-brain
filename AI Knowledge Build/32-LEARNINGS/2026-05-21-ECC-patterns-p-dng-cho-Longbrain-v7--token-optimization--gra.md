---
tags: [learning, ecc, longbrain, token-optimization, mcp, hooks, graceful-degradation]
date: 2026-05-21
project: "[[AI-Build-Learning]]"
---

# ECC patterns áp dụng cho Longbrain v7 — token optimization + graceful degradation

## Boi canh
Review repo ECC (affaan-m/ECC, 182K+ stars) để tìm patterns áp dụng cho Longbrain v7 hybrid search upgrade. ECC là code quality layer, Longbrain là knowledge memory layer — bổ sung nhau.

## Giai phap
3 patterns từ ECC áp dụng: 1) Gộp 4 search tools → 1 unified search(query, scope) — tiết kiệm ~1500 tokens/session. 2) Hook longbrain-context.js query DB trực tiếp thay vì scan filesystem — nhanh 10x, chỉ dùng FTS5 (không vector) để tránh gọi V98 API mỗi message. 3) Graceful degradation chain: Hybrid → FTS5-only → regex fallback → empty.

## Duc ket
MỖI MCP tool tốn ~500 tokens overhead. Giữ số tools thấp nhất có thể. Gộp tools cùng chức năng. Hook nên query DB trực tiếp (readonly) thay vì qua MCP round-trip. Luôn có fallback chain.

## Source Code

ECC token cost insight:
```
Mỗi MCP tool ~500 tokens overhead
21 tools = ~10,500 tokens/session
→ Gộp 4 search tools → 1: tiết kiệm ~1,500 tokens

// Unified search tool
search(query, scope?) {
  // scope: "all" | "knowledge" | "learnings" | "projects" | "decisions"
  // internally calls hybridSearch with category filter
}
```

Hook query DB pattern:
```javascript
// longbrain-context.js — query DB trực tiếp (readonly, no MCP)
const db = new Database(DB_PATH, { readonly: true });
sqlite_vec.load(db);
const results = db.prepare(
  "SELECT rowid as id, rank FROM docs_fts WHERE docs_fts MATCH ? LIMIT 10"
).all(keywords);
db.close();
// CHỈ FTS5, không vector (tránh V98 API call mỗi message)
```

Graceful degradation:
```javascript
async function search(db, query, limit) {
  try {
    return await hybridSearch(db, query, { limit }); // Level 1: Hybrid
  } catch (e) {
    try {
      return enrichResults(db, db.searchFTS(query, limit)); // Level 2: FTS5
    } catch (e2) {
      return regexSearchFiles(VAULT_DIR, query, limit); // Level 3: Regex
    }
  }
}
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Build-Learning]]
