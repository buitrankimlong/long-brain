# FB Group Auto Poster — Pre-flight Checklist

> Auto-generated tu Longbrain khi init_project.
> PHAI review truoc khi bat dau code!

## Canh bao KHONG BAO GIO LAP LAI
- [ ] [NA-001] Unicode regex khong match tieng Viet: Luon dung p.normalize("NFD").replace(/[̀-ͯ]/g, "") truoc khi match
- [ ] [NA-002] PHẢI deep research trước khi build bất kỳ hệ thống nào: LUÔN LUÔN deep research TRƯỚC KHI viết dòng code đầu tiên:

## Chuan bi ky thuat

## Kiem tra chung
- [ ] .gitignore da co: .env, node_modules, __pycache__, *.log
- [ ] README.md co huong dan setup co ban
- [ ] Test endpoint don gian truoc khi build features
- [ ] Backup/restore strategy da nghi den
- [ ] Logging co du thong tin de debug production issues

## Bai hoc tu du an cu (review truoc khi code)
- [ ] Doc: 2026-05-17-Facebook-Group-Auto-Post---Playwright-approach-thanh-cong
- [ ] Doc: 2026-05-13-Thông-tin-thuế-và-luật-kinh-doanh-a11fee98
      → session: a11fee98
- [ ] Doc: 2026-05-17-autopost-facebook-group-693ee91f
      → session: 693ee91f

## Sau khi bat dau
- [ ] Goi get_context_for_task("He thong tu dong dang bai len nhieu Facebook Group. Dung Playwright (Python) de dieu khien Chrome that, go text + upload anh nhu nguoi dung that. Ho tro tieng Viet co dau, bullet points, hinh anh. Anti-ban voi random delay, spintax.") de tim kien thuc lien quan
- [ ] Log progress hang ngay vao progress.md
- [ ] add_learning() sau moi bug fix hoac milestone quan trong
