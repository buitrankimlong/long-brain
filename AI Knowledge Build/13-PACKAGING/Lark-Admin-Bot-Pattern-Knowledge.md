---
tags: [knowledge, lark, admin-bot, saas, no-code, multi-tenant]
description: Lark-Admin-Bot-Pattern
created: 2026-05-09
moc: "[[13 Dong Goi San Pham]]"
---

# Lark Admin Bot Pattern — AI Chatbot Quan Ly He Thong Noi Bo

## Tong quan
Pattern thiet ke cho phep khach hang (chu doanh nghiep, khong biet code) quan ly he thong AI agent thong qua chat tu nhien tren Lark. Thay vi build admin dashboard rieng, dung Lark Bitable lam database + admin UI, ket hop AI chatbot lam interface.

## Kien truc

```
Khach hang chat Lark Bot
        |
        v
  Webhook Server (/webhook/lark-bot)
        |
        v
  AI Admin Bot (v98/OpenAI API + tools)
        |
        v
  Lark API (CRUD tables, add fields, search records)
```

## 3 Bang Config Moi Brand

### 1. Cau hinh AI
| Field | Type | Mo ta |
|-------|------|-------|
| Ma | Text | sales_prompt, marketing_template, background_prompt |
| Loai | Single Select | Kich ban tu van / Template marketing / Prompt anh nen |
| Noi dung | Text | Toan bo prompt/template content |
| Dang dung | Checkbox | Active/inactive |

### 2. FAQ
| Field | Type | Mo ta |
|-------|------|-------|
| Chu de | Text | shipping, warranty, return, payment... |
| Tom tat | Text | 1 dong tom tat |
| Chi tiet | Text | Chi tiet (moi dong = 1 bullet) |
| Dang dung | Checkbox | Active/inactive |

### 3. Kien thuc
| Field | Type | Mo ta |
|-------|------|-------|
| Chu de | Text | Kim, Moc, cuu ngu, thach anh hong... |
| Phan loai | Single Select | Menh / De tai tranh / Loai da / Loai sim... |
| Noi dung | Text | JSON hoac plain text |
| Dang dung | Checkbox | Active/inactive |

## AI Admin Bot Tools (9 tools)

1. **search_products** — Tim san pham theo ten, trang thai
2. **update_product** — Sua gia, ten, trang thai san pham
3. **add_table_field** — Them cot moi vao bang Lark
4. **get_sales_report** — Bao cao doanh thu, so don
5. **read_config** — Doc prompt/FAQ/KB hien tai
6. **update_config** — Sua prompt/template
7. **manage_faq** — Them/sua/xoa FAQ
8. **search_customers** — Tim khach hang
9. **search_orders** — Tim don hang

## Cache Layer
- LarkConfigReader doc tu Lark + cache 10 phut
- Fallback ve file neu Lark API fail
- clearCache() khi admin update config

## Vi du chat

```
Khach: "Doi gia buc Hoa khai phu quy thanh 5 trieu"
Bot: [goi update_product] → "Da cap nhat gia thanh 5,000,000d"

Khach: "Thang nay ban duoc bao nhieu don?"
Bot: [goi get_sales_report] → "Thang 5: 12 don, doanh thu 45,600,000d"

Khach: "Them cot Mau sac vao bang Tranh"  
Bot: [goi add_table_field] → "Da them cot Mau sac (text) vao bang Tranh"
```

## Uu diem
- Khong can build admin UI rieng
- Khach dung Lark quen thuoc (spreadsheet-like)
- AI hieu ngon ngu tu nhien, khong can hoc commands
- Them brand moi = tao Lark Base + copy tables + dien config

## Nhuoc diem
- Phu thuoc Lark API (rate limit, uptime)
- Bao mat: API keys nen giu tren server (.env), khong de tren Lark
- Cache delay: thay doi tren Lark mat 10 phut moi co hieu luc



## Cap nhat 2026-05-11: DA LOAI BO ADMIN BOT

Admin Bot pattern da bi loai bo khoi du an Thuy Mac (2026-05-11).
- Ly do: He thong qua phuc tap, khach hang khong can chat bot de quan ly — sua truc tiep tren Lark Docs/Bitable de gian hon.
- Files da xoa: `lark-admin-bot.js`, `lark-bot-commands.js`, `lark-bot-ws.js`, route `/webhook/lark-bot`
- Thay the bang: Lark Docs (chu shop sua truc tiep FAQ, Knowledge, Kich ban) + Lark Bitable (xem data)
- Bai hoc: Non-tech users thich sua truc tiep tren giao dien quen thuoc (Docs/Table) hon la chat voi bot. Bot phu hop khi can automation, khong phu hop khi chi la CRUD don gian.




## Trang thai cuoi phien 2026-05-11

### Lark Resources (sau cleanup)
**12 Lark Docs trong 3 Drive Folders:**
- Thuy Mac (4): Kich ban, Marketing, FAQ (V3Rf...), Knowledge (Dil3...)
- Menh Ly (4): Kich ban, Marketing, FAQ (MUy0...), Knowledge (Ljw0...)
- Thai Van Ngoc (4): Kich ban, Marketing, FAQ (Idwp...), Knowledge (PnfN...)

**4 Lark Bases:** TM (9 bang), ML (9 bang), TVN (9 bang), Unified (1 bang)

**3 Telegram Bots:** @thuymacbot, @menhlybot, @thaivanngocbot

### Con thieu
- Tich hop lark-config-reader vao sales-agent-base + marketing-base
- Test chat tu van Telegram cho ML + TVN
