---
tags: [learning, ecc, claude-code, token-optimization, skills, agents, rules, integration]
date: 2026-05-18
project: "[[AI-Build-Learning]]"
---

# ECC integration — copy skills/agents/rules/commands + token optimization cho Claude Code

## Boi canh
Phân tích repo Everything Claude Code (182K+ stars) để tìm cách cải thiện hệ thống Longbrain + Claude Code workflow. Cần biết nên lấy gì, bỏ gì, và cách tích hợp không conflict với Longbrain hiện tại.

## Giai phap
Spawn 6 agents song song phân tích từng khía cạnh (hooks, skills, agents, rules, token optimization, commands+MCP). Sau đó spawn 5 agents song song để copy/cài đặt. Tổng cộng: 231 skills, 21 rules, 10 agents, 11 commands, token optimization settings, browser-harness, @google/design.md.

## Duc ket
1) MAX_THINKING_TOKENS=10000 tiết kiệm ~70% hidden thinking cost. 2) CLAUDE_CODE_SUBAGENT_MODEL=haiku tiết kiệm ~80% subagent cost. 3) ECC và Longbrain KHÔNG conflict — ECC = code quality layer, Longbrain = knowledge memory layer. 4) Skills nên copy tất cả rồi lazy-load theo keyword thay vì chọn lọc. 5) Mỗi MCP tool tốn ~500 tokens context — giữ dưới 10 MCPs.

## Lien ket
-> [[32 Bai Hoc Duc Ket]] | [[AI-Build-Learning]]
