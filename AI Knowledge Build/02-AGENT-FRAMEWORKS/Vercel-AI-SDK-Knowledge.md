---
tags: [knowledge, vercel, ai-sdk, streaming, tools, agents]
source_repo: ai (Vercel AI SDK)
---

# Vercel AI SDK - Knowledge Extraction

## Overview & Architecture

The Vercel AI SDK is a TypeScript/JavaScript SDK for building AI-powered applications. It provides a unified interface across multiple LLM providers and framework integrations. The repo is a **pnpm monorepo** managed with Turborepo.

Key characteristics:
- Provider-agnostic: write once, swap providers easily
- First-class streaming via Web Streams API
- Typed tool calling with Zod/JSON Schema validation
- Multi-step agentic loops built-in
- MCP (Model Context Protocol) client support
- Framework integrations: React, Vue, Svelte, Angular, Next.js RSC

Core dependency graph:
```
ai ─────────────────┬──▶ @ai-sdk/provider-utils ──▶ @ai-sdk/provider
                    │
@ai-sdk/<provider> ─┴──▶ @ai-sdk/provider-utils ──▶ @ai-sdk/provider
```

---

## Tech Stack & Dependencies

| Layer | Package | Role |
|---|---|---|
| Specifications | `@ai-sdk/provider` | Defines interfaces: `LanguageModelV4`, `EmbeddingModelV4`, `ProviderV4`, etc. |
| Utilities | `@ai-sdk/provider-utils` | Shared code for providers and core (schema, tool helpers, fetch wrappers) |
| Core SDK | `ai` | High-level functions: `generateText`, `streamText`, `generateObject`, `streamObject`, `embed`, `tool`, etc. |
| Providers | `@ai-sdk/<name>` | Concrete implementations: openai, anthropic, google, azure, amazon-bedrock, groq, mistral, cohere, xai, deepseek, etc. |
| MCP | `@ai-sdk/mcp` | MCP client for connecting to Model Context Protocol servers |
| UI Frameworks | `@ai-sdk/react`, `@ai-sdk/vue`, `@ai-sdk/svelte`, `@ai-sdk/angular` | Client-side hooks/state management |
| Gateway | `@ai-sdk/gateway` | Vercel's hosted model gateway |
| Telemetry | `@ai-sdk/otel` | OpenTelemetry integration |

**Runtime requirements**: Node.js v18/v20/v22 (v22 recommended). Edge runtime supported (tested separately).

**Toolchain**: pnpm v10+, Turborepo, Vitest, oxlint, oxfmt, TypeScript.

**Schema support**: Zod 3 and Zod 4 (`zod/v3` and `zod/v4` imports). The SDK also accepts plain JSON Schema via `jsonSchema()`.

---

## Core SDK Patterns

### generateText

Non-streaming text generation with optional multi-step tool loops.

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText, isStepCount } from 'ai';

const { text, toolCalls, toolResults, steps, usage, finishReason } = await generateText({
  model: openai('gpt-4o'),
  system: 'You are a helpful assistant.',
  prompt: 'What is the weather in Tokyo?',
  tools: { weather: weatherTool },
  stopWhen: isStepCount(5),         // allow up to 5 tool-call steps
  maxOutputTokens: 1024,
  temperature: 0.7,
  maxRetries: 2,
  telemetry: { functionId: 'weather-query', isEnabled: true },
});
```

Key parameters:
- `model` - any `LanguageModel` (provider instance)
- `prompt` / `messages` / `system` / `instructions` - mutually exclusive prompt forms
- `tools` - `ToolSet` (record of tool definitions)
- `toolChoice` - `'auto'` | `'none'` | `'required'` | `{ type: 'tool', toolName }`
- `stopWhen` - `StopCondition | StopCondition[]` - default is `isStepCount(1)` (no loop)
- `output` - structured output spec (`text()`, `object({schema})`, `array({element})`, `choice({options})`, `json()`)
- `sandbox` - passed through to tool execution
- `runtimeContext` - immutable typed context flowing through the entire lifecycle
- `prepareStep` - function to override model/tools/messages per step
- `activeTools` - subset of tools to expose to model at runtime
- `toolApproval` - human-in-the-loop approval gate

Return value (`GenerateTextResult`):
- `text`, `reasoning`, `reasoningText`, `files`, `sources`
- `toolCalls`, `toolResults`, `staticToolCalls`, `dynamicToolCalls`
- `steps` - all intermediate steps
- `usage`, `finishReason`, `warnings`, `response`
- `responseMessages` - ready to append to conversation history

### streamText

Streaming version of generateText. Returns a result object immediately; data arrives via async iterables and promises.

```typescript
import { streamText } from 'ai';

const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Tell me a story.',
  onChunk: ({ chunk }) => { /* chunk.type: 'text-delta' | 'tool-call' | ... */ },
  onStepFinish: async ({ text, toolCalls, toolResults }) => { /* per step */ },
  onFinish: async ({ text, usage, steps }) => { /* final */ },
});

// Consume as async iterable
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

// Or await final values
const text = await result.text;
const usage = await result.usage;
```

Key streaming surfaces on `StreamTextResult`:
- `textStream` - `AsyncIterableStream<string>` of text deltas
- `fullStream` - `AsyncIterableStream<TextStreamPart>` including tool-call, tool-result, step-start, step-finish, finish
- `text`, `finishReason`, `usage`, `toolCalls`, `toolResults`, `steps` - all `Promise<T>`
- `toUIMessageStream(options)` - converts to UI message stream format for frontend
- `toTextStreamResponse()` / `pipeTextStreamToResponse()` - for Node.js HTTP responses
- `toUIMessageStreamResponse()` - complete HTTP response for chat UIs

`TextStreamPart` types: `text-delta`, `reasoning-delta`, `tool-call`, `tool-result`, `tool-call-streaming-start`, `tool-call-delta`, `step-start`, `step-finish`, `finish`, `error`, `source`, `file`, `raw` (when `include.rawChunks: true`)

Stream transforms via `experimental_transform`:
```typescript
const result = streamText({
  model,
  prompt,
  experimental_transform: smoothStream({ chunking: 'word' }),
});
```

### generateObject (deprecated - prefer generateText with output)

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

// NOTE: generateObject is @deprecated. Prefer generateText with output:
const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema: z.object({ recipe: z.string(), ingredients: z.array(z.string()) }),
  prompt: 'Give me a pasta recipe.',
});
```

Modern equivalent using `generateText` with `output`:
```typescript
import { generateText, output } from 'ai';

const result = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Give me a pasta recipe.',
  output: output.object({
    schema: z.object({ recipe: z.string(), ingredients: z.array(z.string()) }),
    name: 'Recipe',
    description: 'A pasta recipe with ingredients',
  }),
});
// result.output is typed as { recipe: string; ingredients: string[] }
```

Output modes available via the `output` export:
- `output.text()` - plain text (default)
- `output.object({ schema, name?, description? })` - validated typed object
- `output.array({ element, name?, description? })` - array of typed elements
- `output.choice({ options, name?, description? })` - enum/choice
- `output.json({ name?, description? })` - untyped JSON

### streamObject (deprecated - prefer streamText with output)

Similar to streamObject but streaming. Emits partial objects as they arrive.

### embed / embedMany

```typescript
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'The quick brown fox',
});

const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: ['text one', 'text two', 'text three'],
});
```

---

## Tool Calling Patterns

### Defining Tools

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const weatherTool = tool({
  description: 'Get the weather in a location',
  inputSchema: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  outputSchema: z.object({           // optional - validates return value
    location: z.string(),
    condition: z.string(),
    temperature: z.number(),
  }),
  execute: async ({ location }) => {
    // fetch real weather data
    return { location, condition: 'sunny', temperature: 22 };
  },
});
```

Tool fields:
- `description` - string description for the LLM
- `inputSchema` - Zod schema or JSON Schema (via `jsonSchema()`) for inputs
- `outputSchema` - optional Zod schema for validating execute return
- `execute` - async function; if omitted the tool call pauses and returns to caller
- `needsApproval` - `boolean | function` - request human approval before execution

### Dynamic Tools

```typescript
import { dynamicTool } from 'ai';

// Tool where the input schema is resolved at call time
const dynamicWeather = dynamicTool({
  description: 'Get weather dynamically',
  inputSchema: z.object({ city: z.string() }),
  execute: async (input, { toolCallId, messages }) => {
    return `Weather in ${input.city}: sunny`;
  },
});
```

### Tool Approval (Human-in-the-Loop)

```typescript
const result = await generateText({
  model,
  tools: { deleteFile: deleteTool },
  toolApproval: {
    deleteFile: {
      type: 'required',  // always require approval
    },
  },
});
// result.toolApprovalRequests contains pending approvals
// Resume by passing approval responses back
```

### Tool Repair

```typescript
const result = await generateText({
  model,
  tools,
  experimental_repairToolCall: async ({ toolCall, error, messages, system }) => {
    // Attempt to fix malformed tool call JSON
    const repaired = await generateText({ model, messages: [...] });
    return repaired.text;
  },
});
```

### Tool Input Refinement

```typescript
const result = await generateText({
  model,
  tools: { search: searchTool },
  experimental_refineToolInput: {
    search: async ({ input }) => {
      // sanitize or augment input before execution
      return { ...input, query: input.query.toLowerCase() };
    },
  },
});
```

### toolsContext

Typed context passed to all tools in a call (separate from runtimeContext):

```typescript
const result = await generateText({
  model,
  tools: { lookupUser: userTool },
  toolsContext: { userId: 'u_123', tenantId: 'acme' },
});
// toolsContext is available inside tool.execute
```

---

## Agent Patterns

### ToolLoopAgent (built-in agent class)

`ToolLoopAgent` runs `generateText`/`streamText` in a loop, executing tool calls until a stop condition is met (default: `isStepCount(20)`).

```typescript
import { openai } from '@ai-sdk/openai';
import { ToolLoopAgent, tool, isStepCount } from 'ai';
import { z } from 'zod';

const agent = new ToolLoopAgent({
  model: openai('gpt-4o'),
  instructions: 'You are a helpful assistant.',
  tools: {
    search: tool({
      description: 'Search the web',
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => `Results for: ${query}`,
    }),
  },
  stopWhen: isStepCount(10),
  telemetry: { functionId: 'my-agent' },
});

// Non-streaming
const result = await agent.generate({ prompt: 'Research AI trends in 2025.' });
console.log(result.text);

// Streaming
const stream = await agent.stream({ prompt: 'Research AI trends in 2025.' });
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

Agent loop termination conditions:
1. Model returns finish reason other than `tool-calls`
2. A tool without an `execute` function is called
3. A tool requires approval via `toolApproval` or `needsApproval`
4. A `StopCondition` returns `true`

### Stop Conditions

```typescript
import { isStepCount, isLoopFinished, hasToolCall } from 'ai';

// Stop after exactly N steps
stopWhen: isStepCount(5)

// Never stop (run until natural termination)
stopWhen: isLoopFinished()

// Stop when a specific tool is called
stopWhen: hasToolCall('finalAnswer', 'returnResult')

// Custom condition
stopWhen: ({ steps }) => steps.some(s => s.text.includes('DONE'))

// Array: stop when ANY condition is met
stopWhen: [isStepCount(20), hasToolCall('done')]
```

### Sub-agent Pattern

Agents can be used as tools inside other agents:

```typescript
const childAgent = new ToolLoopAgent({
  model: openai('gpt-5-mini'),
  instructions: 'You are a specialized data processor.',
  tools: { process: processTool },
  stopWhen: isStepCount(3),
});

const parentAgent = new ToolLoopAgent({
  model: openai('gpt-5-mini'),
  instructions: 'You are the orchestrator.',
  tools: {
    delegateToChild: tool({
      description: 'Delegate a task to the child agent',
      inputSchema: z.object({ task: z.string() }),
      execute: async ({ task }) => {
        const result = await childAgent.stream({ prompt: task });
        return await result.text;
      },
    }),
  },
});
```

### Custom Agent Interface

Implement the `Agent` interface directly for custom agent logic:

```typescript
import type { Agent } from 'ai';

class MyCustomAgent implements Agent<MyCallOptions, MyTools> {
  readonly version = 'agent-v1';
  readonly id = 'my-agent';
  readonly tools = myTools;

  async generate(options) { /* ... */ }
  async stream(options) { /* ... */ }
}
```

### prepareStep - Per-Step Control

Override model, tools, instructions, messages, or context for individual steps:

```typescript
const result = await generateText({
  model: openai('gpt-4o'),
  tools,
  stopWhen: isStepCount(10),
  prepareStep: async ({ stepNumber, steps, messages, runtimeContext }) => {
    if (stepNumber === 0) {
      return { model: openai('gpt-4o'), activeTools: ['search'] };
    }
    if (steps.length > 5) {
      return { model: openai('gpt-5-mini') }; // switch to cheaper model
    }
    return undefined; // use defaults
  },
});
```

---

## MCP Integration

The `@ai-sdk/mcp` package provides a client for Model Context Protocol servers. MCP tools are converted to standard AI SDK tools automatically.

### MCP Client Setup

```typescript
import { createMCPClient, type MCPClient } from '@ai-sdk/mcp';
import { generateText, isStepCount } from 'ai';
import { openai } from '@ai-sdk/openai';

// HTTP transport (Streamable HTTP - modern)
const mcpClient: MCPClient = await createMCPClient({
  transport: { type: 'http', url: 'http://localhost:3000/mcp' },
});

// SSE transport (legacy)
const mcpClient2 = await createMCPClient({
  transport: { type: 'sse', url: 'http://localhost:3000/sse' },
});

// Custom transport (e.g., MCP SDK's StreamableHTTPClientTransport)
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const mcpClient3 = await createMCPClient({
  transport: new StreamableHTTPClientTransport(new URL('http://localhost:3000/mcp')),
});

// Get tools and use them
const tools = await mcpClient.tools();

const { text } = await generateText({
  model: openai('gpt-4o-mini'),
  tools,
  stopWhen: isStepCount(10),
  instructions: 'You are a helpful chatbot',
  prompt: 'Look up user with ID foo_123',
  onStepFinish: async ({ toolResults }) => {
    console.log(JSON.stringify(toolResults, null, 2));
  },
});

await mcpClient.close();
```

### MCPClient Interface

```typescript
interface MCPClient {
  readonly serverInfo: Configuration;
  readonly instructions?: string;          // server-provided instructions

  tools(options?: { schemas?: ToolSchemas }): Promise<McpToolSet>;
  listTools(options?): Promise<ListToolsResult>;
  callTool(args: { name: string; arguments?: Record<string, unknown> }): Promise<CallToolResult>;
  toolsFromDefinitions(definitions, options?): McpToolSet;

  listResources(options?): Promise<ListResourcesResult>;
  readResource(args: { uri: string }): Promise<ReadResourceResult>;
  listResourceTemplates(options?): Promise<ListResourceTemplatesResult>;

  experimental_listPrompts(options?): Promise<ListPromptsResult>;
  experimental_getPrompt(args: { name: string; arguments? }): Promise<GetPromptResult>;

  close(): Promise<void>;
}
```

### MCPTransport Config

```typescript
type MCPTransportConfig = {
  type: 'sse' | 'http';
  url: string;
  headers?: Record<string, string>;
  authProvider?: OAuthClientProvider;  // OAuth support
  redirect?: 'follow' | 'error';      // default: 'error'
  fetch?: FetchFunction;               // custom fetch
};
```

OAuth authentication is built-in via `auth` and `OAuthClientProvider`.

---

## Provider System

### Provider Pattern (3-tier)

1. **`@ai-sdk/provider`** - Specifications: `LanguageModelV4`, `EmbeddingModelV4`, `ImageModelV4`, `ProviderV4`, `SpeechModelV4`, `TranscriptionModelV4`, `RerankingModelV4`, `VideoModelV4`
2. **`@ai-sdk/provider-utils`** - Shared utilities: `tool()`, `jsonSchema()`, `zodSchema()`, `asSchema()`, `safeParseJSON()`, `loadApiKey()`, etc.
3. **`@ai-sdk/<provider>`** - Concrete implementations

### Using Providers

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';

// Language models
const model = openai('gpt-4o');
const model2 = anthropic('claude-sonnet-4-5');
const model3 = google('gemini-2.0-flash');

// Embedding models
const embedModel = openai.embedding('text-embedding-3-small');

// Image models
const imageModel = openai.image('dall-e-3');
```

### Provider Registry

```typescript
import { createProviderRegistry } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

const registry = createProviderRegistry({ openai, anthropic });

// Access any model via 'provider:model-id' string
const model = registry.languageModel('openai:gpt-4o');
const embedModel = registry.embeddingModel('openai:text-embedding-3-small');
```

### Custom Provider

```typescript
import { customProvider } from 'ai';

const myProvider = customProvider({
  languageModels: {
    'fast': openai('gpt-5-nano'),
    'smart': anthropic('claude-opus-4-5'),
  },
  fallbackProvider: openai,
});
```

### Available Providers (40+)

OpenAI, Anthropic, Google, Google Vertex, Azure, Amazon Bedrock, Groq, Mistral, Cohere, DeepSeek, xAI, Fireworks, Together AI, Perplexity, DeepInfra, Replicate, Hugging Face, Cerebras, Moonshot, Alibaba, ByteDance, BaseTen, Fal, Luma, AssemblyAI, Deepgram, ElevenLabs, Hume, LMNT, Gladia, Rev.ai, Prodia, Voyage, Black Forest Labs, KlingAI, Vercel Gateway.

---

## Streaming Implementation

### How Streaming Works Internally

1. `streamText` calls `streamLanguageModelCall` which calls `model.doStream(params)`
2. The provider returns a `ReadableStream<LanguageModelV4StreamPart>`
3. The SDK applies transformation pipeline: tool execution, telemetry, callbacks
4. `createStitchableStream` stitches together multi-step streams
5. Results are exposed as `AsyncIterableStream` (implements both `AsyncIterable` and `ReadableStream`)

### Stream Part Types

```typescript
type TextStreamPart<TOOLS> =
  | { type: 'text-delta'; textDelta: string }
  | { type: 'reasoning-delta'; reasoningDelta: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; input: any }
  | { type: 'tool-result'; toolCallId: string; toolName: string; result: any }
  | { type: 'tool-call-streaming-start'; toolCallId: string; toolName: string }
  | { type: 'tool-call-delta'; toolCallId: string; argsTextDelta: string }
  | { type: 'step-start'; stepType: 'initial' | 'continue'; messageId: string }
  | { type: 'step-finish'; finishReason: FinishReason; usage: LanguageModelUsage; ... }
  | { type: 'finish'; finishReason: FinishReason; usage: LanguageModelUsage; ... }
  | { type: 'error'; error: unknown }
  | { type: 'source'; source: Source }
  | { type: 'file'; file: GeneratedFile }
  | { type: 'raw'; rawValue: unknown }  // when include.rawChunks: true
```

### Smooth Streaming

```typescript
import { streamText, smoothStream } from 'ai';

const result = streamText({
  model,
  prompt,
  experimental_transform: smoothStream({ chunking: 'word' }), // or 'line', regex
});
```

### UI Message Stream (for chat UIs)

```typescript
// Server (Next.js Route Handler)
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
  });

  return result.toUIMessageStreamResponse();
}

// Client (React hook via @ai-sdk/react)
import { useChat } from '@ai-sdk/react';

const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
});
```

### Direct Server Streaming (Node.js HTTP)

```typescript
import { streamText } from 'ai';
import http from 'http';

http.createServer(async (req, res) => {
  const result = streamText({ model, prompt: 'Hello' });
  result.pipeTextStreamToResponse(res);
}).listen(3000);
```

---

## Middleware System

Middleware wraps language models to intercept and transform parameters or results.

### Built-in Middleware

```typescript
import {
  wrapLanguageModel,
  extractReasoningMiddleware,
  defaultSettingsMiddleware,
  simulateStreamingMiddleware,
  extractJsonMiddleware,
  addToolInputExamplesMiddleware,
} from 'ai';

// Apply single middleware
const model = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: extractReasoningMiddleware({ tagName: 'thinking' }),
});

// Apply multiple middleware (array, applied in order - first transforms input first)
const model2 = wrapLanguageModel({
  model: openai('gpt-4o'),
  middleware: [
    defaultSettingsMiddleware({ settings: { temperature: 0.3 } }),
    extractReasoningMiddleware({ tagName: 'think', startWithReasoning: true }),
  ],
});

// Override provider/model IDs
const model3 = wrapLanguageModel({
  model: groq('deepseek-r1-distill-llama-70b'),
  middleware: extractReasoningMiddleware({ tagName: 'think' }),
  modelId: 'deepseek-r1',
  providerId: 'groq',
});
```

### Custom Middleware

```typescript
import type { LanguageModelMiddleware } from 'ai';

const loggingMiddleware: LanguageModelMiddleware = {
  specificationVersion: 'v4',

  // Transform input parameters
  transformParams: async ({ params }) => {
    console.log('Calling model with params:', params);
    return params;
  },

  // Wrap non-streaming generation
  wrapGenerate: async ({ doGenerate, params }) => {
    const result = await doGenerate();
    console.log('Generated:', result.content);
    return result;
  },

  // Wrap streaming generation
  wrapStream: async ({ doStream, params }) => {
    const { stream, ...rest } = await doStream();
    const transformedStream = stream.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        console.log('Chunk:', chunk);
        controller.enqueue(chunk);
      },
    }));
    return { stream: transformedStream, ...rest };
  },
};
```

### Provider-level Wrapping

```typescript
import { wrapProvider } from 'ai';

const wrappedProvider = wrapProvider(openaiProvider, {
  languageModelMiddleware: [loggingMiddleware],
  imageModelMiddleware: [imageLoggingMiddleware],
});
```

---

## Telemetry

Built on OpenTelemetry. Integration via `registerTelemetry`.

```typescript
import { registerTelemetry } from 'ai';
import { LegacyOpenTelemetry } from '@ai-sdk/otel';
import { NodeSDK } from '@opentelemetry/sdk-node';

const sdk = new NodeSDK({ traceExporter: new ConsoleSpanExporter() });
sdk.start();
registerTelemetry(new LegacyOpenTelemetry());

// Then enable per-call
const result = await generateText({
  model,
  prompt,
  telemetry: {
    functionId: 'my-feature',
    isEnabled: true,
    recordInputs: true,
    recordOutputs: true,
    includeRuntimeContext: { userId: true },  // selectively include context fields
    metadata: { version: '1.0' },
  },
});
```

---

## Key Code Patterns (with snippets)

### Pattern 1: Multi-step Agentic Loop

```typescript
import { openai } from '@ai-sdk/openai';
import { generateText, tool, isStepCount, hasToolCall } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-4o'),
  system: 'You are a research assistant.',
  prompt: 'Find information about quantum computing.',
  tools: {
    search: tool({
      description: 'Search the internet',
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => `Results for: ${query}`,
    }),
    finalAnswer: tool({
      description: 'Provide the final answer',
      inputSchema: z.object({ answer: z.string() }),
      // No execute = pauses loop and returns to caller
    }),
  },
  stopWhen: [isStepCount(10), hasToolCall('finalAnswer')],
  onStepFinish: async ({ stepType, text, toolCalls, toolResults, usage }) => {
    console.log(`Step finished. Tools called: ${toolCalls.map(c => c.toolName)}`);
  },
});
```

### Pattern 2: Structured Output (modern approach)

```typescript
import { generateText, streamText } from 'ai';
import { z } from 'zod';

// Non-streaming typed output
const { output } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Extract entity data from: "John Smith, 35, Software Engineer"',
  output: output.object({
    schema: z.object({
      name: z.string(),
      age: z.number(),
      role: z.string(),
    }),
  }),
});
// output is typed as { name: string; age: number; role: string }

// Streaming typed output with partial updates
const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'List 5 programming languages with descriptions',
  output: output.array({
    element: z.object({ name: z.string(), description: z.string() }),
  }),
});
for await (const element of result.elementStream) {
  console.log('New element:', element); // each element emitted as complete
}
```

### Pattern 3: Streaming to Next.js API Route

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: 'You are a helpful assistant.',
    onFinish: async ({ usage, finishReason }) => {
      // log usage to database
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### Pattern 4: MCP Tool Integration

```typescript
import { createMCPClient } from '@ai-sdk/mcp';
import { generateText, isStepCount } from 'ai';
import { openai } from '@ai-sdk/openai';

async function runWithMCP() {
  const mcp = await createMCPClient({
    transport: { type: 'http', url: process.env.MCP_SERVER_URL! },
  });

  try {
    const mcpTools = await mcp.tools();

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      tools: mcpTools,
      stopWhen: isStepCount(10),
      instructions: mcp.instructions,  // use server-provided instructions
      prompt: 'Complete my task using available tools.',
    });

    return text;
  } finally {
    await mcp.close();
  }
}
```

### Pattern 5: Model Routing via Middleware

```typescript
import { wrapLanguageModel, defaultSettingsMiddleware } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

// Cheap model with enforced settings
const routineModel = wrapLanguageModel({
  model: openai('gpt-5-nano'),
  middleware: defaultSettingsMiddleware({
    settings: { temperature: 0.3, maxOutputTokens: 512 },
  }),
});

// Powerful model for complex reasoning
const complexModel = anthropic('claude-opus-4-5');

function selectModel(taskType: 'routine' | 'complex') {
  return taskType === 'routine' ? routineModel : complexModel;
}
```

### Pattern 6: Error Handling Pattern

```typescript
import { AISDKError, NoTextGeneratedError, APICallError } from 'ai';

try {
  const result = await generateText({ model, prompt });
} catch (error) {
  if (NoTextGeneratedError.isInstance(error)) {
    console.log('Model returned no text');
  } else if (APICallError.isInstance(error)) {
    console.log('API error:', error.statusCode, error.message);
  } else if (AISDKError.isInstance(error)) {
    console.log('AI SDK error:', error.name, error.message);
  }
}
```

---

## What We Can Reuse

### For AI Agency Product Development

1. **Provider-agnostic model routing**: Use the provider registry + custom provider to implement Sonnet-for-routine / Opus-for-complex routing cleanly. Swap providers without changing application code.

2. **ToolLoopAgent for agentic workflows**: Replace manual LangGraph graphs for standard tool-loop patterns. `ToolLoopAgent` handles the loop, stop conditions, callbacks, and streaming out of the box.

3. **MCP client for tool ecosystem**: Use `@ai-sdk/mcp` to connect agents to any MCP-compliant tool server. Enables plug-and-play tools from the MCP ecosystem (databases, APIs, file systems).

4. **`streamText` + `toUIMessageStreamResponse()`**: Drop-in streaming for Next.js chat interfaces. Complete streaming pipeline from LLM to browser in ~10 lines.

5. **`output.object()` / `output.array()`**: Reliable structured data extraction from LLMs for marketing/sales data pipelines (lead extraction, sentiment analysis, content classification).

6. **Middleware for cross-cutting concerns**: `wrapLanguageModel` with custom middleware for request logging, cost tracking, prompt caching, rate limiting, A/B testing models.

7. **`prepareStep` for dynamic multi-model workflows**: Switch models mid-conversation based on task complexity detected in earlier steps.

8. **`runtimeContext` + `toolsContext`**: Pass tenant ID, user ID, session data cleanly through the entire agent lifecycle without global state.

9. **`smoothStream`**: Better UX for streamed responses in chat products.

10. **Telemetry integration**: `registerTelemetry` + OpenTelemetry for production observability of LLM calls, token usage, tool call latency.

---

## Lessons & Best Practices

### Architecture

- **Modular by default**: Each provider is a separate package. Only import what you need.
- **`generateObject` is deprecated**: Use `generateText` with `output` parameter instead. It supports the same structured output with less API surface.
- **`stopWhen` default differs**: `generateText` defaults to `isStepCount(1)` (no loop). `ToolLoopAgent` defaults to `isStepCount(20)`. Always set explicitly.
- **Never use `JSON.parse` directly**: Use `safeParseJSON` / `parseJSON` from `@ai-sdk/provider-utils` (security best practice enforced in the codebase).

### Tool Design

- **Omit `execute` to pause the loop**: A tool without `execute` causes `generateText` to stop and return the tool call to the application. Use this for human-in-the-loop or to pass tool calls to external systems.
- **`outputSchema` improves reliability**: Defining `outputSchema` on tools validates the execute return value, catching bugs early.
- **Use `activeTools` for step-level control**: Don't expose all tools at every step. Use `prepareStep` to limit available tools per step for more predictable agentic behavior.
- **Tool names matter**: LLMs use tool names and descriptions heavily. Use clear, action-oriented names (`searchWeb`, `sendEmail`, `calculateTotal`).

### Streaming

- **`fullStream` vs `textStream`**: Use `textStream` for simple text display. Use `fullStream` when you need to react to tool calls, tool results, or step boundaries.
- **Always handle errors in streams**: Wrap stream consumption in try/catch or use `onError` callback. Unhandled stream errors can cause silent failures.
- **`result.text` is a Promise**: Even in `streamText`, you can `await result.text` to get the complete text after the stream finishes.

### Cost Optimization (relevant to 70% margin target)

- Use `wrapLanguageModel` + `defaultSettingsMiddleware` to enforce token limits on cheap models.
- Use `activeTools` to limit tool calls in early steps (reduces unnecessary tool invocations).
- Use `stopWhen: isStepCount(N)` conservatively. Unbounded loops with `isLoopFinished()` can be expensive.
- `providerOptions` can pass provider-specific caching hints (e.g., Anthropic's prompt caching).
- `include: { requestBody: false, requestMessages: false }` reduces memory for large image/file payloads in steps.

### Vietnam Market / Zalo Integration Notes

- The SDK's HTTP transport is generic. You can wrap Zalo API calls as standard `tool()` definitions.
- Use `runtimeContext` to carry Zalo user IDs, MoMo transaction IDs, etc. through agent calls.
- The `openai-compatible` provider package works with any OpenAI-compatible API, useful if self-hosting models.

### Testing

- Use Vitest. Test files alongside source with `.test.ts` extension.
- `packages/ai/src/test/` contains mock model helpers for unit testing without real API calls.
- Store fixtures in `__fixtures__/` and snapshots in `__snapshots__/`.

### Security

- Never commit API keys. Use `loadApiKey` from `@ai-sdk/provider-utils`.
- Validate tool outputs with `outputSchema`.
- Use `safeParseJSON` / `safeValidateTypes` for all JSON parsing in tool results.
- `toolApproval` / `needsApproval` for any destructive operations.
