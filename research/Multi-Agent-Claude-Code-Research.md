# Multi-Agent Programming Patterns with Claude Code & Claude Agent SDK
## Comprehensive Deep Research (May 2026)

---

## Table of Contents
1. [Claude Code Built-in Multi-Agent](#1-claude-code-built-in-multi-agent)
2. [Claude Agent SDK](#2-claude-agent-sdk)
3. [Multi-Agent Architecture Patterns](#3-multi-agent-architecture-patterns)
4. [Practical Multi-Agent Setups](#4-practical-multi-agent-setups)
5. [Claude Code for Large Projects](#5-claude-code-for-large-projects)
6. [Automation with Claude Code](#6-automation-with-claude-code)
7. [Community Tips & Patterns](#7-community-tips--patterns)
8. [Sources & Links](#8-sources--links)

---

## 1. Claude Code Built-in Multi-Agent

### 1.1 The Agent Tool (formerly Task Tool)

The **Agent tool** is Claude Code's delegation mechanism. A parent agent analyzes a task, decides whether to handle it directly or delegate, and uses the Agent tool to spin up a **subagent** with a prompt string. Both names ("Agent" and "Task") still work.

**How it works:**
- Each subagent runs in its own **isolated 200K-token context window**
- The subagent does its work (reads files, runs searches, makes tool calls)
- Returns **only its final output** to the parent
- All intermediate noise stays inside the subagent's context, never touching the parent's conversation
- **Subagents cannot spawn other subagents** (no infinite nesting)

**Key benefit:** Context preservation. Without subagents, research floods the parent's context with file contents, logs, and search results that won't be referenced again.

### 1.2 Subagent Types

Claude Code includes several **built-in subagent types**:

| Type | Purpose | Tools | Use Case |
|------|---------|-------|----------|
| **Explore** | Fast, read-only codebase analysis | Read, Grep, Glob | Searching and understanding code without modifications |
| **Plan** | Research for plan mode | Read-only tools | When in plan mode and Claude needs codebase understanding |
| **general-purpose** | Complex multi-step tasks | Both exploration and action tools | Tasks requiring exploration + modification, complex reasoning, multiple dependent steps |

### 1.3 Custom Subagents

Custom subagents are defined as **Markdown files with YAML frontmatter**, stored in:
- **Project scope:** `.claude/agents/`
- **User scope:** `~/.claude/agents/`

Example definition:
```yaml
---
name: code-reviewer
description: Expert code review specialist. Use immediately after modifying code.
tools: Read, Grep, Glob
model: sonnet
permissionMode: default
---
You are a code review specialist. Analyze code for bugs, security issues,
and style violations. Return a structured report.
```

**YAML frontmatter fields:**
- `name` - Agent identifier
- `description` - When Claude should use this agent (critical for auto-delegation)
- `tools` - Allowlist of tools the subagent can access
- `model` - Which model to use (sonnet, haiku, opus)
- `permissionMode` - Permission level (default, acceptEdits, etc.)
- `background` - Whether to run in background (true/false)

Create agents via the **/agents** slash command or manually create the Markdown files.

### 1.4 Background vs Foreground Agents

**Foreground subagents:** Block the main conversation until complete. Results return inline.

**Background agents:** Run in a panel below your prompt while you keep working. When they finish, their result arrives as a message in your main conversation.

- Set `background: true` in the frontmatter
- Or press **Ctrl+B** while an agent is running to detach it
- Multiple background agents run concurrently with pre-approved permissions
- You get notified when they finish
- Best for research/analysis tasks that aren't blocking your current work

### 1.5 Agent Teams (Experimental)

Agent Teams is a more advanced multi-agent system where **multiple Claude Code instances work together as a team**. Requires Claude Code v2.1.32+.

**Enable:** Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` to `1` in settings.json or environment.

**Architecture:**
| Component | Role |
|-----------|------|
| **Team Lead** | The main session that creates the team, spawns teammates, coordinates work |
| **Teammates** | Separate Claude Code instances working on assigned tasks |
| **Task List** | Shared list of work items at `~/.claude/tasks/{team-name}/` |
| **Mailbox** | Messaging system for inter-agent communication |

**Key differences from subagents:**

| Feature | Subagents | Agent Teams |
|---------|-----------|-------------|
| Context | Own window; results return to caller | Own window; fully independent |
| Communication | Report results back to main agent only | Teammates message each other directly |
| Coordination | Main agent manages all work | Shared task list with self-coordination |
| Best for | Focused tasks where only the result matters | Complex work requiring discussion/collaboration |
| Token cost | Lower (results summarized) | Higher (each teammate is separate instance) |

**Display modes:**
- **In-process:** All teammates run in your main terminal. Use Shift+Down to cycle.
- **Split panes:** Each teammate gets its own pane (requires tmux or iTerm2).

**Task management:**
- Tasks have three states: pending, in progress, completed
- Tasks can have dependencies (blocked until dependencies complete)
- Task claiming uses file locking to prevent race conditions
- 5-6 tasks per teammate is the recommended ratio
- Recommended team size: 3-5 teammates

**Quality gates via hooks:**
- `TeammateIdle` - runs when a teammate is about to go idle
- `TaskCreated` - runs when a task is being created
- `TaskCompleted` - runs when a task is being marked complete
- Exit with code 2 to send feedback and keep the agent working

**Plan approval for teammates:**
You can require teammates to plan before implementing. The teammate works in read-only plan mode until the lead approves. The lead reviews and either approves or rejects with feedback.

### 1.6 SendMessage Tool

Part of Agent Teams. Enables direct **peer-to-peer messaging** between teammates. Any teammate can message any other teammate by name, or broadcast to the entire team.

**Important caveat:** There is a known issue (GitHub issue #47021) where SendMessage is referenced in documentation but may not be available at runtime in all configurations. Team coordination tools (SendMessage, task management) are always available to teammates even when the `tools` field restricts other tools.

### 1.7 When to Use Subagents vs Direct Work

**Use subagents when:**
- Independent research threads that don't depend on each other's results
- Repetitive structured tasks (analyzing multiple files, summarizing multiple documents)
- Deep dives that would bloat context (only the conclusion matters, not working steps)
- Research that would flood context with file contents you won't reference again

**Use direct work when:**
- Simple tasks that Claude can handle in one pass
- Sequential tasks where each step depends on the previous
- Tasks that require the full conversation history

**Use agent teams when:**
- Teammates need to share findings and challenge each other
- Complex work requiring discussion and collaboration (competing hypotheses)
- Cross-layer coordination (frontend + backend + tests)
- Research and review where multiple perspectives add value

### 1.8 Parallel Agent Execution Patterns

Claude Code can run **up to 10 sub-agents simultaneously** as a practical ceiling. Beyond that, coordination overhead negates speed benefits.

**Parallel execution rules:**
- Spawn parallel sub-agents using multiple Agent tool calls in a single message
- Each agent reads different files or analyzes different concerns
- When all agents return, the central thread synthesizes
- **Critical requirement:** Agents must touch different files to avoid merge conflicts

---

## 2. Claude Agent SDK

### 2.1 What Is It?

The **Claude Agent SDK** (formerly Claude Code SDK, renamed September 2025) is Anthropic's official Python and TypeScript library that provides the same agent loop, tools, and context management that power Claude Code, exposed as a programmable library.

**GitHub repositories:**
- Python: https://github.com/anthropics/claude-agent-sdk-python
- TypeScript: https://github.com/anthropics/claude-agent-sdk-typescript
- Demos: https://github.com/anthropics/claude-agent-sdk-demos

### 2.2 Installation

```bash
# Python (3.10+)
pip install claude-agent-sdk

# TypeScript
npm install @anthropic-ai/claude-agent-sdk
```

The TypeScript SDK bundles a native Claude Code binary -- no separate Claude Code installation required.

**Authentication:**
```bash
export ANTHROPIC_API_KEY=your-api-key
```
Also supports: Amazon Bedrock (`CLAUDE_CODE_USE_BEDROCK=1`), Google Vertex AI (`CLAUDE_CODE_USE_VERTEX=1`), Microsoft Azure (`CLAUDE_CODE_USE_FOUNDRY=1`).

### 2.3 Two Main APIs

**1. `query()` function** -- Stateless, streaming async iterator:
```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Find and fix the bug in auth.py",
        options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"]),
    ):
        print(message)

asyncio.run(main())
```

**2. `ClaudeSDKClient`** -- Bidirectional, interactive conversations with support for custom tools and hooks defined as Python functions.

### 2.4 Built-in Tools

| Tool | What it does |
|------|-------------|
| **Read** | Read any file in the working directory |
| **Write** | Create new files |
| **Edit** | Make precise edits to existing files |
| **Bash** | Run terminal commands, scripts, git operations |
| **Monitor** | Watch a background script and react to each output line |
| **Glob** | Find files by pattern (`**/*.ts`, `src/**/*.py`) |
| **Grep** | Search file contents with regex |
| **WebSearch** | Search the web for current information |
| **WebFetch** | Fetch and parse web page content |
| **AskUserQuestion** | Ask the user clarifying questions |
| **Agent** | Spawn subagents for delegation |

### 2.5 Custom Tools via MCP Servers

The Model Context Protocol (MCP) connects agents to external tools and data sources:

```python
async for message in query(
    prompt="Open example.com and describe what you see",
    options=ClaudeAgentOptions(
        mcp_servers={
            "playwright": {"command": "npx", "args": ["@playwright/mcp@latest"]}
        }
    ),
):
    if hasattr(message, "result"):
        print(message.result)
```

MCP tools are named `mcp__<server>__<action>` (e.g., `mcp__playwright__browser_screenshot`).

MCP servers can run as:
- Local processes
- HTTP connections
- In-process (directly within your SDK application, eliminating separate processes)

### 2.6 Hooks Integration

Hooks are Python/TypeScript functions invoked at specific points of the agent loop:

| Hook | When it fires | Use case |
|------|---------------|----------|
| **PreToolUse** | Before a tool executes | Allow, deny, or modify the input |
| **PostToolUse** | After a tool returns | Logging, injecting context |
| **PostToolUseFailure** | When a tool execution fails | Error handling |
| **UserPromptSubmit** | When the user submits a prompt | Input validation |
| **Stop** | When the agent finishes | Cleanup |
| **SessionStart** | When session begins | Initialization |
| **SessionEnd** | When session ends | Final cleanup |

Example -- logging all file changes to audit:
```python
async def log_file_change(input_data, tool_use_id, context):
    file_path = input_data.get("tool_input", {}).get("file_path", "unknown")
    with open("./audit.log", "a") as f:
        f.write(f"{datetime.now()}: modified {file_path}\n")
    return {}

async for message in query(
    prompt="Refactor utils.py to improve readability",
    options=ClaudeAgentOptions(
        permission_mode="acceptEdits",
        hooks={
            "PostToolUse": [
                HookMatcher(matcher="Edit|Write", hooks=[log_file_change])
            ]
        },
    ),
):
    ...
```

### 2.7 Subagents in the SDK

Define custom agents programmatically:
```python
async for message in query(
    prompt="Use the code-reviewer agent to review this codebase",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Glob", "Grep", "Agent"],
        agents={
            "code-reviewer": AgentDefinition(
                description="Expert code reviewer for quality and security reviews.",
                prompt="Analyze code quality and suggest improvements.",
                tools=["Read", "Glob", "Grep"],
            )
        },
    ),
):
    ...
```

Messages from within a subagent include a `parent_tool_use_id` field for tracking.

### 2.8 Session Management

Maintain context across multiple exchanges by capturing and resuming session IDs:
```python
session_id = None

# First query: capture the session ID
async for message in query(
    prompt="Read the authentication module",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Glob"]),
):
    if isinstance(message, SystemMessage) and message.subtype == "init":
        session_id = message.data["session_id"]

# Resume with full context from the first query
async for message in query(
    prompt="Now find all places that call it",
    options=ClaudeAgentOptions(resume=session_id),
):
    ...
```

### 2.9 Additional Features

- **Structured output:** Agents can return validated JSON matching a schema
- **File checkpointing:** Revert file changes to a specific checkpoint
- **Plugins:** Extend with custom commands, agents, and MCP servers
- **Skills:** Specialized capabilities defined in Markdown (`.claude/skills/*/SKILL.md`)
- **Slash commands:** Custom commands (`.claude/commands/*.md`)
- **Memory:** Project context via `CLAUDE.md`

### 2.10 Agent SDK vs Other Claude Tools

| Use case | Best choice |
|----------|-------------|
| Interactive development | CLI |
| CI/CD pipelines | SDK |
| Custom applications | SDK |
| One-off tasks | CLI |
| Production automation | SDK |

**Agent SDK vs Managed Agents:**
- Agent SDK runs in your process/infrastructure
- Managed Agents runs on Anthropic-hosted infrastructure (REST API)
- Common path: prototype with Agent SDK locally, move to Managed Agents for production

### 2.11 Claude Managed Agents (Cloud-Hosted)

Currently in beta. Key features:
- Stateful sessions with persistent file systems
- Multiagent sessions: up to **20 unique agents** in `multiagent.agents`, each in its own session thread
- **Dreaming** (May 2026): Scheduled background process that reviews past sessions, extracts patterns, curates memory stores
- **Outcomes** (public beta): Track agent performance
- **Webhooks** for event notifications
- Environments define container configuration; multiple sessions share the same environment

---

## 3. Multi-Agent Architecture Patterns with Claude Code

### 3.1 The Supervisor/Orchestrator Pattern

A central AI thread coordinates specialist agents without writing code itself. It plans, delegates, reviews, and routes.

**How it works:**
1. Orchestrator reads requirements, creates a plan
2. Dispatches specialists via Agent tool
3. Reviews outputs, decides next steps
4. Routes corrections back to specialists

**Best for:** Multi-domain features requiring frontend + backend + database coordination.
**Not ideal for:** Simple tasks a single agent handles in one pass.

### 3.2 The Pipeline Pattern

Each agent's output feeds directly into the next. Ideal for strictly ordered workflows.

**Example flow:** Code generation -> Review -> Testing -> Deployment

**Implementation:** Sequential Agent tool calls where each receives the output of the previous.

### 3.3 The Fan-Out / Fan-In Pattern

Multiple agents work in parallel on independent inputs. Central thread synthesizes results.

**How it works in Claude Code:**
1. Spawn parallel sub-agents using multiple Agent tool calls in a single message
2. Each agent reads different files or analyzes a different concern
3. When all agents return, the orchestrator synthesizes
4. The fan-in phase creates value by spotting connections between findings

**Example:** Auth issue + missing input validation = critical vulnerability that neither finding alone suggests.

**Critical rule:** Agents must NOT modify overlapping files -- parallel writes cause merge conflicts.

### 3.4 The Specialist Routing Pattern

Tasks route to domain-expert agents based on type. Frontend tasks go to frontend specialists; database work to database experts. Each specialist carries domain-specific instructions and tool restrictions.

**Scales well:** New domains just need new agents and routing rules.

### 3.5 The Validation Chain / Producer-Reviewer Pattern

A builder agent creates code; a separate validator checks it without modifying. If issues arise, a fix task routes back to builders. Cycles narrow until output is correct.

**Why it works:** The validator starts with fresh eyes, avoiding builder assumptions.
**Best for:** Production code changes, security-sensitive work, high-cost error scenarios.

### 3.6 The Progressive Refinement Pattern

Sequential agents improve output through focused passes -- draft creation, security review, performance optimization, final validation. Each phase addresses one quality dimension.

### 3.7 The Watchdog Pattern

Background agents monitor specific conditions and alert when triggered without blocking primary work. Implements context recovery hooks at the infrastructure level.

### 3.8 Competing Hypotheses (Agent Teams)

Multiple teammates investigate different theories in parallel and actively try to disprove each other, like a scientific debate. The theory that survives is most likely the actual root cause.

**Example prompt:**
```
Users report the app exits after one message. Spawn 5 agent teammates to
investigate different hypotheses. Have them talk to each other to try to
disprove each other's theories. Update the findings doc with consensus.
```

### 3.9 Combining Patterns

Real projects combine patterns. A typical complex feature uses:
1. Orchestrator planning
2. Specialist routing
3. Parallel fan-out execution
4. Validation chains
5. Progressive refinement
6. Watchdog monitoring throughout

### 3.10 Harness -- Meta-Skill for Agent Team Architecture

**Harness** (https://github.com/revfactory/harness) is a meta-skill that auto-generates domain-specific agent teams. You say "build a harness for this project" and it generates agent definitions and skills tailored to your domain.

**Six supported patterns:** Pipeline, Fan-out/Fan-in, Expert Pool, Producer-Reviewer, Supervisor, Hierarchical Delegation.

### 3.11 The C Compiler Case Study

Anthropic's landmark experiment: **16 parallel Claude instances** (Opus 4.6) built a 100,000-line Rust-based C compiler from scratch in two weeks.

**Stats:**
- ~2,000 Claude Code sessions
- $20,000 in API costs
- 2 billion input tokens, 140 million output tokens

**Coordination mechanism:**
- Bare git repository as central coordination point
- Docker containers per agent with shared repo
- **Lock-based task claiming:** Agents write text files to `current_tasks/`. Git synchronization prevents duplicate claims.
- When finished: merge others' changes, push branch, remove lock

**Results:**
- Compiles Linux 6.9 on x86, ARM, RISC-V
- Builds QEMU, FFmpeg, SQLite, PostgreSQL, Redis, Doom
- 99% pass rate on GCC torture test suites

**Key lesson:** "Test design is critical -- the task verifier must be nearly perfect, otherwise Claude will solve the wrong problem."

---

## 4. Practical Multi-Agent Setups

### 4.1 Running Claude Code in Multiple Terminals

The simplest multi-agent setup: open multiple terminal tabs, each running a separate Claude Code instance on different tasks.

**Key approaches:**
- Each terminal works on a different feature branch
- Use git worktrees so each instance has its own working directory
- Or use agent teams for automated coordination

### 4.2 tmux for Multiple Sessions

tmux is the power-user standard for multi-agent Claude Code:

**Basic setup:**
```bash
# Create a new tmux session
tmux new -s project

# Split into panes
Ctrl+B %     # vertical split
Ctrl+B "     # horizontal split

# Navigate between panes
Ctrl+B arrow-key
```

**Pattern:** One terminal tab per project, one tmux session per tab, with windows for Claude instances, terminal, and dev server.

**Benefits:**
- See multiple Claude Code sessions on screen simultaneously
- Sessions persist in background (survive terminal close)
- Agent teams natively support tmux split panes
- You can see everyone's output at once and click into a pane to interact

**For Agent Teams:** Set `teammateMode: "tmux"` in settings.json for automatic split-pane management.

### 4.3 Git Worktrees for Parallel Development

Worktrees turn Claude Code into a parallel development environment.

**How it works:**
```bash
# Create a worktree for a feature
claude --worktree feature-auth

# This creates:
# - A new branch
# - A separate working directory
# - An isolated Claude Code session scoped to that directory
```

**The `-w` (or `--worktree`) flag:**
1. Creates a new git worktree
2. Creates a new branch
3. Checks it out into a separate directory
4. Scopes the entire session to that directory

**Practical workflow:**
- Agent A rewrites `src/auth.ts` while Agent B rewrites the same file with a different approach
- Review both branches and pick the winner or merge them
- As of mid-2026, teams run **4-8 concurrent worktrees per developer** reliably
- Beyond 8 is usually bottlenecked on review, not on Claude

**Limitation:** Isolated by design -- parallel worktrees won't help if you need Claude to see changes from another active session.

### 4.4 Shared Context via Files

**CLAUDE.md hierarchy:**
- Root `CLAUDE.md` -- project-wide context (tech stack, conventions, commands)
- Subfolder `CLAUDE.md` files -- domain-specific context (`/frontend/CLAUDE.md`, `/backend/CLAUDE.md`)
- User-level `~/.claude/CLAUDE.md` -- personal preferences

**For Agent Teams:** All teammates automatically load CLAUDE.md. Use this to provide project-specific guidance to all teammates.

**Shared findings documents:** Agents can write to shared markdown files that other agents read for coordination.

### 4.5 Avoiding Merge Conflicts Between Agents

**Rules:**
1. Break work so each agent/teammate owns a **different set of files**
2. Never have two agents editing the same file simultaneously
3. Use clear file boundaries: frontend agent touches `src/components/`, backend agent touches `src/api/`
4. For Agent Teams: the shared task list with claiming prevents duplicate work
5. For worktrees: each branch is fully isolated, merge at the end

### 4.6 Task Distribution Strategies

**By domain:** Frontend, backend, database, tests -- each agent gets a domain
**By feature:** Each agent implements a complete, independent feature
**By concern:** Security review, performance audit, test coverage -- each agent checks one dimension
**By file set:** Divide the codebase into non-overlapping file sets

**Recommended:** 5-6 tasks per teammate/agent for optimal productivity without excessive context switching.

---

## 5. Claude Code for Large Projects

### 5.1 Context Window Management

The **most important resource to manage** in Claude Code is the context window. Performance degrades as it fills.

**Key strategies:**
- **Subagents** run in separate 200K-token context windows, returning only summaries
- **`/compact` command** summarizes and compresses conversation history
- Session Memory writes summaries continuously in the background (since ~v2.0.64), making /compact instant
- Isolate complex work to the first 80% of a session; save the tail for lightweight tasks
- Run /compact after completing any distinct phase of work

### 5.2 CLAUDE.md Strategy for Large Codebases

- Keep root CLAUDE.md **under 200 lines**
- Include: tech stack, repo map, standard commands, test strategy, style/lint rules, branch etiquette, "do not touch" zones, security notes
- Add subfolder CLAUDE.md files for focused context (`/frontend/CLAUDE.md`, `/backend/CLAUDE.md`)
- Claude's system prompt uses ~50 of the ~150-200 effective instruction slots, leaving ~100 for your rules

### 5.3 Graphify for Codebase Knowledge Graphs

**Graphify** (https://github.com/safishamsi/graphify) turns entire repositories into queryable knowledge graphs.

**How it works:**
- Combines Tree-sitter static analysis with LLM-driven semantic extraction
- Maps code, docs, PDFs, images, videos into a knowledge graph
- Nodes = concepts (classes, functions, design decisions)
- Edges = relationships (calls, imports, rationale_for, semantically_similar_to)
- A `PreToolUse` hook fires before every Glob and Grep call

**Integration with Claude Code:**
- Type `/graphify` in Claude Code
- Claude navigates by structure (god nodes, communities, surprising connections) instead of grepping every file
- **Important:** Use `subagent_type='general-purpose'` for graphify extraction dispatch. Do NOT use Explore (it's read-only and cannot write chunk files)

**Token savings:** Up to **70x cost reduction** on large codebases (500+ files) because Claude follows graph edges to relevant subgraphs instead of loading everything.

**Related tools:**
- **CodeGraph** (https://github.com/colbymchenry/codegraph) -- Pre-indexed code knowledge graph, fewer tokens, 100% local
- **code-review-graph** (https://github.com/tirth8205/code-review-graph) -- 6.8x fewer tokens on reviews, 49x on daily tasks
- **Understand-Anything** (https://github.com/Lum1104/Understand-Anything) -- Interactive knowledge graph exploration

### 5.4 Using Explore Subagent for Navigation

The built-in **Explore** subagent is fast and read-only, optimized for searching and analyzing codebases. Claude auto-delegates to it when it needs to understand code without making changes.

**Best practices:**
- Let Claude use Explore for initial codebase understanding
- Don't use Explore for tasks that need to write files
- Combine with Graphify for maximum navigation efficiency

### 5.5 Chunking Large Tasks

**Batch size:** 5-20 files per batch, where each batch is a logical subset that compiles and tests independently.

**Progressive development pattern:**
1. Force Claude to think/plan before writing code
2. Implement in small batches
3. Run tests after each batch
4. Enable checkpoints and verify rollback
5. Use Git as safety net on top of Claude's checkpoints

### 5.6 Memory Management for Long Sessions

**Two complementary memory systems:**
1. **CLAUDE.md files** -- Persistent instructions loaded at every session start
2. **Auto memory** -- Claude accumulates knowledge across sessions automatically (build commands, debugging insights, architecture notes, preferences)

**Session Memory (2026):**
- Writes summaries continuously in the background
- Makes `/compact` instant by loading pre-written summaries into a fresh context window
- Available on first-party Anthropic API (Claude Pro/Max subscribers)
- Not available on Bedrock, Vertex, or Foundry

**ClaudeMem plugin** (https://github.com/thedotmack/claude-mem): Automatically captures everything Claude does during sessions, compresses it with AI, and injects relevant context back into future sessions.

### 5.7 File Exclusions

Use the **claudeignore** npm package to exclude:
- Build artifacts
- Dependencies (node_modules)
- Large data files
- Generated code
- Secrets

---

## 6. Automation with Claude Code

### 6.1 Claude Code GitHub Actions

**Official action:** `anthropics/claude-code-action@v1` (built on Claude Agent SDK)

**Two operating modes:**

1. **Interactive mode:** Claude listens for `@claude` mentions in PR comments, issues, and review threads, then executes requests
2. **Automation mode:** Claude gets a prompt parameter in YAML and runs headlessly on every matching event

**Basic workflow:**
```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

**Auto-review on every PR:**
```yaml
name: Code Review
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Review this pull request for code quality, correctness, and security."
          claude_args: "--max-turns 5"
```

**Scheduled tasks:**
```yaml
name: Daily Report
on:
  schedule:
    - cron: "0 9 * * *"
jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Generate a summary of yesterday's commits and open issues"
          claude_args: "--model opus"
```

**Supports:** Direct Anthropic API, Amazon Bedrock, Google Vertex AI.

**Setup:** Run `/install-github-app` in Claude Code terminal for quick setup.

### 6.2 Headless Mode for CI/CD

The `-p` flag runs Claude Code without a terminal session:
```bash
claude -p "Fix all lint errors in src/" --output-format json
```

- Runs the full agent loop (thinking, tool calls, edits) then exits
- Outputs structured JSON
- Works in any CI system: GitHub Actions, GitLab CI, Jenkins, custom scripts

### 6.3 Automated Code Review

**Pre-commit hook integration:**
- Claude scans staged diffs for critical bugs and security vulnerabilities
- Identifies thread-safety risks and unhandled edge cases that standard linters miss
- The hooks system intercepts every git commit, runs ESLint/Prettier first, blocks if linting fails

**Cost optimization:** Routing through flat-rate proxy can reduce cost of 20+ daily commits.

**Model selection for CI:**
- **Claude Sonnet** -- default for routine CI fixes (~60% less than Opus)
- **Claude Opus** -- reserved for complex reasoning across large codebases

### 6.4 Claude Code Hooks System

Hooks are shell commands that execute at specific lifecycle points:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": ["./scripts/validate-bash-command.sh"]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": ["./scripts/run-linter.sh"]
      }
    ]
  }
}
```

**For Agent Teams:**
- `TeammateIdle` -- enforce work continuation
- `TaskCreated` -- validate task creation
- `TaskCompleted` -- enforce quality checks before marking complete

### 6.5 Pre-Commit Hooks with Claude Code

Using the Claude Agent SDK for **agentic validation** beyond simple linting:
```bash
# In .git/hooks/pre-commit
claude -p "Review the staged diff for critical bugs, security vulnerabilities,
and logic errors. Return PASS or FAIL with explanation." --output-format json
```

### 6.6 Security Considerations

- **Prompt injection risk:** Malicious PR descriptions can contain adversarial instructions. Treat all PR-sourced text as data, not instructions.
- **Cost control:** Cap review workflows at 20K tokens per PR. Set `--max-turns` to limit iterations.
- **Never commit API keys** to repositories. Always use GitHub Secrets.
- **Limit action permissions** to only what's necessary.

---

## 7. Community Tips & Patterns

### 7.1 Top Community Tips

**From Reddit r/ClaudeAI and community:**
- Short, focused sessions beat long marathons
- Commit a checkpoint before starting autonomous work; rollback instead of fixing forward if wrong
- Only ask for the first step; if you say "implement the whole feature," Claude will go off the rails
- Use plan mode for anything complex to catch wrong assumptions before implementation
- The `/context` command prevents context bloat on large codebases
- Power users run multiple Claude Code instances in tmux panes, each handling a different module
- The most upvoted tips are about **workflow architecture**, not prompting

**From builder.io (50 Claude Code Tips):**
- https://www.builder.io/blog/claude-code-tips-best-practices

**From ykdojo (45 tips):**
- https://github.com/ykdojo/claude-code-tips
- Includes a custom status line script, cutting the system prompt in half, using Gemini CLI as Claude Code's minion

**From marmelab (Tips I Wish I'd Had):**
- https://marmelab.com/blog/2026/04/24/claude-code-tips-i-wish-id-had-from-day-one.html

### 7.2 Blog Posts & Articles

- **Simon Willison -- "Embracing the parallel coding agent lifestyle"** (Oct 2025): Describes running multiple coding agents in parallel, doing research and proof-of-concept work simultaneously. https://simonwillison.net/2025/Oct/5/parallel-coding-agents/
- **The Pragmatic Engineer -- "Programming by kicking off parallel AI agents"**: https://blog.pragmaticengineer.com/new-trend-programming-by-kicking-off-parallel-ai-agents/
- **Addy Osmani -- "The Code Agent Orchestra"**: What makes multi-agent coding work. https://addyosmani.com/blog/code-agent-orchestra/
- **Anthropic Engineering -- C Compiler Case Study**: https://www.anthropic.com/engineering/building-c-compiler
- **Claude Code Best Practices from Real Projects**: https://ranthebuilder.cloud/blog/claude-code-best-practices-lessons-from-real-projects/

### 7.3 YouTube Tutorials

- **"Mastering Claude Code in 30 minutes"**: https://www.youtube.com/watch?v=6eBSHbLKuN0
- **"FULL Claude Code Tutorial for Beginners in 2026"**: https://www.youtube.com/watch?v=qYqIhX9hTQk
- **Claude Code Tutorial Playlist (Net Ninja)**: https://www.youtube.com/playlist?list=PL4cUxeGkcC9g4YJeBqChhFJwKQ9TRiivY
- **Simon Willison -- "Engineering practices that make coding agents work" (Pragmatic Summit)**: https://www.youtube.com/watch?v=owmJyKVu5f8
- **Anthropic's official "Claude Code in Action" course** on their learning platform
- **Scrimba's "Vibe Coding with Claude Code"** (~1 hour, intermediate)

### 7.4 Open Source Projects & Tools

**Subagent Collections:**
- **awesome-claude-code-subagents** (131+ subagents across 10 categories): https://github.com/VoltAgent/awesome-claude-code-subagents
- Categories: Core Development, Language Specialists, Infrastructure, Quality & Security, Data & AI, Developer Experience, Specialized Domains, Business & Product, Meta & Orchestration, Research & Analysis

**Agent Architecture:**
- **Harness** -- Meta-skill for agent team architecture: https://github.com/revfactory/harness
- **claude-code-tools** (tmux tutorials): https://github.com/pchalasani/claude-code-tools

**Knowledge Graphs:**
- **Graphify** -- Codebase knowledge graph: https://github.com/safishamsi/graphify
- **CodeGraph** -- Pre-indexed local knowledge graph: https://github.com/colbymchenry/codegraph
- **Understand-Anything** -- Interactive knowledge graph: https://github.com/Lum1104/Understand-Anything

**Memory & Context:**
- **claude-code-memory-setup** -- Obsidian + Graphify integration (71.5x fewer tokens): https://github.com/lucasrosati/claude-code-memory-setup
- **ClaudeMem** -- Automatic session memory capture: https://github.com/thedotmack/claude-mem

**Community Projects:**
- **Claude Peers MCP** -- Lets multiple Claude Code sessions coordinate on the same machine
- **everything-claude-code** -- Complete agent collection including architect: https://github.com/affaan-m/everything-claude-code
- **claude-code-best-practice**: https://github.com/shanraisshan/claude-code-best-practice
- **claude-howto** -- Visual, example-driven guide: https://github.com/luongnv89/claude-howto
- **awesome-claude-plugins** -- Plugin adoption metrics: https://github.com/quemsah/awesome-claude-plugins

### 7.5 Key Community Insights

**On invocation quality (most overlooked failure point):**
- Bad: "Fix authentication"
- Good: "Fix OAuth redirect loop where successful login redirects to /login instead of /dashboard. Reference the auth middleware in src/lib/auth.ts."
- Context density determines success -- subagents need comprehensive context, explicit instructions, file references, and clear success criteria.

**On cost optimization:**
- Set `CLAUDE_CODE_SUBAGENT_MODEL` to route subagents to Sonnet while main session uses Opus
- Use Haiku for lightweight research subagents
- 4-8 concurrent worktrees per developer is the sweet spot

**On the arxiv paper:**
- "Dive into Claude Code: The Design Space of Today's and Future AI Agent Systems" (https://arxiv.org/html/2604.14228v1) -- Academic analysis of Claude Code's architecture

---

## 8. Sources & Links

### Official Documentation
- [Claude Code Docs -- Custom Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Docs -- Agent Teams](https://code.claude.com/docs/en/agent-teams)
- [Claude Code Docs -- Agent SDK Overview](https://code.claude.com/docs/en/agent-sdk/overview)
- [Claude Code Docs -- GitHub Actions](https://code.claude.com/docs/en/github-actions)
- [Claude Code Docs -- Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code Docs -- Common Workflows](https://code.claude.com/docs/en/common-workflows)
- [Claude Code Docs -- Memory](https://code.claude.com/docs/en/memory)
- [Claude Code Docs -- Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Claude API Docs -- Agent SDK MCP](https://platform.claude.com/docs/en/agent-sdk/mcp)
- [Claude API Docs -- Agent SDK Custom Tools](https://platform.claude.com/docs/en/agent-sdk/custom-tools)
- [Claude API Docs -- Agent SDK Hooks](https://platform.claude.com/docs/en/agent-sdk/hooks)
- [Claude API Docs -- Managed Agents Overview](https://platform.claude.com/docs/en/managed-agents/overview)
- [Claude API Docs -- Multiagent Sessions](https://platform.claude.com/docs/en/managed-agents/multi-agent)
- [Claude API Docs -- Agent SDK Subagents](https://platform.claude.com/docs/en/agent-sdk/subagents)
- [Claude API Docs -- Agent SDK Quickstart](https://platform.claude.com/docs/en/agent-sdk/quickstart)

### GitHub Repositories
- [claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python)
- [claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript)
- [claude-agent-sdk-demos](https://github.com/anthropics/claude-agent-sdk-demos)
- [claude-code-action (GitHub Action)](https://github.com/anthropics/claude-code-action)
- [awesome-claude-code-subagents (131+ subagents)](https://github.com/VoltAgent/awesome-claude-code-subagents)
- [Harness -- Agent Team Architect](https://github.com/revfactory/harness)
- [Graphify -- Codebase Knowledge Graph](https://github.com/safishamsi/graphify)
- [CodeGraph -- Local Knowledge Graph](https://github.com/colbymchenry/codegraph)
- [claude-code-memory-setup](https://github.com/lucasrosati/claude-code-memory-setup)
- [claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice)
- [claude-code-tips (45 tips)](https://github.com/ykdojo/claude-code-tips)
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- [claude-howto](https://github.com/luongnv89/claude-howto)

### Blog Posts & Articles
- [Anthropic -- Building a C Compiler with Parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)
- [Simon Willison -- Embracing the Parallel Coding Agent Lifestyle](https://simonwillison.net/2025/Oct/5/parallel-coding-agents/)
- [The Pragmatic Engineer -- Programming by Kicking Off Parallel AI Agents](https://blog.pragmaticengineer.com/new-trend-programming-by-kicking-off-parallel-ai-agents/)
- [Addy Osmani -- The Code Agent Orchestra](https://addyosmani.com/blog/code-agent-orchestra/)
- [MindStudio -- Claude Code Agent Teams Deep Dive](https://www.mindstudio.ai/blog/claude-code-agent-teams-parallel-shared-task-list)
- [MindStudio -- Split-and-Merge Pattern](https://www.mindstudio.ai/blog/what-is-claude-code-split-and-merge-pattern-sub-agents-parallel)
- [MindStudio -- Agent Teams Parallel Workflows](https://www.mindstudio.ai/blog/claude-code-agent-teams-parallel-workflows)
- [MindStudio -- Agentic Workflow Patterns](https://www.mindstudio.ai/blog/claude-code-agentic-workflow-patterns)
- [MindStudio -- Graphify Knowledge Graph](https://www.mindstudio.ai/blog/graphify-claude-code-knowledge-graph-large-codebase-70x)
- [ClaudeFast -- Sub-Agent Best Practices](https://claudefa.st/blog/guide/agents/sub-agent-best-practices)
- [ClaudeFast -- Agent Patterns](https://claudefa.st/blog/guide/agents/agent-patterns)
- [ClaudeFast -- Agent Teams Controls](https://claudefa.st/blog/guide/agents/agent-teams-controls)
- [ClaudeFast -- Worktree Guide](https://claudefa.st/blog/guide/development/worktree-guide)
- [Builder.io -- 50 Claude Code Tips](https://www.builder.io/blog/claude-code-tips-best-practices)
- [Builder.io -- How I Use Claude Code](https://www.builder.io/blog/claude-code)
- [Builder.io -- Claude Code Subagents Guide](https://www.builder.io/blog/claude-code-subagents)
- [Marmelab -- Claude Code Tips I Wish I'd Had From Day One](https://marmelab.com/blog/2026/04/24/claude-code-tips-i-wish-id-had-from-day-one.html)
- [Developers Digest -- Agent Teams, Subagents, and MCP: 2026 Playbook](https://www.developersdigest.tech/blog/claude-code-agent-teams-subagents-2026)
- [SSHH Blog -- How I Use Every Claude Code Feature](https://blog.sshh.io/p/how-i-use-every-claude-code-feature)
- [Sankalp's Blog -- Claude Code 2.0 Guide](https://sankalp.bearblog.dev/my-experience-with-claude-code-20-and-how-to-get-better-at-using-coding-agents/)
- [KSRed -- Claude Code Agents & Subagents: What They Unlock](https://www.ksred.com/claude-code-agents-and-subagents-what-they-actually-unlock/)
- [AlexOp.dev -- From Tasks to Swarms: Agent Teams](https://alexop.dev/posts/from-tasks-to-swarms-agent-teams-in-claude-code/)
- [PubNub -- Best Practices for Claude Code Subagents](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/)
- [CodeWithSeb -- Headless Mode CI/CD Playbook](https://www.codewithseb.com/blog/claude-code-headless-mode-cicd-automation-playbook)
- [SerpApi -- Build an AI Agent with Claude Agent SDK (Tutorial)](https://serpapi.com/blog/build-an-ai-agent-with-claude-agent-sdk/)
- [Morphllm -- Claude Agent SDK Python & TypeScript Guide](https://www.morphllm.com/claude-agent-sdk)
- [SitePoint -- Claude Code as Autonomous Agent: Advanced Workflows](https://www.sitepoint.com/claude-code-as-an-autonomous-agent-advanced-workflows-2026/)
- [Botmonster -- 5 Open Source Repos That Make Claude Code Unstoppable](https://botmonster.com/posts/5-open-source-repos-claude-code-unstoppable-march-2026/)
- [Arxiv -- Dive into Claude Code: The Design Space of AI Agent Systems](https://arxiv.org/html/2604.14228v1)
- [Medium -- Mastering Git Worktrees with Claude Code](https://medium.com/@dtunai/mastering-git-worktrees-with-claude-code-for-parallel-development-workflow-41dc91e645fe)
- [Medium -- Claude Code Subagents Complete Guide](https://medium.com/@sathishkraju/claude-code-subagents-the-complete-guide-to-ai-agent-delegation-d0a9aba419d0)
- [Medium -- Agent Delegation Patterns (Rick Hightower)](https://medium.com/@richardhightower/claude-code-subagents-and-main-agent-coordination-a-complete-guide-to-ai-agent-delegation-patterns-a4f88ae8f46c)

### Tutorials & Learning Platforms
- [Anthropic Skilljar -- Introduction to Subagents](https://anthropic.skilljar.com/introduction-to-subagents)
- [Claude Code Tutorial Playlist (YouTube)](https://www.youtube.com/playlist?list=PL4cUxeGkcC9g4YJeBqChhFJwKQ9TRiivY)
- [Mastering Claude Code in 30 Minutes (YouTube)](https://www.youtube.com/watch?v=6eBSHbLKuN0)
- [Steve Kinney -- Git Worktrees for Parallel AI Development](https://stevekinney.com/courses/ai-development/git-worktrees)
- [Steve Kinney -- Integrating with GitHub Actions](https://stevekinney.com/courses/ai-development/integrating-with-github-actions)
- [ClaudeLab -- Worktree Guide](https://claudelab.net/en/articles/claude-code/claude-code-worktree-guide)
- [ClaudeLab -- Parallel Development Mastery](https://claudelab.net/en/articles/claude-code/claude-code-parallel-development-mastery)
- [Claude Directory -- Worktrees Guide 2026](https://www.claudedirectory.org/blog/claude-code-worktrees-guide)
- [Promptfoo -- Claude Agent SDK Integration](https://www.promptfoo.dev/docs/providers/claude-agent-sdk/)
- [AI Workflow Lab -- Production Agents Guide](https://aiworkflowlab.dev/article/how-to-build-production-ai-agents-claude-agent-sdk-custom-tools-hooks-subagents)
- [Scrimba -- Best Claude Code Tutorials 2026](https://scrimba.com/articles/best-claude-code-tutorials-and-courses-in-2026/)

### Community & Discussion
- [Claude Code Reddit Discussion Summary (2026)](https://www.aitooldiscovery.com/guides/claude-code-reddit)
- [Hannah Stulberg -- 30 Claude Code Tips & Tricks (Substack)](https://hannahstulberg.substack.com/p/claude-code-for-everything-30-claude-code-tips-and-tricks)
- [XDA Developers -- Claude Code Creator Tips](https://www.xda-developers.com/claude-codes-creator-keeps-sharing-tips-and-they-all-made-my-experience-better/)
- [WillNess -- How to Run Multiple Claude Code Sessions](https://willness.dev/blog/run-multiple-claude-code-sessions)
- [WillNess -- tmux + Claude Code Workflow](https://willness.dev/blog/tmux-claude-code-workflow)
- [DEV.to -- How I Run 10 AI Agents in Parallel](https://dev.to/ji_ai/how-i-run-10-ai-agents-in-parallel-with-claude-code-b59)
- [Medium -- Watch Claude Code Agents Work Side by Side (tmux)](https://ksingh7.medium.com/watch-claude-code-agents-work-side-by-side-a-tmux-setup-guide-1ef3ba1531c4)
