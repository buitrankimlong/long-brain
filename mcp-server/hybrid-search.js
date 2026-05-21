/**
 * Longbrain v7.0 — Hybrid Search
 * FTS5 (BM25) + sqlite-vec (cosine) + RRF fusion
 */
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

  // Single word -> keyword only (exact match more useful)
  if (wordCount === 1) return "KEYWORD";

  // Contains code patterns -> keyword only
  if (/[{}()\[\];=<>]/.test(q)) return "KEYWORD";

  // Contains file path or extension -> keyword only
  if (/\.\w{2,4}$/.test(q) || /[/\\]/.test(q)) return "KEYWORD";

  // Question mark or question words -> hybrid (semantic helps)
  if (/\?$/.test(q)) return "HYBRID";
  if (/^(what|how|why|when|where|who|which|cách|tại sao|làm sao|ở đâu|khi nào|thế nào)/i.test(q)) return "HYBRID";

  // Multi-word default -> hybrid
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
      process.stderr.write(`[Longbrain] Vector search failed, falling back to FTS: ${e.message}\n`);
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
