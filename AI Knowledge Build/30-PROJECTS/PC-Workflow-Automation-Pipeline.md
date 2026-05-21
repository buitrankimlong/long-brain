---
tags: [project, pc-workflow-automation-pipeline]
status: dang-lam
started: 2026-05-20
stack: [Python, v98store API, Supabase, Telegram Bot API, Windows Task Scheduler, feedparser, BeautifulSoup]
github: https://github.com/buitrankimlong/Projects/tree/main/04-content-pipeline/pc-workflow
updated: 2026-05-20
---

# PC-Workflow-Automation-Pipeline

## Mo ta
Hệ thống automation 9 Windows Scheduled Tasks trên PC nhà: 3 pipeline tin tức (RSS quốc tế + Google News VN + Góc Nhìn), Product Hunt tools, guide pipeline. Stack: Python + v98 API + Supabase + Telegram.

## Stack
- Python
- v98store API
- Supabase
- Telegram Bot API
- Windows Task Scheduler
- feedparser
- BeautifulSoup

## Quyet dinh quan trong
1) Windows Task Scheduler thay cron. 2) config.json toggle on/off per workflow. 3) Shared Telegram bot across workflows. 4) Tổ chức Workflow_[Tên]/ với README riêng.

## Source Code

structure:
```
pc-workflow/
├── config.json          # Toggle on/off per workflow
├── install_tasks.ps1    # PowerShell setup all scheduled tasks
├── Start_All.bat        # Run all workflows
├── Workflow_Tin_Tuc/    # RSS 16 nguồn quốc tế
├── Workflow_Cong_Dong/  # Google News VN
├── Workflow_Facebook/   # FB content pipeline
├── Workflow_Threads/    # Threads content
├── Workflow_Newsletter/ # Newsletter digest
├── Workflow_Cong_Cu/    # Product Hunt tools
├── Workflow_Huong_Dan/  # Guide pipeline
└── System/              # Shared utils, startup/shutdown
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/04-content-pipeline/pc-workflow

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
