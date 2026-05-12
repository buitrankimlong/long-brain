---
tags: [learning, lark-config-reader, sales-agent, marketing-agent, lark-docs, config-driven]
date: 2026-05-11
project: "[[AI Marketing Sales System]]"
---

# Tich hop lark-config-reader vao sales-agent-base va marketing-base

## Boi canh
Sales agent va marketing agent dang doc prompt/FAQ/KB tu file local. Can chuyen sang doc tu Lark (Doc > Bitable > file) de business owner sua truc tiep tren Lark khong can touch code.

## Giai phap
1. Import LarkConfigReader vao ca 2 base files. 2. Tao configReader instance trong handleIncomingMessage (sales) va runDailyPost (marketing). 3. Truyen configReader qua session object (sales) hoac tham so generateContent (marketing). 4. Bien loadPrompt, loadKnowledgeBase thanh async, nhan configReader, fallback ve file neu Lark loi. 5. Tool get_faq dung configReader.getFAQ() thay doc file. 6. configReader co cache 10 phut nen khong goi Lark moi request.

## Duc ket
Khi tich hop config reader vao module co san: (1) tao instance o entry point, (2) truyen qua session/params, (3) giu file fallback de khong bao gio crash, (4) cac ham doc file chuyen thanh async vi configReader la async.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI Marketing Sales System]]
