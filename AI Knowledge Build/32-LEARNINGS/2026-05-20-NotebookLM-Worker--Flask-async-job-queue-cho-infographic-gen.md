---
tags: [learning, flask, async, job-queue, infographic, python, home-pc]
date: 2026-05-20
project: "[[NotebookLM-Worker]]"
---

# NotebookLM Worker — Flask async job queue cho infographic generation

## Boi canh
Tìm thấy tại E:\NotebookLM_Worker. Flask server nhận request /generate → tạo job → chạy background thread → client poll /result/{job_id}. Auth bằng X-API-Key header. Tạo infographic từ data + prompt.

## Giai phap
Pattern: Flask + threading.Thread(daemon=True) + in-memory job store (dict). POST /generate → uuid job_id → background thread → GET /result/{job_id} poll. Base64 encode image response. Simple nhưng hiệu quả cho single-server workload.

## Duc ket
Async job queue đơn giản: Flask + threading + in-memory dict. Phù hợp cho workload nhỏ trên PC/single server. Client poll job status.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[NotebookLM-Worker]]
