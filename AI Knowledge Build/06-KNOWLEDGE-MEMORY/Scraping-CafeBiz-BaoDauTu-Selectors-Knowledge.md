---
tags: [scraping, cafebiz, baodautu, css-selectors, vietnam-news, web-scraping]
description: Scraping-CafeBiz-BaoDauTu-Selectors
created: 2026-05-15
moc: "[[06 RAG va Bo Nho AI]]"
---

# Scraping Config: CafeBiz & Báo Đầu Tư

Nghiên cứu ngày: 2026-05-15

---

## 1. CafeBiz (cafebiz.vn)

### List Page Selectors
- **Container**: `.listtimeline ul`
- **Article wrapper**: `.listtimeline ul li` (có class: `normal`, `big`, `bigfull`)
- **Tiêu đề**: `.listtimeline ul li h3 a` hoặc `.listtimeline ul li h2 a`
- **Link**: `h3 a[href]` hoặc `h2 a[href]`
- **Thumbnail**: `li img[src]` hoặc `li img[data-src]` (lazy load)
- **Sapo**: `li p.sapo`
- **Thời gian**: `li span.time`
- **Category**: `li p.cate`

### Detail Page Selectors
- **Không có H1 HTML** — dùng JSON-LD: `script[type="application/ld+json"]` → `headline`
- **Sapo**: JSON-LD `description`
- **Tác giả**: JSON-LD `author.name`
- **Ngày đăng**: JSON-LD `datePublished` (ISO 8601)
- **Category**: JSON-LD `BreadcrumbList` → `itemListElement[1].item.name`
- **Content body**: class chưa xác định rõ — cần Puppeteer/Playwright để render JS

### Pagination
- URL pattern: `https://cafebiz.vn/{category}.chn?page=2` (cần xác minh)
- Pagination element: `.page ul li.next a`

### RSS / Sitemap
- **Sitemap index**: `https://cafebiz.vn/sitemap.xml`
- **Latest news sitemap**: `https://cafebiz.vn/latestnews-sitemap.xml` (XML với image:loc, title, lastmod)
- **Category sitemap**: `https://cafebiz.vn/sitemaps/category.rss`
- **RSS**: `https://cafebiz.vn/rss.chn` (trả về HTML, không phải XML thuần)
- **Google News sitemap**: `https://cafebiz.vn/google-news-sitemap.xml`

### URL Pattern bài viết
```
https://cafebiz.vn/{slug}-{numeric-id}.chn
Ví dụ: cafebiz.vn/shopee-va-tiktok-shop-dong-loat-ra-thong-bao-quan-trong-176260515110016116.chn
```

### Anti-Scraping
- Cho phép ClaudeBot, GPTBot trong robots.txt
- Có lazy load ảnh (lozad library)
- Nội dung render qua JavaScript — cần headless browser cho body content
- Không phát hiện Cloudflare hay CAPTCHA

---

## 2. Báo Đầu Tư (baodautu.vn)

### List Page Selectors
- **Container**: `ul` (không có class đặc biệt)
- **Article wrapper**: `li` (không có class riêng)
- **Tiêu đề + Link**: `li > a[href]` (text content của thẻ a)
- **Thumbnail**: `li img[src]` — URL format: `https://media.baodautu.vn/thumb_x{W}x{H}/...`
- **Sapo/Mô tả**: text node sau thẻ `<a>` hoặc `<p>` không có class
- **Thời gian**: render bằng JavaScript, không có class HTML tĩnh

### Detail Page Selectors
- **Tiêu đề**: không có H1 rõ ràng — lấy từ page title hoặc og:title
- **Ngày đăng**: text node format `DD/MM/YYYY HH:MM`
- **Tác giả**: text node cuối bài
- **Category**: `a[href*="-d{id}/"]` (breadcrumb link)
- **Content body**: không có class wrapper rõ ràng

### Pagination
- Pattern gợi ý từ anchor: `#p2`, `#p3` hoặc query param `?page=2`
- Chưa xác minh được URL page 2 chính xác (các thử nghiệm 404)

### RSS / Sitemap
- **RSS directory**: `https://baodautu.vn/rssMain.html` (liệt kê 25 feeds)
- **RSS trang chủ**: `https://baodautu.vn/trang-chu.rss` (feed rỗng khi test)
- **Sitemap index**: `https://baodautu.vn/sitemap.xml`
- **News sitemap theo tháng**: `https://baodautu.vn/sitemaps/news-YYYY-M.xml`
- **Category sitemap**: `https://baodautu.vn/sitemaps/categories.xml`
- **Robots.txt**: Allow: / (hoàn toàn mở)

### URL Pattern bài viết
```
https://baodautu.vn/{slug}-d{numeric-id}.html
Ví dụ: baodautu.vn/ty-le-hang-viet-trong-he-thong-central-retail-dat-khoang-95-d596432.html
```

### Anti-Scraping
- robots.txt: `Allow: /` — không giới hạn crawler
- Sitemap: `https://baodautu.vn/sitemap.xml`
- Lazy load ảnh (lazyload class + jQuery)
- Không phát hiện Cloudflare hay CAPTCHA
- DMCA badge (bảo vệ bản quyền nội dung)

---

## Khuyến nghị kỹ thuật

| Yếu tố | CafeBiz | BaoDauTu |
|--------|---------|----------|
| HTML parsing đơn giản | Được (list page) | Được (list page) |
| Headless browser | Cần cho detail content | Có thể cần |
| Cách tốt nhất | Sitemap XML → lấy URLs → fetch detail | Sitemap XML → lấy URLs → fetch detail |
| Metadata | JSON-LD đầy đủ | Không có JSON-LD |
| RSS dùng được | Không rõ ràng | RSS directory có nhưng feeds rỗng khi test |
