---
tags: [learning, ui, vietnamese, diacritics, admin-panel, quality]
date: 2026-05-18
project: "[[Abuss]]"
---

# Claude Code luôn viết tiếng Việt thiếu dấu khi tạo UI text

## Boi canh
Khi viết code cho admin panel (React/Next.js), Claude thường xuyên viết các label, placeholder, message bằng tiếng Việt KHÔNG DẤU (VD: "Them san pham", "Luu thay doi", "Phong khach hien dai"). User yêu cầu tất cả tiếng Việt PHẢI có dấu.

## Giai phap
PHẢI viết tiếng Việt CÓ DẤU trong mọi UI text: labels, placeholders, button text, tooltips, descriptions, error messages. VD: "Thêm sản phẩm", "Lưu thay đổi", "Phòng khách hiện đại".

## Duc ket
MỌI text tiếng Việt trong code (UI labels, messages, comments) PHẢI có dấu đầy đủ. KHÔNG BAO GIỜ viết tiếng Việt không dấu. Đây là yêu cầu cứng của user đã được ghi trong CLAUDE.md (mục "User yêu cầu tất cả tiếng Việt PHẢI có dấu").

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
