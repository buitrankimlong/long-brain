# Claude Infinite Context - Complete Knowledge Extraction

> Source: `claude-infinite-context` by davo-codes (backyarddd)
> Version: 1.1.0 | License: MIT
> Repo: https://github.com/backyarddd/obsidian-infinite-context

## What It Solves

Claude Code loses ALL context when context window fills up and compaction hits. API keys, preferences, architecture decisions, error corrections - everything gone. You re-explain the same things every session.

This skill gives Claude Code a **persistent, searchable long-term memory** stored as Markdown files in an Obsidian vault. Everything is saved automatically, recalled on every new session, and survives across conversations, days, and projects.

---

## 3-Tier Memory Architecture

The system operates on three layers that work together:

### Tier 1: CLAUDE.md (Immediate Context)
- Loaded automatically at every conversation start
- Contains directives telling Claude to invoke obsidian-memory skill
- The "bootstrap" layer - ensures the memory system activates
- Should include: Always Active directive, Credential Capture, Preference Tracking, Mistake Logging, Decision Logging, Session Persistence, Context Preservation, Forget Support, Auto-Correction

### Tier 2: Obsidian Vault Memory Files (Persistent Storage)
- Plain Markdown files with YAML frontmatter stored in Obsidian vault
- Survives across all sessions indefinitely
- Searchable via Obsidian's search, graph view, tags, and Dataview plugin
- Per-project isolation with global fallback
- Automatically read on conversation start, written during conversation

### Tier 3: Session Logs (Conversation History)
- Detailed logs of each work session
- "Context for Next Session" section acts as handoff briefing
- "Open Items" section enables session continuity
- Memory Stats track what was saved per session
- Stored at: `projects/{project}/sessions/{YYYY-MM-DD}_{HH-MM}_{topic}.md`

---

## Vault Directory Structure

```
Your Obsidian Vault/
  Claude-Memory/
    _GLOBAL.md              <- Cross-project preferences, learned patterns
    _KEYS.md                <- Global API keys (fallback for all projects)
    _DISABLED.md            <- Projects that opted out of memory tracking
    templates/
      session.md            <- Template for session logs
      project.md            <- Template for project memory
    projects/
      {project-name}/
        _PROJECT.md         <- Project master memory (overview, stack, architecture)
        _KEYS.md            <- Project-specific API keys
        _ERRORS.md          <- Mistakes + lessons learned (append-only)
        _DECISIONS.md       <- Technical decisions + reasoning (append-only)
        sessions/           <- Conversation logs
          {YYYY-MM-DD}_{HH-MM}_{topic}.md
        notes/              <- Reference notes for complex subsystems
          {topic}.md
        _snapshots/         <- Rollback snapshots (max 5)
          {YYYY-MM-DD}_{HH-MM}/
```

---

## All 7 Skills (Complete Reference)

### 1. obsidian-memory (Main Brain - ALWAYS ACTIVE)
**Purpose**: The core autonomous memory system. Auto-invokes without user action.
**Allowed tools**: Read, Write, Edit, Glob, Grep, Bash(cat/mkdir/date/ls/rm)

**13 Automatic Behaviors**:

1. **AUTO-RECALL** (every conversation start):
   - Read obsidian-memory.json for vault path
   - Read _GLOBAL.md, _PROJECT.md, _ERRORS.md, _DECISIONS.md, _KEYS.md
   - Read latest 3 session logs
   - Check _DISABLED.md first (skip if project opted out)
   - Surface open items from last session
   - Detect memory conflicts with codebase
   - Note stale entries (30+ days old) for later verification

2. **AUTO-SAVE API KEYS** (whenever key appears):
   - Detects: API keys, tokens, secrets, credentials, connection strings
   - Saves to project _KEYS.md or global _KEYS.md
   - Auto-detects scope or asks if ambiguous
   - Format: Service Name, Key, Type, Environment, Added date, Notes

3. **AUTO-SAVE PREFERENCES** (whenever user corrects/instructs):
   - Triggers: "Don't do X", "I prefer Y", "Always use Z", corrections
   - Saves to _GLOBAL.md or _PROJECT.md silently
   - Replaces contradicting preferences

4. **AUTO-LOG ERRORS** (whenever mistakes happen):
   - Triggers: code fails, user says "wrong", test fails, misunderstanding
   - Appends to _ERRORS.md with: What happened, Root cause, Fix, Lesson
   - Tags: #error #{category}

5. **AUTO-LOG DECISIONS** (whenever technical choices made):
   - Triggers: framework choices, architecture decisions, trade-offs
   - Appends to _DECISIONS.md with: Decision, Alternatives, Reasoning, Consequences
   - Tags: #decision #{category}

6. **AUTO-LOG SESSIONS** (periodically during long conversations):
   - Triggers: task complete, 20+ messages, topic switch, user wrapping up
   - Writes session log with: Summary, What Was Done, Decisions, Problems/Solutions, Code Changes, Open Items, Context for Next Session, Memory Stats
   - Focus on WHAT and WHY, not play-by-play

7. **AUTO-FORGET** (when user corrects or says forget):
   - Triggers: "forget that", "that's wrong", "delete that", "outdated"
   - Searches ALL memory files via Grep
   - Deletes, updates, or appends correction notes depending on file type

8. **PROACTIVE SAVE BEFORE COMPACTION**:
   - Heuristics: 15+ messages, 5+ files read, 10+ tool calls, 100+ lines generated, context >70%
   - Saves comprehensive session log, updates all memory files
   - Tells user to run /compact, then reloads after

9. **CROSS-PROJECT LEARNING**:
   - When a clever solution is found, asks user if they want to generalize it
   - Saves to _GLOBAL.md under "Learned Patterns" with wikilinks back to source project
   - NEVER auto-saves without asking

10. **DEPENDENCY TRACKING**:
    - Maintains Dependencies section in _PROJECT.md
    - Flags version changes since last recorded
    - Only tracks key dependencies (frameworks, ORMs, auth libs)

11. **NEVER ASSUME - ASK WHEN UNSURE**:
    - Overrides all behaviors
    - Ask about: preference vs one-time, key scope, decision finality, correction meaning, stale memory validity

12. **ROLLBACK SUPPORT**:
    - Snapshots before: scan, bulk deletion, major corrections
    - Stores in _snapshots/ (max 5 per project)
    - User can say "undo that memory change" to restore

13. **RELATED MEMORIES VIA WIKILINKS**:
    - Auto-links entries using Obsidian [[filename#heading]] syntax
    - Makes graph view useful for seeing connections

### 2. obsidian-search
**Purpose**: Search across all memory files for any topic
**Invocation**: `/obsidian-search [query]`
**Behavior**: Grep across all files in Claude-Memory/, present results grouped by file, suggest alternatives if nothing found
**Model invocation**: Disabled (manual only)

### 3. obsidian-forget
**Purpose**: Search and delete specific memories
**Invocation**: `/obsidian-forget [topic]`
**Behavior**: Search all files, show matches, ask which to delete/correct, handle each file type appropriately
**Model invocation**: Disabled (manual only)

### 4. obsidian-scan
**Purpose**: Deep-scan existing project and build memory from scratch
**Invocation**: `/obsidian-scan`
**Behavior**:
- Reads package files, git config, CI/CD configs
- Maps directory tree (top 3 levels), detects patterns
- Reads README, configs, entry points, DB schemas
- Creates rollback snapshot if memory exists
- Writes _PROJECT.md, _DECISIONS.md (marked as inferred), notes/, _KEYS.md placeholders
- Never stores full file contents, only summaries
**Model invocation**: Disabled (manual only)

### 5. obsidian-rollback
**Purpose**: Undo last major memory change from snapshot
**Invocation**: `/obsidian-rollback`
**Behavior**: Find latest snapshot, show contents, ask confirmation, restore, delete used snapshot
**Model invocation**: Disabled (manual only)

### 6. obsidian-status
**Purpose**: Overview of all stored memory
**Invocation**: `/obsidian-status`
**Behavior**: List all projects with last session date, session count, error/decision/key counts, total size, global stats, disabled projects
**Model invocation**: Disabled (manual only)

### 7. obsidian-update
**Purpose**: Self-update to latest version from GitHub
**Invocation**: `/obsidian-update`
**Behavior**: Compare local VERSION with remote, show changelog, ask confirmation, clone latest, backup current skills, copy new skills (replacing $OBSIDIAN_VAULT_PATH), update config version, cleanup
**Model invocation**: Disabled (manual only)

---

## CLAUDE.md Template (from CLAUDE.md.example)

```markdown
## Obsidian Memory - Persistent Brain

- **Always Active**: Invoke obsidian-memory at every conversation start to recall project context
- **Credential Capture**: Whenever the user shares an API key, token, secret, or credential - save it immediately to the vault
- **Preference Tracking**: Whenever the user states a preference or corrects you - save it to the vault
- **Mistake Logging**: Whenever a mistake is made - log it to the vault for future reference
- **Decision Logging**: Whenever a significant decision is made - log it to the vault
- **Session Persistence**: Periodically during long conversations, save session progress to the vault
- **Context Preservation**: Before the conversation ends or context gets long - save everything to the vault
- **Forget Support**: When the user says to forget something - find and delete that memory from the vault
- **Auto-Correction**: When the user says "forget that" or "that's wrong" about something previously saved - auto-search and remove it from the vault
- Use obsidian-memory as the persistent brain across sessions - invoke aggressively without being asked
```

---

## File Templates

### Session Log Template
```markdown
---
project: {{project}}
date: {{date}}
time: {{time}}
topic: {{topic}}
---
# Session: {{topic}}

## Summary

## What Was Done
-

## Decisions Made
-

## Problems & Solutions

## Code Changes
-

## Open Items
-

## Context for Next Session
```

### Project Memory Template
```markdown
---
project: {{name}}
created: {{date}}
updated: {{date}}
---
# {{name}} - Master Memory

## Overview

## Tech Stack

## Preferences

## Patterns

## Architecture

## Team / Context
```

### _GLOBAL.md Template
```markdown
---
updated: {date}
---
# Global Preferences

## Communication Style
<!-- How you like Claude to communicate -->

## Coding Preferences
<!-- Languages, frameworks, patterns you prefer -->

## General Rules
<!-- Things that apply across all projects -->

## Learned Patterns

### {Pattern Name} (from [[{project-name}]])
**Problem**: {generalized problem description}
**Solution**: {generalized solution, not project-specific}
**Discovered**: {date}
**Tags**: #pattern #{category}
```

### _KEYS.md Template
```markdown
---
project: {name}
updated: {date}
---
# API Keys - {Project Name}

## {Service Name}
- **Key**: `{api-key}`
- **Type**: {api-key|token|secret|credential|connection-string}
- **Environment**: {production|staging|development}
- **Added**: {date}
- **Notes**: {context}
```

### _ERRORS.md Entry Format
```markdown
## {YYYY-MM-DD} - {short description}
**What happened**: {description}
**Root cause**: {why it happened}
**Fix**: {how it was fixed}
**Lesson**: {what to do differently next time}
**Tags**: #error #{category}
```

### _DECISIONS.md Entry Format
```markdown
## {YYYY-MM-DD} - {decision title}
**Decision**: {what was decided}
**Alternatives considered**: {what else was considered}
**Reasoning**: {why this choice}
**Consequences**: {what this means going forward}
**Tags**: #decision #{category}
```

---

## Configuration

### Config File: `~/.claude/obsidian-memory.json`
```json
{
  "vaultPath": "/path/to/your/obsidian/vault",
  "memoryDir": "/path/to/your/obsidian/vault/Claude-Memory",
  "created": "2026-03-19",
  "version": "1.1.0"
}
```

### Environment Variable (overrides config file)
```bash
export OBSIDIAN_VAULT_PATH="/path/to/your/vault"
```

### Session Start Hook: `~/.claude/settings.json`
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo '[OBSIDIAN MEMORY] Auto-recalling project context from Obsidian vault...'"
          }
        ]
      }
    ]
  }
}
```

### Vault Path Priority
1. `OBSIDIAN_VAULT_PATH` environment variable (highest)
2. `~/.claude/obsidian-memory.json` vaultPath field
3. SKILL.md hardcoded path (set during setup)
4. Ask user (last resort, then save to config)

### Project Name Detection Priority
1. Current working directory basename
2. `package.json` name field
3. `.git` remote origin name
4. Ask user (then save so never asked again)

---

## Setup Instructions

### Automated Setup (Recommended)

```bash
# Clone repo
git clone https://github.com/backyarddd/obsidian-infinite-context.git
cd obsidian-infinite-context

# macOS/Linux/Git Bash
chmod +x scripts/setup.sh
./scripts/setup.sh

# Windows PowerShell
.\scripts\setup.ps1
```

The setup script:
1. Auto-detects Obsidian vault (searches Documents, Home, OneDrive, Desktop up to 3 levels deep)
2. Creates `Claude-Memory/` folder structure with projects/ and templates/
3. Creates _GLOBAL.md and _KEYS.md with starter templates
4. Creates session.md and project.md templates
5. Installs ALL 7 skills to `~/.claude/skills/obsidian-*/`
6. For obsidian-memory skill, replaces `$OBSIDIAN_VAULT_PATH` with actual vault path
7. Saves config to `~/.claude/obsidian-memory.json`
8. Creates `~/.claude/settings.json` with SessionStart hook (if no existing settings.json)
9. Restart Claude Code after setup

### Manual Setup

```bash
# 1. Copy skill files
mkdir -p ~/.claude/skills/obsidian-memory
cp skills/obsidian-memory/SKILL.md ~/.claude/skills/obsidian-memory/SKILL.md
# Repeat for all 7 skills

# 2. Set vault path (pick one method)
# Method A: Config file
cat > ~/.claude/obsidian-memory.json << 'EOF'
{
  "vaultPath": "/path/to/your/obsidian/vault",
  "memoryDir": "/path/to/your/obsidian/vault/Claude-Memory",
  "created": "2026-03-19",
  "version": "1.0.0"
}
EOF

# Method B: Edit SKILL.md directly (replace $OBSIDIAN_VAULT_PATH)
# Method C: export OBSIDIAN_VAULT_PATH="/path/to/your/vault"

# 3. Create vault structure
VAULT="/path/to/your/obsidian/vault"
mkdir -p "$VAULT/Claude-Memory/projects"
mkdir -p "$VAULT/Claude-Memory/templates"

# 4. Add session-start hook to ~/.claude/settings.json
# 5. Restart Claude Code
```

---

## Token Savings Strategy

The system reduces token waste through several mechanisms:

1. **No re-explaining**: Context survives compaction and new sessions. The user never re-explains API keys, preferences, architecture decisions, or corrections.

2. **Proactive save before compaction**: When context hits ~70%, Claude saves everything to Obsidian and suggests /compact. After compaction, only the most relevant context is reloaded (not the full conversation).

3. **Selective recall**: On session start, Claude reads only the relevant files (project memory, last 3 sessions, errors, decisions, keys) rather than loading the entire history.

4. **Summary-based logging**: Session logs store summaries and file paths, never full file contents. This keeps memory files small and fast to read.

5. **Staleness management**: Old memories are checked before being acted upon, preventing wasted tokens from acting on outdated information.

6. **Per-project isolation**: Only the current project's memory is loaded, not every project's history.

7. **Focused session logs**: One log per major topic/task, not per message. "Context for Next Session" is written as a colleague briefing, maximizing information density.

---

## Key Design Rules

1. **Be silent about most saves** - brief confirmations only for keys and major saves
2. **Always append** to _ERRORS.md and _DECISIONS.md - never overwrite old entries
3. **API keys are per-project by default** - same service CAN have different keys per project
4. **Check project keys first**, then fall back to global
5. **Use Obsidian wikilinks** ([[note name]]) for cross-referencing
6. **Add YAML frontmatter** to every file
7. **Use tags** liberally (#error, #decision, #preference, #key)
8. **Create directories** with mkdir -p before writing
9. **Date format**: YYYY-MM-DD for dates, HH-MM for times in filenames
10. **Keep session logs focused** - one per major topic, not per message
11. **Never store full file contents** in logs
12. **The user should never have to tell Claude to save**

---

## Browsing Memory in Obsidian

- **Search**: Find anything across all sessions and files
- **Graph view**: See connections between notes via wikilinks
- **Tags**: Filter by #error, #decision, #preference, #key, #pattern
- **Direct editing**: Claude picks up your manual changes
- **Dataview plugin**: Advanced queries across memory (optional)

---

## Changelog

### v1.1.0 (2026-03-19)
- Added `/obsidian-update` command for self-updating
- Split commands into individual skills with descriptions
- Replaced auto-compact with proactive save before compaction
- Added CLAUDE.md.example for recommended global config
- Updated setup scripts to install all skills

### v1.0.0 (2026-03-19)
- Initial release with all core features
- Auto-recall, auto-save (keys, preferences, errors, decisions)
- Session logging with continuity
- Per-project API key storage
- Memory conflict detection and staleness checking
- Cross-project learning, dependency tracking
- Rollback snapshots, wikilinks, memory stats
- Project opt-out support
- Setup scripts for macOS/Linux/Windows

---

## Integration with Our Architecture

This tool aligns with our 3-tier memory strategy defined in CLAUDE.md:
- **CLAUDE.md** = Tier 1 (under 80 lines, WHY/WHAT/HOW)
- **MEMORY.md** = Tier 2 (project-level auto-memory)
- **Obsidian vault** = Tier 3 (infinite persistent brain via this tool)

For our AI agency business, this enables:
- Persistent client project memory across all sessions
- API key management across multiple client projects
- Architecture decision tracking for every client build
- Error learning that carries across similar projects (cross-project patterns)
- Session continuity for long-running client engagements
