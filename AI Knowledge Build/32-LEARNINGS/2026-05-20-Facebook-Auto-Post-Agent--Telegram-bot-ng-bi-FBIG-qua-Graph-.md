---
tags: [learning, telegram, facebook, instagram, auto-post, python, home-pc]
date: 2026-05-20
project: "[[Facebook-Auto-Post-Agent]]"
---

# Facebook Auto Post Agent — Telegram bot đăng bài FB/IG qua Graph API

## Boi canh
Tìm thấy tại E:\Facebook Auto Post Agent. Bot Telegram nhận ảnh + caption → hỏi platform (FB/IG/cả hai) → đăng bài. Dùng ConversationHandler của python-telegram-bot cho flow multi-step. Chỉ cho phép 1 user ID (ALLOWED_USER_ID).

## Giai phap
Pattern: Telegram ConversationHandler (entry_points → states → fallbacks) cho multi-step interaction. Download ảnh từ Telegram → tempfile → post_to_facebook/instagram → cleanup. Authorization bằng user ID filter.

## Duc ket
ConversationHandler là pattern chuẩn cho Telegram bot cần multi-step input. Dùng tempfile cho ảnh tạm, filters.User() cho authorization.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[Facebook-Auto-Post-Agent]]
