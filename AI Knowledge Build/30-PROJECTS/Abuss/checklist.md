# Abuss — Pre-flight Checklist

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
- [ ] Doc: 2026-05-19-Phase-14-15-hon-tt--sn-sng-Phase-16-rewrite-Vercel-AI-SDK
- [ ] Doc: 2026-05-19-ai-system-v2-16e85884
- [ ] Doc: 2026-05-19-Text-based-tool-calling-KHNG-ng-tin--phi-dng-native-function

## Sau khi bat dau
- [ ] Goi get_context_for_task("Hệ thống AI Marketing & Sales tự động cho 3 thương hiệu phong thủy (Thủy Mạc tranh, Mệnh Lý SIM, Thái Vận Ngọc đá). Sales agent tư vấn qua Telegram, 19 tools, native function calling.") de tim kien thuc lien quan
- [ ] Log progress hang ngay vao progress.md
- [ ] add_learning() sau moi bug fix hoac milestone quan trong
