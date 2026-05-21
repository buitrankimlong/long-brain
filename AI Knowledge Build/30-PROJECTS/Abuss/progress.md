# Abuss — Progress Log

## 2026-05-20
### Da lam
- [ ] Khoi tao project

### Van de / Blockers
- Khong co

### Ke hoach ngay mai
- [ ] 

---

## 2026-05-20
### Da lam
- [x] Phase 15: Sales Agent v4 — rewrite hoàn toàn bằng TypeScript + AI SDK v6 + Chat SDK
- [x] Scaffold project ai-system-v2/: package.json, tsconfig.json, ecosystem.config.js
- [x] Core libs: redis, admin-api, flow-state, knowledge, faq, vietqr, semantic-search, conversation-history, debounce
- [x] Brand configs: brands.ts (3 brands), env.ts (env validation)
- [x] 19 tools defined inline trong agent.ts với Zod inputSchema — native function calling
- [x] Agent core: generateText() + stopWhen: stepCountIs(10) + onStepFinish logging
- [x] Chat SDK: 3 Telegram adapters + Redis state + onNewMention/onSubscribedMessage
- [x] TypeScript compile CLEAN, build OK, bot startup thành công (3 bots connected)

### Blockers
- BUG: adapter name mapping — Chat SDK trả 'telegram' thay vì 'thuymac' → processMessage skip
- Chưa test end-to-end: bot nhận message nhưng routing sai → AI chưa chạy
- Admin Panel (localhost:3002) chưa test kết nối từ v2

### Tiep theo
- [ ] Fix adapter name mapping: getBrandByToken() hoặc map từ bot userId → brandConfig
- [ ] Test end-to-end: gửi message → AI respond → gallery images
- [ ] Deploy lên VPS: tar+scp, PM2 start
- [ ] Migrate ML + TVN brands

---
## 2026-05-20
### Da lam
- [x] Fix adapter name mapping — Chat SDK thread không có adapterName, dùng adapter instance reference comparison + botUserId fallback
- [x] Phát hiện v98 API KHÔNG hỗ trợ native tool calling — strip toàn bộ tools param
- [x] Rewrite agent.ts sang text-based tool calling: tools mô tả trong system prompt, AI output <tool_call> tags, parse + execute + loop (max 8 steps)
- [x] Robust tool call parser — handle XML tags, hybrid format, code blocks, extra braces, depth-based JSON extraction
- [x] Clean response: strip [nghĩ] tags (kể cả typos), strip tool_call blocks
- [x] Fix @ai-sdk/openai v3 gửi tới /responses — chuyển sang .chat() cho /chat/completions
- [x] Fix file path resolve (__dirname double-up)
- [x] Tạo test-buyer.ts — AI buyer simulator 8 personas random (rushed_mom, curious_uncle, skeptical_youth, grandma, bulk_buyer, tire_kicker, angry_customer, impulse_buyer)
- [x] 5 test runs thành công — tools execute đúng, conversation flow hợp lý, response 5-15s/turn
- [x] Fix .env ADMIN_PANEL_URL trỏ VPS cho local dev
- [x] Fix TypeScript compile errors (ModelMessage content type, template literal backticks)
- [x] Kill stale local node processes gây Telegram polling conflict

### Blockers
- v98 API không hỗ trợ native tool calling — phải dùng text-based (chậm hơn, 2 API calls/tool)
- Sản phẩm trên admin panel chưa có ảnh → images=0 trong test
- Telegram E2E chưa test — cần user gửi tin nhắn thật vào bot

### Tiep theo
- [ ] Test Telegram E2E — user gửi tin nhắn vào @thuymacbot khi bot local chạy
- [ ] Deploy ai-system-v2 lên VPS (tar+scp, PM2)
- [ ] Test ML + TVN brands (menhly, thaivangoc)
- [ ] Upload ảnh sản phẩm lên admin panel để test gallery images
- [ ] Cân nhắc: dùng Anthropic API key trực tiếp để có native tool calling (nhanh hơn, chính xác hơn)

---
### [AUTO] 2026-05-20 12:39:17
```bash
cd "C:/Abuss" && npm list xlsx 2>/dev/null || npm install xlsx --no-save 2>&1 | tail -3
```
> {"stdout":"C:\\Abuss\n└── (empty)\n\n\nadded 9 packages in 2s","stderr":"","interrupted":false,"isImage":false,"noOutputExpected":false}


### [AUTO] 2026-05-20 12:40:00
```bash
cd "C:/Abuss" && npm list form-data 2>/dev/null || npm install form-data --no-save 2>&1 | tail -3
```
> {"stdout":"C:\\Abuss\n└── (empty)\n\n\n5 packages are looking for funding\n  run `npm fund` for details","stderr":"","interrupted":false,"isImage":false,"noOutputExpected":false}


### [AUTO] 2026-05-20 12:40:37
```bash
cd "C:/Abuss" && npm install axios form-data --no-save 2>&1 | tail -3 && node scripts/upload-tranh.js 2>&1
```
> {"stdout":"6 packages are looking for funding\n  run `npm fund` for details\n📋 13 tranh có ảnh từ products.json\n\n🗄️  14 SP cũ trong DB\n\n--- XÓA SP CŨ KHÔNG CÓ ẢNH ---\n  🗑️  Xóa: Hoa Sen\n  ...


### [AUTO] 2026-05-20 12:53:57
```bash
cd "C:/Abuss" && npm list sharp 2>/dev/null || npm install sharp --no-save 2>&1 | tail -3
```
> {"stdout":"C:\\Abuss\n└── (empty)\n\n\n2 packages are looking for funding\n  run `npm fund` for details","stderr":"","interrupted":false,"isImage":false,"noOutputExpected":false}


### [AUTO] 2026-05-20 13:00:13
```bash
cd "C:/Abuss" && npm install axios sharp form-data --no-save 2>&1 | tail -3 && node scripts/create-product-images.js 2>&1
```
> {"stdout":"","stderr":"","interrupted":false,"isImage":false,"noOutputExpected":false,"backgroundTaskId":"bixyiss4b","assistantAutoBackgrounded":false}


### [AUTO] 2026-05-21 02:57:16
```bash
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@46.250.225.12 "pm2 list && echo '---REDIS---' && redis-cli ping && echo '---NGROK---' && curl -s http://localhost:4040/api/tunnels 2>/dev/n...
```
> {"stdout":"┌────┬─────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐\n│ id │ name                    │ na...


### [AUTO] 2026-05-21 04:45:44
```bash
mkdir -p ~/.claude/session-data
```
> {"stdout":"","stderr":"","interrupted":false,"isImage":false,"noOutputExpected":true}

