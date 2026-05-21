---
tags: [learning, facebook, graph-api, groups, deprecated, publish_to_groups]
date: 2026-05-14
project: "[[Facebook Automation]]"
---

# Facebook Groups API deprecated hoàn toàn từ Apr 2024 — không còn publish_to_groups

## Boi canh
Muốn xây hệ thống auto-post lên Facebook Group qua Graph API. Tìm permission publish_to_groups.

## Giai phap
Không có giải pháp API hợp lệ. Groups API bị xóa hoàn toàn từ 22/04/2024 trên tất cả phiên bản Graph API. Chỉ còn cách đăng tay hoặc browser automation (vi phạm ToS).

## Duc ket
Đừng bao giờ hứa với client về auto-post Facebook Group qua API — không khả thi. Chuyển sang Fanpage hoặc dùng browser automation với rủi ro rõ ràng.

## Code mau
```
// publish_to_groups permission - REMOVED from all Graph API versions since April 22, 2024
// No replacement API exists
// Only options: manual posting or ToS-violating browser automation
```

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Facebook Automation]]
