---
tags: [knowledge, flowise, visual-builder, rag, chatflow, nodes, langchain, agents]
source_repo: Flowise
files_read: 18
---
# Flowise - Knowledge Extraction

## Overview & Architecture

Flowise is an open-source visual AI agent and workflow builder (v3.1.2) that lets developers create LLM-powered applications through a drag-and-drop canvas interface. Built as a monorepo with three core packages:

- **packages/server** - Node.js/Express backend with TypeORM, BullMQ job queues, and REST API
- **packages/ui** - React frontend using ReactFlow for the visual canvas
- **packages/components** - 25 node categories with 100+ integrations (LLMs, vector stores, tools, etc.)

**Execution model**: Chatflows are stored as serialized ReactFlow JSON (nodes + edges). At runtime, the server reconstructs a DAG, performs topological traversal from starting nodes to ending nodes, resolves variables at each depth level, and executes nodes sequentially while caching results for dependent nodes.

**Four flow types**: CHATFLOW (standard), AGENTFLOW (tool-calling agents), MULTIAGENT (multi-agent orchestration), ASSISTANT (OpenAI Assistants API wrapper).

Homepage: https://flowiseai.com | Requires Node.js >= 20.0.0

## Tech Stack & Dependencies

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+, TypeScript 5.4.5 |
| Package Manager | pnpm 10.26+ with Turborepo |
| Backend | Express.js, TypeORM, Passport (auth), Winston (logging) |
| Frontend | React, ReactFlow, Redux, Material UI |
| Database | SQLite (default), PostgreSQL, MySQL |
| Queue | BullMQ + Redis for async job processing |
| Monitoring | OpenTelemetry, PostHog metrics |
| Testing | Jest (unit), Cypress (E2E) |
| Build | TypeScript compiler + Gulp |

**LLM Provider SDKs**: OpenAI, Anthropic Claude, AWS Bedrock, Google Generative AI, Mistral, Groq, Cohere, Ollama, Replicate, DeepSeek, XAI, HuggingFace, IBM Watsonx

**Vector Store SDKs**: Pinecone, Qdrant, Weaviate, Chroma, Milvus, Elasticsearch, OpenSearch, Meilisearch

**Observability**: Langfuse, LangSmith, LangWatch, Lunary

## Node System (How Nodes Work)

Every node implements the `INode` interface with a declarative structure:

```typescript
// Core interface (simplified)
interface INode {
  label: string           // Display name
  name: string            // Unique identifier
  version: number         // Schema version
  type: string            // Output type (e.g., "AgentExecutor", "BaseRetriever")
  icon: string            // Icon file
  category: string        // Category for sidebar grouping
  baseClasses: string[]   // Type compatibility for edge connections
  inputs: INodeParams[]   // Input parameters (forms + connections)
  outputs: INodeOutputsValue[]  // Output ports
  credential?: INodeParams      // Credential configuration

  init?(nodeData: INodeData, input: string, options: ICommonObject): Promise<any>
  run?(nodeData: INodeData, input: string, options: ICommonObject): Promise<any>
}
```

**INodeParams** defines each input with:
- `type`: string, number, boolean, options, code, json, file, password
- `show`/`hide`: Conditional visibility based on other param values
- `acceptVariable`: Allow dynamic values from other nodes via `{{nodeId.data.instance}}`
- `additionalParams`: Moves to advanced settings panel
- `list`: Accepts multiple connections (e.g., tools array)

**25 Node Categories**:
agentflow, agents, analytic, cache, chains, chatmodels, documentloaders, embeddings, engine, graphs, llms, memory, moderation, multiagents, outputparsers, prompts, recordmanager, responsesynthesizer, retrievers, sequentialagents, speechtotext, textsplitters, tools, utilities, vectorstores

**Custom Tool pattern**: Users define tools via JSON with input schema and JavaScript function. Functions can use `$flow.sessionId`, `$flow.chatId`, `$vars.<name>` for runtime context, and `require()` for Node.js modules.

## Chatflow Architecture

A chatflow is a persisted ReactFlow graph stored in the `ChatFlow` entity:

**Entity columns**: id (UUID), name, flowData (serialized JSON), type (CHATFLOW|AGENTFLOW|MULTIAGENT|ASSISTANT), deployed (boolean), isPublic, apikeyid, chatbotConfig, apiConfig, analytic, speechToText, textToSpeech, followUpPrompts, mcpServerConfig, category, workspaceId

**Execution pipeline** (`buildChatflow.ts`):
1. Parse `flowData` JSON into nodes and edges
2. `constructGraphs()` - build directed graph from edges
3. `getEndingNodes()` - find terminal nodes (agents, chains, LLMs)
4. `getStartingNodes()` - BFS from ending node back to find entry points with depth queue
5. Process file uploads and speech-to-text if present
6. `buildFlow()` - traverse nodes by depth order:
   - For each node: `resolveVariables()` interpolates `{{variable}}` templates
   - Execute `node.init()` to instantiate the component
   - Cache result for downstream nodes
7. Execute ending node with accumulated context
8. Apply post-processing (custom JS functions)
9. Generate follow-up prompts if configured
10. Store chat messages and metrics
11. Return response with sessionId, chatId, metadata

**Streaming**: Agent flows use SSE (Server-Sent Events) to stream partial results, reasoning steps, tool calls, and artifacts in real-time. TTS can convert streamed text to base64 audio chunks.

## RAG Integration Patterns

Flowise provides a complete RAG pipeline through composable nodes:

### Ingestion Pipeline
```
Document Loaders -> Text Splitters -> Embeddings -> Vector Store (upsert)
```

**Document Loaders**: PDF (per-page or per-file), EPUB, Office docs, HTML, Markdown, web scraping (Playwright/Puppeteer), Notion, APIs
- Metadata enrichment: default PDF properties + custom JSON metadata
- Metadata omission via comma-separated keys or wildcard

**Text Splitters**: Character, Recursive Character, Token, Markdown, HTML, Code splitters

**Record Manager**: Tracks document hashes to enable incremental upsert (skip unchanged docs)

### Query Pipeline
```
Question -> (Rephrase with history) -> Retriever -> Context + Prompt -> LLM -> Response
```

**ConversationalRetrievalQAChain** pattern:
1. Check chat history exists; if yes, rephrase question into standalone query
2. Query vector store retriever with rephrased question
3. Format retrieved documents as context
4. Combine with ChatPromptTemplate (system message + chat history + context)
5. LLM generates grounded answer
6. Return `{ text, sourceDocuments }` with citations

**Vector Store nodes** implement `vectorStoreMethods`:
- `upsert()`: Process documents, apply metadata, handle record management
- `delete()`: Remove by ID with optional record manager cleanup
- Output as retriever or direct vector store instance

## Embed Widget

Flowise provides multiple embedding methods via the `APICodeDialog`:

**5 Integration tabs**:
1. **Embed** - Web component widget (`flowise-embed` npm package)
2. **Python** - `requests` library POST example
3. **JavaScript** - `fetch` API async example
4. **cURL** - CLI command
5. **Share Chatbot** - Public shareable link

**Embed widget** (`flowise-embed`):
```html
<script type="module">
  import Chatbot from 'https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js'
  Chatbot.init({
    chatflowid: '<chatflow-id>',
    apiHost: 'http://localhost:3000',
    // theme, botMessage, userMessage, textInput, header configs
  })
</script>
```

**Configuration options**: Custom theme colors, bot/user message styling, chat window title, starter prompts, file upload toggle, speech-to-text toggle, allowed domains whitelist, rate limiting.

**Override Config**: Users can pass runtime `overrideConfig` to override node parameters (disabled by default, must enable in Security tab). Useful for multi-tenant deployments where same chatflow serves different contexts.

## API & Integration Patterns

### REST API Routes (40+ endpoints)
**Core**: `/api/v1/prediction/{chatflowId}` (main chat endpoint), `/api/v1/chatflows`, `/api/v1/chatmessage`, `/api/v1/credentials`, `/api/v1/nodes`

**Vector operations**: `/api/v1/vector/upsert/{chatflowId}`, `/api/v1/vector/query`

**Document management**: `/api/v1/document-store`, `/api/v1/attachments`

**AI features**: `/api/v1/openai-assistants`, `/api/v1/openai-realtime`, `/api/v1/text-to-speech`

**MCP protocol**: `/api/v1/mcp-server`, `/api/v1/mcp-endpoint`, `/api/v1/custom-mcp-servers`

**Webhook**: `/api/v1/webhook`, `/api/v1/webhook-listener`

**Enterprise (feature-gated)**: datasets, evaluations, evaluators, audit logs, roles, logs, files

### Authentication
- API key based (`apikeyid` per chatflow)
- JWT tokens for dashboard access
- Passport.js for session management
- OAuth2 support

### Streaming
- SSE for real-time agent responses
- Streaming endpoint: `/api/v1/chatflows-streaming/{chatflowId}`

## Configuration & Setup

### Quick Install
```bash
npm install -g flowise
npx flowise start
# Or with Docker
cd docker && docker compose up -d
```

### Docker Configuration
- Image: `flowiseai/flowise:latest`
- Health check: `/api/v1/ping` with 30s startup grace
- Storage: Mounts `~/.flowise` for persistent data
- Supports: local storage, S3, Google Cloud Storage, Azure Blob Storage
- Secret management: Local or AWS Secrets Manager
- Queue: Redis + BullMQ with configurable concurrency
- Security: HTTP deny lists, path traversal protection, CORS, iframe origin control
- Monitoring: PostHog + OpenTelemetry

### Database Migrations
```bash
pnpm typeorm:migration-generate  # Create migration
pnpm typeorm:migration-run       # Apply migrations
pnpm typeorm:migration-revert    # Rollback
```

### Environment Variables (key ones)
- `DATABASE_TYPE`: sqlite (default), postgres, mysql
- `DATABASE_HOST/PORT/USER/PASSWORD/NAME`: DB connection
- `FLOWISE_USERNAME/PASSWORD`: Dashboard auth
- `APIKEY_PATH`: API key storage location
- `SECRETKEY_PATH`: Encryption key path
- `BLOB_STORAGE_PATH`: File storage location
- `LOG_LEVEL`: error, info, verbose, debug

## What We Can Reuse

1. **Node System Pattern**: The `INode` interface with declarative inputs/outputs and `init()`/`run()` lifecycle is an excellent pattern for building pluggable, visual workflow systems. Directly applicable to our AI marketing automation platform.

2. **DAG Execution Engine**: The `constructGraphs -> getEndingNodes -> getStartingNodes -> buildFlow` pipeline is a clean, reusable pattern for any workflow execution system.

3. **Variable Resolution**: The `{{nodeId.data.instance}}` template system for passing data between nodes is simple and effective.

4. **Custom Tool Pattern**: JSON-defined tools with input schema and JS function body - great for letting non-technical users extend agent capabilities.

5. **Override Config**: Runtime parameter overriding enables multi-tenant use of single chatflows - critical for our agency model where one template serves multiple clients.

6. **Embed Widget Architecture**: The lightweight web component approach for embedding chat on client websites is directly applicable to our white-label chatbot delivery.

7. **RAG Pipeline Composition**: The modular loader -> splitter -> embedder -> vector store -> retriever -> chain pattern is the industry standard we should follow.

8. **MCP Protocol Support**: Flowise already supports MCP servers/endpoints - validates our decision to invest in MCP integration.

9. **Queue-based Processing**: BullMQ + Redis for async job processing - matches our scalable architecture needs.

10. **TypeORM Migration Pattern**: Clean database migration approach for PostgreSQL that we should adopt.

## Lessons & Best Practices

1. **Start with SQLite, graduate to PostgreSQL**: Flowise defaults to SQLite for easy onboarding but supports PostgreSQL for production. This matches our "modular monolith first" approach.

2. **Monorepo with clear boundaries**: The server/ui/components split keeps concerns separated while sharing types. Turborepo handles build orchestration efficiently.

3. **Serialized flow state**: Storing entire flow as JSON in a single column (flowData) simplifies CRUD but complicates querying individual nodes. Consider a normalized schema if you need to query across flows.

4. **Feature gating for enterprise**: Routes use feature flags (e.g., `feature: 'datasets'`) to gate enterprise functionality - clean pattern for tiered pricing.

5. **Security defaults matter**: Override config is disabled by default, API keys are optional but encouraged, allowed domains whitelist for embed widget. Security-by-default prevents accidental exposure.

6. **Node versioning**: Each node has a `version` field enabling backward compatibility as node schemas evolve. Essential for production systems where existing chatflows must continue working.

7. **LangChain as backbone**: Heavy reliance on LangChain ecosystem (LangChain Core, community packages, provider-specific packages). This provides breadth but creates vendor dependency.

8. **Record Manager for incremental RAG**: Tracking document hashes to skip unchanged documents during re-indexing is crucial for production RAG systems with large document stores.

9. **Multi-agent support**: Separate node categories for agents, multiagents, and sequentialagents shows the evolution from simple chains to complex agent orchestration. Our system should plan for this progression.

10. **Credential isolation**: Credentials stored separately from flow data, with encryption and per-flow credential references. Essential for multi-tenant deployments.
