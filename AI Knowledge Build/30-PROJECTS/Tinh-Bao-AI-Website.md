---
tags: [project, tinh-bao-ai-website]
status: dang-lam
started: 2026-04-20
client: Bùi Trần Kim Long (Solo creator)
stack: [Next.js 14.2, TypeScript, React 18, Tailwind CSS 3.4, PostgreSQL, Supabase, Prisma 7.5, v98store API Gateway, Resend (Newsletter), Supabase Auth + TOTP, Vercel, Python (Scripts)]
updated: 2026-05-09
---

# Tinh-Bao-AI-Website

## Mo ta
Nền tảng tin tức AI + Công cụ + Thư viện Prompt cho cộng đồng Việt Nam. Website Next.js 14 đa chức năng với 8 module chính: Trang chủ, Tin tức (ingest từ RSS quốc tế + Việt Nam), Công cụ (PH scraper), Khóa học (mock), Thư viện Prompt (672+ prompts), Cộng đồng (forum comments), Hướng dẫn (guides), AI Office (Phaser game). Sử dụng PostgreSQL Supabase, Prisma ORM, v98store AI gateway, Resend newsletter, Supabase Auth. Deployed trên Vercel với auto-deploy từ main branch. Cộng tác viên solo (Long) không phải dev chuyên, nên codebase được tối ưu cho dễ bảo trì, config-driven, không hardcode.

## Stack
- Next.js 14.2
- TypeScript
- React 18
- Tailwind CSS 3.4
- PostgreSQL
- Supabase
- Prisma 7.5
- v98store API Gateway
- Resend (Newsletter)
- Supabase Auth + TOTP
- Vercel
- Python (Scripts)

## Quyet dinh quan trong
**1. v98store AI Gateway (ADR-0001)**: Sử dụng v98store làm gateway duy nhất (KHÔNG gọi trực tiếp OpenAI/Claude/Gemini) → 1 API key cho tất cả models, dễ swap model, giảm chi phí.

**2. Prisma adapter-pg + pg direct (ADR-0005)**: Prisma adapter-pg dùng trong Next.js runtime (pooler Supabase 6543). Scripts standalone dùng pg direct port 5432 vì pooler hay timeout trên Windows. TUYỆT ĐỐI KHÔNG dùng `prisma db push --accept-data-loss` (từng xóa 52 tools).

**3. PC Workflow > GitHub Actions (ADR-0004)**: Python automation chạy trên PC Windows tại nhà (không dùng GH Actions) → dễ debug, offline-friendly, tối ưu chi phí, linh hoạt với scraping.

**4. Resend > Beehiiv (ADR-0003)**: Chuyển sang Resend (2026-04-15) — giá rẻ hơn, email delivery tốt hơn, webhook realtime.

**5. Không dùng UI library shadcn**: Custom components với Tailwind → control toàn bộ, load time nhanh, brand identity.

**6. Config file bật/tắt workflow**: `PC workflow/config.json` quản tập trung 8 workflows (RSS, PH, newsletter, FB, etc) → dễ enable/disable mà KHÔNG sửa code.

**7. Hướng Dẫn re-enabled (2026-04-20)**: Route `/huong-dan` và menu đều live (trước đó bị ẩn khỏi menu vì không đủ content).

**8. `force-dynamic` cho `/tin-tuc`**: Cache stale → export const dynamic = 'force-dynamic' để luôn fresh content.

## Bai hoc rut ra
**Pitfall Lexica.art**: API chết → implement fallback sang Unsplash trong `lib/image.ts`. Luôn có backup source cho images.

**DeepSeek JSON vỡ**: DeepSeek parse JSON sai khi có HTML content → dùng XML tags (structured output tốt hơn).

**Supabase pooler timeout**: Windows Connection pooler 6543 hay timeout → direct port 5432 cho Python scripts. Học cách debug connection issues.

**React className vs class**: Mọi `.tsx` mới phải dùng `className`, KHÔNG `class` (lỗi ESLint).

**Prisma _count filtered**: Relation count filtered cần Prisma 5.0+ → update version nếu dùng.

**Beehiiv 409 duplicate**: Newsletter subscriber 409 khi duplicate → handle riêng (legacy, đã migrate Resend).

**Vercel image quota**: `unoptimized: true` trong next.config vì hết free quota → dùng Supabase Storage hoặc external CDN.

**1180px max-width**: Style guide chốt 1180px, KHÔNG 1200px (tránh horizontal scroll trên mobile).

**Telegram logging**: Debug production issue qua Telegram bot → ghi lại message format để dễ parse.

## Ket qua
Website production (tinhbao.ai) với **8 modules live**:
- ✅ Trang chủ (layout + latest articles)
- ✅ Tin tức (quốc tế + Việt Nam) — ingest 3 pipelines RSS
- ✅ Công cụ (Product Hunt scraper) — 400+ tools
- ✅ Thư viện Prompt (672 prompts) — search + filter
- ✅ Cộng đồng (forum, comments, upvotes, bookmarks)
- ✅ Hướng dẫn (guides + fire count tracking) — re-enabled 04-20
- ✅ AI Office (Phaser game, mini education)
- ✅ Admin panel (TOTP 2FA, article review, user mgmt)

**DB**: 13 Prisma models (Article, Tool, Prompt, User, Post, Comment, Guide, etc) + 2 extra tables (guide_research_queue, workflow_runs).

**Newsletter**: Resend hoạt động, daily 07h gửi tự động.

**Deployment**: Vercel auto-deploy main branch, prod analytics via Vercel Speed Insights.

**Code quality**: TypeScript strict, ESLint, custom Tailwind (KHÔNG shadcn), config-driven workflows.

**Current blockers**: KHÔNG có blocker lớn. Long có thể phát triển solo bằng cách đọc vault trước khi code.

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

> **NOTE:** Source code trên PC nhà (C:\openclaw\projects\tinh-bao-ai).
> Cần SSH vào PC nhà (100.87.190.39) để lấy source code.
