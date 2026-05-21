---
tags: [never-again, v98-api, model-testing, production, image-gen]
id: NA-003
date: 2026-05-20
---

# [NA-003] PHẢI test model AI trước khi cho vào hệ thống

## Sai lam
Đưa model AI (flux-kontext-pro) vào code production mà không test trước xem model đó có hoạt động với API key hiện tại, có bị rate limit, hay có support endpoint cần dùng không.

## Hau qua
Chức năng tạo ảnh bị lỗi 429 trên production. User không dùng được tính năng. Mất thời gian debug và deploy lại.

## Phong tranh
LUÔN test model AI bằng curl/script TRƯỚC khi hardcode vào hệ thống: 1) Test API key còn quota không, 2) Test model cụ thể có support endpoint cần dùng (images/edits, images/generations, chat/completions), 3) Test với dữ liệu thật (ảnh thật, prompt thật), 4) Chỉ sau khi test OK mới đưa vào code.

---
> Added: 2026-05-20 | Severity: HIGH
