---
tags: [knowledge, chatbot-platform, hexabot, nestjs, workflow-engine, mcp]
source_repo: Hexabot
files_read: 100+
---

# Hexabot - Comprehensive Knowledge File

## Overview

**Hexabot v3** is an open-source agentic automation platform by **Hexastack**. Tagline: "Automate the Boring, Keep the Magic." Version: `3.2.2-alpha.15`.

It combines:
- Visual workflow editor (drag-and-drop canvas + YAML DSL alternative)
- Chatbot channels (multi-channel messaging: web, Facebook, WhatsApp, etc.)
- Embeddable chat widget (UMD build, Shadow DOM isolated)
- MCP (Model Context Protocol) server support — Hexabot exposes itself as an MCP server
- RAG (Retrieval-Augmented Generation) via memory definitions
- Human-in-the-loop via resumable/suspendable workflow execution

**License:** Fair Core License 1.0 (FCL-1.0-ALv2) — converts to **Apache 2.0 after 2 years**. This is source-available now, fully open later. Safe to study and build upon; non-compete clause applies during FCL period.

**GitHub:** https://github.com/Hexastack/Hexabot

---

## Architecture Overview

### Monorepo Structure

PNPM Monorepo + Turborepo. Seven packages:

```
@hexabot-ai/monorepo (root)
  packages/
    api/          # NestJS backend — REST + WebSocket, port 3000
    agentic/      # Workflow engine — YAML DSL, suspension/resumption
    types/        # Shared Zod schemas (schema-first across all packages)
    frontend/     # React 18 + Vite admin SPA, port 8080
    graph/        # xyflow (React Flow v12) + ELK renderer for workflow canvas
    widget/       # Embeddable chat widget (UMD build, Shadow DOM)
    cli/          # CLI for scaffolding new projects/extensions
```

### Communication Topology

| Layer | Protocol | Use |
|---|---|---|
| Client <-> API | REST (Axios) | CRUD operations, all admin actions |
| Client <-> API | WebSocket (Socket.IO) | Real-time chat, live admin updates |
| External systems | Webhooks (`/api/webhook/:sourceRef`) | Inbound channel messages |
| MCP clients | MCP Streamable HTTP (`/api/mcp`) | Claude Code, Codex, other LLM agents |
| Internal modules | NestJS EventEmitter2 | Domain events between modules |
| Monorepo packages | PNPM workspace imports | Shared types, utils |

### Docker Services

| Service | Image | Port | Required | Notes |
|---|---|---|---|---|
| api | hexastack/hexabot-api | 3000 | Yes | NestJS backend |
| frontend | hexastack/hexabot-ui | 8080 | Yes | React admin SPA |
| postgres | postgres:16-alpine | 5432 | Yes (prod) | Primary DB |
| pgadmin | — | optional | No | DB administration UI |
| redis | redis | — | No | Production cache + Socket.IO adapter |
| ollama | — | — | No | Local LLM inference |
| nginx | — | — | No | Reverse proxy |
| smtp4dev | — | — | No | Email dev testing |

---

## Tech Stack

### Backend (packages/api)

| Concern | Technology |
|---|---|
| Framework | NestJS v10+ (Express) |
| Language | TypeScript |
| ORM | TypeORM (NOT Mongoose) |
| DB (dev) | SQLite (zero-config) |
| DB (prod) | PostgreSQL 16 |
| Auth | Passport.js, session-based (express-session), Local strategy; JWT for invite/reset/confirm flows |
| Cache | Redis via Keyv (prod) or CacheableMemory (dev), switchable via env |
| Validation | Zod (schema-first, shared via packages/types) |
| Workflow expressions | JSONata (prefixed with `=` in YAML) |
| Real-time | Socket.IO server |
| AI protocol | MCP via @rekog/mcp-nest |
| Email | SMTP + MJML templates |
| API docs | Swagger (non-production only) |
| Global prefix | /api |
| Node requirement | ^20.19.0 |

### Frontend (packages/frontend)

| Concern | Technology |
|---|---|
| Framework | React 18 SPA |
| Build tool | Vite |
| Language | TypeScript 5.8 |
| UI library | MUI v7 + Emotion |
| Icons | Lucide |
| Routing | React Router DOM v6 |
| Server state | TanStack Query v5 |
| UI state | React Context |
| Forms | React Hook Form v7 |
| Entity normalization | Normalizr |
| HTTP | Axios with interceptors |
| Real-time | Socket.IO client |
| Code editor | Monaco Editor (YAML editing) |
| Workflow canvas | @xyflow/react (React Flow v12) + elkjs (auto-layout) |
| Toasts | Notistack |
| NO Redux | — |

### Chat Widget (packages/widget)

| Concern | Technology |
|---|---|
| Framework | React 18 |
| Build output | Vite UMD bundle (embeddable anywhere) |
| CSS | SCSS + Shadow DOM isolation (no host page style leaks) |
| Real-time | Socket.IO client |
| Cross-tab sync | BroadcastChannel API |
| Transport options | WebSocket or long-polling |

### Workflow Engine (packages/agentic)

| Concern | Technology |
|---|---|
| DSL | YAML |
| Expressions | JSONata (prefixed `=`) |
| Execution model | Suspension + Resumption (human-in-the-loop) |
| Max call stack | 10 levels |
| Trigger types | conversational / manual / scheduled (cron) |
| Action definition | `defineAction()` with Zod input/output schemas |
| Testing | Vitest |

---

## Key Code Patterns

### 1. Base Generics Pattern (Backend)

Hexabot uses a strict 4-layer generic inheritance chain for every domain entity:

```typescript
// Layer 1: Entity (TypeORM)
@Entity()
class WorkflowOrmEntity extends BaseOrmEntity {
  @Column() name: string;
  @Column({ type: 'text' }) definitionYml: string;
  @Column({ default: 'draft' }) status: 'draft' | 'published';
}

// Layer 2: Repository
class WorkflowRepository extends BaseOrmRepository<WorkflowOrmEntity> {}

// Layer 3: Service
class WorkflowService extends BaseOrmService<WorkflowOrmEntity, WorkflowRepository> {}

// Layer 4: Controller
@Controller('workflows')
class WorkflowController extends BaseOrmController<WorkflowOrmEntity, WorkflowService> {}
```

This pattern eliminates boilerplate for CRUD. Every domain module follows it. The base layer provides:
- `PopulatePipe` for relation eager loading
- `TypeOrmSearchFilterPipe` for query filtering
- Zod `plainCls` / `fullCls` for serialization

### 2. Extension / Plugin System (Runtime Discovery)

Hexabot auto-discovers plugins from npm packages at startup via naming convention:

```
hexabot-channel-*   ->  ChannelHandler (messaging platform integration)
hexabot-action-*    ->  BaseAction (workflow step handler)
hexabot-helper-*    ->  BaseHelper (AI/NLP provider)
```

No core code changes needed to add extensions:

```typescript
// Channel plugin example
@Injectable()
class WhatsAppChannel extends ChannelHandler {
  getName() { return 'whatsapp'; }

  async handle(req: Request, res: Response, source: Source): Promise<void> {
    // Receive and normalize inbound message
  }

  async doSendMessage(event: AnyEvent, envelope: StdOutgoingEnvelope): Promise<void> {
    // Send outbound message to WhatsApp API
  }

  getSourceSettingsSchema(): ZodSchema {
    return z.object({ phoneNumberId: z.string(), accessToken: z.string() });
  }
}

// Action plugin (workflow step)
const sendEmailAction = defineAction({
  name: 'send_email',
  input: z.object({ to: z.string().email(), subject: z.string(), body: z.string() }),
  output: z.object({ messageId: z.string() }),
  async execute({ input, context }) {
    const result = await mailer.send(input);
    return { messageId: result.id };
  }
});
```

### 3. Workflow YAML DSL

```yaml
name: lead-qualification
trigger:
  type: conversational
  channel: widget

inputs:
  message: string

context:
  memory: {}
  user:
    name: null
    budget: 0

flow:
  # Sequential step group
  - do:
    - action: send_text_message
      params:
        text: "Hello! How can I help you today?"

  # Suspension point — workflow pauses until user replies
  - do:
    - action: collect_input
      params:
        prompt: "What is your monthly budget?"
      bindings:
        output: $context.user.budget

  # JSONata conditional expression
  - conditional:
      condition: =$context.user.budget > 10000
      then:
        - action: send_text_message
          params:
            text: "Great, let me connect you with our enterprise team."
        - action: notify_slack
          params:
            channel: "#high-value-leads"
            message: "New lead: =$context.user.name, budget: =$context.user.budget"
      else:
        - action: add_to_nurture_sequence

  # Parallel execution
  - parallel:
      wait: all    # or: any
      tasks:
        - do:
          - action: sync_to_crm
        - do:
          - action: send_confirmation_email

  # Loop
  - loop:
      items: =$context.followup_days
      body:
        - action: schedule_followup
          params:
            delay: =$iteration

outputs:
  qualified: =$context.user.budget > 10000
```

**Key DSL features:**
- JSONata expressions prefixed with `=`: `$input`, `$context`, `$output.<task>`, `$iteration`
- Flow primitives: `do`, `parallel` (wait_all/wait_any), `conditional`, `loop`
- Suspension/resume at `collect_input` and similar blocking actions
- `bindings` map step outputs to context variables

### 4. Single Table Inheritance (STI)

Users and Subscribers share one DB table, differentiated by TypeORM discriminator:

```typescript
@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
abstract class UserProfileOrmEntity extends BaseOrmEntity {
  @Column() locale: string;
  @Column({ nullable: true }) firstName: string;
  @Column({ nullable: true }) lastName: string;
}

@ChildEntity('subscriber')
class SubscriberOrmEntity extends UserProfileOrmEntity {
  @Column() foreignId: string;         // ID in the external channel
  @Column() channel: string;            // 'web', 'whatsapp', etc.
  @ManyToMany(() => LabelOrmEntity) labels: LabelOrmEntity[];
}

@ChildEntity('user')
class UserOrmEntity extends SubscriberOrmEntity {
  @Column({ unique: true }) username: string;
  @Column() email: string;
  @Column() password: string;          // bcrypt hashed
  @ManyToMany(() => RoleOrmEntity) roles: RoleOrmEntity[];
}
```

Note: STI causes nullable columns for child-only fields at the DB level. At scale this can cause issues with partial indexes. Consider separate tables if subscriber volume is very high.

### 5. RBAC Pattern

```typescript
// Role -> Permission -> (Model + Action + Relation)
interface Permission {
  model: string;        // e.g., 'workflow', 'message', 'subscriber'
  action: 'create' | 'read' | 'update' | 'delete';
  relation: 'own' | 'any';
}

// Global Ability guard maps HTTP verbs to actions automatically
// GET -> read, POST -> create, PATCH/PUT -> update, DELETE -> delete

// Controller usage
@UseGuards(JwtAuthGuard, AbilityGuard)
@Controller('workflows')
class WorkflowController {
  @Get()              // read:any:workflow required
  findAll() {}

  @Post()             // create:any:workflow required
  create() {}

  @Patch(':id')       // update:own OR update:any:workflow required
  update() {}
}

// Frontend hook
const canPublish = useHasPermission('workflow', 'update');
const allowedActions = getAllowedActions('message');
```

Permission lookups are cached in Redis/in-memory. Cache is invalidated on role/permission change.

### 6. Frontend API Hook Pattern

```typescript
// Generic CRUD hooks wrapping TanStack Query v5
const { data: workflows, isLoading } = useFind('workflow', {
  filters: { status: 'published' },
  populate: ['currentVersion'],
});

const { data: workflow } = useGet('workflow', workflowId);

const createWorkflow = useCreate('workflow');
const updateWorkflow = useUpdate('workflow');
const deleteWorkflow = useDelete('workflow');

// Infinite scroll for chat messages
const { data, fetchNextPage, hasNextPage } = useInfiniteFind('message', {
  filters: { threadId },
});

// Usage
createWorkflow.mutate(
  { name: 'New Flow', trigger: { type: 'manual' } },
  { onSuccess: () => navigate(`/workflows/${result.id}`) }
);
```

Entity normalization via Normalizr keeps the TanStack Query cache consistent across queries. Updates to one entity automatically reflect in all queries that include it.

### 7. Frontend Provider Tree

Provider nesting order matters — infrastructure before domain:

```tsx
<BrowserRouter>
  <ConfigProvider>           {/* App config (API URL, SSO, etc.) */}
    <AppTheme>               {/* MUI theme */}
      <SnackbarProvider>     {/* Toast notifications */}
        <QueryClientProvider>{/* TanStack Query cache */}
          <BroadcastChannelProvider>  {/* Cross-tab sync */}
            <ApiClientProvider>      {/* Axios instance */}
              <AuthProvider>         {/* Session / JWT */}
                <PermissionProvider> {/* RBAC */}
                  <SettingsProvider> {/* Platform settings */}
                    <DialogsProvider>{/* Global dialogs */}
                      <SocketProvider>{/* Socket.IO */}
                        <App />
                      </SocketProvider>
                    </DialogsProvider>
                  </SettingsProvider>
                </PermissionProvider>
              </AuthProvider>
            </ApiClientProvider>
          </BroadcastChannelProvider>
        </QueryClientProvider>
      </SnackbarProvider>
    </AppTheme>
  </ConfigProvider>
</BrowserRouter>
```

### 8. Chat Widget Embedding

```html
<!-- Embed in any webpage — no framework required -->
<script src="https://your-hexabot.com/widget/hexabot-widget.umd.js"></script>
<script>
  HexabotWidget({
    apiUrl: 'https://your-hexabot.com',
    channel: 'web',
    transport: 'ws',      // or 'polling'
    primaryColor: '#0066CC',
    greeting: 'Hello! How can I help?',
  });
</script>
```

Widget uses Shadow DOM — no host page CSS conflicts. BroadcastChannel syncs widget state across multiple browser tabs (e.g., if user opens site in new tab, chat history persists).

### 9. MCP Server (40+ Tools Exposed)

When `MCP_ENABLED=true`, Hexabot exposes its capabilities as MCP tools:

```typescript
// MCP tools auto-generated from workflow definitions
// External MCP clients (Claude Code, Cursor, etc.) can call:
{
  "method": "tools/call",
  "params": {
    "name": "run_workflow",
    "arguments": {
      "workflowId": "lead-qualification",
      "inputs": { "message": "I need an enterprise plan" }
    }
  }
}

// Auth: personal bearer tokens with 'hbt_mcp_' prefix, SHA-256 hashed
// Transport: Streamable HTTP at /api/mcp
// Tools categories: workflows, runs, memory, actions, credentials, CMS
```

### 10. defineAction() Pattern

```typescript
import { defineAction } from '@hexabot-ai/agentic';
import { z } from 'zod';

export const generateReplyAction = defineAction({
  name: 'generate_reply',

  input: z.object({
    message: z.string(),
    systemPrompt: z.string().optional(),
    model: z.string().default('gpt-4o-mini'),
  }),

  output: z.object({
    text: z.string(),
    tokensUsed: z.number(),
  }),

  async execute({ input, context, services }) {
    const llm = services.getHelper('openai');
    const reply = await llm.chat({
      model: input.model,
      messages: [
        { role: 'system', content: input.systemPrompt ?? 'You are a helpful assistant.' },
        { role: 'user', content: input.message },
      ],
    });
    return { text: reply.content, tokensUsed: reply.usage.total_tokens };
  },
});
```

---

## Configuration & Setup

### Environment Variables (API)

```bash
# Database
DB_TYPE=postgres           # or sqlite (default for dev)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hexabot
DB_USER=hexabot
DB_PASS=secret

# Cache
CACHE_DRIVER=redis         # or memory (default for dev)
REDIS_HOST=localhost
REDIS_PORT=6379

# Session
SESSION_SECRET=your-long-random-secret
SESSION_MAX_AGE=86400000   # 24h in ms

# MCP
MCP_ENABLED=true
MCP_SECRET=your-mcp-secret

# App
NODE_ENV=production
PORT=3000

# Email
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# License
LICENSE_KEY=your-fcl-key   # Required for production
```

### Frontend Environment

```bash
VITE_API_ORIGIN=https://your-hexabot.com
VITE_SSO_ENABLED=false
VITE_WIDGET_URL=https://your-hexabot.com/widget
```

### PNPM Workspace Commands

```bash
# Install all packages
pnpm install

# Run all packages in parallel (Turborepo)
pnpm dev

# Build all
pnpm build

# Run specific package
pnpm --filter @hexabot-ai/api dev
pnpm --filter @hexabot-ai/frontend dev
pnpm --filter @hexabot-ai/agentic test

# CLI scaffold
hexabot create my-project          # new project from template
hexabot dev [--docker]             # local dev (SQLite) or Docker
hexabot start [--docker]           # production start
hexabot migrate [args]             # DB migrations
```

### Docker Compose (Production)

```yaml
services:
  api:
    image: hexastack/hexabot-api:latest
    environment:
      DB_TYPE: postgres
      DB_HOST: postgres
      CACHE_DRIVER: redis
      REDIS_HOST: redis
      MCP_ENABLED: "true"
    depends_on: [postgres, redis]
    ports: ["3000:3000"]

  frontend:
    image: hexastack/hexabot-ui:latest
    environment:
      VITE_API_ORIGIN: https://your-domain.com
    ports: ["8080:8080"]

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: hexabot
      POSTGRES_USER: hexabot
      POSTGRES_PASSWORD: secret
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

---

## API & Integration Patterns

### Complete API Route Map

```
Authentication:
  POST   /api/auth/local              # Login with username/password
  GET    /api/auth/me                 # Current user session
  POST   /api/auth/logout             # Destroy session
  POST   /api/auth/confirm            # Email confirmation (JWT)
  POST   /api/auth/reset              # Password reset (JWT)

Users & Roles:
  GET    /api/user                    # List users (paginated)
  POST   /api/user                    # Create user (invite)
  GET    /api/user/:id
  PATCH  /api/user/:id
  DELETE /api/user/:id
  GET    /api/role                    # List roles
  POST   /api/role
  PATCH  /api/role/:id
  GET    /api/permission              # List permissions for current user

Workflows:
  GET    /api/workflow                # List workflows
  POST   /api/workflow                # Create workflow
  GET    /api/workflow/:id
  PATCH  /api/workflow/:id
  DELETE /api/workflow/:id
  POST   /api/workflow/:id/publish    # Publish current version
  POST   /api/workflow/:id/unpublish  # Revert to draft
  POST   /api/workflow/:id/run        # Manual trigger (returns run ID)

Workflow Runs:
  GET    /api/workflow-run            # List runs (filter by workflow, status)
  GET    /api/workflow-run/:id        # Get run with step log
  POST   /api/workflow-run/:id/resume # Resume a suspended run

MCP Servers:
  GET    /api/mcpserver               # List configured MCP servers
  POST   /api/mcpserver               # Add MCP server config
  GET    /api/mcpserver/:id
  PATCH  /api/mcpserver/:id
  DELETE /api/mcpserver/:id
  POST   /api/mcpserver/:id/test      # Test connectivity
  GET    /api/mcpserver/:id/tools     # List available tools

Messaging:
  GET    /api/message                 # Messages (filter by thread)
  GET    /api/thread                  # Conversation threads
  GET    /api/subscriber              # Chat contacts
  PATCH  /api/subscriber/:id          # Update subscriber (labels, assignee)
  GET    /api/source                  # Channel source connections

Analytics:
  GET    /api/stats/messages          # Message volume over time
  GET    /api/stats/summary           # KPI summary
  GET    /api/stats/audiance          # Subscriber demographics

CMS:
  GET    /api/content-type            # CMS schemas
  POST   /api/content-type
  GET    /api/content                 # CMS entries
  POST   /api/content
  PATCH  /api/content/:id
  GET    /api/menu                    # Navigation menus
  GET    /api/attachment              # Media library
  POST   /api/attachment              # Upload file

Channels & Webhooks:
  GET    /api/channel                 # Available channel types
  GET|POST /api/webhook/:sourceRef    # Inbound messages from channels

Labels:
  GET    /api/label
  POST   /api/label
  PATCH  /api/label/:id

Settings:
  GET    /api/setting                 # All settings
  PATCH  /api/setting/:id

Languages & Translations:
  GET    /api/language
  GET    /api/translation
  POST   /api/translation

Credentials:
  GET    /api/credential              # Stored API keys (names only, not values)
  POST   /api/credential
  PATCH  /api/credential/:id

Audit:
  GET    /api/audit-log               # Audit trail (paginated)

MCP Endpoint (Streamable HTTP):
  POST   /api/mcp                     # MCP protocol messages
```

### WebSocket Events (Socket.IO)

```typescript
// Server -> Client events
socket.on('message:new', (message: MessageEntity) => {});
socket.on('message:read', ({ threadId, userId }) => {});
socket.on('thread:updated', (thread: ThreadEntity) => {});
socket.on('subscriber:typing', ({ threadId, isTyping }) => {});
socket.on('workflow:run:updated', (run: WorkflowRunEntity) => {});
socket.on('workflow:run:step', (step: StepLogEntry) => {});

// Client -> Server events
socket.emit('message:send', {
  threadId: string,
  content: string,
  type: 'text' | 'file' | 'location'
});
socket.emit('subscriber:typing', { threadId: string, isTyping: boolean });
socket.emit('message:read', { messageId: string });
```

---

## Database & Data Patterns

### Domain Entity Map

```
Users & Auth:
  user_profiles (STI table — subscribers + users)
  roles
  permissions
  sessions (express-session store)
  credentials (encrypted API keys)

Messaging:
  messages         (mid, sender, recipient, thread, message JSON, read, delivery)
  threads          (subscriber, source)
  sources          (channel connections per subscriber: foreignId, channel)
  labels           (name, color — applied to subscribers)

Workflows:
  workflows        (name, type, schedule cron, currentVersion, publishedVersion)
  workflow_versions (version number, definitionYml)
  workflow_runs    (status, snapshot, stepLog JSON)

AI & MCP:
  mcp_servers      (transport, url, command, env)
  memory_definitions (RAG config: collection, embedder, retrieval params)

CMS:
  content_types    (schema definition JSON)
  contents         (content entries JSON)
  menus            (navigation tree)
  attachments      (file metadata: name, size, type, url)

Platform:
  settings         (key-value, grouped by namespace)
  languages        (locale, rtl flag)
  translations     (key, locale, value)
  audit_logs       (actor, action, entity, before/after JSON)
```

### TypeORM Entity Pattern

```typescript
// Base entity — all domain entities extend this
@Entity()
export abstract class BaseOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Workflow with versioning
@Entity('workflows')
export class WorkflowOrmEntity extends BaseOrmEntity {
  @Column()
  name: string;

  @Column({ type: 'varchar', enum: ['conversational', 'manual', 'scheduled'] })
  type: WorkflowType;

  @Column({ nullable: true })
  schedule: string;                 // cron expression

  @Column({ default: 'draft' })
  status: 'draft' | 'published';

  @ManyToOne(() => WorkflowVersionOrmEntity, { nullable: true })
  currentVersion: WorkflowVersionOrmEntity;

  @ManyToOne(() => WorkflowVersionOrmEntity, { nullable: true })
  publishedVersion: WorkflowVersionOrmEntity;

  @OneToMany(() => WorkflowRunOrmEntity, (run) => run.workflow)
  runs: WorkflowRunOrmEntity[];
}

// Version stores the YAML
@Entity('workflow_versions')
export class WorkflowVersionOrmEntity extends BaseOrmEntity {
  @Column()
  version: number;

  @Column({ type: 'text' })
  definitionYml: string;

  @ManyToOne(() => WorkflowOrmEntity)
  workflow: WorkflowOrmEntity;
}

// Run stores execution state
@Entity('workflow_runs')
export class WorkflowRunOrmEntity extends BaseOrmEntity {
  @Column({ type: 'varchar' })
  status: 'idle' | 'running' | 'suspended' | 'finished' | 'failed';

  @Column({ type: 'json', nullable: true })
  snapshot: WorkflowSnapshot;       // Full execution state for resumption

  @Column({ type: 'json', default: '[]' })
  stepLog: StepLogEntry[];

  @ManyToOne(() => WorkflowOrmEntity)
  workflow: WorkflowOrmEntity;
}
```

### SQLite (Dev) vs PostgreSQL (Prod)

TypeORM handles the difference via `DB_TYPE` env var. Schemas are identical. SQLite removes the "everyone needs PostgreSQL installed" friction for local development. Switch to PostgreSQL for any team or production deployment.

---

## Frontend Architecture Details

### Admin Panel Pages

```
/dashboard              # KPIs, latest workflows, recent runs, integrations health
/workflows              # Workflow list
/workflows/:id          # Visual workflow editor (React Flow canvas + YAML Monaco editor)
/workflow-runs          # Execution history with step-level debugger
/memory                 # Memory definitions (RAG config)
/mcp-servers            # External MCP server management
/inbox                  # Live conversation inbox (left: subscriber list, right: chat)
/cms/content-types      # CMS schema builder
/cms/contents           # CMS content entries
/cms/menus              # Navigation menu editor
/cms/media              # Media library (attachments)
/subscribers            # Subscriber list with label filtering
/labels                 # Conversation label management
/users                  # Admin user management
/roles                  # RBAC role editor with permission matrix
/audit                  # Audit log viewer
/credentials            # Stored API key management
/languages              # Locale management
/translations           # String translation editor
/settings               # Platform settings
/sources                # Channel source configuration
/profile                # Current user profile
/login                  # Login page
```

### Visual Workflow Editor Components

The workflow editor (xyflow canvas) uses drawer-based editing:

```
WorkflowEditorPage
  ├── WorkflowCanvas (React Flow)        # Drag-and-drop node graph
  ├── YamlEditor (Monaco)                # Raw YAML alternative view
  ├── Toolbar (publish, unpublish, run)
  └── Drawers (open on node click):
        ├── ActionListDrawer             # Browse available actions
        ├── ActionFormDrawer             # Configure action params
        ├── BindingSelectionDrawer       # Map outputs to context vars
        ├── ToolFormDrawer               # Configure MCP tool calls
        ├── ConditionalFormDrawer        # Set condition expressions
        ├── LoopFormDrawer               # Configure loop
        └── ParallelFormDrawer           # Configure parallel branches
```

### Dashboard Widgets

```
KPICards                    # Total conversations, messages, subscribers
QuickActions                # Create workflow, open inbox, add MCP server
LatestWorkflows             # Recently modified workflows with status
AttentionRequired           # Suspended runs needing human input
RecentRuns                  # Last N workflow executions with status
UpcomingScheduleTimeline    # Next scheduled workflow triggers
ThreadSnapshot              # Sample of recent conversations
RecentActivityTimeline      # Audit log feed
IntegrationsHealth          # MCP server connection status
```

### Widget Screens

```
PRE_CHAT    # Optional pre-chat form (name, email collection)
LOADING     # Connecting spinner
CHAT        # Main conversation screen
POST_CHAT   # Optional post-chat survey
WEBVIEW     # Embedded URL view (for rich actions)
DISCONNECT  # Connection lost screen
ERROR       # Error state
```

---

## What We Can Reuse

### Directly Reusable Patterns

**1. Base Generic CRUD Layer**
The `BaseOrmEntity -> BaseOrmRepository -> BaseOrmService -> BaseOrmController` chain is production-tested and eliminates CRUD boilerplate in NestJS. Implement this in any NestJS project from day one.

**2. Plugin Auto-Discovery via npm Naming Convention**
The `hexabot-channel-*`, `hexabot-action-*`, `hexabot-helper-*` pattern lets external developers publish plugins without touching core code. Apply this to any extensible SaaS product.

**3. Frontend API Hook Pattern (useFind, useGet, etc.)**
TanStack Query v5 wrappers with entity normalization provide a clean, consistent data layer. The pattern works for any React admin panel.

**4. Resumable Workflow Execution**
Suspend at input steps, save full execution snapshot, resume when event arrives. This is the correct approach for human-in-the-loop automation — more robust than polling or timeouts.

**5. Schema-First with Zod Across the Monorepo**
Shared Zod schemas in a `types` package validate API input (backend) and form data (frontend). Single source of truth eliminates DTO duplication bugs.

**6. MCP Server Exposure**
Exposing business workflows as MCP tools lets Claude Code, Cursor, and other LLM clients invoke them directly. High-leverage integration for AI agency work.

**7. Embeddable Widget Architecture**
Shadow DOM + UMD build + BroadcastChannel for cross-tab sync is the correct approach for a white-label embeddable widget. Avoids CSS conflicts, works in any web environment.

**8. RBAC with Cached Permission Lookup**
Role -> Permission -> (Model + Action + Relation) with Redis-cached lookup is scalable and granular enough for multi-tenant SaaS.

**9. Workflow Versioning Pattern**
Store workflow definitions as versioned YAML snapshots in a `_versions` table. Enables rollback, audit trail, and A/B testing of automation flows.

**10. Credentials Module**
Separate `credentials` table for API keys (names visible, values encrypted). Never store secrets in settings or env vars accessed at runtime by the app.

### Architecture Patterns for AI Agency Systems

| Hexabot Pattern | Apply To |
|---|---|
| YAML workflow DSL + suspension | Client automation builders, approval flows |
| Multi-channel routing | Zalo/Facebook/Email unified inbox |
| MCP server exposure | Claude Code / LLM tool integration |
| STI for user types | Agency staff vs end-customers |
| Plugin system | Client-specific channel adapters |
| Widget embedding | Client website chat integration |
| Workflow versioning | Compliance-sensitive automation |
| RBAC with cached perms | Multi-tenant client isolation |

---

## Lessons & Best Practices

### Architecture

1. **Monorepo with Turborepo pays off.** Even with 7 packages, the shared `types` package alone eliminates entire categories of API/frontend contract bugs. Build caching from Turborepo reduces CI time significantly.

2. **TypeORM over Mongoose for relational domains.** Hexabot's domain (workflows, permissions, users, CMS) is relational. TypeORM with PostgreSQL is the correct choice. Use Mongoose only for truly document-oriented, schema-flexible data.

3. **SQLite for dev, PostgreSQL for prod.** TypeORM abstracts the difference cleanly. This removes setup friction for new developers. Always design the schema to be compatible with both.

4. **Session auth is fine for admin tools.** JWT is overused. For a web admin panel with server-side sessions (Redis-backed), express-session is simpler to implement and easier to invalidate than JWT. Use JWT only for stateless API consumers.

5. **Cache must be switchable via environment.** CacheableMemory (dev) vs Redis (prod) behind the same interface means no code changes between environments. Apply this to any cache-dependent system.

### Workflow Engine

6. **Suspension/resumption over polling.** When a workflow needs human input, suspend and save snapshot state. Resume when the event fires. Never poll in a loop — it wastes resources and fails silently.

7. **Enforce max call stack depth.** Hexabot limits workflow recursion to 10 levels. Always set explicit limits on nested/recursive execution to prevent runaway processes. Make the limit configurable.

8. **YAML DSL over JSON for human-authored workflows.** YAML is readable, supports comments, is easier to diff in git. JSONata expressions add power without full programming complexity. This is approachable for non-developers.

9. **Version your workflows explicitly.** Storing `workflow_versions` separately from `workflows` enables rollback, audit trails, and running old versions during testing. Essential for production automation.

10. **defineAction() with Zod schemas is the right DX.** Typed input/output + validation + auto-generated tool definitions (for MCP) from a single function definition is elegant. Apply this pattern to any action/tool registry.

### Frontend

11. **No Redux in 2025+.** TanStack Query v5 handles server state (the vast majority in data-heavy apps). React Context handles the small amount of true UI state. React Hook Form handles form state. Redux adds complexity without benefit in this architecture.

12. **Monaco + React Flow as dual editing modes.** Power users want raw YAML control; visual users want drag-and-drop. Offering both with bidirectional sync is the right UX decision for developer-facing tools. The Monaco/xyflow combination is a reusable pattern.

13. **Provider tree order is architecture documentation.** The nesting order (infrastructure -> auth -> permissions -> settings -> dialogs -> realtime) expresses dependency relationships. Get this right early; refactoring is painful.

14. **Shadow DOM is mandatory for embeddable widgets.** Any widget meant for embedding in third-party sites must use Shadow DOM. Without it, CSS conflicts are inevitable and impossible to debug for customers.

15. **Normalizr keeps TanStack Query cache consistent.** When an entity appears in multiple queries (e.g., a subscriber in threads AND in the subscriber list), Normalizr ensures updates reflect everywhere without manual cache invalidation.

### Plugin System

16. **npm as plugin registry is the right choice.** Standard versioning, dependency management, discoverability, and semantic versioning come for free. No custom plugin store needed. Community can contribute without access to the core repo.

17. **Three plugin categories cleanly cover the surface area.** Channels (transport), Helpers (AI/NLP processing), Actions (workflow steps) — these three abstractions are sufficient and minimal for an agentic automation platform.

### MCP & AI Integration

18. **Expose your platform as an MCP server from day one.** This is a high-leverage integration move. Once Hexabot exposes its workflows as MCP tools, any MCP-compatible LLM client can orchestrate them without custom API integration code.

19. **Bearer token auth for MCP with hashed storage.** Personal `hbt_mcp_` prefix tokens, SHA-256 hashed before storage (same pattern as GitHub personal access tokens). Never store raw tokens.

20. **Build explicit MCP tool testing.** The `POST /api/mcpserver/:id/test` endpoint and tool listing endpoint are essential developer experience features. Always build testability into integrations.

### Security & Compliance

21. **Audit logs must be day-one, not a retrofit.** Hexabot includes an audit log module from the start. For any B2B SaaS, especially compliance-sensitive clients, audit trails are a must-have feature.

22. **Cache invalidation for permissions is a security issue.** Stale permission data is a security bug. When roles/permissions change, invalidate the permission cache immediately and synchronously.

23. **TypeORM STI has nullable column tradeoffs.** Single Table Inheritance means child-entity-only columns are nullable at the DB level. For large subscriber tables (millions of rows), this can impact index efficiency. Monitor and plan for potential migration to separate tables.

---

## Hexabot vs Alternatives

| Feature | Hexabot | n8n | Flowise | Botpress |
|---|---|---|---|---|
| Chatbot focus | Strong | Weak | Medium | Strong |
| Workflow engine | YAML + visual | Visual only | Limited | Visual |
| MCP support | Native server | Plugin | No | No |
| Embeddable widget | Yes (Shadow DOM) | No | Yes | Yes |
| Open source | FCL (-> Apache 2y) | Apache 2.0 | Apache 2.0 | AGPL 3.0 |
| Self-hostable | Yes | Yes | Yes | Yes |
| NestJS backend | Yes | No | No | No |
| Human-in-loop | Yes (suspend/resume) | Yes (wait nodes) | Limited | Yes |
| Plugin system | npm auto-discovery | Node-based | Custom | Custom |
| RAG support | Yes (memory defs) | Plugin | Yes | Yes |
| Multi-tenant | Via RBAC | No | No | Yes |

---

## Quick Reference

### Start Development

```bash
git clone https://github.com/Hexastack/Hexabot
cd Hexabot
pnpm install
cp .env.example .env          # Set minimal config
pnpm dev                      # Start all packages
# API:      http://localhost:3000
# Swagger:  http://localhost:3000/api/docs
# Frontend: http://localhost:8080
```

### Create an Extension

```bash
# Channel (messaging platform)
hexabot create-extension my-channel --type channel

# Action (workflow step)
hexabot create-extension my-action --type action

# Helper (AI/NLP provider)
hexabot create-extension my-helper --type helper

cd hexabot-channel-my-channel
pnpm dev    # Auto-discovered by the running platform
```

### Trigger Types Quick Reference

| Type | When fires | Config |
|---|---|---|
| conversational | User sends message | channel filter |
| manual | API call or admin button | none |
| scheduled | Cron timer | schedule: "0 9 * * 1-5" |

### Workflow Status Lifecycle

```
draft -> (publish) -> published
published -> (unpublish) -> draft

run status:
idle -> running -> finished
               -> suspended -> (resume) -> running
               -> failed
```

### Admin Routes Quick Reference

```
/dashboard          KPIs, health, recent activity
/workflows          Workflow list + visual editor
/workflow-runs      Execution history + debugger
/memory             RAG memory definitions
/mcp-servers        External MCP server connections
/inbox              Live conversation inbox
/cms/*              Content management
/subscribers        Chat contacts
/users + /roles     User management + RBAC
/audit              Audit trail
/credentials        API key storage
/settings           Platform configuration
```

---

## Related Knowledge

- [[LangGraph-Knowledge]] — Compare workflow execution models (LangGraph state machines vs Hexabot YAML DSL)
- [[n8n-Knowledge]] — Alternative workflow automation platform
- [[MCP-Protocol]] — Model Context Protocol deep dive
- [[NestJS-Patterns]] — NestJS architecture patterns
- [[RAG-Architecture]] — RAG implementation patterns
- [[Widget-Embedding-Patterns]] — Embeddable UI techniques

---

*Source: Hexabot v3 GitHub repository — 100+ files read across api, frontend, agentic, widget, types, graph, cli packages.*
*Agents: 3 (README/Architecture, Backend Code, Frontend Code)*
*Date analyzed: 2026-05-09*
