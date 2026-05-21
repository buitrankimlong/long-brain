---
tags: [auto-learning, longbrain]
date: 2026-05-20
session: 69e5b10a
cwd: C:\AI Build Learning
---

# Auto-Learnings — AI Build Learning — 2026-05-20

> Session: `69e5b10a` | Generated: 2026-05-20 16:21:14 | Items: 12

---

## Mục tiêu session
- Hãy giúp tôi ssh vào pc cá nhân ở nhà trong home PC sever. Hiện tại pc của tôi có quá nhiều rác, các hệ thống, các tools, các dự án mà tôi đã làm từ ổ đĩa C, D, E. Hãy giúp tôi ssh vào chia ra nhiề...

## Files đã thay đổi
- `Edit` → `C:\AI Build Learning\mcp-server\server.js`
- `Edit` → `C:\Users\buitr\.claude\CLAUDE.md`
- `Write` → `C:\Users\buitr\.claude\projects\C--AI-Build-Learning\memory\MEMORY.md`

## Longbrain tools đã dùng
- `add_learning`: Flashscore Scraper System — Selenium + Telegram bot scraping football data
- `add_learning`: Soccer Data Analytic — Poisson model + xG weighted stats cho dự đoán bóng đá
- `add_learning`: TikTok Auto Reply Bot — DeepSeek API + Edge CDP cho auto comment
- `add_learning`: Quét ổ đĩa C PC nhà — VS Code Backups 34.68 GB là rác lớn nhất
- `add_learning`: PC Workflow — hệ thống automation 9 scheduled tasks cho Tình Báo AI
- `add_learning`: Facebook Auto Post Agent — Telegram bot đăng bài FB/IG qua Graph API
- `add_learning`: Dhan Bot — Indian stock trading bot với PyInstaller build + Telegram signals
- `add_learning`: NotebookLM Worker — Flask async job queue cho infographic generation
- `add_learning`: Gothic Images Scraping — 156GB dataset từ Wikimedia/Flickr/TheMet cho freelance
- `add_learning`: Titanium Stock/Quant — VN stock backtesting với vnstock + Poisson

---

## [BashSuccess] ssh buitr@100.87.190.39 "ssh-keygen -t ed25519 -C buitrankim

**Command:** `ssh buitr@100.87.190.39 "ssh-keygen -t ed25519 -C buitrankimlong@gmail.com -f C:\Users\buitr\.ssh\id_ed25519 -N \"\" 2>&1 && echo === PUBLIC KEY === &`
**Result:** ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBocvkd1NIffHBwhxXa6fHBQmeiPw7h1uXgMgXLzsuIW buitrankimlong@gmail.com

---

## [BashSuccess] git clone

**Command:** `ssh buitr@100.87.190.39 "cd E:\ && git clone git@github.com:buitrankimlong/Projects.git 2>&1"`
**Result:** warning: You appear to have cloned an empty repository.

---

## [BashSuccess] git add

**Command:** `ssh buitr@100.87.190.39 'powershell -Command "Set-Location E:\Projects; git add -A; git commit -m \"feat: initial commit - all projects organized by c`
**Result:** Command running in background with ID: bgn3ni0tr. Output is being written to: C:\Users\buitr\AppData\Local\Temp\claude\C--AI-Build-Learning\69e5b10a-27f1-4a94-ab83-09eb596d2b76\tasks\bgn3ni0tr.output

---

## [BugFix] Fix exit code 255: ssh buitr@100.87.190.39 "echo

**Problem:** Exit code 255
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
'SSH OK' 
...
**Fix command:** `ssh buitr@100.87.190.39 "dir C:\ /ad /b"`

---

## [BugFix] Fix exit code 1: ssh buitr@100.87.190.39 "dir

**Problem:** Exit code 1
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
The system ca...
**Fix command:** `ssh buitr@100.87.190.39 "powershell -Command \"Get-ChildItem 'C:\Users\buitr\AppData\Roaming\Code' -Directory | ForEach-Object { try { \$size = (Get-C`

---

## [BugFix] Fix error in: ssh buitr@100.87.190.39 "type \"C:\Flashscore_Scra

**Problem:** <persisted-output>
Output too large (34.4KB). Full output saved to: C:\Users\buitr\.claude\projects\C--AI-Build-Learning\69e5b10a-27f1-4a94-ab83-09eb596d2b76\tool-results\b2cu930gm.txt

Preview (first 2KB):
** WARNING: connection is not using a po...
**Fix command:** `ssh buitr@100.87.190.39 "type \"C:\Soccer Data Analytic and Scraping - Copy\Analyzer.py\" 2>nul"`

---

## [BugFix] Fix error in: ssh buitr@100.87.190.39 "powershell -Command

**Problem:** ** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
=== Xoa VS Code Backups (...
**Fix command:** `ssh buitr@100.87.190.39 "powershell -Command \"Write-Output '=== Clean pip cache ==='; pip cache purge 2>&1; Write-Output '=== Clean npm cache ==='; n`

---

## [BugFix] Fix exit code 2: ssh buitr@100.87.190.39 "powershell

**Problem:** Exit code 2
/usr/bin/bash: -c: line 1: unexpected EOF while looking for matching ``'
**Fix command:** `ssh buitr@100.87.190.39 "powershell -Command \"Remove-Item 'D:\`$Recycle.Bin\*' -Recurse -Force -ErrorAction SilentlyContinue; Write-Output 'Recycle B`

---

## [Decision] ## CẦN BẠN QUYẾT ĐỊNH

**Decision:** ## CẦN BẠN QUYẾT ĐỊNH

---

## [Decision] **Bước 2 — Bạn quyết định:** Steam, Minecraft, Met...

**Decision:** **Bước 2 — Bạn quyết định:** Steam, Minecraft, MetaQuotes, Zomboid còn dùng không?

---

## [Decision] Use Clone went to home dir instead of E. Let me fix.

**Decision:** Clone went to home dir instead of E. Let me fix.

---

## [Config] SSH config

**Command:** `ssh buitr@100.87.190.39 "powershell -Command \"Get-ChildItem C:\ -Directory | ForEach-Object { try { \$size = (Get-ChildItem \$_.FullName -Recurse -Fo`
**Config:**
```
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
Certificate                                                 0 GB
Flashscore_Scraper_System                                   0 GB
Important                                  ...
```

---
> Auto-generated by longbrain-stop-hook v2.0 | [[32 Bai Hoc Duc Ket]]
