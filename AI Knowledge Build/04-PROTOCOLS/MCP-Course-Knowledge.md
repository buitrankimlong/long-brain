---
tags: [knowledge, mcp, protocol, microsoft, course]
source_repo: mcp-for-beginners
date_extracted: 2026-05-09
spec_version: 2025-11-25
---

# MCP for Beginners - Knowledge Extraction

> Source: `C:\AI Build Learning\mcp-for-beginners` (Microsoft GitHub repo)
> Spec aligned with: MCP Specification 2025-11-25

---

## Overview & Architecture

### What is MCP?

**Model Context Protocol (MCP)** is an open, standardized interface that allows Large Language Models (LLMs) to interact seamlessly with external tools, APIs, and data sources. Think of it as **USB-C for AI applications** — a universal connector so any AI model can talk to any tool or service in a standardized way.

Before MCP, integrating models with tools required: custom code per tool-model pair, non-standard APIs for each vendor, frequent breaks due to updates, and poor scalability. MCP solves all of this.

**Key benefits:**
- Interoperability: LLMs work seamlessly with tools across different vendors
- Consistency: Uniform behavior across platforms and tools
- Reusability: Tools built once can be used across projects and systems
- Accelerated Development: Standardized plug-and-play interfaces reduce dev time

### Protocol Versioning

MCP uses **date-based versioning** (YYYY-MM-DD format). Current stable: `2025-11-25`.

Official resources:
- Docs: https://modelcontextprotocol.io/
- Spec: https://modelcontextprotocol.io/specification/2025-11-25
- GitHub: https://github.com/modelcontextprotocol

---

## High-Level Architecture

MCP follows a **client-server model** with three core roles:

```
User --> [MCP Host] --> [MCP Client] --> [MCP Server] --> [Tools/Data]
```

### The Three Roles

| Role | Description | Examples |
|------|-------------|---------|
| **MCP Host** | AI application that users interact with; orchestrates everything | Claude Desktop, VS Code with Copilot, Cursor, Windsurf, Claude Code |
| **MCP Client** | Protocol connector embedded in the Host; maintains 1:1 connection with one MCP Server | Created by host per server connection |
| **MCP Server** | Lightweight program exposing specific capabilities via standardized protocol | Calculator server, DB server, file system server |

### Request Flow (Step by Step)

1. User sends prompt to MCP Host
2. Host passes to AI Model
3. AI Model may request tool calls
4. MCP Host routes tool calls to appropriate MCP Server(s)
5. MCP Servers execute and return structured results
6. MCP Host formats results for the AI Model
7. AI Model generates final response
8. Host delivers response to user

### Host Internal Components

- **Tool Registry**: Catalog of available tools and capabilities
- **Authentication**: Verifies permissions for tool access
- **Request Handler**: Processes incoming tool requests from the model
- **Response Formatter**: Structures tool outputs for the model

---

## Two-Layer Protocol Architecture

### Layer 1: Data Layer (JSON-RPC 2.0)

All MCP communication uses **JSON-RPC 2.0** as its message format. This layer handles:

- Message structure, semantics, interaction patterns
- Connection initialization and lifecycle management
- Protocol version negotiation
- Server and client primitives
- Real-time notifications (async, no polling needed)
- Stateful sessions for context continuity

### Layer 2: Transport Layer

Manages communication channels, message framing, authentication.

**Two supported transports:**

| Transport | Use Case | Notes |
|-----------|----------|-------|
| **stdio** | Local servers | Recommended for local. Client launches server as subprocess. Communicates via stdin/stdout. No HTTP overhead. Simple, secure. |
| **Streamable HTTP** | Remote servers | Uses HTTP POST for client-to-server. Optional SSE for server-to-client streaming. Supports OAuth/bearer tokens. Recommended for cloud/multi-client. |

> Note: The standalone SSE transport (previously standalone) was **deprecated as of MCP Specification 2025-06-18**. It is now replaced by Streamable HTTP.

---

## Key Concepts (Each Lesson Summarized)

### Module 00: Introduction

- MCP = universal standard for AI-tool interactions
- Analogy: USB-C for AI apps
- Solves: fragmentation, vendor lock-in, brittle custom integrations
- Reduces hallucinations (external data = factual grounding)
- Keeps sensitive data private (stays in secure environment, not in prompts)

### Module 01: Core Concepts

Three types of **Server Primitives** that every MCP server can expose:

**1. Tools** — executable functions (the "verbs")
- Callable by AI with defined parameters
- Uses JSON Schema for parameter validation
- Discovered via `tools/list`, executed via `tools/call`
- Can have behavioral annotations: `readOnlyHint`, `destructiveHint`

**2. Resources** — data sources (the "nouns")
- Static or dynamic content identified by URI
- Example URIs: `file://documents/spec.md`, `database://prod/users/schema`, `api://weather/current`
- Discovered via `resources/list`, read via `resources/read`

**3. Prompts** — reusable templates
- Pre-structured messages and workflows
- Support variable substitution
- Discovered via `prompts/list`, retrieved via `prompts/get`

Three types of **Client Primitives** (what servers can request FROM clients):

**1. Sampling** — server requests LLM completions from the client
- Enables server to call the host's LLM without embedding its own model
- Can include tools and toolChoice parameters
- Method: `sampling/createMessage` (renamed `sampling/complete` in some versions)

**2. Roots** — filesystem boundary definition
- Clients expose which directories/files servers can access
- Uses `file://` URIs
- Discovery: `roots/list`, notification: `notifications/roots/list_changed`

**3. Elicitation** — server requests user input through client UI
- Gather missing parameters, confirmation dialogs, URL-based interactions
- Method: `elicitation/request`

**4. Logging** — server sends structured logs to client
- Levels: debug, info, notice, warning, error, critical, alert, emergency

### Module 02: Security

**OWASP MCP Top 10 Security Risks:**

| # | Risk | Azure Mitigation |
|---|------|-----------------|
| MCP01 | Token Mismanagement & Secret Exposure | Azure Key Vault, Managed Identity |
| MCP02 | Privilege Escalation via Scope Creep | RBAC, Conditional Access |
| MCP03 | Tool Poisoning | Tool validation, integrity verification |
| MCP04 | Supply Chain Attacks | GitHub Advanced Security, dependency scanning |
| MCP05 | Command Injection & Execution | Input validation, sandboxing |
| MCP06 | Prompt Injection via Contextual Payloads | Azure AI Content Safety, Prompt Shields |
| MCP07 | Insufficient Authentication & Authorization | Azure Entra ID, OAuth 2.1 with PKCE |
| MCP08 | Lack of Audit & Telemetry | Azure Monitor, Application Insights |
| MCP09 | Shadow MCP Servers | API Center governance, network isolation |
| MCP10 | Context Injection & Over-Sharing | Data classification, minimal exposure |

**Critical security rules:**
- MCP servers **MUST NOT** accept tokens not explicitly issued for that MCP server (token passthrough is forbidden)
- Session hijacking: servers MUST verify ALL inbound requests, MUST NOT rely on sessions for authentication
- Confused deputy: proxy servers using static client IDs MUST obtain user consent per dynamically registered client
- Use OAuth 2.1 with PKCE for all authorization flows
- Implement Row Level Security for multi-tenant data

**AI-specific threats:**
- **Indirect Prompt Injection**: Malicious instructions in documents/web pages/emails processed by AI
- **Tool Poisoning**: Attackers inject malicious instructions into tool metadata/descriptions
- **Dynamic Capability Modification ("Rug Pulls")**: Approved tools modified after approval to become malicious

**Microsoft security tools:**
- Azure AI Prompt Shields: Defends against direct and indirect prompt injection
- Azure Content Safety: Jailbreak detection, harmful content filtering
- GitHub Advanced Security: Secret scanning, dependency scanning, CodeQL
- Microsoft Entra ID: Enterprise identity and access management

### Module 03: Getting Started

#### Official SDKs (all aligned with MCP Specification 2025-11-25)

| Language | Package/Repo |
|----------|--------------|
| Python | `mcp[cli]` or `fastmcp` — https://github.com/modelcontextprotocol/python-sdk |
| TypeScript/JS | `@modelcontextprotocol/sdk` — https://github.com/modelcontextprotocol/typescript-sdk |
| C#/.NET | `ModelContextProtocol` NuGet — https://github.com/modelcontextprotocol/csharp-sdk (Microsoft) |
| Java | Spring AI integration — https://github.com/modelcontextprotocol/java-sdk |
| Kotlin | https://github.com/modelcontextprotocol/kotlin-sdk |
| Rust | `rmcp` crate — https://github.com/modelcontextprotocol/rust-sdk |
| Go | https://github.com/modelcontextprotocol/go-sdk |
| Swift | https://github.com/modelcontextprotocol/swift-sdk (Loopwork AI) |

#### MCP Hosts (Applications that support MCP)

| Host | Config File Location | Transport Support |
|------|---------------------|-------------------|
| Claude Desktop | `%APPDATA%\Claude\claude_desktop_config.json` (Win) | stdio only |
| VS Code (GitHub Copilot) | `.vscode/mcp.json` or `settings.json` | stdio + SSE/HTTP |
| Cursor | `%USERPROFILE%\.cursor\mcp.json` | stdio + SSE/HTTP |
| Cline | `~/.clinerc` | stdio + SSE/HTTP |
| Windsurf | Settings UI → `windsurf.mcp.servers` | stdio + SSE/HTTP |

#### MCP Inspector (Testing Tool)

```bash
# Run inspector against a TypeScript server
npx @modelcontextprotocol/inspector node build/index.js

# Run in CLI mode to list tools
npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list

# Python
mcp dev server.py
# or
npx @modelcontextprotocol/inspector mcp run server.py
```

### Module 04: Practical Implementation

- Use Azure API Management as a gateway in front of MCP servers for: rate limiting, token management, monitoring, load balancing, security
- Deploy to Azure Container Apps, Azure Functions (serverless), Kubernetes
- Use `azd up` for simplified Azure deployment

### Module 05: Advanced Topics

Topics covered:
- Azure integration (Azure OpenAI, Azure AI Foundry, Azure AI Search)
- Multi-modality (text + image + audio)
- OAuth2 authentication
- Root contexts
- Routing strategies
- Sampling (server-to-client LLM calls)
- Scaling (horizontal + vertical + distributed)
- Security (advanced patterns)
- Web search integration
- Realtime streaming
- Microsoft Entra ID authentication
- Azure AI Foundry agent integration
- Context Engineering
- Custom transports
- Protocol features deep dive (progress notifications, cancellation, resource templates)
- Adversarial multi-agent reasoning (two agents debate, judge evaluates)

### Module 07: Lessons from Early Adopters

Real-world case studies:
- **Enterprise Customer Support**: 30% model cost reduction, 45% better response consistency
- **Healthcare Diagnostic Assistant**: HIPAA-compliant, EHR integration
- **Financial Services Risk Analysis**: 40% faster model deployment cycles
- **Microsoft Playwright MCP Server**: Browser automation as MCP tools, powers GitHub Copilot web browsing
- **Azure MCP**: Enterprise managed MCP as a service
- **NLWeb**: Every NLWeb instance is also an MCP server (schema.org + natural language)

### Module 08: Best Practices

Core principles:
1. Standardized Communication: JSON-RPC 2.0 foundation
2. User-Centric Design: Always prioritize user consent, control, transparency
3. Security First: authentication, authorization, validation, rate limiting
4. Comprehensive testing
5. Performance optimization
6. Proper error handling and logging

### Module 09: Case Studies

Real MCP implementations:
- Azure AI Travel Agents: multi-agent with Azure OpenAI + Azure AI Search
- YouTube → Azure DevOps automation workflow
- Real-time documentation retrieval (Microsoft Learn Docs MCP Server)
- Interactive study plan generators with Chainlit
- In-editor documentation access via VS Code MCP panel
- Azure API Management as MCP server (APIM exposing APIs as MCP tools)
- GitHub MCP Registry (launched September 2025): centralized discovery, one-click install via VS Code

### Module 10: AI Toolkit Workshop

Building MCP servers with VS Code AI Toolkit extension.

### Module 11: Hands-On PostgreSQL Lab (13 Labs)

Full production stack: FastMCP + PostgreSQL 17 + pgvector + Azure OpenAI + Docker + Azure Container Apps.

---

## MCP Protocol Details

### JSON-RPC 2.0 Message Types

#### Initialization
```json
// Request
{ "id": 1, "method": "initialize", "params": { "protocolVersion": "2025-11-25", "capabilities": {...} } }
// Response
{ "id": 1, "result": { "protocolVersion": "2025-11-25", "capabilities": {...}, "serverInfo": {...} } }
// Notification (client -> server after init complete)
{ "method": "notifications/initialized" }
```

#### Discovery
```
tools/list          -> lists all available tools
resources/list      -> lists all available resources
prompts/list        -> lists all available prompt templates
roots/list          -> lists filesystem roots (client primitive)
```

#### Execution
```
tools/call          -> execute a tool with params
resources/read      -> retrieve resource content by URI
prompts/get         -> get a prompt template with params
sampling/createMessage -> server requests LLM completion from client
elicitation/request -> server requests user input from client
```

#### Notifications (Server -> Client, asynchronous)
```
notifications/tools/list_changed
notifications/resources/list_changed
notifications/prompts/list_changed
notifications/roots/list_changed    (Client -> Server)
```

### Message Structure
- **Requests**: `{ "jsonrpc": "2.0", "id": <int>, "method": "<name>", "params": {...} }`
- **Responses**: `{ "jsonrpc": "2.0", "id": <int>, "result": {...} }` or `{ ..., "error": {...} }`
- **Notifications**: `{ "jsonrpc": "2.0", "method": "<name>", "params": {...} }` (no `id`, no response expected)

### Notifications (Streaming / Progress)
In MCP, "streaming" means **progress notifications** sent during long operations. The final result is still sent as a single response at the end. Notifications use the Logging capability:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/message",
  "params": { "level": "info", "message": "Processing file 1/3..." }
}
```

Server must enable logging capability:
```json
{ "capabilities": { "logging": {} } }
```

### Experimental Features (as of 2025-11-25 spec)
- **Tasks**: Long-running operations with deferred result retrieval and status tracking
- **Tool Annotations**: Metadata about tool behavior for safety (`readOnlyHint`, `destructiveHint`)
- **URL Mode Elicitation**: Server directs user to external web pages for auth/confirmation
- Enhanced **Roots**: Workspace context management

---

## Code Patterns & Examples

### Minimal Python Server (FastMCP)

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("My Server")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

@mcp.resource("greeting://{name}")
def get_greeting(name: str) -> str:
    """Get a personalized greeting"""
    return f"Hello, {name}!"

if __name__ == "__main__":
    mcp.run()  # stdio transport (default)
    # or: mcp.run(transport="streamable-http")
```

### Minimal TypeScript Server

```typescript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "My Server", version: "1.0.0" });

server.tool(
  "add",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => ({ content: [{ type: "text", text: String(a + b) }] })
);

server.resource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  async (uri, { name }) => ({ contents: [{ uri: uri.href, text: `Hello, ${name}!` }] })
);

server.prompt(
  "review-code",
  { code: z.string() },
  ({ code }) => ({ messages: [{ role: "user", content: { type: "text", text: `Review:\n\n${code}` } }] })
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Minimal .NET Server

```csharp
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ModelContextProtocol.Server;
using System.ComponentModel;

var builder = Host.CreateApplicationBuilder(args);
builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();
await builder.Build().RunAsync();

[McpServerToolType]
public static class CalculatorTool
{
    [McpServerTool, Description("Adds two numbers")]
    public static string Add(int a, int b) => $"Sum {a + b}";
}
```

### Python Client

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(command="mcp", args=["run", "server.py"])

async def run():
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            resources = await session.list_resources()
            tools = await session.list_tools()
            result = await session.call_tool("add", arguments={"a": 1, "b": 7})
            content = await session.read_resource("greeting://hello")

asyncio.run(run())
```

### TypeScript Client

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({ command: "node", args: ["server.js"] });
const client = new Client({ name: "my-client", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
const result = await client.callTool({ name: "add", arguments: { a: 1, b: 2 } });
const resource = await client.readResource({ uri: "file:///example.txt" });
const prompt = await client.getPrompt({ name: "review-code", arguments: { code: "..." } });
```

### Progress Notifications (Server-Side)

```python
@mcp.tool(description="Process files with progress")
async def process_files(message: str, ctx: Context) -> TextContent:
    for i in range(1, 11):
        await ctx.info(f"Processing document {i}/10")
    await ctx.info("Processing complete!")
    return TextContent(type="text", text=f"Done: {message}")
```

### Sampling (Server requests LLM from Client)

```python
@mcp.tool()
async def create_blog(title: str, content: str, ctx: Context[ServerSession, None]) -> str:
    """Create a blog post and generate a summary via client LLM"""
    result = await ctx.session.create_message(
        messages=[SamplingMessage(
            role="user",
            content=TextContent(type="text", text=f"Summarize: {title}\n{content}")
        )],
        max_tokens=100,
    )
    return json.dumps({"abstract": result.content.text})
```

Sampling request JSON-RPC structure:
```json
{
  "method": "sampling/createMessage",
  "params": {
    "messages": [{ "role": "user", "content": { "type": "text", "text": "..." } }],
    "modelPreferences": { "hints": [{ "name": "claude-3-sonnet" }], "intelligencePriority": 0.8 },
    "systemPrompt": "You are a helpful assistant.",
    "maxTokens": 100
  }
}
```

### PostgreSQL + pgvector Semantic Search (Lab 11 pattern)

```python
# FastMCP server with database integration
from mcp.server.fastmcp import FastMCP
import asyncpg

mcp = FastMCP("Retail Analytics Server")

@mcp.tool()
async def semantic_product_search(query: str, limit: int = 10) -> list:
    """Find products using natural language semantic search"""
    # 1. Generate embedding via Azure OpenAI
    embedding = await get_embedding(query)
    # 2. pgvector similarity search
    conn = await asyncpg.connect(DATABASE_URL)
    results = await conn.fetch("""
        SELECT product_id, name, description,
               1 - (embedding <=> $1::vector) AS similarity
        FROM retail.products
        ORDER BY embedding <=> $1::vector
        LIMIT $2
    """, embedding, limit)
    return [dict(r) for r in results]
```

---

## Server/Client Implementation Patterns

### Pattern 1: stdio Local Server (Recommended for Local)

Best for: Tools that run on user's machine, CLI integrations, local development.

```bash
# Claude Desktop config: %APPDATA%\Claude\claude_desktop_config.json
{
  "mcpServers": {
    "my-server": {
      "command": "python",
      "args": ["-m", "my_server"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

Key rules:
- Server MUST NOT write non-MCP content to stdout
- Use stderr for logging
- Messages MUST be newline-delimited JSON-RPC

### Pattern 2: Streamable HTTP Remote Server

Best for: Cloud deployment, multiple clients, real-time streaming.

```python
mcp.run(transport="streamable-http")  # Default port: 8000, endpoint: /mcp
```

VS Code config:
```json
{
  "servers": {
    "my-remote-server": { "type": "http", "url": "http://localhost:8000/mcp" }
  }
}
```

### Pattern 3: LLM-Augmented Client

The recommended pattern for production: client discovers tools and passes them to an LLM:

1. Client connects to MCP server
2. Client calls `tools/list` and saves schemas
3. Client formats tool schemas for LLM (OpenAI function calling format, etc.)
4. LLM decides which tools to call based on user input
5. Client executes tool calls via MCP and feeds results back to LLM
6. LLM generates final response

### Pattern 4: Multi-Agent with MCP

Multiple specialized MCP servers + one orchestrating LLM:
- Each server exposes domain-specific tools (web search, DB, email, calendar)
- LLM routes tool calls to appropriate servers
- Servers can also be clients to other servers (tool federation)

### Pattern 5: PostgreSQL + Row Level Security (Multi-Tenant)

```sql
-- RLS policy: each user sees only their tenant's data
CREATE POLICY tenant_isolation ON retail.orders
  FOR ALL TO app_users
  USING (store_id = get_current_user_store());

-- MCP server sets user context before each query
SET app.current_user_id = $1;
SET app.current_store_id = $2;
```

---

## Configuration & Setup

### Python Setup

```bash
python -m venv venv
venv\Scripts\activate  # Windows
pip install "mcp[cli]"
# or for FastMCP:
pip install fastmcp
```

### TypeScript Setup

```bash
mkdir my-server && cd my-server
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D @types/node typescript
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "Node16",
    "moduleResolution": "Node16", "outDir": "./build",
    "strict": true, "esModuleInterop": true
  }
}
```

`package.json` scripts:
```json
{ "scripts": { "build": "tsc", "start": "npm run build && node ./build/index.js" } }
```

### .NET Setup

```bash
dotnet new console -n MyMcpServer
cd MyMcpServer
dotnet add package ModelContextProtocol --prerelease
dotnet add package Microsoft.Extensions.Hosting
```

### Java Setup (Spring Boot)

Dependencies in `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-webflux</artifactId>
</dependency>
```

Tool registration via annotation:
```java
@Tool(description = "Add two numbers together")
public String add(double a, double b) {
    return String.format("%.2f + %.2f = %.2f", a, b, a + b);
}
```

### Claude Desktop Configuration

Windows: `%APPDATA%\Claude\claude_desktop_config.json`
Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "server-name": {
      "command": "python",
      "args": ["path/to/server.py"],
      "env": { "API_KEY": "your-key" }
    }
  }
}
```

### VS Code MCP Configuration

`.vscode/mcp.json`:
```json
{
  "servers": {
    "my-server": {
      "type": "stdio",
      "command": "python",
      "args": ["-m", "my_server"]
    },
    "remote-server": {
      "type": "sse",
      "url": "http://localhost:8080/sse",
      "headers": { "x-api-key": "${input:api-key}" }
    }
  }
}
```

### Azure Deployment

```bash
# Deploy to Azure Container Apps
az containerapp up \
  -g <RESOURCE_GROUP> \
  -n my-mcp-server \
  --environment mcp \
  -l westus \
  --source .

# Deploy full stack with Azure Developer CLI
azd up
```

Azure Functions deployment:
```bash
git clone https://github.com/Azure-Samples/remote-mcp-functions-python.git
azd up
```

---

## What We Can Reuse

### For AI Agency / Marketing Automation Systems

1. **FastMCP (Python)** — fastest way to build production MCP servers. Decorator-based, minimal boilerplate.

2. **Tools for Marketing Automation** — reusable tool patterns:
   - Email tool: `send_email(to, subject, body)`
   - Social media tool: `post_to_zalo(content, media)`
   - CRM tool: `update_customer(id, data)`
   - Analytics tool: `get_campaign_metrics(campaign_id, date_range)`

3. **PostgreSQL + pgvector pattern** — already in our tech stack:
   - Use pgvector for semantic customer segmentation
   - Row Level Security for multi-tenant agency clients
   - FastMCP + asyncpg for database integration

4. **Sampling pattern** — great for content generation pipelines:
   - Server orchestrates, client LLM generates actual content
   - Server handles database/API work, delegates text generation to LLM

5. **Claude Desktop / VS Code configuration** — connect internal tools to Claude for team use

6. **MCP Inspector** for debugging:
   ```bash
   npx @modelcontextprotocol/inspector python server.py
   ```

7. **Streaming with Streamable HTTP** — for real-time progress feedback on long AI tasks

8. **Azure API Management as gateway** — for production: rate limiting, auth, monitoring in front of MCP servers

### Key Architecture Decision for Agency

- Local tools: stdio transport
- Cloud/production: Streamable HTTP transport
- Multi-client: Azure Container Apps + Azure API Management gateway
- Auth: Microsoft Entra ID (OAuth 2.1 with PKCE)
- DB: PostgreSQL + pgvector (already decided) + Row Level Security for multi-tenant

---

## Lessons & Best Practices

### Server Design

1. **One server = one domain**. Keep servers focused (e.g., separate CRM server, email server, analytics server).

2. **Use JSON Schema for tool parameters**. Zod (TypeScript), Pydantic (Python), annotations (.NET), `@Tool` (Java).

3. **Never write non-MCP content to stdout** (stdio transport). Always use stderr for logs.

4. **Make tools idempotent where possible**. Use `readOnlyHint` annotation for read-only tools.

5. **Return structured content**. Tool results should be `{ content: [{ type: "text", text: "..." }] }`.

### Testing Strategy

1. **MCP Inspector** first — visual testing, check all tools/resources/prompts appear correctly.

2. **curl for HTTP servers** — test raw JSON-RPC messages.

3. **Unit tests with in-memory session**:
   ```python
   from mcp.shared.memory import create_connected_server_and_client_session as create_session
   async with create_session(server._mcp_server) as client_session:
       result = await client_session.list_tools()
       assert len(result.tools) == 2
   ```

4. **VS Code integration testing** — connect to real Claude/Copilot and test natural language invocation.

### Security Checklist

- [ ] Validate all input parameters (JSON Schema validation built into MCP)
- [ ] Never accept tokens not issued for your server (no token passthrough)
- [ ] Use cryptographically secure, non-deterministic session IDs
- [ ] Implement rate limiting per user/session
- [ ] Store secrets in Azure Key Vault / environment variables, not config files
- [ ] Enable comprehensive audit logging
- [ ] Validate Origin header for HTTP servers (DNS rebinding prevention)
- [ ] Use HTTPS in production
- [ ] Use parameterized queries (never string-interpolated SQL)
- [ ] Apply principle of least privilege for all permissions

### Performance Optimization

- Use **connection pooling** for database connections (asyncpg pool)
- Enable **distributed caching** (Redis) for horizontal scaling
- Use **async/await** throughout (Python asyncio, TypeScript async)
- Implement **pagination** via cursor for large result sets (`tools/list` supports cursor param)
- Set appropriate **maxTokens** on sampling requests
- Use **pgvector indexes** (IVFFlat or HNSW) for semantic search at scale

### Deployment Best Practices

| Environment | Recommended Stack |
|-------------|------------------|
| Local dev | stdio + MCP Inspector |
| Team use | stdio + Claude Desktop / VS Code |
| Production (single) | Streamable HTTP + Azure Container Apps |
| Production (enterprise) | Streamable HTTP + Azure API Management + Entra ID auth + Application Insights monitoring |
| High-scale | Load-balanced instances + Redis for distributed state |

### Common Debugging Issues

| Issue | Solution |
|-------|---------|
| Server not appearing in Claude Desktop | Check JSON config syntax; restart Claude completely |
| Tools not showing | Check `@server.tool()` decorators; run MCP Inspector first |
| Connection refused | Verify server is running; check port |
| Environment vars not passed | Use `env` field in config explicitly |
| Schema validation errors | Ensure params match JSON Schema definition |
| Tool result empty | Check return format: `{ content: [{ type: "text", text: "..." }] }` |

---

## Production Reference: Lab 11 Technology Stack

The capstone lab builds a **Zava Retail Analytics MCP Server** — a complete production reference:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| MCP Framework | FastMCP (Python) | Server implementation |
| Database | PostgreSQL 17 + pgvector | Relational + vector search |
| AI Services | Azure OpenAI (text-embedding-3-small) | Generate embeddings |
| Containerization | Docker + Docker Compose | Dev environment |
| Cloud | Azure Container Apps | Production hosting |
| IDE Integration | VS Code + GitHub Copilot | Natural language queries |
| Monitoring | Application Insights | Observability |
| Secrets | Azure Key Vault | Configuration management |
| Auth | Row Level Security | Multi-tenant data isolation |

**Key patterns from this lab:**
- `asyncpg` connection pools for high-performance DB access
- `SET app.current_user_id` before each query for RLS context
- pgvector `<=>` cosine distance operator for similarity search
- `HNSW` index on embedding column for fast ANN search
- `FastMCP` decorator pattern: `@mcp.tool()`, `@mcp.resource()`, `@mcp.prompt()`

---

## Quick Reference

### Core Protocol Methods

```
# Server capabilities (what server exposes)
tools/list, tools/call
resources/list, resources/read, resources/subscribe
prompts/list, prompts/get

# Client capabilities (what client exposes to server)
sampling/createMessage
elicitation/request
roots/list
logging/setLevel

# Lifecycle
initialize, notifications/initialized, ping
```

### Minimal Working Server (Python, 10 lines)

```python
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("MyServer")

@mcp.tool()
def my_tool(input: str) -> str:
    """What this tool does"""
    return f"Result: {input}"

mcp.run()
```

### Key SDK Imports

```python
# Python
from mcp.server.fastmcp import FastMCP, Context
from mcp.types import SamplingMessage, TextContent
from mcp.client.stdio import stdio_client
from mcp import ClientSession, StdioServerParameters
```

```typescript
// TypeScript
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { z } from "zod";
```

---

*Extracted from microsoft/mcp-for-beginners, aligned with MCP Specification 2025-11-25. Covers 100+ README files across all 12 modules.*
