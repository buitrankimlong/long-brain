---
tags: [project, titanium-stock-backtesting-vn]
status: hoan-thanh
started: 2026-05-20
stack: [Python, pandas, numpy, ta, vnstock, ThreadPoolExecutor]
github: https://github.com/buitrankimlong/Projects/tree/main/02-trading-bots/titanium-stock
updated: 2026-05-20
---

# Titanium-Stock-Backtesting-VN

## Mo ta
Hệ thống backtesting chứng khoán VN: data crawler VN100 (2015-2025) + multi-strategy backtest (RSI, MACD, Bollinger) + grid search tham số + ThreadPoolExecutor song song. Vốn 100 triệu VND.

## Stack
- Python
- pandas
- numpy
- ta
- vnstock
- ThreadPoolExecutor

## Quyet dinh quan trong
1) Local CSV data (crawl trước, backtest sau — tránh API limit). 2) Grid search trên nhiều bộ tham số. 3) ThreadPoolExecutor cho backtest song song. 4) 100M VND initial capital.

## Source Code

titanium_backtest_kimlong.py:
```python
import pandas as pd, numpy as np, ta, os, time
from concurrent.futures import ThreadPoolExecutor, as_completed

DATA_FOLDER = "vnstock_data_2015_2025"
START_DATE = "2023-01-01"
END_DATE = "2025-12-29"
INITIAL_CAPITAL = 100_000_000  # 100 triệu VND

TICKER_LIST = ['ACB','FPT','HPG','MBB','MSN','MWG','SSI','TCB','VCB','VHM','VNM','VPB',...]

# Grid Search params
# Backtest strategies: RSI, MACD, Bollinger
# ThreadPoolExecutor for parallel processing
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/02-trading-bots/titanium-stock

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
