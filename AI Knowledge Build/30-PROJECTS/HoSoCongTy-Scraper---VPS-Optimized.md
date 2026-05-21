---
tags: [project, hosocongty-scraper---vps-optimized]
status: hoan-thanh
started: 2026-04-10
client: VPS Deployment
stack: [Python, Playwright, BeautifulSoup4, AsyncIO, Requests, psutil, Telegram Bot API, Scheduler, VPS-Optimized]
updated: 2026-05-09
---

# HoSoCongTy Scraper - VPS Optimized

## Mo ta
Web scraper dùng Playwright async + BeautifulSoup4 để crawl hsctvn.com (công ty thông tin). Tối ưu cho VPS yếu (2 CPU, 4GB RAM, 80GB SSD). Hỗ trợ 3 region: HCM, Hà Nội, Đà Nẵng. Có auto cleanup scheduler, memory monitor, Telegram notification. Output: CSV per region + progress JSON.

## Stack
- Python
- Playwright
- BeautifulSoup4
- AsyncIO
- Requests
- psutil
- Telegram Bot API
- Scheduler
- VPS-Optimized

## Quyet dinh quan trong
- Dùng Playwright async thay vì requests (handle JS, cookies) - Region-based scraping: HCM/HaNoi/DaNang → 3 CSV riêng - Memory monitor + auto cleanup scheduler để tránh OOM - Telegram notification cho progress + error alerts - Progress JSON để resume mượt - Graceful shutdown + resource cleanup (browser close)

## Bai hoc rut ra
VPS yếu cần async + memory monitor bắt buộc. Playwright headless mode tiết kiệm RAM hơn. BeautifulSoup4 nhanh hơn regex cho HTML parsing. psutil để track memory - nếu >80% RAM → cleanup, nếu >90% → stop. Region-based output dễ quản lý hơn file lớn. Telegram notification giúp monitor từ xa.

## Ket qua
Scraper hoàn thành, tối ưu cho VPS yếu. Crawl hsctvn.com 3 region → 3 CSV files + progress JSON. Auto memory cleanup. Telegram alerts. Hỗ trợ resume. Test email extraction riêng.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

start.py:
```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MAIN LAUNCHER - Khởi chạy ứng dụng scraper
Chỉ cần double-click để chạy!
"""

import sys
import os
import subprocess
from pathlib import Path

# Fix encoding cho Windows
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

def check_python():
    """Kiểm tra Python version"""
    if sys.version_info < (3, 8):
        print("❌ Lỗi: Cần Python 3.8+")
        print(f"   Phiên bản hiện tại: {sys.version}")
        input("Nhấn Enter để thoát...")
        sys.exit(1)
    
    print(f"✓ Python {sys.version.split()[0]} OK")

def check_dependencies():
    """Kiểm tra dependencies"""
    print("\n🔍 Kiểm tra dependencies...")
    
    required_packages = {
        'playwright': 'Playwright',
        'bs4': 'BeautifulSoup4',
        'requests': 'Requests',
        'psutil': 'PSUtil'
    }
    
    missing = []
    for package, name in required_packages.items():
        try:
            __import__(package)
            print(f"   ✓ {name}")
        except ImportError:
            print(f"   ❌ {name} - MISSING")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️  Thiếu dependencies!")
        print(f"\nVui lòng chạy file 'install_dependencies.bat' để cài đặt")
        input("Nhấn Enter để thoát...")
        sys.exit(1)
    
    print("✓ Tất cả dependencies sẵn sàng\n")

def run_system_cleanup():
    """Chạy dọn dẹp hệ thống trước scraping"""
    try:
        print("\n[2.5/4] Chạy dọn dẹp hệ thống...")
        sys.stdout.flush()
        
        script_dir = Path(__file__).parent
        cleanup_script = script_dir / "system_cleanup.py"
        
        if cleanup_script.exists():
            print("  Running system cleanup (this may take a minute)...")
            sys.stdout.flush()
            
            # Chạy cleanup
            result = subprocess.run(
                [sys.executable, "-u", str(cleanup_script)],
                cwd=str(script_dir),
                capture_output=False
            )
            
            if result.returncode == 0:
                print("✓ System cleanup completed successfully")
            else:
                print("⚠️  System cleanup encountered some issues (continuing anyway)")
```
