---
tags: [learning, facebook, graph-api, permissions, comment, pages_manage_engagement]
date: 2026-05-13
project: "[[Thong-Tin-Thue-Luat-Kinh-Doanh]]"
---

# Facebook comment 403: cần quyền pages_manage_engagement

## Boi canh
Đăng ảnh lên Facebook Page thành công, nhưng page tự comment vào post của mình bị lỗi 403 "You do not have sufficient permissions".

## Giai phap
Token cần thêm quyền `pages_manage_engagement` khi generate tại Graph API Explorer. Token từ project Tình Báo AI không có quyền này. Token Thái Vận Ngọc (project Abuss) có đủ quyền — dùng cái đó để test.

## Duc ket
Khi page muốn comment vào post của chính mình qua API: cần cả pages_manage_posts + pages_manage_engagement. Luôn kiểm tra permissions trước khi build publisher.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Thong-Tin-Thue-Luat-Kinh-Doanh]]
