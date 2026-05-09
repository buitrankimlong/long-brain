# Claude Code + Obsidian "Second Brain" -- Comprehensive Research Report

**Date:** May 8, 2026
**Scope:** Deep research on using Claude Code with Obsidian as a persistent memory / second brain system

---

## TABLE OF CONTENTS

1. [Memory Architecture](#1-claude-code--obsidian-memory-architecture)
2. [Key GitHub Repositories](#2-key-github-repositories--tools)
3. [Practical Setup Guides](#3-practical-setup-guides)
4. [Knowledge Persistence Patterns](#4-knowledge-persistence-patterns)
5. [Graphify + Obsidian + Claude Code](#5-graphify--obsidian--claude-code)
6. [Self-Evolving Memory Systems](#6-self-evolving-memory-systems)
7. [Karpathy's LLM Wiki Pattern](#7-karpathys-llm-wiki-pattern)
8. [MCP Servers for Obsidian](#8-mcp-servers-for-obsidian)
9. [Advanced Techniques](#9-advanced-techniques)
10. [Alternative Memory Approaches](#10-alternative-memory-approaches)
11. [Real-World Workflows & Community Experience](#11-real-world-workflows--community-experience)
12. [Pitfalls, Limitations & Criticisms](#12-pitfalls-limitations--criticisms)
13. [Performance Benchmarks](#13-performance-benchmarks)
14. [Complete Source Links](#14-complete-source-links)

---

## 1. CLAUDE CODE + OBSIDIAN MEMORY ARCHITECTURE

### The Core Idea

Obsidian is a local-first, markdown-based note-taking app. Claude Code can natively read and write text files. By pointing Claude Code at an Obsidian vault, the vault becomes persistent external memory that survives across sessions -- Claude reads accumulated knowledge at session start and writes new learnings at session end.

### The Three-Tier Memory Model (Computer Architecture Analogy)

The dominant pattern across all implementations mirrors classical computer memory hierarchy:

**Tier 1 -- Registers (Always Loaded, ~160 tokens/message)**
- `CLAUDE.md` at project or vault root (~50 lines)
- Contains: build commands, critical rules, pointers to deeper docs
- Loaded automatically every session by Claude Code

**Tier 2 -- Cache / Index (Always Loaded, ~110 tokens/message)**
- `MEMORY.md` or equivalent index file (~30 lines)
- Functions as a pointer/index to Obsidian documents
- Lists: current status, blockers, document locations
- Replaces verbose content with references

**Tier 3 -- Hard Drive (On-Demand, Unlimited)**
- The Obsidian vault itself (unlimited storage)
- Contains: Architecture.md, Design System.md, Gotchas.md, Patterns.md, Decisions.md
- Loaded only when Claude needs them (~800-2,500 tokens per document)
- Total overhead: ~270 tokens/message vs 400+ in traditional approaches

### Token Efficiency

An 80-message session benchmark:
- Traditional verbose CLAUDE.md approach: ~32,000 tokens on memory overhead
- Three-tier system: ~12,100 tokens total
- **Savings: ~20,000 tokens per session (62% reduction)**

### How Claude Code Reads/Writes to Obsidian

Claude Code already has file read/write capabilities. It can:
1. Read any `.md` file in the vault via its standard file tools
2. Write/edit markdown files to save learnings
3. Navigate the vault using an index file (MEMORY.md or index.md)
4. Follow wikilinks between notes to explore related topics

The key insight: **MEMORY.md is an index, not storage**. Claude reads pointers, then fetches only the specific Obsidian docs it needs for the current task.

### Vault Folder Structure (Canonical Pattern)

```
vault/
  CLAUDE.md              # Tier 1 - always loaded
  MEMORY.md              # Tier 2 - index/pointers
  permanent/             # Consolidated knowledge
  inbox/                 # Unsorted new notes
  fleeting/              # Temporary scratch notes
  logs/                  # Session logs
  projects/
    project-a/
      architecture.md
      decisions.md
      patterns.md
      gotchas.md
      logs/
  chats/                 # Imported chat transcripts
    code/
    web/
  graphify/              # Knowledge graph output
  templates/             # Note templates
```

---

## 2. KEY GITHUB REPOSITORIES & TOOLS

### Vault Templates & Memory Systems

| Repository | Stars | Description |
|---|---|---|
| [chennurivarun/infinite-context](https://github.com/chennurivarun/infinite-context) | -- | 3-tier memory (registers/cache/hard-drive). Parallel agent orchestration. Tested: 13 agents, 64 bug fixes, 66 min, 0 conflicts. |
| [breferrari/obsidian-mind](https://github.com/breferrari/obsidian-mind) | -- | Full vault template with 18 slash commands, 9 subagents, 5 lifecycle hooks. Supports Claude Code, Codex CLI, Gemini CLI. |
| [eugeniughelbur/obsidian-second-brain](https://github.com/eugeniughelbur/obsidian-second-brain) | 950+ | 31 commands across 4 layers. Self-rewriting vault. Scheduled agents (morning/nightly/weekly/health). Research toolkit with X/Perplexity/YouTube. |
| [lucasrosati/claude-code-memory-setup](https://github.com/lucasrosati/claude-code-memory-setup) | -- | Obsidian + Graphify + chat import pipeline. Claims 71.5x token reduction. PT-BR included. |
| [backyarddd/claude-infinite-context](https://github.com/backyarddd/claude-infinite-context) | -- | Persistent searchable long-term memory. Saves before compaction, recalls on new sessions, logs errors to prevent repetition. |
| [AgriciDaniel/claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian) | -- | Karpathy LLM Wiki pattern implementation. /wiki /save /autoresearch commands. |
| [robabby/claude-skills](https://github.com/robabby/claude-skills) | -- | 8 custom skills for cross-session memory built on Obsidian. |
| [georgeantonopoulos/obsidian-cli-memory-bank-skill](https://github.com/georgeantonopoulos/obsidian-cli-memory-bank-skill) | -- | Portable skill for persistent structured memory. Works across Claude Code, Codex, Cursor, Antigravity. |
| [ballred/obsidian-claude-pkm](https://github.com/ballred/obsidian-claude-pkm) | -- | Complete starter kit for Obsidian + Claude Code personal knowledge management. |
| [ashish141199/obsidian-claude-code](https://github.com/ashish141199/obsidian-claude-code) | -- | Workflow template with slash commands and structure for knowledge management. |

### Self-Evolving / Memory Compiler Systems

| Repository | Description |
|---|---|
| [coleam00/claude-memory-compiler](https://github.com/coleam00/claude-memory-compiler) | Karpathy-inspired. Hooks capture sessions, Agent SDK extracts insights, LLM compiler creates cross-referenced knowledge articles. No vector DB. |
| [jack60810/claude-evolve](https://github.com/jack60810/claude-evolve) | Darwinian fitness scoring for rules. Auto-promotes patterns to skills. Monitors full session timelines for anti-patterns. |
| [Shmayro/singularity-claude](https://github.com/Shmayro/singularity-claude) | Self-evolving skill engine. Skills create, score, repair, and harden themselves through recursive improvement loops. |
| [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | Auto-captures everything Claude does, compresses with AI, injects relevant context back into future sessions. |

### Knowledge Graph Tools

| Repository | Description |
|---|---|
| [safishamsi/graphify](https://github.com/safishamsi/graphify) | Turn any folder into a queryable knowledge graph. 28 languages. AST-based (no LLM cost). Obsidian output. |
| [tirth8205/code-review-graph](https://github.com/tirth8205/code-review-graph) | Local knowledge graph for Claude Code. 6.8x fewer tokens on reviews, up to 49x on daily tasks. |
| [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph) | Pre-indexed code knowledge graph. Fewer tokens, fewer tool calls, 100% local. |

### Memory Layer / RAG Systems

| Repository | Description |
|---|---|
| [zilliztech/memsearch](https://github.com/zilliztech/memsearch) | Milvus-backed. Markdown as source of truth. Cross-agent memory (Claude Code, OpenClaw, OpenCode, Codex CLI). |
| [basicmachines-co/basic-memory](https://github.com/basicmachines-co/basic-memory) | Markdown semantic graph. MCP server. Obsidian-compatible. Vector + full-text hybrid search. |
| [yoloshii/ClawMem](https://github.com/yoloshii/ClawMem) | On-device memory for Claude Code, Hermes, OpenClaw. Hybrid RAG. Contradiction detection. |
| [MemPalace/mempalace](https://github.com/mempalace/mempalace) | ChromaDB-based. Multi-signal hybrid retrieval. "170 tokens to recall everything." |

### Obsidian Plugins & MCP Servers

| Repository | Description |
|---|---|
| [YishenTu/claudian](https://github.com/YishenTu/claudian) | Obsidian plugin embedding Claude Code as sidebar chat. Full agentic power within vault. |
| [Roasbeef/obsidian-claude-code](https://github.com/Roasbeef/obsidian-claude-code) | Native Obsidian plugin embedding Claude as AI assistant. |
| [MarkusPfundstein/mcp-obsidian](https://github.com/MarkusPfundstein/mcp-obsidian) | MCP server via Obsidian REST API. Tools: list, get, search, patch, append, delete. |
| [bitbonsai/mcpvault](https://github.com/bitbonsai/mcpvault) | Lightweight MCP server for safe vault access. Path traversal protection, extension whitelists. |
| [iansinnott/obsidian-claude-code-mcp](https://github.com/iansinnock/obsidian-claude-code-mcp) | WebSocket + HTTP/SSE MCP. Auto-discovers vaults. |
| [dan6684/smart-connections-mcp](https://github.com/dan6684/smart-connections-mcp) | Exposes Smart Connections vector DB to Claude Code via MCP semantic search. |
| [brianpetro/obsidian-smart-connections](https://github.com/brianpetro/obsidian-smart-connections) | Chat with notes + see related content via AI embeddings. Local models or 100+ APIs. |

### Karpathy LLM Wiki Implementations

| Repository | Description |
|---|---|
| [karpathy/llm-wiki (gist)](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | Original gist from April 3, 2026. The foundational pattern. |
| [kfchou/wiki-skills](https://github.com/kfchou/wiki-skills) | LLM-maintained personal wiki skills for Claude Code. |
| [lucasastorian/llmwiki](https://github.com/lucasastorian/llmwiki) | Open source implementation. Upload docs, connect Claude via MCP, auto-write wiki. |
| [MehmetGoekce/llm-wiki](https://github.com/MehmetGoekce/llm-wiki) | L1/L2 cache architecture. Logseq + Obsidian support. |
| [Pratiyush/llm-wiki](https://github.com/Pratiyush/llm-wiki) | Multi-agent sessions (Claude, Codex, Copilot, Cursor, Gemini). |

---

## 3. PRACTICAL SETUP GUIDES

### Method 1: Direct File Access (Simplest)

Claude Code can read/write files natively. No MCP server needed.

1. Create an Obsidian vault (or use existing one)
2. Add `CLAUDE.md` at vault root with instructions for Claude
3. Add `MEMORY.md` as an index pointing to key documents
4. In your project's `CLAUDE.md`, add a pointer: `Read ~/vault/MEMORY.md for persistent context`
5. Claude reads the index, fetches relevant docs on demand

### Method 2: MCP Server Bridge

For richer vault interaction (search, metadata, structured queries):

**Using MCPVault:**
```json
// ~/.claude/settings.json or claude_desktop_config.json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["@bitbonsai/mcpvault@latest", "/path/to/your/vault"]
    }
  }
}
```

**Using mcp-obsidian (REST API):**
Requires Obsidian Local REST API community plugin installed and running.
```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "mcp-obsidian"],
      "env": {
        "OBSIDIAN_API_KEY": "your-api-key",
        "OBSIDIAN_HOST": "localhost",
        "OBSIDIAN_PORT": "27123"
      }
    }
  }
}
```

### Method 3: Claudian Plugin (Inside Obsidian)

Install the Claudian Obsidian plugin to embed Claude Code directly in Obsidian's sidebar:
1. Install BRAT plugin from Obsidian Community Plugins
2. Add Claudian repo via BRAT: `YishenTu/claudian`
3. Claude Code runs inside Obsidian with full vault context awareness
4. Supports @mentions of files, drag-drop images, slash commands

### Configuring Hooks for Auto-Memory

Claude Code hooks fire at specific lifecycle events. Key hooks for memory:

```json
// ~/.claude/settings.json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "python3 ~/.claude/hooks/load_context.py"
      }]
    }],
    "PreCompact": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "python3 ~/.claude/hooks/save_before_compact.py"
      }]
    }],
    "Stop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "python3 ~/.claude/hooks/memory_extractor.py"
      }]
    }]
  }
}
```

**What each hook does:**
| Hook | When It Fires | Memory Action |
|---|---|---|
| SessionStart | Session begins or resumes | Load vault context: North Star, active work, git changes, tasks |
| UserPromptSubmit | Every user message | Classify content (decision/incident/win/architecture) and route |
| PostToolUse | After .md file writes | Validate frontmatter, check wikilinks |
| PreCompact | Before context compression | Emergency snapshot of full working state to vault |
| Stop | Session ends | Extract patterns, mistakes, decisions; write to vault; update index |

### Method 4: Full Template Install

**obsidian-mind (via ShardMind):**
```bash
npm install -g shardmind
mkdir my-vault && cd my-vault
shardmind install github:breferrari/obsidian-mind
```

**obsidian-second-brain:**
```bash
curl -fsSL https://raw.githubusercontent.com/eugeniughelbur/obsidian-second-brain/main/scripts/quick-install.sh | bash
```

**infinite-context:**
1. Copy vault-template from the repo
2. Fill in project docs (Overview, Architecture, Design System)
3. Add Obsidian pointers to your project's CLAUDE.md
4. Configure MEMORY.md with index entries (not content)

---

## 4. KNOWLEDGE PERSISTENCE PATTERNS

### Saving Architectural Decisions

Use a Decision Record template with YAML frontmatter:
```yaml
---
title: Use Supabase for Auth
date: 2026-05-08
status: accepted  # proposed | accepted | deprecated
owner: developer-name
tags: [auth, infrastructure]
---
```
Decision records include: Context, Options Considered, Decision, Consequences, and Related Decisions (wikilinks).

The obsidian-mind template provides `/om-decide` and the obsidian-second-brain provides `/obsidian-decide` commands for this.

### Saving Code Patterns & Snippets

Store in `Patterns/` folder with frontmatter tags. Include: when to use, example code, anti-patterns to avoid. Link related patterns with wikilinks.

### Saving Debugging Solutions

Store in `Gotchas/` or `Mistakes/` folder. Include: error message, root cause, solution, prevention strategy. The self-evolving memory system (MindStudio guide) auto-extracts these from session transcripts.

### Session Continuity

Two commands maintain continuity:
- `/resume` or `/save` at session boundaries
- Session logs are timestamped and stored in `logs/` or `sessions/`
- Next session reads recent logs before doing anything else

### Context Compression Without Losing Info

**PreCompact Hook Strategy:**
The PreCompact hook fires right before Claude Code compresses context. At that moment:
1. A script reads the current session transcript
2. Writes a summary to the Obsidian vault (or SQLite)
3. Captures: decision reasoning (not just outcomes), architectural choices, error patterns
4. The compact prompt can be customized to tell the summarizer to look for previous compaction summaries and preserve them cumulatively

**Production-tested rules for compaction instructions:**
- Always preserve previous compaction summaries cumulatively
- Capture decision reasoning, not just outcomes
- Cover: architectural decisions, error patterns, user preferences, current task state

### Building Knowledge Over Time

The "two-output rule" from obsidian-second-brain: every answer also updates vault pages. No conversation disappears. Over time:
- Patterns emerge from session logs
- Contradictions get flagged and resolved
- Knowledge consolidates from fleeting notes to permanent notes (Zettelkasten flow)

---

## 5. GRAPHIFY + OBSIDIAN + CLAUDE CODE

### What Graphify Does

[Graphify](https://github.com/safishamsi/graphify) transforms any folder of code, docs, PDFs, images, or videos into a queryable knowledge graph using tree-sitter AST parsing (28 languages) and optional LLM extraction for semantic content.

### How It Works

1. Code files are parsed locally via tree-sitter -- **no LLM cost, no API calls**
2. Produces: `graph.json` (persistent queryable artifact), `graph.html` (interactive visualization), `GRAPH_REPORT.md` (metrics + god nodes), Obsidian-compatible markdown notes per code node
3. Identifies: god nodes (most-connected concepts), surprising connections, confidence-tagged relationships

### Installation & Usage

```bash
pip install graphifyy
graphify install           # Register with Claude Code
graphify .                 # Generate graph from current directory
graphify . --obsidian --obsidian-dir ~/vault/graphify/project-name  # Output to Obsidian
graphify . --watch         # Auto-rebuild on file save
graphify hook install      # Auto-rebuild on git commit (AST-only, no API cost)
```

### Token Savings Claims vs Reality

**Claimed:** 71.5x fewer tokens per query (from a 52-file test corpus of Karpathy's repos + papers + images).

**Real-world independent test:** On a browser-use project with a 10-question session, results showed roughly 7-8% savings, not 71x.

**The threshold:** Below ~500 files, graph construction overhead is not worth it. Above 500 files, savings increase substantially.

**Benchmark on React + Supabase project (126 TypeScript files):**
- Graph nodes generated: 332
- Traditional re-read cost: ~20,000 tokens/session
- Graph query cost: ~280 tokens (one-time per session)
- Daily savings (10 sessions): ~197,200 tokens

### Integration Workflow

```
graphify . --obsidian     --> Generates graph + Obsidian notes
                          --> Notes appear in vault's graphify/ folder
                          --> Graph view shows code relationships alongside vault notes

Claude Code session:
  1. Query graph.json for structure (280 tokens)
  2. Query vault for decisions and progress
  3. Read raw code ONLY when graph doesn't have the answer
```

### Multi-Project Setup

Single vault serves all projects:
```bash
graphify ~/project-a --obsidian --obsidian-dir ~/vault/graphify/project-a
graphify ~/project-b --obsidian --obsidian-dir ~/vault/graphify/project-b
```

Notes appear in Obsidian's graph alongside existing vault content with cross-project connections visible.

---

## 6. SELF-EVOLVING MEMORY SYSTEMS

### claude-memory-compiler (coleam00)

**Architecture:** Session transcripts --> daily logs --> compiled knowledge articles

**How it works:**
1. Hooks capture conversation transcripts at session end + pre-compaction
2. `flush.py` invokes Claude Agent SDK to extract "what's worth saving"
3. `compile.py` transforms daily logs into structured, cross-referenced knowledge articles
4. `query.py` answers questions using index-guided retrieval (no RAG)
5. `lint.py` performs 7 health checks: broken links, orphans, contradictions, staleness

**Why no RAG?** At personal scale (50-500 articles), "the LLM reading a structured index.md outperforms vector similarity." RAG becomes necessary around 2,000+ articles.

**Cost:** Covered under existing Claude subscriptions (Max, Team, Enterprise). No separate API credits.

GitHub: https://github.com/coleam00/claude-memory-compiler

### claude-evolve (jack60810)

**Darwinian Fitness Scoring:**
- Rules receive 0-10 scores per session (LLM-judged)
- Exponential moving average: 30% new, 70% historical
- New rules start at 5 (neutral)
- Score < 3 after 3+ evaluations --> dormant
- Dormant > 15 sessions --> permanently deleted
- 3+ related high-scoring rules --> promoted to skills

**Anti-Pattern Detection:** Monitors full session timelines and auto-detects:
- Editing without reading first
- Querying without dry-runs
- Repetitive file opens instead of grep usage

**Timeline:** ~5 sessions before useful rules emerge; ~10 sessions before skills appear.

GitHub: https://github.com/jack60810/claude-evolve

### singularity-claude (Shmayro)

Skills that create, score, repair, and harden themselves through recursive improvement loops. When a skill's average drops below 50, `/singularity-repair` kicks in: reads score history + telemetry, identifies weakest dimensions, rewrites the skill, bumps version, re-tests.

GitHub: https://github.com/Shmayro/singularity-claude

### Claude Code's Built-in Auto-Memory

Claude Code now has automatic memory where it identifies useful things learned during a session and writes them back to CLAUDE.md autonomously. Targets durable, non-obvious knowledge that would waste time to rediscover. Auto Memory notes are stored in `~/.claude/projects/<project>/memory/`.

### obsidian-second-brain Scheduled Agents

Four automated agents run without manual intervention:
| Agent | When | What |
|---|---|---|
| morning | 8 AM | Daily note + overdue tasks |
| nightly | 10 PM | Close day + reconcile contradictions + synthesize patterns + heal orphans |
| weekly | Fridays 6 PM | Weekly review |
| health | Sundays 9 PM | Vault health audit |

Plus a background agent that fires after every context compaction to auto-update the vault.

### Hermes Agent Self-Improvement Pattern

Hermes Agent (by Nous Research) features:
- Agent-curated memory with periodic nudges
- Autonomous skill creation after complex tasks
- Skills that self-improve during use
- FTS5 session search with LLM summarization
- Cross-session recall

ClawMem adds contradiction detection: detects contradictions between new and prior decisions, auto-decaying superseded ones with a merge-time contradiction gate.

GitHub: https://github.com/NousResearch/hermes-agent

---

## 7. KARPATHY'S LLM WIKI PATTERN

### Origin

On April 3, 2026, Andrej Karpathy posted a tweet titled "LLM Knowledge Bases" describing how he now uses LLMs to build personal knowledge wikis instead of just generating code. He published a gist codifying the pattern.

Gist: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

### Three-Layer Architecture

1. **Raw Sources** -- immutable documents (PDFs, transcripts, bookmarks, notes)
2. **The Wiki** -- LLM-generated markdown (summaries, entity pages, cross-references, contradiction flags)
3. **The Schema** -- A CLAUDE.md file telling the LLM how to maintain the wiki

### Core Operations

- **Ingest**: Process new sources, extract key info, update existing wiki pages, maintain cross-references
- **Query**: Search relevant pages, synthesize answers, optionally file results back
- **Lint**: Health-check for contradictions, stale claims, orphaned pages, missing connections

### Key Insight

"The wiki is the artifact, not the chat. Chats are ephemeral. The wiki persists and grows. Compile once, query forever."

### Components

- `index.md` -- content catalog with categories and summaries
- `log.md` -- append-only chronological record
- Optional CLI tools -- local search, linting, export

### Impact

The gist inspired 15+ implementations exploring variations on wiki generation, multi-agent collaboration, and enterprise knowledge management. Key implementations listed in Section 2 above.

---

## 8. MCP SERVERS FOR OBSIDIAN

### Option 1: MCPVault (Recommended for simplicity)

- **Repo:** https://github.com/bitbonsai/mcpvault
- **How:** `npx @bitbonsai/mcpvault@latest /path/to/vault`
- **Security:** Path traversal protection, symlink safety, auto-excludes .obsidian/.git/node_modules, extension whitelist (.md/.markdown/.txt/.canvas)
- **Works with:** Claude Desktop, Claude Code, ChatGPT Desktop (Enterprise+), Gemini CLI

### Option 2: mcp-obsidian (REST API-based)

- **Repo:** https://github.com/MarkusPfundstein/mcp-obsidian
- **Requires:** Obsidian REST API community plugin running
- **Tools:** list_files_in_vault, list_files_in_dir, get_file_contents, search, patch_content, append_content, delete_file

### Option 3: obsidian-claude-code-mcp (WebSocket + SSE)

- **Repo:** https://github.com/iansinnott/obsidian-claude-code-mcp
- **Features:** WebSocket for Claude Code, HTTP/SSE for Claude Desktop, auto-discovers vaults, file read/write/search
- **Note:** Each vault needs a unique port if running multiple

### Option 4: Smart Connections MCP

- **Repo:** https://github.com/dan6684/smart-connections-mcp
- **What:** Exposes Obsidian Smart Connections vector database to Claude Code
- **Enables:** Semantic search across vault (find notes by meaning, not keywords)
- **Uses:** Local embeddings (TaylorAI/bge-micro-v2, 384 dimensions)

### Option 5: Building a Custom MCP Server

A Medium tutorial by Gagandeep Bhatia walks through building a custom Node.js MCP server:
- 16 tools: read, write, search, manage notes
- Works directly with markdown files on disk
- Obsidian does not need to be running
- Reference: https://medium.com/@gagandeep023/build-an-mcp-server-that-connects-claude-directly-to-your-obsidian-vault-d3ced0f67e98

---

## 9. ADVANCED TECHNIQUES

### Dataview Plugin Integration

If you add frontmatter to your CLAUDE.md files, Dataview becomes powerful for structured queries. Alternative: vault-search skill provides semantic search via sqlite-vec embeddings and SQL queries over note frontmatter.

### Smart Connections for Semantic Search

Smart Connections generates local embeddings for all notes using a bundled model. When combined with the smart-connections-mcp server, Claude Code can:
- Find semantically related notes (not just keyword matches)
- Extract the most relevant text blocks for RAG
- Navigate the knowledge graph by meaning

### Multi-Project Memory (One Vault, Multiple Projects)

**Architecture:** Single centralized vault with per-project folders. Benefits:
- Notes like "Supabase Auth" link to multiple projects
- Graph view reveals cross-project connections
- Shared patterns and learnings compound across projects

**Graphify multi-project:**
```bash
graphify ~/project-a --obsidian --obsidian-dir ~/vault/graphify/project-a
graphify ~/project-b --obsidian --obsidian-dir ~/vault/graphify/project-b
```

### Team Knowledge Sharing

- Shared Obsidian vault (via Git or Obsidian Sync) lets multiple team members contribute
- memsearch enables cross-agent memory: memories written from any agent are searchable from every other agent
- MindStudio allows building shareable no-code AI workflows that don't require everyone to run Claude Code

### Parallel Agent Orchestration (infinite-context)

Multiple Claude Code agents coordinate through Obsidian rather than shared context:
- Each agent gets its own 200K token context window
- Agents own user flows, not individual files (prevents conflicts)
- Non-overlapping file ownership
- Write results back to Obsidian for orchestrator review
- Real-world test: 13 agents, 64 issues fixed in ~66 minutes, 0 file conflicts

### QMD Semantic Search (obsidian-mind)

```bash
npm install -g @tobilu/qmd
node --experimental-strip-types scripts/qmd-bootstrap.ts
```
Enables semantic recall ("what did we decide about caching") with reranking. First embed downloads ~328MB; query with reranking adds ~1.28GB.

---

## 10. ALTERNATIVE MEMORY APPROACHES

### Basic Memory (Markdown Semantic Graph)

- **Repo:** https://github.com/basicmachines-co/basic-memory
- **What:** MCP server that builds a persistent semantic graph from AI conversations, stored in standard Markdown files
- **Architecture:** Markdown files --> SQLite index --> Knowledge graph (entities + observations + relations)
- **Syntax:** `[category] content #tag` for observations, `[[Related Topic]]` for relations
- **Features:** Hybrid search (full-text + vector similarity via FastEmbed), schema inference, canvas visualization
- **Obsidian integration:** Notes appear as standard markdown, fully compatible
- **Install:** `uv tool install basic-memory`

### memsearch (Milvus-Backed)

- **Repo:** https://github.com/zilliztech/memsearch
- **What:** Persistent unified memory layer backed by Markdown + Milvus vector DB
- **Key advantage:** Cross-agent support -- Claude Code, OpenClaw, OpenCode, Codex CLI all share the same memory
- **Architecture:** Markdown files as source of truth, Milvus as rebuildable shadow index
- **Retrieval:** L1 search (ranked chunks) --> L2 expand (full section) --> L3 parse-transcript (raw dialogue)
- **Hybrid search:** Dense vector + BM25 sparse + RRF reranking
- **Smart dedup:** SHA-256 content hashing -- unchanged content never re-embedded
- **Key difference from Mem0/Zep:** Memory is human-readable markdown files, not opaque vector DB. Edit with any text editor, manage with Git.

### MemPalace

- **Repo:** https://github.com/mempalace/mempalace
- **What:** ChromaDB-based memory with multi-signal hybrid retrieval
- **Claims:** "170 tokens to recall everything"
- **Architecture:** Wings, rooms, halls as organizational metadata
- **Ranking:** ChromaDB vector query + closet boost + drawer-grep chunk refinement + BM25 re-rank
- **Limitation:** Entirely reactive (no proactive injection)

### claude-mem

- **Repo:** https://github.com/thedotmack/claude-mem
- **What:** Auto-captures everything Claude does, compresses with Agent SDK, injects back
- **Architecture:** SQLite + ChromaDB dual store
- **Trade-off:** Most expensive but highest quality extraction

### ClawMem (Hybrid Multi-Agent)

- **Repo:** https://github.com/yoloshii/ClawMem
- **What:** On-device memory layer for Claude Code, Hermes, and OpenClaw
- **Architecture:** Hybrid RAG with BM25 + vector search + reciprocal rank fusion + cross-encoder reranking
- **Unique features:** MAGMA-style intent classification, A-MEM self-evolving memory notes, contradiction detection, causal link tracking
- **All paths write to same local SQLite vault** -- cross-agent memory sharing

### Google's Memory Agent Pattern (No Vector DB)

- **Source:** Towards Data Science article (April 2026)
- **Core idea:** With 200K+ context windows, you might not need vector databases
- **How it works:** SQLite + direct LLM reasoning. Quick scan every 60 seconds for new files, full scan every 30 minutes with SHA256 hash comparison
- **When files change:** Delete old memories, clean up consolidations, re-ingest, update tracking
- **Key research:** Google DeepMind formally proved embedding-based retrieval has fundamental theoretical limits. A long-context reranker solved 100% of queries that best embedding models solved at <60% recall

### Comparison Matrix

| System | Storage | Vector DB? | Cost | Best For |
|---|---|---|---|---|
| CLAUDE.md (default) | Single file | No | Free | Most solo projects |
| Obsidian vault (3-tier) | Markdown files | No | Free | Structured persistent memory |
| Basic Memory | Markdown + SQLite | Optional (FastEmbed) | Free | Semantic graph from conversations |
| memsearch | Markdown + Milvus | Yes | Free (self-hosted) | Cross-agent, large-scale |
| MemPalace | ChromaDB | Yes | Free | Fast retrieval, structured recall |
| claude-mem | SQLite + ChromaDB | Yes | API costs | Highest quality extraction |
| ClawMem | SQLite | Yes (hybrid RAG) | Free | Multi-agent + contradiction detection |
| Google Memory Agent | SQLite | No | Free | Large context window models |
| Graphify | JSON graph | No | Free (AST-based) | Large codebases (500+ files) |
| claude-memory-compiler | Markdown articles | No | Subscription | Karpathy wiki pattern |

### When to Use What (Decision Framework)

**Start with `CLAUDE.md`** -- handles 80% of typical needs.

**Add Obsidian vault** when CLAUDE.md exceeds ~500 lines or you need cross-session persistence.

**Add auto-updating hooks** for long-running work where accumulated context matters.

**Implement vector/RAG** when knowledge base reaches 50+ documents.

**Build cross-tool database** only for multi-agent or production systems.

---

## 11. REAL-WORLD WORKFLOWS & COMMUNITY EXPERIENCE

### Blog Posts & Tutorials

| Source | Title | URL |
|---|---|---|
| MindStudio | "How to Build an AI Second Brain with Claude Code and Obsidian" | https://www.mindstudio.ai/blog/build-ai-second-brain-claude-code-obsidian |
| MindStudio | "How to Build a Self-Evolving Claude Code Memory System" | https://www.mindstudio.ai/blog/self-evolving-claude-code-memory-obsidian-hooks |
| MindStudio | "Claude Code Memory Systems Explained: Which One Should You Use?" | https://www.mindstudio.ai/blog/claude-code-memory-systems-compared |
| MindStudio | "Graphify for Claude Code: How a Knowledge Graph Cuts Costs by 70x" | https://www.mindstudio.ai/blog/graphify-claude-code-knowledge-graph-large-codebase-70x |
| DEV Community | "Claude Code + Obsidian: Build a Second Brain That Actually Thinks" | https://dev.to/mibii/claude-code-obsidian-build-a-second-brain-that-actually-thinks-d61 |
| DEV Community | "Claude Code Compaction Kept Destroying My Work. I Built Hooks That Fixed It." | https://dev.to/mikeadolan/claude-code-compaction-kept-destroying-my-work-i-built-hooks-that-fixed-it-2dgp |
| Medium (Carlos Lopez) | "I Built a Persistent Memory System for Claude Using Obsidian" | https://medium.com/@jclopez117/i-built-a-persistent-memory-system-for-claude-using-obsidian-second-brain-22d4eeeb361b |
| Medium (Lucas H) | "How I use Obsidian with Claude code (and cut my token usage in half)" | https://medium.com/@507lucash/how-i-use-obsidian-with-claude-code-and-cut-my-token-usage-in-half-1f7c185c9658 |
| Substack (noahvnct) | "How to Build Your AI Second Brain Using Obsidian + Claude Code" | https://noahvnct.substack.com/p/how-to-build-your-ai-second-brain |
| Towards AI | "From Notes to Knowledge: The Claude and Obsidian Second-Brain Setup" | https://pub.towardsai.net/from-notes-to-knowledge-the-claude-and-obsidian-second-brain-setup-37af4f47486f |
| The Menon Lab | "Your AI Coding Agent Forgets Everything. This Obsidian Vault Fixes That." | https://themenonlab.blog/blog/obsidian-mind-persistent-memory-ai-coding-agents/ |
| Starmorph | "Obsidian + Claude Code: The Complete Integration Guide" | https://blog.starmorph.com/blog/obsidian-claude-code-integration-guide |
| Chase AI | "Claude Code + Obsidian: Persistent Memory That Works" | https://www.chaseai.io/blog/claude-code-obsidian-persistent-memory |
| XDA Developers | "I put Claude Code inside Obsidian, and it was awesome" | https://www.xda-developers.com/claude-code-inside-obsidian-and-it-was-eye-opening/ |
| Pasquale Pillitteri | "Obsidian + Claude Code: The Second Brain That Makes AI Agents Actually Useful" | https://pasqualepillitteri.it/en/news/962/obsidian-claude-code-second-brain-persistent-memory |
| Awesome Claude | "3 Ways to Use Obsidian with Claude Code" | https://awesomeclaude.ai/how-to/use-obsidian-with-claude |
| Kyle Gao | "Using Claude Code with Obsidian - A Perfect Pairing for Knowledge Work" | https://kyleygao.com/blog/2025/using-claude-code-with-obsidian/ |
| Pixelnthings | "How to Connect Obsidian to Claude Code + Build a Memory System (2026)" | https://pixelnthings.com/connect-obsidian-to-claude-code/ |
| How-To Geek | "Claude + Obsidian: The cheat code for building a second brain" | https://www.howtogeek.com/claude-obsidian-the-cheat-code-for-building-a-second-brain/ |
| WhyTryAI | "Build Your Second Brain With Claude Code & Obsidian" | https://www.whytryai.com/p/claude-code-obsidian |
| NxCode | "Obsidian AI Second Brain: Complete Guide (2026)" | https://www.nxcode.io/resources/news/obsidian-ai-second-brain-complete-guide-2026 |
| Geeky Gadgets | "Combining Claude Code & Obsidian Vaults for Persistent Project Memory" | https://www.geeky-gadgets.com/claude-code-obsidian-vault-memory/ |

### What Works Well (Community Consensus)

1. **Token savings are real** -- even basic setups cut token usage by 40-70% on focused tasks
2. **Session continuity is the killer feature** -- no more "Groundhog Day" re-explaining
3. **Zettelkasten + wikilinks + YAML frontmatter** is the dominant note format
4. **Hooks make it automatic** -- the best systems require zero manual discipline
5. **Graph view reveals patterns** you would never see by reading notes linearly
6. **Git-tracked vaults** provide version history and team sharing
7. **Multi-agent coordination through Obsidian** works better than shared context windows

### What Doesn't Work (Common Pitfalls)

See next section.

---

## 12. PITFALLS, LIMITATIONS & CRITICISMS

### "Stop Calling It Memory" (The Core Criticism)

Source: https://limitededitionjonathan.substack.com/p/stop-calling-it-memory-the-problem

The AI is not "remembering" -- it is reading an increasingly sophisticated knowledge base that makes it act like it remembers. The term "second brain" started as a metaphor for a filing system. When AI enters the picture, it becomes a misleading product claim.

**Valid point:** What these systems provide is "context retrieval," not memory. The distinction matters for setting expectations.

### Common Pitfalls

1. **Vault bloat** -- Without pruning, the vault accumulates stale/redundant notes. Scheduled lint/health agents help (obsidian-second-brain runs nightly + weekly audits).

2. **Auto-extraction quality** -- Hook-based auto-saving produces inconsistent note quality. Needs periodic human review. Risk of incorrect auto-written information compounding over time.

3. **Over-engineering** -- Many users start with complex multi-tier systems when a simple CLAUDE.md would suffice. Start simple, add complexity only when needed.

4. **Privacy** -- When Claude reads vault notes, their content is sent as part of the API request. Anthropic does not train on API inputs per their data policy, but the content does leave your machine during the session.

5. **The 71.5x claim is misleading** -- This number comes from a specific 52-file test corpus (Karpathy's repos + papers + images). Real-world savings on pure-code projects are closer to 7-8%. On focused tasks, 40-70% is more realistic.

6. **Vault quality = output quality** -- Most vaults only contain what was manually typed. Your best knowledge is scattered across the web. Solutions: /obsidian-ingest (obsidian-second-brain) and research commands.

7. **Token overhead of the system itself** -- Every hook, every UserPromptSubmit classification, every PostToolUse validation costs tokens. Obsidian-mind estimates: ~2K tokens at session start + ~100 tokens per classification + ~200 tokens per write validation.

8. **Compaction still loses nuance** -- PreCompact hooks help but cannot fully preserve the richness of a long conversation. Strategies help (cumulative summaries, decision reasoning preservation) but it remains an imperfect solution.

9. **Usage limits during peak hours** -- Anthropic has confirmed tighter session limits during peak hours. Heavy memory-system usage compounds this.

10. **Contradictions between vault and codebase** -- The vault can drift from the actual codebase. Systems like backyarddd/claude-infinite-context include staleness checking and conflict detection, but this is not universal.

---

## 13. PERFORMANCE BENCHMARKS

### Token Savings (Reported)

| System | Claimed Savings | Context |
|---|---|---|
| infinite-context (3-tier) | 62% per session | 80-message session benchmark |
| Graphify + Obsidian | 71.5x per query | 52-file test corpus (Karpathy repos) |
| Graphify (independent test) | 7-8% | Real-world browser-use project |
| Graphify (React+Supabase) | 499x per query | 126 TypeScript files, 332 graph nodes |
| Obsidian basic setup | 40-70% | Focused tasks, community reports |
| code-review-graph | 6.8x on reviews, 49x daily | Local knowledge graph |
| Nexus/Claudesidian | ~95% per query | Per their benchmarks |
| context-mode tools | Up to 98% | On noisiest commands |

### Cost Per Operation (Reported)

| Operation | Cost |
|---|---|
| Session memory extraction (Haiku) | ~$0.01 per extraction |
| /x-read command | ~$0.05 per call |
| /x-pulse command | ~$0.13 per call |
| /research command | ~$0.05 per call |
| /research-deep command | ~$0.40 per call |
| /youtube command | ~$0.04 per call |
| Graphify graph generation | $0 (AST-based, no LLM) |

### Speed

| Metric | Value |
|---|---|
| /obsidian-world context loading | ~10 seconds |
| Graph query vs full re-read | ~280 tokens vs ~20,000 tokens |
| Typical Claude Code session burn rate | 80,000 - 200,000 tokens in a few hours |

---

## 14. COMPLETE SOURCE LINKS

### GitHub Repositories

- https://github.com/chennurivarun/infinite-context
- https://github.com/breferrari/obsidian-mind
- https://github.com/eugeniughelbur/obsidian-second-brain
- https://github.com/lucasrosati/claude-code-memory-setup
- https://github.com/backyarddd/claude-infinite-context
- https://github.com/AgriciDaniel/claude-obsidian
- https://github.com/robabby/claude-skills
- https://github.com/georgeantonopoulos/obsidian-cli-memory-bank-skill
- https://github.com/ballred/obsidian-claude-pkm
- https://github.com/ashish141199/obsidian-claude-code
- https://github.com/coleam00/claude-memory-compiler
- https://github.com/jack60810/claude-evolve
- https://github.com/Shmayro/singularity-claude
- https://github.com/thedotmack/claude-mem
- https://github.com/safishamsi/graphify
- https://github.com/tirth8205/code-review-graph
- https://github.com/colbymchenry/codegraph
- https://github.com/zilliztech/memsearch
- https://github.com/basicmachines-co/basic-memory
- https://github.com/yoloshii/ClawMem
- https://github.com/mempalace/mempalace
- https://github.com/YishenTu/claudian
- https://github.com/Roasbeef/obsidian-claude-code
- https://github.com/MarkusPfundstein/mcp-obsidian
- https://github.com/bitbonsai/mcpvault
- https://github.com/iansinnott/obsidian-claude-code-mcp
- https://github.com/dan6684/smart-connections-mcp
- https://github.com/brianpetro/obsidian-smart-connections
- https://github.com/NousResearch/hermes-agent
- https://github.com/kfchou/wiki-skills
- https://github.com/lucasastorian/llmwiki
- https://github.com/MehmetGoekce/llm-wiki
- https://github.com/Pratiyush/llm-wiki
- https://github.com/Elizarfish/infinite-context
- https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- https://gist.github.com/ruvnet/29f8fa68582fdc1ca2da30136f538dba
- https://gist.github.com/sigalovskinick/e2e329bb37ecc74b9f15d5ba74ee1ee5

### Articles & Tutorials

- https://www.mindstudio.ai/blog/build-ai-second-brain-claude-code-obsidian
- https://www.mindstudio.ai/blog/self-evolving-claude-code-memory-obsidian-hooks
- https://www.mindstudio.ai/blog/claude-code-memory-systems-compared
- https://www.mindstudio.ai/blog/graphify-claude-code-knowledge-graph-large-codebase-70x
- https://www.mindstudio.ai/blog/andrej-karpathy-llm-wiki-knowledge-base-claude-code
- https://www.mindstudio.ai/blog/what-is-claude-code-auto-memory
- https://www.mindstudio.ai/blog/self-learning-claude-code-skill-learnings-md
- https://www.mindstudio.ai/blog/skill-systems-claude-code-chaining-autonomous-pipelines
- https://www.mindstudio.ai/blog/persistent-memory-system-claude-code-agents
- https://www.mindstudio.ai/blog/ai-second-brain-claude-code-obsidian-architecture
- https://www.mindstudio.ai/blog/5-claude-code-skills-cut-token-costs-70-percent-benchmarked
- https://dev.to/mibii/claude-code-obsidian-build-a-second-brain-that-actually-thinks-d61
- https://dev.to/mikeadolan/claude-code-compaction-kept-destroying-my-work-i-built-hooks-that-fixed-it-2dgp
- https://dev.to/imaginex/ai-agent-memory-management-when-markdown-files-are-all-you-need-5ekk
- https://dev.to/whoffagents/multi-agent-memory-without-a-vector-database-the-markdown-first-approach-2lo0
- https://medium.com/@jclopez117/i-built-a-persistent-memory-system-for-claude-using-obsidian-second-brain-22d4eeeb361b
- https://medium.com/@507lucash/how-i-use-obsidian-with-claude-code-and-cut-my-token-usage-in-half-1f7c185c9658
- https://medium.com/@gagandeep023/build-an-mcp-server-that-connects-claude-directly-to-your-obsidian-vault-d3ced0f67e98
- https://noahvnct.substack.com/p/how-to-build-your-ai-second-brain
- https://limitededitionjonathan.substack.com/p/stop-calling-it-memory-the-problem
- https://pub.towardsai.net/from-notes-to-knowledge-the-claude-and-obsidian-second-brain-setup-37af4f47486f
- https://towardsdatascience.com/i-replaced-vector-dbs-with-googles-memory-agent-pattern-for-my-notes-in-obsidian/
- https://blog.starmorph.com/blog/obsidian-claude-code-integration-guide
- https://blog.starmorph.com/blog/karpathy-llm-wiki-knowledge-base-guide
- https://www.chaseai.io/blog/claude-code-obsidian-persistent-memory
- https://pasqualepillitteri.it/en/news/962/obsidian-claude-code-second-brain-persistent-memory
- https://pasqualepillitteri.it/en/news/1181/claude-code-token-10-github-repos-savings
- https://awesomeclaude.ai/how-to/use-obsidian-with-claude
- https://themenonlab.blog/blog/obsidian-mind-persistent-memory-ai-coding-agents/
- https://www.xda-developers.com/claude-code-inside-obsidian-and-it-was-eye-opening/
- https://www.howtogeek.com/claude-obsidian-the-cheat-code-for-building-a-second-brain/
- https://www.whytryai.com/p/claude-code-obsidian
- https://www.nxcode.io/resources/news/obsidian-ai-second-brain-complete-guide-2026
- https://www.geeky-gadgets.com/claude-code-obsidian-vault-memory/
- https://www.codewithseb.com/blog/claude-code-obsidian-second-brain-guide
- https://pixelnthings.com/connect-obsidian-to-claude-code/
- https://kyleygao.com/blog/2025/using-claude-code-with-obsidian/
- https://erickhun.com/posts/partner-os-claude-mcp-obsidian/
- https://www.cognitionus.com/blog/claude-memory-compiler-guide
- https://aaronfulkerson.com/2026/04/12/karpathys-pattern-for-an-llm-wiki-in-production/
- https://claudefa.st/blog/tools/hooks/session-lifecycle-hooks
- https://claudefa.st/blog/tools/hooks/hooks-guide
- https://yuanchang.org/en/posts/claude-code-auto-memory-and-hooks/
- https://milvus.io/blog/claude-code-memory-memsearch.md
- https://milvus.io/blog/adding-persistent-memory-to-claude-code-with-the-lightweight-memsearch-plugin.md
- https://3sztof.github.io/posts/obsidian-smart-connections-mcp/

### Obsidian Forum Threads

- https://forum.obsidian.md/t/obsidian-mcp-servers-experiences-and-recommendations/99936
- https://forum.obsidian.md/t/claude-code-from-the-sidebar/109634
- https://forum.obsidian.md/t/i-built-an-mcp-server-that-connects-claude-ai-directly-to-your-obsidian-vault/112454

### Claude Code Official

- https://code.claude.com/docs/en/memory
- https://github.com/anthropics/claude-code/issues/15923 (PreCompact hook request)
- https://github.com/anthropics/claude-code/issues/17237 (Pre/PostCompact hooks request)
- https://github.com/anthropics/claude-code/issues/32062 (Auto-save session state)
- https://github.com/anthropics/claude-code/issues/34299 (Pre-compaction warning)
- https://github.com/anthropics/claude-code/issues/40492 (PostCompact hook request)

### Comparison Articles

- https://www.mindstudio.ai/blog/claude-code-memory-systems-compared
- https://gist.github.com/MagnaCapax/748b0be92dc31d4f5b6ba13286203766 (Vainamoinen vs MemPalace vs claude-mem)
- https://www.mempalace.tech/blog/best-ai-memory-frameworks-2026
- https://www.mempalace.tech/compare/mempalace-vs-mem0
- https://vectorize.io/articles/mempalace-alternatives
- https://explore.n1n.ai/blog/ai-agent-memory-comparison-2026-mem0-zep-letta-cognee-2026-04-23

---

*END OF RESEARCH REPORT*
