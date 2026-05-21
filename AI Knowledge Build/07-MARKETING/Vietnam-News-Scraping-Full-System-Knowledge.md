---
tags: [scraping, vietnam-news, rss, json-ld, beautifulsoup, feedparser, thumbnail, anti-scraping]
description: Vietnam-News-Scraping-Full-System
created: 2026-05-15
moc: "[[07 Marketing Tu Dong]]"
---

# Hệ thống cào tin tức báo Việt Nam — Full Knowledge

> Tổng hợp từ dự án "Thông Tin Công Ty FB Fanpage" (2026-05-15)
> 70 nguồn đã khảo sát, 14 nguồn đã phân tích cấu trúc chi tiết

---

## Chiến lược cào tổng quan

**Thứ tự ưu tiên: RSS > Sitemap XML > HTML scraping**

| Phương thức | Ưu điểm | Nhược điểm |
|---|---|---|
| RSS (feedparser) | Nhanh, ổn định, không cần JS | Giới hạn ~50 bài/feed |
| Sitemap XML | Nhiều URL, có date/image | Không có content |
| HTML scraping | Linh hoạt | Cần maintain selector, có thể cần Playwright |

**Metadata trên detail page: JSON-LD > og:meta > CSS selector**

---

## 14 nguồn TOP đã phân tích

### NHÓM 1: Có RSS tốt (ưu tiên dùng)

| Tên | RSS URL | Thumbnail trong RSS |
|---|---|---|
| VnExpress | vnexpress.net/rss/kinh-doanh.rss | `<enclosure>` tag |
| CafeF | cafef.vn/tai-chinh-ngan-hang.rss | Parse `<img>` từ description CDATA |
| VnEconomy | vneconomy.vn/tai-chinh.rss | Parse `<img>` từ description CDATA |
| Thanh Niên | thanhnien.vn/rss/kinh-te.rss | `<enclosure>` tag |
| Tuổi Trẻ | tuoitre.vn/rss/kinh-doanh.rss | `<enclosure>` tag |
| VietNamNet | vietnamnet.vn/kinh-doanh.rss | Parse `<img>` từ description CDATA |
| Vietstock | vietstock.vn/768/kinh-te/kinh-te-dau-tu.rss | Parse `<img>` từ description CDATA |
| Diễn đàn DN | diendandoanhnghiep.vn/rss/trang-chu | Parse `<img>` từ description CDATA |

### NHÓM 2: Dùng Sitemap

| Tên | Sitemap URL | Ghi chú |
|---|---|---|
| CafeBiz | cafebiz.vn/latestnews-sitemap.xml | Có image:loc, body cần Playwright |
| Báo Đầu Tư | baodautu.vn/sitemaps/news-YYYY-M.xml | RSS feeds rỗng |
| Reatimes | reatimes.vn/sitemaps/googlenews.ashx | Google News format, có title+date+image |
| Tin Nhanh CK | tinnhanhchungkhoan.vn/sitemaps/news-YYYY-M.xml | Không có RSS |

### NHÓM 3: HTML scraping

| Tên | List selector | Ghi chú |
|---|---|---|
| Thời báo TC VN | div.article > h3 > a | Không có RSS (trả 410 Gone) |

---

## Detail page selectors (các trang chính)

```python
DETAIL_CONFIGS = {
    "VnExpress": {
        "title": "h1.title-detail",
        "content": "article.fck_detail",
        "author": "span.author",
    },
    "CafeF": {
        "title": "h1",
        "content": "div[data-role='content']",
        # author từ JSON-LD
    },
    "VnEconomy": {
        "title": "h1",
        "content": "article.article-detail",
        # Lazy load images: data-src
    },
    "VietnamBiz": {
        "title": "h1",
        "content": "article",
        "pagination": "/tai-chinh/trang-{N}.htm",
    },
    "Thanh Nien": {
        "content": "div.detail-cmain",
    },
    "Tuoi Tre": {
        "title": ".detail-title",
        "content": "[data-role='content']",
        "author": ".detail-author .name",
    },
    "VietNamNet": {
        "content": ".main-content",
        "pagination": "/kinh-doanh-page{N}",
    },
    "Vietstock": {
        "content": "div#page-content",
        # reCAPTCHA present but doesn't block GET
    },
    "Dien Dan DN": {
        "content": "div.entry",
        # Lazy load: img data-src
    },
}
```

---

## Thumbnail extraction (3 lớp)

```python
# 1. JSON-LD (ưu tiên cao nhất)
for script in soup.find_all("script", type="application/ld+json"):
    data = json.loads(script.string)
    if data.get("@type") == "NewsArticle":
        img = data.get("image")
        if isinstance(img, list): img = img[0]
        if isinstance(img, dict): thumb = img.get("url") or img.get("contentUrl")
        elif isinstance(img, str): thumb = img

# 2. og:image (fallback)
og = soup.find("meta", property="og:image")
if og: thumb = og["content"]

# 3. RSS enclosure hoặc description CDATA
# VnExpress/ThanhNien/TuoiTre: <enclosure type="image/jpeg" url="...">
# CafeF/VnEconomy/others: parse <img src="..."> từ description
```

---

## RSS thumbnail parsing

```python
import re

# Từ enclosure tag (VnExpress, Thanh Nien, Tuoi Tre)
if hasattr(entry, "enclosures"):
    for enc in entry.enclosures:
        if "image" in enc.get("type", ""):
            thumbnail = enc.get("href") or enc.get("url")

# Từ description CDATA (CafeF, VnEconomy, VietnamBiz, etc.)
img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', description)
if img_match:
    thumbnail = img_match.group(1)
```

---

## Anti-scraping status (2026-05)

| Trang | Cloudflare | CAPTCHA | JS Required | Kết luận |
|---|---|---|---|---|
| VnExpress | Không | Không | List page cần JS | Dùng RSS |
| CafeF | Không | Không | Không (HTML tĩnh) | Dễ cào |
| VnEconomy | Không | Không | List cần JS | Dùng RSS |
| VietnamBiz | Không | Không | Không | Dễ cào |
| Thanh Niên | Không | Không | List cần JS | Dùng RSS |
| Tuổi Trẻ | Không | Không | List cần JS | Dùng RSS |
| VietNamNet | Không | Không | Lazy load ảnh | Dùng RSS |
| Vietstock | Không | reCAPTCHA (không chặn GET) | AJAX | Dùng RSS |
| DDDN | Không | Không | Lazy load ảnh | Dễ cào |
| CafeBiz | Không | Không | Body cần JS | Dùng sitemap |
| Báo Đầu Tư | Không | Không | Date cần JS | Dùng sitemap |
| Thời báo TC | Không | Không | Pagination cần JS | HTML tĩnh OK |
| Reatimes | Không | Không | List cần JS | Dùng sitemap |
| Tin Nhanh CK | Không | Không | Body cần JS | Dùng sitemap |

**Kết luận: Không trang nào chặn scraping mạnh. Tất cả có thể cào bằng requests + BeautifulSoup + feedparser.**

---

## Image CDN patterns

| Trang | CDN | Resize |
|---|---|---|
| VnExpress | i1-kinhdoanh.vnecdn.net | ?w=1200&h=0&q=100 |
| CafeF | cafefcdn.com | /zoom/WIDTH_HEIGHT/ |
| VnEconomy | premedia.vneconomy.vn | ?w=1200&h=630&mode=crop |
| VietnamBiz | cdn.vietnambiz.vn | ?width=500&height=333 |
| Thanh Niên | images2.thanhnien.vn | /zoom/W_H/ |
| Tuổi Trẻ | cdn2.tuoitre.vn | /thumb_w/WIDTH/ |
| VietNamNet | static-images.vnncdn.net | - |
| DDDN | dddn.1cdn.vn | - |

---

## Danh sách 70 nguồn (đã loại trùng)

Xem file đầy đủ: `C:\Thông Tin Công Ty FB Fanpage\sources.md`

Phân nhóm:
- Báo tổng hợp lớn: 8 nguồn
- Báo chuyên kinh tế tài chính: 12 nguồn
- Chứng khoán đầu tư ngân hàng: 9 nguồn
- Bất động sản: 3 nguồn
- Doanh nghiệp khởi nghiệp: 8 nguồn
- Pháp luật thuế kế toán: 6 nguồn
- Cơ quan nhà nước: 7 nguồn
- Truyền thông nhà nước: 5 nguồn
- Tiếng Anh: 9 nguồn
- Hiệp hội DN: 3 nguồn
