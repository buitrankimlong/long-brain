---
tags: [learning, scraping, images, wikimedia, flickr, themet, dataset, freelance, home-pc]
date: 2026-05-20
project: "[[Gothic-Images-Scraping]]"
---

# Gothic Images Scraping — 156GB dataset từ Wikimedia/Flickr/TheMet cho freelance

## Boi canh
Tìm thấy tại E:\Gothic Images Scraping. Scrapers cho Wikimedia Commons, Flickr, TheMet (Metropolitan Museum). Gothic_Dataset_300k = 155.85 GB (300k images). Có Flickr_Scraper.py, Wikimedia_Common_Scraper.py, Wikimedia_Scraper.py, TheMet_Gothic_Scraper.py, Petscan.py. Tools phụ: count.py, report.py, trim.py.

## Giai phap
Multi-source scraping: Wikimedia API + Flickr API + TheMet API. Petscan cho category navigation. Dataset 300k images cleaned (Gothic_Dataset_Full_Clean = 0.31 GB metadata). Đây là data freelance cho khách.

## Duc ket
Khi scrape ảnh lớn (100k+): chia dataset folders, có count/report/trim scripts. Wikimedia/Flickr/TheMet là 3 nguồn ảnh public domain tốt nhất. Dataset 155 GB — cân nhắc xóa nếu đã giao cho khách.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Gothic-Images-Scraping]]
