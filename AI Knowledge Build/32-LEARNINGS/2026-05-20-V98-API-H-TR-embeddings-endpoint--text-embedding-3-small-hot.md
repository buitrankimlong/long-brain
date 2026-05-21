---
tags: [learning, v98-api, embeddings, vector-search, longbrain]
date: 2026-05-20
project: "[[AI-Build-Learning]]"
---

# V98 API HỖ TRỢ embeddings endpoint — text-embedding-3-small hoạt động

## Boi canh
Cần biết V98 có hỗ trợ /v1/embeddings không để build vector search cho Longbrain. Trước đây chỉ biết v98 hỗ trợ chat/completions, messages, images/generations. Chưa test embeddings bao giờ.

## Giai phap
Test curl tới v98store.com/v1/embeddings với model text-embedding-3-small. Kết quả: HTTP 200, trả về embeddings đúng format OpenAI. Hỗ trợ: batch (nhiều input cùng lúc), dimension reduction (1536→512 via dimensions param), tiếng Việt OK.

## Duc ket
V98 API hỗ trợ /v1/embeddings. Dùng text-embedding-3-small với dimensions=512 để tiết kiệm storage. Batch support OK. KHÔNG cần Ollama local hay OpenAI key riêng.

## Source Code

test-v98-embeddings.sh:
```bash
# Single embedding
curl -s "https://v98store.com/v1/embeddings" \
  -H "Authorization: Bearer $V98_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "text-embedding-3-small", "input": "test embedding tiếng Việt"}'

# Batch + dimension reduction (512 thay vì 1536)
curl -s "https://v98store.com/v1/embeddings" \
  -H "Authorization: Bearer $V98_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "text-embedding-3-small", "input": ["text1", "text2"], "dimensions": 512}'
# Result: Model=text-embedding-3-small, Items=2, Dims=512, Usage={prompt_tokens: X}
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Build-Learning]]
