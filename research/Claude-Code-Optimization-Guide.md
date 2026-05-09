# Comprehensive Guide to Optimizing Claude Code Usage
## Minimizing Costs, Maximizing Speed, and Building Efficient Workflows

*Research compiled: May 2026*

---

## Table of Contents

1. [Token Cost Optimization](#1-token-cost-optimization)
2. [Speed Optimization](#2-speed-optimization)
3. [CLAUDE.md Optimization](#3-claudemd-optimization)
4. [Efficient Prompting](#4-efficient-prompting-for-claude-code)
5. [Memory & Context Management](#5-memory--context-management)
6. [Project Configuration](#6-project-configuration)
7. [Real-World Cost Examples](#7-real-world-cost-examples)
8. [Tools & Extensions](#8-tools--extensions)

---

## 1. Token Cost Optimization

### How Much Does Claude Code Cost Per Session?

**Enterprise averages (from Anthropic's official documentation):**
- Average cost: ~$13 per developer per active day
- Monthly range: $150-250 per developer per month
- 90% of users stay below $30 per active day
- Background token usage (summarization, command processing): typically under $0.04 per session

**API Token Pricing (per million tokens):**

| Model | Input | Output | Cache Read | Cache Write |
|-------|-------|--------|------------|-------------|
| Opus 4.6 | $5 | $25 | $0.50 (10%) | $6.25 (125%) |
| Sonnet 4.6 | $3 | $15 | $0.30 (10%) | $3.75 (125%) |
| Haiku 4.5 | $1 | $5 | $0.10 (10%) | $1.25 (125%) |

**Subscription Plans:**

| Plan | Cost/mo | Best For |
|------|---------|----------|
| Pro | $20 | Solo developers, 1-2 sessions/day |
| Max 5x | $100 | Daily heavy users, multi-file work |
| Max 20x | $200 | Full-time agentic workflows |
| API | Per token | Variable workloads, automation |

### Token Usage by Task Type

- Light sessions (1-2 focused tasks): ~$2-5/day on API
- Medium sessions (3-5 hours, multi-file): ~$6-12/day
- Heavy sessions (multi-agent, all-day): ~$20-60+/day
- Code review (/ultra): $15-25 per PR
- Agent Teams: ~7x more tokens than standard sessions

### 23 Strategies to Reduce Token Consumption (40-70% Savings)

#### Context Management (Highest Impact)

1. **Clear between tasks** -- Use `/clear` when switching to unrelated work. Stale context wastes tokens on every subsequent message. Use `/rename` before clearing so you can find the session later.

2. **Use `/compact` strategically** -- Deploy after completing a discrete sub-task, before moving to the next one. Do NOT wait until Claude starts forgetting things. Add custom instructions: `/compact Focus on code samples and API usage`.

3. **Lower auto-compact threshold** -- Set `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=70` for normal work or `50` for noisy workflows (default is 95%). This compacts the chat much sooner, preventing context bloat.

4. **Monitor usage metrics** -- Run `/context` and `/usage` before large tasks. Configure status line in `~/.claude/settings.json` for real-time context percentage and costs.

5. **Use `/btw` for quick questions** -- The answer appears in a dismissible overlay and NEVER enters conversation history. Check details without growing context.

6. **Use `/rewind` to summarize selectively** -- Double-tap Escape or run `/rewind`, select a message checkpoint, and choose "Summarize from here" to condense only part of the conversation.

#### Instruction & File Optimization

7. **Keep CLAUDE.md under 200 lines** -- A 5,000-token CLAUDE.md costs 5,000 tokens before you type a word, on EVERY turn. Aim for 60-80 lines of high-value instructions.

8. **Use path-scoped rules** -- Place specific rules in `.claude/rules/` with YAML `paths` frontmatter. These load ONLY when Claude edits matching file paths.

9. **Move workflows into skills** -- Skills in `.claude/skills/<name>/SKILL.md` load on-demand only when invoked. Unlike CLAUDE.md, they do NOT consume context in every session.

#### Tool & Output Limits

10. **Cap terminal output** -- Set `BASH_MAX_OUTPUT_LENGTH=20000` to prevent test logs from draining tokens.

11. **Cap MCP server output** -- Set `MAX_MCP_OUTPUT_TOKENS=8000` to prevent tool outputs from flooding context.

12. **Filter logs before feeding to Claude** -- Use `grep -A 5 -E "FAIL|ERROR|Error|failed" | head -120` to extract only error lines.

13. **Prefer CLI tools over MCP servers** -- Tools like `gh`, `aws`, `gcloud` are more context-efficient because they do not add per-tool listing overhead.

14. **Disable unused MCP servers** -- Run `/mcp` to see configured servers and disable any not actively used.

#### Model & Agent Strategies

15. **Pick cheaper models for simple tasks** -- Haiku is ~5x cheaper than Opus per input token. Use Sonnet as default; reserve Opus for complex architectural decisions only.

16. **Use subagents for verbose research** -- Subagents run in separate context windows. Only the summary returns to your main conversation, keeping the main thread clean.

17. **Lower effort level** -- `/effort low` for simple tasks, `/effort medium` for standard coding. This reduces extended thinking token consumption.

18. **Disable extended thinking for basic edits** -- Set `CLAUDE_CODE_DISABLE_THINKING=1` since thinking tokens count as output tokens. Or lower budget: `MAX_THINKING_TOKENS=8000`.

19. **Use code intelligence plugins** -- Install language-specific plugins for accurate symbol navigation, preventing unnecessary file scanning.

#### Prompt & Workflow Control

20. **Write specific prompts** -- "Add input validation to the login function in auth.ts" instead of "improve this codebase". Vague prompts trigger massive codebase scans.

21. **Provide verification targets upfront** -- Supply expected outputs and exact test names to prevent correction loops.

22. **Course-correct early** -- Press Escape immediately if Claude reads irrelevant files. After two failed corrections, `/clear` and rewrite the prompt.

23. **One topic per chat** -- Start new conversations when switching tasks to avoid invisible context waste.

#### Advanced Environment Variables

| Variable | Value | Effect |
|----------|-------|--------|
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | `70` (normal) / `50` (noisy) | Compact sooner than default 95% |
| `BASH_MAX_OUTPUT_LENGTH` | `20000` | Cap terminal output tokens |
| `MAX_MCP_OUTPUT_TOKENS` | `8000` | Cap MCP output |
| `CLAUDE_CODE_DISABLE_THINKING` | `1` | Disable extended thinking |
| `MAX_THINKING_TOKENS` | `8000` | Limit thinking budget |
| `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT` | `1` | Drop long tool descriptions |
| `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS` | `1` | Remove git instructions from prompt |

### Caching & Context Reuse

Claude Code automatically optimizes costs through **prompt caching** -- the most important architectural decision in Claude Code:

- **Cache reads cost 10% of base input token price** (90% savings)
- **Cache writes cost 25% more** than base input tokens (5-minute TTL)
- Cached prompts can reduce input token costs by up to 90%
- Response times can be cut by up to 85% for long prompts

**How it works internally:**
- Prompts are structured in layers: static system prompt + tools (globally cached) -> project context -> session context -> conversation messages
- All Claude Code users share the same system prompt cache
- Prefix-based matching means any reordering or change invalidates all downstream cache

**Critical rules to maintain cache hits:**
- NEVER alter tools mid-conversation (breaks entire cache)
- Avoid model switching mid-session (cache is model-specific)
- Use message-based updates instead of modifying system prompt
- Claude Code team "runs alerts on prompt cache hit rate and declares SEVs if they're too low"

### Reading Only Relevant File Sections

Use offset + limit parameters in the Read tool to read only relevant portions of files. Instead of reading an entire 2000-line file, specify the exact range you need. This dramatically reduces context consumption for large files.

---

## 2. Speed Optimization

### How to Make Claude Code Work Faster

#### Model Selection for Speed
- **Haiku**: Significantly faster for quick questions, syntax help, simple code generation. Switch with `/model haiku`.
- **Sonnet**: Reliable middle ground for daily coding. Best speed-quality balance.
- **Opus**: Reserved for deep architectural reasoning. Slowest but highest quality.

#### Parallel Tool Calls
Claude Code can make multiple tool calls in parallel when there are no dependencies between them. To maximize this:
- Frame requests so independent operations are clear
- Ask for multiple files to be read simultaneously
- Request batch operations rather than sequential ones

#### Reducing Round-Trips
- **Batch related tasks** in single requests: "Update the API handler, add the corresponding test, and update the types file" instead of three separate requests
- **Provide all context upfront** -- files, constraints, patterns, expected output
- **Give verification targets** so Claude self-verifies without asking you

#### Pre-loading Context with CLAUDE.md
CLAUDE.md eliminates repeated explanations. Instead of re-explaining your project structure every session:
- Document build commands Claude cannot guess
- Include testing instructions and preferred runners
- Specify architectural decisions and naming conventions
- Reference key files with `@path/to/file` imports

#### Using Subagents for Independent Tasks
Parallel subagent dispatch works when:
- 3+ unrelated tasks exist
- No shared state between tasks
- Clear file boundaries with no overlap

Example: "Research the authentication, database, and API modules in parallel using separate subagents."

Each subagent explores its area independently in its own context window, then Claude synthesizes findings.

#### Batch Operations
```
# Fan out across files for large migrations
for file in $(cat files.txt); do
  claude -p "Migrate $file from React to Vue. Return OK or FAIL." \
    --allowedTools "Edit,Bash(git commit *)"
done
```

#### Shell Aliases for Common Workflows
```bash
alias cc="claude"
alias cch="claude --model haiku"
alias ccp="claude -p"
```

#### Permission Allowlists for Speed
Pre-approve safe commands to eliminate permission prompts:
```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(git commit *)",
      "Bash(npx tsc *)",
      "Bash(npx eslint *)"
    ]
  }
}
```

Or use **auto mode** (`claude --permission-mode auto`) where a classifier handles approvals automatically, blocking only risky operations.

#### Parallel Sessions
- Open multiple terminal windows for independent tasks
- Use git worktrees for isolated checkouts: `claude` in each worktree
- Writer/Reviewer pattern: Session A implements, Session B reviews with fresh context
- Teams using parallel sessions cut development cycles by up to 30%

---

## 3. CLAUDE.md Optimization

### Core Principles

- CLAUDE.md is loaded into context at the start of EVERY session, consuming tokens alongside your conversation
- If it exceeds ~80 lines, Claude starts ignoring parts of it
- Successful examples keep it under 60 lines
- As instruction count increases, instruction-following quality decreases uniformly
- A 5,000-token CLAUDE.md costs those tokens on EVERY turn of the conversation

### What to Include vs What to Exclude

| Include | Exclude |
|---------|---------|
| Bash commands Claude cannot guess | Anything Claude can figure out by reading code |
| Code style rules that differ from defaults | Standard language conventions Claude already knows |
| Testing instructions and preferred runners | Detailed API documentation (link instead) |
| Repository etiquette (branch naming, PR conventions) | Information that changes frequently |
| Architectural decisions specific to your project | Long explanations or tutorials |
| Developer environment quirks (required env vars) | File-by-file descriptions of the codebase |
| Common gotchas or non-obvious behaviors | Self-evident practices like "write clean code" |

### How CLAUDE.md Reduces Token Usage

1. Prevents Claude from scanning the entire codebase to understand conventions
2. Eliminates repeated explanations across sessions
3. Provides instant context that would otherwise require reading multiple files
4. Skills loaded on-demand save tokens vs putting everything in CLAUDE.md

### Recommended Structure (WHY, WHAT, HOW Framework)

```markdown
# Project Name

## Tech Stack
- Framework, Language, Database, Styling, Testing

## Project Structure
- Brief description of key directories

## Development Commands
- Build: `command`
- Test: `command`
- Lint: `command`

## Code Standards
- 3-5 critical rules only

## Workflow
- How to verify changes
- Git conventions
```

### CLAUDE.md for Monorepo Projects

Use nested CLAUDE.md files where the root provides global conventions and package-level files add specific instructions:

```
monorepo/
  CLAUDE.md              # Global conventions, shared commands
  apps/
    web/
      CLAUDE.md          # Next.js-specific rules
    api/
      CLAUDE.md          # Backend-specific rules
  packages/
    shared/
      CLAUDE.md          # Shared library conventions
```

Use `claudeMdExcludes` in `.claude/settings.local.json` to skip other teams' files:
```json
{
  "claudeMdExcludes": [
    "**/monorepo/other-team/.claude/rules/**"
  ]
}
```

### CLAUDE.md for Next.js Projects

```markdown
# My Next.js App

## Stack
Next.js 16, TypeScript, Tailwind CSS 4, Drizzle ORM, PostgreSQL, NextAuth

## Commands
- Dev: `pnpm dev`
- Build: `pnpm build`
- Test: `pnpm vitest run`
- Lint: `pnpm lint`

## Conventions
- Use App Router (not Pages Router)
- Server Components by default; add "use client" only when needed
- Use Drizzle for all DB queries; migrations via `pnpm db:push`
- API routes in app/api/ using Route Handlers
- Pydantic-style validation with Zod schemas in lib/validations/
```

### CLAUDE.md for Python/FastAPI Projects

```markdown
# FastAPI Service

## Stack
Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, pytest

## Commands
- Dev: `uv run fastapi dev`
- Test: `uv run pytest -x`
- Migrate: `uv run alembic upgrade head`
- New migration: `uv run alembic revision --autogenerate -m "description"`

## Conventions
- Async endpoints by default
- Pydantic v2 models for all request/response schemas
- SQLAlchemy 2.0 style (select() not query())
- Dependency injection for DB sessions
- Tests use pytest-asyncio with httpx AsyncClient
```

### CLAUDE.md for AI/ML Projects

```markdown
# ML Pipeline

## Stack
Python 3.11, PyTorch, Transformers, Weights & Biases, DVC

## Commands
- Train: `python train.py --config configs/default.yaml`
- Evaluate: `python eval.py --checkpoint latest`
- Data pipeline: `dvc repro`

## Conventions
- All experiments tracked in W&B project "project-name"
- Configs use YAML; never hardcode hyperparameters
- Data versioned with DVC; never commit data files to git
- Models saved to models/ with ISO timestamp naming
```

### Template Repositories

- **abhishekray07/claude-md-templates**: Templates for Next.js, Python/FastAPI, generic stacks, plus modular rules
- **ruvnet/ruflo**: Wiki with extensive CLAUDE.md templates
- **davila7/claude-code-templates**: CLI tool for configuring Claude Code
- **aitmpl.com**: Interactive web interface with 1000+ agents, commands, settings, hooks, and MCPs

---

## 4. Efficient Prompting for Claude Code

### Write Clear, Specific Prompts

| Strategy | Bad | Good |
|----------|-----|------|
| Scope the task | "add tests for foo.py" | "write a test for foo.py covering the edge case where the user is logged out. avoid mocks." |
| Point to sources | "why does ExecutionFactory have a weird API?" | "look through ExecutionFactory's git history and summarize how its API came to be" |
| Reference patterns | "add a calendar widget" | "look at how existing widgets are implemented; HotDogWidget.php is a good example. follow the pattern." |
| Describe symptoms | "fix the login bug" | "users report login fails after session timeout. check auth flow in src/auth/, especially token refresh. write a failing test, then fix it" |

### Provide Context Upfront

- **Reference files with `@`** instead of describing where code lives
- **Paste images directly** -- copy/paste or drag and drop into the prompt
- **Give URLs** for documentation and API references
- **Pipe in data** -- `cat error.log | claude`
- **Let Claude fetch what it needs** -- tell it to pull context using Bash commands

### Breaking Large Tasks into Steps

The recommended 4-phase workflow:

1. **Explore** (plan mode): "Read /src/auth and understand how we handle sessions"
2. **Plan** (plan mode): "I want to add Google OAuth. What files need to change? Create a plan."
3. **Implement** (default mode): "Implement the OAuth flow from your plan. Write tests, run the suite, fix failures."
4. **Commit** (default mode): "Commit with a descriptive message and open a PR"

### Using /plan Mode Effectively

**When to use plan mode:**
- Task has multi-file scope
- Real risk of breaking things
- Uncertainty about what Claude will do
- Any change touching 3+ files
- Schema changes or security-sensitive code

**When to skip plan mode:**
- Tiny one-file edits
- Read-only questions
- Tasks you could describe the diff in one sentence

**Advanced plan mode tips:**
- Press Shift+Tab to enter plan mode
- Press Ctrl+G to open the plan in your text editor for direct editing
- Ask for specifics: "Plan this change with the list of files to edit, specific functions to modify, and order of operations"
- Treat the plan as a contract -- push back on it if needed

### Let Claude Interview You

For larger features, have Claude interview you first:
```
I want to build [brief description]. Interview me in detail using the
AskUserQuestion tool. Ask about technical implementation, UI/UX, edge
cases, concerns, and tradeoffs. Keep interviewing until we've covered
everything, then write a complete spec to SPEC.md.
```

Then start a FRESH session to implement the spec (clean context).

### Asking for Plans Before Implementation

Always ask "how would you approach this?" before "implement this" for complex tasks. This prevents expensive rework from wrong initial directions. The plan costs far fewer tokens than re-implementing.

---

## 5. Memory & Context Management

### Two Memory Systems

| Aspect | CLAUDE.md | Auto Memory |
|--------|-----------|-------------|
| Who writes it | You | Claude |
| What it contains | Instructions and rules | Learnings and patterns |
| Scope | Project, user, or org | Per working tree |
| Loaded into | Every session (full file) | Every session (first 200 lines or 25KB) |
| Use for | Coding standards, workflows, architecture | Build commands, debugging insights, discovered preferences |

### Auto Memory Details

- **Storage**: `~/.claude/projects/<project>/memory/`
- All worktrees and subdirectories within the same git repo share one auto memory directory
- Contains `MEMORY.md` (entrypoint/index) + optional topic files (debugging.md, api-conventions.md, etc.)
- First 200 lines of MEMORY.md loaded at session start; topic files loaded on-demand
- Machine-local; not shared across machines or cloud environments

### MEMORY.md Best Practices

- MEMORY.md acts as a concise index; Claude moves detailed notes into separate topic files
- Only the first 200 lines or 25KB are loaded at startup
- Claude decides what is worth remembering based on future usefulness
- When a topic has too much information, Claude creates dedicated topic files
- Run `/memory` to browse and edit memory files
- All memory files are plain markdown you can edit or delete at any time

### When to Save vs Not Save Memories

Claude automatically saves to auto memory when it discovers information useful for future conversations. You can also explicitly say:
- "Remember that the API tests require a local Redis instance" -- saves to auto memory
- "Add this to CLAUDE.md" -- saves to project instructions instead

### Context Compression Strategies

1. **Auto-compaction**: Triggers when approaching context limits. CLAUDE.md re-reads from disk after compaction and is re-injected.
2. **Manual compaction**: `/compact <instructions>` with specific focus areas
3. **Selective summarization**: `/rewind` -> select checkpoint -> "Summarize from here"
4. **Subagent delegation**: Verbose operations (test running, log analysis, docs fetching) stay in subagent's isolated context
5. **Side questions**: `/btw` for quick lookups that never enter conversation history

### What Survives Compaction

- Project-root CLAUDE.md: Always re-injected from disk after compaction
- Nested CLAUDE.md (subdirectories): NOT re-injected automatically; reload when Claude reads files in that subdirectory
- Conversation-only instructions: Lost unless added to CLAUDE.md

### Context Window Visualization

- System prompt + tools -> CLAUDE.md files -> auto memory -> conversation messages -> tool outputs
- Every file read, command output, and MCP response is appended to context
- A 10,000-line log file stays in context permanently for that session
- Claude re-reads the ENTIRE conversation from the top on every message
- Message 50 costs significantly more than message 5

---

## 6. Project Configuration

### settings.json Best Practices

Settings files live at multiple scopes:
- **User**: `~/.claude/settings.json` (all projects)
- **Project**: `.claude/settings.json` (team-shared via git)
- **Local**: `.claude/settings.local.json` (personal, gitignored)
- **Managed policy**: OS-specific paths for org-wide enforcement

**Recommended configuration:**

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx tsc *)",
      "Bash(npx eslint *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git status)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)"
    ]
  },
  "env": {
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "70",
    "BASH_MAX_OUTPUT_LENGTH": "20000",
    "MAX_MCP_OUTPUT_TOKENS": "8000"
  }
}
```

### Permission Allowlists for Speed

- Rules evaluate in order: deny first, then ask, then allow
- First matching rule wins
- Deny rules at any level CANNOT be overridden
- Use specific patterns: `Bash(npm run *)` not `Bash(*)`
- Use `/permissions` for interactive configuration UI
- **Auto mode** (`--permission-mode auto`): classifier model reviews commands, blocks only risky ones

### Custom Slash Commands / Skills

Create custom commands by placing Markdown files in `.claude/commands/` (project) or `~/.claude/commands/` (personal):

```markdown
# .claude/skills/fix-issue/SKILL.md
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---
Analyze and fix the GitHub issue: $ARGUMENTS.

1. Use `gh issue view` to get the issue details
2. Understand the problem
3. Search the codebase for relevant files
4. Implement changes
5. Write and run tests
6. Create a descriptive commit
7. Push and create a PR
```

Invoke with `/fix-issue 1234`. Use `$ARGUMENTS` to capture input passed to the command.

### .claudeignore for Large Repos

Block noisy files from Claude's view by adding deny rules:

```json
{
  "permissions": {
    "deny": [
      "Read(node_modules/**)",
      "Read(dist/**)",
      "Read(build/**)",
      "Read(coverage/**)",
      "Read(.next/**)",
      "Read(tmp/**)",
      "Read(logs/**)",
      "Read(.env*)"
    ]
  }
}
```

### Model Selection Guide: When Opus vs Sonnet vs Haiku

| Model | When to Use | Cost Relative |
|-------|------------|---------------|
| **Haiku** | Syntax help, quick explanations, simple code gen, formatting | 1x (cheapest) |
| **Sonnet** | Daily coding, multi-file refactoring, test writing, standard development | 3x |
| **Opus** | Complex architecture, multi-step reasoning, security audits, large codebase refactoring | 5x |

**Key insight**: Sonnet 4.6 scores within 1.2% of Opus 4.6 on SWE-bench Verified while costing 5x less. Developers preferred Sonnet 4.6 over the previous Opus 4.5 59% of the time.

**Smart routing strategy**: Route 90% of requests to Sonnet and 10% to Opus based on task complexity.

**OpusPlan mode**: Uses Opus during plan mode for complex reasoning, then switches to Sonnet for code generation -- Opus reasoning quality without paying Opus rates for every line.

Switch models mid-session: `/model haiku`, `/model sonnet`, `/model opus`

---

## 7. Real-World Cost Examples

### Cost Per Task Type

| Task | Estimated Token Cost (API) | Notes |
|------|---------------------------|-------|
| Simple bug fix | $0.50-2.00 | Single file, clear error message |
| Feature development (small) | $2-8 | 2-3 files, clear requirements |
| Feature development (medium) | $5-15 | Multi-file, tests, some exploration |
| Feature development (large) | $15-50+ | Architecture changes, many files |
| Code review (/ultra) | $15-25 | Scales with PR size/complexity |
| Codebase exploration | $1-5 | Depends on scope |
| Full-day development | $6-30 | 90% of users below $30/day |

### Daily and Monthly Budgets

| Usage Level | Daily Cost | Monthly Cost | Recommended Plan |
|-------------|-----------|--------------|-----------------|
| Light (1-2 sessions) | $2-5 | $40-100 | Pro ($20/mo) |
| Medium (3-5 hours) | $6-12 | $130-260 | Max 5x ($100/mo) |
| Heavy (all-day) | $20-60+ | $400-1,200+ | Max 20x ($200/mo) |

### How Top Users Keep Costs Under $50/Day

1. **Default to Sonnet** -- Switch to Opus only for architecture decisions (saves ~67% on those tasks)
2. **Aggressive context management** -- `/clear` between every task, auto-compact at 70%
3. **Specific prompts** -- Never "fix this code"; always "fix the null reference in handleSubmit on line 42 of auth.ts"
4. **Subagent delegation** -- All research, log analysis, and exploration in subagents
5. **Skills over CLAUDE.md bloat** -- Specialized workflows as on-demand skills, not always-loaded instructions
6. **Cap output lengths** -- BASH_MAX_OUTPUT_LENGTH=20000, MAX_MCP_OUTPUT_TOKENS=8000
7. **Filter before feeding** -- Grep for errors in logs before giving them to Claude
8. **One topic per chat** -- New conversation for each distinct task
9. **Disable extended thinking for simple tasks** -- `/effort low` for formatting, renaming, simple edits
10. **Use /btw for side questions** -- Never pollute main context with tangential queries

### Monthly Budget Planning

**For a solo developer:**
- Conservative: $100-150/month (Max 5x plan)
- Active: $200-300/month (Max 20x plan)
- Heavy: $400-600/month (API billing with optimization)

**For a team:**
- Team plans start at $20/seat/month (Standard)
- Claude Code requires Premium seats at $100/seat/month
- Minimum 5 seats, mix-and-match allowed
- Enterprise: custom pricing with managed workspace spend limits

**Budget tip**: The $13/active-day enterprise benchmark is a useful reality check. If you use Claude Code every weekday, budget $260/month as baseline, then optimize from there.

### Cost Reduction Results

- Users report 40-70% savings with focused optimization
- Context-mode plugin alone delivers 50-90% MCP token reduction
- Graphify delivers 70x cheaper operations on large codebases (500+ files)
- Firecrawl delivers 80% token reduction vs raw HTML fetching
- One documented case: token consumption reduced from 10.4M to 3.7M tokens (64% reduction), errors from 10 to 0, cost from $9.21 to $2.81

---

## 8. Tools & Extensions

### VS Code Extension for Claude Code

- Available as an extension in VS Code
- Recent upgrades (v2.1.50-2.1.71): session management, plan review, native MCP controls, compaction visibility
- Spark icon in VS Code activity bar opens dedicated session list
- Each session openable as a full editor tab
- Note: MCP functionality through the extension may have limitations compared to CLI

### Useful MCP Servers for Development

MCP tool definitions are **deferred by default** (lazy loading), reducing context usage by up to 95%.

**Development-focused MCP servers:**
- **GitHub** (or just use `gh` CLI -- more context-efficient)
- **Figma** -- implement designs directly from Figma files
- **Notion** -- pull tasks and documentation
- **Database connectors** -- query databases directly
- **Sentry** -- analyze monitoring data (or use `sentry-cli`)

**Tip**: Prefer CLI tools (`gh`, `aws`, `gcloud`, `sentry-cli`) over MCP servers when available. They are more context-efficient because they don't add per-tool listing overhead.

### Git Integration

- Claude knows how to use `gh` CLI for creating issues, opening PRs, reading comments
- Without `gh`, unauthenticated API requests hit rate limits
- Git worktrees for parallel sessions: isolated checkouts so edits don't collide
- Pre-commit hooks: `claude -p "review staged changes" --output-format json`

### Terminal Multiplexer Setups (tmux)

**Key tools:**
- **claude-tmux**: Manage Claude Code within tmux with session management, git worktree, and PR support (github.com/nielsgroen/claude-tmux)
- **tmux-claude-live**: Real-time usage monitoring in tmux status bar (github.com/worldnine/tmux-claude-live)
- **claude-dashboard**: k9s-style TUI for managing sessions via tmux (github.com/seunggabi/claude-dashboard)
- **claude_code_agent_farm**: Orchestration for 20+ parallel Claude Code agents with tmux monitoring (github.com/Dicklesworthstone/claude_code_agent_farm)

**Desktop app approach**: A Tauri-based app monitors multiple Claude Code sessions through hooks in global settings.json with minimal, non-intrusive UI.

### Dashboards for Tracking Usage

1. **Built-in `/usage` command** -- Session-level token usage and estimated costs
2. **Status line configuration** -- Real-time context percentage and model costs in terminal
3. **ccstatusline** -- Passive awareness in terminal status line
4. **Claude-Code-Usage-Monitor** -- Live predictions in tmux pane during heavy sessions
5. **ccusage** -- Weekly trend analysis and per-project attribution
6. **OpenTelemetry** -- Export metrics, events, and traces for organizational monitoring
7. **LiteLLM** -- Open-source tool for tracking spend by key (for Bedrock/Vertex/Foundry users)

### Hooks for Automation

Hooks run scripts automatically at specific points in Claude's workflow. Unlike CLAUDE.md instructions (advisory), hooks are deterministic.

Example: Filter test output to show only failures:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/filter-test-output.sh"
          }
        ]
      }
    ]
  }
}
```

### Plugins

- Run `/plugin` to browse the marketplace
- Code intelligence plugins give Claude precise symbol navigation and automatic error detection
- Plugins bundle skills, hooks, subagents, and MCP servers into single installable units

---

## Quick Reference: The 10 Highest-Impact Optimizations

1. **`/clear` between tasks** -- Prevents stale context waste (saves 20-40% tokens)
2. **Set CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=70** -- Compact before context degrades
3. **Keep CLAUDE.md under 80 lines** -- Move specialized workflows to skills
4. **Default to Sonnet, not Opus** -- 5x cheaper, within 1.2% quality
5. **Use subagents for research** -- Isolates verbose operations from main context
6. **Write specific prompts** -- "Fix X in Y file" not "fix this code"
7. **Cap output lengths** -- BASH_MAX_OUTPUT_LENGTH=20000
8. **Use `/btw` for side questions** -- Never grows context
9. **Plan before implementing complex tasks** -- Prevents expensive rework
10. **Pre-approve safe commands** -- Eliminates permission prompt delays

---

## Sources

### Official Documentation
- [Manage costs effectively - Claude Code Docs](https://code.claude.com/docs/en/costs)
- [Best practices for Claude Code - Claude Code Docs](https://code.claude.com/docs/en/best-practices)
- [How Claude remembers your project - Claude Code Docs](https://code.claude.com/docs/en/memory)
- [Configure permissions - Claude Code Docs](https://code.claude.com/docs/en/permissions)
- [Slash commands - Claude Code Docs](https://code.claude.com/docs/en/slash-commands)
- [Create custom subagents - Claude Code Docs](https://code.claude.com/docs/en/sub-agents)
- [Model configuration - Claude Code Docs](https://code.claude.com/docs/en/model-config)
- [Use Claude Code in VS Code - Claude Code Docs](https://code.claude.com/docs/en/vs-code)
- [Monitoring - Claude Code Docs](https://code.claude.com/docs/en/monitoring-usage)
- [Lessons from building Claude Code: Prompt caching is everything](https://claude.com/blog/lessons-from-building-claude-code-prompt-caching-is-everything)
- [Prompt caching - Claude API Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Models overview - Claude API Docs](https://platform.claude.com/docs/en/about-claude/models/overview)

### In-Depth Guides
- [23 Tips for Smart Claude Code Token Saving - Analytics Vidhya](https://www.analyticsvidhya.com/blog/2026/05/tips-for-claude-code-token-saving/)
- [5 Claude Code Skills That Cut Token Costs by 70% - MindStudio](https://www.mindstudio.ai/blog/5-claude-code-skills-cut-token-costs-70-percent-benchmarked)
- [Claude Code Token Optimization: Stop the $1,600 Bill - Build to Launch](https://buildtolaunch.substack.com/p/claude-code-token-optimization)
- [7 Practical Ways to Reduce Claude Code Token Usage - KDnuggets](https://www.kdnuggets.com/7-practical-ways-to-reduce-claude-code-token-usage)
- [18 Claude Code Token Management Hacks - MindStudio](https://www.mindstudio.ai/blog/claude-code-token-management-hacks)
- [How to Manage Claude Code Token Usage: 10 Techniques - MindStudio](https://www.mindstudio.ai/blog/how-to-manage-claude-code-token-usage)
- [7 Ways to Cut Your Claude Code Token Usage - DEV Community](https://dev.to/boucle2026/7-ways-to-cut-your-claude-code-token-usage-elb)

### Pricing & Cost Analysis
- [Claude Code Pricing 2026 - Verdent Guides](https://www.verdent.ai/guides/claude-code-pricing-2026)
- [Claude Code Pricing 2026: Complete Plans & Cost Guide - Finout](https://www.finout.io/blog/claude-code-pricing-2026)
- [Claude Code Pricing: Optimize Your Token Usage - ClaudeFast](https://claudefa.st/blog/guide/development/usage-optimization)
- [Claude Code Pricing 2026 - SSD Nodes](https://www.ssdnodes.com/blog/claude-code-pricing-in-2026-every-plan-explained-pro-max-api-teams/)
- [The Real Cost of AI Coding in 2026 - Morph](https://www.morphllm.com/ai-coding-costs)
- [Claude Code pricing: how much it costs - How Do I Use AI](https://www.howdoiuseai.com/blog/2026-03-22-claude-code-pricing-how-much-it-costs-and-which-pl)

### Speed & Workflow
- [Claude Code Speed: Rev the Engine - ClaudeFast](https://claudefa.st/blog/guide/performance/speed-optimization)
- [Effective Claude Code Workflows in 2026 - Medium](https://medium.com/@sean.j.moran/effective-claude-code-workflows-in-2026-what-changed-and-what-works-now-c93ebc6f8f50)
- [Claude Code Plan Mode: The Complete 2026 Guide](https://www.anyonebuilds.com/guides/claude-code-plan-mode)
- [Claude Code Tips: 10 Real Productivity Workflows - F22 Labs](https://www.f22labs.com/blogs/10-claude-code-productivity-tips-for-every-developer/)
- [Master Claude Code in 2026 - Medevel](https://medevel.com/master-claude-code-in-2026/)
- [Parallel Sub-Agents in Claude Code - ProofSource](https://proofsource.ai/2025/12/parallel-sub-agents-in-claude-code-multiplying-your-development-speed/)

### CLAUDE.md Templates & Memory
- [Writing a good CLAUDE.md - HumanLayer Blog](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [CLAUDE.md Templates - abhishekray07/claude-md-templates](https://github.com/abhishekray07/claude-md-templates)
- [Claude Code Templates - aitmpl.com](https://www.aitmpl.com/)
- [CLAUDE MD Templates - ruvnet/ruflo Wiki](https://github.com/ruvnet/ruflo/wiki/CLAUDE-MD-Templates)
- [How to Create the Perfect CLAUDE.md - Gradually.ai](https://www.gradually.ai/en/claude-md/)
- [Claude Code Memory Management: The Complete Guide 2026 - Medium](https://medium.com/data-science-collective/claude-code-memory-management-the-complete-guide-2026-b0df6300c4e8)
- [Claude Code Auto Memory - ClaudeFast](https://claudefa.st/blog/guide/mechanics/auto-memory)

### Configuration & Settings
- [Claude Code settings.json Reference (v2.1.104)](https://gist.github.com/mculp/c082bd1e5a439410158974de90c89db7)
- [Claude Code settings.json: Complete config guide - eesel AI](https://www.eesel.ai/blog/settings-json-claude-code)
- [claude-code-best-practice/claude-settings.md](https://github.com/shanraisshan/claude-code-best-practice/blob/main/best-practice/claude-settings.md)
- [How I configure Claude Code with settings.json - Medium](https://chtn.medium.com/how-i-configure-claude-code-with-settings-json-9b5517409a7c)
- [Claude Code Permissions - ClaudeFast](https://claudefa.st/blog/guide/development/permission-management)

### Model Selection
- [Sonnet vs Opus: Quick Decision Guide 2026 - NxCode](https://www.nxcode.io/resources/news/claude-sonnet-4-6-vs-opus-4-6-which-model-to-choose-2026)
- [Claude Sonnet vs Opus 2026 - Emergent](https://emergent.sh/learn/claude-sonnet-vs-opus)
- [Choosing the right Claude model - Claude](https://claude.com/resources/tutorials/choosing-the-right-claude-model)

### Tools & Extensions
- [50+ Best MCP Servers for Claude Code in 2026 - ClaudeFast](https://claudefa.st/blog/tools/mcp-extensions/best-addons)
- [claude-tmux - GitHub](https://github.com/nielsgroen/claude-tmux)
- [tmux-claude-live - GitHub](https://github.com/worldnine/tmux-claude-live)
- [claude-dashboard - GitHub](https://github.com/seunggabi/claude-dashboard)
- [claude_code_agent_farm - GitHub](https://github.com/Dicklesworthstone/claude_code_agent_farm)
- [Claude Code Usage Monitor - ClaudeFast](https://claudefa.st/blog/tools/monitors/claude-code-usage-monitor)
- [awesome-claude-code - GitHub](https://github.com/hesreallyhim/awesome-claude-code)

### Code Review
- [Claude Code /ultra review - MindStudio](https://www.mindstudio.ai/blog/claude-code-ultra-review-5-things-to-know-before-running)
- [Code Review for Claude Code - Claude Blog](https://claude.com/blog/code-review)
- [Is Claude Code Review Worth $15-25 Per PR? - BuildFastWithAI](https://www.buildfastwithai.com/blogs/claude-code-review-guide)
