# System Document — Pre-flight Checklist

> Auto-generated tu Longbrain khi init_project.
> PHAI review truoc khi bat dau code!

## Canh bao KHONG BAO GIO LAP LAI
- [ ] [NA-001] Unicode regex khong match tieng Viet: Luon dung p.normalize("NFD").replace(/[̀-ͯ]/g, "") truoc khi match

## Chuan bi ky thuat
- [ ] Error handling middleware da setup
- [ ] Environment variables validation khi startup

## Kiem tra chung
- [ ] .gitignore da co: .env, node_modules, __pycache__, *.log
- [ ] README.md co huong dan setup co ban
- [ ] Test endpoint don gian truoc khi build features
- [ ] Backup/restore strategy da nghi den
- [ ] Logging co du thong tin de debug production issues

## Bai hoc tu du an cu (review truoc khi code)
- [ ] Doc: 2026-05-13-Facebook-comment-403-cn-quyn-pagesmanageengagement
- [ ] Doc: 2026-05-14-Facebook-Groups-API-deprecated-hon-ton-t-Apr-2024--khng-cn-p
- [ ] Doc: 2026-05-13-Facebook-comment-link-preview-khng--URLtn-min-trong-text

## Sau khi bat dau
- [ ] Goi get_context_for_task("Tool hỗ trợ lấy và quản lý long-lived access token cho Facebook Fanpage, Instagram và Threads — không bị hết hạn.") de tim kien thuc lien quan
- [ ] Log progress hang ngay vao progress.md
- [ ] add_learning() sau moi bug fix hoac milestone quan trong
