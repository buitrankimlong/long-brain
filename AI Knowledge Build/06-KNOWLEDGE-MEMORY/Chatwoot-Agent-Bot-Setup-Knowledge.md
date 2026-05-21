---
tags: [chatwoot, agent-bot, webhook, facebook, inbox]
description: Chatwoot-Agent-Bot-Setup
created: 2026-05-14
moc: "[[06 RAG va Bo Nho AI]]"
---

# Chatwoot Agent Bot — Hướng dẫn Setup Đầy Đủ

## Tổng quan luồng

```
FB Messenger → Chatwoot (inbox) → Agent Bot webhook → Our server → AI reply → Chatwoot API → FB
```

## Tìm inbox_id

**Cách 1 — Qua UI:**
Settings → Inboxes → click vào inbox cần lấy → nhìn URL trình duyệt:
`/app/accounts/1/settings/inboxes/5/collaborators` → inbox_id = **5**

**Cách 2 — Qua API:**
```bash
curl -H "api_access_token: YOUR_TOKEN" \
  https://app.chatwoot.com/api/v1/accounts/{account_id}/inboxes
```
Response: `{ payload: [{ id: 5, name: "Thủy Mạc FB", channel_type: "Channel::FacebookPage", ... }] }`

## Tìm account_id

URL dashboard: `https://app.chatwoot.com/app/accounts/1/...` → account_id = **1**

## Lấy API token

Profile → Access Token (góc trên phải, click avatar)

## Tạo Agent Bot

```bash
curl -X POST \
  -H "api_access_token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Thuymac Bot", "outgoing_url": "https://YOUR_NGROK/webhook/chatwoot"}' \
  https://app.chatwoot.com/api/v1/accounts/{account_id}/agent_bots
```

Response trả về `id` = bot_id

## Link bot vào inbox

```bash
curl -X POST \
  -H "api_access_token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agent_bot": BOT_ID}' \
  https://app.chatwoot.com/api/v1/accounts/{account_id}/inboxes/{inbox_id}/set_agent_bot
```

Response: 204 No Content = thành công

## Unlink bot

Gửi `{"agent_bot": null}` cùng endpoint trên.

## Chatwoot gọi webhook của chúng ta với format:

```json
{
  "event": "message_created",
  "message_type": "incoming",
  "message": { "id": 123, "content": "Xin chào" },
  "conversation": { "id": 456, "inbox_id": 5 },
  "sender": { "id": 789, "name": "Nguyễn Văn A" },
  "account": { "id": 1 }
}
```

## Chúng ta reply về Chatwoot bằng:

```
POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
{
  "content": "Chào bạn!",
  "message_type": "outgoing",
  "private": false
}
```

## Lưu ý

- Agent Bot KHÔNG hiện trong UI Settings → Integrations trên Chatwoot Cloud free plan
- Phải tạo và manage qua API
- inbox_id khác với inbox_identifier (identifier dùng cho API Channel, id dùng cho Facebook/Telegram inboxes)
- Mỗi inbox chỉ link được 1 agent bot
- Khi bot xử lý xong 1 conversation, có thể handover sang human bằng cách gọi toggle_status API
- Bot nhận TẤT CẢ message trong inbox đó (kể cả khi agent đang reply → cần filter)
