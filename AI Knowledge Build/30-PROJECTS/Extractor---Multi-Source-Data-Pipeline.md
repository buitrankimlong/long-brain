---
tags: [project, extractor---multi-source-data-pipeline]
status: hoan-thanh
started: 2026-04-05
client: Data Extraction Project
stack: [Python, AsyncIO, DeepSeek API, aiohttp, CSV, Tenacity, Checkpoint, aiofiles]
updated: 2026-05-09
---

# Extractor - Multi-Source Data Pipeline

## Mo ta
Phiên bản nâng cấp của TrangVang Pipeline với MAX_TOKENS=4096, TEMPERATURE=0.7, CONCURRENCY=3 tối ưu cho i5 10400. Tương tự cấu trúc nhưng config khác để sinh dữ liệu đa dạng hơn. Hỗ trợ checkpoint, CSV buffer, error logging, stats realtime.

## Stack
- Python
- AsyncIO
- DeepSeek API
- aiohttp
- CSV
- Tenacity
- Checkpoint
- aiofiles

## Quyet dinh quan trong
- Tăng MAX_TOKENS từ 2000→4096 để trích xuất chi tiết hơn - Tăng TEMPERATURE từ 0.3→0.7 để output đa dạng, ít hallucinate - Giảm CONCURRENCY từ 15-20→3 phù hợp i5 10400 - Tăng BATCH_SIZE từ 50→500 để ít flush hơn - Tăng CHECKPOINT_EVERY từ 100→200 để balance safety vs I/O

## Bai hoc rut ra
Temperature parameter ảnh hưởng sâu đến output quality - thấp quá thì generic, cao quá thì inconsistent. Concurrency cần match CPU cores. MAX_TOKENS cao tỉ lệ thuận với latency + cost. Buffer size optimization: quá nhỏ = I/O tồn, quá lớn = memory spike.

## Ket qua
Config tối ưu cho i5 10400. Tương tự TrangVang nhưng tuned hơn. Đầu ra: 7 CSV files. Hỗ trợ graceful shutdown + signal handling.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
