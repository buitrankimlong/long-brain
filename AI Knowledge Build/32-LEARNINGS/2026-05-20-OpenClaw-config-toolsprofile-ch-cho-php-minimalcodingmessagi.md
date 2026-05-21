---
tags: [learning, openclaw, config, validation, mcp]
date: 2026-05-20
project: "[[Trợ Lý Kim]]"
---

# OpenClaw config: tools.profile chỉ cho phép minimal/coding/messaging/full

## Boi canh
Khi rebuild OpenClaw config, set tools.profile = "assistant" gây lỗi validate. mcpServers cũng sai key — phải dùng mcp.servers

## Giai phap
tools.profile chỉ chấp nhận: minimal, coding, messaging, full. MCP servers config key là mcp.servers (không phải mcpServers). Dùng openclaw config validate trước khi start gateway.

## Duc ket
Luôn chạy openclaw config validate TRƯỚC khi gateway start. tools.profile = "full" cho personal assistant. MCP key = mcp.servers

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Trợ Lý Kim]]
