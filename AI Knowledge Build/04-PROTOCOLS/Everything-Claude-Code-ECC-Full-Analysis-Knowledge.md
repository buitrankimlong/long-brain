---
tags: [ecc, claude-code, optimization, hooks, skills, agents, rules, token-optimization, memory-persistence]
description: Everything-Claude-Code-ECC-Full-Analysis
created: 2026-05-18
moc: "[[04 Giao Thuc MCP A2A]]"
---
# Everything Claude Code (ECC) — Deep Research Toàn Diện (May 2026)

> Source: https://github.com/affaan-m/ECC
> 182K+ stars | 28K+ forks | 170+ contributors | 12+ language ecosystems
> Phân tích: 2026-05-18, cập nhật 2026-05-20

---

## 1. TỔNG QUAN

ECC là **"agent harness performance optimization system"** — framework hoàn chỉnh cung cấp agents, skills, hooks, rules, và MCP configs từ 10+ tháng production use. Hoạt động trên **7 nền tảng**: Claude Code (primary), Cursor, OpenAI Codex, OpenCode, GitHub Copilot, Gemini, Zed.

| Metric | Con số |
|--------|--------|
| Version | 2.0.0-rc.1 (April 2026) |
| Agents | 60 specialized |
| Skills | 232 workflow definitions |
| Legacy Commands | 75 |
| Rules | 34 (common + 12 language ecosystems) |
| Tests | 1,282+ (AgentShield), 98% coverage |
| npm packages | ecc-universal, ecc-agentshield |
| License | MIT (OSS free forever) |

---

## 2. CẤU TRÚC THƯ MỤC

```
ecc/
├── .agents/              # Harness-specific configs
├── agents/               # 60 agents theo domain
├── skills/               # 232 workflow definitions
├── commands/             # 75 legacy slash commands
├── rules/                # common/ + 12 language-specific/
├── hooks/                # Event-driven automations (15+)
├── scripts/              # Cross-platform Node.js utilities
├── mcp-configs/          # MCP server definitions
├── docs/                 # Documentation
├── ecc2/                 # Rust control-plane (ALPHA)
├── src/llm/              # OpenAI-compatible provider layer
├── manifests/            # Install targets (claude, cursor, codex...)
├── schemas/              # JSON schemas for validation
├── tests/                # Full test suite
├── ecc_dashboard.py      # Tkinter desktop GUI
├── CLAUDE.md / AGENTS.md / SOUL.md / RULES.md
├── install.sh / install.ps1
└── package.json          # npm: ecc-universal
```

---

## 3. TOKEN OPTIMIZATION — ÁP DỤNG NGAY

### Settings tối ưu
```json
{
  "model": "sonnet",
  "env": {
    "MAX_THINKING_TOKENS": "10000",
    "CLAUDE_CODE_SUBAGENT_MODEL": "haiku"
  }
}
```

| Setting | Default | Recommended | Tiết kiệm |
|---|---|---|---|
| model | opus | sonnet | ~60% chi phí |
| MAX_THINKING_TOKENS | 31,999 | 10,000 | ~70% hidden thinking |
| SUBAGENT_MODEL | inherit | haiku | ~80% cheaper agents |

### Model Routing Matrix
| Task | Model | Cost |
|------|-------|------|
| Exploration, docs, boilerplate | Haiku | $0.80/M input |
| **Most coding (90% tasks)** | Sonnet | $3/M input |
| Architecture, security, deep debug | Opus | $15/M input |

### MCP Context Cost
- Mỗi MCP tool ~500 tokens overhead
- 21 tools = ~10,500 tokens/session → giữ dưới 10 MCPs/project

### Strategic Compact Rules
| Phase transition | Compact? |
|---|---|
| Research → Planning | YES |
| Planning → Implementation | YES |
| Debugging → Next feature | YES |
| Mid-implementation | **NO** (mất state!) |
| After failed approach | YES |

---

## 4. SKILLS SYSTEM (232 Skills)

### SKILL.md Format
```yaml
---
name: codebase-onboarding
description: "Analyze codebases and generate onboarding docs"
origin: ecc
trigger: ["first time opening project", "generate CLAUDE.md"]
tags: [onboarding, documentation]
---
```

Sections: When to Activate → Core Workflow (phases) → Artifacts → Key Principles → Examples

### Top Skills Priority
| Tier | Skill | Mục đích |
|---|---|---|
| 1 | `cost-aware-llm-pipeline` | Model routing, budget tracking |
| 1 | `search-first` | Research trước khi code |
| 1 | `security-review` | 17-point OWASP checklist |
| 2 | `deployment-patterns` | CI/CD, Docker, rollback |
| 2 | `database-migrations` | Zero-downtime, Prisma |
| 2 | `backend-patterns` | Repository pattern, N+1 |
| 3 | `strategic-compact` | Context window management |
| 3 | `autonomous-loops` | Sequential pipeline, De-Sloppify |

### Auto-Loading (Instinct-triggered)
Instinct system observes user corrections → learns trigger patterns → lazy-loads skills khi confidence > 0.8.

---

## 5. HOOKS SYSTEM (8-20 Events)

### Execution Flow
```
User Input → PreToolUse (can block, exit 2) → Tool Executes → PostToolUse (analysis) → User sees result
```

### Pre-Built Hooks
| Hook | Event | Giá trị |
|---|---|---|
| session-start.js | SessionStart | Load prev session summary — **quan trọng nhất** |
| pre-compact.js | PreCompact | Save state trước compact |
| cost-tracker.js | Stop | Track chi phí per session |
| ecc-context-monitor.js | PostToolUse | Loop detection + context warning |
| pre-bash-commit-quality.js | PreToolUse | Secret detection trong staged files |

### Kỹ thuật quan trọng
- SessionStart: dùng `hookSpecificOutput.additionalContext` (JSON) thay vì stdout
- Guard "HISTORICAL REFERENCE ONLY" tránh re-execute stale commands
- Exit codes: 0 (continue), 2 (block PreToolUse only)
- SessionStart root fallback: nếu fail → fallback CLAUDE.md

---

## 6. AGENTS (60 Specialized)

### Top 10 Agents
| Agent | Model | Giá trị |
|---|---|---|
| security-reviewer | sonnet | OWASP Top 10, emergency response |
| build-error-resolver | sonnet | Fix minimal, no architecture changes |
| typescript-reviewer | sonnet | Floating promises, async forEach |
| python-reviewer | sonnet | ruff/mypy/bandit, framework-specific |
| silent-failure-hunter | sonnet | Empty catch, dangerous fallbacks |
| database-reviewer | sonnet | EXPLAIN ANALYZE, RLS, cursor pagination |
| planner | **opus** | Sized phases, risk assessment |
| refactor-cleaner | sonnet | knip/depcheck → batch removal |
| loop-operator | sonnet | Stall detection, cost drift |
| doc-updater | **haiku** | Generate from code, tiết kiệm |

### Agent Defense Features
- **Prompt Defense Baseline** chống prompt injection
- **Confidence-based filtering** (>80% mới report)
- **Approval to return zero findings** (không chế ra lỗi)

---

## 7. RULES ARCHITECTURE

```
~/.claude/rules/ecc/
├── common/                 # All projects
│   ├── coding-style.md    # KISS/DRY/YAGNI, file <800, func <50
│   ├── security.md        # Pre-commit checklist
│   ├── agents.md          # 11 agents + parallel execution
│   ├── development-workflow.md  # Research-first pipeline
│   ├── performance.md     # Model routing, context mgmt
│   ├── testing.md         # 80% coverage, TDD
│   └── git-workflow.md    # Conventional commits
├── typescript/            # No any, string unions > enum
├── python/                # FastAPI factory, thin routers
├── go/, rust/, java/, kotlin/, cpp/, fsharp/, php/, perl/
```

---

## 8. INSTINCT SYSTEM (Continuous Learning v2)

### Confidence Scoring
```
confidence = (evidence_count / min_threshold) * recency_factor

+0.15 per user acceptance
-0.2 per user rejection
+0.1 per repeated pattern
-0.02 per week decay (max -0.5)
```

### Project-Scoped Learning (v2.1)
```
~/.claude/projects/<project-id>/instincts/
├── global-instincts.json    # Shared (security, input validation)
├── project-instincts.json   # Project-specific (React patterns ⊂ React)
└── observations.jsonl       # Raw events
```

---

## 9. ECC 2.0 — MỚI NHẤT

### Rust Control-Plane (Alpha)
- Directory `ecc2/`: Rust TUI application
- 7 commands: `dashboard`, `start`, `sessions`, `status`, `stop`, `resume`, `daemon`
- SQLite state store cho session recording
- `ecc status --markdown --write status.md` cho operator snapshots

### Desktop Dashboard (Tkinter)
- `ecc_dashboard.py` hoặc `npm run dashboard`
- 5 tabs: Agents, Skills, Commands, Rules, Settings
- Dark/light theme, search, filter by category
- Security: path validation chống directory traversal

### AgentShield Security Scanner
- 102 static analysis rules, 5 categories
- 1,282 tests, 3 output modes (Terminal, JSON, HTML)
- CLI: `npx ecc-agentshield scan`
- Opus 4.6 deep analysis (red-team/blue-team/auditor)

### ECC Pro Monetization
- GitHub App: $19/seat/month (private repos)
- Free tier: public repos
- 50 analyses/seat/month

---

## 10. CROSS-HARNESS SUPPORT (7 Platforms)

| Platform | Status | Config |
|----------|--------|--------|
| Claude Code | Primary | `.claude/` |
| Cursor | Full | `.cursor/` |
| OpenCode | Full | `.opencode/` |
| Codex | Full | AGENTS.md-based |
| GitHub Copilot | Partial | settings.json |
| Gemini | Emerging | `.gemini/` |
| Zed | Experimental | config file |

### DRY Adapter Pattern
Hooks dùng adapter pattern: `hooks/cursor/adapter.js` transforms Cursor format → Claude Code standard → run shared logic.

---

## 11. CÀI ĐẶT (Chọn 1, KHÔNG kết hợp)

| Path | Command | Notes |
|---|---|---|
| Plugin (recommended) | `/plugin install ecc@ecc` | Auto-installs, manual copy rules |
| npm | `npx ecc-install --profile full --target claude` | Fastest |
| Manual Unix | `./install.sh --profile full --target claude` | Fine-grained |
| Manual Windows | `.\install.ps1 -profile full -target claude` | PowerShell |
| Minimal | `./install.sh --profile minimal` | Rules only, no hooks |

---

## 12. ECC vs LONGBRAIN — BỔ SUNG, KHÔNG CONFLICT

| Khía cạnh | ECC | Longbrain |
|-----------|-----|-----------|
| Focus | Code quality + token optimization | Knowledge persistence |
| Skills | 232 (procedural workflow) | N/A |
| Memory | Instinct (confidence scoring) | Vault + decisions + never-again |
| Token optimization | Strategic compact, model routing | N/A |
| Hooks | 15+ comprehensive | 4 focused |
| Cross-platform | 7 harnesses | 1 (Claude Code) |
| Agents | 60 specialized | 4 custom |
| Security | AgentShield (102 rules) | Security rules only |

**Kết luận**: Longbrain = knowledge memory layer, ECC = execution optimization layer.

---

## 13. COMMANDS QUAN TRỌNG

| Command | Mục đích |
|---|---|
| `/plan` | Plan trước khi code → `.claude/plans/*.plan.md` |
| `/code-review` | 8-phase review, severity levels |
| `/learn-eval` | Quality gate trước lưu learning |
| `/build-fix` | Fix one error at a time |
| `/save-session` + `/resume-session` | Session handoff |
| `/security-scan` | AgentShield scan |
| `/checkpoint` | Git + test verification |

---

## 14. MCP SERVERS RECOMMENDED

| Server | Package | Mục đích |
|---|---|---|
| context7 | `@upstash/context7-mcp` | Live docs lookup |
| sequential-thinking | `@modelcontextprotocol/server-sequential-thinking` | Chain-of-thought |
| playwright | `@playwright/mcp` | Browser automation |
| github | `@modelcontextprotocol/server-github` | PRs, issues |

---

## Sources
- [GitHub Repo](https://github.com/affaan-m/ECC)
- [Shortform Guide](https://github.com/affaan-m/ECC/blob/main/the-shortform-guide.md)
- [Security Guide](https://github.com/affaan-m/ECC/blob/main/the-security-guide.md)
- [Longform Guide](https://github.com/affaan-m/ECC/blob/main/the-longform-guide.md)
- [ECC Explorer Catalog](https://esandorfi.github.io/ecc-explorer/catalog/)
- [Cheatsheet](https://dev.to/shimo4228/everything-claude-code-ecc-complete-cheatsheet-24ok)