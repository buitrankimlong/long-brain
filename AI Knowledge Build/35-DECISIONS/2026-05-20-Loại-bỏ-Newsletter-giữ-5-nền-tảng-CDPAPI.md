---
tags: [decision, architecture]
date: 2026-05-20
status: accepted
project: "[[He-thong-theo-doi-content-da-kenh]]"
---

# [Decision] Loại bỏ Newsletter, giữ 5 nền tảng CDP+API

## Boi canh
Hệ thống ban đầu có 6 nền tảng gồm Newsletter (RSS+HTML archive). Newsletter có 11 sources nhưng 7/11 cần HTML scraper riêng, The Batch 0 articles, Ben's Bites 403.

## Quyet dinh
Loại bỏ Newsletter hoàn toàn. Giữ 5 nền tảng: Reddit (JSON API), YouTube (yt-dlp), X/Twitter (CDP), LinkedIn (CDP), Facebook (CDP). Thêm Facebook fanpage support.

## Phuong an da xem xet
1. Giữ Newsletter chỉ với 4 RSS sources hoạt động. 2. Viết HTML scraper riêng cho từng newsletter.

## Ly do chon
1. Newsletter chiếm nhiều effort maintenance nhưng ít giá trị (nội dung tương tự AI news trên X/Reddit). 2. HTML scraper fragile, mỗi site cần selector riêng. 3. Tập trung vào 5 platforms có ROI cao hơn với ~118 sources.

## Trade-offs
Mất nguồn newsletter chuyên sâu (Import AI, One Useful Thing). Có thể thêm lại sau nếu cần.

---
> Date: 2026-05-20 | Status: Accepted
> Project: [[He-thong-theo-doi-content-da-kenh]]
