# Hệ thống theo dõi fanpage faecbook và đăng lại — Progress Log

## 2026-05-18
### Da lam
- [ ] Khoi tao project

### Van de / Blockers
- Khong co

### Ke hoach ngay mai
- [ ] 

---

## 2026-05-18
### Da lam
- [x] Khoi tao project trong Longbrain + setup cau truc files
- [x] Deep research: Facebook scraping 2026 (HTTP thuan KHONG hoat dong, phai dung Playwright)
- [x] Session manager: login Chrome profile that -> save cookies (fix input() bug tren Windows)
- [x] Scraper v1: Playwright + Camoufox headless, JS inject extract posts tu DOM
- [x] Tim ra pattern: timestamp spans -> walk up DOM -> post container -> extract fbid/text/images
- [x] Image filter: chi lay anh trong photo link va size > 200px (loai avatar/icon)
- [x] Database SQLite: store posts + mark media downloaded
- [x] Media downloader: httpx (anh) + yt-dlp (video)
- [x] Monitor loop: smart polling 5 phut (cao diem) / 30 phut (thap diem)
- [x] Test thanh cong voi FsoftGlobal (4 posts) va page ca nhan (1 post)
- [x] Tao setup.bat, start.bat, status.bat

### Blockers
- Mot so posts thieu text/images do container detection chua cover het layout Facebook
- Admin view va visitor view co DOM khac nhau - can test them voi nhieu page
- Page dung profile.php?id=XXX (admin view) chi extract duoc 1/2 posts

### Tiep theo
- [ ] Fix container detection cho nhieu layout khac nhau
- [ ] Test voi 5-10 public pages de do do chinh xac
- [ ] Them Telegram notification khi phat hien bai moi
- [ ] Filter anh chinh xac hon (phan biet post image vs sidebar thumbnail)
- [ ] Chay monitor lien tuc de test realworld

---