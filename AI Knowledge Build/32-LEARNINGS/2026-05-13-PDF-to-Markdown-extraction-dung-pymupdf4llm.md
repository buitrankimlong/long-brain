---
tags: [learning, ocr, pdf, markdown, pymupdf4llm, extraction]
date: 2026-05-13
project: "[[Learn AI]]"
---

# PDF to Markdown extraction dung pymupdf4llm

## Boi canh
Can extract noi dung tu file PDF (64 trang, text-based) va chuyen sang Markdown chinh xac, dung thu tu, khong bi lon xon

## Giai phap
Dung pymupdf4llm.to_markdown() voi page_chunks=False. Ti le output/input ~1.09x la hop ly. Post-process: xoa dong trang thua, trailing spaces.

## Duc ket
pip install pymupdf4llm. Goi to_markdown(pdf_path, page_chunks=False, show_progress=True). Kiem tra ti le: < 0.5x la thieu, > 3x la thua. Image-based PDF dung cung tool nay (co OCR built-in).

## Code mau
```
import pymupdf4llm\nmd = pymupdf4llm.to_markdown(pdf_path, page_chunks=False, show_progress=True)
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Learn AI]]
