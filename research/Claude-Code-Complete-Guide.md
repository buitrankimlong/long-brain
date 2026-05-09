# Claude Code: Complete Deep Research Guide
## All Techniques, Tips, and Best Practices (May 2026)

---

# TABLE OF CONTENTS

1. [Claude Code Fundamentals](#1-claude-code-fundamentals)
2. [Advanced Claude Code Techniques](#2-advanced-claude-code-techniques)
3. [Multi-Agent / Parallel Agent Techniques](#3-multi-agent--parallel-agent-techniques)
4. [Hooks System](#4-hooks-system)
5. [MCP Integration](#5-mcp-integration-with-claude-code)
6. [Token Optimization Techniques](#6-token-optimization-techniques)
7. [Project Setup Best Practices](#7-project-setup-best-practices)
8. [Workflow Patterns](#8-workflow-patterns)

---

# 1. CLAUDE CODE FUNDAMENTALS

## What is Claude Code?

Claude Code is Anthropic's agentic coding tool that lives in your terminal, IDE, desktop app, and browser. Unlike a chatbot that answers questions and waits, Claude Code can read your files, run commands, make changes, and autonomously work through problems. It understands your entire codebase and can work across multiple files and tools.

**Available surfaces:**
- **Terminal CLI** -- full-featured command-line interface
- **VS Code / Cursor Extension** -- inline diffs, @-mentions, plan review
- **JetBrains Plugin** -- IntelliJ, PyCharm, WebStorm support
- **Desktop App** -- standalone app for visual diff review, parallel sessions, scheduled tasks
- **Web App** -- runs in browser with no local setup (claude.ai/code)
- **iOS App** -- mobile access via Claude iOS app

## Full Feature List

- Edit files, run commands, manage projects from command line
- Build features, fix bugs via natural language
- Create commits and pull requests (direct git integration)
- Connect to external tools via MCP (Model Context Protocol)
- Customize with CLAUDE.md instructions, skills, and hooks
- Run agent teams and build custom subagents
- Pipe, script, and automate with CLI composability
- Schedule recurring tasks (routines, desktop scheduled tasks, /loop)
- Work across devices (Remote Control, Dispatch, teleport)
- Route tasks from Slack (@Claude mentions)
- Debug live web applications (Chrome extension)
- Build custom agents via Agent SDK (Python, TypeScript, CLI)

## Installation

### macOS / Linux / WSL:
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### Windows PowerShell:
```powershell
irm https://claude.ai/install.ps1 | iex
```

### Windows CMD:
```batch
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### Homebrew:
```bash
brew install --cask claude-code
# or for latest channel:
brew install --cask claude-code@latest
```

### WinGet:
```powershell
winget install Anthropic.ClaudeCode
```

### Linux package managers:
Available via apt, dnf, or apk on Debian, Fedora, RHEL, and Alpine.

### Start Claude Code:
```bash
cd your-project
claude
```

Native installations auto-update in the background. Homebrew and WinGet do not auto-update.

**Windows note:** Git for Windows is recommended on native Windows so Claude Code can use the Bash tool. Without it, Claude Code uses PowerShell instead.

## CLAUDE.md File

CLAUDE.md is a special markdown file that Claude reads at the start of every conversation. It provides persistent context that Claude cannot infer from code alone.

### What to Include:
- Bash commands Claude cannot guess (build, test, lint, deploy commands)
- Code style rules that differ from defaults
- Testing instructions and preferred test runners
- Repository etiquette (branch naming, PR conventions)
- Architectural decisions specific to your project
- Developer environment quirks (required env vars)
- Common gotchas or non-obvious behaviors

### What NOT to Include:
- Anything Claude can figure out by reading code
- Standard language conventions Claude already knows
- Detailed API documentation (link to docs instead)
- Information that changes frequently
- Long explanations or tutorials
- File-by-file descriptions of the codebase
- Self-evident practices like "write clean code"

### CLAUDE.md Locations (by scope):

| Scope | Location | Purpose |
|-------|----------|---------|
| Managed policy | `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS), `/etc/claude-code/CLAUDE.md` (Linux), `C:\Program Files\ClaudeCode\CLAUDE.md` (Windows) | Organization-wide |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team-shared, checked into source control |
| User | `~/.claude/CLAUDE.md` | Personal preferences, all projects |
| Local | `./CLAUDE.local.md` | Personal project-specific, add to .gitignore |
| Parent directories | Loaded automatically (useful for monorepos) |
| Child directories | Loaded on demand when Claude works in those dirs |

### CLAUDE.md Imports:
```markdown
See @README.md for project overview and @package.json for available npm commands.
# Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

Supports relative and absolute paths, recursive imports (max 5 hops). HTML comments (`<!-- -->`) are stripped before injection to save tokens.

### Size Guideline:
Target under 200 lines per CLAUDE.md file. Claude's system prompt already consumes ~50 instructions, and LLMs reliably follow roughly 150-200 total instructions before degradation.

### Key Tip:
You can tune instructions by adding emphasis (e.g., "IMPORTANT" or "YOU MUST") to improve adherence.

## Memory System

Claude Code has two complementary memory systems:

### 1. CLAUDE.md Files (You Write)
- Instructions and rules you author manually
- Scoped to project, user, or organization
- Loaded into every session in full
- Use for coding standards, workflows, architecture

### 2. Auto Memory (Claude Writes)
- Claude saves notes for itself as it works
- Build commands, debugging insights, architecture notes, style preferences
- Per working tree scope
- First 200 lines or 25KB loaded per session
- Stored at `~/.claude/projects/<project>/memory/`

**Auto memory structure:**
```
~/.claude/projects/<project>/memory/
  MEMORY.md          # Concise index, loaded every session
  debugging.md       # Detailed notes on debugging patterns
  api-conventions.md # API design decisions
```

MEMORY.md acts as an index (~150 characters per line, even hundreds of memories fit in a few hundred tokens). Topic files are loaded on demand.

**Commands:**
- `/memory` -- browse and edit all memory files
- Auto memory toggle available via `/memory` or `autoMemoryEnabled` setting
- Requires Claude Code v2.1.59+

**Subagent memory:** Subagents can maintain their own auto memory (configured via subagent settings).

## Context Window Management (1M Tokens)

The context window holds your entire conversation: every message, every file Claude reads, every command output. Performance degrades as context fills.

**What loads at startup:**
- System prompt
- CLAUDE.md files (all in hierarchy)
- Auto memory (MEMORY.md index)
- Skill descriptions (names + short descriptions)
- MCP tool names (deferred loading)

**Key strategies:**
- `/clear` between unrelated tasks to reset context
- `/compact <instructions>` to summarize and compress history
- Auto-compaction triggers automatically when approaching limits
- `/context` shows exactly where tokens are going
- `/btw` for quick questions that don't enter history
- Subagents for exploration (keeps main context clean)
- `/rewind` to summarize from a checkpoint

**What survives compaction:**
- Project-root CLAUDE.md is re-read from disk and re-injected
- Nested CLAUDE.md files reload on next file access in that subdirectory
- Invoked skills are re-attached (first 5,000 tokens each, 25,000 total budget)

## Permission Modes

Five permission modes, three cycle via Shift+Tab:

| Mode | Behavior |
|------|----------|
| **Default** | Prompts for permission on first use of each tool |
| **AcceptEdits** | Auto-approves file edits + common filesystem commands (mkdir, touch, rm, mv, cp, sed) within working directory |
| **Plan Mode** | Prevents tool execution entirely; Claude analyzes and plans only |
| **Auto Mode** | Classifier model reviews actions before they run; blocks risky operations |
| **Bypass/DontAsk** | Skips all permission checks |

**Permission rules configuration:**
- `/permissions` command to manage allowlist/denylist
- `allowed_tools` and `disallowed_tools` in settings.json
- `Bash(git commit:*)` syntax for prefix matching
- "Always allow" option during session prompts

**Settings hierarchy (merges across layers):**
1. `.claude/settings.local.json` (personal, gitignored)
2. `.claude/settings.json` (project, source controlled)
3. `~/.claude/settings.json` (user-level)
4. Managed policy settings

## Cost Management

**Average costs (enterprise):**
- ~$13 per developer per active day
- ~$150-250 per developer per month
- 90% of users stay below $30 per active day

**Tracking:**
- `/usage` -- detailed token usage for current session
- `/cost` (API users) or `/stats` (Pro/Max subscribers)
- Status line can be configured to show context usage continuously
- JSON output format includes `total_cost_usd`

**Rate limit recommendations (TPM per user):**
| Team Size | TPM per User | RPM per User |
|-----------|-------------|-------------|
| 1-5 | 200k-300k | 5-7 |
| 5-20 | 100k-150k | 2.5-3.5 |
| 20-50 | 50k-75k | 1.25-1.75 |
| 50-100 | 25k-35k | 0.62-0.87 |
| 100-500 | 15k-20k | 0.37-0.47 |
| 500+ | 10k-15k | 0.25-0.35 |

---

# 2. ADVANCED CLAUDE CODE TECHNIQUES

## Writing Effective CLAUDE.md

### Principles:
1. **Keep it concise** -- under 200 lines; every line costs tokens every turn
2. **Be specific** -- "Use 2-space indentation" not "Format code properly"
3. **Use progressive disclosure** -- tell Claude how to find information, not all the information
4. **Treat like code** -- review when things go wrong, prune regularly
5. **Test changes** -- observe whether Claude's behavior actually shifts

### Effective CLAUDE.md Example:
```markdown
# Code style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (eg. import { foo } from 'bar')

# Workflow
- Be sure to typecheck when you're done making a series of code changes
- Prefer running single tests, not the whole test suite, for performance

# Compact instructions
When you are using compact, please focus on test output and code changes
```

### Maintenance:
- If Claude keeps doing something wrong despite a rule, the file is probably too long
- If Claude asks questions answered in CLAUDE.md, phrasing may be ambiguous
- Check into git so team can contribute; compounds in value over time

## Slash Commands

### Built-in Commands:
| Command | Purpose |
|---------|---------|
| `/init` | Generate starter CLAUDE.md from project analysis |
| `/clear` | Wipe conversation history, free all context |
| `/compact [instructions]` | Compress conversation history with optional focus |
| `/cost` or `/usage` | Show token usage and estimated spend |
| `/model` | Switch models mid-session |
| `/memory` | Browse and edit memory files |
| `/permissions` | Manage tool allowlist/denylist |
| `/hooks` | Browse configured hooks |
| `/mcp` | See configured MCP servers |
| `/context` | See what's consuming context space |
| `/help` | Show available commands |
| `/rename` | Name current session |
| `/rewind` | Restore to previous checkpoint |
| `/btw` | Side question that doesn't enter history |
| `/loop` | Repeat a prompt within session (polling) |
| `/schedule` | Create scheduled routine |
| `/desktop` | Hand off to desktop app |
| `/skills` | Manage skill visibility |
| `/plugin` | Browse plugin marketplace |

### Bundled Skills (invoked like commands):
`/simplify`, `/batch`, `/debug`, `/loop`, `/claude-api`, `/commit`, `/review`, `/security-review`

### Custom Slash Commands:
Create markdown files in `.claude/commands/` or `.claude/skills/`:

```markdown
# .claude/commands/deploy.md (or .claude/skills/deploy/SKILL.md)
---
name: deploy
description: Deploy the application
disable-model-invocation: true
---
Deploy $ARGUMENTS to production:
1. Run tests
2. Build application
3. Push to deployment target
```

Invoke with `/deploy staging`. Custom commands have been merged into skills -- both approaches work identically.

## Headless Mode / Non-Interactive Mode

### Basic Usage:
```bash
claude -p "Find and fix the bug in auth.py"
```

### Key Flags:
- `-p` / `--print` -- run non-interactively, single prompt
- `--output-format text|json|stream-json` -- control output format
- `--allowedTools "Read,Edit,Bash"` -- auto-approve specific tools
- `--permission-mode auto|dontAsk|acceptEdits` -- set permission mode
- `--dangerously-skip-permissions` -- skip all prompts (CI/CD)
- `--bare` -- skip auto-discovery of hooks, skills, plugins, MCP, memory, CLAUDE.md
- `--verbose` -- debugging output
- `--json-schema '{...}'` -- structured output conforming to schema
- `--append-system-prompt "..."` -- add to system prompt
- `--continue` -- continue most recent conversation
- `--resume <session-id>` -- resume specific session

### Piping:
```bash
# Pipe data in
cat build-error.txt | claude -p 'explain the root cause' > output.txt

# Pipe diff for review
git diff main | claude -p "review for security issues"

# Analyze logs
tail -200 app.log | claude -p "Slack me if you see any anomalies"
```

Piped stdin is capped at 10MB (v2.1.128+).

### Bare Mode:
```bash
claude --bare -p "Summarize this file" --allowedTools "Read"
```
Skips all auto-discovery. Only explicit flags take effect. Recommended for CI/CD. Will become default for `-p` in a future release.

### Structured Output:
```bash
claude -p "Extract function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'
```

### Fan-Out Pattern:
```bash
for file in $(cat files.txt); do
  claude -p "Migrate $file from React to Vue. Return OK or FAIL." \
    --allowedTools "Edit,Bash(git commit *)"
done
```

## Session Management

### Resume Sessions:
```bash
claude --continue           # Continue most recent session
claude --resume             # List recent sessions to choose
claude --resume abc123      # Resume specific session ID
```

### Session Naming:
```
/rename oauth-migration
```

### Forking:
Creates a new session from a copy of the original's history. Both sessions are independent afterward.

### Checkpoints:
- Every action creates a checkpoint
- Double-tap `Escape` or `/rewind` to open rewind menu
- Options: restore conversation only, code only, both, or summarize from checkpoint
- Checkpoints persist across sessions
- Only tracks changes made by Claude (not external processes)

## Worktrees for Parallel Work

### Start Claude in a Worktree:
```bash
claude --worktree feature-auth     # Named worktree
claude --worktree                  # Auto-generated name
claude --worktree "#1234"          # From PR number
```

Creates isolated worktree at `.claude/worktrees/<name>/` with a new branch.

### Key Points:
- Each worktree has its own files and branch, sharing repository history
- Edits in one session never touch files in another
- 2-4 parallel sessions is a reasonable ceiling
- Add `.claude/worktrees/` to `.gitignore`
- `.worktreeinclude` file copies gitignored files (like `.env`) into worktrees

### Base Branch Configuration:
```json
{
  "worktree": {
    "baseRef": "head"    // or "fresh" (default, from origin/HEAD)
  }
}
```

### Subagent Isolation:
Add `isolation: worktree` to subagent frontmatter, or ask Claude to "use worktrees for your agents." Temporary worktrees are auto-removed when subagent finishes without changes.

### Cleanup:
- No changes: auto-removed
- Changes exist: Claude prompts to keep or remove
- Non-interactive (`-p`): not auto-cleaned, use `git worktree remove`

---

# 3. MULTI-AGENT / PARALLEL AGENT TECHNIQUES

## Subagents (Within a Single Session)

Subagents are specialized AI assistants that run in their own context window with custom system prompts, specific tool access, and independent permissions.

### Why Use Subagents:
- **Preserve context** -- exploration stays out of main conversation
- **Enforce constraints** -- limit which tools a subagent can use
- **Reuse configurations** -- user-level subagents work across projects
- **Specialize behavior** -- focused system prompts for specific domains
- **Control costs** -- route tasks to cheaper models like Haiku

### Creating Custom Subagents:
Place in `.claude/agents/` (project), `~/.claude/agents/` (user), or via CLI `--agents`.

```markdown
# .claude/agents/security-reviewer.md
---
name: security-reviewer
description: Reviews code for security vulnerabilities
tools: Read, Grep, Glob, Bash
model: opus
---
You are a senior security engineer. Review code for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication and authorization flaws
- Secrets or credentials in code
- Insecure data handling
Provide specific line references and suggested fixes.
```

### Supported Frontmatter Fields:
- `name` -- display name
- `description` -- what it does (used for auto-delegation)
- `tools` -- allowed tools (restricts available tools)
- `model` -- model to use (opus, sonnet, haiku)
- `isolation` -- `worktree` for file isolation
- `skills` -- preload specific skills
- `mcpServers` -- MCP servers to connect

### Usage Patterns:
```
Use subagents to investigate how our auth system handles token refresh.
```
```
Use a subagent to review this code for edge cases.
```

### Subagent Memory:
Subagents can maintain their own auto memory (configured via subagent settings).

## Agent Teams (Experimental)

Agent teams coordinate multiple Claude Code instances working together. One session acts as team lead, coordinating work and synthesizing results. Teammates work independently with their own context windows and communicate directly.

### Enable Agent Teams:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
Requires Claude Code v2.1.32+.

### Architecture:
| Component | Role |
|-----------|------|
| Team Lead | Creates team, spawns teammates, coordinates |
| Teammates | Separate Claude Code instances, work on assigned tasks |
| Task List | Shared list of work items teammates claim and complete |
| Mailbox | Messaging system for inter-agent communication |

### Key Differences from Subagents:
| | Subagents | Agent Teams |
|---|-----------|-------------|
| Context | Own window; results return to caller | Own window; fully independent |
| Communication | Report back to main agent only | Message each other directly |
| Coordination | Main agent manages all work | Shared task list, self-coordination |
| Best for | Focused tasks where only result matters | Complex work requiring collaboration |
| Token cost | Lower | Higher (each teammate = separate instance) |

### Starting a Team:
```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```

### Display Modes:
- **In-process** (default): all teammates in main terminal. Shift+Down to cycle.
- **Split panes**: each teammate gets own pane (requires tmux or iTerm2).

### Task Management:
- Tasks have three states: pending, in progress, completed
- Tasks can have dependencies (blocked until deps complete)
- File locking prevents race conditions when claiming
- Lead assigns or teammates self-claim

### Plan Approval:
```
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

### Best Practices for Agent Teams:
1. **3-5 teammates** for most workflows
2. **5-6 tasks per teammate** keeps everyone productive
3. **Give enough context** in spawn prompts (teammates don't inherit lead's history)
4. **Avoid file conflicts** -- each teammate should own different files
5. **Monitor and steer** -- check in regularly
6. **Start with research/review** before parallel implementation
7. **Use Sonnet for teammates** to balance capability and cost
8. **Clean up teams when done** -- active teammates consume tokens

### Use Case Examples:
- **Parallel code review** (security, performance, test coverage)
- **Competing hypotheses debugging** (adversarial investigation)
- **Cross-layer coordination** (frontend, backend, tests)
- **New modules/features** (each teammate owns a piece)

### Limitations:
- No session resumption with in-process teammates
- Task status can lag
- One team per session
- No nested teams
- Lead is fixed (cannot transfer leadership)
- Split panes require tmux or iTerm2

## Running Multiple Sessions in Parallel

### Options:
| Approach | When to Use |
|----------|-------------|
| Worktrees | You want to drive unrelated tasks side by side |
| Subagents | Fan out research/edits within one task |
| Agent Teams | Claude manages the parallelism for you |
| Desktop App | Visual parallel session management with worktrees |
| Web App | Cloud infrastructure, isolated VMs |

### Writer/Reviewer Pattern:
| Session A (Writer) | Session B (Reviewer) |
|----|-----|
| `Implement a rate limiter for our API endpoints` | |
| | `Review the rate limiter in @src/middleware/rateLimiter.ts for edge cases, race conditions` |
| `Here's the review feedback: [output]. Address these issues.` | |

### Test-First Pattern:
One Claude writes tests, another writes code to pass them.

## Avoiding Conflicts Between Parallel Agents

1. **Worktree isolation** -- each session in its own git worktree
2. **File ownership** -- each agent works on different files
3. **Task list coordination** -- shared task list prevents duplicate work
4. **File locking** -- agent teams use file locking for task claiming
5. **Pre-approve common operations** in permission settings before spawning teammates
6. **Break work into self-contained units** with clear deliverables

---

# 4. HOOKS SYSTEM

## Overview

Hooks are user-defined shell commands, HTTP endpoints, LLM prompts, or agent tasks that execute automatically at specific points in Claude Code's lifecycle. Unlike CLAUDE.md instructions (advisory), hooks are deterministic and guarantee execution.

## Hook Types

### 1. Command Hooks (`type: "command"`)
Execute shell commands, receive JSON on stdin, return decisions via exit codes.
```json
{
  "type": "command",
  "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/script.sh",
  "timeout": 600
}
```

### 2. HTTP Hooks (`type: "http"`)
Send JSON POST to endpoints with custom headers.
```json
{
  "type": "http",
  "url": "http://localhost:8080/hooks/validate",
  "headers": { "Authorization": "Bearer $MY_TOKEN" },
  "allowedEnvVars": ["MY_TOKEN"]
}
```

### 3. MCP Tool Hooks (`type: "mcp_tool"`)
Call tools on connected MCP servers.

### 4. Prompt Hooks (`type: "prompt"`)
Send prompts to Claude for single-turn evaluation (yes/no decisions).

### 5. Agent Hooks (`type: "agent"`)
Spawn subagents for verification before proceeding.

## Complete Hook Lifecycle

```
Setup (--init-only)
  -> SessionStart
  -> [Per-turn loop]
       UserPromptSubmit
       UserPromptExpansion
       [Agentic loop - repeats]
         PreToolUse
         PermissionRequest
         PostToolUse / PostToolUseFailure
         PostToolBatch
         SubagentStart / SubagentStop
         TaskCreated / TaskCompleted
         Elicitation / ElicitationResult
       Stop / StopFailure
  -> [Async events]
       TeammateIdle, PreCompact/PostCompact, Notification
       ConfigChange, CwdChanged, FileChanged
       WorktreeCreate/WorktreeRemove, InstructionsLoaded
  -> SessionEnd
```

## Key Hook Events

### PreToolUse
Runs before tool execution. Can block, allow, deny, or modify tool calls.
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|ask|defer",
    "permissionDecisionReason": "Reason",
    "updatedInput": { "command": "modified command" },
    "additionalContext": "Context for Claude"
  }
}
```

### PostToolUse
Runs after tool succeeds. Can inject additional context.
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "File saved. Run tests to verify."
  }
}
```

### SessionStart
Runs when session begins/resumes. Can set environment variables via `$CLAUDE_ENV_FILE`.

### Stop
Runs when Claude finishes responding. Exit code 2 prevents stopping (keeps Claude working).

### UserPromptSubmit
Runs before Claude processes user prompt. Can block, add context, auto-name session.

### TeammateIdle
(Agent Teams) Runs when teammate about to go idle. Exit code 2 sends feedback and keeps teammate working.

### TaskCreated / TaskCompleted
(Agent Teams) Quality gates for task management.

## Exit Code Meanings

| Code | Meaning |
|------|---------|
| 0 | Success, parse JSON on stdout |
| 2 | Blocking error (blocks the action) |
| Other | Non-blocking error, shown in transcript |

## Configuration

### Location & Scope:
| Location | Scope |
|----------|-------|
| `~/.claude/settings.json` | All projects |
| `.claude/settings.json` | Single project (shareable) |
| `.claude/settings.local.json` | Single project (personal) |
| Managed policy | Organization-wide |
| Plugin `hooks/hooks.json` | When plugin enabled |
| Skill/Agent frontmatter | Component lifetime |

### Configuration Example:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Edit",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": ".claude/hooks/validator.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write $tool_input_file_path"
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/init.sh"
          }
        ]
      }
    ]
  }
}
```

### Matcher Patterns:
| Pattern | Evaluation |
|---------|-----------|
| `"*"`, `""`, omitted | Match all |
| `Bash`, `Edit\|Write` | Exact string or list |
| `^Notebook`, `mcp__memory__.*` | Regex |
| `mcp__<server>__<tool>` | MCP tool matching |

### Practical Examples:

**Block dangerous commands:**
```bash
#!/bin/bash
COMMAND=$(jq -r '.tool_input.command')
if echo "$COMMAND" | grep -q 'rm -rf'; then
  jq -n '{ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "Destructive command blocked" } }'
else
  exit 0
fi
```

**Auto-format after edits:**
Configure PostToolUse on `Write|Edit` to run prettier/eslint.

**Load environment at session start:**
```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo 'export NODE_ENV=production' >> "$CLAUDE_ENV_FILE"
fi
```

**Filter test output (save tokens):**
PreToolUse hook that modifies test commands to show only failures:
```bash
if [[ "$cmd" =~ ^(npm test|pytest|go test) ]]; then
  filtered_cmd="$cmd 2>&1 | grep -A 5 -E '(FAIL|ERROR|error:)' | head -100"
  # return updatedInput with filtered_cmd
fi
```

## Advanced Hook Features

- **Async hooks**: `"async": true` -- fire and forget
- **Async with rewake**: `"asyncRewake": true` -- wakes Claude with stderr on exit code 2
- **Conditional execution**: `"if": "Bash(git *)"` -- only runs when matching
- **Defer tool calls**: `"permissionDecision": "defer"` -- pauses Claude (headless only)
- **additionalContext**: inject context into Claude's conversation (capped at 10,000 chars)

## Environment Variables Available in Hooks:
- `$CLAUDE_PROJECT_DIR` -- project root
- `${CLAUDE_PLUGIN_ROOT}` -- plugin directory
- `${CLAUDE_PLUGIN_DATA}` -- plugin persistent data
- `$CLAUDE_EFFORT` -- effort level
- `$CLAUDE_CODE_REMOTE` -- "true" in web
- `$CLAUDE_ENV_FILE` -- path to write env exports (SessionStart, Setup, CwdChanged, FileChanged only)

---

# 5. MCP INTEGRATION WITH CLAUDE CODE

## What is MCP?

Model Context Protocol (MCP) is an open standard for connecting AI tools to external data sources. Claude Code acts as an MCP client, connecting to MCP servers that expose capabilities like file system access, browser automation, or database queries.

## Configuration

### Adding MCP Servers:
```bash
claude mcp add <server-name> -- <command> [args...]
```

### Configuration Locations:
- **User scope**: `~/.claude/settings.json` -- available to all sessions
- **Project scope**: `.claude/settings.json` -- shared with team
- **Team config**: `.mcp.json` in repository root -- auto-applied for all developers

### Transport Types:
- **stdio**: Local servers launched as subprocesses
- **HTTP**: Remote servers over HTTP/HTTPS

### Manual Configuration:
Edit settings.json directly (useful for complex configs):
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    }
  }
}
```

## MCP Tool Search (Context Optimization)

Claude Code uses Tool Search -- on-demand tool discovery. Instead of loading every tool definition upfront, Claude searches for relevant tools based on current task.

**Impact:** Reduces context from ~72,000 tokens to ~8,700 tokens (85% reduction).

Only tool names enter context until Claude actually uses a specific tool. Run `/context` to see consumption.

## Common MCP Servers for Development:
- **GitHub** -- issues, PRs, code review
- **Linear** -- project management, issue tracking
- **Slack** -- team communication
- **Postgres** -- database queries
- **Playwright** -- browser automation, testing
- **Figma** -- design integration
- **Sentry** -- error monitoring
- **Google Drive** -- document access
- **Jira** -- ticket management
- **Notion** -- knowledge base
- **Filesystem** -- file system access

## Best Practices:
1. **Prefer CLI tools when available** (gh, aws, gcloud) -- more context-efficient than MCP
2. **Disable unused servers** via `/mcp`
3. **Audit before installing** -- treat MCP servers like dependencies
4. **Use environment variables** for secrets, not hardcoded values
5. **Commit .mcp.json** for team consistency

## Creating Custom MCP Servers:
Build servers using the MCP SDK (available in Python, TypeScript). Servers expose tools, resources, and prompts that Claude can use.

---

# 6. TOKEN OPTIMIZATION TECHNIQUES

## Core Principle
Token costs scale with context size. The more context Claude processes per message, the more tokens you use.

## Automatic Optimizations (Built-in):
- **Prompt caching** -- reduces costs for repeated content (system prompts)
- **Auto-compaction** -- summarizes history when approaching limits
- **MCP Tool Search** -- defers tool definitions (85% reduction)

## Manual Optimization Strategies:

### 1. Lean CLAUDE.md
- Keep under 200 lines
- A 5,000-token CLAUDE.md costs 5,000 tokens on EVERY single turn
- Only include stable, broadly-applicable instructions
- Move specialized instructions to skills (load on demand)

### 2. Use /clear Between Tasks
```
/clear
```
Stale context wastes tokens on every subsequent message. Use `/rename` before clearing so you can `/resume` later.

### 3. Strategic /compact Usage
```
/compact Focus on the API changes
```
- Proactive compaction after completing sub-tasks
- Add custom compaction instructions in CLAUDE.md
- `/rewind` + "Summarize from here" for partial compaction

### 4. Choose the Right Model
- **Sonnet** for most coding tasks (cheaper)
- **Opus** only for complex architectural decisions or multi-step reasoning
- **Haiku** for simple subagent tasks
- Use `/model` to switch mid-session

### 5. Delegate to Subagents
```
Use subagents to investigate how our auth system handles token refresh.
```
Verbose output stays in subagent's context; only summary returns to main conversation.

### 6. Write Specific Prompts
- BAD: "improve this codebase" (triggers broad scanning)
- GOOD: "add input validation to the login function in auth.ts" (minimal file reads)

### 7. Use Plan Mode for Complex Tasks
Press Shift+Tab to enter plan mode. Claude explores and proposes an approach before implementing, preventing expensive re-work.

### 8. Reduce MCP Overhead
- Prefer CLI tools (gh, aws) over MCP servers
- Disable unused MCP servers via `/mcp`

### 9. Offload Processing to Hooks
Instead of Claude reading 10,000-line logs, have a hook grep for errors and return only matches.

### 10. Install Code Intelligence Plugins
For typed languages, code intelligence plugins give precise symbol navigation instead of text-based search, reducing unnecessary file reads.

### 11. Adjust Extended Thinking
- Lower effort with `/effort` for simple tasks
- Disable thinking in `/config` for routine operations
- `MAX_THINKING_TOKENS=8000` to cap thinking budget

### 12. Use /btw for Quick Questions
```
/btw what's the syntax for a Python list comprehension?
```
Answer appears in dismissible overlay, never enters conversation history.

### 13. Progressive Disclosure with Skills
Skills load on demand (~100 tokens for metadata, <5K when invoked) vs CLAUDE.md loading in full every session.

## Cost Monitoring:
- `/usage` for session token stats
- `/context` to see what's consuming space
- Configure status line for continuous context display
- JSON output includes `total_cost_usd` per invocation

---

# 7. PROJECT SETUP BEST PRACTICES

## Initialize a Project

### Using /init:
```
/init
```
Analyzes codebase to detect build systems, test frameworks, and code patterns. Generates a starter CLAUDE.md.

### Interactive Multi-Phase /init:
```bash
CLAUDE_CODE_NEW_INIT=1
```
Set this env var to enable interactive flow: asks which artifacts to set up (CLAUDE.md, skills, hooks), explores codebase with subagent, asks follow-up questions, presents reviewable proposal.

If CLAUDE.md already exists, `/init` suggests improvements rather than overwriting.

If AGENTS.md exists (from other tools), `/init` reads it and incorporates relevant parts. Also reads `.cursorrules` and `.windsurfrules`.

## CLAUDE.md Structure for Different Project Types

### Web Application:
```markdown
# Build & Run
- `npm install` to install dependencies
- `npm run dev` for development server
- `npm run build` for production build
- `npm test` to run tests
- `npm run lint` for linting

# Code Style
- Use TypeScript strict mode
- React functional components with hooks only
- CSS modules for styling (no inline styles)

# Architecture
- src/components/ for UI components
- src/api/ for API handlers
- src/hooks/ for custom hooks
- src/utils/ for shared utilities

# Testing
- Jest + React Testing Library
- Run single test: `npm test -- --testPathPattern=filename`
- Mock external APIs in tests
```

### Python Backend:
```markdown
# Setup
- Python 3.11+, use `poetry` for dependencies
- `poetry install` to set up
- `poetry run pytest` to test
- `poetry run mypy .` for type checking

# Style
- Type hints required on all public functions
- Docstrings in Google format
- Black for formatting, isort for imports

# Architecture
- app/routes/ for API endpoints
- app/models/ for database models
- app/services/ for business logic
```

## .claudeignore File

The file picker respects `.gitignore` rules by default. `.ignore` files are always respected.

Use `claudeMdExcludes` in settings to skip specific CLAUDE.md files in monorepos:
```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

## Settings Configuration

### Settings Files:
| File | Scope | Shared |
|------|-------|--------|
| `~/.claude/settings.json` | All projects | No |
| `.claude/settings.json` | Project (in source control) | Yes |
| `.claude/settings.local.json` | Project (gitignored) | No |
| Managed policy | Organization-wide | Yes (admin) |

Settings merge across layers (arrays combine, not replace).

### Key Settings:
```json
{
  "permissions": {
    "allow": ["Edit", "Bash(npm run *)"],
    "deny": ["Bash(rm -rf *)"]
  },
  "env": {
    "NODE_ENV": "development",
    "ANTHROPIC_MODEL": "claude-sonnet-4-6"
  },
  "hooks": { ... },
  "mcpServers": { ... },
  "autoMemoryEnabled": true,
  "defaultMode": "acceptEdits",
  "teammateMode": "in-process",
  "worktree": { "baseRef": "fresh" }
}
```

## Environment Variables

### Key Environment Variables:
| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | API authentication |
| `ANTHROPIC_MODEL` | Default model |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Enable agent teams |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | Disable auto memory |
| `CLAUDE_CODE_USE_POWERSHELL_TOOL` | Use PowerShell on Windows |
| `CLAUDE_CODE_NEW_INIT` | Interactive /init flow |
| `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` | Load CLAUDE.md from --add-dir |
| `CLAUDE_CODE_SYNC_PLUGIN_INSTALL` | Sync plugin install events |
| `MAX_THINKING_TOKENS` | Cap thinking token budget |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET` | Skill description budget |

Set via shell export or `"env"` object in settings.json (shell exports take precedence). As of v2.1.126, 175+ environment variables are exposed.

## Organize Rules with .claude/rules/

For larger projects, organize instructions into modular files:
```
.claude/
  CLAUDE.md              # Main project instructions
  rules/
    code-style.md        # Code style guidelines
    testing.md           # Testing conventions
    security.md          # Security requirements
    frontend/
      react-patterns.md  # Frontend-specific rules
```

### Path-Specific Rules:
```markdown
---
paths:
  - "src/api/**/*.ts"
---
# API Development Rules
- All endpoints must include input validation
- Use standard error response format
```

Only loads when Claude works with files matching the pattern.

## Skills Setup

### Creating Skills:
```
mkdir -p .claude/skills/fix-issue
```

```yaml
# .claude/skills/fix-issue/SKILL.md
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
allowed-tools: Bash(gh *) Read Edit Grep Glob
---
Fix GitHub issue $ARGUMENTS:
1. Use `gh issue view` to get details
2. Search codebase for relevant files
3. Implement fix
4. Write and run tests
5. Create descriptive commit
6. Push and create PR
```

### Skill Locations:
| Location | Scope |
|----------|-------|
| `~/.claude/skills/<name>/SKILL.md` | Personal (all projects) |
| `.claude/skills/<name>/SKILL.md` | Project |
| Plugin `skills/<name>/SKILL.md` | When plugin enabled |
| Managed policy | Organization-wide |

### Key Frontmatter Fields:
- `name` -- display name
- `description` -- what it does (Claude uses for auto-invocation)
- `disable-model-invocation` -- only manual `/name` invocation
- `user-invocable` -- set false to hide from menu (Claude-only)
- `allowed-tools` -- auto-approve tools when skill active
- `model` -- model override
- `effort` -- effort level override
- `context: fork` -- run in subagent
- `agent` -- which subagent type for forked context
- `paths` -- glob patterns limiting activation
- `hooks` -- hooks scoped to skill lifetime

### Dynamic Context Injection:
```yaml
## Current changes
!`git diff HEAD`
```
Shell commands run before Claude sees content, output replaces placeholder.

### Progressive Disclosure:
- Metadata loading: ~100 tokens (name + description only)
- Full instructions: <5K tokens (loaded only when invoked)
- Keeps base context small vs putting everything in CLAUDE.md

---

# 8. WORKFLOW PATTERNS

## Test-Driven Development

### The Red-Green-Refactor Cycle:
1. **Write failing test first** (must prompt Claude explicitly):
   ```
   Write a FAILING test for the email validation function.
   Do NOT write implementation yet.
   ```
2. **Verify test fails** (run it)
3. **Implement minimum code to pass**:
   ```
   Now implement validateEmail to pass the test. Run the test.
   ```
4. **Refactor** while keeping tests green

### Key Principles:
- Claude naturally writes implementation first -- you must explicitly request TDD order
- Tests provide Claude an explicit target, enabling self-correction
- The automated feedback loop means Claude can iterate faster
- Add testing guidelines to CLAUDE.md for consistency

## Bug Fixing Workflow

### Recommended Approach:
1. **Don't jump to "fix it"** -- make Claude understand the system first
2. **Provide the symptom, location, and definition of "fixed"**:
   ```
   Users report login fails after session timeout.
   Check the auth flow in src/auth/, especially token refresh.
   Write a failing test that reproduces the issue, then fix it.
   ```
3. **Use plan mode first** for complex bugs
4. **Have Claude read actual source files** from the trace
5. **Verify with tests** after fix

### Systematic Debugging:
```
The build fails with this error: [paste error].
Fix it and verify the build succeeds.
Address the root cause, don't suppress the error.
```

## Feature Development Workflow

### Four-Phase Approach:
1. **Explore** (Plan Mode):
   ```
   Read /src/auth and understand how we handle sessions and login.
   ```
2. **Plan** (Plan Mode):
   ```
   I want to add Google OAuth. What files need to change?
   What's the session flow? Create a plan.
   ```
   Press Ctrl+G to edit plan in text editor.
3. **Implement** (Default Mode):
   ```
   Implement the OAuth flow from your plan. Write tests for the
   callback handler, run the test suite and fix any failures.
   ```
4. **Commit**:
   ```
   Commit with a descriptive message and open a PR.
   ```

### Interview Pattern (for larger features):
```
I want to build [brief description]. Interview me in detail using
the AskUserQuestion tool. Ask about technical implementation, UI/UX,
edge cases, concerns, and tradeoffs. Keep interviewing until we've
covered everything, then write a complete spec to SPEC.md.
```
Then start a fresh session to execute the spec.

## Code Review Workflow

### Writer/Reviewer Pattern:
Use two separate sessions. Session B reviews with fresh context (no bias toward code it wrote).

### Parallel Review with Agent Teams:
```
Create an agent team to review PR #142. Spawn three reviewers:
- Security implications
- Performance impact
- Test coverage
Have them each review and report findings.
```

### CLI Review:
```bash
gh pr diff "$PR_NUMBER" | claude -p \
  --append-system-prompt "You are a security engineer. Review for vulnerabilities." \
  --output-format json
```

## Refactoring Workflow

### Large-Scale Migration:
1. Generate task list: `list all Python files needing migration`
2. Test on a few files first
3. Fan out:
   ```bash
   for file in $(cat files.txt); do
     claude -p "Migrate $file from React to Vue." \
       --allowedTools "Edit,Bash(git commit *)"
   done
   ```

### Targeted Refactoring:
```
Look at how existing widgets are implemented on the home page.
HotDogWidget.php is a good example. Follow the pattern to implement
a new calendar widget.
```

## Documentation Generation

Use skills for repeatable documentation tasks:
```yaml
---
name: document-api
description: Generate API documentation
context: fork
agent: Explore
---
Document the API endpoints in $ARGUMENTS:
1. Find all route handlers
2. Extract request/response schemas
3. Generate markdown documentation
4. Include example requests
```

## Automation Patterns

### CI/CD Integration:
```bash
# Create commit from staged changes
claude -p "Look at my staged changes and create an appropriate commit" \
  --allowedTools "Bash(git diff *),Bash(git log *),Bash(git status *),Bash(git commit *)"

# Automated code review in CI
gh pr diff "$PR_NUM" | claude --bare -p "Review this PR for issues" --output-format json

# Automated translations
claude -p "translate new strings into French and raise a PR for review"
```

### Scheduled Routines:
- **Routines** (Anthropic infrastructure): run even when computer off
- **Desktop scheduled tasks**: local machine, access to local files
- **`/loop`**: repeat prompt within CLI session

Use cases: morning PR reviews, overnight CI failure analysis, weekly dependency audits, doc syncing after PR merges.

### Package.json Script:
```json
{
  "scripts": {
    "lint:claude": "git diff main | claude -p \"report typos: filename:line and issue\""
  }
}
```

## Common Failure Patterns to Avoid

1. **Kitchen sink session** -- mixing unrelated tasks. Fix: `/clear` between tasks.
2. **Correcting over and over** -- context polluted with failed approaches. Fix: after 2 failed corrections, `/clear` and write better initial prompt.
3. **Over-specified CLAUDE.md** -- too long, instructions get lost. Fix: ruthlessly prune.
4. **Trust-then-verify gap** -- plausible code that misses edge cases. Fix: always provide verification.
5. **Infinite exploration** -- unscoped investigation fills context. Fix: scope narrowly or use subagents.

## Developing Intuition

- When Claude produces great output, notice what you did: prompt structure, context provided, mode
- When Claude struggles, ask why: context too noisy? prompt too vague? task too big?
- Sometimes vague prompts are right for exploration
- Sometimes accumulated context is valuable for deep single-problem sessions
- Plan mode adds overhead -- skip it for small, clear tasks

---

# QUICK REFERENCE

## Most Important Commands
| Action | Command |
|--------|---------|
| Start Claude Code | `claude` |
| Initialize project | `/init` |
| Clear context | `/clear` |
| Compact history | `/compact [instructions]` |
| Check costs | `/usage` |
| Switch model | `/model` |
| Check permissions | `/permissions` |
| View memory | `/memory` |
| View context usage | `/context` |
| Resume session | `claude --continue` or `claude --resume` |
| Non-interactive | `claude -p "prompt"` |
| Worktree session | `claude --worktree feature-name` |
| Plan mode toggle | Shift+Tab |
| Stop mid-action | Esc |
| Rewind | Esc+Esc or `/rewind` |
| Side question | `/btw question` |

## Key Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Shift+Tab | Cycle permission modes (default -> acceptEdits -> plan) |
| Esc | Stop Claude mid-action |
| Esc+Esc | Open rewind menu |
| Ctrl+G | Open plan in text editor |
| Shift+Down | Cycle through agent team teammates |
| Ctrl+T | Toggle task list (agent teams) |

---

# SOURCES

- [Claude Code Overview - Official Docs](https://code.claude.com/docs/en/overview)
- [Best Practices for Claude Code](https://code.claude.com/docs/en/best-practices)
- [Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Agent Teams](https://code.claude.com/docs/en/agent-teams)
- [Memory System (CLAUDE.md)](https://code.claude.com/docs/en/memory)
- [Cost Management](https://code.claude.com/docs/en/costs)
- [MCP Integration](https://code.claude.com/docs/en/mcp)
- [Worktrees](https://code.claude.com/docs/en/worktrees)
- [Headless/Programmatic Mode](https://code.claude.com/docs/en/headless)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [Skills](https://code.claude.com/docs/en/skills)
- [Permission Modes](https://code.claude.com/docs/en/permission-modes)
- [Environment Variables](https://code.claude.com/docs/en/env-vars)
- [Settings Reference](https://code.claude.com/docs/en/settings)
- [Writing a Good CLAUDE.md - HumanLayer](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [How to Write a Good CLAUDE.md - Builder.io](https://www.builder.io/blog/claude-md-guide)
- [CLAUDE.md Best Practices - UX Planet](https://uxplanet.org/claude-md-best-practices-1ef4f861ce7c)
- [Creating the Perfect CLAUDE.md - Dometrain](https://dometrain.com/blog/creating-the-perfect-claudemd-for-claude-code/)
- [Using CLAUDE.MD Files - Claude Blog](https://claude.com/blog/using-claude-md-files)
- [Claude Code Agent Teams Playbook - Developers Digest](https://www.developersdigest.tech/blog/claude-code-agent-teams-subagents-2026)
- [Claude Code Agent Teams Deep Dive - MindStudio](https://www.mindstudio.ai/blog/claude-code-agent-teams-parallel-shared-task-list)
- [Claude Code Worktrees Guide - Claude Directory](https://www.claudedirectory.org/blog/claude-code-worktrees-guide)
- [Claude Code Hooks Guide - DataCamp](https://www.datacamp.com/tutorial/claude-code-hooks)
- [Claude Code Hooks Examples - Steve Kinney](https://stevekinney.com/courses/ai-development/claude-code-hook-examples)
- [Claude Code MCP Setup - Nimbalyst](https://nimbalyst.com/blog/claude-code-mcp-setup/)
- [Claude Code MCP Servers - Builder.io](https://www.builder.io/blog/claude-code-mcp-servers)
- [Token Optimization - KDnuggets](https://www.kdnuggets.com/7-practical-ways-to-reduce-claude-code-token-usage)
- [18 Token Management Hacks - MindStudio](https://www.mindstudio.ai/blog/claude-code-token-management-hacks)
- [Claude Code Auto Mode - Anthropic Engineering](https://www.anthropic.com/engineering/claude-code-auto-mode)
- [Agent Skills - Anthropic Engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Claude Code GitHub Repository](https://github.com/anthropics/claude-code)
- [Claude Code Product Page](https://www.anthropic.com/product/claude-code)
- [Claude Code Session Management - Claude Blog](https://claude.com/blog/using-claude-code-session-management-and-1m-context)
- [TDD with Claude Code - Steve Kinney](https://stevekinney.com/courses/ai-development/test-driven-development-with-claude)
- [Claude Code Best Practice Repository](https://github.com/shanraisshan/claude-code-best-practice)
