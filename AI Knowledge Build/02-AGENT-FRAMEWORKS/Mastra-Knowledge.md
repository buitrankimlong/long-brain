---
tags:
  - mastra
  - agent-framework
  - typescript
  - ai-agents
  - workflows
  - rag
  - mcp
  - memory
  - tools
  - langchain-alternative
  - production-ready
created: 2026-05-09
source: mastra GitHub repo (mastra-ai/mastra), YC W25
license: Apache-2.0 (core), Enterprise License (ee/ dirs)
---

# Mastra - Comprehensive Knowledge File

## Overview & Architecture

### What Is Mastra

Mastra is a **TypeScript-first AI agent framework** for building production-grade AI applications. It is a YC W25 company positioned as the modern alternative to LangChain/LangGraph for TypeScript developers. It abstracts everything needed from prototyping to production: agents, workflows, memory, RAG, tools, evals, MCP servers, and observability — all wired together through a central `Mastra` config hub.

### Core Design Philosophy

- **Modular but unified**: Every capability is a separate package (`@mastra/core`, `@mastra/memory`, `@mastra/rag`, `@mastra/mcp`, etc.) but they all plug into one central `Mastra` class via dependency injection.
- **TypeScript-first with Zod schemas**: Every input/output is typed via Zod schemas. The framework infers types from schemas at the type level.
- **Graph-based workflow engine**: Workflows are DAGs with `.then()`, `.branch()`, `.parallel()`, `.foreach()` — with suspend/resume for human-in-the-loop.
- **MCP-native**: Both a server (expose tools/agents as MCP) and a client (consume external MCP servers) are first-class citizens.
- **Pluggable storage backends**: 20+ vector stores, relational stores (LibSQL, PostgreSQL, DuckDB, MongoDB, Redis, etc.) with unified interfaces.

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mastra (central hub)                        │
│  agents | workflows | tools | processors | mcpServers |         │
│  storage | observability | channels | backgroundTasks           │
├─────────────────────────────────────────────────────────────────┤
│  Agent          │  Workflow          │  MCPServer/MCPClient      │
│  - instructions │  - createStep()    │  - stdio transport        │
│  - tools        │  - .then()         │  - SSE transport          │
│  - memory       │  - .branch()       │  - StreamableHTTP         │
│  - voice        │  - .parallel()     │                           │
│  - scorers      │  - suspend/resume  │                           │
│  - processors   │  - scheduler       │                           │
├─────────────────────────────────────────────────────────────────┤
│  Memory (MastraMemory)   │  RAG (MDocument + vector tools)       │
│  - working memory        │  - chunking strategies                │
│  - semantic recall       │  - metadata extraction                │
│  - observational memory  │  - vector query tool                  │
│  - thread/resource model │  - graph RAG                          │
├─────────────────────────────────────────────────────────────────┤
│  Storage (pluggable)                                             │
│  LibSQL | PG | DuckDB | MongoDB | Redis | S3 | Pinecone | etc.  │
└─────────────────────────────────────────────────────────────────┘
```

### Repo Structure (Monorepo - Turborepo + pnpm)

```
mastra/
├── packages/
│   ├── core/src/           # Central package - all abstractions
│   │   ├── agent/          # Agent class, message list, save queue
│   │   ├── workflows/      # Workflow, Step, execution engine
│   │   ├── tools/          # Tool class, createTool()
│   │   ├── memory/         # MastraMemory abstract class
│   │   ├── mcp/            # MCPServerBase abstract class
│   │   ├── llm/            # Model routing, LLM abstractions
│   │   ├── mastra/         # Mastra central config class
│   │   ├── storage/        # Pluggable storage interfaces
│   │   ├── vector/         # Vector store interface
│   │   ├── evals/          # Scorer/eval framework
│   │   └── processors/     # Input/output processors
│   ├── memory/             # @mastra/memory - concrete Memory implementation
│   ├── rag/                # @mastra/rag - RAG pipeline tools
│   ├── mcp/                # @mastra/mcp - MCPServer + MCPClient
│   └── evals/              # @mastra/evals - prebuilt scorers
├── stores/                 # 20+ storage adapters (pg, libsql, pinecone, etc.)
├── examples/agent/         # Full reference example
└── ee/                     # Enterprise features (separate license)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (strict mode) |
| Schema validation | Zod v3 + v4 (supports both) |
| LLM abstraction | Vercel AI SDK v4 + v5 (dual support) |
| LLM providers | 40+ via model routing (`openai/gpt-4`, `anthropic/claude-3-5-sonnet`) |
| Build system | Turborepo + pnpm workspaces |
| Testing | Vitest (colocated with source) |
| MCP protocol | @modelcontextprotocol/sdk |
| Vector stores | pgvector, Pinecone, Qdrant, Chroma, Weaviate, Elasticsearch, + 15 more |
| Relational stores | LibSQL, PostgreSQL, DuckDB, MongoDB, Redis, DynamoDB, Convex |
| Observability | OpenTelemetry-based + DuckDB for local tracing |
| Bundler | tsup |
| Server adapters | Hono (default), Express, Fastify, Next.js |

---

## Key Code Patterns (with Snippets)

### 1. Central Mastra Instance (Dependency Injection Hub)

```typescript
import { Mastra } from '@mastra/core/mastra';
import { MastraCompositeStore } from '@mastra/core/storage';
import { LibSQLStore } from '@mastra/libsql';

const storage = new LibSQLStore({
  id: 'mastra-storage',
  url: 'file:./mastra.db',
});

export const mastra = new Mastra({
  agents: { chefAgent, networkAgent },
  workflows: { myWorkflow, findUserWorkflow },
  processors: { moderationProcessor },
  mcpServers: { myMcpServer, ...mcpClient.toMCPServerProxies() },
  storage,
  observability: new Observability({ configs: { default: { serviceName: 'app' } } }),
  backgroundTasks: { enabled: true, globalConcurrency: 10 },
  channels: { slack: new SlackProvider() },
});
```

### 2. Agent Definition

```typescript
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';

// Basic static agent
const chefAgent = new Agent({
  id: 'chef-agent',
  name: 'Chef Agent',
  description: 'Helps you cook meals.',
  instructions: `You are Michel, a practical home chef...`,
  model: 'openai/gpt-4.1-mini',   // string shorthand - model routing
  tools: { cookingTool, weatherTool },
  workflows: { myWorkflow },
  memory: new Memory(),
});

// Dynamic agent - instructions/model/tools resolved per request via requestContext
const dynamicAgent = new Agent({
  id: 'dynamic-agent',
  instructions: ({ requestContext }) =>
    requestContext.get('premium') ? 'Expert mode instructions' : 'Basic instructions',
  model: ({ requestContext }) =>
    requestContext.get('premium') ? 'openai/gpt-4.1' : 'openai/gpt-4.1-mini',
  tools: ({ requestContext }) => ({
    cookingTool,
    ...(requestContext.get('premium') ? { webSearch: openai.tools.webSearchPreview() } : {}),
  }),
});

// Network agent - can delegate to other agents
const networkAgent = new Agent({
  id: 'network-agent',
  instructions: 'You manage several sub-agents. Delegate appropriately.',
  model: 'openai/gpt-4.1-mini',
  agents: { weatherAgent, researchAgent },  // sub-agent delegation
  workflows: { myWorkflow },
  memory,
  defaultNetworkOptions: {
    autoResumeSuspendedTools: true,
    completion: {
      scorers: [myScorer],
      strategy: 'all',
    },
  },
});
```

### 3. Tool Definition

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string(),
    units: z.enum(['celsius', 'fahrenheit']).optional(),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    condition: z.string(),
  }),
  execute: async (inputData, context) => {
    // context.mastra gives access to storage, logger etc.
    return await fetchWeather(inputData.location);
  },
});

// Tool requiring human approval (HITL)
const deleteFileTool = createTool({
  id: 'delete-file',
  description: 'Delete a file from storage',
  requireApproval: true,
  inputSchema: z.object({ filepath: z.string() }),
  execute: async (inputData) => {
    await fs.unlink(inputData.filepath);
    return { deleted: true };
  },
});
```

### 4. Workflow Definition (Sequential)

```typescript
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const step1 = createStep({
  id: 'my-step',
  inputSchema: z.object({ ingredient: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  requestContextSchema: z.object({ userId: z.string() }),
  execute: async ({ inputData, requestContext }) => {
    const userId = requestContext?.get('userId');
    return { result: `${inputData.ingredient} for ${userId}` };
  },
});

const step2 = createStep({
  id: 'enrich-step',
  inputSchema: z.object({ result: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData }) => ({ result: inputData.result + ' enriched' }),
});

export const myWorkflow = createWorkflow({
  id: 'recipe-maker',
  inputSchema: z.object({ ingredient: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  requestContextSchema: z.object({ userId: z.string() }),
})
  .then(step1)
  .then(step2)
  .commit();
```

### 5. Workflow - Suspend/Resume (Human-in-the-Loop)

```typescript
const suspendableStep = createStep({
  id: 'await-approval',
  inputSchema: z.object({ amount: z.number() }),
  outputSchema: z.object({ approved: z.boolean() }),
  suspendSchema: z.object({ reason: z.string() }),
  resumeSchema: z.object({ approved: z.boolean() }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData) {
      // Pause here - persist state to storage, notify user
      return await suspend({ reason: `Approve payment of $${inputData.amount}?` });
    }
    return { approved: resumeData.approved };
  },
});
```

### 6. Workflow - Branch and Parallel

```typescript
// Branch (conditional routing)
createWorkflow({ id: 'branching', inputSchema, outputSchema })
  .then(step1)
  .branch([
    [({ inputData }) => inputData.text.length < 100, shortTextStep],
    [({ inputData }) => inputData.text.length >= 100, longTextStep],
  ])
  .then(finalStep)
  .commit();

// Parallel execution
createWorkflow({ id: 'parallel-check', inputSchema, outputSchema })
  .then(validateStep)
  .parallel([piiCheckStep, toxicityCheckStep, spamCheckStep])
  .then(aggregateStep)
  .commit();

// Loop
createWorkflow({ id: 'loop-workflow', inputSchema, outputSchema })
  .dowhile(processStep, ({ outputData }) => outputData.count < 5)
  .commit();
```

### 7. Memory Setup

```typescript
import { Memory } from '@mastra/memory';

const memory = new Memory({
  options: {
    lastMessages: 20,           // sliding window
    workingMemory: {
      enabled: true,
      template: `
# User Profile
- Name:
- Preferences:
- Goals:
`,
    },
    semanticRecall: {
      topK: 5,                  // number of semantically similar messages to retrieve
      messageRange: 2,          // messages around each hit
    },
    generateTitle: true,        // auto-generate thread titles
  },
  // vector store required for semanticRecall
  vector: pgVectorStore,
  embedder: openaiEmbedder,
});

// Attach memory to agent
const agent = new Agent({
  id: 'agent-with-memory',
  memory,
  // ... rest of config
});

// Call agent with thread context
await agent.generate('Hello!', {
  resourceId: 'user-123',    // identifies the user/resource
  threadId: 'conv-456',      // identifies the conversation thread
});
```

### 8. RAG Pipeline

```typescript
import { MDocument } from '@mastra/rag';
import { createVectorQueryTool } from '@mastra/rag';
import { openai } from '@ai-sdk/openai';

// Step 1: Chunk documents
const doc = MDocument.fromMarkdown(markdownContent);
await doc.chunk({
  strategy: 'recursive',
  size: 512,
  overlap: 50,
});

// Optionally extract metadata
await doc.extractMetadata({ title: true, summary: true, keywords: true });

const chunks = doc.getDocs();

// Step 2: Embed and store in vector DB
// (use your vector store adapter, e.g., @mastra/pg)
await vectorStore.upsert({ indexName: 'docs', vectors: embeddings });

// Step 3: Create a vector query tool for agents
const ragTool = createVectorQueryTool({
  vectorStoreName: 'pg',
  indexName: 'docs',
  model: openai.embedding('text-embedding-3-small'),
  enableFilter: true,
  topK: 5,
});

// Step 4: Give tool to agent
const ragAgent = new Agent({
  id: 'rag-agent',
  model: 'openai/gpt-4.1',
  tools: { ragTool },
  instructions: 'Use the provided knowledge base to answer questions accurately.',
});
```

Supported chunk strategies: `recursive`, `character`, `token`, `sentence`, `markdown`, `html`, `json`, `latex`, `semantic-markdown`.

### 9. MCP Server (Expose Mastra as MCP)

```typescript
import { MCPServer } from '@mastra/mcp';

const server = new MCPServer({
  name: 'My AI Server',
  version: '1.0.0',
  tools: { weatherTool, searchTool },
  agents: { chefAgent },       // agents exposed as tools
  workflows: { myWorkflow },   // workflows exposed as tools
});

// Start as subprocess (stdio) - for Claude Desktop / Cursor
await server.startStdio();

// Or start as HTTP (SSE or StreamableHTTP) - for web clients
await server.startSSE({ port: 3001 });
```

### 10. MCP Client (Consume External MCP)

```typescript
import { MCPClient } from '@mastra/mcp';

const mcpClient = new MCPClient({
  servers: {
    filesystem: {
      command: 'npx',
      args: ['@modelcontextprotocol/server-filesystem', '/path'],
    },
    'remote-server': {
      url: 'https://my-mcp-server.com/mcp',
      transport: 'http-stream',
    },
  },
});

// Use client tools in an agent
const tools = await mcpClient.getTools();
const agent = new Agent({ tools, model: 'openai/gpt-4.1-mini', instructions: '...' });

// Expose external MCP servers in Mastra's studio
export const mastra = new Mastra({
  mcpServers: {
    ...mcpClient.toMCPServerProxies(),
  },
});
```

### 11. Processors (Input/Output Middleware)

```typescript
import { ModerationProcessor } from '@mastra/core/processors';

// Built-in moderation processor
const moderationProcessor = new ModerationProcessor({
  model: 'openai/gpt-4.1-nano',
  categories: ['hate', 'harassment', 'violence'],
  threshold: 0.7,
  strategy: 'block',       // block | warn | log
});

// Apply as agent input processor
const safeAgent = new Agent({
  id: 'safe-agent',
  model: 'openai/gpt-4.1-mini',
  inputProcessors: [moderationProcessor],
  outputProcessors: [responseQualityProcessor],
  instructions: '...',
});
```

### 12. Evals / Scorers

```typescript
import { createScorer } from '@mastra/core/evals';
import { createAnswerRelevancyScorer } from '@mastra/evals/scorers/prebuilt';

// Custom scorer
const myScorer = createScorer({
  id: 'accuracy-scorer',
  name: 'Accuracy',
  description: 'Checks response accuracy',
}).generateScore(({ output }) => {
  // Return 0.0 to 1.0
  return output.includes('correct answer') ? 1 : 0;
});

// Prebuilt scorer
const relevancyScorer = createAnswerRelevancyScorer();

// Attach to agent (sampled scoring)
const evalAgent = new Agent({
  scorers: {
    relevancy: { scorer: relevancyScorer, sampling: { rate: 0.1, type: 'ratio' } },
  },
  // ...
});
```

---

## Configuration & Setup

### Installation

```bash
# Quick start (recommended)
npm create mastra@latest

# Manual
npm install @mastra/core @mastra/memory @mastra/rag @mastra/mcp
npm install @ai-sdk/openai zod
```

### Project Layout (Recommended)

```
src/
└── mastra/
    ├── index.ts          # Mastra instance
    ├── agents/           # Agent definitions
    ├── workflows/        # Workflow definitions
    ├── tools/            # Tool definitions
    ├── mcp/              # MCP server/client
    └── processors/       # Custom processors
```

### Environment Variables

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...   # for @mastra/pg
MASTRA_BASE_URL=http://localhost:4111
```

### Key Storage Packages

| Package | Use Case |
|---------|----------|
| `@mastra/libsql` | SQLite/Turso - dev and lightweight prod |
| `@mastra/pg` | PostgreSQL + pgvector - production default |
| `@mastra/duckdb` | Analytics / observability data |
| `@mastra/redis` | Caching, pub/sub |
| `@mastra/pinecone` | Managed vector search |
| `@mastra/qdrant` | Self-hosted vector search |
| `@mastra/mongodb` | Document storage with vector |

### Model String Format

Mastra uses a `provider/model-id` string format for LLM routing:

```typescript
model: 'openai/gpt-4.1'
model: 'openai/gpt-4.1-mini'
model: 'anthropic/claude-sonnet-4-5'
model: 'google/gemini-2.5-pro'
model: 'groq/llama-3.3-70b-versatile'
```

This routes through Vercel AI SDK providers behind the scenes. You can also pass raw `LanguageModel` instances from `@ai-sdk/*` packages.

---

## API & Integration Patterns

### Calling Agents Programmatically

```typescript
// Text generation
const result = await chefAgent.generate('What can I make with eggs?', {
  resourceId: 'user-123',
  threadId: 'thread-456',
  requestContext: { userId: 'user-123', tier: 'premium' },
});
console.log(result.text);

// Streaming
const stream = await chefAgent.stream('What can I make with eggs?', {
  resourceId: 'user-123',
  threadId: 'thread-456',
});
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}

// Structured output
const structured = await chefAgent.generate('Suggest a recipe', {
  output: z.object({ name: z.string(), ingredients: z.array(z.string()) }),
});
console.log(structured.object); // typed as { name: string; ingredients: string[] }
```

### Running Workflows

```typescript
const run = await myWorkflow.createRun();
const result = await run.start({
  inputData: { ingredient: 'eggs' },
  requestContext: { userId: 'user-123' },
});

// Handle suspend/resume
if (result.status === 'suspended') {
  const resumed = await run.resume({
    stepId: 'await-approval',
    resumeData: { approved: true },
  });
}
```

### Serving via HTTP (Mastra Server)

Mastra auto-generates REST endpoints when registered with a server adapter:

```
GET  /agents              - list agents
POST /agents/:id/generate - invoke agent
POST /agents/:id/stream   - streaming invoke
GET  /workflows           - list workflows
POST /workflows/:id/run   - run workflow
GET  /mcp                 - MCP endpoint (SSE or StreamableHTTP)
```

### Composite Storage (Multiple Backends)

```typescript
const storage = new MastraCompositeStore({
  id: 'composite',
  default: libsqlStore,          // primary store
  domains: {
    observability: duckdbStore.observability,  // analytics data goes to DuckDB
  },
});
```

### Scheduled Workflows

```typescript
const heartbeatWorkflow = createWorkflow({
  id: 'heartbeat',
  schedule: { cron: '*/5 * * * *' },  // every 5 minutes
  inputSchema: z.object({}),
  outputSchema: z.object({ ran: z.boolean() }),
})
  .then(pingStep)
  .commit();
```

---

## What We Can Reuse

### High-Value Reusable Patterns

1. **Mastra hub pattern**: The `new Mastra({ agents, workflows, storage })` dependency injection hub is a clean pattern we can apply to our own projects. All primitives share the same Mastra context.

2. **createTool() with Zod validation**: `createTool` with `inputSchema` + `outputSchema` is the cleanest tool pattern we have seen. Provides type-safety, auto-documentation, and validation in one call. We should use this pattern directly.

3. **Workflow chaining API**: `.then().branch().parallel().commit()` is highly readable. This is a strong pattern for building multi-step marketing automation pipelines (e.g., lead qualification → enrichment → email → CRM update).

4. **Suspend/resume for HITL**: The `suspend({ reason })` / `resumeData` pattern is exactly what we need for approval workflows (content approval, deal approval, human review of AI-drafted emails).

5. **Memory with working memory + semantic recall**: The `workingMemory.template` approach (structured markdown template for user profile) is immediately applicable for our CRM agents. No need to build from scratch.

6. **Dynamic agent config via requestContext**: Instructions, model, and tools can be functions that receive `requestContext`. This enables multi-tenant agents where the same agent class adapts to different clients without code duplication.

7. **Processor middleware pattern**: Input/output processors (moderation, PII detection, logging) that wrap agents are directly usable for our compliance requirements in Vietnam market.

8. **MDocument RAG pipeline**: `MDocument.fromMarkdown().chunk({ strategy: 'recursive' }).extractMetadata()` is a clean pipeline for indexing content. Direct reuse for our knowledge base system.

9. **createVectorQueryTool**: Pre-built tool to give agents RAG capability. Drop into any agent with one line.

10. **MCPClient.toMCPServerProxies()**: Bridge pattern to expose external MCP servers through Mastra's UI. Useful for integrating third-party tools.

### Packages to Install and Use Directly

```bash
npm install @mastra/core         # Core agents, workflows, tools
npm install @mastra/memory       # Conversation memory
npm install @mastra/rag          # RAG pipeline + vector tools
npm install @mastra/mcp          # MCP server + client
npm install @mastra/libsql       # LibSQL store (start here)
npm install @mastra/pg           # PostgreSQL store (production)
npm install @mastra/evals        # Pre-built scorers
```

### Adapting for Vietnam Market / Agency Use Cases

- **Marketing automation**: Use Workflow `.parallel()` to run SEO analysis + competitor research + keyword extraction simultaneously.
- **Lead qualification**: Workflow with suspend/resume for human review before moving lead to sales pipeline.
- **Content moderation**: `ModerationProcessor` is configurable for any harm categories — useful for user-generated content in Vietnamese platforms.
- **Multi-client agent**: `dynamicAgent` pattern (dynamic instructions + model selection per requestContext) allows one agent definition to serve multiple client tiers.
- **CRM memory**: Memory with `workingMemory.template` tracking user name, company, deal stage, preferences across conversations.

---

## Lessons & Best Practices

### Architecture Lessons

1. **Start with `@mastra/libsql`** (SQLite), graduate to `@mastra/pg` when you need pgvector for semantic recall. The interfaces are identical — only the constructor changes.

2. **`MastraCompositeStore` for multi-backend**: Keep relational data in LibSQL/PG and observability/analytics in DuckDB. The composite store routes by domain automatically.

3. **Keep workflows small and composable**: The `nestedWorkflow` pattern (workflow inside workflow via `.then(otherWorkflow)`) is a first-class feature. Build small, testable workflow units and compose them.

4. **Use `requestContextSchema` on workflows for type safety**: Define what runtime context a workflow expects. The framework validates and types it end-to-end.

5. **Processors > Custom middleware**: Instead of wrapping agents manually, use the `inputProcessors` / `outputProcessors` arrays. Built-ins include: `PIIDetector`, `LanguageDetector`, `PromptInjectionDetector`, `ModerationProcessor`.

### Model Routing Best Practices

6. **Use model strings, not instances**: `'openai/gpt-4.1-mini'` is more maintainable than `openai('gpt-4o-mini')`. Model routing handles provider selection automatically.

7. **Dynamic model selection per request**: Use the function form of `model` in Agent config to route to cheaper models for simple requests and expensive models for complex ones. Aligns with our 5x cost reduction goal.

8. **Model fallbacks**: The framework supports `ModelFallbacks` — arrays of models with retry counts. Configure fallback chains for reliability.

### Memory Best Practices

9. **Always set `resourceId` + `threadId`**: These two fields are how Mastra organizes memory. `resourceId` = user/customer, `threadId` = conversation. Without them, memory does not persist between calls.

10. **Semantic recall requires a vector store**: `semanticRecall: { topK: 5 }` silently no-ops without a configured vector store. Always pair it with `vector: pgVectorStore`.

11. **Working memory template is freeform markdown**: Design it to capture exactly what your agent needs to know about a user. Keep it under ~500 tokens to avoid inflating every request.

### Workflow Best Practices

12. **Always `.commit()` workflows**: Forgetting `.commit()` at the end of a workflow chain is a common mistake. The workflow is not registered until committed.

13. **`suspend()` persists state automatically**: Mastra uses the configured storage to save workflow run state on suspend. You can resume days later from any server instance.

14. **`bail(result)` for early exit**: Inside a step `execute` function, call `bail(result)` to exit the workflow early with a result without throwing an error.

15. **`getStepResult(step)` for typed access**: Within `execute`, use `getStepResult(stepRef)` to get the typed output of a previous step (not just `inputData` which only has the direct predecessor's output).

### MCP Best Practices

16. **`startStdio()` for IDE integrations**: Use stdio transport for Claude Desktop, Cursor, Windsurf. Use `startSSE()` or StreamableHTTP for web-based clients.

17. **`toMCPServerProxies()`**: When you have external MCP clients, this method converts each client connection into a `MCPServerBase` that can be registered in Mastra alongside native MCPServer instances.

18. **Expose agents as MCP tools**: In `MCPServer` config, listing an agent in `agents: { myAgent }` automatically exposes it as a callable tool to any MCP client.

### Developer Experience

19. **`npm create mastra@latest` for scaffolding**: Always start a new project with the CLI. It sets up the recommended folder structure, tsconfig, and package.json scripts.

20. **Changeset-based versioning**: The repo uses `@changesets/cli` for package versioning. If contributing, run `pnpm changeset -s -m "message" --patch @mastra/core` before PRs.

21. **Dual Zod version support**: Mastra supports both Zod v3 and v4 schemas (`zod/v3` and `zod/v4`). Use `zod/v4` for new code. Old integrations using Zod v3 still work.

22. **Vitest for testing**: Tests are colocated with source (`*.test.ts`). Run `pnpm --filter ./packages/core test` for narrowest scope — do not run repo-wide tests during development.
