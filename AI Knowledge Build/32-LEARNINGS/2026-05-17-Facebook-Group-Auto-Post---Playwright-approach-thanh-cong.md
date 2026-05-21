---
tags: [learning, facebook, playwright, automation, auto-post, group, python, encoding]
date: 2026-05-17
project: "[[Thông Tin Công Ty FB Fanpage]]"
---

# Facebook Group Auto Post - Playwright approach thanh cong

## Boi canh
Can auto post len Facebook Group voi noi dung tieng Viet co dau, bullet points, hinh anh. Da thu nhieu cach (Chrome Extension, CDP, mbasic) deu that bai.

## Giai phap
Dung repo ariknih/autopost-facebook-group (Python + Playwright):
1. Luu cookies bang CREATE_SESSION=True, login thu cong 1 lan
2. Dung page.keyboard.press("p") mo composer (shortcut cua Facebook)
3. Dung page.keyboard.type(content) go text - Playwright go tung ky tu nhu nguoi that
4. Upload anh bang page.expect_file_chooser() + click Photo/video icon
5. Click Post button bang xpath selectors

QUAN TRONG:
- Fix encoding Windows: sys.stdout = io.TextIOWrapper(stdout.buffer, encoding='utf-8')
- Dung Unicode escapes cho tieng Viet trong source: \u1eadp thay vi "cập"
- Xoa emoji trong print() (Windows cp1252 khong ho tro)
- open(file, encoding='utf-8') cho moi file JSON
- Delay 2-5 phut giua moi group post

## Duc ket
Khi can auto post FB Group: (1) Copy repo ariknih/autopost-facebook-group, (2) Login 1 lan de luu cookie, (3) Dung Playwright keyboard.type() - KHONG dung execCommand hay DOM manipulation, (4) Fix Windows encoding truoc khi chay

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thông Tin Công Ty FB Fanpage]]
