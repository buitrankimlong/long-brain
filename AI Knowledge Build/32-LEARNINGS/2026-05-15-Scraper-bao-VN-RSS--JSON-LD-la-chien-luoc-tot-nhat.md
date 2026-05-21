---
tags: [learning, scraping, rss, json-ld, vietnam-news, feedparser, beautifulsoup]
date: 2026-05-15
project: "[[Thong Tin Cong Ty FB Fanpage]]"
---

# Scraper bao VN: RSS + JSON-LD la chien luoc tot nhat

## Boi canh
Xay dung he thong cao tin tuc tu 14 bao VN ve kinh te, tai chinh, doanh nghiep. Can tim cach cao on dinh, nhanh, khong bi chặn.

## Giai phap
1. Dung RSS feed lam nguon chinh (10/14 trang co RSS) - feedparser parse nhanh, khong can JS
2. JSON-LD (script type=application/ld+json) tren trang detail co du: headline, author, datePublished, articleSection - on dinh hon CSS selector
3. Sitemap XML cho cac trang khong co RSS (CafeBiz, Reatimes, TinNhanhCK)
4. HTML scraping chi dung cho Thoi Bao Tai Chinh (khong co RSS)
5. Thumbnail: VnExpress co enclosure tag, CafeF/VietnamBiz parse img tu description CDATA
6. Tat ca 14 trang deu khong co Cloudflare hay CAPTCHA chan scraping

## Duc ket
Khi cao bao VN: RSS > Sitemap > HTML. Luon parse JSON-LD tren detail page truoc khi dung CSS selector. 10/14 bao lon VN co RSS feed.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thong Tin Cong Ty FB Fanpage]]
