# Claude Code Memory Systems with Obsidian: Comprehensive Research

> Research compiled: May 2026
> Covers: CLAUDE.md templates, Obsidian vault structures, hook configurations, MCP servers, workflow recipes, and memory approach comparisons.

---

## Table of Contents

1. [CLAUDE.md Templates Collection](#1-claudemd-templates-collection)
2. [Obsidian Vault Templates for AI Memory](#2-obsidian-vault-templates-for-ai-memory)
3. [Hook Configurations for Memory](#3-hook-configurations-for-memory)
4. [MCP Server Setup for Obsidian](#4-mcp-server-setup-for-obsidian)
5. [Workflow Recipes](#5-workflow-recipes)
6. [Comparison of Memory Approaches](#6-comparison-of-memory-approaches)

---

## 1. CLAUDE.md Templates Collection

### Key Repositories

| Repository | Description | Link |
|---|---|---|
| **abhishekray07/claude-md-templates** | Stack-specific templates (Next.js, Python/FastAPI, Generic) with best practices | https://github.com/abhishekray07/claude-md-templates |
| **josix/awesome-claude-md** | Curated collection of exemplary CLAUDE.md files from public projects, scored and categorized | https://github.com/josix/awesome-claude-md |
| **shanraisshan/claude-code-best-practice** | Patterns for skills, subagents, hooks, and commands | https://github.com/shanraisshan/claude-code-best-practice |
| **ruvnet/ruflo Wiki** | Templates by project type (Web, Mobile, API, AI/ML, DevOps), architecture (Microservices, Serverless), methodology (TDD, DDD), language/framework, and team size | https://github.com/ruvnet/ruflo/wiki/CLAUDE-MD-Templates |
| **ChrisWiles/claude-code-showcase** | Full project config with hooks, skills, agents, commands, and GitHub Actions | https://github.com/ChrisWiles/claude-code-showcase |
| **luongnv89/claude-howto** | Visual, example-driven guide synced with Claude Code releases (v2.1.131, May 2026) | https://github.com/luongnv89/claude-howto |
| **ArthurClune/claude-md-examples** | Real-world CLAUDE.md examples | https://github.com/ArthurClune/claude-md-examples |
| **davila7/claude-code-templates** | CLI tool for configuring and monitoring Claude Code | https://github.com/davila7/claude-code-templates |

### Configuration Hierarchy

CLAUDE.md files load at three levels:
- **Global** (`~/.claude/CLAUDE.md`): Personal preferences across all projects
- **Project** (`.claude/CLAUDE.md`): Team conventions, committed to git
- **Local** (`./CLAUDE.local.md`): Personal overrides, gitignored

Additionally, `.claude/rules/` can hold path-scoped standards that activate only for specific file types or directories.

### Best Practices for CLAUDE.md

**Size Constraints:**
- Keep project files **under 80 lines** (HumanLayer keeps theirs under 60)
- Target under 200 lines per file; longer files consume context and reduce adherence
- If it grows beyond 500 lines, move to structured markdown knowledge base

**What to Include:**
- Concrete style rules (indentation, naming)
- Stack-specific conventions
- Build/test commands (e.g., `npm run test`, `pytest -x`)
- Domain context unique to the project
- Project structure overview

**What to Avoid:**
- Generic personality instructions ("Be thoughtful")
- Full document embeddings via `@` references
- Duplicate rules across hierarchy levels
- Formatting rules already enforced by linters

**Self-Improvement Loop:**
After corrections, tell Claude: "Update CLAUDE.md so you don't make that mistake again."

### Template: Next.js/React/TypeScript

Source: `abhishekray07/claude-md-templates/project/nextjs-typescript.md`

Key sections:
- Project stack and dependencies
- File/folder structure conventions
- Component patterns (RSC vs client components)
- State management approach
- API route patterns
- Testing strategy (Jest, Playwright)
- Build/deploy commands

### Template: Python/FastAPI

Source: `abhishekray07/claude-md-templates/project/python-fastapi.md`

Key sections:
- Python version and virtual environment setup
- Pydantic v2 models for request/response schemas
- Async endpoints with SQLAlchemy 2.0
- Test framework (pytest fixtures in conftest.py)
- Migration commands (Alembic)
- Linting (ruff, mypy)

### Template: AI/ML Projects

Source: `ruvnet/ruflo/wiki/CLAUDE-MD-AI-ML-Projects`

Key sections:
- Seven specialized agent types (Data Engineer, ML Researcher, Model Trainer, MLOps Engineer, Data Scientist, Model Validator, Performance Monitor)
- ML pipeline phases: Data -> Model -> MLOps -> Deployment
- Framework-specific configs (TensorFlow MirroredStrategy, PyTorch NCCL)
- Experiment tracking (MLflow)
- Directory structure: `data/`, `models/`, `notebooks/`, `src/`, `tests/`, `deployment/`, `configs/`
- Privacy coordination (differential privacy)
- A/B testing with statistical significance validation

### Template: Monorepo Projects

Source: `MuhammadUsmanGM/claude-code-best-practices/examples/claude-md-monorepo.md`

Structure pattern:
```
acme-platform/
  CLAUDE.md              # Global conventions
  packages/
    api/CLAUDE.md        # Backend: database migrations, API patterns
    web/CLAUDE.md        # Frontend: component conventions, state management
    shared/CLAUDE.md     # Shared types and utilities
  apps/
    web/                 # Next.js frontend
    api/                 # Express API server
  infra/                 # Terraform
```

Put shared conventions in root CLAUDE.md and service-specific context in child directories. Claude loads the most local file for the current working directory.

### Template: CLAUDE.md Referencing Obsidian Vault

```markdown
# Project Memory

## Obsidian Knowledge Base
Refer to ~/claude-memory/Index.md for accumulated patterns and decisions.

## Context Navigation (3-Layer Rule)
1. **First:** Query graphify-out/graph.json or wiki/index.md
2. **Second:** Query Obsidian vault for decisions and progress
3. **Third:** Only read raw code files when editing

## Session Commands
- `/resume` - Load last 3 session logs and current decisions
- `/save` - Create session log with work completed, decisions, pending items
```

---

## 2. Obsidian Vault Templates for AI Memory

### A. obsidian-mind (breferrari/obsidian-mind)

**Link:** https://github.com/breferrari/obsidian-mind

**Description:** A complete Obsidian vault that gives AI coding agents (Claude Code, Codex CLI, Gemini CLI) persistent memory with automated hooks.

**Requirements:** Obsidian 1.12+, Node 22+ LTS, Git

**Installation:**
```bash
# Via ShardMind (recommended)
npm install -g shardmind
mkdir my-vault && cd my-vault
shardmind install github:breferrari/obsidian-mind

# Or direct clone
git clone https://github.com/breferrari/obsidian-mind.git
```

**Folder Structure:**
```
obsidian-mind/
  Home.md                    # Vault dashboard
  CLAUDE.md                  # Operating manual (loaded each session)
  AGENTS.md                  # Multi-agent compatibility
  vault-manifest.json        # Template metadata & schemas

  bases/                     # Dynamic database views
    Work Dashboard, Incidents, People Directory,
    1:1 History, Review Evidence, Competency Map

  work/
    active/                  # Current projects (1-3 active)
    archive/YYYY/            # Completed projects by year
    incidents/               # Incident documentation
    1-1/                     # 1:1 notes: <Person> YYYY-MM-DD.md

  org/
    people/                  # One note per person
    teams/                   # One note per team

  perf/
    Brag Doc.md              # Running win log with links
    brag/                    # Quarterly brag notes
    competencies/            # One per competency
    evidence/                # PR scans & review data

  brain/
    North Star.md            # Goals (injected every session)
    Memories.md              # Memory topic index
    Key Decisions.md         # Significant decisions
    Patterns.md              # Recurring patterns
    Gotchas.md               # Failure modes & lessons
    Skills.md                # Custom workflows

  reference/                 # Architecture & codebase knowledge
  thinking/                  # Scratchpad
  templates/                 # Obsidian templates with YAML frontmatter

  .claude/
    commands/                # 18 slash commands
    agents/                  # 9 specialized subagents
    scripts/                 # Hook implementations
    skills/                  # Obsidian + QMD skills
    settings.json            # 5 hook configurations

  .mcp.json                  # MCP server config
```

**Key Commands (18 total):**
- `/om-standup` - Morning kickoff (loads context, surfaces tasks)
- `/om-dump` - Freeform capture with auto-routing
- `/om-wrap-up` - Session review (verify, link, spot wins)
- `/om-weekly` - Cross-session synthesis
- `/om-review-brief` - Generate review documentation
- `/om-incident-capture` - Structure incidents
- `/om-vault-audit` - Check indexes, orphans, links

**Subagents (9 specialized):** brag-spotter, context-loader, cross-linker, people-profiler, review-prep, slack-archaeologist, vault-librarian, review-fact-checker, vault-migrator

**Token Efficiency (tiered loading):**
- Always: CLAUDE.md + SessionStart excerpt (~2K tokens)
- On-demand: QMD semantic search results
- Per message: Classification routing hints (~100 tokens)
- After writes: PostToolUse validation (~200 tokens)

### B. claude-infinite-context (backyarddd/claude-infinite-context)

**Link:** https://github.com/backyarddd/claude-infinite-context

**Description:** Permanent, fully automatic memory backed by Obsidian vault. Persistent, searchable long-term memory stored as Markdown files.

**Installation:**
```bash
git clone https://github.com/backyarddd/claude-infinite-context.git
cd obsidian-infinite-context
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Folder Structure:**
```
Claude-Memory/
  _GLOBAL.md              # Cross-project preferences
  _KEYS.md                # Global API keys fallback
  projects/
    {project-name}/
      _PROJECT.md          # Project master memory
      _KEYS.md             # Project-specific credentials
      _ERRORS.md           # Mistakes and lessons
      _DECISIONS.md        # Architectural decisions
      sessions/            # Conversation logs
      notes/               # Reference materials
```

**Configuration (`~/.claude/obsidian-memory.json`):**
```json
{
  "vaultPath": "/path/to/vault",
  "memoryDir": "/path/to/vault/Claude-Memory",
  "created": "2026-03-19",
  "version": "1.0.0"
}
```

**Seven modular skills:**
1. `obsidian-memory` - Core auto-recall behavior
2. `obsidian-search` - Query across all memory files
3. `obsidian-forget` - Delete specific memories
4. `obsidian-scan` - Index existing projects
5. `obsidian-update` - Self-update to latest version
6. `obsidian-rollback` - Undo recent changes
7. `obsidian-status` - Display memory overview

**Automatic triggers:** Session begins (recalls context), API key shared (saves to _KEYS.md), preference stated (records for future), error occurs (logs root cause + lesson), technical choice made (documents reasoning), task completion (writes session log).

**Onboarding existing projects:** Run `/obsidian-memory scan` to analyze entire project structure and generate initial memory files.

### C. claude-code-memory-setup (lucasrosati/claude-code-memory-setup)

**Link:** https://github.com/lucasrosati/claude-code-memory-setup

**Description:** Up to 71.5x fewer tokens per session using Obsidian Zettelkasten + Graphify AST-based code graphs.

**Folder Structure:**
```
~/vault/
  CLAUDE.md               # Global instructions
  permanent/              # Atomic consolidated notes
  inbox/                  # Raw capture area
  fleeting/               # Temporary notes
  templates/              # Note templates
  logs/                   # Session logs
  references/             # Reference materials
  my-project/             # Per-project MOCs
    architecture/
    pipeline/
    data/
    features/
    logs/
  chats/
    code/                 # Claude Code imports
    web/                  # Claude Web imports
  graphify/
    my-project/           # Generated code nodes
```

**Graphify Setup:**
```bash
pip install graphifyy && graphify install
graphify . --obsidian --obsidian-dir ~/vault/graphify/project-name
```

**Zettelkasten Rules:**
- Use wikilinks: `[[note-name]]` (not markdown links)
- Mandatory YAML frontmatter on every note
- Filenames in kebab-case
- 1 concept per permanent note (atomicity)
- Minimum 2 wikilinks per note (dense linking)

**Token Reduction Results (126 TypeScript files):**
- Graph nodes: 332
- Token reduction per query: 499x
- Graph.json size: 172 KB
- LLM cost for generation: 0 tokens (tree-sitter AST)

### D. second-brain-gtd (sean-esk/second-brain-gtd)

**Link:** https://github.com/sean-esk/second-brain-gtd

**Description:** GTD + Zettelkasten + Obsidian as a Claude Code skill for productivity.

**Folder Structure:**
```
00-Inbox/               # Daily captures and fleeting notes
01-Projects/            # Multi-step outcomes with deadlines
02-Areas/               # Ongoing responsibilities
03-Resources/           # Reference materials
04-Archives/            # Completed/inactive items
Daily Plans/
Meeting Notes/
Permanent Notes/        # Zettelkasten-style insights
Templates/
```

**GTD Workflow:** Capture -> Clarify -> Organize -> Review -> Engage (~20-25 min daily)

**Setup (Claude Desktop):**
1. Install Filesystem extension
2. Grant vault folder access
3. Download and install skill zip
4. Start conversation: "Set up my Second Brain"

### E. Additional Vault Templates

| Template | Link | Approach |
|---|---|---|
| **obsidian-second-brain** (eugeniughelbur) | https://github.com/eugeniughelbur/obsidian-second-brain | 31 commands, vault-first research, scheduled agents |
| **khanxxy/obsidian-second-brain** | https://github.com/khanxxy/obsidian-second-brain | Universal VAULT.md pattern, skill graph architecture, tool-agnostic |
| **gokhanarkan/minimal-second-brain** | https://github.com/gokhanarkan/minimal-second-brain | 3 folders (Inbox/Projects/Knowledge), manifest files for Claude/Copilot, automated maintenance |
| **geoHeil/second-brain-obsidian-template** | https://github.com/geoHeil/second-brain-obsidian-template | Classic second brain template |

### F. ADR (Architectural Decision Records) in Obsidian

**Reference:** https://github.com/joelparkerhenderson/architecture-decision-record

**MADR Template (Markdown ADR):**
```markdown
---
date: 2026-05-08
status: proposed | accepted | deprecated | superseded
owner: [name]
context: [link to relevant notes]
---

# ADR-001: [Title]

## Context
What is the issue motivating this decision?

## Decision
What is the change being proposed?

## Consequences
What are the positive and negative results?

## Alternatives Considered
What other options were evaluated?
```

**Obsidian ADR Setup (from medium.com/@mttpla):**
- Create `decisions/` folder in vault
- Use Obsidian templates plugin for ADR creation
- Leverage graph view to visualize decision relationships
- Track via Git for version history
- Some teams use folder name "decisions" instead of "ADRs" to broaden scope (vendor decisions, planning decisions, scheduling)

---

## 3. Hook Configurations for Memory

### Official Hook Reference

**Source:** https://code.claude.com/docs/en/hooks

Claude Code supports **28+ lifecycle events** (expanded from the original 12). Hooks fire at three cadences:
- Once per session: `SessionStart`, `SessionEnd`
- Once per turn: `UserPromptSubmit`, `Stop`, `StopFailure`
- Per tool call: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`

### Hook Configuration Locations

```
~/.claude/settings.json           -> All projects (local only)
.claude/settings.json             -> Single project (shareable)
.claude/settings.local.json       -> Single project (local only)
Managed policy settings           -> Organization-wide
Plugin hooks/hooks.json           -> When plugin enabled
Skill/Agent frontmatter           -> While component active
```

### Four Hook Handler Types

| Type | Use | Example |
|------|-----|---------|
| `command` | Local shell scripts | `"type": "command", "command": "python validator.py"` |
| `http` | Remote endpoints | `"type": "http", "url": "http://localhost:8080/hooks"` |
| `prompt` | LLM evaluation | `"type": "prompt", "prompt": "Evaluate if..."` |
| `agent` | Subagent with tools | `"type": "agent", "prompt": "Verify..."` |

### Exit Code Meanings

| Code | Meaning | Behavior |
|------|---------|----------|
| 0 | Success | Parse stdout for JSON output |
| 2 | Blocking error | Ignore stdout, stderr fed to Claude |
| Other | Non-blocking error | Show first line of stderr |

### SessionStart Hook: Load Context from Obsidian

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/load-obsidian-context.sh"
          }
        ]
      }
    ]
  }
}
```

**load-obsidian-context.sh:**
```bash
#!/bin/bash
VAULT="$HOME/obsidian-vault/Claude-Memory"
PROJECT=$(basename "$CLAUDE_PROJECT_DIR")

# Read project memory
PROJECT_MEMORY=""
if [ -f "$VAULT/projects/$PROJECT/_PROJECT.md" ]; then
  PROJECT_MEMORY=$(cat "$VAULT/projects/$PROJECT/_PROJECT.md")
fi

# Read recent errors
ERRORS=""
if [ -f "$VAULT/projects/$PROJECT/_ERRORS.md" ]; then
  ERRORS=$(tail -50 "$VAULT/projects/$PROJECT/_ERRORS.md")
fi

# Read recent decisions
DECISIONS=""
if [ -f "$VAULT/projects/$PROJECT/_DECISIONS.md" ]; then
  DECISIONS=$(tail -30 "$VAULT/projects/$PROJECT/_DECISIONS.md")
fi

# Read global preferences
GLOBAL=""
if [ -f "$VAULT/_GLOBAL.md" ]; then
  GLOBAL=$(cat "$VAULT/_GLOBAL.md")
fi

echo "## Project Memory"
echo "$PROJECT_MEMORY"
echo ""
echo "## Recent Errors & Lessons"
echo "$ERRORS"
echo ""
echo "## Key Decisions"
echo "$DECISIONS"
echo ""
echo "## Global Preferences"
echo "$GLOBAL"
```

### Stop Hook: Save Session Summary to Obsidian

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/memory_extractor.py"
          }
        ]
      }
    ]
  }
}
```

The memory_extractor.py script:
1. Reads stdin JSON payload containing session metadata
2. Locates session transcript files in `~/.claude/projects/`
3. Parses JSONL transcript into readable format
4. Sends transcript to Claude API with extraction prompt
5. Writes insights as markdown to vault folders (Patterns/, Mistakes/, Decisions/, Context/)
6. Regenerates Index.md

**Requires:** `ANTHROPIC_API_KEY` environment variable

### PreCompact Hook: Backup Transcript

```json
{
  "hooks": {
    "PreCompact": [
      {
        "matcher": "manual|auto",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/backup-transcript.py",
            "async": true
          }
        ]
      }
    ]
  }
}
```

The obsidian-mind implementation backs up to `thinking/session-logs/`.

### PostToolUse Hook: Validate Writes

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\""
          },
          {
            "type": "command",
            "command": "npx eslint --fix \"$CLAUDE_TOOL_INPUT_FILE_PATH\""
          }
        ]
      }
    ]
  }
}
```

For Obsidian vault validation (from obsidian-mind):
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node --experimental-strip-types .claude/scripts/validate-note.ts"
          }
        ]
      }
    ]
  }
}
```
Validates: frontmatter present, wikilinks exist, follows template schema.

### UserPromptSubmit Hook: Inject Context

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/skill-activation.mjs"
          }
        ]
      }
    ]
  }
}
```

The obsidian-mind implementation classifies content (decision/incident/win/1:1/architecture/person/project) and injects routing hints (~100 tokens per message).

For UserPromptSubmit, stdout output is added as `additionalContext` to Claude's context.

### Complete settings.json with All Memory Hooks

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/load-obsidian-context.sh",
            "timeout": 10,
            "statusMessage": "Loading project memory from Obsidian..."
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ~/.claude/hooks/classify-and-route.mjs",
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/pre-write-check.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/post-write-format.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "manual|auto",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/backup-transcript.py",
            "async": true,
            "statusMessage": "Backing up session transcript..."
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/save-session-summary.py",
            "timeout": 30,
            "statusMessage": "Saving session learnings to Obsidian..."
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/session-cleanup.py",
            "async": true
          }
        ]
      }
    ]
  }
}
```

### How to Chain Multiple Hooks

Multiple hooks within the same event run sequentially in order. Multiple hook groups for the same event can have different matchers:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {"type": "command", "command": "prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\""},
          {"type": "command", "command": "eslint --fix \"$CLAUDE_TOOL_INPUT_FILE_PATH\""}
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {"type": "command", "command": "bash ~/.claude/hooks/log-bash-execution.sh"}
        ]
      }
    ]
  }
}
```

Hooks deduplicate by command string (command hooks) or URL (HTTP hooks).

### Key Hook Repositories

| Repository | Description | Link |
|---|---|---|
| **disler/claude-code-hooks-mastery** | All 13 hook types demonstrated with practical examples | https://github.com/disler/claude-code-hooks-mastery |
| **ChrisWiles/claude-code-showcase** | Production setup with hooks, skills, agents, commands | https://github.com/ChrisWiles/claude-code-showcase |

---

## 4. MCP Server Setup for Obsidian

### A. MCPVault

**Link:** https://mcp-obsidian.org/ / https://mcpvault.org/install/

**Description:** Universal AI bridge for Obsidian vaults. Lets Claude, ChatGPT+, and other assistants access your vault locally without cloud sync.

**Setup:**
```bash
npx @bitbonsai/mcpvault@latest /path/to/your/vault
```

**Configuration in `.mcp.json`:**
```json
{
  "mcpServers": {
    "mcpvault": {
      "command": "npx",
      "args": ["@bitbonsai/mcpvault@latest", "/path/to/your/vault"]
    }
  }
}
```

**Features (as of April 2026):**
- Read, search, and manage vault notes
- delete_note with soft-delete options
- AST-aware YAML preservation for frontmatter
- list_all_tags tool (scans vault for all frontmatter tags and inline hashtags)

**Compatible with:** Claude Desktop, ChatGPT+, Claude Code, OpenCode, Gemini CLI, Cursor IDE, Windsurf

### B. mcp-obsidian (MarkusPfundstein/mcp-obsidian)

**Link:** https://github.com/MarkusPfundstein/mcp-obsidian

**Description:** MCP server that interacts with Obsidian via the Local REST API community plugin.

**Prerequisites:** Install "Local REST API" plugin in Obsidian (Community Plugins marketplace).

**Configuration:**
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "mcp-obsidian"],
      "env": {
        "OBSIDIAN_API_KEY": "your-api-key-from-plugin",
        "OBSIDIAN_HOST": "localhost",
        "OBSIDIAN_PORT": "27124"
      }
    }
  }
}
```

**Available Tools:**
- `list_files_in_vault` - List all files
- `list_files_in_dir` - List files in directory
- `get_file_contents` - Read note content
- `search` - Search for documents matching text
- `patch_content` - Insert content relative to headings
- `append_content` - Append to new or existing files
- `delete_file` - Delete files

### C. smart-connections-mcp

**Link:** https://github.com/dan6684/smart-connections-mcp (also gogogadgetbytes and msdanyg variants)

**Description:** MCP server for semantic search using Smart Connections plugin embeddings. Uses 384-dimensional vectors (TaylorAI/bge-micro-v2 model) with cosine similarity.

**Prerequisites:** Install "Smart Connections" plugin in Obsidian and let it build embeddings.

**Configuration:**
```json
{
  "mcpServers": {
    "smart-connections": {
      "command": "node",
      "args": ["/path/to/smart-connections-mcp/index.js"],
      "env": {
        "SMART_VAULT_PATH": "/path/to/your/obsidian/vault"
      }
    }
  }
}
```

**Available Tools:**
- Semantic search by text query
- Find similar notes by note path
- Build multi-level connection graphs
- Block-level content granularity
- Configurable similarity threshold (0-1, default 0.5)

### D. obsidian-mcp-tools (jacksteamdev/obsidian-mcp-tools)

**Link:** https://github.com/jacksteamdev/obsidian-mcp-tools

**Description:** Obsidian community plugin providing MCP integrations including semantic search and custom Templater prompts. Install directly from Obsidian's Community Plugins marketplace.

### E. obsidian-claude-code-mcp (iansinnott/obsidian-claude-code-mcp)

**Link:** https://github.com/iansinnott/obsidian-claude-code-mcp

**Description:** Connects Claude Code to Obsidian via WebSocket auto-discovery on port 22360. No REST API plugin needed.

**Key advantage:** Claude Code automatically discovers and connects to running Obsidian instances.

### F. Basic Memory MCP

**Link:** https://docs.basicmemory.com/integrations/claude-code

**Cloud Setup:**
```bash
claude mcp add -s user -t http basic-memory-cloud https://cloud.basicmemory.com/mcp
```
Then complete OAuth authentication flow.

**Local Setup:**
```bash
claude mcp add basic-memory basic-memory mcp
```

**Verify:** Run `/mcp` in Claude Code to confirm 17 Basic Memory tools appear.

**Key features:** Semantic search, observations and relations, cross-project knowledge, searchable notes.

**Troubleshooting:** If tools missing, reinstall. Check `basic-memory status` and logs in `~/.basic-memory/logs/`.

### G. Local RAG MCP Servers

**mcp-local-rag** (https://github.com/shinpr/mcp-local-rag):
- Markdown code blocks kept intact (never split mid-block)
- Uses Transformers.js embedding model (all-MiniLM-L6-v2, configurable)
- Vectors stored in LanceDB (file-based, no server process)

**knowledge-rag** (https://github.com/lyonzin/knowledge-rag):
- 12 MCP tools, 20 format parsers
- Hybrid search: BM25 + semantic vectors + cross-encoder reranking
- ONNX runtime, fully local, no API keys

### H. Configuring Multiple MCP Servers Together

**claude_desktop_config.json example (Windows: `%APPDATA%\Claude\claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "mcpvault": {
      "command": "npx",
      "args": ["@bitbonsai/mcpvault@latest", "C:/Users/you/ObsidianVault"]
    },
    "smart-connections": {
      "command": "node",
      "args": ["C:/tools/smart-connections-mcp/index.js"],
      "env": {
        "SMART_VAULT_PATH": "C:/Users/you/ObsidianVault"
      }
    },
    "basic-memory": {
      "command": "basic-memory",
      "args": ["mcp"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/Users/you/ObsidianVault"]
    }
  }
}
```

**For Claude Code (`.mcp.json` in project root):**
```json
{
  "mcpServers": {
    "mcpvault": {
      "command": "npx",
      "args": ["@bitbonsai/mcpvault@latest", "/home/user/vault"]
    },
    "mem0": {
      "command": "mem0-mcp-server",
      "args": [],
      "env": {
        "MEM0_API_KEY": "${MEM0_API_KEY}",
        "MEM0_DEFAULT_USER_ID": "default"
      }
    }
  }
}
```

**Important notes:**
- Any JSON syntax error silently disables ALL servers
- Restart Claude Desktop/Code completely after config changes
- MCP tools are deferred by default (Claude discovers them when needed)
- Tool search is enabled by default to manage token overhead

---

## 5. Workflow Recipes

### Recipe 1: Start Session -> Load Context -> Code -> Save Learnings -> End

**Implementation using hooks:**

1. **SessionStart hook** loads project memory, recent errors, and decisions from Obsidian
2. Developer works normally with Claude Code
3. **Stop hook** fires when Claude finishes, extracting patterns/mistakes/decisions
4. **SessionEnd hook** archives session log and cleans temp files

**Key files:**
```
~/.claude/settings.json          # Hook configuration
~/vault/projects/{name}/         # Project-specific memory
~/vault/projects/{name}/sessions/ # Session logs
```

### Recipe 2: Research -> Save Findings to Obsidian -> Reference in Next Session

1. Use Claude Code with web search for research
2. At end of research, tell Claude: "Save these findings to my Obsidian vault"
3. Claude writes findings to `~/vault/references/` or `~/vault/inbox/`
4. Next session, SessionStart hook loads relevant context
5. Use `/resume` to pick up where you left off

**With claude-infinite-context:** Findings auto-save to `projects/{name}/notes/` with YAML frontmatter for searchability.

### Recipe 3: Debug -> Document Solution -> Build Troubleshooting DB

1. Debug with Claude Code
2. Stop hook auto-extracts error patterns and solutions
3. Written to `~/vault/Mistakes/` or `~/vault/projects/{name}/_ERRORS.md`
4. Over time, builds searchable troubleshooting database
5. SessionStart hook surfaces relevant past errors for current context
6. Semantic search (via smart-connections-mcp or QMD) finds related issues

### Recipe 4: Code Review -> Save Feedback Patterns -> Improve Over Time

1. Claude Code reviews code (PR review workflow)
2. Common feedback patterns saved to `~/vault/Patterns/`
3. PreToolUse hook on Write|Edit injects relevant patterns before Claude writes code
4. Quality improves as pattern library grows
5. Weekly pruning removes stale or duplicate entries

**From MindStudio self-evolving memory guide:**
```
~/claude-memory/
  Patterns/        # Reusable code approaches that worked
  Mistakes/        # Errors and corrections
  Decisions/       # Architectural choices with reasoning
  Context/         # Project terminology, constraints, quirks
  Sessions/        # Full session logs
  Index.md         # Auto-generated index
```

### Recipe 5: Architecture Planning -> Save Decisions -> Reference in Implementation

1. Plan architecture with Claude Code in plan mode
2. Decisions documented as ADRs in `~/vault/decisions/`
3. Each ADR includes: Context, Decision, Consequences, Alternatives
4. Implementation sessions load relevant ADRs via SessionStart hook
5. Graph view in Obsidian visualizes decision relationships
6. Dataview queries show active vs. superseded decisions

**Dataview query for active decisions:**
```dataview
TABLE status, owner, date
FROM "decisions"
WHERE status = "accepted"
SORT date DESC
```

### Recipe 6: Multi-Project Context Switching with Obsidian

**Approach 1: Single Vault with Per-Project Directories**
```
~/vault/
  _GLOBAL.md                   # Cross-project preferences
  projects/
    project-a/_PROJECT.md      # Project A context
    project-b/_PROJECT.md      # Project B context
```
SessionStart hook reads project-specific memory based on `$CLAUDE_PROJECT_DIR`.

**Approach 2: Symlinked Vault**
```bash
mkdir ~/Developer-Vault
ln -s ~/.claude claude-global
ln -s ~/projects/project-a project-a
ln -s ~/projects/project-b project-b
```
Obsidian provides cross-project search; each project has its own CLAUDE.md.

**Approach 3: MCP Bridge**
Run Claude Code in repo; MCP server in Obsidian exposes vault access.
obsidian-claude-code-mcp auto-discovers vaults via WebSocket.
Multiple vaults supported with unique port configurations.

**Context switching workflow:**
1. `/save` in current project session
2. Switch to new project directory
3. SessionStart hook automatically loads correct project memory
4. `/resume` if continuing previous work in that project

### Product Manager Workflow (from Medium)

Four workflows that changed daily work:
1. **Meeting notes -> Action items**: Claude reads vault notes, extracts actions
2. **Research synthesis**: Gather notes across topics, Claude synthesizes
3. **Status updates**: Claude reads project notes, generates updates
4. **Decision documentation**: Capture decisions during meetings, auto-file as ADRs

### Custom Slash Commands for Workflows

```
/my-world    - Load full vault context
/today       - Morning planning from daily notes
/close       - Evening reflection and wrap-up
/trace       - Track idea evolution across months
/ghost       - Answer using vault voice/patterns
```

---

## 6. Comparison of Memory Approaches

### Six Levels of Memory (MindStudio Framework)

| Level | Approach | Setup Time | Token Efficiency | Retrieval Accuracy | Best For |
|-------|----------|-----------|-----------------|-------------------|----------|
| 1 | In-context (default) | None | Low (everything in window) | Perfect within session | Short, contained tasks |
| 2 | CLAUDE.md file | Minutes | Medium (loads all) | Good for small files | Solo devs, small teams - START HERE |
| 3 | Markdown knowledge base | Hours | Medium-High (selective) | Good with organization | Established projects |
| 4 | Auto-updating hooks | Hours | High (automatic) | Variable quality | Long-running projects |
| 5 | Semantic vector search (RAG) | Days | Very high (precise chunks) | High with embeddings | Large-scale (50+ docs) |
| 6 | Cross-tool databases | Days-weeks | Highest | Highest (queryable) | Multi-agent teams, production |

### Detailed Comparison: Obsidian vs Mem0 vs Basic Memory

#### Obsidian Vault (File-Based)

**Architecture:** Plain markdown files with wikilinks, stored locally, browsable in Obsidian graph view.

**Setup complexity:** Medium (hours). Clone a vault template, configure hooks, optional MCP server.

**Token efficiency:**
- With Graphify: 71.5x reduction (AST-based code graphs)
- With QMD semantic search: 60%+ reduction vs grep/glob
- Tiered loading: ~2K tokens base, on-demand expansion

**Retrieval accuracy:**
- Keyword search: Good
- With smart-connections-mcp: High (384-dim vector embeddings)
- With QMD: High (semantic recall)

**Pros:**
- Everything is human-readable markdown
- Version controlled with Git
- Browsable in Obsidian with graph view
- No vendor lock-in
- Works offline
- Notes editable by human and AI
- Cross-project knowledge via single vault

**Cons:**
- Requires manual organization (unless using obsidian-mind hooks)
- Can drift out of sync
- No built-in semantic search (need plugin)
- Obsidian must be running for some MCP servers

**Best for:** Power users, long-running projects, teams wanting transparent/auditable memory

#### Mem0 (API-Based)

**Architecture:** Structured database with semantic vector storage. Memory stored in cloud or self-hosted DB.

**Setup complexity:** Low (5 minutes). `pip install mem0ai`, get API key, add MCP config.

**Token efficiency:**
- 90% lower token usage vs full-context
- 91% faster responses
- Automatic deduplication

**Retrieval accuracy:**
- High - semantic vector search built in
- Graph memory available (Pro plan) for relationship tracking

**Pros:**
- Fastest setup (5 minutes)
- Semantic search out of the box
- Shareable across tools and agents
- Automatic memory management
- 10,000 memories/month on free tier

**Cons:**
- Memory is opaque (can't easily browse/edit)
- Requires API key and internet (unless self-hosted)
- Vendor dependency
- Can't open and read what AI knows about you
- Pro features (graph memory) require paid plan

**Best for:** Teams with multiple agents, production systems, quick setup needs

#### Basic Memory (Graph-Based)

**Architecture:** Knowledge base with semantic connections, observations, and relations. Notes stored as markdown but enriched with graph relationships.

**Setup complexity:** Low-medium. `claude mcp add basic-memory`, OAuth flow.

**Token efficiency:** High - 17 specialized tools for targeted retrieval

**Retrieval accuracy:** High - semantic search built in, no exact keyword match needed

**Pros:**
- Notes visible in Obsidian (markdown-based)
- 17 MCP tools for granular access
- Cross-project knowledge spanning tools
- Semantic connections between notes
- Cloud and local options

**Cons:**
- Requires MCP infrastructure
- More complex than simple file-based approach
- Additional service to maintain

**Best for:** Users wanting graph-based relationships with markdown portability

### Can They Be Combined?

**Yes.** Recommended combinations:

1. **Obsidian + Mem0:** Use Obsidian for human-readable documentation and architecture decisions; use Mem0 for automatic preference/pattern capture across sessions.

2. **Obsidian + Basic Memory:** Use Obsidian vault as the storage layer; Basic Memory adds semantic search and graph relationships on top.

3. **Obsidian + Graphify + QMD:** Obsidian for notes, Graphify for code structure graphs, QMD for semantic search. The lucasrosati/claude-code-memory-setup implements this combo.

4. **All Three:** Obsidian as the canonical knowledge store, Mem0 for cross-agent memory sharing, Basic Memory for semantic enrichment. Configure via multiple MCP servers in `.mcp.json`.

### Decision Framework

```
Start with CLAUDE.md (Level 2)
  |
  v
Growing beyond 500 lines? -> Structured markdown vault (Level 3)
  |
  v
Tired of manual updates? -> Add hooks for auto-capture (Level 4)
  |
  v
50+ documents or need precision? -> Add semantic search (Level 5)
  |
  v
Multi-agent or production? -> Add database layer (Level 6)
```

### Token Usage Comparison (Real Benchmarks)

| Approach | Tokens per Session Start | Notes |
|---|---|---|
| No memory (re-read 40 files) | ~20,000 | Baseline waste |
| CLAUDE.md only | ~500-2,000 | Depends on file size |
| obsidian-mind (tiered) | ~2,000 + on-demand | Efficient tiered loading |
| Graphify + Obsidian | ~280 (71.5x reduction) | AST-based, zero LLM cost |
| Mem0 | ~500 (90% reduction) | Automatic dedup |
| claude-infinite-context | Variable | Skills-based loading |

---

## Key Reference Links

### Official Documentation
- Claude Code Hooks Reference: https://code.claude.com/docs/en/hooks
- Claude Code Hooks Guide: https://code.claude.com/docs/en/hooks-guide
- Claude Code Memory: https://code.claude.com/docs/en/memory
- Claude Code MCP: https://code.claude.com/docs/en/mcp
- Claude Code Common Workflows: https://code.claude.com/docs/en/common-workflows
- Claude Blog - How to Configure Hooks: https://claude.com/blog/how-to-configure-hooks
- Claude Blog - Using CLAUDE.md Files: https://claude.com/blog/using-claude-md-files

### Vault Templates
- obsidian-mind: https://github.com/breferrari/obsidian-mind
- claude-infinite-context: https://github.com/backyarddd/claude-infinite-context
- claude-code-memory-setup: https://github.com/lucasrosati/claude-code-memory-setup
- second-brain-gtd: https://github.com/sean-esk/second-brain-gtd
- obsidian-second-brain: https://github.com/eugeniughelbur/obsidian-second-brain
- minimal-second-brain: https://github.com/gokhanarkan/minimal-second-brain

### CLAUDE.md Templates
- claude-md-templates: https://github.com/abhishekray07/claude-md-templates
- awesome-claude-md: https://github.com/josix/awesome-claude-md
- claude-code-best-practice: https://github.com/shanraisshan/claude-code-best-practice
- ruflo Wiki Templates: https://github.com/ruvnet/ruflo/wiki/CLAUDE-MD-Templates
- claude-code-showcase: https://github.com/ChrisWiles/claude-code-showcase

### MCP Servers
- MCPVault: https://mcpvault.org/install/
- mcp-obsidian: https://github.com/MarkusPfundstein/mcp-obsidian
- smart-connections-mcp: https://github.com/dan6684/smart-connections-mcp
- obsidian-claude-code-mcp: https://github.com/iansinnott/obsidian-claude-code-mcp
- obsidian-mcp-tools: https://github.com/jacksteamdev/obsidian-mcp-tools
- Basic Memory: https://docs.basicmemory.com/integrations/claude-code
- Mem0: https://mem0.ai/blog/claude-code-memory
- mcp-local-rag: https://github.com/shinpr/mcp-local-rag
- knowledge-rag: https://github.com/lyonzin/knowledge-rag

### Hook Mastery
- claude-code-hooks-mastery: https://github.com/disler/claude-code-hooks-mastery
- Hooks Complete Guide: https://claudefa.st/blog/tools/hooks/hooks-guide
- Session Lifecycle Hooks: https://claudefa.st/blog/tools/hooks/session-lifecycle-hooks

### Integration Guides
- Obsidian + Claude Code Complete Guide: https://blog.starmorph.com/blog/obsidian-claude-code-integration-guide
- 3 Ways to Use Obsidian with Claude Code: https://awesomeclaude.ai/how-to/use-obsidian-with-claude
- Self-Evolving Memory System: https://www.mindstudio.ai/blog/self-evolving-claude-code-memory-obsidian-hooks
- Memory Systems Compared: https://www.mindstudio.ai/blog/claude-code-memory-systems-compared
- AI Second Brain with Claude Code: https://www.mindstudio.ai/blog/build-ai-second-brain-claude-code-obsidian
- Claude Code Inside Obsidian: https://dev.to/numbpill3d/claude-code-inside-obsidian-the-setup-that-10xd-my-thinking-20e8

### Workflow & Productivity
- PM Workflows with Claude + Obsidian: https://medium.com/all-about-claude/how-i-use-claude-code-obsidian-as-a-product-manager-4-workflows-that-actually-changed-my-work-bc04360b905d
- Developer Second Brain: https://jamesdonnelly.dev/blog/obsidian-claude-code-workflow/
- Claude + Obsidian Knowledge Companion: https://github.com/AgriciDaniel/claude-obsidian
- DataCamp Hooks Tutorial: https://www.datacamp.com/tutorial/claude-code-hooks
