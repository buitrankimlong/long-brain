---
tags: [scraping, vietstock, diendandoanhnghiep, rss, vietnam, news, html-selectors]
description: Vietnam-News-Scraping-Vietstock-DDDN
created: 2026-05-15
moc: "[[08 Ban Hang Tu Dong]]"
---

# Web Scraping Config: Vietstock & Diễn đàn Doanh nghiệp

Researched: 2026-05-15

---

## 1. VIETSTOCK (vietstock.vn)

### RSS Feeds (KHUYẾN DÙNG — ổn định nhất)
Format: `https://vietstock.vn/{categoryID}/{slug}.rss`

Key feeds:
- Kinh tế - Đầu tư: `https://vietstock.vn/768/kinh-te/kinh-te-dau-tu.rss`
- Vĩ mô: `https://vietstock.vn/761/kinh-te/vi-mo.rss`
- Doanh nghiệp: `https://vietstock.vn/737/doanh-nghiep/hoat-dong-kinh-doanh.rss`
- Chứng khoán - Cổ phiếu: `https://vietstock.vn/830/chung-khoan/co-phieu.rss`
- BĐS: `https://vietstock.vn/4220/bat-dong-san/thi-truong-nha-dat.rss`
- Tài chính - Ngân hàng: `https://vietstock.vn/757/tai-chinh/ngan-hang.rss`
- RSS list page: `https://vietstock.vn/rss`

RSS Item structure (không có media:thumbnail hay author riêng):
```xml
<item>
  <guid>http://vietstock.vn/2026/05/slug-768-1442781.htm</guid>
  <title>Article Title</title>
  <link>http://vietstock.vn/2026/05/slug-768-1442781.htm</link>
  <description><![CDATA[ <img src="..."> text summary ]]></description>
  <pubDate>Fri, 15 May 2026 09:06:48 +0700</pubDate>
</item>
```
- Image URL: parse từ `<img src="...">` bên trong description CDATA
- Author: luôn là "vietstock" (lấy từ JSON-LD trên trang detail)

### Article Detail Page
URL pattern: `https://vietstock.vn/{year}/{month}/{slug}-{categoryID}-{articleID}.htm`

HTML selectors:
- Title: `h1` (không có class cụ thể) hoặc JSON-LD `headline`
- Content body: `div#page-content`
- Author: JSON-LD `author.name` hoặc `<meta name="article:author">`
- Date: `<meta property="article:published_time">` hoặc JSON-LD `datePublished` (ISO 8601)
- Category: breadcrumb text (Trang chủ > Kinh tế > Kinh tế - Đầu tư)

JSON-LD available: YES — `NewsArticle` schema với đầy đủ headline, image, datePublished, author

### Anti-Scraping
- reCAPTCHA key present: `6LeOIbcZAAAAABgspIsvKZWOqigbUCjmQ-CWI4dn`
- Login wall cho premium content
- AJAX loading cho danh sách bài (`_channelID`, `_totalRows` JS vars)
- channelID format ví dụ: `var _channelID = 5307;`
- Không có Cloudflare

### Pagination (danh sách bài)
- AJAX-based, không có URL pagination truyền thống
- JS var: `var totalChannelRow = 3286;`
- RSS là cách tốt nhất để lấy danh sách bài

---

## 2. DIỄN ĐÀN DOANH NGHIỆP / DDDN (diendandoanhnghiep.vn)

### RSS Feeds (KHUYẾN DÙNG)
Format: `https://diendandoanhnghiep.vn/rss/{category}`

Key feeds:
- Trang chủ: `https://diendandoanhnghiep.vn/rss/trang-chu`
- Kinh tế vĩ mô: `https://diendandoanhnghiep.vn/rss/kinh-te/kinh-te-vi-mo`
- Doanh nghiệp: `https://diendandoanhnghiep.vn/rss/doanh-nghiep`
- Ngân hàng/CK: `https://diendandoanhnghiep.vn/rss/ngan-hang-chung-khoan`
- BĐS: `https://diendandoanhnghiep.vn/rss/bat-dong-san`
- Khởi nghiệp: `https://diendandoanhnghiep.vn/rss/khoi-nghiep`
- Pháp luật: `https://diendandoanhnghiep.vn/rss/phap-luat`

RSS Item structure:
```xml
<item>
  <title>Article Title</title>
  <link>https://diendandoanhnghiep.vn/slug-10178860.html</link>
  <description><![CDATA[
    <a href="[url]"><img src="https://dddn.1cdn.vn/2026/05/14/image.jpg" alt="..." title="..."></a><br/>
    Text summary here...
  ]]></description>
  <pubDate>Fri, 15 May 2026 10:40:01 +0700</pubDate>
  <guid>https://diendandoanhnghiep.vn/slug-10178860.html</guid>
  <slash:comments>0</slash:comments>
</item>
```
Namespace: `xmlns:slash="http://purl.org/rss/1.0/modules/slash/"`
- Image: parse từ `<img src="...">` trong description CDATA
- Author: KHÔNG có trong RSS, lấy từ JSON-LD `author.name` trên trang detail
- Thumbnail CDN: `dddn.1cdn.vn`

### Article Detail Page
URL pattern: `https://diendandoanhnghiep.vn/{slug}-{numericID}.html`
Article ID là số ở cuối, ví dụ: `-10178852`

HTML selectors:
- Title: `h1` (plain, không có class đặc biệt) hoặc JSON-LD `headline`
- Content body: `div.entry` (main article wrapper)
- Author: `.sc-longform-header-author` hoặc JSON-LD `author.name` hoặc `<meta name="article:author">`
- Date: `.sc-longform-header-date` (format: "14/05/2026 15:25") hoặc JSON-LD `datePublished`
- Category: breadcrumb — JSON-LD BreadcrumbList schema

JSON-LD available: YES — `NewsArticle` + `BreadcrumbList` schemas

### HTML List Selectors (nếu không dùng RSS)
```
Container: ul.onecms__loading
Item: li[pid]
  Title: h3 > a
  Link: h3 > a[href] (absolute URL)
  Thumbnail: img[src] (lazy-loaded, ban đầu src=grey.gif, data-src là ảnh thật)
  Time: time (text: "14/05/2026 15:25")
  Description: p
```
- Load more: JavaScript `WebControl.initLoadMore()` — không có URL pagination truyền thống

### Anti-Scraping
- Google Analytics only (G-FXCRZH9SLB)
- CDN: `dddn.1cdn.vn`
- Lazy loading ảnh (grey.gif placeholder)
- KHÔNG có Cloudflare, KHÔNG có CAPTCHA
- Tương đối dễ scrape

---

## KHUYẾN NGHỊ CHUNG

1. **Dùng RSS làm primary source** — cả 2 site đều có RSS phong phú, cập nhật realtime
2. **Parse description CDATA** để lấy thumbnail URL (regex `<img src="([^"]+)"`)
3. **JSON-LD trên trang detail** là cách đáng tin cậy nhất để lấy author, date, category
4. **DDDN dễ scrape hơn** Vietstock (không có reCAPTCHA)
5. **Vietstock**: thumbnail ảnh trên CDN `image.vietstock.vn`
6. **Rate limit**: nghỉ 1-2s giữa các request để tránh bị block
