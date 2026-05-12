---
tags: [deepseek, llm-api, data-extraction, cost-optimization, prompt-engineering]
description: DeepSeek API for Data Extraction
created: 2026-05-09
moc: "[[05 Nen Tang Chatbot]]"
---

## DeepSeek API for Data Extraction

### 1. Configuration Tuning

```python
# Conservative (low hallucination)
MODEL = "deepseek-chat"
MAX_TOKENS = 2000
TEMPERATURE = 0.3

# Generous (full extraction)
MODEL = "deepseek-chat"
MAX_TOKENS = 4096
TEMPERATURE = 0.7
```

**Temperature Impact:**
- 0.3: Repetitive, safe, predictable
- 0.5: Balanced
- 0.7: Diverse, creative, more hallucination risk

**MAX_TOKENS:**
- 2000: ~1-2 pages of output, cost ~$0.00038/request
- 4096: ~2-4 pages, cost ~$0.00075/request
- 130K files × $0.00075 = ~$97.5 (vs $49 at 2000 tokens)

### 2. Cost Estimation

```python
# Per file estimation
avg_input_tokens = 500  # text input
avg_output_tokens = 1500  # extracted data

# Pricing: $0.14/1M input, $0.28/1M output
cost_per_file = (avg_input_tokens * 0.14 + avg_output_tokens * 0.28) / 1_000_000
cost_per_file ≈ 0.00047

# 130K files
total_cost = 130_000 * 0.00047 ≈ $61 USD
```

### 3. Prompt Engineering

**System Prompt (consistent):**
```
Bạn là chuyên gia trích xuất dữ liệu từ text tài liệu công ty.
Trích xuất thông tin chính xác. Nếu thông tin không có, trả về null.
Output JSON format.
```

**User Prompt (per file):**
```
Trích xuất từ text sau:
- Tên công ty
- Địa chỉ
- Website
- Người liên hệ
- Sản phẩm/dịch vụ
- Chứng chỉ
- Khách hàng tiêu biểu

Text:
{content}

Trả về JSON.
```

### 4. Structured Output (JSON Schema)

```python
# Force JSON output
system_prompt = """
Output JSON format strictly:
{
  "company_name": "...",
  "address": "...",
  "products": [...],
  "contacts": [...]
}
"""

# Fallback JSON parsing if malformed
try:
    result = json.loads(api_response)
except:
    # Try extract JSON from response
    match = re.search(r'\{.*\}', api_response, re.DOTALL)
    if match:
        result = json.loads(match.group())
```

### 5. Retry Strategy with Tenacity

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=2, max=10),
    reraise=True
)
async def extract(self, content):
    async with self.session.post(
        f"{self.base_url}/chat/completions",
        json=payload,
        timeout=aiohttp.ClientTimeout(total=60)
    ) as resp:
        if resp.status == 429:  # Rate limit
            raise Exception("Rate limited")
        return await resp.json()
```

**Backoff:**
- Attempt 1: fail
- Attempt 2: wait 2s
- Attempt 3: wait 4s
- Give up: exception

### 6. Rate Limiting

```python
# API quota: ~100 requests/min
CONCURRENCY = 15  # Conservative
RETRY_MIN_WAIT = 2
RETRY_MAX_WAIT = 10

# Semaphore ensures max 15 concurrent
async with self.semaphore:
    result = await self.extract(content)
```

### 7. Error Handling

```python
async def extract(self, content, filename):
    """Extract with comprehensive error handling"""
    try:
        # Truncate if too long (API limits)
        if len(content) > 8000:
            content = content[:8000]
        
        response = await self._call_api(content)
        
        if not response or 'choices' not in response:
            logger.error(f"{filename}: Invalid response format")
            return None
        
        return response['choices'][0]['message']['content']
    
    except asyncio.TimeoutError:
        logger.error(f"{filename}: Timeout after 60s")
        return None
    except Exception as e:
        logger.error(f"{filename}: {type(e).__name__}: {e}")
        return None
```

### 8. Output Validation

```python
# After extracting, validate JSON
def validate_extraction(result_str):
    try:
        data = json.loads(result_str)
        
        # Check required fields
        if not data.get('company_name'):
            return None  # Incomplete
        
        # Sanitize
        data['company_name'] = data['company_name'].strip()
        
        return data
    except json.JSONDecodeError:
        return None
```

## Best Practices

1. **Token budgeting:** 2000 tokens standard, 4096 for detailed extraction
2. **Temperature tuning:** Start 0.3, increase if output too generic
3. **Prompt clarity:** Specify format, examples, required fields
4. **Retry exponential backoff:** 2, 4, 8s prevents rate limit hammering
5. **Timeout realistic:** 60s total (API can be slow)
6. **Input truncation:** Cap at 8000 chars if needed
7. **Error logging detailed:** Log filename + error reason
8. **Cost monitoring:** Track tokens spent per file
9. **JSON validation:** Parse + check required fields
10. **Checkpoint often:** Save progress every 100-500 files

## Gotchas

- Temperature 0.7 can produce hallucinated data (10-15% bad rows)
- MAX_TOKENS too low → truncated output
- Rate limit 429: exponential backoff prevents ban
- JSON parse error: API sometimes returns markdown ```json
- Timeout 30s default → API slower at peak hours
- No retry → single transient error loses whole batch
- Accumulate errors without logging → hard to debug

## Cost Saving Tips

1. **Template matching:** Try regex before API for simple data
2. **Prompt reuse:** Cache system prompt
3. **Batch requests:** Group 5 files into 1 request (if format allows)
4. **Lower temperature:** 0.3 saves 10-15% via less retry