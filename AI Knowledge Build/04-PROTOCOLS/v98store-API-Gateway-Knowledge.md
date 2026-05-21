---
tags: [v98store, api-gateway, openai-compatible, claude, gemini, multi-provider, vietnam]
description: v98store-API-Gateway
created: 2026-05-15
moc: "[[04 Giao Thuc MCP A2A]]"
---

# v98store — Third-party AI API Gateway

> Source: C:/Abuss/v98 API Document/ (đọc trực tiếp, May 2026)
> QUAN TRỌNG: Đây là API gateway của user Long. MỌI project phải dùng v98store thay vì Anthropic/OpenAI trực tiếp.

## v98store là gì?

**v98store** là third-party API gateway tương thích OpenAI format, cho phép truy cập 568+ model AI (Claude, GPT, Gemini, DeepSeek, Flux, Midjourney...) qua **1 API key duy nhất**.

- **Base URL**: `https://v98store.com` (hoặc `/v1` cho OpenAI-compat)
- **Auth**: `Authorization: Bearer sk-your-v98-key`
- **Dùng OpenAI SDK bình thường**, chỉ đổi `base_url`

## Quick Start Python

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-your-v98-key",
    base_url="https://v98store.com/v1"
)

# Chat với bất kỳ model nào
response = client.chat.completions.create(
    model="claude-sonnet-4-6",   # hoặc gpt-4o, gemini-2.5-pro...
    messages=[{"role": "user", "content": "Hello"}],
    max_tokens=1000
)
```

## Claude qua v98store (2 cách)

### Native Anthropic SDK:
```python
from anthropic import Anthropic
client = Anthropic(
    api_key="sk-your-v98-key",
    base_url="https://v98store.com"  # KHÔNG có /v1
)
message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system="...",
    messages=[{"role": "user", "content": "Hello"}]
)
```

### OpenAI-compat (base_url có /v1):
```python
client = OpenAI(api_key="sk-your-v98-key", base_url="https://v98store.com/v1")
```

## Claude models khả dụng

| Model ID | Tên |
|---|---|
| `claude-sonnet-4-6` | Claude Sonnet 4.6 (khuyến nghị) |
| `claude-opus-4-6` | Claude Opus 4.6 (flagship, $5/$25 per 1M) |
| `claude-sonnet-4-5-20250929` | Sonnet 4.5 |
| `claude-haiku-4-5-20251001` | Haiku 4.5 (rẻ nhất) |
| `claude-sonnet-4-6-thinking` | Sonnet 4.6 + extended thinking |

## Claude Code setup với v98store

Set 2 env vars:
```bash
ANTHROPIC_BASE_URL=https://v98store.com
ANTHROPIC_AUTH_TOKEN=sk-your-v98-key
```

Windows persistent:
```powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "https://v98store.com", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "sk-your-v98-key", "User")
```

## OpenClaw setup với v98store

Config file: `C:\Users\<user>\.clawdbot\clawdbot.json`

```json
{
  "models": {
    "providers": {
      "api-proxy-claude": {
        "baseUrl": "https://v98store.com",
        "api": "anthropic-messages",
        "models": [
          { "id": "claude-sonnet-4-6", "name": "Claude Sonnet 4.6", "contextWindow": 200000, "maxTokens": 8192 }
        ]
      },
      "api-proxy-gpt": {
        "baseUrl": "https://v98store.com/v1",
        "api": "openai-completions",
        "models": [
          { "id": "gpt-4o", "name": "GPT-4o", "contextWindow": 128000, "maxTokens": 8192 }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "api-proxy-claude/claude-sonnet-4-6" }
    }
  }
}
```

Auth file: `C:\Users\<user>\.clawdbot\agents\main\agent\auth-profiles.json`
```json
{
  "version": 1,
  "profiles": {
    "api-proxy-claude:default": { "type": "api_key", "provider": "api-proxy-claude", "key": "sk-your-v98-key" },
    "api-proxy-gpt:default": { "type": "api_key", "provider": "api-proxy-gpt", "key": "sk-your-v98-key" }
  }
}
```

## Lưu ý quan trọng

- **baseUrl cho Anthropic/Google**: `https://v98store.com` (KHÔNG có /v1)
- **baseUrl cho OpenAI-compat**: `https://v98store.com/v1` (CÓ /v1)
- **Luôn test API trước khi build** (yêu cầu của user Long)
- URL ảnh Replicate/Flux expire sau **1 giờ** → download về storage ngay
- 568 model: 360 chat, 106 image, 70 video, 27 audio
- File đầy đủ: `C:/Abuss/v98 API Document/`



## API Key của Long (lưu vĩnh viễn)

```
V98_API_KEY=sk-rdysXFstsySd1RqSc33OfP4tCQXqGneOK00e5Ob8G6ACXyk9
```

Dùng key này cho tất cả project. Không cần hỏi lại.
