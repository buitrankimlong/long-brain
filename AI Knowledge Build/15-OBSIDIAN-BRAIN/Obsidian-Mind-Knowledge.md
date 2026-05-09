# Obsidian Second Brain - Complete Knowledge Extraction

> Source repo: `C:\AI Build Learning\obsidian-second-brain\`
> GitHub: https://github.com/eugeniughelbur/obsidian-second-brain
> Author: Eugeniu Ghelbur (AI Automation Engineer @ Single Grain)
> License: MIT | Version: v0.6.0 (as of 2026-04-26)
> Extraction date: 2026-05-09

---

## 1. What Is It

A **Claude Code skill** (not an Obsidian plugin) that turns any Obsidian vault into a living, self-rewriting AI-first second brain. An evolution of Karpathy's LLM Wiki pattern with five key extensions:

1. New sources **rewrite** existing pages instead of appending
2. Contradictions **reconcile automatically** via `/obsidian-reconcile`
3. Patterns **surface without prompting** via `/obsidian-synthesize`
4. **4 scheduled agents** maintain the vault autonomously (nightly, weekly, health)
5. Notes are written for **future-Claude retrieval**, not human reading

**Core philosophy:** "The vault doesn't grow. It evolves. Your notes are the moat."

---

## 2. Repo Structure

```
obsidian-second-brain/
├── CLAUDE.md              # Dev instructions for working on the repo itself
├── SKILL.md               # Full operating manual loaded by Claude when skill activates
├── architecture.md        # Complete architecture document (layers, data flow, subagents)
├── llms.txt               # LLM-readable project summary
├── README.md              # Public docs
├── install.sh             # One-shot installer (symlinks skill into ~/.claude/)
├── pyproject.toml          # Python deps (uv, Python 3.10+)
├── commands/              # 31 slash command definitions (.md files)
│   ├── obsidian-save.md, obsidian-init.md, obsidian-daily.md ...
│   ├── obsidian-challenge.md, obsidian-emerge.md, obsidian-connect.md ...
│   ├── research.md, research-deep.md, x-read.md, x-pulse.md, youtube.md
│   └── (31 total)
├── references/            # Shared specs referenced by commands
│   ├── ai-first-rules.md          # THE canonical vault-write spec (non-negotiable)
│   ├── claude-md-template.md      # _CLAUDE.md template for personal vaults
│   ├── claude-md-assistant-template.md  # Template for maintaining vault FOR someone else
│   ├── vault-schema.md            # Wiki-style vs Obsidian-style folder structures
│   └── write-rules.md            # Propagation, linking, formatting rules
├── hooks/
│   └── obsidian-bg-agent.sh       # PostCompact hook - silent vault updates
├── scripts/
│   ├── bootstrap_vault.py         # Creates vault from scratch with presets
│   ├── setup.sh                   # One-command installer (vault path, hooks, MCP)
│   ├── quick-install.sh           # curl-pipe installer
│   ├── vault_health.py            # Vault audit script
│   └── research/                  # Python research toolkit
│       ├── research.py            # /research command (Perplexity)
│       ├── research_deep.py       # /research-deep command (vault-first)
│       ├── x_read.py              # /x-read command (Grok)
│       ├── x_pulse.py             # /x-pulse command (Grok)
│       ├── youtube_extract.py     # /youtube command
│       └── lib/                   # Shared libs (config, grok, perplexity, vault, youtube, usage)
└── examples/sample-vault/         # Fictional sample vault (Alex Rivera)
```

---

## 3. The 31 Commands (4 Layers)

### Layer 1: Operations (21 commands) - "Claude remembers"

| Command | What it does |
|---|---|
| `/obsidian-save` | Spawns 5 parallel subagents (People, Projects, Tasks, Decisions, Ideas) to save everything from conversation |
| `/obsidian-ingest` | Drop URL/PDF/audio/screenshot - vault REWRITES itself (5-15 pages touched) |
| `/obsidian-synthesize` | Auto-finds cross-source patterns, writes synthesis pages |
| `/obsidian-reconcile` | Finds and resolves contradictions automatically |
| `/obsidian-export` | Clean JSON/markdown snapshot for other AI tools |
| `/obsidian-daily` | Creates/updates today's daily note |
| `/obsidian-log` | Logs work session, links everywhere |
| `/obsidian-task` | Adds task to correct board with priority + due date |
| `/obsidian-person` | Creates/updates person note |
| `/obsidian-decide` | Logs decisions to project note |
| `/obsidian-capture` | Zero-friction idea capture |
| `/obsidian-find` | Smart search with context |
| `/obsidian-recap` | Summary of day/week/month |
| `/obsidian-review` | Structured weekly/monthly review |
| `/obsidian-board` | Kanban board view and updates |
| `/obsidian-project` | Project note with board + daily links |
| `/obsidian-health` | Vault audit (contradictions, gaps, stale claims, orphans) |
| `/obsidian-adr` | Architecture Decision Records |
| `/obsidian-visualize` | Visual canvas map of vault |
| `/obsidian-learn` | Reviews learnings, prunes stale ones, surfaces patterns |
| `/obsidian-init` | Generates `_CLAUDE.md`, `index.md`, `log.md` |

### Layer 2: Thinking Tools (4 commands) - "Claude thinks with you"

| Command | What it does |
|---|---|
| `/obsidian-challenge` | Red-teams your idea using your own vault history (3 subagents: Decisions, Failures, Contradictions) |
| `/obsidian-emerge` | Surfaces unnamed patterns from 30 days of notes (4 subagents) |
| `/obsidian-connect [A] [B]` | Bridges two unrelated domains via link graph traversal |
| `/obsidian-graduate` | Turns idea fragment into full project with tasks |

### Layer 3: Context Engine (1 command) - "Claude knows you"

| Command | What it does |
|---|---|
| `/obsidian-world` | Progressive context loading: L0 Identity (~170 tokens), L1 Navigation (~1-2K), L2 Current State (~2-5K), L3 Deep Context (on demand ~5-20K) |

Key files loaded at L0:
- `SOUL.md` - identity, communication style
- `CRITICAL_FACTS.md` - ~120 tokens (timezone, manager, location, company)
- `CORE_VALUES.md` - decision-making principles

### Layer 4: Research Toolkit (5 commands) - "Claude pulls knowledge in"

| Command | API | Cost/call | What it does |
|---|---|---|---|
| `/x-read [url]` | xAI Grok | ~$0.05 | Deep-read X post: verbatim + thread + TL;DR + claims + sentiment |
| `/x-pulse [topic]` | xAI Grok | ~$0.13 | Scan X for trending themes + voices + gaps + hooks + post ideas |
| `/research [topic]` | Perplexity Sonar Pro | ~$0.04 | Web research dossier with recency markers and citations |
| `/research-deep [topic]` | Perplexity + Grok | ~$0.40-0.80 | Vault-first: scans vault, finds gaps, fills them, synthesizes delta report |
| `/youtube [url]` | youtube-transcript-api + Grok | ~$0.04 | Transcript + metadata + comments -> AI-first summary |

### Always-On Layer

**Background Agent (PostCompact hook):**
- Fires after every Claude context compaction
- Reads session summary from transcript JSONL
- Spawns headless `claude -p` subprocess to update vault silently
- Log: `/tmp/obsidian-bg-agent.log`
- Safety: never deletes, archives, or merges -- only adds or updates

**4 Scheduled Agents (cron-based):**

| Agent | When | What |
|---|---|---|
| `morning` | 8 AM | Daily note + overdue tasks |
| `nightly` | 10 PM | Close day + reconcile + synthesize + heal orphans |
| `weekly` | Fridays 6 PM | Weekly review generation |
| `health` | Sundays 9 PM | Vault health audit (report only, no auto-fix) |

---

## 4. The AI-First Vault Rule (7 Rules - Non-Negotiable)

Every note Claude writes must follow these rules (canonical spec: `references/ai-first-rules.md`):

### Rule 1: Self-contained context
Each note explains itself. Future-Claude may pull it via search with zero surrounding context. State the what, why, and when inside the note.

### Rule 2: "For future Claude" preamble
Every note begins with `## For future Claude` header after frontmatter. 2-3 sentence summary so Claude can decide relevance in 10 seconds.

Template:
```markdown
## For future Claude
This note is a [type] about [topic] saved on [date]. It [main purpose].
[Optional caveat about staleness, confidence, or scope.]
```

### Rule 3: Rich, consistent frontmatter
Universal fields (every note):
```yaml
---
date: YYYY-MM-DD
type: <note-type>
tags: [...]
ai-first: true
---
```

### Rule 4: Recency markers per claim
```markdown
- Mem0 raised $24M (as of 2026-04, mem0.ai/blog/series-a)
```

### Rule 5: Sources preserved verbatim
Every external claim keeps its source URL inline for re-verification.

### Rule 6: Cross-links mandatory
Every person, project, idea, decision uses `[[wikilinks]]`. Create stubs for missing targets.

### Rule 7: Confidence levels
Mark claims as: `stated` | `high` | `medium` | `speculation`

### Common Anti-Patterns to Avoid
- `date: today` (use actual YYYY-MM-DD)
- Bare claims without dates
- External URL omitted
- Plain text names instead of `[[wikilinks]]`
- "See above" / "as mentioned" references
- Multi-paragraph prose instead of structured bullets

---

## 5. Vault Architecture

### Wiki-Style (Default - LLM-First)

```
vault/
├── _CLAUDE.md              # Operating manual (read FIRST every session)
├── index.md                # Page catalog (Claude reads this for navigation)
├── log.md                  # Append-only activity timeline
├── SOUL.md                 # Identity, values, communication style
├── CRITICAL_FACTS.md       # ~120 tokens always loaded
├── PINNED.md               # Task-specific context (temporary, cleared after task)
├── raw/                    # IMMUTABLE source material
│   ├── articles/
│   ├── transcripts/
│   ├── pdfs/
│   └── videos/
├── wiki/                   # Claude's workspace
│   ├── entities/           # People, companies, tools (flat)
│   ├── concepts/           # Ideas, frameworks, synthesis
│   ├── projects/
│   ├── daily/
│   ├── logs/
│   ├── reviews/
│   ├── tasks/
│   └── decisions/          # ADRs
├── boards/                 # Kanban boards
└── templates/
```

Key principles:
- `raw/` is IMMUTABLE - Claude reads, never writes
- `wiki/` is Claude's workspace - sole writer
- `index.md` is the front door - cheaper than searching
- Flat folders over nested

### Obsidian-Style (Alternative - Human-First)

```
vault/
├── Daily/, Projects/, People/, Ideas/, Knowledge/
├── Dev Logs/, Tasks/, Reviews/, Boards/, Templates/
├── Content/, Goals/, Health/, Finances/, Jobs/
```

### Bi-Temporal Facts (Never Overwrite)

When facts change, NEVER delete old value. Append to `timeline:` array:
```yaml
timeline:
  - fact: "CTO at Acme Corp"
    from: 2024-01-01        # event time
    until: 2026-04-07
    learned: 2026-02-23     # transaction time
    source: "[[2026-02-23]]"
  - fact: "Architect at Acme Corp"
    from: 2026-04-07
    until: present
    learned: 2026-04-07
```

---

## 6. _CLAUDE.md Template

The `_CLAUDE.md` file lives at vault root. Every Claude surface reads it on session start. Key sections:

```markdown
# Claude Operating Manual -- [Your Name]'s Vault

## Section 0 -- AI-First Vault Rule (read first, applies to every note)
[The 7 rules]

## Vault Identity
- Owner: [Full Name]
- Primary purpose: [e.g. "Life OS"]
- Last updated: [YYYY-MM-DD]

## Folder Map
[Table of folders and purposes]

## Key Files
- Dashboard: [[Home]]
- Work Board: [[Boards/Work]]

## Active Context
- Current top priority: [...]
- Current job: [Company] -- [Role]
- Manager: [Name]

## Auto-Save Rules
Auto-save without asking: decisions, people, tasks, dev work, mentions
Ask before saving: Finances/, private folders

## Naming Conventions
- Daily: YYYY-MM-DD.md
- Dev logs: YYYY-MM-DD -- Description.md
- People: Full Name.md
- Archive: _archived_ prefix

## Kanban Convention
Columns: Backlog | This Week | In Progress | Waiting On | Done
Priority: red (critical) | yellow (important) | green (low)

## Propagation Rules
[Table: event -> what else to update]

## People to Know
[Table of key people]

## Projects Currently Active
[List with one-line status]
```

### Assistant Mode Template
For maintaining a vault FOR someone else (exec assistant, consultant):
- Separate Subject vs Operator identity
- Write in Subject's voice
- Privacy rules for operator vs subject access
- Audit trail for who made each decision

---

## 7. Frontmatter Schemas by Note Type

### Daily Note
```yaml
date: YYYY-MM-DD
type: daily
tags: [daily]
mood: ""
energy: ""
ai-first: true
```

### Project Note
```yaml
date: YYYY-MM-DD
updated: YYYY-MM-DD
type: project
status: active | planning | completed | archived | on-hold
tags: [project]
related-people: ["[[People/...]]"]
related-projects: ["[[Projects/...]]"]
ai-first: true
```

### Person Note
```yaml
date: YYYY-MM-DD
updated: YYYY-MM-DD
type: person
tags: [person]
role: ""
company: "[[Companies/...]]"
relationship: weak | medium | strong
last-interaction: YYYY-MM-DD
related-projects: ["[[Projects/...]]"]
ai-first: true
```

### Idea Note
```yaml
date: YYYY-MM-DD
type: idea
status: captured | exploring | graduated | shelved
tags: [idea]
ai-first: true
```

### Task Note
```yaml
date: YYYY-MM-DD
type: task
status: in-progress | done | waiting | cancelled
priority: red | yellow | green
due: YYYY-MM-DD
tags: [task]
ai-first: true
```

### Dev Log
```yaml
date: YYYY-MM-DD
type: devlog
tags: [devlog]
project: "[[Projects/...]]"
ai-first: true
```

### Decision (ADR)
```yaml
date: YYYY-MM-DD
type: adr
status: proposed | accepted | superseded
decision: ""
tags: [adr, decision]
ai-first: true
```

### Research Notes
All research types set `ai-first: true` and follow universal rules.

---

## 8. Parallel Subagent Architecture

| Command | Subagents Spawned |
|---|---|
| `/obsidian-save` | People, Projects, Tasks, Decisions, Ideas, Content (if social-media/ exists) |
| `/obsidian-challenge` | Decisions, Failures, Contradictions |
| `/obsidian-emerge` | Daily notes, Dev logs, Decisions, Ideas |
| `/obsidian-health` | Links, Duplicates, Frontmatter, Staleness, Orphans |
| `/obsidian-recap` | One agent per daily note in date range |
| `/obsidian-init` | Dashboard, Templates, Boards, Samples |

---

## 9. Setup Guide

### Quick Install (one line)
```bash
curl -fsSL https://raw.githubusercontent.com/eugeniughelbur/obsidian-second-brain/main/scripts/quick-install.sh | bash
```

### Manual Install (two commands)
```bash
git clone https://github.com/eugeniughelbur/obsidian-second-brain ~/.claude/skills/obsidian-second-brain
bash ~/.claude/skills/obsidian-second-brain/scripts/setup.sh "/path/to/your/vault"
```

### What setup.sh Does
1. Validates vault path
2. Adds `OBSIDIAN_VAULT_PATH` to `~/.claude/settings.json`
3. Wires PostCompact background agent hook
4. Makes hook script executable
5. Symlinks slash commands into `~/.claude/commands/`
6. Optionally configures MCP server (`mcp-obsidian`)

### Bootstrap a New Vault
```bash
python bootstrap_vault.py --path ~/my-vault --name "Your Name"
python bootstrap_vault.py --path ~/my-vault --name "Your Name" --preset builder
python bootstrap_vault.py --path ~/my-vault --name "Your Name" --style obsidian
python bootstrap_vault.py --path ~/my-vault --name "Your Name" --mode assistant --subject "Boss Name"
```

Presets: `executive` | `builder` | `creator` | `researcher`

### Research Toolkit Setup (Optional)
```bash
mkdir -p ~/.config/obsidian-second-brain
cp .env.example ~/.config/obsidian-second-brain/.env
chmod 600 ~/.config/obsidian-second-brain/.env
uv sync   # installs Python deps
```

API keys needed:

| Key | Source | Required for |
|---|---|---|
| `XAI_API_KEY` | console.x.ai | /x-read, /x-pulse, /youtube summary |
| `PERPLEXITY_API_KEY` | perplexity.ai/settings/api | /research, /research-deep |
| `YOUTUBE_API_KEY` | console.cloud.google.com | /youtube metadata (optional) |

### After Install
1. Run `/obsidian-init` to generate `_CLAUDE.md`, `index.md`, `log.md`
2. Restart Claude Code to activate commands
3. Run `/obsidian-world` to load vault context

### MCP Server (Optional, Faster)
```bash
claude mcp add obsidian-vault -s user -- npx -y mcp-obsidian "/path/to/vault"
```
Without MCP, Claude reads/writes vault files directly (works fine, just more verbose).

### Recommended Obsidian Plugins
- **Dataview** - powers dashboard queries
- **Templater** - powers Templates/ folder
- **Kanban** - powers Boards/ folder
- **Calendar** - daily note navigation

---

## 10. Background Agent Hook (PostCompact)

File: `hooks/obsidian-bg-agent.sh`

Flow:
1. User works in Claude Code normally
2. Context compaction occurs (automatic)
3. PostCompact hook fires
4. Script reads JSON summary from stdin, extracts `transcript_path`
5. Parses JSONL transcript for `isCompactSummary: true` entries
6. Builds prompt with session summary
7. Spawns headless `claude --dangerously-skip-permissions -p` in vault directory
8. Agent reads `_CLAUDE.md`, identifies vault-worthy items, updates notes
9. Exits silently - user sees nothing
10. Log: `/tmp/obsidian-bg-agent.log`

Safety constraints: Uses filesystem tools only (no MCP in subprocess). Never deletes/archives/merges. Only adds or updates.

settings.json hook config:
```json
{
  "hooks": {
    "PostCompact": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "/path/to/hooks/obsidian-bg-agent.sh",
        "timeout": 10,
        "async": true
      }]
    }]
  },
  "env": {
    "OBSIDIAN_VAULT_PATH": "/path/to/vault"
  }
}
```

---

## 11. Write Rules and Propagation

### The Propagation Rule
Never create a note in isolation. Every write has ripple effects:

| Event | Also Update |
|---|---|
| New project | Board (Backlog) + daily note |
| Task completed | Board (Done, strikethrough) + project note + daily note |
| Person interaction | Daily note + People/ note |
| Dev session | Dev Logs/ + project note (Recent Activity) + daily note |
| Decision made | Project note (Key Decisions) + daily note |
| Any vault write | `log.md` (append entry) + `index.md` (if new note) |

### Search Before Write
Always search before creating any note. Duplicate notes are "vault rot."

### Stub Notes
When a link target doesn't exist, create a minimal stub:
```yaml
---
date: YYYY-MM-DD
tags:
  - person
---
# Person Name
<!-- Note created as stub. Expand when more info is available. -->
```

### Section Injection (Updating Existing Notes)
1. Read the full file
2. Find the target section heading
3. Append below the last item in that section
4. Write back the full file

### Archiving
Soft archive (preferred): `_archived_` prefix. Never delete vault notes.

---

## 12. Data Flow Summary

```
User Conversation
       |
       v
  /obsidian-save --> [5 parallel agents] --> People/, Projects/, Tasks/, Ideas/, Boards/
       |                                              |
       v                                              v
  Daily/YYYY-MM-DD.md  <---- propagation ----  All created/updated notes
       ^
       |
  /obsidian-world (reads vault state at session start)
       ^
       |
  _CLAUDE.md (read by every Claude surface on boot)


Background:
  PostCompact hook --> headless claude -p --> vault updated silently

Scheduled:
  8 AM  --> morning agent  --> daily note + overdue tasks
  10 PM --> nightly agent  --> end of day + reconcile + synthesize + heal
  Fri   --> weekly agent   --> review note
  Sun   --> health agent   --> audit report

Research:
  /research-deep --> Phase 1: vault scan --> Phase 2: gap analysis (Perplexity)
                 --> Phase 3: targeted research (Perplexity + Grok)
                 --> Phase 4: synthesis --> vault propagation via /obsidian-save
```

---

## 13. Key Design Principles

1. **Search before create** - Never create duplicate notes
2. **Propagate everything** - Every write updates all linked notes
3. **No orphans** - Every note must be linked from somewhere
4. **Fuzzy matching** - All name arguments handle typos
5. **_CLAUDE.md is the source of truth** - Overrides all defaults
6. **Agents read, humans decide** - Thinking tools present evidence
7. **Vault compounds** - More writing = more context = more powerful AI
8. **Two-Output Rule** - Every interaction produces answer + vault update
9. **Raw is immutable** - Original sources never modified
10. **Bi-temporal facts** - Track when fact was true AND when vault learned it

---

## 14. Relevance to Our Project

### How to Apply This to Our AI Agency Vault

**Immediate applications:**
- Use the `_CLAUDE.md` template for our Obsidian vault structure
- Adopt the AI-first rule for all vault notes (preamble, frontmatter, wikilinks)
- Implement the propagation rule (no orphaned notes)
- Use bi-temporal facts for tracking client information changes
- Install as a Claude Code skill for our development workflow

**Architecture patterns to adopt:**
- Parallel subagents for different note types (matches our multi-agent patterns)
- PostCompact hook for background vault maintenance
- Progressive context loading (L0-L3) for token efficiency
- CRITICAL_FACTS.md for always-loaded context (~120 tokens)

**For AI agency clients:**
- Assistant mode template for managing client vaults
- Presets (executive, builder, creator, researcher) for different client types
- The research toolkit for automated market research
- Content pipeline via social-media/ folder integration

**Stack alignment:**
- Python 3.10+ (matches our stack)
- PostgreSQL-compatible thinking (bi-temporal facts = temporal tables pattern)
- Claude Code native (our primary development tool)
- MCP integration (aligns with our protocol strategy)
