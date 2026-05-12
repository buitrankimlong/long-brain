---
tags: [project, ai-marketing-sales-3-brands]
status: dang-lam
started: 2026-04-01
client: Buitrankimlong (owner)
stack: [Node.js 24, PM2, Lark Suite (CRM/Database - 16+ bảng), v98store API (OpenAI-compat), OpenClaw Agent Framework, Facebook Graph API, Playwright (FB Groups posting), VietQR + SePay (thanh toán), Bull + Redis + Redlock (queue/lock), ngrok (webhook tunnel), Sharp (image processing), Contabo VPS (46.250.225.12)]
updated: 2026-05-09
---

# AI-Marketing-Sales-3-Brands

## Mo ta
Hệ thống AI Marketing & Sales tự động cho 3 thương hiệu phong thủy: Thủy Mạc (tranh vẽ tay), Mệnh Lý (SIM số đẹp), Thái Vận Ngọc (trang sức đá). Core engine dùng chung, mỗi brand 1 config. Tự động: nhận tin nhắn FB → AI Sales Agent trả lời → tạo đơn → xác nhận thanh toán → CRM Lark. Marketing agent tự đăng bài FB Groups. Followup agent chăm sóc khách cũ. Analytics agent báo cáo tự động.

## Stack
- Node.js 24
- PM2
- Lark Suite (CRM/Database - 16+ bảng)
- v98store API (OpenAI-compat)
- OpenClaw Agent Framework
- Facebook Graph API
- Playwright (FB Groups posting)
- VietQR + SePay (thanh toán)
- Bull + Redis + Redlock (queue/lock)
- ngrok (webhook tunnel)
- Sharp (image processing)
- Contabo VPS (46.250.225.12)

## Quyet dinh quan trong
1. Config-driven architecture: Core engine dùng chung, brand = config file, không hardcode brand logic trong core.
2. Lark Suite làm CRM thay vì dùng DB riêng — tận dụng UI có sẵn cho user thao tác.
3. v98store API (OpenAI-compat) thay vì gọi trực tiếp OpenAI — giá rẻ hơn, hỗ trợ nhiều model.
4. Sales Agent v3: Flow State Tracker (14 state nodes), Knowledge Base JSON phong thủy, 17 tools, embeddings + semantic search, Mem0-style memory, message debouncing 4s.
5. SePay webhook thay Casso cho payment confirmation tự động.
6. Go-Live channel: đang cân nhắc Zalo OA thay FB vì lo ngại FB Business Verification.

## Bai hoc rut ra
1. Lark API DateTime phải convert ISO → milliseconds, không dùng ISO string.
2. FB Webhook cần xử lý debouncing vì user hay gửi nhiều tin liên tiếp — gom 4s rồi mới reply.
3. AI prompt cần rewrite nhiều lần (3+ lần cho Thủy Mạc) để tone tự nhiên, không cảm thán quá mức.
4. E2E test với 9 persona giúp phát hiện 12+ bugs trước deploy.
5. Strip [nghĩ] tag phải handle robust vì AI đôi khi quên đóng tag.
6. Knowledge Base JSON per brand hiệu quả hơn hardcode trong prompt — dễ maintain, dễ extend.
7. Flow State machine giúp AI agent không bị lạc flow khi conversation dài.

## Ket qua
Phase 0-7 hoàn thành (code + E2E local). Phase 8 (Go-Live) tạm dừng chờ quyết định kênh. Phase 9 (VPS Deploy) đang setup Contabo. Chờ: sim templates PNG, Lark Automation rules, FB Webhook URL config.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
