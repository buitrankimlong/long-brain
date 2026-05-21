---
tags: [ecc, claude-code, commands, mcp, instinct, continuous-learning, hooks, plugin]
description: Everything-Claude-Code-ECC-Analysis
created: 2026-05-18
moc: "[[04 Giao Thuc MCP A2A]]"
---

# Everything Claude Code (ECC) — Phân Tích Đầy Đủ

**Nguồn**: /tmp/everything-claude-code (repo ECC v2.0.0-rc.1)
**Phân tích ngày**: 2026-05-18

---

## 1. TỔNG QUAN

ECC là một "production-ready AI coding plugin" cung cấp:
- 60+ specialized agents
- 231 skills
- 75 commands (slash commands)
- Automated hook workflows
- MCP configs

Tổ chức theo kiến trúc plugin: install vào `~/.claude/plugins/` và Claude Code tự auto-load.

---

## 2. TOP COMMANDS NÊN ADOPT

### /plan (BẮT BUỘC)
Tạo implementation plan trước khi code. Workflow:
1. Restate requirements
2. Ground plan trong codebase patterns (search naming, error handling, tests)
3. Tạo file `.claude/plans/{name}.plan.md`
4. **WAIT for user CONFIRM** trước khi touch code

Output gồm: Files to Change table, Tasks, Validation commands, Risks table, Acceptance checklist.

### /code-review (RẤT HỮU ÍCH)
Review local diff hoặc GitHub PR. 8 phases:
- FETCH → CONTEXT → REVIEW → VALIDATE → DECIDE → REPORT → PUBLISH → OUTPUT
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Auto-post review lên GitHub qua `gh` CLI
- Save artifact vào `.claude/reviews/pr-{N}-review.md`

### /learn và /learn-eval (QUAN TRỌNG)
- `/learn`: Extract patterns từ session → save vào `~/.claude/skills/learned/`
- `/learn-eval`: Phiên bản nâng cao với quality gate (Checklist + Holistic verdict: Save / Improve / Absorb / Drop)
- Tránh lưu rác bằng cách: grep existing skills trước, check MEMORY.md, xác nhận reusability

### /build-fix (TIỆN LỢI)
Fix build/type errors tuần tự. Detect build system (npm/cargo/go/python), parse + group errors, fix từng lỗi một với guardrails.

### /quality-gate (TIỆN LỢI)
Run toàn bộ quality pipeline: formatter + lint + type checks. Mirror hook behavior nhưng gọi thủ công.

### /save-session + /resume-session (RẤT HỮU ÍCH)
Session persistence system:
- `/save-session`: Save state vào `~/.claude/session-data/YYYY-MM-DD-{shortid}-session.tmp`
  - Format gồm: What Worked, What Failed, Files Status, Decisions Made, Next Step
- `/resume-session`: Load session, show structured briefing, WAIT trước khi làm gì

### /feature-dev (WORKFLOW ĐẦY ĐỦ)
7-phase feature development: Discovery → Exploration → Clarifying → Architecture Design → Implementation → Quality Review → Summary.

### /checkpoint (WORKFLOW)
Create/verify/list workflow checkpoints với git + test verification.

### /hookify (THÚ VỊ)
Tạo hook rules từ conversation analysis. Detect unwanted behaviors → generate `.claude/hookify.{name}.local.md`.

### /skill-create (AUTOMATION)
Analyze git history → extract coding patterns → generate SKILL.md files. Detect: commit conventions, file co-changes, architecture.

### /security-scan (QUAN TRỌNG)
Run AgentShield security scanner. Check: hardcoded secrets, broad permissions, executable hooks, MCP servers, agent prompts.

### /refactor-clean (TIỆN LỢI)
Dead code detection (knip/depcheck/ts-prune/vulture) → safe deletion loop với test verification.

### /pr (AUTOMATION)
Full PR creation: validate → discover (template + commits) → push → create → verify. Auto-detect conventional commit format.

---

## 3. INSTINCT SYSTEM (Continuous Learning v2.1)

Đây là tính năng **độc đáo nhất** của ECC.

### Concept
"Instinct" = atomic learned behavior với confidence scoring:
```yaml
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.7  # 0.3=tentative, 0.9=near-certain
domain: code-style
scope: project  # or global
project_id: a1b2c3d4e5f6
```

### Architecture
```
Session Activity (hooks capture 100% tool calls)
  → observations.jsonl (per-project)
  → Observer agent (Haiku, background) analyzes patterns
  → Creates/updates instincts với confidence scores
  → /evolve clusters instincts → skills/commands/agents
```

### Điểm mấu chốt vs v1
- v1: Dùng skills để observe (50-80% reliable, probabilistic)
- v2: Dùng hooks (100% reliable, deterministic)
- v2.1: Project-scoped instincts (tránh cross-project contamination)

### Commands
- `/instinct-status`: Xem all instincts (project + global) với confidence bars
- `/evolve`: Cluster related instincts → generate skills/commands/agents
- `/instinct-export`: Export ra YAML file để share với team
- `/instinct-import`: Import instincts từ file/URL với merge logic
- `/promote`: Promote project instincts → global scope (khi appear 2+ projects, avg confidence >= 0.8)

### Storage
```
~/.local/share/ecc-homunculus/
  instincts/personal/       # Global instincts
  projects/{hash}/          # Per-project (isolated)
    observations.jsonl
    instincts/personal/
    evolved/skills|commands|agents/
```

### Hook Observation (observe.sh)
- PreToolUse + PostToolUse hooks capture every tool call
- Detect project context via `git remote get-url origin` (hash → portable ID)
- Store observations per-project, analyze background

---

## 4. MCP SERVERS RECOMMEND

Từ `mcp-configs/mcp-servers.json`:

### Tier 1 — PHẢI CÓ
| Server | Package | Dùng cho |
|--------|---------|---------|
| `context7` | `@upstash/context7-mcp` | Live docs lookup — resolve-library-id, query-docs |
| `sequential-thinking` | `@modelcontextprotocol/server-sequential-thinking` | Chain-of-thought reasoning phức tạp |
| `playwright` | `@playwright/mcp` | Browser automation, testing |
| `github` | `@modelcontextprotocol/server-github` | PRs, issues, repos |

### Tier 2 — NÊN CÓ
| Server | Package | Dùng cho |
|--------|---------|---------|
| `omega-memory` | `omega-memory serve` (uvx) | Persistent memory với semantic search, knowledge graphs. Richer hơn basic memory |
| `longhand` | `pip install longhand` | Lossless session history — index raw tool calls, file edits từ ~/.claude/projects/*.jsonl vào SQLite+ChromaDB trước khi bị rotate |
| `exa-web-search` | `exa-mcp-server` | Web search/research qua Exa API |
| `firecrawl` | `firecrawl-mcp` | Web scraping/crawling |
| `evalview` | `pip install evalview>=0.5` | AI agent regression testing — snapshot behavior, detect regressions |

### Tier 3 — TÙY NHU CẦU
| Server | Dùng cho |
|--------|---------|
| `token-optimizer` | 95%+ context reduction qua deduplication |
| `supabase` | Supabase DB operations |
| `vercel` | Vercel deployments |
| `railway` | Railway deployments |
| `cloudflare-*` | CF docs, workers, observability |
| `fal-ai` | AI image/video/audio generation |
| `browserbase` | Cloud browser sessions |

**Lưu ý**: ECC khuyến cáo giữ dưới 10 MCPs để preserve context window.

---

## 5. PLUGIN ARCHITECTURE

### Cách hoạt động
- Plugin install vào `~/.claude/plugins/`
- Claude Code v2.1+ auto-loads `hooks/hooks.json` từ plugin
- `CLAUDE_PLUGIN_ROOT` env var để hooks tự resolve paths
- Plugin có marketplace: `claude plugin marketplace add <url>`

### Recommended Plugins
- `typescript-lsp`, `pyright-lsp`: Language intelligence
- `hookify`: Create hooks conversationally
- `code-review`, `pr-review-toolkit`: Code quality
- `mgrep` (mixedbread-ai): Enhanced search (better than ripgrep)
- `context7`: Live docs lookup
- `feature-dev`: Feature development workflow

---

## 6. HOOK SYSTEM (ECC)

ECC dùng 5 hooks chính:
1. **pre:bash:dispatcher** — Quality, tmux, push, GateGuard checks trước Bash
2. **pre:write:doc-file-warning** — Warn về non-standard doc files
3. **pre:edit-write:suggest-compact** — Suggest manual compaction ở logical intervals
4. **pre:observe** — Capture tool use observations (async, timeout 10s)
5. **pre:governance-capture** — Capture secrets/policy violations (opt-in, ECC_GOVERNANCE_CAPTURE=1)

---

## 7. AGENTS.MD ARCHITECTURE

ECC tổ chức agents theo domains:
- `planner` — Complex features, refactoring
- `architect` — System design, scalability
- `tdd-guide` — Test-driven development
- `code-reviewer` — Code quality
- `security-reviewer` — Vulnerability detection
- `build-error-resolver` — Fix build errors
- `typescript-reviewer`, `python-reviewer`, `go-reviewer`, etc. — Language-specific
- `loop-operator` — Autonomous loop execution
- `harness-optimizer` — Reliability, cost, throughput tuning

**Nguyên tắc**: Proactively delegate — không cần user prompt, Claude tự spawn agent phù hợp.

---

## 8. TÍCH HỢP VÀO LONGBRAIN

### Commands nên add vào `.claude/commands/` local:
1. `/plan` — Dùng trước mọi feature lớn
2. `/learn-eval` — Thay thế `/learn` hiện tại (có quality gate tốt hơn)
3. `/save-session` + `/resume-session` — Session persistence
4. `/skill-create` — Extract patterns từ git history

### MCPs nên thêm vào stack:
1. `context7` — Cho live docs lookup
2. `longhand` — Session history persistence (complement Longbrain)
3. `exa-web-search` — Research nhanh hơn

### Instinct System — Cân nhắc implement:
Concept hay nhưng cần Python + hooks setup phức tạp. Longbrain đã có `add_learning` + `mine_patterns` làm tương tự. Có thể borrow:
- Confidence scoring concept cho learnings
- Project-scoped instincts (đã có với project-based vault)
- `/evolve` concept → `mine_patterns` đã làm tương tự

### Borrow cho Longbrain hooks:
- `suggest-compact` pattern: warn khi approaching context limit
- `learn-eval` quality gate: checklist trước khi `add_learning`
