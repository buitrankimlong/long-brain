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


## Source Code

run.py:
```python
import pandas as pd
import json
from datetime import datetime

def export_to_json_tables(input_csv):
    try:
        # 1. Đọc dữ liệu CSV
        df = pd.read_csv(input_csv, encoding='utf-8-sig')
        df.columns = [col.strip() for col in df.columns]
        df = df.fillna("") # Thay thế NaN bằng chuỗi rỗng

        users_list = []
        company_profiles_list = []
        
        # Giả định ID bắt đầu sau 7 bản ghi mẫu của bạn
        start_id = 8
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for index, row in df.iterrows():
            current_id = start_id + index
            
            # --- Xử lý cho bảng USERS ---
            user_entry = {
                "id": current_id,
                "username": str(row['Email']) if row['Email'] else str(row['Mã số thuế']),
                "password": "defaultsalt:Test@123defaultsalt",
                "business_name": str(row['Tên công ty']),
                "business_email": str(row['Email']),
                "tax_id": str(row['Mã số thuế']),
                "phone_number": str(row['Điện thoại']),
                "role": "user",
                "verified": False,
                "active": True if "hoạt động" in str(row['Trạng thái']).lower() else False,
                "created_at": current_time
            }
            users_list.append(user_entry)

            # --- Xử lý cho bảng COMPANY_PROFILES ---
            # Gộp địa chỉ từ các cột Phường, Quận, Thành Phố
            full_location = f"{row['Phường']}, {row['Quận']}, {row['Thành Phố']}".strip(", ")
            
            profile_entry = {
                "id": index + 1, # ID tự tăng của bảng profile
                "userId": current_id, # Khóa ngoại liên kết với bảng users ở trên
                "legalName": str(row['Tên công ty']),
                "companyAcronyms": str(row['Tên viết tắt']),
                "address": str(row['Địa chỉ thuế']),
                "location": full_location,
                "founders": str(row['Đại diện pháp luật']),
                "registerDate": str(row['Ngày cấp']),
                "updatedAt": current_time,
                "website": "", # CSV không có, để trống
                "main_industry": "" # Có thể map thêm nếu cần
            }
            company_profiles_list.append(profile_entry)

        # 2. Xuất file JSON cho Users
        with open('users_table.json', 'w', encoding='utf-8') as f:
            json.dump(users_list, f, ensure_ascii=False, indent=4)
            
        # 3. Xuất file JSON cho Company Profiles
        with open('company_profiles_table.json', 'w', encoding='utf-8') as f:
            json.dump(company_profiles_list, f, ensure_ascii=False, indent=4)

        print(f"✅ Đã tạo xong 2 file: 'users_table.json' và 'company_profiles_table.json'")
        print(f"📊 Xử lý thành công {len(df)} dòng dữ liệu.")

    except Exception as e:
        print(f"❌ Lỗi hệ thống: {e}")

if __name__ == "__main__":
    export_to_json_tables('Data_doanh_nghiep_FINAL.csv')
```
