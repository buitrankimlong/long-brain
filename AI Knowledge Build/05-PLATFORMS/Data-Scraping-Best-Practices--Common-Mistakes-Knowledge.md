---
tags: [best-practices, gotchas, data-scraping, error-handling, performance, production-ready]
description: Data Scraping Best Practices & Common Mistakes
created: 2026-05-09
moc: "[[05 Nen Tang Chatbot]]"
---

## Data Scraping Best Practices & Common Mistakes

### 1. Progress Tracking (JSON, not Pickle)

**❌ Bad:**
```python
import pickle
with open('progress.pkl', 'wb') as f:
    pickle.dump(progress, f)  # Binary, not human-readable
```

**✅ Good:**
```python
import json
with open('progress.json', 'w') as f:
    json.dump(progress, f, ensure_ascii=False, indent=2)
    # Human-readable, debuggable, cross-platform
```

**Benefits:**
- Human-readable for debugging
- Can edit manually if needed
- Works across Python versions
- Safe to inspect mid-run

### 2. Resource Cleanup (Context Manager)

**❌ Bad:**
```python
file = open('data.csv', 'w')
# ... process 10K items
file.write(data)
# Forgot to close! → buffered data lost on crash
```

**✅ Good:**
```python
with open('data.csv', 'w') as f:
    for item in items:
        f.write(item)
        f.flush()  # Periodic flush for safety
```

**Pattern:**
- Context manager auto-close
- Explicit flush after batch
- No data loss on crash

### 3. Rate Limiting (Delays vs Semaphore)

**❌ Bad:**
```python
for url in urls:
    response = requests.get(url)  # No delay
    # Banned after 50 requests
```

**✅ Good:**
```python
import asyncio
import time
import random

# Strategy 1: Random delay
for url in urls:
    time.sleep(random.uniform(1, 3))
    response = requests.get(url)

# Strategy 2: Semaphore (async)
semaphore = asyncio.Semaphore(15)  # Max 15 concurrent
async with semaphore:
    response = await aiohttp.get(url)
```

**Choosing:**
- 1-10 requests: Delay only (simpler)
- 10+ concurrent: Semaphore (prevents hammering)
- API with strict limits: Both delay + semaphore

### 4. Encoding Issues (Multi-Encoding Read)

**❌ Bad:**
```python
with open('file.txt', 'r') as f:
    text = f.read()  # Crashes on non-UTF8
# UnicodeDecodeError!
```

**✅ Good:**
```python
for encoding in ['utf-8', 'utf-8-sig', 'cp1258', 'latin-1']:
    try:
        with open('file.txt', 'r', encoding=encoding) as f:
            text = f.read()
        break
    except UnicodeDecodeError:
        continue
else:
    logger.error(f"Cannot decode {file}")
```

**Order matters:**
1. utf-8: Standard
2. utf-8-sig: UTF-8 with BOM
3. cp1258: Vietnamese Windows
4. latin-1: Fallback (never fails, might be garbage)

### 5. Text Cleaning (Normalize Whitespace)

**❌ Bad:**
```python
name = "  Công Ty   ABC   Ltd  "  # Extra spaces
# Store as-is → comparison fails later
```

**✅ Good:**
```python
def clean_text(text):
    if not text:
        return ""
    # Remove extra whitespace
    text = " ".join(text.split())
    # Remove accents (for matching)
    text = remove_accents(text)
    # Lowercase
    text = text.lower().strip()
    return text

def remove_accents(text):
    import unicodedata
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join(c for c in nfkd if not unicodedata.combining(c))
```

### 6. CSV Writing (Buffered, Not Row-by-Row)

**❌ Bad:**
```python
with open('data.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=columns)
    writer.writeheader()
    for i, item in enumerate(items):
        writer.writerow(item)  # 100K writes → 100K I/O calls
```

**✅ Good:**
```python
class CsvBufferWriter:
    def __init__(self, batch_size=500):
        self.batch_size = batch_size
        self.buffer = {}  # filename -> rows list
    
    async def add_result(self, result, filename):
        # Add to memory buffer
        for table_name, rows in result.items():
            if table_name not in self.buffer:
                self.buffer[table_name] = []
            self.buffer[table_name].extend(rows)
        
        # Flush when buffer reaches size
        if len(self.buffer.get('users', [])) >= self.batch_size:
            await self.flush()
    
    async def flush(self):
        # One write per table (not per row)
        for table_name, rows in self.buffer.items():
            with open(f'{table_name}.csv', 'a', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=...)
                writer.writerows(rows)  # Bulk write
        self.buffer = {}
```

**Performance:**
- Row-by-row: 100K items → 100K file writes (slow)
- Buffered 500: 100K items → 200 file writes (100x faster)

### 7. Checkpoint Recovery (Mark as Done, Not Retry)

**❌ Bad:**
```python
# No checkpoint - restart entire job every time
for item in all_items:
    result = process(item)
    # Crash at item 50K - restart from item 1
```

**✅ Good:**
```python
class CheckpointManager:
    def __init__(self):
        self.done = set()
        self.failed = set()
        self.load()
    
    def is_done(self, filename):
        return filename in self.done or filename in self.failed
    
    def mark_success(self, filename):
        self.done.add(filename)
    
    def mark_failed(self, filename):
        self.failed.add(filename)
        # Failed files can be retried later
    
    def save(self):
        with open('checkpoint.json', 'w') as f:
            json.dump({
                'done': list(self.done),
                'failed': list(self.failed)
            }, f)
    
    def load(self):
        if os.path.exists('checkpoint.json'):
            with open('checkpoint.json', 'r') as f:
                cp = json.load(f)
            self.done = set(cp.get('done', []))
            self.failed = set(cp.get('failed', []))

# Usage
for item in all_items:
    if checkpoint.is_done(item.name):
        continue  # Skip, already processed
    
    try:
        result = process(item)
        checkpoint.mark_success(item.name)
    except Exception as e:
        checkpoint.mark_failed(item.name)
        logger.error(f"{item.name}: {e}")
```

**Impact:**
- No checkpoint: 100K items × 2h = 2h wasted on failure
- Checkpoint: Skip done items, resume from failure

### 8. Error Logging (Separate File, Not stdout)

**❌ Bad:**
```python
print(f"Error processing {filename}: {error}")
# Goes to stdout, lost in large logs, hard to find
```

**✅ Good:**
```python
# Separate error file
error_file = open('errors.log', 'a', encoding='utf-8', buffering=1)

def log_error(filename, reason):
    import datetime
    ts = datetime.datetime.now().isoformat()
    error_file.write(f"{ts} | {filename} | {reason}\n")
    error_file.flush()  # Immediate write

# Later: analyze errors
with open('errors.log') as f:
    errors = f.readlines()
    error_count = len(errors)
    print(f"Total errors: {error_count}")
```

**Benefits:**
- Errors in separate file (easy grep)
- Timestamp each error (debug timing)
- Line buffering (periodic flush)

### 9. Memory Management in VPS (Low RAM)

**❌ Bad:**
```python
# Load all 100K URLs in memory
all_urls = [fetch_all_urls()]  # 100MB list
for url in all_urls:
    data = scrape(url)  # Accumulate memory
# OOM crash at 50K
```

**✅ Good:**
```python
import gc
import psutil

def get_memory_percent():
    return psutil.virtual_memory().percent

# Stream processing
for url in fetch_urls_generator():  # Lazy-load one at a time
    data = scrape(url)
    
    if get_memory_percent() > 80:
        gc.collect()  # Force cleanup
    
    if get_memory_percent() > 90:
        logger.error("Memory critical, stopping")
        break

# Batch cleanup every N items
if i % 100 == 0:
    gc.collect()
```

### 10. Graceful Shutdown (Signal Handler)

**❌ Bad:**
```python
for item in items:
    process(item)
# Ctrl+C crashes abruptly → data loss
```

**✅ Good:**
```python
import signal
import asyncio

shutdown_event = asyncio.Event()

def handle_shutdown(signum, frame):
    logger.warning("Shutdown signal - cancelling pending tasks...")
    shutdown_event.set()

signal.signal(signal.SIGINT, handle_shutdown)

async def main():
    try:
        tasks = [process_item(item) for item in items]
        for coro in asyncio.as_completed(tasks):
            if shutdown_event.is_set():
                break
            await coro
    finally:
        # Cleanup: flush buffers, close files
        await csv_writer.flush()
        checkpoint.save()
        logger.info("Shutdown complete")

asyncio.run(main())
```

## Summary: The 10 Commandments

1. ✅ Use JSON for progress (human-readable)
2. ✅ Always use context managers (auto cleanup)
3. ✅ Rate limit: delay + semaphore
4. ✅ Handle multiple encodings (UTF-8, cp1258)
5. ✅ Clean text: normalize whitespace + remove accents
6. ✅ Buffer CSV writes (100x faster)
7. ✅ Checkpoint every 100-500 items (resume capability)
8. ✅ Log errors separately (easy analysis)
9. ✅ Monitor memory on VPS (gc.collect every 100 items)
10. ✅ Graceful shutdown (signal handler + finally block)