---
tags: [scraping, reatimes, tinnhanhchungkhoan, css-selectors, rss, vietnam, news, bds, chungkhoan]
description: Web-Scraping-VN-News-Reatimes-TNCK
created: 2026-05-15
moc: "[[10 Email Marketing]]"
---

# Web Scraping Config: Reatimes.vn & TinNhanhChungKhoan.vn

## Ngày research: 2026-05-15

---

## 1. REATIMES.VN (Bất động sản)

### List Page Selectors
- Article container: `.box-category-item`
- Title + link: `.box-category-link-title` (là thẻ `<a>` chứa href)
- Thumbnail: `.box-category-link-with-avatar img` hoặc `.box-category-avatar`
- Excerpt/Sapo: `.box-category-sapo`
- Time: `.box-category-time.time-ago`
- Category label: `.box-category-category`

### Detail Page Selectors
- H1 title: `<h1>` (không có class cụ thể)
- Article body: Không xác định được class rõ ràng qua WebFetch (trang render JS)
- Author: từ JSON-LD `author.name`
- Date: từ JSON-LD `datePublished` (ISO 8601)
- Category: từ JSON-LD BreadcrumbList
- **TỐT NHẤT: Dùng JSON-LD script[type="application/ld+json"]** — đầy đủ headline, description, datePublished, dateModified, author, breadcrumb

### URL Patterns
- Article URL: `/[slug]-[numeric-id-dài].htm` (VD: `/slug-202260514194016054.htm`)
- ID là timestamp-based number dài ~18 ký tự
- Category page: `/[category].htm` (VD: `/bat-dong-san.html`)

### RSS / Sitemap
- **Google News Sitemap (RSS)**: `https://reatimes.vn/sitemaps/googlenews.ashx` ← CHÍNH
- **Sitemap index**: `https://reatimes.vn/sitemaps/index.rss`
- **Latest news RSS**: `https://reatimes.vn/sitemaps/latest-news.rss`
- Google News sitemap có: `<news:title>`, `<news:publication_date>`, `<news:keywords>`, `<image:loc>`
- Image CDN: `https://cdn1z.reatimes.vn/`

### robots.txt
- Disallow: `/tim-kiem.htm`, `/print/`
- Crawl-delay: Không có
- Sitemap: `https://reatimes.vn/sitemaps/index.rss`, `https://reatimes.vn/sitemaps/googlenews.ashx`

### Pagination
- Không thấy pagination rõ ràng trên category page
- Có thể load-more hoặc infinite scroll (JS-rendered)

### Anti-Scraping
- Google Analytics (G-LNE4S4MB3B)
- User-agent meta check cho ads (`not-allow-ads`)
- Không có Cloudflare, CAPTCHA

---

## 2. TINNHANHCHUNGKHOAN.VN (Chứng khoán)

### List Page Selectors
- Article links follow pattern: `a[href*="-post"][href$=".html"]`
- URL pattern: `/[slug]-post[NUMBER].html`
- Image: `img[src*="image.tinnhanhchungkhoan.vn"]`
- Title: `h3` hoặc heading trong article `<a>` wrapper
- Time: text dạng `DD/MM/YYYY HH:MM` — không có semantic tag
- Không có class rõ ràng trên article containers (minified HTML)

### Detail Page Selectors
- H1: `<h1>` (không có class)
- Article body: Không xác định được class wrapper (cần test thêm với browser)
- Author: `a[href*="author-search.html"]` — VD: `/author-search.html?q=T.Thúy`
- Date: plain text `DD/MM/YYYY HH:MM` — không có datetime attribute
- **TỐT NHẤT: Dùng JSON-LD script[type="application/ld+json"]** — có headline, description, datePublished, dateModified, author.name, publisher
- Category: từ JSON-LD BreadcrumbList

### URL Patterns
- Article: `/[slug]-post[NUMBER].html` (VD: `/giao-dich-chung-khoan-sang-155-bluechip-suy-yeu-thi-truong-dieu-chinh-post390519.html`)
- Post ID là số tự tăng (hiện ~390xxx)
- Category: `/[category]/` (VD: `/chung-khoan/`)

### RSS / Sitemap
- Sitemap index: `https://www.tinnhanhchungkhoan.vn/sitemap.xml`
- Monthly news sitemaps: `https://www.tinnhanhchungkhoan.vn/sitemaps/news-YYYY-M.xml`
  - Chỉ có `<loc>` và `<lastmod>`, KHÔNG có title/image trong sitemap
- Không tìm thấy RSS feed URL công khai
- **Tốt nhất: dùng sitemap tháng hiện tại** để lấy danh sách URL mới, rồi fetch từng URL

### robots.txt
- Disallow: `/api/`, `/search/`, `/tim-kiem/`, `/search.html`, `/tu-khoa.html`, `/tag.html`, `/print.html`
- Crawl-delay: Không có
- Sitemap: `https://www.tinnhanhchungkhoan.vn/sitemap.xml`

### Pagination
- Category page có nút "Xem thêm" link đến `/tin-moi-nhat.html`
- Không có pagination số trang truyền thống
- Có thể dùng AJAX load-more

### Anti-Scraping
- HTTPS enforcement (redirect nếu không dùng HTTPS)
- IS_MOBILE user-agent detection
- Google Analytics (UA-41973001-1, G-LB5G71X4W7)
- Không có Cloudflare, CAPTCHA

---

## CHIẾN LƯỢC SCRAPING TỐI ƯU

### Reatimes: Dùng Google News Sitemap
```
GET https://reatimes.vn/sitemaps/googlenews.ashx
→ Parse XML: <loc>, <news:title>, <news:publication_date>, <news:keywords>, <image:loc>
→ Fetch từng <loc> để lấy full content
→ Parse JSON-LD trong detail page để lấy metadata
```

### TinNhanhChungKhoan: Dùng Monthly Sitemap
```
GET https://www.tinnhanhchungkhoan.vn/sitemaps/news-2026-5.xml
→ Parse <loc> (article URLs), <lastmod> (date)
→ Filter URLs chứa "-post" để chắc chắn là article
→ Fetch từng URL, parse JSON-LD cho metadata
→ Parse article body HTML (cần test selector trực tiếp)
```
