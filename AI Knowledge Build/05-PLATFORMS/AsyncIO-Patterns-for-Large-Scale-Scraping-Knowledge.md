---
tags: [asyncio, scraping, concurrency, aiohttp, patterns, best-practices]
description: AsyncIO Patterns for Large Scale Scraping
created: 2026-05-09
moc: "[[05 Nen Tang Chatbot]]"
---

## AsyncIO Patterns for Large Scale Scraping

### 1. Connection Pooling + TCPConnector

```python
connector = aiohttp.TCPConnector(
    limit=config.CONCURRENCY + 5,      # max 20 connections overall
    limit_per_host=8,                  # max 8 per host
    ttl_dns_cache=300,                 # 5 min DNS cache
    tcp_keepalive=True,
)
timeout = aiohttp.ClientTimeout(total=60, connect=10, sock_read=30)

async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
    # Use session
```

**Key tuning:**
- `limit`: CONCURRENCY + 5 (buffer)
- `limit_per_host`: 8 (API server usually allows)
- `ttl_dns_cache=300`: Reduce DNS lookups
- `tcp_keepalive=True`: Prevent connection timeout

### 2. Semaphore for Rate Limiting

```python
self.semaphore = asyncio.Semaphore(config.CONCURRENCY)

async def _process_file(self, filepath):
    async with self.semaphore:
        # Only N tasks can run concurrently
        result = await extractor.extract(content)
```

**Why:** Prevents overwhelming API (rate limit protection).

### 3. Checkpoint + Resume

```python
# Save after N files
if total_done - self._last_checkpoint >= config.CHECKPOINT_EVERY:
    self.checkpoint.save()  # JSON file
    self._last_checkpoint = total_done
```

**Benefits:**
- Resume from failure (not restart)
- Monitor progress
- Cost estimation

### 4. Graceful Shutdown

```python
def _handle_shutdown(signum, frame):
    """Handle Ctrl+C gracefully"""
    for task in list(_pending_tasks):
        if not task.done():
            task.cancel()
```

**Pattern:**
1. Signal handler cancels all pending tasks
2. Finally block cleanup (flush, close)
3. Save checkpoint before exit

### 5. Buffer Writing (Batch Insert)

```python
# Write 100 files, then flush CSV
if len(self.buffer) >= config.BATCH_SIZE:
    await self.flush()  # Bulk write
```

**vs Row-by-Row:**
- Buffered: 1 I/O per 100 rows → 1000 I/O total
- Row-by-row: 100,000 I/O → 100x slower

### 6. Error Handling + Retry

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=2, max=10)
)
async def extract(self, content):
    # Retry 3x: wait 2, 4, 8 seconds
```

## Best Practices

1. **Connection Pool > Single Connection:** 3-5x faster
2. **Batch Operations:** Buffer 100-500 before flush
3. **Checkpoint Every 500-1000:** Balance safety + I/O
4. **Semaphore Concurrency:** Match API rate limits (not CPU cores)
5. **Error Log Separate:** Don't pollute stdout
6. **Graceful Shutdown:** Always cleanup resources
7. **Progress Tracking:** JSON file (not pickle)

## Gotchas

- Windows: "Too many open files" → limit per_host
- DNS caching: ttl_dns_cache=300 recommended
- Timeout too short: Connection reset errors
- No checkpoint: Full restart on failure
- Memory leak: Not closing session/connector