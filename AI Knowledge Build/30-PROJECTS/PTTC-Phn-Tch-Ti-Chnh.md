---
tags: [project, pttc-phn-tch-ti-chnh]
status: hoan-thanh
started: 2026-04-01
stack: [Python, python-docx, Decimal (high-precision math), lxml]
updated: 2026-05-09
---

# PTTC-Phân-Tích-Tài-Chính

## Mo ta
Công cụ phân tích tài chính Vinamilk (PTTC): tạo bài tiểu luận Word hoàn chỉnh từ dữ liệu BCTC (Báo cáo Tài chính). Hỗ trợ kiểm tra tính chính xác của các công thức tính toán (doanh thu, lợi nhuận, ratio) + so sánh với dữ liệu file. Xuất report chi tiết với bảng biểu, trích dẫn chính xác.

## Stack
- Python
- python-docx
- Decimal (high-precision math)
- lxml

## Quyet dinh quan trong
Dùng Decimal thay float để tránh sai số làm tròn trong phân tích tài chính. Hardcode dữ liệu BCTC gốc + dữ liệu file để so sánh. Kiểm tra từng công thức: CP TC không lãi vay = CP TC tổng - Lãi vay; LN gộp = DT thuần - GVHB; LN bán hàng = LN gộp - CP BH - CP QLDN; vv. Xuất Word document định dạng chuẩn: Times New Roman, margins 3cm-2cm, line spacing 1.5, các heading dùng built-in style để hỗ trợ TOC. Tạo bảng với background color + cell shading.

## Bai hoc rut ra
Decimal cần import từ decimal module. python-docx API: set font, margins, heading level, table cell formatting cần parse XML. Tiêu đề dùng add_heading() để hỗ trợ TOC (Table of Contents) tự động. Kiểm tra công thức tài chính phức tạp — phải so sánh từng giá trị và loại lỗi tính toán. Word document bị lỗi encoding nếu không fix sys.stdout = TextIOWrapper(... encoding='utf-8'). Bảng trong docx cần set col widths tường minh.

## Ket qua
create_report.py tạo file Word tiêu luận hoàn chỉnh (cover + mục lục + các section phân tích). check_bckqkd.py kiểm tra 10+ công thức tính toán từ BCTC, so sánh dữ liệu gốc vs file, in ra báo cáo TEXT. Có thể chạy riêng hoặc tích hợp. Sai số tài chính được phát hiện ngay lập tức. Hoạt động ổn định trên Windows + Linux.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
