---
tags: [knowledge, inbox-zero, email, ai, nextjs, automation]
source_repo: inbox-zero
---

# Inbox Zero - Knowledge Extraction

## Overview & Architecture

Inbox Zero is an open-source AI email assistant that organizes inboxes, pre-drafts replies, manages calendars, and handles attachments. It is an alternative to Fyxer and supports Gmail and Outlook (Microsoft Graph).

**Core value proposition:** AI rules defined in plain English that automatically classify, label, archive, reply, or forward emails 24/7 without user intervention.

**Monorepo structure (Turborepo + pnpm workspaces):**

```
apps/web/          # Main Next.js 16 application (App Router) — frontend + backend
packages/
  tinybird/        # Real-time analytics data pipes
  tinybird-ai-analytics/  # AI usage analytics
  loops/           # Marketing email automation
  resend/          # Transactional email package
  tsconfig/        # Shared TypeScript config
prisma/            # PostgreSQL schema + migrations (in apps/web/prisma/)
docker/            # Dockerfile.prod, Dockerfile.local
```

**Key architecture decisions:**
- Next.js App Router handles both frontend UI and all API routes
- Server Actions (next-safe-action) for all mutations — NOT POST API routes
- SWR for client-side data fetching; `mutate()` after mutations
- Redis (Upstash/ioredis) for distributed locks and caching
- Queue backends: BullMQ (self-hosted), QStash (serverless), or internal in-memory
- Jotai for client state (ai-queue, archive-queue, categorize-sender-queue)
- Tinybird for email analytics (not stored in Postgres)

---

## Tech Stack & Dependencies

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.5 |
| Language | TypeScript (strict) | — |
| UI | React + Tailwind CSS + shadcn/ui | React 19.2.6 |
| ORM | Prisma | 7.8.0 |
| Database | PostgreSQL | — |
| Auth | Better Auth | 1.6.9 |
| AI SDK | Vercel AI SDK (`ai`) | 6.0.175 |
| Queue | BullMQ / QStash | BullMQ 5.76.6 |
| Cache/Lock | Upstash Redis / ioredis | ioredis 5.10.1 |
| Analytics | Tinybird | — |
| Server Actions | next-safe-action | 8.5.2 |
| Validation | Zod | 4.2.1 |
| Payments | Lemon Squeezy + Stripe + Apple IAP | — |
| Email send | Resend | — |
| Error tracking | Sentry + Axiom | — |
| Feature flags | PostHog | — |
| Monorepo | Turborepo + pnpm | — |

**Supported LLM providers (via Vercel AI SDK):**
- Anthropic, OpenAI, Azure OpenAI, Google Gemini, Google Vertex
- AWS Bedrock, Groq, OpenRouter, AI Gateway, Ollama, OpenAI-compatible
- Claude Code / Codex CLI (special provider for local dev)

**Model tiers (env-configurable):**
- `DEFAULT_LLM_MODEL` — main automation
- `ECONOMY_LLM_MODEL` — cheaper tasks (e.g., Gemini Flash)
- `CHAT_LLM_MODEL` — assistant chat (e.g., Groq Kimi K2)
- `NANO_LLM_MODEL` — ultra-cheap micro-tasks
- `DRAFT_LLM_MODEL` — reply drafting override

---

## AI Email Classification

### Flow: Gmail Webhook → Match Rules → Execute

1. Gmail sends Pub/Sub notification to `/api/google/webhook`
2. Webhook fetches message details via Gmail API
3. Redis lock acquired to prevent duplicate processing
4. `findMatchingRules()` called — multi-stage pipeline:
   - Cold email check first (separate LLM call if enabled)
   - `findPotentialMatchingRules()` evaluates each rule:
     - **Learned patterns** (group items) — exact/regex match, short-circuit if matched
     - **Static conditions** — from/to/subject/body regex checked in-memory
     - **AI conditions** — rules with `instructions` field go to LLM
   - `aiChooseRule()` called with all potential AI rules + email content
5. Conversation meta-rule injected if reply tracking is enabled
6. `executeMatchedRule()` runs matched rule actions
7. `ExecutedRule` + `ExecutedAction` records persisted to Postgres

### `aiChooseRule()` — Core Classification Function

Location: `apps/web/utils/ai/choose-rule/ai-choose-rule.ts`

```typescript
// Two modes: single-rule (default) or multi-rule (multiRuleSelectionEnabled)
export async function aiChooseRule<T extends { name: string; instructions: string }>({
  email,
  rules,
  emailAccount,
  modelType,
  logger,
  classificationFeedback,  // Past user corrections as hints
}): Promise<{ rules: { rule: T; isPrimary?: boolean }[]; reason: string }>
```

**Single-rule mode** returns `{ ruleName, noMatchFound, reasoning }`.

**Multi-rule mode** (opt-in) returns `{ matchedRules: [{ ruleName, isPrimary }], noMatchFound, reasoning }` — useful when one email legitimately matches 2+ rules (e.g., "To Reply" + "Team Emails").

**Prompt hardening:** All untrusted content (email body) wrapped with `{ trust: "untrusted", level: "full" }` to prevent prompt injection.

**Classification feedback:** The system passes prior manual corrections from the user as XML hints inside `<classification_feedback>` — e.g., "user moved this sender to Newsletter rule 3 times." AI treats these as hints, not hard rules.

### Rule Matching Priority

```
1. Learned patterns (GroupItems) — fastest, no LLM
2. Static conditions (from/to/subject/body regex) — fast, no LLM
3. AI instructions — LLM call, most flexible
4. Cold email check — separate dedicated LLM call
```

If ANY learned pattern matches → all AI calls skipped for that email (cost optimization).

### Conversation Tracking Meta-Rule

A synthetic meta-rule called "Conversations" is injected at runtime (not stored in DB). It routes human-to-human emails to conversation status rules (TO_REPLY, AWAITING_REPLY, FYI, RESOLVED). The meta-rule automatically re-applies throughout a thread once it matched the first message.

---

## Auto-Reply System

### Draft Reply Pipeline

Location: `apps/web/utils/ai/reply/draft-reply.ts`

The reply system builds a rich context before calling the LLM:

```typescript
// Context assembled for drafting:
{
  messages: EmailForLLM[],         // Thread history
  knowledgeBaseContent: string,    // User's knowledge base articles
  replyMemoryContent: string,      // Learned writing corrections from past edits
  emailHistorySummary: string,     // Summary of past exchanges with sender
  calendarAvailability: ...,       // Calendar slots if scheduling needed
  writingStyle: string,            // User-configured style (e.g., "concise, direct")
  learnedWritingStyle: string,     // AI-learned style from past drafts
  mcpContext: string,              // MCP tool outputs
  attachmentContext: string,       // Content of referenced attachments
  hasConfiguredSignature: boolean,
}
```

**System prompt key principles:**
- Write in same language as latest message
- No HTML, use markdown links only
- No signature, no em dashes unless style says so
- No placeholder names
- No invented information
- No meeting times unless calendar data provided
- Default style: 2 sentences max, concise, plainspoken

**Draft confidence levels** (`DraftReplyConfidence` enum):
- `ALL_EMAILS` — draft for every email (default)
- Configurable per account

**Draft actions available:**
- `DRAFT_EMAIL` — creates Gmail draft
- `DRAFT_MESSAGING_CHANNEL` — creates draft in Slack/Telegram
- `REPLY` — sends reply immediately (requires `EMAIL_SEND_ENABLED`)

### Reply Memory System

The system learns from user edits to drafts. When a user significantly edits a draft before sending, `extractReplyMemories()` analyzes the diff and stores writing preference memories. These are injected as `<reply_memories>` in future drafts from the same sender type.

---

## Email Categorization

### Sender Categorization

Location: `apps/web/utils/ai/categorize-sender/ai-categorize-single-sender.ts`

```typescript
export async function aiCategorizeSender({
  emailAccount,
  sender,           // Email address + name
  previousEmails,   // Up to 3 recent emails for context
  categories,       // User-defined categories with descriptions
}): Promise<{ rationale: string; category: string } | null>
```

- Uses `economy` model tier (cheaper)
- Returns `null` if AI assigns a category not in the user's list
- Prompt hardening: `{ trust: "untrusted", level: "compact" }`
- Bulk categorization: `startBulkCategorization()` queues all uncategorized senders
- Auto-categorize toggle: `EmailAccount.autoCategorizeSenders`

### Default Categories

Defined in `utils/categories.ts` — system provides defaults, users can customize with descriptions that guide AI classification.

---

## Key Code Patterns (with snippets)

### Pattern 1: Server Action with next-safe-action

```typescript
// utils/actions/safe-action.ts — actionClient base with auth + logging
export const actionClient = createSafeActionClient({
  defineMetadataSchema() { return z.object({ name: z.string() }) },
  handleServerError(error, { metadata }) { /* Sentry + logger */ }
})
  .use(withAuth)        // adds emailAccountId to ctx
  .use(withLogging);    // adds scoped logger to ctx

// Usage in feature file:
export const categorizeSenderAction = actionClient
  .metadata({ name: "categorizeSender" })
  .inputSchema(z.object({ senderAddress: z.string() }))
  .action(async ({ ctx: { emailAccountId, logger }, parsedInput }) => {
    // ... business logic
  });
```

### Pattern 2: createGenerateObject wrapper

All LLM calls go through this factory which applies:
- Prompt hardening (injection protection)
- Sensitive data policy (ALLOW / REDACT / BLOCK)
- PostHog LLM tracing
- Fallback model chains
- Usage tracking + cost logging
- JSON repair for malformed responses

```typescript
const generateObject = createGenerateObject({
  emailAccount,
  label: "Choose rule",            // For analytics/logging
  modelOptions,                    // Primary + fallback models
  promptHardening: { trust: "untrusted", level: "full" },
});

const aiResponse = await generateObject({
  ...modelOptions,
  system,
  prompt,
  schema: z.object({ ruleName: z.string().nullable(), ... }),
});
```

### Pattern 3: Model selection with tiering

```typescript
// utils/llms/model.ts
export type ModelType = "default" | "economy" | "chat" | "nano" | "draft";

// Selects model based on: user's own API key → env model type → env default
export function getModel(userAi: UserAIFields, modelType: ModelType = "default"): SelectModel {
  // Returns: { provider, modelName, model, fallbackModels, hasUserApiKey }
}
```

### Pattern 4: Redis distributed lock for webhook deduplication

```typescript
// Before processing, acquire lock keyed by (userEmail, messageId)
const isFree = await markMessageAsProcessing({ userEmail, messageId });
if (!isFree) {
  logger.info("Skipping. Message already being processed.");
  return;
}
// Process message...
```

### Pattern 5: next/server `after()` for post-response work

```typescript
import { after } from "next/server";

// Runs AFTER response is sent — used for analytics, pattern analysis, etc.
after(() =>
  trackFirstTimeEvent({
    emailAccountId: emailAccount.id,
    event: FIRST_TIME_EVENTS.FIRST_AUTOMATED_RULE_RUN,
  }),
);
```

### Pattern 6: Prompt-to-Rules conversion

```typescript
// User writes natural language in a "prompt file":
// "Archive all newsletters. Label receipts as Finance. Reply to urgent emails."
// AI converts this to structured Rule objects in the database.

export async function aiPromptToRules({ emailAccount, promptFile }): Promise<CreateRuleSchema[]>
// Uses "chat" model tier
// Two-way sync: prompt file ↔ DB rules (acknowledged as messy in ARCHITECTURE.md)
```

### Pattern 7: Action execution switch

```typescript
// utils/ai/actions.ts — runActionFunction dispatches to specific handlers
switch (type) {
  case ActionType.ARCHIVE:          return archive(opts);
  case ActionType.LABEL:            return label(opts);
  case ActionType.DRAFT_EMAIL:      return draft(opts);          // Creates Gmail draft
  case ActionType.REPLY:            return reply(opts);           // Sends immediately
  case ActionType.SEND_EMAIL:       return send_email(opts);
  case ActionType.FORWARD:          return forward(opts);
  case ActionType.MARK_SPAM:        return mark_spam(opts);
  case ActionType.CALL_WEBHOOK:     return call_webhook(opts);
  case ActionType.MARK_READ:        return mark_read(opts);
  case ActionType.STAR:             return star(opts);
  case ActionType.DIGEST:           return digest(opts);          // Batched summary email
  case ActionType.MOVE_FOLDER:      return move_folder(opts);
  case ActionType.NOTIFY_SENDER:    return notify_sender(opts);
  case ActionType.DRAFT_MESSAGING_CHANNEL: return draft_messaging_channel(opts);
  case ActionType.NOTIFY_MESSAGING_CHANNEL: return notify_messaging_channel(opts);
}
```

### Pattern 8: Delayed actions

Actions can have `delayInMinutes` set. The system:
1. Saves immediate actions to `ExecutedAction`
2. Schedules delayed actions via `scheduleDelayedActions()` (QStash or BullMQ)
3. Cancels existing scheduled actions when a new rule fires on the same message

---

## API & Integration Patterns

### API Route Middleware Pattern

```typescript
// Three middleware tiers:
withError(handler)          // Public, no auth
withAuth(handler)           // User-level auth
withEmailAccount(handler)   // Email account-level auth (most common)

// Response type export convention:
export type GetDataResponse = Awaited<ReturnType<typeof getData>>;
```

### Webhook Processing (Gmail → Pub/Sub)

1. Google Pub/Sub → `POST /api/google/webhook`
2. Verification token check
3. Decode base64 payload → extract `historyId`
4. Fetch history since `lastSyncedHistoryId` from Gmail API
5. For each history item:
   - `MESSAGE_ADDED` → run rules pipeline
   - `LABEL_ADDED` → record classification feedback (learning)
   - `LABEL_REMOVED` → record negative classification feedback
6. Update `lastSyncedHistoryId` in DB

### Outlook (Microsoft Graph) Webhook

Separate subscription model. `watchEmailsSubscriptionId` + `watchEmailsSubscriptionHistory` stored in `EmailAccount`. Subscription must be renewed periodically.

### External API (v1)

`/api/v1/` — versioned endpoints for external integrations. Controlled by `NEXT_PUBLIC_EXTERNAL_API_ENABLED` flag. Requires API key (`ApiKey` model with scopes).

**API Key scopes:**
```typescript
enum ApiKeyScope {
  STATS_READ, RULES_READ, RULES_WRITE,
  SETTINGS_READ, SETTINGS_WRITE, ASSISTANT_CHAT
}
```

### Slack & Telegram Integration

Users can interact with the AI assistant from Slack or Telegram. Messaging channels stored in `MessagingChannel` model. Actions `DRAFT_MESSAGING_CHANNEL` and `NOTIFY_MESSAGING_CHANNEL` send to these channels.

### MCP (Model Context Protocol)

`/api/mcp` route exposes inbox tools via MCP. `McpConnection` model stores user MCP connections. The AI assistant can use external MCP tools during chat.

---

## Database & Data Patterns

### Core Models

| Model | Purpose |
|---|---|
| `User` | Auth identity, AI API key, premium tier |
| `EmailAccount` | Per-email settings, writing style, rules config |
| `Rule` | User-defined rule: name, instructions, static conditions, systemType |
| `Action` | Actions attached to a Rule (type + optional params) |
| `ExecutedRule` | Audit log: which rule ran on which message |
| `ExecutedAction` | Audit log: which action was taken, draft IDs |
| `ScheduledAction` | Delayed actions queue |
| `Newsletter` | Sender subscription tracking, pattern analysis |
| `ColdEmail` | Cold email sender records (deprecated, migrated to Group) |
| `Group` / `GroupItem` | Learned sender patterns (from email addresses) |
| `Category` | User-defined sender categories |
| `Knowledge` | User's knowledge base articles for reply drafting |
| `ReplyMemory` | Learned writing style from past draft edits |
| `Chat` / `ChatMemory` | Assistant chat history and persistent memories |
| `ThreadTracker` | Reply tracking state per thread |
| `Digest` / `DigestItem` | Batched email summaries |
| `ClassificationFeedback` | Manual rule corrections for learning |
| `RuleHistory` | Version history of rule changes |
| `Premium` | Subscription state (Lemon Squeezy / Stripe / Apple IAP) |

### Rule Schema (key fields)

```prisma
model Rule {
  name                String
  enabled             Boolean
  instructions        String?          // AI conditions prompt
  from                String?          // Static regex
  to                  String?
  subject             String?
  body                String?
  conditionalOperator LogicalOperator  // AND | OR between static + AI
  systemType          SystemType?      // COLD_EMAIL | TO_REPLY | AWAITING_REPLY | FYI | RESOLVED | CALENDAR
  groupId             String?          // Link to learned patterns group
  promptText          String?          // Natural language for prompt file sync
  actions             Action[]
}
```

### System Types

```typescript
enum SystemType {
  COLD_EMAIL       // Auto-block cold outreach
  TO_REPLY         // Needs user response
  AWAITING_REPLY   // Waiting for someone else
  FYI              // No action needed
  RESOLVED         // Conversation concluded
  CALENDAR         // Calendar invites
}
```

### ExecutedRule Status Flow

```
APPLYING → APPLIED    (success)
APPLYING → ERROR      (action failed)
SKIPPED               (no rule matched, or low-trust block)
```

### Important Indexes

- `ExecutedRule`: indexed on `(emailAccountId, threadId, messageId, ruleId)` for dedup checks
- `Newsletter`: functional index on `lower(email)` for case-insensitive sender lookups
- `EmailAccount.watchEmailsSubscriptionHistory`: GIN index for JSONB path queries

### No Dynamic Prisma Transactions

The codebase explicitly bans `prisma.$transaction(async (tx) => ...)`. Uses `withPrismaRetry()` wrapper for retry logic instead.

---

## Configuration & Setup

### Self-Hosting (Docker)

```bash
npx @inbox-zero/cli setup   # Interactive wizard, creates .env
npx @inbox-zero/cli start   # Starts Postgres + Redis + web app containers
```

### Local Development

```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres + Redis
pnpm install
npm run setup                                      # Interactive .env setup
cd apps/web && pnpm prisma migrate dev
pnpm dev
```

Google and Microsoft emulators available for local OAuth testing.

### Required Environment Variables (key ones)

```bash
# Database
DATABASE_URL=                    # PostgreSQL connection string

# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# LLM (at least one required)
DEFAULT_LLM_PROVIDER=            # anthropic | openai | google | ...
DEFAULT_LLM_MODEL=               # e.g., claude-sonnet-4-5
LLM_API_KEY=                     # Generic; or ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.

# Model routing (optional cost optimization)
ECONOMY_LLM_PROVIDER=
ECONOMY_LLM_MODEL=               # e.g., gemini-flash
CHAT_LLM_PROVIDER=
CHAT_LLM_MODEL=

# Infrastructure
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
GOOGLE_PUBSUB_TOPIC_NAME=        # For Gmail webhook notifications
INTERNAL_API_KEY=                # Required

# Sensitive data
EMAIL_ENCRYPT_SECRET=
EMAIL_ENCRYPT_SALT=
SENSITIVE_DATA_POLICY_DEFAULT=   # ALLOW | REDACT | BLOCK

# Queue backend
QUEUE_BACKEND=                   # bullmq | internal | qstash
QSTASH_TOKEN=                    # If using QStash

# Payments (optional)
LEMON_SQUEEZY_API_KEY=
STRIPE_SECRET_KEY=
```

### Feature Flags (env booleans)

```bash
NEXT_PUBLIC_DIGEST_ENABLED=true
NEXT_PUBLIC_MEETING_BRIEFS_ENABLED=true
NEXT_PUBLIC_FOLLOW_UP_REMINDERS_ENABLED=true
NEXT_PUBLIC_SMART_FILING_ENABLED=true
NEXT_PUBLIC_CLEANER_ENABLED=true
NEXT_PUBLIC_EXTERNAL_API_ENABLED=true
NEXT_PUBLIC_EMAIL_SEND_ENABLED=true
NEXT_PUBLIC_BYPASS_PREMIUM_CHECKS=true    # For dev/testing
```

### Env Validation Pattern

Uses `@t3-oss/env-nextjs` with Zod schemas. All env vars validated at startup. Client vars prefixed with `NEXT_PUBLIC_`. Adding a new env var requires updating `.env.example`, `env.ts`, and `turbo.json`.

---

## What We Can Reuse

### 1. AI Rule Engine Architecture

The three-tier rule matching (learned patterns → static → AI) is highly reusable for any classification task. The pattern of short-circuiting AI calls when deterministic matches exist saves significant cost.

**Reuse for:** Email automation, ticket routing, lead scoring, content moderation.

### 2. Multi-Provider LLM Abstraction

The `getModel()` + `createGenerateObject()` pattern provides:
- Provider-agnostic API
- Automatic fallback chains (`DEFAULT_LLM_FALLBACKS=openrouter:claude-sonnet-4-6,openai:gpt-5.1`)
- Per-user API key support
- Economy/chat/nano tiers
- Built-in retry, JSON repair, cost tracking

**Reuse for:** Any project needing LLM calls with provider flexibility and cost control.

### 3. Prompt Hardening Pattern

```typescript
createGenerateObject({ promptHardening: { trust: "untrusted", level: "full" } })
```
Wraps untrusted email content with XML delimiters and injection-resistant framing. Critical for any system processing user-generated or external content.

### 4. Classification Feedback Learning

The `ClassificationFeedback` model + `formatClassificationFeedback()` pattern: collect manual user corrections → inject as contextual hints in future prompts. Simple but effective self-improving classification.

### 5. `next-safe-action` Server Action Pattern

Clean, type-safe server actions with auth middleware, Zod validation, scoped logging, Sentry instrumentation, and `requestId` tracing baked in. Copy `utils/actions/safe-action.ts` as a template.

### 6. `after()` for Post-Response Side Effects

Using Next.js `after()` to defer non-critical work (analytics, pattern analysis, first-event tracking) after the response is sent. Keeps response times fast without background job infrastructure.

### 7. Digest/Batching Pattern

`Digest` + `DigestItem` + scheduled send: accumulate individual events, batch into a single email/notification. Reusable for daily summaries, weekly reports, notification batching.

### 8. Writing Style Learning

`ReplyMemory` model + `extractReplyMemories()`: analyze diffs between AI drafts and final sent emails to extract style preferences. Reusable for any AI writing assistant that improves from corrections.

### 9. Knowledge Base for Contextual Replies

`Knowledge` model: user articles injected into reply drafts as `<knowledge_base>` context. Simple RAG pattern without vector search — just text injection. Good starting point before full RAG.

### 10. White-label / Branding Variables

```bash
NEXT_PUBLIC_BRAND_NAME=
NEXT_PUBLIC_BRAND_LOGO_URL=
NEXT_PUBLIC_SLACK_BOT_NAME=
```
Built-in white-label support. Useful for SaaS agencies delivering custom-branded products.

---

## Lessons & Best Practices

### LLM Architecture

1. **Hybrid rule matching beats pure LLM**: Static/pattern checks before AI calls reduce cost by 60-80% in production. Most emails match deterministic rules.

2. **Avoid two-way sync**: The prompt file ↔ DB rules sync is explicitly called out in ARCHITECTURE.md as a design mistake. Prefer one-way data flow (prompt file as source of truth, or DB as source of truth — not both).

3. **Model tiering is essential for economics**: Using Gemini Flash for categorization (economy tier) vs Claude Sonnet for reply drafting (draft tier) vs fast model for chat — each call gets the cheapest model that's good enough.

4. **Prompt injection protection is mandatory**: Any system processing untrusted email content MUST apply hardening. The `{ trust: "untrusted" }` pattern wraps email content to prevent injection attacks on automation rules.

5. **Classification feedback improves accuracy over time**: Storing manual rule corrections and feeding them back as hints (not hard constraints) improves classification without retraining.

6. **Multi-rule selection is an advanced opt-in**: Default single-rule selection is simpler and less error-prone. Multi-rule only needed for complex workflows where one email legitimately triggers multiple actions.

### Engineering Patterns

7. **Redis lock before Gmail API call**: Pub/Sub webhooks deliver at-least-once. Always acquire a distributed lock keyed by `(userEmail, messageId)` before expensive processing. The inbox-zero pattern is to lock BEFORE fetching message content.

8. **Use `after()` for all analytics/side effects**: Never block API response time for tracking calls. Next.js `after()` runs after headers are sent.

9. **No dynamic Prisma transactions**: `prisma.$transaction(async (tx) => ...)` causes connection pool issues. Use `withPrismaRetry()` for optimistic retries instead.

10. **Server Actions over POST routes**: All user-initiated mutations use `next-safe-action` server actions. Only use POST API routes for webhooks, mobile, and external integrations that require a stable HTTP contract.

11. **Learned patterns as a "memory" layer**: The `GroupItem` pattern (storing email addresses that matched a rule) acts as a cache/memory layer. Once a sender is learned, no LLM call needed for future emails from them — significant cost reduction at scale.

12. **Batch timestamp for grouped execution**: When multiple rules fire on one email, a single `batchTimestamp` is used for all `ExecutedRule` records. Enables grouping in history UI without extra queries.

### Cost Optimization

13. **Economy model for categorization**: Sender categorization and simple classification use the economy tier. Only reply drafting and complex reasoning use the full model.

14. **Learned patterns skip AI entirely**: After a sender's pattern is analyzed and stored (`patternAnalyzed = true`), future emails from them match via DB lookup — zero LLM cost.

15. **`AI_TRIAL_WEEKLY_SPEND_LIMIT_USD` and `AI_NANO_WEEKLY_SPEND_LIMIT_USD`**: Built-in spend guards for trial users and nano model tier. Essential for SaaS where free tier users could abuse AI features.

16. **Sensitive data policy (REDACT/BLOCK)**: Enterprise feature that prevents PII from being sent to LLM providers. REDACT replaces PII with placeholders, BLOCK refuses to process. Critical for healthcare, legal, and regulated industries.

### Deployment

17. **Docker-first self-hosting**: `docker compose -f docker-compose.dev.yml up -d` spins up Postgres + Redis in seconds. Production uses multi-stage Docker builds with separate layers for dependencies and app code.

18. **Environment-driven feature flags**: Feature rollout via `NEXT_PUBLIC_*` boolean env vars rather than a feature flag service. Simple and portable for self-hosted deployments.

19. **Vercel OSS Program**: The project uses Vercel for hosting (evidenced by `vercel.json`, Vercel OSS badge, QStash as queue option). The architecture is designed to work on both Vercel serverless and Docker self-hosted.

### For Vietnam Market / Agency Use

20. **White-label is built-in**: `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_BRAND_LOGO_URL`, `NEXT_PUBLIC_SLACK_BOT_NAME` allow full rebranding without code changes. Can deploy as "YourBrand Email Assistant" for clients.

21. **Multi-tenant via Organizations**: `Organization`, `Member`, `Invitation` models already implement org-level access. SSO (SAML/OIDC) and SCIM provisioning included for enterprise clients.

22. **Payments are modular**: Lemon Squeezy (international), Stripe, and Apple IAP all supported. For Vietnam market, the webhook pattern can be adapted for VNPay or MoMo by implementing the same payment webhook handler pattern.
