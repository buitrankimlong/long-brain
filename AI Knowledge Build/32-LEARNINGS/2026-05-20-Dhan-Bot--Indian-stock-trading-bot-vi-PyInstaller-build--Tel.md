---
tags: [learning, trading, dhan, pyinstaller, telegram, python, freelance, home-pc]
date: 2026-05-20
project: "[[Dhan-Bot]]"
---

# Dhan Bot — Indian stock trading bot với PyInstaller build + Telegram signals

## Boi canh
Tìm thấy tại E:\Dhan Bot Application (3.02 GB do có build/dist từ PyInstaller). Bot trading cho Dhan (Indian broker). Có config.py hỗ trợ cả chạy từ .py và .exe (get_resource_path). Gửi signal qua Telegram cho nhiều chat IDs. Có api-scrip-master.csv (26.6 MB) cho stock list. Timeframe mặc định: 1H.

## Giai phap
Pattern: PyInstaller build (.spec → .exe) để deploy cho khách. get_resource_path() phân biệt frozen (exe) vs script mode. dotenv load từ cùng thư mục exe. Multiple Telegram chat IDs cho nhiều người nhận.

## Duc ket
Khi build Python app cho khách: PyInstaller + get_resource_path pattern (sys.frozen check). Đặt .env cùng thư mục .exe. Dhan API cho Indian stock market.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Dhan-Bot]]
