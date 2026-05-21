---
tags: [learning, openclaw, telegram, config, authentication, v98store]
date: 2026-05-20
project: "[[Trợ Lý Kim]]"
---

# OpenClaw Telegram: PHẢI có channels.telegram.botToken trong openclaw.json

## Boi canh
Bot Telegram cũ của OpenClaw bị lỗi "Could not resolve authentication method" từ Anthropic SDK. Nguyên nhân: config chỉ có plugins.entries.telegram.enabled=true nhưng KHÔNG có channels.telegram.botToken. Thêm ANTHROPIC_API_KEY env var system level + channels.telegram config đầy đủ mới fix.

## Giai phap
Config đúng cần CẢ HAI: (1) channels.telegram với botToken, dmPolicy, allowFrom; (2) plugins.entries.telegram.enabled=true. Đồng thời set ANTHROPIC_API_KEY và ANTHROPIC_BASE_URL ở system level env var cho scheduled task. Khi đổi config cần force kill gateway + xóa sessions.json để tránh cache cũ.

## Duc ket
OpenClaw Telegram cần: channels.telegram.botToken (bắt buộc) + plugins.entries.telegram.enabled. Nếu dùng custom provider (v98store), set ANTHROPIC_API_KEY ở system env var. Sau khi đổi config: gateway stop → taskkill node.exe → delete sessions.json → gateway start.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Trợ Lý Kim]]
