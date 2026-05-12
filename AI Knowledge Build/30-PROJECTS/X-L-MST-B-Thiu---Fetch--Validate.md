---
tags: [project, x-l-mst-b-thiu---fetch--validate]
status: hoan-thanh
started: 2026-04-15
client: MST Completion
stack: [Python, AsyncIO, aiohttp, lxml, stdnum.vn, JSON Cache, Regex, Unicode Normalization]
updated: 2026-05-09
---

# Xử Lý MST Bị Thiếu - Fetch + Validate

## Mo ta
Async Python script để fetch mã số thuế (MST) bị thiếu từ danh sách công ty HCM. Dùng lxml, aiohttp, stdnum.vn.mst để validate MST. Hỗ trợ name matching (similarity 60%), cache JSON, mismatch tracking. Handle 30 concurrent requests, retry 2x. Output: users_updated.json, mst_cache.json, mst_mismatches.json, fetch_mst.log.

## Stack
- Python
- AsyncIO
- aiohttp
- lxml
- stdnum.vn
- JSON Cache
- Regex
- Unicode Normalization

## Quyet dinh quan trong
- Async + aiohttp cho 30 concurrent requests - Name matching threshold = 0.6 (60% similarity) - Normalize name: remove accents, lowercase, strip - Regex pre-compile cho RE_MST_LABEL, RE_TAXID_JSON, RE_NAME_JSON - Cache JSON để avoid duplicate requests - Mismatch tracking: name khớp nhưng MST khác → log lại - Retry count = 2 với exponential backoff

## Bai hoc rut ra
Unicode normalization (remove accents) bắt buộc để match tên Việt. Name similarity threshold 0.6 balance precision/recall. Regex pre-compile giúp tốc độ. aiohttp session pooling + TCPConnector limit. Cache save mỗi 200 requests để safe. Mismatch detect: name match nhưng MST khác = potential data error. Logging JSON format dễ parse.

## Ket qua
Fetch MST hoàn thành. Validate 1000s công ty → users_updated.json. Name matching + MST validation. Cache hit rate ~60%. Mismatch report chi tiết. Log file debug info. Ready production.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
