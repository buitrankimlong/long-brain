---
tags: [knowledge, mcp, servers, reference, protocol]
source_repo: servers
---

# MCP Reference Servers - Knowledge Extraction

## Overview & Server Catalog

The `modelcontextprotocol/servers` repository is an **npm workspaces monorepo** containing 7 official reference server implementations maintained by Anthropic/MCP steering group. These are explicitly labeled as **educational reference implementations**, not production-ready solutions.

| Server | Language | npm/PyPI Package | Purpose |
|---|---|---|---|
| everything | TypeScript | `@modelcontextprotocol/server-everything` | Reference server showcasing all MCP features (prompts, resources, tools) |
| filesystem | TypeScript | `@modelcontextprotocol/server-filesystem` | Secure file operations with allowlist access control and MCP Roots |
| memory | TypeScript | `@modelcontextprotocol/server-memory` | Knowledge graph-based persistent memory (JSONL format) |
| sequentialthinking | TypeScript | `@modelcontextprotocol/server-sequential-thinking` | Dynamic reflective problem-solving via thought sequences |
| fetch | Python | `mcp-server-fetch` | Web content fetching with robots.txt enforcement, HTML-to-Markdown |
| git | Python | `mcp-server-git` | Git repository operations via GitPython |
| time | Python | `mcp-server-time` | Timezone queries and conversion |

**Archived servers** (moved to `servers-archived`): AWS KB Retrieval, Brave Search, EverArt, GitHub, GitLab, Google Drive, Google Maps, PostgreSQL, Puppeteer, Redis, Sentry, Slack, SQLite.

---

## Tech Stack & Dependencies

### TypeScript Servers

- **Runtime**: Node.js >= 22
- **Module system**: ES modules (`"type": "module"`) with `.js` extensions in import paths
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.26.0
- **Schema validation**: `zod` (for all tool input/output schemas)
- **Build**: `tsc` targeting ES2022, module Node16, strict mode → output to `dist/`
- **Test framework**: `vitest` + `@vitest/coverage-v8`
- **Extras (per server)**:
  - filesystem: `diff` ^8.0.3, `minimatch` ^10.0.1, `glob` ^10.5.0
  - sequentialthinking: `chalk` ^5.3.0, `yargs` ^17.7.2

### Python Servers

- **Python**: >= 3.10
- **MCP SDK**: `mcp>=1.0.0` (fetch requires `mcp>=1.1.3`)
- **Build system**: `hatchling` (via `uv build`)
- **Package manager**: `uv` (not pip)
- **Type checking**: `pyright` (enforced in CI)
- **Linting**: `ruff`
- **Testing**: `pytest` + `pytest-asyncio`
- **Fetch extras**: `httpx>=0.27`, `markdownify>=0.13.1`, `protego>=0.3.1`, `readabilipy>=0.2.0`, `pydantic>=2.0.0`
- **Git extras**: `gitpython>=3.1.45`, `click>=8.1.7`, `pydantic>=2.0.0`

### Monorepo Structure

```
servers/
  package.json          # Root npm workspaces config ("workspaces": ["src/*"])
  tsconfig.json         # Shared TypeScript config
  src/
    filesystem/         # TS server
    memory/             # TS server
    sequentialthinking/ # TS server
    everything/         # TS server
    fetch/              # Python server (pyproject.toml, hatchling)
    git/                # Python server
    time/               # Python server
```

---

## Key Server Implementations (with code patterns)

### TypeScript Pattern: McpServer + registerTool

All TypeScript servers follow this exact pattern:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "server-name",
  version: "0.x.x",
});

server.registerTool(
  "tool-name",           // kebab-case, verb-first
  {
    title: "Human Title",
    description: "...",
    inputSchema: {
      param: z.string().describe("description")
    },
    outputSchema: { content: z.string() },
    annotations: {
      readOnlyHint: true,        // does not modify state
      idempotentHint: true,      // same result for same input
      destructiveHint: false,    // no destructive side effects
      openWorldHint: false,      // closed-world tool
    }
  },
  async (args) => {
    // handler
    return {
      content: [{ type: "text" as const, text: result }],
      structuredContent: { content: result }  // mirrors outputSchema
    };
  }
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Server running on stdio");
}
runServer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

**Key rules:**
- `console.error()` for all logging (stdout is the MCP transport channel)
- Both `content` (array of content blocks) AND `structuredContent` (object matching outputSchema) are returned
- Tool names are kebab-case, verb-first (e.g. `get-file-info`, `read-text-file`)

### Python Pattern: Low-level Server + decorators

Python servers use the lower-level `Server` class with decorator-based handler registration:

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
from pydantic import BaseModel

server = Server("mcp-server-name")

class MyToolArgs(BaseModel):
    param: str

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [Tool(name="tool-name", description="...", inputSchema=MyToolArgs.model_json_schema())]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    args = MyToolArgs(**arguments)
    result = do_work(args.param)
    return [TextContent(type="text", text=result)]

async def serve():
    options = server.create_initialization_options()
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, options, raise_exceptions=True)
```

---

## Filesystem Server Patterns

**Location**: `src/filesystem/`
**Package**: `@modelcontextprotocol/server-filesystem`

### Access Control Architecture

The filesystem server implements a two-layer security model:

1. **CLI arguments** - directories passed at startup (`mcp-server-filesystem /path/to/dir`)
2. **MCP Roots protocol** - dynamically updated from the client at runtime

Both symlinks and relative paths are fully handled. The server stores both original and resolved (real) paths to handle macOS `/tmp` -> `/private/tmp` issues.

```typescript
// On initialization: check if client supports Roots
server.server.oninitialized = async () => {
  const clientCapabilities = server.server.getClientCapabilities();
  if (clientCapabilities?.roots) {
    const response = await server.server.listRoots();
    await updateAllowedDirectoriesFromRoots(response.roots);
  }
};

// Dynamic update when client sends roots/list_changed notification
server.server.setNotificationHandler(RootsListChangedNotificationSchema, async () => {
  const response = await server.server.listRoots();
  await updateAllowedDirectoriesFromRoots(response.roots);
});
```

### Path Validation Security

`validatePath()` in `lib.ts` is the core security function:

1. Expand `~` home directory references
2. Resolve relative paths against allowed directories
3. Check normalized path is within allowed directories
4. Resolve symlinks via `fs.realpath()` and re-check (prevents symlink attacks)
5. For new files (ENOENT): validate the parent directory is allowed

```typescript
// Atomic write to prevent TOCTOU race conditions with symlinks
// Uses 'wx' flag (exclusive create) first, then atomic rename fallback
async function writeFileContent(filePath: string, content: string): Promise<void> {
  try {
    await fs.writeFile(filePath, content, { encoding: "utf-8", flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      const tempPath = `${filePath}.${randomBytes(16).toString('hex')}.tmp`;
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, filePath);  // atomic rename
    }
  }
}
```

### Tool Annotations (filesystem examples)

```typescript
// Read-only, safe to repeat
annotations: { readOnlyHint: true }

// Write, idempotent (same result for same input)
annotations: { readOnlyHint: false, idempotentHint: true, destructiveHint: true }

// Write, NOT idempotent, destructive
annotations: { readOnlyHint: false, idempotentHint: false, destructiveHint: true }
```

### Complete Tool List

| Tool | Description | Hint |
|---|---|---|
| `read_text_file` | Read file as text, supports head/tail | readOnly |
| `read_media_file` | Read image/audio as base64 | readOnly |
| `read_multiple_files` | Batch read, failures are per-file not global | readOnly |
| `write_file` | Create or overwrite file | destructive, idempotent |
| `edit_file` | Line-based edits with git-diff preview, dryRun support | destructive |
| `create_directory` | mkdir -p, silent if exists | idempotent |
| `list_directory` | [FILE]/[DIR] prefixed listing | readOnly |
| `list_directory_with_sizes` | Listing with sizes, sort by name or size | readOnly |
| `directory_tree` | Recursive JSON tree with excludePatterns (minimatch) | readOnly |
| `move_file` | Move or rename, fails if destination exists | destructive |
| `search_files` | Glob pattern search with exclude patterns | readOnly |
| `get_file_info` | File metadata (size, times, permissions, type) | readOnly |
| `list_allowed_directories` | Show what paths are accessible | readOnly |

### Path Utilities (`path-utils.ts`)

- `normalizePath(p)` - OS-aware normalization, handles WSL paths (`/mnt/c/`), UNC paths (`\\server\share`), Windows drive letters
- `expandHome(filepath)` - expands `~/` to `os.homedir()`
- `convertToWindowsPath(p)` - converts Unix-style Windows paths (`/c/users`) on win32 only; **never converts `/mnt/` WSL paths**

---

## Memory Server Patterns

**Location**: `src/memory/`
**Package**: `@modelcontextprotocol/server-memory`

### Data Model

Knowledge graph stored as JSONL (JSON Lines) file:

```
{"type":"entity","name":"Alice","entityType":"Person","observations":["Works at Acme"]}
{"type":"entity","name":"Acme","entityType":"Company","observations":["Founded 2010"]}
{"type":"relation","from":"Alice","to":"Acme","relationType":"works_at"}
```

**Interfaces:**
```typescript
interface Entity {
  name: string;         // unique identifier
  entityType: string;   // e.g. "Person", "Company", "Concept"
  observations: string[]; // facts about the entity
}

interface Relation {
  from: string;         // entity name
  to: string;           // entity name
  relationType: string; // active voice, e.g. "works_at", "manages"
}

interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}
```

### KnowledgeGraphManager Class

All operations load the full graph from disk, mutate in memory, then save back:

```typescript
class KnowledgeGraphManager {
  constructor(private memoryFilePath: string) {}

  private async loadGraph(): Promise<KnowledgeGraph>   // parse JSONL
  private async saveGraph(graph: KnowledgeGraph)       // write JSONL

  async createEntities(entities: Entity[]): Promise<Entity[]>          // dedup by name
  async createRelations(relations: Relation[]): Promise<Relation[]>    // dedup by from+to+type
  async addObservations(...)                                            // append to existing entity
  async deleteEntities(entityNames: string[])                          // cascade deletes relations
  async deleteObservations(...)
  async deleteRelations(relations: Relation[])
  async readGraph(): Promise<KnowledgeGraph>                           // full dump
  async searchNodes(query: string): Promise<KnowledgeGraph>           // fuzzy text search
  async openNodes(names: string[]): Promise<KnowledgeGraph>           // fetch specific nodes
}
```

**Search behavior**: `searchNodes` matches against entity name, entityType, AND all observations. Returns matching entities plus any relations where at least one endpoint matched (enables discovering connections).

**File path**: Configurable via `MEMORY_FILE_PATH` environment variable. Auto-migrates legacy `memory.json` to `memory.jsonl` format on startup.

### Tool List

| Tool | Description |
|---|---|
| `create_entities` | Create multiple entities (deduplicates by name) |
| `create_relations` | Create relations (deduplicates by from+to+relationType) |
| `add_observations` | Append observations to existing entities |
| `delete_entities` | Delete entities + cascades to their relations |
| `delete_observations` | Remove specific observations from entities |
| `delete_relations` | Remove specific relations |
| `read_graph` | Return entire knowledge graph |
| `search_nodes` | Text search across names, types, observations |
| `open_nodes` | Fetch specific nodes by name array |

---

## Sequential Thinking Server

**Location**: `src/sequentialthinking/`
**Package**: `@modelcontextprotocol/server-sequential-thinking`

### Concept

A single tool `sequentialthinking` that enables the LLM to reason step-by-step with support for:
- **Revisions**: marking a thought as reconsidering a previous thought
- **Branching**: creating named branches from any previous thought
- **Dynamic resizing**: `totalThoughts` estimate can be adjusted up or down mid-process
- **Hypothesis generation and verification**: explicit cycle in the description

### ThoughtData Interface

```typescript
interface ThoughtData {
  thought: string;
  thoughtNumber: number;
  totalThoughts: number;
  isRevision?: boolean;       // true if this revises previous thinking
  revisesThought?: number;    // which thought number is being reconsidered
  branchFromThought?: number; // branching point thought number
  branchId?: string;          // branch identifier string
  needsMoreThoughts?: boolean;
  nextThoughtNeeded: boolean; // false = done, true = continue
}
```

### State Management

`SequentialThinkingServer` (in `lib.ts`) maintains in-memory state across tool calls within a session:

```typescript
class SequentialThinkingServer {
  private thoughtHistory: ThoughtData[] = [];
  private branches: Record<string, ThoughtData[]> = {};

  processThought(input: ThoughtData): { content: ..., isError?: boolean }
}
```

Returns: `thoughtNumber`, `totalThoughts`, `nextThoughtNeeded`, `branches` (array of branch IDs), `thoughtHistoryLength`.

**Logging**: Formatted console.error output with colored box-drawing characters (uses `chalk`). Disable via `DISABLE_THOUGHT_LOGGING=true` env var.

**Input coercion**: Uses `z.preprocess` + `z.coerce.number()` to handle string "true"/"false" and numeric strings from clients that don't respect JSON types.

### Annotations

```typescript
annotations: {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}
```

---

## Fetch Server (Python)

**Location**: `src/fetch/`
**Package**: `mcp-server-fetch`

### Key Design Decisions

1. **robots.txt enforcement** by default - checks `Protego` parser before fetching. Can be disabled with `--ignore-robots-txt` flag.
2. **HTML-to-Markdown conversion** using `readabilipy` (Mozilla Readability port) + `markdownify`. Raw HTML available via `raw=true` parameter.
3. **Two User-Agent strings**: one for autonomous fetching (`Autonomous`) and one when user explicitly requests via prompt (`User-Specified`).
4. **Pagination support**: `start_index` + `max_length` (default 5000 chars) for large pages - truncation message includes the next `start_index`.
5. **Proxy support**: `proxy_url` parameter threaded through all HTTP calls.

### Fetch Tool Parameters

```python
class Fetch(BaseModel):
    url: AnyUrl
    max_length: int = 5000     # max chars to return (1 to 1,000,000)
    start_index: int = 0       # pagination offset
    raw: bool = False          # if True, return raw HTML
```

### Prompt Exposure

Uniquely, the fetch server also exposes a **prompt** (not just a tool):

```python
@server.list_prompts()
async def list_prompts() -> list[Prompt]:
    return [Prompt(
        name="fetch",
        description="Fetch a URL and extract its contents as markdown",
        arguments=[PromptArgument(name="url", required=True)]
    )]
```

The prompt uses the "manual" User-Agent and skips robots.txt checking (user explicitly requested it).

---

## Git Server (Python)

**Location**: `src/git/`
**Package**: `mcp-server-git`

### Tool List

| Tool | Description | Annotations |
|---|---|---|
| `git_status` | Working tree status | readOnly, idempotent |
| `git_diff_unstaged` | Unstaged changes | readOnly, idempotent |
| `git_diff_staged` | Staged changes | readOnly, idempotent |
| `git_diff` | Diff vs branch/commit | readOnly, idempotent |
| `git_commit` | Record changes | write, not idempotent |
| `git_add` | Stage files | write, idempotent |
| `git_reset` | Unstage all | write, destructive, idempotent |
| `git_log` | Commit history with date range filters | readOnly |
| `git_create_branch` | Create branch from base | write |
| `git_checkout` | Switch branches | write |
| `git_show` | Show commit contents + diff | readOnly |
| `git_branch` | List branches (local/remote/all) with contains/not-contains filter | readOnly |

### Security Pattern (injection prevention)

All user-supplied git refs, branch names, and revisions are validated against starting with `-`:

```python
# Defense in depth: reject targets starting with '-' to prevent flag injection
if target.startswith("-"):
    raise BadName(f"Invalid target: '{target}' - cannot start with '-'")
repo.rev_parse(target)  # Validates target is a real git ref
```

Same pattern applied to: `branch_name`, `base_branch`, `revision`, `contains`, `not_contains`, `start_timestamp`, `end_timestamp`.

### Dual Repository Discovery

Repos can come from both CLI args and MCP Roots (client-provided):

```python
async def list_repos() -> Sequence[str]:
    root_repos = await by_roots()   # client MCP roots capability
    cmd_repos = by_commandline()    # --repository CLI arg
    return [*root_repos, *cmd_repos]
```

### Path Validation

```python
def validate_repo_path(repo_path: Path, allowed_repository: Path | None) -> None:
    resolved_repo.relative_to(resolved_allowed)  # throws ValueError if outside
```

---

## Common Implementation Patterns

### 1. Stdio Transport (universal)

All 7 servers use stdio as the transport. This is the standard for local MCP servers:

```typescript
// TypeScript
const transport = new StdioServerTransport();
await server.connect(transport);
```

```python
# Python
async with stdio_server() as (read_stream, write_stream):
    await server.run(read_stream, write_stream, options)
```

**Critical**: `stdout` is exclusively for the MCP JSON protocol. All logging goes to `stderr` (`console.error()` in TS, standard logging in Python).

### 2. Dual Content Return (TypeScript)

TypeScript tools return both a human-readable content block array AND structured content:

```typescript
return {
  content: [{ type: "text" as const, text: humanReadableString }],
  structuredContent: { key: typedValue }  // matches outputSchema
};
```

### 3. Zod Schema Pattern (TypeScript)

Input schemas are defined inline using Zod object shapes:

```typescript
server.registerTool("tool-name", {
  inputSchema: {
    path: z.string(),
    count: z.number().optional().default(10),
    mode: z.enum(["a", "b"]).optional().default("a"),
  },
  outputSchema: { result: z.string() }
}, handler);
```

### 4. Pydantic Models (Python)

Python servers use Pydantic BaseModel + `.model_json_schema()` for input validation:

```python
class MyArgs(BaseModel):
    url: AnyUrl
    max_length: int = Field(default=5000, gt=0, lt=1000000)

Tool(name="tool-name", inputSchema=MyArgs.model_json_schema())
```

### 5. MCP Roots Integration

Both filesystem and git servers query MCP Roots to discover allowed directories/repos:

```typescript
// TypeScript (filesystem)
const response = await server.server.listRoots();
// response.roots -> Root[] with { uri, name? }
```

```python
# Python (git)
roots_result: ListRootsResult = await session.list_roots()
for root in roots_result.roots:
    path = root.uri.path
```

### 6. Error Handling Patterns

```typescript
// TypeScript: throw Error, SDK converts to MCP error response
throw new Error("Access denied - path outside allowed directories");
```

```python
# Python: raise McpError with ErrorData
from mcp.shared.exceptions import McpError
from mcp.types import ErrorData, INVALID_PARAMS, INTERNAL_ERROR

raise McpError(ErrorData(code=INVALID_PARAMS, message="URL is required"))
```

### 7. Graceful Degradation

Filesystem server: if none of the specified directories are accessible, exits with code 1. But if started with no args and client supports Roots, waits for client to provide roots.

Memory server: if JSONL file doesn't exist (ENOENT), returns empty graph instead of crashing.

---

## Configuration & Setup

### Claude Desktop Config (Windows)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\user\\Documents"]
    },
    "memory": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-memory"],
      "env": { "MEMORY_FILE_PATH": "C:\\path\\to\\memory.jsonl" }
    },
    "sequential-thinking": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "C:\\path\\to\\repo"]
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}
```

### Environment Variables

| Server | Variable | Purpose |
|---|---|---|
| memory | `MEMORY_FILE_PATH` | Override JSONL storage path |
| sequentialthinking | `DISABLE_THOUGHT_LOGGING` | Set to "true" to suppress console output |
| fetch | via CLI flag `--ignore-robots-txt` | Skip robots.txt enforcement |
| fetch | via CLI flag `--proxy-url` | HTTP proxy |

### Building TypeScript Servers

```bash
# Single server
cd src/<server> && npm ci && npm run build && npm test

# All from root
npm install && npm run build
```

### Building Python Servers

```bash
cd src/<server>
uv sync --frozen --all-extras --dev
uv run pytest        # tests
uv run pyright       # type check
uv run ruff check .  # lint
uv build             # package
```

### CI/CD Pipeline

Dynamic matrix strategy using `find` + `jq` to detect all `package.json` / `pyproject.toml` under `src/`. Stages: `detect-packages` -> `test` -> `build` -> `publish` (on release events only). TypeScript publishes to npm, Python uses PyPI trusted publishing.

---

## What We Can Reuse

### For Our AI Agency System

**1. Memory Server as Agent Memory Backend**

The `KnowledgeGraphManager` pattern is directly reusable as a lightweight agent memory system. JSONL is append-friendly, human-readable, and requires no database:

```typescript
// Reuse this pattern for agent session memory
const manager = new KnowledgeGraphManager("/path/to/agent-memory.jsonl");
await manager.createEntities([{ name: "client-X", entityType: "Client", observations: ["Vietnamese SME", "needs email automation"] }]);
await manager.createRelations([{ from: "client-X", to: "campaign-Y", relationType: "has_campaign" }]);
const results = await manager.searchNodes("email automation");
```

**2. Path Validation Pattern**

The `validatePath()` function with symlink resolution and atomic writes is production-quality security code for any file-handling MCP server we build.

**3. Tool Annotation System**

Always annotate tools with `readOnlyHint`, `idempotentHint`, `destructiveHint`. This enables clients to display appropriate warnings and enables safer agent orchestration.

**4. Sequential Thinking for Complex Tasks**

Use `@modelcontextprotocol/server-sequential-thinking` for any task requiring multi-step reasoning (campaign planning, client analysis, system design). Call with `thoughtNumber` 1, `nextThoughtNeeded: true` until the final thought.

**5. Fetch Server for Web Research**

Use `mcp-server-fetch` for competitive analysis, trending topic research, Vietnamese market news. Handles robots.txt automatically, converts HTML to Markdown for LLM consumption.

**6. Git Server for Code Projects**

Use `mcp-server-git` during any project development session - gives LLM direct read access to the codebase without needing to explain file structures.

### Reusable Code Patterns

```typescript
// Pattern: Atomic file write (prevent race conditions)
const tempPath = `${filePath}.${randomBytes(16).toString('hex')}.tmp`;
await fs.writeFile(tempPath, content, 'utf-8');
await fs.rename(tempPath, filePath);

// Pattern: Zod coercion for boolean strings (client compat)
const coercedBoolean = z.preprocess((val) => {
  if (typeof val === "string") {
    if (val.toLowerCase() === "true") return true;
    if (val.toLowerCase() === "false") return false;
  }
  return val;
}, z.boolean());

// Pattern: Dual content response
return {
  content: [{ type: "text" as const, text: JSON.stringify(result) }],
  structuredContent: { ...result }
};
```

---

## Lessons & Best Practices

### Security

1. **Never trust user-provided paths** - always validate against an allowlist, resolve symlinks, check parent directories for new files.
2. **Atomic writes** - use temp file + rename to prevent TOCTOU race conditions, especially important when symlinks could be injected between validation and write.
3. **Injection prevention** - reject any user input that starts with `-` when it will be used as a CLI argument (git server pattern). Always use `--` separator before filenames.
4. **Symlink resolution** - call `fs.realpath()` and re-validate the resolved path, not just the user-supplied path.

### Architecture

5. **Separate concerns**: keep `lib.ts` for pure functions and state, `index.ts` for server/tool registration. Makes testing much easier.
6. **Stdio is the only transport** for local servers. SSE is deprecated. Streamable HTTP is for remote/hosted servers.
7. **Both content AND structuredContent** - always return both for TypeScript servers. `content` is for backward compat, `structuredContent` is for typed clients.
8. **MCP Roots over hardcoded paths** - design servers to accept directories via MCP Roots protocol first, CLI args as fallback. This enables dynamic reconfiguration without restart.

### Developer Experience

9. **Use `console.error()` exclusively** - stdout is sacred for the MCP wire protocol. Any debug output to stdout will corrupt the session.
10. **Verb-first kebab-case tool names** - `get-file-info` not `file-info`, `create-entity` not `entity-create`. This makes tool discovery more intuitive.
11. **Rich descriptions in inputSchema** - each parameter's `.describe()` is surfaced to the LLM. More context = better tool calling accuracy.
12. **Zod coercion for client compatibility** - some MCP clients send numbers/booleans as strings. Use `z.coerce.number()` and custom preprocess for booleans.
13. **Support both old and new tool names** - the filesystem server keeps `read_file` (deprecated) alongside `read_text_file` for backward compatibility. Shadow both to the same handler.

### Performance

14. **Batch operations** - `read_multiple_files` uses `Promise.all()` for parallel reads, per-file error handling prevents one failure from blocking others.
15. **Streaming for large files** - `tailFile()` reads chunks from EOF backwards (1KB at a time) - memory-efficient for large log files.
16. **JSONL over JSON** - the memory server uses JSONL (one JSON object per line) instead of a monolithic JSON array. This is more append-friendly and easier to stream/parse incrementally.

### Testing

17. **vitest for TypeScript** - fast, native ES module support, good coverage tooling via `@vitest/coverage-v8`.
18. **pytest-asyncio for Python** - set `asyncio_mode = "auto"` in `pyproject.toml` to avoid decorating every async test.
19. **Test with a real MCP client** - the PR checklist requires testing changes with an actual LLM client, not just unit tests.
