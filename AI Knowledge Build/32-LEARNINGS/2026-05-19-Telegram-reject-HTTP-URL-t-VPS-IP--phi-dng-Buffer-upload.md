---
tags: [learning, telegram, image-upload, buffer, sendMediaGroup, vps]
date: 2026-05-19
project: "[[Thuy Mac AI System]]"
---

# Telegram reject HTTP URL từ VPS IP — phải dùng Buffer upload

## Boi canh
Sales agent gửi ảnh tranh qua Telegram. URL ảnh dạng http://46.250.225.12:3002/api/uploads/products/xxx.jpg. Telegram API trả 400 'wrong type of the web page content' dù content-type đúng image/jpeg.

## Giai phap
Download ảnh thành Buffer từ localhost, rồi gửi qua Telegram sendPhoto bằng multipart/form-data upload. Telegram chấp nhận Buffer upload luôn, không cần HTTPS. Thêm sendMediaGroup (album) cho gallery: gửi 4 ảnh 1 lúc thay 8 tin rời.

## Duc ket
Telegram Bot API chỉ chấp nhận HTTPS URL hoặc Buffer upload cho sendPhoto. HTTP URL từ IP address (không domain) sẽ bị reject 400. Luôn dùng Buffer upload khi ảnh host trên VPS không có SSL.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
