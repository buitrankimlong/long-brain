---
tags: [learning, admin-panel, nextjs15, frontend, tailwind, recharts, phase-14]
date: 2026-05-14
project: "[[Abuss]]"
---

# Phase 14 Admin Panel Frontend — Next.js 15 + Tailwind + Recharts

## Boi canh
Build frontend-only admin panel cho hệ thống AI 3 brand trước khi có backend

## Giai phap
Next.js 15 App Router + React 19 + Tailwind CSS + Recharts. Dùng mock data trong lib/mock-data.ts. Route group (dashboard) để share layout. Agent editor có 5 tabs: Prompt/FAQ/KB/Kịch bản/Cài đặt. Sidebar có collapsible brand groups cho 6 agents. Tất cả pages: Dashboard, Agents, Orders, Customers, Products, Reports, Settings.

## Duc ket
Next.js 14 có security vuln, luôn dùng Next.js 15+. Params trong Next.js 15 client components là Promise → dùng use(params). Recharts 2.x hoạt động tốt với React 19. Cấu trúc: src/app/(dashboard)/ cho route group, src/components/agents/ cho tabs.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Abuss]]
