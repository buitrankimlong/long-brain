---
tags: [project, dhan-bot-indian-stock-trading]
status: hoan-thanh
started: 2026-05-20
stack: [Python, Flask, Flask-SocketIO, PyInstaller, Dhan API, Telegram Bot API, tkinter]
github: https://github.com/buitrankimlong/Projects/tree/main/02-trading-bots/dhan-bot
updated: 2026-05-20
---

# Dhan-Bot-Indian-Stock-Trading

## Mo ta
Bot giao dịch chứng khoán Ấn Độ (Dhan API): Flask web UI + SocketIO real-time + PyInstaller build. Có Telegram alerts, auto scanning, paper trading.

## Stack
- Python
- Flask
- Flask-SocketIO
- PyInstaller
- Dhan API
- Telegram Bot API
- tkinter

## Quyet dinh quan trong
1) Flask + SocketIO cho real-time web UI. 2) PyInstaller cho desktop distribution. 3) Threading cho Flask server + trading engine song song. 4) tkinter messagebox cho error alerts.

## Source Code

main.py:
```python
import sys, os, threading
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
from dotenv import load_dotenv
load_dotenv()

if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS
else:
    base_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, template_folder=os.path.join(base_dir, 'templates'))
app.config['SECRET_KEY'] = 'your_very_secret_key_delta!'
socketio = SocketIO(app, async_mode='threading')

from utils.logger import setup_logging
from core import dhan_client, engine, scheduler, alerting
import auth

log = setup_logging()
dhan = None; core_engine = None
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/02-trading-bots/dhan-bot

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
