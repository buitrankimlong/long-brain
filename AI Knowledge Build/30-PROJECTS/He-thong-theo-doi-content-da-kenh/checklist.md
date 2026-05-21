# He-thong-theo-doi-content-da-kenh — Pre-flight Checklist

> Auto-generated tu Longbrain khi init_project.
> PHAI review truoc khi bat dau code!

## Canh bao KHONG BAO GIO LAP LAI
- [ ] [NA-001] Unicode regex khong match tieng Viet: Luon dung p.normalize("NFD").replace(/[̀-ͯ]/g, "") truoc khi match
- [ ] [NA-002] PHẢI deep research trước khi build bất kỳ hệ thống nào: LUÔN LUÔN deep research TRƯỚC KHI viết dòng code đầu tiên:

## Chuan bi ky thuat
- [ ] Telegram bot token da tao va test
- [ ] Webhook URL da set qua setWebhook API

## Kiem tra chung
- [ ] .gitignore da co: .env, node_modules, __pycache__, *.log
- [ ] README.md co huong dan setup co ban
- [ ] Test endpoint don gian truoc khi build features
- [ ] Backup/restore strategy da nghi den
- [ ] Logging co du thong tin de debug production issues

## Bai hoc tu du an cu (review truoc khi code)
- [ ] Doc: 2026-05-20-Hệ-thống-theo-doi-content-đa-kênh-5875418d
      → session: 5875418d
- [ ] Doc: 2026-05-20-Multi-platform-content-tracker--architecture-v-kt-qu-test-20
- [ ] Doc: 2026-05-18-Hệ-thống-theo-dõi-fanpage-faecbook-và-đă-11311c62
      → session: 11311c62

## Sau khi bat dau
- [ ] Goi get_context_for_task("Hệ thống tự động theo dõi content từ 5 nền tảng (Reddit, YouTube, X/Twitter, LinkedIn, Facebook) với ~118 sources verified. Scrape bằng JSON API, yt-dlp, và Chrome CDP. Lưu SQLite, gửi Telegram. Mục tiêu: theo dõi cá nhân chia sẻ kiến thức AI, tech, entrepreneurship.") de tim kien thuc lien quan
- [ ] Log progress hang ngay vao progress.md
- [ ] add_learning() sau moi bug fix hoac milestone quan trong
