---
tags: [learning, workflow, automation, windows, task-scheduler, v98, supabase, telegram, home-pc, tinh-bao-ai]
date: 2026-05-20
project: "[[PC-Workflow]]"
---

# PC Workflow — hệ thống automation 9 scheduled tasks cho Tình Báo AI

## Boi canh
Tìm thấy tại E:\PC workflow trên PC nhà. Hệ thống chạy 9 Windows Scheduled Tasks: 3 pipeline tin tức (RSS 16 nguồn quốc tế + Google News VN + Góc Nhìn Tình Báo), 1 Product Hunt tools collector, 1 guide pipeline, + housekeeping (daily summary, cleanup logs, system startup/shutdown). Stack: Python + v98store API Gateway + Supabase PostgreSQL + Telegram bot + Windows Task Scheduler.

## Giai phap
Architecture pattern: (1) config.json bật/tắt workflow không cần xóa task, (2) run_wrapper.py chung cho tất cả workflow, (3) 1 Telegram bot chung — chỉ notify lỗi + daily summary + manual run, (4) System/lib/ shared utilities, (5) state/runs_*.jsonl cho ledger, (6) 7 ngày auto-cleanup logs. Setup: SETUP.bat → test v98 → test Telegram → install_tasks.ps1.

## Duc ket
Pattern cho workflow automation trên Windows PC: dùng Task Scheduler + config.json toggle + run_wrapper + shared Telegram bot. Tổ chức theo Workflow_[Tên]/ với README riêng mỗi folder. v98store.com làm AI gateway chung.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[PC-Workflow]]
