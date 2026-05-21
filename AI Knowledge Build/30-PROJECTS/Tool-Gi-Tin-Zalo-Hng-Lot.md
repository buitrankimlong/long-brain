---
tags: [project, tool-gi-tin-zalo-hng-lot]
status: hoan-thanh
started: 2026-05-09
stack: [Python 3.10+, PyAutoGUI, Tkinter, PIL/Pillow, Pandas, Excel (XLSX)]
updated: 2026-05-09
---

# Tool Gửi Tin Zalo Hàng Loạt

## Mo ta
Tool tự động gửi tin nhắn hàng loạt qua Zalo PC bằng cách tự động hóa bằng PyAutoGUI. Đọc danh sách khách từ Excel, cấu hình tọa độ các phần tử UI (ô tìm kiếm, khách hàng, ô chat) qua giao diện GUI Tkinter, sau đó tự động click, gõ, và gửi tin nhắn cho từng khách với random delay 5-6 giây giữa các lần để tránh bị chặn

## Stack
- Python 3.10+
- PyAutoGUI
- Tkinter
- PIL/Pillow
- Pandas
- Excel (XLSX)

## Quyet dinh quan trong
Dùng PyAutoGUI + Pyperclip để tự động hóa UI (click, gõ, paste) vì Zalo không cung cấp API công khai; Tạo setup_tool.py để cấu hình tọa độ các phần tử UI với giao diện visual (vẽ hình chữ nhật trên ảnh screenshot); Tính toán scaling factor để tọa độ hoạt động đúng trên màn hình khác nhau; Sử dụng failsafe (kéo chuột về góc) để dừng khẩn cấp; Random delay giữa các tin để tránh detection

## Bai hoc rut ra
PyAutoGUI yêu cầu app mục tiêu (Zalo) phải ở foreground và fullscreen; Tọa độ mouse phải được cấu hình riêng cho mỗi màn hình vì độ phân giải khác nhau; Cần scaling factor để quy đổi từ tọa độ ảnh (đã resize) sang tọa độ thật; Excel cần read với dtype={'column_name': str} để tránh lỗi số điện thoại bị convert thành float; Random delay 5-6s là cân bằng tốt giữa tốc độ & an toàn

## Ket qua
Hoàn thành: 2 scripts chính (setup_tool.py + zalo_auto.py), 1 file dữ liệu mẫu (data_khach_hang.xlsx), folder steps chứa 3 ảnh hướng dẫn bước. Quá trình: cấu hình tọa độ 1 lần (tự động fullscreen, vẽ trên ảnh), sau đó chạy bot để gửi tin hàng loạt. Ready sử dụng, có failsafe & error handling

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

> **NOTE:** Source code CHỈ trên PC nhà. Tool desktop dùng PyAutoGUI.
> Cần SSH vào PC nhà (100.87.190.39) để lấy source code.
