---
tags: [project, data-doanh-nghip---trangvang-pipeline]
status: hoan-thanh
started: 2026-04-01
client: ThongTinCty
stack: [Python, AsyncIO, DeepSeek API, aiohttp, CSV, Tenacity, Checkpoint/Resume, aiofiles]
updated: 2026-05-09
---

# Data Doanh Nghiệp - TrangVang Pipeline

## Mo ta
Pipeline xử lý 130,000 file txt từ trangvangvietnam.com dùng DeepSeek API để trích xuất và sinh dữ liệu. Xuất ra 7 file CSV: users, company_profiles, products_services, certificates, contacts, customers, cooperations. Hỗ trợ resume nếu bị interrupt với checkpoint system. Tối ưu cho concurrency cao (15-20 request song song) với connection pooling tốt.

## Stack
- Python
- AsyncIO
- DeepSeek API
- aiohttp
- CSV
- Tenacity
- Checkpoint/Resume
- aiofiles

## Quyet dinh quan trong
- Chọn DeepSeek API thay vì OpenAI (chi phí thấp hơn ~$49 USD cho 130k files) - Async/await pattern để handle 130k files song song - Connection pooling tối ưu: limit=20, limit_per_host=8, ttl_dns=300s - Buffer CSV với batch size 100 để giảm I/O - Checkpoint định kỳ mỗi 500 file để safety - Hỗ trợ encoding multi: utf-8, utf-8-sig, cp1258, latin-1

## Bai hoc rut ra
Quản lý 130k file cần async + connection pool tốt. Retry strategy với tenacity + exponential backoff. Checkpoint system đơn giản nhưng hiệu quả để resume. CSV writer cần buffer thay vì write từng row. Error logging riêng file để không làm tắc log chính. Resource cleanup (flush, close) bắt buộc phải dùng context manager.

## Ket qua
Code hoàn thành, ước tính 3-4h với 130k files. Chi phí ~$49. Hỗ trợ test mode, estimate cost, stats, retry. Output: 7 CSV files đầy đủ. CLI interface gọn (run.py estimate/test/start/stats/retry-failed). Graceful shutdown khi Ctrl+C.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
