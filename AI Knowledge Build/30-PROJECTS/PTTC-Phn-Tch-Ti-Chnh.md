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


## Source Code

check_bckqkd.py:
```python
from decimal import Decimal, ROUND_HALF_UP

# =============================================
# SO LIEU GOC TU BCTC KIEM TOAN
# =============================================
DT_thuan_24 = Decimal('61782609528445')
DT_thuan_25 = Decimal('63645886756227')
GVHB_24     = Decimal('36192433205321')
GVHB_25     = Decimal('37436412561696')
DT_TC_24    = Decimal('1585660836067')
DT_TC_25    = Decimal('1496851902188')
CP_TC_24    = Decimal('428238548859')
CP_TC_25    = Decimal('350234100207')
Lai_vay_24  = Decimal('279424561295')
Lai_vay_25  = Decimal('325804350407')
CTLK_24     = Decimal('32002663848')
CTLK_25     = Decimal('-150558017656')
CP_BH_24    = Decimal('13357706796806')
CP_BH_25    = Decimal('13641689163684')
CP_QLDN_24  = Decimal('1827916838987')
CP_QLDN_25  = Decimal('1904069825709')
LN_khac_24  = Decimal('5676102948')
LN_khac_25  = Decimal('-9789764525')
LNtT_24     = Decimal('11599653741335')
LNtT_25     = Decimal('11649985224938')
Thue_24     = Decimal('2146760751387')
Thue_25     = Decimal('2236395492469')
LNST_24     = Decimal('9452892989948')
LNST_25     = Decimal('9413589732469')

# =============================================
# GIA TRI TRONG FILE (bang chenh lech)
# =============================================
file_CP_TC_khlv_24  = Decimal('148813987564')
file_CP_TC_khlv_25  = Decimal('24429749800')
file_LN_go_24       = Decimal('25590176323124')
file_LN_go_25       = Decimal('26209474194531')
file_LN_BH_24       = Decimal('10404552687331')
file_LN_BH_25       = Decimal('10663715205138')
file_LN_TC_24       = Decimal('1436846848503')
file_LN_TC_25       = Decimal('1472422152388')
file_EBIT_24        = Decimal('11879078302630')
file_EBIT_25        = Decimal('11975789575345')
file_LNtT_24        = Decimal('11599653741335')
file_LNtT_25        = Decimal('11649985224938')
file_LNST_24        = Decimal('9452892989948')
file_LNST_25        = Decimal('9413589732469')

file_cl_DT       = Decimal('1863277227782')
file_cl_GVHB     = Decimal('1243979356375')
file_cl_LNgo     = Decimal('619297871407')
file_cl_CPBH     = Decimal('283982366878')
file_cl_CPQLDN   = Decimal('76152986722')
file_cl_LNBH     = Decimal('259162517807')
file_cl_DTTC     = Decimal('-88808933879')
file_cl_CPTCkhlv = Decimal('-124384237764')
file_cl_LNTC     = Decimal('35575303885')
file_cl_CTLK     = Decimal('-182560681504')
file_cl_LNkhac   = Decimal('-15465867473')
file_cl_EBIT     = Decimal('96711272715')
file_cl_laivay   = Decimal('46379789112')
file_cl_LNtT     = Decimal('50331483603')
file_cl_thue     = Decimal('89634741082')
file_cl_LNST     = Decimal('-39303257479')

print("=" * 70)
print("KIEM TRA BANG CHENH LECH BCKQKD")
print("=" * 70)

# [1] CP TC khong lai vay
calc_CP_TC_khlv_24 = CP_TC_24 - Lai_vay_24
calc_CP_TC_khlv_25 = CP_TC_25 - Lai_vay_25
ok1_24 = calc_CP_TC_khlv_24 == file_CP_TC_khlv_24
ok1_25 = calc_CP_TC_khlv_25 == file_CP_TC_khlv_25
print("\n[1] CP TC khong lai vay = CP TC tong - Lai vay")
print("    2024: tinh = {:,} | file = {:,} -> {}".format(calc_CP_TC_khlv_24, file_CP_TC_khlv_24, 'DUNG' if ok1_24 else 'SAI'))
print("    2025: tinh = {:,} | file = {:,} -> {}".format(calc_CP_TC_khlv_25, file_CP_TC_khlv_25, 'DUNG' if ok1_25 else 'SAI'))
print("    KIEM TRA 1: {}".format('DUNG' if (ok1_24 and ok1_25) else 'SAI'))

# [2] LN gop
```
