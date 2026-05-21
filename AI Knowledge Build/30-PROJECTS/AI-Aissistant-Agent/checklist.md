# AI Aissistant Agent — Pre-flight Checklist

> Auto-generated tu Longbrain khi init_project.
> PHAI review truoc khi bat dau code!

## Canh bao KHONG BAO GIO LAP LAI
- [ ] [NA-001] Unicode regex khong match tieng Viet: Luon dung p.normalize("NFD").replace(/[̀-ͯ]/g, "") truoc khi match

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
- [ ] Doc: 2026-05-13-AI-Build-Learning-3a39e246
- [ ] Doc: 2026-05-13-AI-Build-Learning-af840414
      → # Auto-Learnings — AI Build Learning — 2026-05-13
- [ ] Doc: 2026-05-13-mcp-server-3a39e246

## Sau khi bat dau
- [ ] Goi get_context_for_task("Openclaw - Trợ lý ảo cá nhân chạy trên PC ở nhà. Có 2 chức năng: (1) Thư ký cá nhân: nhắc lịch, deadline, uống nước, ăn, sự kiện quan trọng qua chatbot. (2) Quản lý dự án AI: nhận yêu cầu từ user, lên plan, rồi tự động điều phối Claude Code để build dự án. Openclaw là lớp trung gian giữa user (sếp) và Claude Code (nhân viên). Hỗ trợ multi-project đồng thời, kết nối MCP Longbrain để truy cập kiến thức/kinh nghiệm.") de tim kien thuc lien quan
- [ ] Log progress hang ngay vao progress.md
- [ ] add_learning() sau moi bug fix hoac milestone quan trong
