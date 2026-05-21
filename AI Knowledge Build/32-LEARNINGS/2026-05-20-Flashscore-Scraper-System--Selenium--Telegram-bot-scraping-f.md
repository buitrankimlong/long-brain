---
tags: [learning, scraping, selenium, flashscore, football, telegram, python, home-pc]
date: 2026-05-20
project: "[[Flashscore-Scraper-System]]"
---

# Flashscore Scraper System — Selenium + Telegram bot scraping football data

## Boi canh
Tìm thấy trên PC nhà tại C:\Flashscore_Scraper_System. Hệ thống scrape dữ liệu bóng đá từ Flashscore dùng Selenium + ChromeDriverManager + ThreadPoolExecutor (concurrent). Gửi kết quả qua Telegram bot. Có parser_logic.py riêng cho logic parse HTML. Input: CSV chứa URLs, Output: CSV dữ liệu trận đấu theo ngày.

## Giai phap
Stack: Python + Selenium + webdriver_manager + pandas + tqdm + colorama + Telegram bot. Pattern: ThreadPoolExecutor cho concurrent scraping, tqdm cho progress bar, modules/parser_logic.py tách logic parse riêng. Input/output theo thư mục ngày (VD: 05-03-2026).

## Duc ket
Khi cần scrape website có JS rendering (như Flashscore), dùng Selenium + ThreadPoolExecutor. Tách parser logic ra module riêng. Dùng thư mục theo ngày cho input/output data.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Flashscore-Scraper-System]]
