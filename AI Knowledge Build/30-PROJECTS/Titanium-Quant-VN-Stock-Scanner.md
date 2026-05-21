---
tags: [project, titanium-quant-vn-stock-scanner]
status: hoan-thanh
started: 2026-05-20
stack: [Python, vnstock, pandas, ta (technical analysis), Poisson model]
github: https://github.com/buitrankimlong/Projects/tree/main/02-trading-bots/titanium-quant
updated: 2026-05-20
---

# Titanium-Quant-VN-Stock-Scanner

## Mo ta
Robot quét VN100 chứng khoán Việt Nam: phân tích Market Regime (VNINDEX MA200), quét technical indicators (RSI, MACD, Bollinger), xếp hạng cổ phiếu, xuất CSV.

## Stack
- Python
- vnstock
- pandas
- ta (technical analysis)
- Poisson model

## Quyet dinh quan trong
1) Hardcode VN100 list (tránh lỗi listing API). 2) vnstock VCI source. 3) 3 modules: Market Regime → Stock Scanner → Ranking. 4) 0.5s delay giữa API calls.

## Source Code

main.py:
```python
import pandas as pd, ta
from vnstock import Vnstock
from datetime import datetime, timedelta

vn100_list = ['AAA','ACB','ANV','FPT','HPG','MBB','MSN','MWG','PNJ','SSI','TCB','VCB','VHM','VIC','VNM','VPB',...]

def get_data_safe(symbol):
    stock = Vnstock().stock(symbol=symbol, source='VCI')
    return stock.quote.history(start=start_date_long, end=end_date)

# MODULE 1: Market Regime (VNINDEX MA200)
df_index = get_data_safe('VNINDEX')
df_index['MA200'] = df_index['close'].rolling(window=200).mean()
regime = "BULL" if idx_price > idx_ma200 else "BEAR"

# MODULE 2: Stock Scanner (RSI, MACD, Bollinger)
# MODULE 3: Ranking & Export CSV
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/02-trading-bots/titanium-quant

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
