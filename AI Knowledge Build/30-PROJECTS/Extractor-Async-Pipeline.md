---
tags: [project, extractor-async-pipeline]
status: hoan-thanh
started: 2026-05-20
stack: [Python, AsyncIO, aiohttp, aiofiles, DeepSeek API, tqdm, CSV buffer, Checkpoint/Resume]
github: https://github.com/buitrankimlong/Projects/tree/main/01-scraping-tools/extractor
updated: 2026-05-20
---

# Extractor-Async-Pipeline

## Mo ta
Pipeline async xử lý 130K+ text files: đọc song song, gọi DeepSeek API extract data, ghi CSV có buffer, checkpoint + resume. Optimized cho Windows.

## Stack
- Python
- AsyncIO
- aiohttp
- aiofiles
- DeepSeek API
- tqdm
- CSV buffer
- Checkpoint/Resume

## Quyet dinh quan trong
1) Async pipeline với Semaphore control concurrency. 2) Checkpoint manager auto-save mỗi N files (resume khi crash). 3) CSV buffer writer (không ghi từng dòng). 4) Signal handler cho graceful shutdown. 5) Error log riêng cho failed files.

## Bai hoc rut ra
Windows 'too many open files' fix bằng context managers. API rate limit dùng tenacity exponential backoff. 130K files cần checkpoint system bắt buộc. Graceful shutdown: cancel pending tasks + flush buffer.

## Source Code

pipeline.py:
```python
"""Pipeline async: đọc file, gọi API, ghi CSV, checkpoint"""
import asyncio, logging, signal
from pathlib import Path
import aiofiles, aiohttp
from tqdm.asyncio import tqdm
from extractor import DeepSeekExtractor
from csv_writer import CsvBufferWriter
from checkpoint import CheckpointManager

_pending_tasks = set()

class Pipeline:
    def __init__(self):
        self.checkpoint = CheckpointManager()
        self.csv_writer = CsvBufferWriter()
        self.semaphore = asyncio.Semaphore(config.CONCURRENCY)
        self._success_count = 0
        self._failed_count = 0

    async def process_file(self, filepath, session):
        async with self.semaphore:
            text = await aiofiles.open(filepath, 'r').read()
            result = await self.extractor.extract(session, text)
            self.csv_writer.write_row(result)
            self.checkpoint.mark_done(filepath)

    async def run(self):
        signal.signal(signal.SIGINT, _handle_shutdown)
        files = self.checkpoint.get_remaining_files()
        async with aiohttp.ClientSession() as session:
            tasks = [self.process_file(f, session) for f in files]
            await tqdm.gather(*tasks)
        self.csv_writer.flush()
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/01-scraping-tools/extractor

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
