---
tags: [project, data-doanh-nghip---trangvang-pipeline]
status: hoan-thanh
started: 2026-04-01
client: ThongTinCty
stack: [Python, AsyncIO, DeepSeek API, aiohttp, CSV, Tenacity, Checkpoint/Resume, aiofiles]
updated: 2026-05-09
---

# Data Doanh Nghiệp - TrangVang Pipeline

## Mo ta
Pipeline xử lý 130,000 file txt từ trangvangvietnam.com dùng DeepSeek API để trích xuất và sinh dữ liệu. Xuất ra 7 file CSV: users, company_profiles, products_services, certificates, contacts, customers, cooperations. Hỗ trợ resume nếu bị interrupt với checkpoint system. Tối ưu cho concurrency cao (15-20 request song song) với connection pooling tốt.

## Stack
- Python
- AsyncIO
- DeepSeek API
- aiohttp
- CSV
- Tenacity
- Checkpoint/Resume
- aiofiles

## Quyet dinh quan trong
- Chọn DeepSeek API thay vì OpenAI (chi phí thấp hơn ~$49 USD cho 130k files) - Async/await pattern để handle 130k files song song - Connection pooling tối ưu: limit=20, limit_per_host=8, ttl_dns=300s - Buffer CSV với batch size 100 để giảm I/O - Checkpoint định kỳ mỗi 500 file để safety - Hỗ trợ encoding multi: utf-8, utf-8-sig, cp1258, latin-1

## Bai hoc rut ra
Quản lý 130k file cần async + connection pool tốt. Retry strategy với tenacity + exponential backoff. Checkpoint system đơn giản nhưng hiệu quả để resume. CSV writer cần buffer thay vì write từng row. Error logging riêng file để không làm tắc log chính. Resource cleanup (flush, close) bắt buộc phải dùng context manager.

## Ket qua
Code hoàn thành, ước tính 3-4h với 130k files. Chi phí ~$49. Hỗ trợ test mode, estimate cost, stats, retry. Output: 7 CSV files đầy đủ. CLI interface gọn (run.py estimate/test/start/stats/retry-failed). Graceful shutdown khi Ctrl+C.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

run.py:
```python
import pandas as pd
import re
import dns.resolver
import smtplib
import socket
import time
import random

def is_valid_format(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, str(email)) is not None

def is_email_active(email):
    try:
        domain = email.split('@')[1]
        records = dns.resolver.resolve(domain, 'MX')
        mx_record = str(records[0].exchange)
        
        server = smtplib.SMTP(timeout=5)
        server.set_debuglevel(0)
        
        server.connect(mx_record)
        # Bắt buộc: Khai báo một tên miền hợp lệ thay vì local_hostname để tăng độ uy tín
        server.helo('mail.google.com') 
        # Bắt buộc: Điền một email có thật của bạn vào đây
        server.mail('your_real_email@gmail.com') 
        code, message = server.rcpt(str(email))
        server.quit()
        
        if code == 250:
            return True
        return False
            
    except Exception:
        # Gộp chung các lỗi mạng/DNS để code ngắn gọn
        return False

def process_excel(input_file, output_file):
    print(f"Đang đọc dữ liệu từ {input_file}...")
    try:
        df = pd.read_excel(input_file)
    except FileNotFoundError:
        print("Lỗi: Không tìm thấy file Excel.")
        return

    if len(df.columns) < 10:
        print("Lỗi: File không có đủ 10 cột (cột J).")
        return
        
    email_col_name = df.columns[9]
    print(f"Bắt đầu lọc email tại cột '{email_col_name}'...\n")
    
    # Lọc bỏ hàng trống
    df = df.dropna(subset=[email_col_name])
    df = df[df[email_col_name].astype(str).str.strip() != '']
    
    valid_rows = []
    total_emails = len(df)
    processed_count = 0
    
    print(f"Bắt đầu kiểm tra {total_emails} email. Đã bật chế độ chống Block IP...")
    
    for index, row in df.iterrows():
        email = str(row[email_col_name]).strip()
        processed_count += 1
        
        if is_valid_format(email):
            if is_email_active(email):
                valid_rows.append(row)
                print(f"[{processed_count}/{total_emails}] [✓ HỢP LỆ] {email}")
            else:
                print(f"[{processed_count}/{total_emails}] [x CHẾT/LỖI] {email}")
        else:
            print(f"[{processed_count}/{total_emails}] [! SAI ĐỊNH DẠNG] {email}")
            
        # --- CƠ CHẾ CHỐNG BLOCK IP ---
        if processed_count < total_emails: # Không delay ở email cuối cùng
            # 1. Nghỉ giải lao sau mỗi đợt 50 emails
            if processed_count % 50 == 0:
                print("\n[HỆ THỐNG] Đã check xong 50 email. Tạm nghỉ 60 giây để tránh bị server mail chặn...")
```
