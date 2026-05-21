---
tags: [project, web-scraping-shops]
status: hoan-thanh
started: 2026-01-10
stack: [Python, aiohttp, selectolax, asyncio, orjson, tqdm.asyncio, uvloop]
updated: 2026-05-09
---

# Web-Scraping-Shops

## Mo ta
Hệ thống crawl website thương mại điện tử với async/await. Bao gồm: (1) Sitemap Finder - tìm sitemap.xml tự động. (2) Download Sitemap - tải danh sách URL từ sitemap. (3) Check Sitemap - kiểm tra URL còn sống. (4) Filter Sitemap - lọc URL theo pattern (domain, path). (5) Auto Scraper - crawl nội dung song song, dùng selectolax parser, lưu output JSON/TXT. Hỗ trợ 200 concurrent global, max 20/domain (chống block IP).

## Stack
- Python
- aiohttp
- selectolax
- asyncio
- orjson
- tqdm.asyncio
- uvloop

## Quyet dinh quan trong
- Async I/O (aiohttp) thay vì requests sync → handle 200 concurrent requests cùng lúc\n- Giới hạn 20 request/domain → chống bị block IP, rate limit\n- selectolax parser thay vì BeautifulSoup → nhanh 5-10x (C bindings) nhưng nhẹ hơn lxml\n- orjson thay vì json module → 3-5x nhanh cho serialize/deserialize JSON\n- uvloop (nếu Linux) → tăng hiệu suất event loop, Windows fallback sang asyncio mặc định\n- Sitemap → URL list → Batch crawl 5000 URLs → Flush JSON mỗi 100 URLs (chống OOM)\n- Selector config: separate file per site (YAML/JSON), dễ thêm site mới

## Bai hoc rut ra
- Windows không support uvloop → try/except để fallback asyncio, tránh crash\n- Timeout tối đa 30s per request → phải handle timeout exception, retry với exponential backoff\n- Rate limit per domain rất quan trọng → nếu skip rule thì IP bị block 1-7 ngày\n- HTML parser: selectolax dùng css selector (nhanh), không support XPath → phải custom handler\n- Cleanup text: remove emoji, extra newlines, normalize whitespace → dữ liệu sạch hơn\n- JSON streaming (flush mỗi 100 rows) thay vì load all in memory → tránh OOM cho dataset khủng\n- TEST_MODE=True cho 10 URL test trước production crawl

## Ket qua
✅ Crawl website thương mại triệu URLs nhanh, hiệu quả. Output: JSON lines với title, description, price, stats. Scalable: dễ thêm site, điều chỉnh selector, tăng concurrency. Performance: 100 URLs/s (3.6M URLs/ngày với 4 process).

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

Anomize.py:
```python
import ahocorasick
import json
import unicodedata
import re
from tqdm import tqdm
from collections import defaultdict
import os
from pathlib import Path

# --- CÁC HÀM CƠ BẢN ---
# (Không thay đổi)
def normalize_text(s: str) -> str:
    """Chuẩn hóa Unicode + lowercase + strip"""
    if not isinstance(s, str):
        return ""
    return unicodedata.normalize("NFC", s).lower().strip()

def is_valid_name(name: str):
    """Chỉ nhận tên có từ 3 đến 5 từ."""
    parts = name.strip().split()
    return 3 <= len(parts) <= 5

def load_names(name_file):
    """Đọc name.txt và lọc các tên hợp lệ."""
    try:
        with open(name_file, "r", encoding="utf-8-sig") as f:
            raw_names = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"❌ Lỗi: Không tìm thấy file '{name_file}'.")
        return []
    names = [name for name in raw_names if is_valid_name(name)]
    if not names:
        print(f"⚠️ Cảnh báo: Đã load 0 tên hợp lệ (3-5 từ) từ {name_file}.")
    else:
        print(f"✅ Đã load {len(names)} tên hợp lệ (3-5 từ) từ {name_file}")
    return names

def build_name_automaton(names):
    """Tạo automaton từ danh sách tên."""
    A = ahocorasick.Automaton()
    if not names: return A
    for name in names:
        norm = normalize_text(name)
        if norm: A.add_word(norm, ("NAME", name))
    A.make_automaton()
    return A

# --- CÁC HÀM ẨN DANH PII ---
# (Không thay đổi)
PII_PATTERNS = {
    "PHONE_CONTEXT": r'(?i)\b(?:SĐT|Hotline|Phone|Tel|Số điện thoại)\s*[:.]?\s*(\d[\d\s.-]{8,15}\d)\b',
    "BANK_ACCOUNT": r'(?i)(?:số tài khoản|stk)\s*[:.]?\s*(\b\d{8,16}\b)',
    "ID_NUMBER": r'(?i)(?:số CCCD|CCCD|số CMND|CMND|số định danh)\s*[:.]?\s*(\b(?:\d{9}|\d{12})\b)',
    "TAX_CODE": r'(?i)(?:mã số thuế|mst)\s*[:.]?\s*(\b\d{10}(?:-\d{3})?\b)',
    "PHONE": r'\b(?:(?:0|84|\+84)?\s?\(?\d{2,4}\)?[\s.-]?\d{3}[\s.-]?\d{3,4}\b|1[89]00[\s.-]?\d{4,6})\b',
    "EMAIL": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "URL": r'\b(?:https?:\/\/|www\.)(?:[a-zA-Z0-9-]+\.)+[a-zA-Z0-9-.]+(?:\/[^\s]*)?',
    "ADDRESS": r'(?i)(?:địa chỉ|đ/c|dc)\s*:\s*(.+?)(?=\n|Hotline|Website|Điện thoại|ĐT|SĐT|$)'
}

def find_pii_with_regex(text):
    found_matches = []
    pattern_order = ["PHONE_CONTEXT", "BANK_ACCOUNT", "ID_NUMBER", "TAX_CODE", "PHONE", "EMAIL", "URL", "ADDRESS"]
    for pii_type_key in pattern_order:
        pattern = PII_PATTERNS.get(pii_type_key)
        if not pattern: continue
        pii_type = pii_type_key.split('_')[0]
        try:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                if match.groups():
                    start, end = match.span(1)
                    value = match.group(1).strip()
                else:
                    start, end = match.span(0)
                    value = match.group(0).strip()
                if value: found_matches.append((start, end, ("REGEX", pii_type, value)))
        except re.error as e: print(f"Lỗi regex với mẫu {pii_type_key}: {e}")
    return found_matches

# --- CÁC HÀM XỬ LÝ CHÍNH ---
```
