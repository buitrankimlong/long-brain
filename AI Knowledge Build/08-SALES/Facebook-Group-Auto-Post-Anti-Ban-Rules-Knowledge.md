---
tags: [facebook, automation, anti-ban, chrome-extension, mbasic, spintax, posting-limits]
description: Facebook Group Auto Post Anti-Ban Rules
created: 2026-05-17
moc: "[[08 Ban Hang Tu Dong]]"
---

# Facebook Group Auto Post - Quy Tắc Anti-Ban 2026

## GIỚI HẠN POSTING THEO TUỔI ACCOUNT

| Tuổi account | An toàn/ngày | Nguy hiểm |
|---|---|---|
| < 3 tháng | 3-7 groups | >15 → restrict |
| 3-6 tháng | 35-50 groups | >50 → shadowban |
| 12+ tháng | ~100 groups | >100 → 72% bị ban |

## 10 QUY TẮC VÀNG CHỐNG BAN

### 1. Spintax bắt buộc (60-70% unique)
```
{Xin chào|Hello|Hi} {mọi người|các bạn}!
{Mình|Tôi} muốn {chia sẻ|giới thiệu|thông báo}...
```
Facebook 2026 dùng content fingerprinting nâng cao — near-duplicate cũng bị bắt.

### 2. Random delay giữa mỗi post
- Minimum: 45 giây
- Recommended: 2-5 phút  
- Optimal: 10-15 phút (50 groups ≈ 8-12 giờ, trông tự nhiên nhất)
- **KHÔNG BAO GIỜ dùng fixed interval** (VD: đúng 60s mỗi lần = bot pattern)

### 3. Warm-up account mới (8 tuần)
- Tuần 1-2: 2-3 groups/ngày, tương tác thủ công (like, comment)
- Tuần 3-4: 5-7 groups/ngày
- Tuần 5-6: 10-15 groups/ngày
- Tuần 7-8: 20-30 groups/ngày
- Sau 8 tuần: tăng dần lên max theo tuổi account

### 4. Đợi sau khi join group
- **48-72 giờ** sau khi join group MỚI trước khi post bài đầu tiên
- Nên like/comment vài bài trong group trước khi tự post

### 5. Rotate group list
- Không post cùng set groups mỗi ngày
- Chia groups thành 3-4 nhóm, rotate theo ngày
- Mỗi group chỉ nhận post 1 lần / 3-4 ngày

### 6. IP và thiết bị
- **Chạy trên IP nhà** — KHÔNG dùng cloud server, VPN, proxy lạ
- Dùng Chrome profile thật (có history, bookmarks...)
- Chrome Extension = an toàn nhất (không có webdriver flag)

### 7. Hành vi tự nhiên giữa các post
- Scroll feed trước khi post
- Hover vào vài bài viết
- Đôi khi like 1-2 bài trong group
- Gõ chữ từng ký tự (không paste cả block)
- Random "thinking pause" khi gõ

### 8. Nội dung tránh
- Không spam link quá nhiều (1 link/post max)
- Không dùng URL shortener (bit.ly, tinyurl...)
- Không post ảnh giống hệt nhau (Facebook hash ảnh)
- Tránh các từ trigger: "miễn phí", "giảm giá", "click ngay"...

### 9. Thời gian post
- Post trong giờ hoạt động bình thường: 7AM-10PM
- Không post lúc 2-5 AM (bất thường)
- Chia đều trong ngày, không post dồn 1 lúc

### 10. Xử lý khi bị restrict
- **DỪNG NGAY** mọi automation
- Đợi hết thời gian restrict (24h - 30 ngày)
- Sau khi hết restrict: warm-up lại từ đầu (2-3 groups/ngày)
- Giảm 50% so với mức trước khi bị restrict

## SHADOWBAN
- Tự hết sau 1-4 tuần nếu dừng vi phạm
- Dấu hiệu: engagement giảm đột ngột, bài không ai thấy
- Post >50/ngày bằng bot → 72% bị shadowban

## KỸ THUẬT: mbasic.facebook.com
- DOM thuần HTML, không React SPA
- Selector ổn định, ít thay đổi
- Form submit thay vì contenteditable
- Nhẹ hơn, load nhanh hơn
- Nhược điểm: có thể bị Meta deprecate trong tương lai
