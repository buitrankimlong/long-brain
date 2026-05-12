---
tags: [learning, lark, telegram, image-upload, multipart, gotcha]
date: 2026-05-09
project: "[[Thuy Mac AI System]]"
---

# Lark Bitable image URL can auth — phai download buffer truoc khi gui Telegram

## Boi canh
Telegram bot gui anh san pham tu Lark Bitable. Lark tra ve field attachment co `url` va `file_token`, nhung URL la link download can Bearer token. Telegram sendPhoto API chi chap nhan URL public hoac file upload. Ket qua: HTTP 400 lien tuc khi gui anh.

## Giai phap
1. Dung file_token de download anh tu Lark: GET /drive/v1/medias/{file_token}/download voi header Authorization: Bearer {access_token}, responseType: arraybuffer. 2. Chuyen thanh Buffer. 3. Gui qua Telegram bang multipart/form-data (FormData) thay vi JSON body. Them Buffer support vao telegram-client.js sendImage().

## Duc ket
Lark Bitable attachment KHONG BAO GIO tra URL public. Luon can download qua API voi Bearer token truoc khi gui sang platform khac (Telegram, FB, Zalo...). Pattern: download buffer → re-upload. Kiem tra file_token thay vi url/tmp_download_url.

## Code mau
```
// Download from Lark
const res = await axios.get(
  `https://open.larksuite.com/open-apis/drive/v1/medias/${fileToken}/download`,
  { headers: { Authorization: `Bearer ${accessToken}` }, responseType: 'arraybuffer' }
);
const buf = Buffer.from(res.data);

// Send to Telegram via multipart
const FormData = require('form-data');
const form = new FormData();
form.append('chat_id', chatId);
form.append('photo', buf, { filename: 'photo.jpg', contentType: 'image/jpeg' });
await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, { headers: form.getHeaders() });
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thuy Mac AI System]]
