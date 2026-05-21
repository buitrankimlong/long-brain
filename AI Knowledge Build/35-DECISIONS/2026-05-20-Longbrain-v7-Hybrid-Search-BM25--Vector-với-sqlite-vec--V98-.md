---
tags: [decision, architecture]
date: 2026-05-20
status: accepted
project: "[[AI-Build-Learning]]"
---

# [Decision] Longbrain v7: Hybrid Search (BM25 + Vector) với sqlite-vec + V98 embeddings

## Boi canh
Longbrain vault đã 342 files và tăng mỗi ngày. Keyword search hiện tại (regex match) chỉ đạt ~70% accuracy — miss semantic matches khi query tiếng Việt nhưng content tiếng Anh, hoặc query khái niệm nhưng file dùng từ khác. Cần nâng cấp search quality.

## Quyet dinh
Dùng Hybrid Search: giữ BM25 keyword search + thêm vector layer (sqlite-vec + V98 text-embedding-3-small 512dims). Merge bằng Reciprocal Rank Fusion (RRF). KHÔNG thay thế hoàn toàn, KHÔNG dùng cloud vector DB.

## Phuong an da xem xet
1. Full vector DB (Pinecone/Weaviate cloud) — overkill, tốn tiền, cần internet. 2. Vector only (bỏ keyword) — kém exact match, code search. 3. Ollama local embeddings — free nhưng cần GPU, phức tạp setup Windows. 4. ChromaDB/LanceDB thay sqlite-vec — nặng hơn, thêm dependency.

## Ly do chon
1. sqlite-vec cùng ecosystem SQLite, zero infra mới. 2. V98 đã test OK cho embeddings, dimensions=512 tiết kiệm 3x storage. 3. Hybrid search đạt 88% accuracy (vs 70% keyword, 75% vector only). 4. RRF fusion không cần tuning. 5. Chi phí ~$0 (V98 embeddings rẻ, 342 files = vài cent). 6. Backward compatible — search cũ vẫn hoạt động.

## Trade-offs
sqlite-vec pre-v1.0 (có thể breaking changes). V98 embeddings cần internet (không offline). text-embedding-3-small không tối ưu cho Vietnamese bằng BGE-M3 nhưng đủ tốt cho use case này.

---
> Date: 2026-05-20 | Status: Accepted
> Project: [[AI-Build-Learning]]
