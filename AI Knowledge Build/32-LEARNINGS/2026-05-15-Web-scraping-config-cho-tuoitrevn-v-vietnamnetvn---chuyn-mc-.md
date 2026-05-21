---
tags: [learning, scraping, tuoitre, vietnamnet, rss, news, css-selector, web-crawl]
date: 2026-05-15
project: "[[Thông Tin Công Ty FB Fanpage]]"
---

# Web scraping config cho tuoitre.vn và vietnamnet.vn - chuyên mục kinh doanh

## Boi canh
Cần phân tích cấu trúc HTML của 2 website tin tức Việt Nam (tuoitre.vn và vietnamnet.vn) để cào bài viết tự động từ chuyên mục kinh doanh. Cần biết CSS selectors chính xác cho list page và detail page.

## Giai phap
Dùng WebFetch để fetch list page, article page, và RSS feed. Phát hiện: cả 2 site đều có RSS feed hoạt động (tuoitre.vn/rss/kinh-doanh.rss và vietnamnet.vn/kinh-doanh.rss) - đây là cách scrape đơn giản nhất, tránh cần parse HTML phức tạp. Với HTML scraping: tuoitre dùng class box-category-item, vietnamnet dùng h3 + p không có class riêng. Detail page: tuoitre dùng data-role="content" cho body, vietnamnet dùng class main-content.

## Duc ket
RSS feed là cách tốt nhất để lấy bài viết từ báo Việt Nam - tuoitre.vn và vietnamnet.vn đều có RSS đầy đủ (title, link, description, pubDate, enclosure/ảnh). HTML scraping cần Selenium/Playwright vì JS rendering. Nếu dùng HTTP thuần: tuoitre.vn selector chính: .box-category-item (list), [data-role=content] (detail). vietnamnet.vn: h3 > a (list), .main-content (detail body), .content-detail-sapo (sapo).

## Code mau
```
{
  "tuoitre_rss": "https://tuoitre.vn/rss/kinh-doanh.rss",
  "vietnamnet_rss": "https://vietnamnet.vn/kinh-doanh.rss",
  "tuoitre_list_selector": ".box-category-item",
  "tuoitre_detail_body": "[data-role='content']",
  "vietnamnet_detail_body": ".main-content",
  "vietnamnet_sapo": ".content-detail-sapo"
}
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thông Tin Công Ty FB Fanpage]]
