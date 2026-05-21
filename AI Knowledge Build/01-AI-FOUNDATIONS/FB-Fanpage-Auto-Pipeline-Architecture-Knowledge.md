---
tags: [facebook, fanpage, automation, pipeline, ai-rewriter, scraper]
description: FB-Fanpage-Auto-Pipeline-Architecture
created: 2026-05-15
moc: "[[01 Nen Tang AI]]"
---

# FB Fanpage Auto Pipeline - Architecture

## Tong quan
He thong tu dong nuoi Fanpage Facebook: Cao bai bao -> AI viet lai -> Dang len FB + Tu dong binh luan.

## Stack
- Python 3.11
- SQLite (articles.db)
- OpenAI-compatible API (v98store.com) cho AI rewriter
- Facebook Graph API v25.0
- APScheduler cho scheduling

## Pipeline Flow
```
[14 nguon bao] -> scraper.py (RSS/HTML/Sitemap)
    -> db.py (SQLite: articles table)
    -> rewriter.py (AI viet lai van phong DrNeo + sinh comment)
    -> publisher.py (Dang FB + auto comment)
```

## Cau truc files
```
main.py              # Orchestrator + scheduler
scraper.py           # Cao bai tu 14 nguon (RSS, HTML, Sitemap)
rewriter.py          # AI rewrite van phong Tran Bang Viet + comment
publisher.py         # Dang FB + auto comment
db.py                # SQLite ORM
config/sources_config.json  # Cau hinh 14 nguon bao
Tran_Bang_Viet.md    # Style reference (van phong mac dinh)
Viet_Nguyen_AI.md    # Style reference (backup)
data/articles.db     # SQLite database
```

## DB Schema (articles table)
- id, source, url, title, content, author, published_at, thumbnail, category
- scraped_at, rewritten_content, rewritten_comment, rewritten_at
- posted_to_fb, fb_post_id, posted_at

## Van phong mac dinh: Tran Bang Viet (DrNeo)
- Phan tich su kien duoi goc quan tri, lanh dao
- It emoji (2-4 cho toan bai)
- Co phan "Binh:" cuoi bai - nhan dinh ca nhan
- Cau hoi goi mo de nguoi doc suy ngam
- Khong dung markdown

## Auto Comment
- Sinh rieng boi AI voi system prompt khac
- Noi dung chi tiet hon bai dang, phan tich them so lieu/boi canh
- Ghi nguon: chi ten bao + ngay, KHONG co link/URL
- Tu dong comment ngay sau khi dang bai thanh cong

## API Endpoints su dung
- POST /{PAGE_ID}/photos: dang bai voi hinh
- POST /{PAGE_ID}/feed: dang bai text
- POST /{post_id}/comments: binh luan

## Env vars
- FB_PAGE_ID, FB_ACCESS_TOKEN
- AI_BASE_URL (v98store.com/v1), AI_API_KEY, AI_MODEL
- SCRAPE_INTERVAL_MINUTES, POST_INTERVAL_MINUTES, MAX_POSTS_PER_DAY

## Luu y quan trong
1. Luon strip markdown tu output AI (re.sub ** ## -)
2. Dang bai voi /photos (co hinh) duoc Meta uu tien hon /feed
3. KHONG dung link ngoai trong post hay comment - Meta giam reach
4. Polite delay 0.5s giua cac request khi scrape
