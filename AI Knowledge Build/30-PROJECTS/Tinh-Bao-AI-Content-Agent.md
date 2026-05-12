---
tags: [project, tinh-bao-ai-content-agent]
status: dang-lam
started: 2026-04-14
client: Bùi Trần Kim Long (Solo creator)
stack: [Python 3.8+, CrewAI 0.30+, OpenAI client (v98store gateway), feedparser 6.0, ddgs 9.0 (DuckDuckGo), praw 7.7 (Reddit), newspaper4k 0.9, sentence-transformers 3.0, python-telegram-bot 21.0, APScheduler 3.10, SQLite, BeautifulSoup4, lxml]
updated: 2026-05-09
---

# Tinh-Bao-AI-Content-Agent

## Mo ta
AI Content Scout Agent — hệ thống tự động tìm kiếm, lọc, viết lại content AI cho độc giả Việt Nam. Chạy 24/7 dưới dạng scheduler Python, gửi kết quả qua Telegram Bot để Long kiểm duyệt trước khi post lên website. Pipeline 4 giai đoạn: Thu thập (Scout) từ 3 nguồn (RSS, DuckDuckGo, Reddit/Hacker News) → Lọc (Filter) loại trùng + LLM chấm điểm 1-10 → Viết lại (Writer) tiếng Việt + Facebook post → Gửi Telegram. Sử dụng v98store API gateway (DeepSeek-V3), CrewAI framework, sentence-transformers cho semantic dedup, SQLite memory cache.

## Stack
- Python 3.8+
- CrewAI 0.30+
- OpenAI client (v98store gateway)
- feedparser 6.0
- ddgs 9.0 (DuckDuckGo)
- praw 7.7 (Reddit)
- newspaper4k 0.9
- sentence-transformers 3.0
- python-telegram-bot 21.0
- APScheduler 3.10
- SQLite
- BeautifulSoup4
- lxml

## Quyet dinh quan trong
**1. Standalone agents KHÔNG dùng CrewAI orchestration**: Ban đầu dùng CrewAI orchestration nhưng hay bị timeout → chuyển về standalone functions (scout_agent.py, filter_agent.py, writer_agent.py) + gọi tuần tự trong crew.py. Giữ CrewAI classes để sau có thể dùng khi cần orchestration phức tạp.

**2. v98store OpenAI-compatible gateway**: Dùng 1 API key v98store cho tất cả requests (KHÔNG gọi trực tiếp OpenAI/Claude/etc) → dễ swap model (hiện DeepSeek-V3), giảm chi phí.

**3. Semantic dedup với sentence-transformers**: Loại bài trùng ngữ nghĩa (KHÔNG chỉ URL) bằng embeddings cosine similarity 0.85 → bài tương tự nhau được lọc.

**4. SQLite memory cache**: Dùng SQLite (không Postgres) → portable, không cần deploy DB, dễ reset.

**5. Telegram queue FIFO**: Pending articles cued trong Telegram (max 50) → gửi từng bài 1-2 cái/ngày. Long kiểm duyệt trước khi publish website.

**6. RSS 9 feeds + DuckDuckGo 17 categories**: Nguồn đa dạng (arXiv, HF, TechCrunch, OpenAI, Anthropic, etc) + search 17 topics (tin tức, tutorial, prompt, tips, etc) → coverage rộng.

**7. Mode running: 'fresh' | 'recent' | 'evergreen' | 'mixed' | 'deep'**: run_scout_standalone() support mode để kiểm soát loại bài (trend vs evergreen) → linh hoạt với nhu cầu.

**8. Min score threshold 6/10**: Chỉ bài >= 6 điểm mới qua filter → chất lượng.

**9. Rate limit 2.5s giữa requests**: Tránh block từ RSS hosts, search engines.

## Bai hoc rut ra
**CrewAI orchestration timeout**: Ban đầu dùng CrewAI callbacks (send_to_telegram, update_db) nhưng hay bị timeout hoặc lỗi parsing → dùng standalone functions là ổn hơn. Học cách refactor từ orchestrated workflow sang pipeline đơn giản.

**DeepSeek JSON format**: DeepSeek hay vỡ JSON khi content có HTML → dùng XML tags trong prompt để structured output ổn hơn.

**Semantic similarity ngưỡng**: Cosine similarity 0.8 có thể quá thấp (loại bài hay giống nhưng khác angle), 0.9 quá cao (bỏ bài đáng lưu) → 0.85 là balance tốt.

**Reddit API PRAW**: Reddit hay rate limit → dùng fallback JSON API (không cần PRAW) khi auth fail.

**Telegram message format**: Telegram có limit 4096 chars/message → format bài vào nhiều message (title + summary + bullets + hashtags).

**Google Trends cache**: Trends data hay timeout → cache 24h để reduce requests, fallback keyword pool nếu không có trend.

**DuckDuckGo ddgs library**: ddgs (duckduckgo-search) mới đổi tên từ duckduckgo-search, cần update imports. Luôn check requirements.txt.

**Newspaper4k extraction**: Newspaper4k fails trên một số website → fallback BeautifulSoup + fallback summary = raw title (không crash).

**SQLite concurrent write**: SQLite không support concurrent write tốt → dùng lock file hoặc WAL mode (`PRAGMA journal_mode=WAL`).

## Ket qua
**Pipeline chạy ổn định 24/7**:
- ✅ Thu thập 50-100 bài/lần từ 3 nguồn (RSS, search, trending)
- ✅ Lọc semantic + LLM scoring → 15-30 bài qua filter
- ✅ Viết lại Việt → 10-15 bài hoàn thành
- ✅ Gửi Telegram → Long review rồi publish website
- ✅ Email admin alerts khi có lỗi (via Telegram)

**Scheduler chạy**:
- 8 giờ sáng: ingest quốc tế (RSS 9 feed)
- 14 giờ: ingest quốc tế (lần 2)
- 20 giờ: ingest quốc tế (lần 3)
- + Manual modes: 'deep' (tìm kiếm sâu), 'evergreen' (bài dài hạn)

**Database**: SQLite cache ~1000 articles (auto cleanup > 30 ngày).

**Monitoring**: Telegram logs mỗi run, error alerts immediate.

**Current state**: Sandbox mode (QA) — Long test trước khi deploy vào production website. Có thể bật production mode bất kỳ lúc nào.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
