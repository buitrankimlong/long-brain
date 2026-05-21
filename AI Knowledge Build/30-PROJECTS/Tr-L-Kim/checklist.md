# Trợ Lý Kim — Pre-flight Checklist

> Auto-generated tu Longbrain khi init_project.
> PHAI review truoc khi bat dau code!

## Canh bao KHONG BAO GIO LAP LAI
- [ ] [NA-001] Unicode regex khong match tieng Viet: Luon dung p.normalize("NFD").replace(/[̀-ͯ]/g, "") truoc khi match
- [ ] [NA-002] PHẢI deep research trước khi build bất kỳ hệ thống nào: LUÔN LUÔN deep research TRƯỚC KHI viết dòng code đầu tiên:

## Chuan bi ky thuat
- [ ] Telegram bot token da tao va test
- [ ] Webhook URL da set qua setWebhook API
- [ ] API key da set trong .env (khong hardcode)
- [ ] Rate limit + retry logic da implement
- [ ] Cost monitoring da setup
- [ ] Error handling middleware da setup
- [ ] Environment variables validation khi startup

## Kiem tra chung
- [ ] .gitignore da co: .env, node_modules, __pycache__, *.log
- [ ] README.md co huong dan setup co ban
- [ ] Test endpoint don gian truoc khi build features
- [ ] Backup/restore strategy da nghi den
- [ ] Logging co du thong tin de debug production issues

## Bai hoc tu du an cu (review truoc khi code)
- [ ] Doc: 2026-05-17-Thông-Tin-Công-Ty-FB-Fanpage-693ee91f
      → session: 693ee91f
- [ ] Doc: 2026-05-19-Admin-Panel-thay-th-Lark-cho-product-data-trong-Sales-Agent
- [ ] Doc: 2026-05-19-Phase-15-Nng-cp-Sales-Agent--Media-Group--Sonnet--Lark-remov

## Sau khi bat dau
- [ ] Goi get_context_for_task("Personal AI Assistant - Trợ lý cá nhân tự động hóa công việc 24/7. Điều khiển qua Telegram, xử lý bằng OpenClaw + Claude API, thực thi trên Lark (Task, Calendar, Chat, Docs). Quản lý 4 vùng: Đại học, Công ty, Thực tập sinh, Dự án bên ngoài.") de tim kien thuc lien quan
- [ ] Log progress hang ngay vao progress.md
- [ ] add_learning() sau moi bug fix hoac milestone quan trong
