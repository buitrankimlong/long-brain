---
tags: [never-again, workflow, research, planning, build-process]
id: NA-002
date: 2026-05-17
---

# [NA-002] PHẢI deep research trước khi build bất kỳ hệ thống nào

## Sai lam
Nhảy vào code ngay khi nhận task mà không research kỹ trước. Không tìm hiểu kinh nghiệm người khác, giới hạn kỹ thuật, edge cases, và các điểm cần lưu ý. Build xong mới phát hiện approach sai hoặc không hoạt động.

## Hau qua
Build xong hệ thống nhưng không hoạt động, phải làm lại từ đầu. Mất thời gian, công sức. Ví dụ: build auto post FB Group bằng API mà không biết API đã bị xóa, hoặc build bằng Playwright mà không biết cần anti-detection → bị ban account ngay.

## Phong tranh
LUÔN LUÔN deep research TRƯỚC KHI viết dòng code đầu tiên:
1. WebSearch tìm kinh nghiệm người khác đã build tương tự
2. Tìm giới hạn kỹ thuật (API deprecated? Rate limit? Anti-bot?)
3. Tìm open source projects tham khảo trên GitHub
4. Liệt kê tất cả rủi ro và edge cases
5. So sánh các approach khả thi (ưu/nhược điểm)
6. Trình bày kết quả research cho user TRƯỚC → user quyết định hướng đi → MỚI code
7. Lưu kết quả research vào Longbrain bằng add_learning()

Quy trình: Research → Trình bày → User chọn hướng → Code

---
> Added: 2026-05-17 | Severity: HIGH
