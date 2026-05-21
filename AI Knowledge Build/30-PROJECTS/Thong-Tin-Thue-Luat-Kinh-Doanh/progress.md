# Thong-Tin-Thue-Luat-Kinh-Doanh — Progress Log

## 2026-05-13
### Da lam
- [ ] Khoi tao project

### Van de / Blockers
- Khong co

### Ke hoach ngay mai
- [ ] 

---

## 2026-05-13
### Da lam
- [x] Scraper: Camoufox bypass Cloudflare thuvienphapluat.vn thành công (domcontentloaded + 6s wait)
- [x] Rewriter: v98 API 2-step chain, output JSON {hook, comments[]}, 4 comment có cấu trúc rõ
- [x] Image generator: Pillow 3x render → 1200px PNG, font Be Vietnam Pro, nền đỏ
- [x] Fanpage publisher: upload ảnh → post → 4 comment chi tiết theo thứ tự
- [x] Group rewriter: 5 persona (hoi, chia_se, canh_bao, tong_hop, ke_chuyen)
- [x] Group publisher: đăng cá nhân lên group với caption
- [x] Database: SQLite articles + fb_posts + group_queue
- [x] Scheduler: APScheduler fanpage mỗi 6h, group mỗi 8h
- [x] Test thành công: đăng fanpage Thái Vận Ngọc với ảnh + 4 comment

### Blockers
- User Access Token cho group chưa có (cần quyền publish_to_groups)
- Fanpage thật chưa config (đang dùng Thái Vận Ngọc để test)
- MCP Longbrain không kết nối đầu session — do Claude Code init MCP 1 lần, nếu server chậm thì bỏ qua

### Tiep theo
- [ ] Lấy User Access Token có quyền publish_to_groups để test group
- [ ] Config fanpage thật của dự án
- [ ] Test full pipeline --once với cả fanpage + group
- [ ] Xem xét thêm scheduler tự động bật khi máy khởi động (Task Scheduler Windows)

---