---
tags: [project, x-l-mst-b-thiu---fetch--validate]
status: hoan-thanh
started: 2026-04-15
client: MST Completion
stack: [Python, AsyncIO, aiohttp, lxml, stdnum.vn, JSON Cache, Regex, Unicode Normalization]
updated: 2026-05-09
---

# Xử Lý MST Bị Thiếu - Fetch + Validate

## Mo ta
Async Python script để fetch mã số thuế (MST) bị thiếu từ danh sách công ty HCM. Dùng lxml, aiohttp, stdnum.vn.mst để validate MST. Hỗ trợ name matching (similarity 60%), cache JSON, mismatch tracking. Handle 30 concurrent requests, retry 2x. Output: users_updated.json, mst_cache.json, mst_mismatches.json, fetch_mst.log.

## Stack
- Python
- AsyncIO
- aiohttp
- lxml
- stdnum.vn
- JSON Cache
- Regex
- Unicode Normalization

## Quyet dinh quan trong
- Async + aiohttp cho 30 concurrent requests - Name matching threshold = 0.6 (60% similarity) - Normalize name: remove accents, lowercase, strip - Regex pre-compile cho RE_MST_LABEL, RE_TAXID_JSON, RE_NAME_JSON - Cache JSON để avoid duplicate requests - Mismatch tracking: name khớp nhưng MST khác → log lại - Retry count = 2 với exponential backoff

## Bai hoc rut ra
Unicode normalization (remove accents) bắt buộc để match tên Việt. Name similarity threshold 0.6 balance precision/recall. Regex pre-compile giúp tốc độ. aiohttp session pooling + TCPConnector limit. Cache save mỗi 200 requests để safe. Mismatch detect: name match nhưng MST khác = potential data error. Logging JSON format dễ parse.

## Ket qua
Fetch MST hoàn thành. Validate 1000s công ty → users_updated.json. Name matching + MST validation. Cache hit rate ~60%. Mismatch report chi tiết. Log file debug info. Ready production.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

fetch_mst.py:
```python
import asyncio
import csv
import json
import re
import os
import logging
import time
import unicodedata

import aiohttp
from lxml import html as lxml_html
from stdnum.vn.mst import is_valid as is_valid_mst, compact as compact_mst
from tqdm import tqdm

# --- Config ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, "danh_sach_cong_ty_HCM.csv")
USERS_FILE = os.path.join(BASE_DIR, "users.json")
OUTPUT_FILE = os.path.join(BASE_DIR, "users_updated.json")
CACHE_FILE = os.path.join(BASE_DIR, "mst_cache.json")
MISMATCH_FILE = os.path.join(BASE_DIR, "mst_mismatches.json")
LOG_FILE = os.path.join(BASE_DIR, "fetch_mst.log")

MAX_CONCURRENT = 30
REQUEST_TIMEOUT = 12
RETRY_COUNT = 2
CACHE_SAVE_EVERY = 200
CONN_LIMIT = 50

PLATFORM_MST = "0104478506"
NAME_MATCH_THRESHOLD = 0.6  # ty le tu trung khop toi thieu de chap nhan

# Regex compile 1 lan
RE_TAXID_JSON = re.compile(r'"taxID"\s*:\s*"(\d{10,13})"')
RE_NAME_JSON = re.compile(r'"name"\s*:\s*"([^"]+)"')
RE_MST_LABEL = re.compile(
    r'(?:MÃ\s*SỐ\s*THUẾ|Mã\s*số\s*thuế|MST|Tax\s*(?:ID|Code))\s*[:\-]?\s*(\d{10,13})',
    re.IGNORECASE
)

# --- Logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)


# ============================================================
# CACHE
# ============================================================
def load_cache():
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    tmp = CACHE_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)
    os.replace(tmp, CACHE_FILE)


# ============================================================
# NAME SIMILARITY - xac minh ten cong ty
# ============================================================
def remove_accents(text):
    """Bo dau tieng Viet: Công Ty -> Cong Ty."""
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in nfkd if not unicodedata.combining(c))


def normalize_name(name: str) -> str:
    name = remove_accents(name).lower().strip()
```
