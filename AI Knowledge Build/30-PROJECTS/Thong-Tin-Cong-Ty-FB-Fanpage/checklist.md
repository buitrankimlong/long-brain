# Thong Tin Cong Ty FB Fanpage — Pre-flight Checklist

> Auto-generated tu Longbrain khi init_project.
> PHAI review truoc khi bat dau code!

## Canh bao KHONG BAO GIO LAP LAI
- [ ] [NA-001] Unicode regex khong match tieng Viet: Luon dung p.normalize("NFD").replace(/[̀-ͯ]/g, "") truoc khi match

## Chuan bi ky thuat

## Kiem tra chung
- [ ] .gitignore da co: .env, node_modules, __pycache__, *.log
- [ ] README.md co huong dan setup co ban
- [ ] Test endpoint don gian truoc khi build features
- [ ] Backup/restore strategy da nghi den
- [ ] Logging co du thong tin de debug production issues

## Bai hoc tu du an cu (review truoc khi code)
- [ ] Doc: 2026-05-13-Thông-tin-thuế-và-luật-kinh-doanh-a11fee98
      → session: a11fee98
- [ ] Doc: 2026-05-13-AI-Build-Learning-3a39e246
      → session: 3a39e246
- [ ] Doc: 2026-05-14-Facebook-Groups-API-deprecated-hon-ton-t-Apr-2024--khng-cn-p

## Sau khi bat dau
- [ ] Goi get_context_for_task("Hệ thống nuôi fanpage tự động cho trang thông tin công ty trên Facebook. Tự động cào tin tức từ nhiều nguồn báo chí, trang web về kinh doanh, doanh nghiệp, tài chính, kinh tế. Viết lại content và đăng lên fanpage qua Facebook Graph API. 3 giai đoạn: (1) Tìm nguồn content, (2) Phân tích cấu trúc web để cào tự động, (3) Build full hệ thống từ cào bài đến đăng bài.") de tim kien thuc lien quan
- [ ] Log progress hang ngay vao progress.md
- [ ] add_learning() sau moi bug fix hoac milestone quan trong
