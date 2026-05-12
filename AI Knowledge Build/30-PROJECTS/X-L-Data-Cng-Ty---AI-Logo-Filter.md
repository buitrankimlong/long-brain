---
tags: [project, x-l-data-cng-ty---ai-logo-filter]
status: hoan-thanh
started: 2026-04-20
client: Logo QA
stack: [Node.js, Sharp, File System, Image Analysis, Async/Concurrency]
updated: 2026-05-09
---

# Xử Lý Data Công Ty - AI Logo Filter

## Mo ta
Node.js script dùng Sharp để phân tích + lọc logo công ty. Kiểm tra file size, ảnh corrupt, dimension quá nhỏ, ảnh blank/1 màu, unique colors. Output: filter_report.json với quality assessment (good/low/bad). Xử lý SVG + raster formats (PNG/JPG). Concurrency=20 để xử lý nhanh.

## Stack
- Node.js
- Sharp
- File System
- Image Analysis
- Async/Concurrency

## Quyet dinh quan trong
- Dùng Sharp (libvips wrapper) cho fast image processing - File size threshold = 500 bytes (placeholder detection) - Min dimension = 32px, good = 48px - Max blank stddev = 5 (1 color detection) - Min unique colors = 10 (placeholder vs real logo) - SVG chỉ check size (không analyze pixel) - Concurrency = 20 để process nhanh

## Bai hoc rut ra
Sharp cần build native library (đã có node_modules/.bin/). Stddev < 5 = ảnh blank/1 màu. File size < 500B = placeholder 99%. Ảnh nhỏ (32-48px) = low quality, <32 = reject. SVG kho phân tích pixel nên chỉ check size. Report format JSON dễ parse lại. Concurrency 20 optimal cho logo filtering.

## Ket qua
Logo filter hoàn thành. Analyze 1000s logos → filter_report.json. Quality: good/low/bad. Move bad logos → logos_bad/. Report chi tiết: file size, dimension, stddev, unique colors.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
