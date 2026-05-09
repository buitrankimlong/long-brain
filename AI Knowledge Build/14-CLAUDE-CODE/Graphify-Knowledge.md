# Graphify - Complete Knowledge Extraction

> Source: `C:\AI Build Learning\graphify\` (v0.7.10)
> PyPI package: `graphifyy` (double-y). CLI command: `graphify`
> Repository: https://github.com/safishamsi/graphify
> Author: Safi Shamsi

---

## What Graphify Does

Graphify turns any folder of files (code, docs, PDFs, images, videos) into a **queryable knowledge graph** with community detection, confidence scoring, and three outputs:

1. **graph.html** - Interactive browser visualization (click nodes, filter, search)
2. **GRAPH_REPORT.md** - Human-readable audit trail with god nodes, surprising connections, suggested questions
3. **graph.json** - Full NetworkX node-link format graph for programmatic querying

The core value proposition: **up to 71.5x fewer tokens per query** compared to reading raw files directly. After the initial extraction cost, every subsequent query reads the compact graph instead of raw source files.

---

## How It Works - The Three Passes

### Pass 1: Code Structure (FREE, no API calls)
- Uses **tree-sitter** to parse code files locally
- Extracts: classes, functions, imports, call graphs, inline comments (`# NOTE:`, `# WHY:`, `# HACK:`)
- Runs in parallel using `ProcessPoolExecutor` (bypasses Python GIL)
- 28+ languages supported via tree-sitter grammars
- SQL files get special treatment: tables, views, foreign keys, JOINs extracted deterministically

### Pass 2: Video/Audio (LOCAL, no API calls)
- Transcribed locally with **faster-whisper**
- Transcription prompt seeded with top god nodes from Pass 1 for domain focus
- Results cached - re-runs skip already-processed files

### Pass 3: Docs, Papers, Images (LLM subagents, costs tokens)
- Claude/Gemini/Kimi/OpenAI/Ollama/Bedrock runs in parallel over markdown, PDFs, images, transcripts
- Each subagent reads a batch of files, outputs JSON fragment: nodes, edges, group relationships
- Fragments merged into single graph
- Office files (.docx, .xlsx) converted to Markdown sidecars first
- Google Workspace shortcuts (.gdoc, .gsheet, .gslides) optionally exported via `gws` CLI

---

## Pipeline Architecture

```
detect() -> extract() -> build_graph() -> cluster() -> analyze() -> report() -> export()
```

Each stage is a single function in its own module. They communicate through plain Python dicts and NetworkX graphs - no shared state, no side effects outside `graphify-out/`.

### Module Breakdown

| Module | Function | Purpose |
|--------|----------|---------|
| `detect.py` | `detect(root)` | File discovery, type classification, corpus health checks |
| `extract.py` | `extract(path)` | Deterministic AST extraction via tree-sitter |
| `build.py` | `build(extractions)` | Assemble nodes+edges into NetworkX graph with dedup |
| `cluster.py` | `cluster(G)` | Leiden/Louvain community detection |
| `analyze.py` | `analyze(G)` | God nodes, surprising connections, suggested questions |
| `report.py` | `generate(...)` | Render GRAPH_REPORT.md |
| `export.py` | `to_json/to_html/to_svg/...` | HTML viz, Obsidian vault, GraphML, Neo4j Cypher |
| `cache.py` | `check_semantic_cache/save_semantic_cache` | SHA256-based file caching |
| `dedup.py` | `deduplicate_entities(...)` | Entity dedup: exact norm + MinHash/LSH + Jaro-Winkler |
| `llm.py` | `extract_files_direct(...)` | Direct LLM backends for headless extraction |
| `serve.py` | `serve(graph_path)` | MCP stdio server for tool-call access |
| `watch.py` | `watch(root)` | File watcher for auto-rebuild on changes |
| `hooks.py` | `install/uninstall` | Git post-commit/post-checkout hooks |
| `wiki.py` | `to_wiki(...)` | Wikipedia-style markdown articles from graph |
| `global_graph.py` | `global_add/remove/list` | Cross-project global graph at ~/.graphify/ |
| `benchmark.py` | `run_benchmark(...)` | Token reduction measurement |
| `ingest.py` | `ingest(url)` | Fetch URLs/papers/videos into corpus |
| `security.py` | Validation helpers | URL/path/label sanitization |
| `validate.py` | `validate_extraction(data)` | Schema enforcement for extraction output |

---

## 70x Token Savings - How It Works

The first run extracts and builds the graph (this costs tokens). Every subsequent query reads the compact graph instead of raw files. Benchmarks:

| Corpus | Files | Token Reduction |
|--------|-------|-----------------|
| Karpathy repos + papers + images | 52 | **71.5x** |
| graphify source + Transformer paper | 4 | **5.4x** |
| httpx (synthetic Python library) | 6 | ~1x (already fits context) |

Token reduction scales with corpus size. Small corpora already fit in context; the value there is structural clarity, not compression. At 50+ files the savings compound quickly.

The benchmark module (`benchmark.py`) measures this by:
1. Estimating full corpus token count (~133 tokens per 100 words)
2. Running BFS queries from best-matching nodes with depth=3
3. Calculating ratio: `corpus_tokens / avg_query_tokens`

---

## Supported Languages (28+)

Python, TypeScript, JavaScript, JSX, TSX, Go, Rust, Java, C, C++, Ruby, C#, Kotlin, Scala, PHP, Swift, Lua, Luau, Zig, PowerShell, Elixir, Objective-C, Julia, Vue, Svelte, Groovy/Gradle, SQL, Fortran (F90/F95/F03/F08), Dart, Verilog

### File Type Classification

| Type | Extensions |
|------|-----------|
| Code | `.py .ts .js .jsx .tsx .go .rs .java .c .cpp .rb .cs .kt .scala .php .swift .lua .luau .zig .ps1 .ex .m .jl .vue .svelte .groovy .gradle .sql .f90` + more |
| Docs | `.md .mdx .qmd .html .txt .rst .yaml .yml` |
| Office | `.docx .xlsx` (requires `[office]` extra) |
| Google Workspace | `.gdoc .gsheet .gslides` (opt-in) |
| PDFs | `.pdf` |
| Images | `.png .jpg .webp .gif .svg` |
| Video/Audio | `.mp4 .mov .mp3 .wav` + more (requires `[video]` extra) |

---

## Extraction Output Schema

Every extractor returns:

```json
{
  "nodes": [
    {
      "id": "unique_string",
      "label": "human name",
      "file_type": "code|document|paper|image|concept",
      "source_file": "path",
      "source_location": "L42"
    }
  ],
  "edges": [
    {
      "source": "id_a",
      "target": "id_b",
      "relation": "calls|imports|uses|implements|references|cites|semantically_similar_to",
      "confidence": "EXTRACTED|INFERRED|AMBIGUOUS",
      "confidence_score": 1.0
    }
  ],
  "hyperedges": []
}
```

### Confidence Labels

| Label | Meaning | Score |
|-------|---------|-------|
| EXTRACTED | Explicit in source (import, call, citation) | 1.0 |
| INFERRED | Reasonable deduction with rubric scores | 0.55 - 0.95 |
| AMBIGUOUS | Uncertain, flagged for human review | varies |

INFERRED confidence rubric:
- **0.95** - Near-certain (explicit cross-file reference, one plausible target)
- **0.85** - Strong evidence (naming + context align)
- **0.75** - Reasonable (contextual but not explicit)
- **0.65** - Weak (naming similarity only)
- **0.55** - Speculative

---

## Community Detection

Uses the **Leiden algorithm** (via graspologic) with Louvain fallback (built into NetworkX).

Key behaviors:
- No embeddings needed - semantic similarity edges from LLM extraction influence community shape directly
- Graph structure IS the similarity signal - no separate vector database
- Oversized communities (>25% of graph, min 10 nodes) auto-split via second Leiden pass
- Low-cohesion communities (<0.05 score, min 50 nodes) re-split to fix doc-hub pollution
- Cohesion score = ratio of actual intra-community edges to maximum possible

---

## Entity Deduplication Pipeline

Three-pass dedup in `dedup.py`:

1. **Exact normalization** - Lowercase + collapse non-alphanumeric to space
2. **MinHash/LSH blocking + Jaro-Winkler verification** - Only for high-entropy labels (>2.5 bits/char), merge threshold 92.0, same-community boost +5.0
3. **LLM tiebreaker** (opt-in via `--dedup-llm`) - Batch-resolves ambiguous pairs in 75-92 Jaro-Winkler score zone

Uses union-find for efficient merge tracking. Cross-project dedup is explicitly disabled (labels overlap by coincidence across repos).

---

## Integration with Claude Code

### Installation

```bash
uv tool install graphifyy && graphify install
# Windows: graphify install --platform windows
```

### Making Claude Code Always Use the Graph

```bash
graphify claude install
```

This writes config telling Claude Code to read `GRAPH_REPORT.md` before answering codebase questions. On platforms supporting hooks, a hook fires automatically before every file-read call.

### AGENTS.md Integration

When installed, Graphify adds to AGENTS.md:
```
Rules:
- Before answering architecture questions, read graphify-out/GRAPH_REPORT.md
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code, run `graphify update .` to keep graph current (AST-only, no API cost)
```

### Claude Code Skill Definition

Graphify registers as a Claude Code skill triggered by `/graphify`. The skill definition (`skill.md`, ~54KB) contains:
- Full pipeline orchestration logic
- Extraction prompt templates
- Batch processing with parallel subagents
- Cache management
- Report generation
- All output format handling

---

## Supported Platforms (15+)

| Platform | Install | Trigger |
|----------|---------|---------|
| Claude Code | `graphify install` | `/graphify` |
| Codex | `graphify install --platform codex` | `$graphify` |
| OpenCode | `graphify install --platform opencode` | `/graphify` |
| Cursor | `graphify cursor install` | `/graphify` |
| Gemini CLI | `graphify install --platform gemini` | `/graphify` |
| GitHub Copilot CLI | `graphify install --platform copilot` | `/graphify` |
| VS Code Copilot Chat | `graphify vscode install` | `/graphify` |
| Aider | `graphify install --platform aider` | `/graphify` |
| OpenClaw | `graphify install --platform claw` | `/graphify` |
| Factory Droid | `graphify install --platform droid` | `/graphify` |
| Trae | `graphify install --platform trae` | `/graphify` |
| Kiro IDE/CLI | `graphify kiro install` | `/graphify` |
| Pi | `graphify install --platform pi` | `/graphify` |
| Hermes | `graphify install --platform hermes` | `/graphify` |
| Google Antigravity | `graphify antigravity install` | `/graphify` |

---

## MCP Server

Graphify exposes the graph as an MCP (Model Context Protocol) server for structured tool-call access:

```bash
python -m graphify.serve graphify-out/graph.json
```

Available MCP tools:
- **query_graph** - BFS/DFS traversal from matching nodes, with token budget and context filtering
- **get_node** - Full details for a specific node
- **get_neighbors** - Direct neighbors with edge details and relation filtering
- **get_community** - All nodes in a community by ID
- **god_nodes** - Most connected nodes (core abstractions)
- **graph_stats** - Summary statistics and confidence breakdown
- **shortest_path** - Find path between two concepts

MCP resources exposed:
- `graphify://report` - Full GRAPH_REPORT.md
- `graphify://stats` - Node/edge/community counts
- `graphify://god-nodes` - Top 10 most-connected
- `graphify://surprises` - Cross-community surprising connections
- `graphify://audit` - Confidence breakdown
- `graphify://questions` - Suggested questions

---

## LLM Backends for Headless Extraction

The `llm.py` module supports direct API calls without Claude Code:

| Backend | Default Model | Pricing (per 1M tokens) |
|---------|--------------|------------------------|
| Claude | claude-sonnet-4-6 | $3 in / $15 out |
| Kimi | kimi-k2.6 | $0.74 in / $4.66 out |
| Gemini | gemini-3-flash-preview | $0.50 in / $3 out |
| OpenAI | gpt-4.1-mini | $0.40 in / $1.60 out |
| Ollama | qwen2.5-coder:7b | Free (local) |
| Bedrock | claude-3-5-sonnet | $3 in / $15 out (IAM auth) |

Auto-detection priority: gemini -> kimi -> claude -> openai -> bedrock -> ollama

Features:
- Token-budget-aware chunk packing (groups files by directory, 60K token default)
- Adaptive retry on truncation (splits chunks in half recursively, max depth 3)
- Parallel extraction via ThreadPoolExecutor (max 4 concurrent by default)
- `GRAPHIFY_MAX_OUTPUT_TOKENS` env var for dense corpora

---

## Caching System

### SHA256 File Cache
- Every extracted file fingerprinted by content hash
- Re-runs skip unchanged files entirely
- Cache stored in `graphify-out/cache/ast/` and `graphify-out/cache/semantic/`
- Separate subdirectories prevent AST/semantic collision
- For Markdown files, only body below YAML frontmatter is hashed (metadata changes don't invalidate)
- Path normalization handles Windows backslash vs POSIX forward slash

### Incremental Updates
- Manifest stores file mtimes + MD5 hashes
- Fast path: mtime unchanged = unchanged (no hash computed)
- Slow path: mtime bumped -> compare MD5 (catches sync tool mtime bumps)
- Deleted files tracked as "ghost nodes" for pruning

---

## Git Integration

### Hooks (`hooks.py`)
```bash
graphify hook install    # post-commit + post-checkout
graphify hook uninstall
graphify hook status
```

- Post-commit: auto-rebuilds AST-only graph in background (no API cost)
- Post-checkout: rebuilds when switching branches
- Runs detached (`nohup ... &`) so git returns immediately
- Skips during rebase/merge/cherry-pick
- Respects `core.hooksPath` (e.g., Husky)
- Git merge driver for graph.json prevents conflict markers

### Watch Mode
```bash
graphify watch ./src
```
- Uses watchdog for filesystem monitoring
- Code changes: immediate AST rebuild (no LLM)
- Doc/paper/image changes: writes `needs_update` flag, notifies user to run `/graphify --update`
- 3-second debounce by default

---

## Graph Analysis Features

### God Nodes
Most-connected real entities (file-level hub nodes excluded). These are the core abstractions everything flows through.

### Surprising Connections
Multi-file corpora: cross-file edges between real entities, scored by:
- Confidence weight (AMBIGUOUS > INFERRED > EXTRACTED)
- Cross file-type bonus (code-paper is more surprising than code-code)
- Cross-repo bonus (different top-level directory)
- Cross-community bonus (Leiden says structurally distant)
- Peripheral-to-hub bonus (low-degree node reaching god node)

Single-file corpora: cross-community edges via betweenness centrality.

### Suggested Questions
Auto-generated questions the graph is uniquely positioned to answer:
- AMBIGUOUS edges -> unresolved relationship questions
- Bridge nodes (high betweenness) -> cross-cutting concern questions
- God nodes with many INFERRED edges -> verification questions
- Isolated/weakly-connected nodes -> exploration questions
- Low-cohesion communities -> structural refactoring questions

### Graph Diff
Compare two graph snapshots: new nodes, removed nodes, new edges, removed edges with summary.

---

## Export Formats

| Format | Command/Flag | Description |
|--------|-------------|-------------|
| JSON | Default | NetworkX node-link format |
| HTML | Default | Interactive D3.js visualization (max 5000 nodes) |
| Obsidian | `--obsidian` | Vault with wiki links |
| Wiki | `--wiki` | Agent-crawlable markdown wiki (index.md + community articles) |
| SVG | `--svg` | Static graph image (requires matplotlib) |
| GraphML | `--graphml` | For Gephi/yEd |
| Neo4j | `--neo4j` | Cypher script for Neo4j import |
| Neo4j Push | `--neo4j-push bolt://...` | Direct push to Neo4j instance |

---

## Global Graph (Cross-Project)

Stored at `~/.graphify/global-graph.json`:

```bash
graphify global add graphify-out/graph.json myrepo   # register project
graphify global remove myrepo                         # remove project
graphify global list                                  # show all repos + stats
graphify global path                                  # print global graph path
```

Nodes are prefixed with `repo_tag::` to prevent collisions. Original IDs preserved as `local_id` attribute.

---

## Common Usage Patterns

### Basic Usage
```bash
/graphify .                        # Build graph for current folder
/graphify ./docs --update          # Re-extract only changed files
/graphify . --cluster-only         # Rerun clustering without re-extracting
/graphify . --no-viz               # Skip HTML, just report + JSON
/graphify . --wiki                 # Build markdown wiki from graph
```

### Querying
```bash
/graphify query "what connects auth to the database?"
/graphify path "UserService" "DatabasePool"
/graphify explain "RateLimiter"
```

### Adding External Content
```bash
/graphify add https://arxiv.org/abs/1706.03762   # Fetch paper
/graphify add <youtube-url>                       # Transcribe video
```

### Headless Extraction (CI/CD)
```bash
graphify extract ./docs --backend gemini
graphify extract ./docs --backend ollama
graphify extract ./docs --backend bedrock
graphify extract ./docs --dedup-llm      # LLM tiebreaker for ambiguous pairs
```

### Team Workflow
1. One person runs `/graphify .` and commits `graphify-out/`
2. Everyone pulls - their assistant reads the graph immediately
3. `graphify hook install` for auto-rebuild after each commit (AST only, free)
4. Run `/graphify --update` when docs/papers change

### Recommended .gitignore
```
graphify-out/manifest.json    # mtime-based, breaks after git clone
graphify-out/cost.json        # local only
# graphify-out/cache/         # optional: commit for speed, skip for repo size
```

---

## Privacy Model

- **Code files** - Processed locally via tree-sitter. Nothing leaves machine.
- **Video/audio** - Transcribed locally with faster-whisper. Nothing leaves machine.
- **Docs/PDFs/images** - Sent to configured LLM backend for semantic extraction.
- Sensitive files auto-detected and skipped (.env, .pem, credentials, tokens, etc.)
- No telemetry, no usage tracking, no analytics.

---

## Security Architecture

All external input passes through `security.py`:
- URLs: `validate_url()` (http/https only) + blocks file:// redirects
- Fetched content: `safe_fetch()` with size cap and timeout
- Graph file paths: `validate_graph_path()` (must resolve inside graphify-out/)
- Node labels: `sanitize_label()` (strips control chars, caps 256 chars, HTML-escapes)
- Ollama URL validation warns on non-loopback endpoints
- LLM response size capped at 10MB before JSON parsing

---

## Configuration Files

- `.graphifyignore` - Gitignore-syntax file exclusion (supports `!` negation)
- `.graphifyinclude` - Allowlist for hidden files/dirs to include
- `GRAPHIFY_OUT` env var - Override output directory name
- `GRAPHIFY_MAX_OUTPUT_TOKENS` - Raise output cap for dense corpora
- `GRAPHIFY_VIZ_NODE_LIMIT` - Override max nodes for HTML viz (default 5000)
- `GRAPHIFY_GOOGLE_WORKSPACE` - Enable Google Workspace file processing

---

## Dependencies

Core: `networkx`, `datasketch`, `rapidfuzz`, `tree-sitter>=0.23.0` + 25 tree-sitter language grammars

Optional extras:
- `[mcp]` - MCP server
- `[neo4j]` - Neo4j export
- `[pdf]` - PDF extraction (pypdf, markdownify)
- `[watch]` - File watching (watchdog)
- `[svg]` - SVG export (matplotlib)
- `[leiden]` - Better community detection (graspologic, Python <3.13)
- `[office]` - Office files (python-docx, openpyxl)
- `[google]` - Google Sheets (openpyxl)
- `[video]` - Video/audio (faster-whisper, yt-dlp)
- `[kimi]` / `[gemini]` / `[openai]` - LLM backends (openai, tiktoken)
- `[ollama]` - Local LLM (openai)
- `[bedrock]` - AWS Bedrock (boto3)
- `[sql]` - SQL extraction (tree-sitter-sql)
- `[all]` - Everything

---

## Key Design Decisions

1. **Tree-sitter for code extraction** - Deterministic, no LLM cost, 28+ languages, handles edge cases (shebangs, blade.php)
2. **Leiden over simpler algorithms** - Best community detection quality; Louvain fallback for compatibility
3. **SHA256 content-based caching** - Portable across machines, handles both AST and semantic extraction
4. **Node dedup at three layers** - Within-file (AST seen_ids), between-files (NetworkX idempotent add), semantic merge (explicit seen set)
5. **MinHash/LSH + Jaro-Winkler for fuzzy dedup** - Scalable blocking then precise verification
6. **Separate AST and semantic cache directories** - Prevents hash collisions between extraction types
7. **Background hook execution** - Git hooks run detached so commits return immediately
8. **Security-first design** - Input sanitization at every boundary, size caps on LLM responses, sensitive file detection

---

## Related Links

- [[14 Claude Code]] - Claude Code ecosystem overview
- Book: "The Memory Layer" by Safi Shamsi (companion guide)
- Penpax: Always-on knowledge graph layer built on graphify (upcoming product)
