/**
 * Longbrain v7.0 — V98 Embeddings API Wrapper
 * text-embedding-3-small, 512 dims, batch 20
 */
"use strict";
const https = require("https");

const V98_API_KEY = process.env.V98_API_KEY;
if (!V98_API_KEY) {
  console.error("[Longbrain] WARNING: V98_API_KEY not set. Semantic search disabled.");
}
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMS = 512;
const MAX_BATCH_SIZE = 5; // Small batches — V98 API has payload limits
const MAX_RETRIES = 3;

function callV98Embeddings(texts) {
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
      timeout: 60000, // 60s timeout for large batches
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
      throw new Error(`Batch ${bi + 1}/${batches.length} failed after ${retries} retries: ${lastError.message}`);
    }

    // Rate limit delay between batches (200ms)
    if (bi < batches.length - 1) {
      await new Promise(r => setTimeout(r, 200));
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

  // Truncate to ~2000 words (~3000 tokens) — safe for batch embedding
  const words = text.split(/\s+/);
  if (words.length > 2000) {
    text = words.slice(0, 2000).join(" ");
  }

  return text.trim();
}

module.exports = { embedTexts, embedSingle, prepareTextForEmbedding, EMBEDDING_DIMS };
