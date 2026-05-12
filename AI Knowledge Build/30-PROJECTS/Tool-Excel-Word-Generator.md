---
tags: [project, tool-excel-word-generator]
status: hoan-thanh
started: 2026-05-09
stack: [Python 3, pandas, openpyxl, JSON]
updated: 2026-05-09
---

# Tool-Excel-Word-Generator

## Mo ta
Tool Python tự động tạo Excel, Word reports từ dữ liệu CSV. 2 script chính: (1) run.py - convert CSV dữ liệu doanh nghiệp → 2 bảng JSON (Users + Company Profiles); (2) create_expense_report.py - generate Expense Reimbursement Report Excel đẹp (Navy blue header, gradient fills, formulas tính VND từ USD, subtotals).

## Stack
- Python 3
- pandas
- openpyxl
- JSON

## Quyet dinh quan trong
- Xử lý CSV encoding UTF-8-sig + trim column names để tránh whitespace\n- Map CSV columns → JSON schema (Users: id, username, email, tax_id; CompanyProfiles: legalName, acronyms, founders)\n- Excel styling: PatternFill (Navy, Light Blue, Gray), Border (thin/thick), Font (Arial/Bold), Alignment (center/left/right)\n- Formula Excel: VND = Amount * Exchange_Rate (E12) cho USD items\n- Subtotal by category (Infrastructure vs AI/API), Grand Total merge cells\n- Freeze panes B15, print landscape fit-to-page

## Bai hoc rut ra
openpyxl styling: PatternFill solid + hex colors (không 0x), Border dùng Side objects, merge_cells cần exact row/column ranges, formulas dùng string = f\"=H15+H16+...\", number_format '#,##0' cho VND, '#,##0.00' cho USD decimal.

## Ket qua
2 scripts vận hành, tạo được 2 JSON tables + 1 Expense Report Excel chuyên nghiệp (8 expense lines, subtotals, approval signatures).

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
