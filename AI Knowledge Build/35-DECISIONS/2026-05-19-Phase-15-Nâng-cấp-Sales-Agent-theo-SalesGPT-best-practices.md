---
tags: [decision, architecture]
date: 2026-05-19
status: accepted
project: "[[Thuy Mac AI System]]"
---

# [Decision] Phase 15: Nâng cấp Sales Agent theo SalesGPT best practices

## Boi canh
Sales agent hiện tại: 3238 dòng monolith, dùng claude-opus-4-6 cho mọi thứ ($15/1M tokens), AI đôi khi hallucinate không gọi tool, gửi ảnh rời từng tin, không nhớ khách.

## Quyet dinh
Implement 4 cải thiện: (1) Telegram Media Group gallery, (2) Model routing Haiku/Sonnet thay Opus, (3) CRM local DB thay Lark, (4) Fallback gallery auto-fire khi AI không gọi tool. Theo pattern SalesGPT: tách stage analyzer riêng, RAG product search, config-driven persona.

## Phuong an da xem xet
A) Chuyển sang SalesGPT framework hoàn toàn (Python, LangChain) — overkill, phải rewrite toàn bộ. B) Dùng ManyChat/Chatfuel — không custom được AI tư vấn phong thủy. C) Giữ nguyên chỉ fix bugs — agent vẫn tệ.

## Ly do chon
Giữ Node.js codebase hiện tại, apply best practices từ SalesGPT (stage-aware, tool-calling, RAG). Tiết kiệm 80% chi phí AI bằng model routing. Telegram media group cho UX mượt hơn. CRM local cho response nhanh hơn.

## Trade-offs
Cần sửa nhiều file (sales-agent-base, telegram-client, messenger, admin-panel). Mất 1 session để implement. Nhưng sau khi xong hệ thống sẽ production-ready.

---
> Date: 2026-05-19 | Status: Accepted
> Project: [[Thuy Mac AI System]]
