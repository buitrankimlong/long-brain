# Thong Tin Cong Ty FB Fanpage — Progress Log

## 2026-05-15
### Da lam
- [ ] Khoi tao project

### Van de / Blockers
- Khong co

### Ke hoach ngay mai
- [ ] 

---

## 2026-05-15
### Da lam
- [x] GD1: Tim duoc 70 nguon content (da loai trung) tu 4 agent song song
- [x] GD2: Phan tich cau truc HTML cua 14 trang top bang 7 agent song song - xac dinh CSS selectors, RSS URLs, JSON-LD schema
- [x] GD3: Build full he thong Python: db.py, scraper.py, rewriter.py, publisher.py, main.py
- [x] Tao sources_config.json voi 14 nguon da config day du
- [x] Test scraper thanh cong: 134 bai viet tu VnExpress(60), CafeF(50), VnEconomy, ThanhNien, DDDN, ThoibaoTC, Vietstock
- [x] Tao .env, .gitignore, requirements.txt

### Blockers
- AI API key chua hop le - can user cap nhat .env voi key dung
- FB Access Token chua co - user se cung cap sau
- VietnamBiz RSS tra ve 0 bai - can kiem tra lai URL
- CafeBiz/BaoDauTu: sitemap lay URL nhung detail content can Playwright

### Tiep theo
- [ ] User cap nhat AI_API_KEY va FB_ACCESS_TOKEN trong .env
- [ ] Test rewriter voi API key dung
- [ ] Test publisher dang bai len Facebook
- [ ] Fix VietnamBiz RSS va Thoi Bao TC title selector
- [ ] Them Playwright cho CafeBiz/BaoDauTu neu can

---
## 2026-05-15
### Da lam
- [x] GD1: Tim 70 nguon content (4 agent song song)
- [x] GD2: Phan tich cau truc HTML 14 trang top (7 agent song song)
- [x] GD3: Build full he thong Python: db.py, scraper.py, rewriter.py, publisher.py, main.py
- [x] Config 14 nguon trong sources_config.json
- [x] Fix thumbnail: JSON-LD + og:image + RSS enclosure → 135/135 bai co anh
- [x] Fix Page ID: dung /me endpoint lay ID chinh xac 1128587417001845
- [x] Fix v98 API: doi AI_BASE_URL tu openai sang v98store.com
- [x] Fix publisher: KHONG kem link (Meta giam reach), luon dang kem anh
- [x] Test thanh cong: 135 bai cao, 10 bai rewrite, 6 bai da dang len FB
- [x] Luu 4 bai hoc + 1 knowledge file vao Longbrain

### Tiep theo
- [ ] Chay python main.py --schedule de tu dong hoa
- [ ] Them van phong mau tu file .md vao rewriter
- [ ] Monitor va tinh chinh chat luong bai viet
- [ ] Them nhieu nguon RSS neu can

---
## 2026-05-15
### Da lam
- [x] Scraper da cao 135 bai tu 14 nguon (VnExpress, CafeF, VnEconomy, VietnamBiz, CafeBiz, BaoDauTu, TBTCVN, ThanhNien, TuoiTre, VietNamNet, Vietstock, DDDN, Reatimes, TNCK)
- [x] A/B test 2 van phong (Viet Nguyen AI vs Tran Bang Viet) tren cung 1 bai - ca 2 dang thanh cong
- [x] User chon van phong Tran Bang Viet (DrNeo) lam mac dinh
- [x] Cap nhat rewriter.py: DrNeo style, it emoji (2-4), strip markdown tu dong
- [x] Them tinh nang auto-comment: sinh binh luan chi tiet + nguon (khong link), tu dong comment sau khi dang bai
- [x] Cap nhat publisher.py: them comment_on_post(), tu dong comment sau post
- [x] Cap nhat db.py: them cot rewritten_comment, cap nhat save_rewritten() va get_unposted_articles()
- [x] Test dang bai 124 (Cai cach DN) + auto comment thanh cong tren FB

### Blockers
- AI van hay them markdown (** ##) du da yeu cau plain text - da fix bang strip_markdown() nhung can monitor
- Chua test pipeline tu dong (scheduler) voi flow moi

### Tiep theo
- [ ] Test chay pipeline tu dong: scrape -> rewrite (DrNeo) -> publish + comment
- [ ] Monitor chat luong content DrNeo tren nhieu bai khac nhau
- [ ] Xem xet them tinh nang: delay giua cac bai dang, random thoi gian dang
- [ ] Rewrite batch cac bai con lai (125 bai chua rewrite)

---