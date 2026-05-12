---
tags: [learning, lark, docs, bitable, config, faq, knowledge, api]
date: 2026-05-11
project: "[[Thuy Mac AI System]]"
---

# Lark Docs tot hon Bitable cho content config (FAQ, Knowledge, Prompts)

## Boi canh
He thong Thuy Mac luu FAQ (7 topics), Knowledge phong thuy (88 entries), va kich ban AI trong Lark Bitable tables. Khach hang (chu shop) can chinh sua noi dung nhung Bitable kho edit text dai — phai click vao tung cell, khong co formatting, kho doc tong the.

## Giai phap
Chuyen FAQ + Knowledge tu Bitable sang Lark Docs. Tao script (create-docs-faq-knowledge.js) dung Lark Docx API: 1) POST /docx/v1/documents tao doc moi, 2) POST /docx/v1/documents/{id}/blocks/{root}/children them text/heading blocks. Block types: 2=text, 3=heading1, 4=heading2. KHONG can style field. Cap nhat lark-config-reader.js: Doc (uu tien 1) > Bitable (uu tien 2) > file (fallback). Cache 10 phut.

## Duc ket
Dung Lark Docs cho content dai can edit thuong xuyen (prompts, FAQ, knowledge). Dung Bitable cho structured data (products, orders, customers). Priority chain: Doc > Table > File dam bao khong bao gio mat data. Lark Docx API block_type: 2=text, 3=heading1, 4=heading2, 5=heading3.

## Code mau
```
// Lark Docx API — tao heading + text block
await callLark('POST', `/docx/v1/documents/${docId}/blocks/${docId}/children`, {
  children: [{
    block_type: 3, // heading1
    heading1: { elements: [{ text_run: { content: 'Tieu de' } }] },
  }],
});
// block_type: 2=text, 3=heading1, 4=heading2, 5=heading3

// Config reader priority chain
async getFAQ() {
  // 1. Lark Doc (faq_doc) — owner edit truc tiep
  // 2. Lark Bitable (faq table) — fallback
  // 3. File (faq.json) — last resort
}
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
