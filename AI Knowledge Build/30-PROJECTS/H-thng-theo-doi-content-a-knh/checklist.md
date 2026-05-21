# Hệ thống theo doi content đa kênh — Pre-flight Checklist

> Auto-generated tu Longbrain khi init_project.
> PHAI review truoc khi bat dau code!

## Canh bao KHONG BAO GIO LAP LAI
- [ ] [NA-001] Unicode regex khong match tieng Viet: Luon dung p.normalize("NFD").replace(/[̀-ͯ]/g, "") truoc khi match
- [ ] [NA-002] PHẢI deep research trước khi build bất kỳ hệ thống nào: LUÔN LUÔN deep research TRƯỚC KHI viết dòng code đầu tiên:

## Chuan bi ky thuat
- [ ] docker-compose.yml da setup port mapping dung
- [ ] .env file da tao va them vao .gitignore
- [ ] DATABASE_URL da config dung format postgres://
- [ ] Migration scripts da san sang
- [ ] Error handling middleware da setup
- [ ] Environment variables validation khi startup

## Kiem tra chung
- [ ] .gitignore da co: .env, node_modules, __pycache__, *.log
- [ ] README.md co huong dan setup co ban
- [ ] Test endpoint don gian truoc khi build features
- [ ] Backup/restore strategy da nghi den
- [ ] Logging co du thong tin de debug production issues

## Bai hoc tu du an cu (review truoc khi code)
- [ ] Doc: 2026-05-18-Hệ-thống-theo-dõi-fanpage-faecbook-và-đă-11311c62
      → session: 11311c62
- [ ] Doc: 2026-05-16-Hệ-thống-nuôi-trồng-thủy-canh-5a76faa8
      → session: 5a76faa8
- [ ] Doc: 2026-05-17-Hệ-thống-nuôi-trồng-thủy-canh-5a76faa8
      → session: 5a76faa8

## Sau khi bat dau
- [ ] Goi get_context_for_task("Hệ thống theo dõi và cào content từ nhiều nền tảng (LinkedIn, X, Newsletter, YouTube, Facebook Groups, Reddit...). Mỗi nền tảng có folder riêng. Mục tiêu: theo dõi các kênh/nguồn content, cào về, viết lại và đăng lên cộng đồng của mình.") de tim kien thuc lien quan
- [ ] Log progress hang ngay vao progress.md
- [ ] add_learning() sau moi bug fix hoac milestone quan trong
