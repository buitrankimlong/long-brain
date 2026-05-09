---
tags: [knowledge, whitelabel, chatbot, saas, stripe]
source_repo: cbk-whitelabel
---

# WhiteLabel Chatbot - Knowledge Extraction

## Overview & Architecture

cbk-whitelabel is an open-source white-label SaaS starter that lets you deploy a branded AI chatbot platform on top of ChatBotKit's hosted infrastructure. Users sign up, subscribe via Stripe, then create and manage their own chatbots from a dashboard — without touching any AI infrastructure directly.

**Core flow:**
1. User lands on marketing page (`/`)
2. User signs up / signs in via Clerk (`/sign-up`, `/sign-in`)
3. User subscribes via Stripe Embedded Checkout (`/checkout`)
4. On successful payment, a ChatBotKit partner user is provisioned and linked to the Clerk user
5. User manages chatbots from dashboard (`/dashboard`)
6. Each chatbot gets a playground (chat UI) and a sources tab (file upload for RAG)
7. Chat completions stream through an Edge API route (`/api/complete`)

**App Router structure:**
```
src/app/
  (auth)/sign-in/[[...sign-in]]/   - Clerk catch-all sign-in
  (auth)/sign-up/[[...sign-up]]/   - Clerk catch-all sign-up
  api/complete/                    - Edge streaming chat endpoint
  api/stripe/session/retrieve/     - Post-checkout session verification
  checkout/                        - Pricing + Stripe Embedded Checkout
  checkout/success/                - Post-payment provisioning + redirect
  dashboard/                       - Protected app shell
  dashboard/bots/[botId]/          - Individual bot playground + sources
```

---

## Tech Stack & Dependencies

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^14.2.3 |
| Language | TypeScript | ^5 |
| Auth | Clerk (`@clerk/nextjs`) | ^5.0.6 |
| Payments | Stripe + `@stripe/react-stripe-js` | ^14.2.0 / ^2.3.1 |
| AI Backend | ChatBotKit SDK + Next adapter | ^1.10.0 |
| UI Components | Radix UI (Dialog, Select, Slider) + shadcn pattern | ^1-2.x |
| Styling | Tailwind CSS + tailwind-merge + clsx | ^3 |
| Forms | React `useFormStatus` + Server Actions | native |
| Validation | Zod (env vars + form data) | ^3.23.6 |
| File Upload | react-dropzone | ^14.2.3 |
| Toast | sonner | ^1.0.3 |
| Deployment | Vercel (recommended) | - |

**Key ChatBotKit packages:**
- `@chatbotkit/sdk` — server-side: bot CRUD, dataset, file, partner user APIs
- `@chatbotkit/next` — Edge streaming helper (`stream()`)
- `@chatbotkit/react` — client-side `useConversationManager` hook

---

## White-Label System Design

### Multi-tenant model (per-user isolation via ChatBotKit partner API)

Each end-user of the SaaS gets their own isolated ChatBotKit "partner user". This is the core isolation mechanism — the platform operator holds one ChatBotKit API key, but each SaaS user's bots and datasets are scoped to their partner user ID.

**Identity linking pattern** — Clerk `privateMetadata` is used as the cross-system identity store:
```ts
// Stored on Clerk user (server-side only, never exposed to client)
user.privateMetadata = {
  stripeCustomerId: "cus_xxx",   // set at checkout initiation
  chatbotkitUserId: "cbk_xxx",   // set at checkout success
}
```

### Lazy provisioning pattern

Neither the Stripe customer nor the ChatBotKit user is created at sign-up. They are created on-demand:
- Stripe customer: created when user clicks "Subscribe" (`createCheckoutSession`)
- ChatBotKit partner user: created when checkout completes (`/api/stripe/session/retrieve`)

This avoids orphaned records for users who never subscribe.

### Auth guard pattern (`src/lib/auth.ts`)

Three layered helpers build on each other:
1. `getUserAuth()` — gets Clerk userId + reads metadata, redirects if unauthenticated
2. `ensureChatBotKitUserId()` — calls `getUserAuth()`, lazily provisions CBK user if missing
3. `getChatBotKitUserClient()` — calls `ensureChatBotKitUserId()`, returns a scoped CBK client

Every Server Action and API route calls one of these helpers first.

### Routing / access control

`src/middleware.ts` uses Clerk's `clerkMiddleware()` — a single line that protects all non-static routes. Dashboard routes are implicitly protected because `getUserAuth()` redirects on missing session.

---

## Stripe Billing Integration

### Environment variables required
```
STRIPE_SECRET_KEY=sk_...
STRIPE_PRICE_ID=price_...          # single price ID (one plan shown at checkout)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_...
DOMAIN_URL=https://yourdomain.com
```

### Checkout flow (Embedded Checkout — no redirect)

1. `createCheckoutSession()` Server Action (`src/actions/stripe.ts`):
   - Creates Stripe customer if not already stored in Clerk metadata
   - Saves `stripeCustomerId` to Clerk `privateMetadata`
   - Creates a `subscription` mode checkout session with `ui_mode: 'embedded'`
   - Returns `session.client_secret`

2. Checkout page (`src/app/checkout/page.tsx`):
   - Uses `EmbeddedCheckoutProvider` + `EmbeddedCheckout` from `@stripe/react-stripe-js`
   - `loadStripe()` initialized once outside component (performance best practice)
   - On form submit, calls Server Action, stores `clientSecret` in state, renders embedded form

3. Success page (`src/app/checkout/success/page.tsx`):
   - Reads `session_id` from URL query param (set by Stripe via `return_url`)
   - Calls `/api/stripe/session/retrieve?sessionId=...`
   - Shows loading spinner until session status resolves
   - On `status === 'complete'` shows success + link to dashboard
   - On `status === 'open'` redirects back to pricing

4. Session retrieve API (`src/app/api/stripe/session/retrieve/route.ts`):
   - Verifies Stripe session
   - Provisions ChatBotKit partner user if not yet created
   - Updates Clerk `privateMetadata` with `chatbotkitUserId`
   - Returns `{ status: session.status }`
   - Runs on Edge runtime

### Key Stripe code pattern
```ts
// Server Action - src/actions/stripe.ts
const session = await stripe.checkout.sessions.create({
  customer: stripeCustomer?.id || (user?.privateMetadata.stripeCustomerId as string),
  ui_mode: 'embedded',
  line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
  mode: 'subscription',
  return_url: new URL('/checkout/success?session_id={CHECKOUT_SESSION_ID}', env.DOMAIN_URL).toString(),
})
return session.client_secret as string
```

---

## Chatbot Configuration

### Bot data model (from ChatBotKit SDK)
Each bot has:
- `id` — unique identifier
- `name` — display name
- `model` — LLM model string (`gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`)
- `backstory` — system prompt / personality
- `datasetId` — optional, links to a RAG dataset

### Supported models (hardcoded in CreateChatbotDialog)
- `gpt-3.5-turbo`
- `gpt-4`
- `gpt-4-turbo`

### Dataset / RAG pattern (src/actions/file.ts)
Files are attached to bots via a dataset. The dataset is created lazily on first file upload:
```ts
// Lazy dataset creation
if (!bot.datasetId) {
  dataset = await cbk.dataset.create({ name: file.name, store: 'ada-loom' })
  await cbk.bot.update(botId, { datasetId: dataset.id })
}
// Then: create file → upload → attach to dataset → sync
await cbk.file.create({ name: file.name })
await cbk.file.upload(createdFile.id, { data: buffer, name, type })
await cbk.dataset.file.attach(dataset.id, createdFile.id, { type: 'source' })
await cbk.dataset.file.sync(dataset.id, createdFile.id, {})
```

Supported file types: `.pdf`, `.txt`
Store type used: `ada-loom` (ChatBotKit's vector store)

### Streaming chat endpoint (src/app/api/complete/route.ts)
```ts
// Edge function — streams chat completions
export async function POST(req: Request) {
  const { chatbotkitUserId } = await getUserAuth()
  const { model, backstory, datasetId, messages } = await req.json()
  const cbk = getUserClient(chatbotkitUserId)
  const complete = cbk.conversation.complete(null, { model, backstory, datasetId, messages })
  return stream(complete)  // @chatbotkit/next helper
}
export const runtime = 'edge'
```

---

## Key Code Patterns (with snippets)

### 1. Zod env validation (used everywhere)
All environment variables are validated at module load time with Zod. If a required var is missing the app crashes early with a clear error — not silently at runtime.
```ts
const env = z.object({ STRIPE_SECRET_KEY: z.string() }).parse(process.env)
```

### 2. Server Actions with useFormStatus
`FormButton` reads `useFormStatus().pending` to disable itself and show pending state during Server Action execution — no manual loading state needed:
```ts
// src/components/ui/FormButton.tsx
const { pending } = useFormStatus()
return <Comp disabled={pending || props.disabled}>{pending ? pendingState : children}</Comp>
```

### 3. User-scoped CBK client factory
```ts
// src/lib/chatbotkit.ts
export function getUserClient(userId: string) {
  return new ChatBotKit({ secret: env.CHATBOTKIT_API_KEY, runAsUserId: userId })
}
```
The `runAsUserId` param scopes all API calls to that partner user — this is the entire multi-tenancy mechanism.

### 4. cn() utility (clsx + tailwind-merge)
```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5. Bot delete with cascade
When a bot is deleted, its linked dataset is also deleted:
```ts
const bot = await cbk.bot.fetch(id)
await cbk.bot.delete(id)
if (bot.datasetId) {
  await cbk.dataset.delete(bot.datasetId as string)
}
```

### 6. react-dropzone Chromium bug workaround
```ts
// Chromium bug: file object lost in FormData
formData.delete('file')
formData.append('file', file as File, file?.name)
```

---

## Multi-Tenant Patterns

| Pattern | Implementation |
|---|---|
| Tenant identity | Clerk userId as primary key |
| Cross-system linking | Clerk `privateMetadata` (server-side only) |
| AI resource isolation | ChatBotKit `runAsUserId` on every API call |
| Billing isolation | Stripe Customer per Clerk user |
| Lazy provisioning | Create CBK user + Stripe customer on first need |
| Access control | `getUserAuth()` redirects unauthenticated users at the action/route level |
| Data scoping | CBK SDK enforces user scope server-side via partner user ID |

**No database is used.** All relational state (who owns which Stripe customer, which CBK user) is stored in Clerk `privateMetadata`. This works well at small scale and eliminates a DB dependency entirely.

---

## What We Can Reuse

### High-value reusable patterns for our AI agency SaaS:

1. **Lazy provisioning pattern** — don't create external accounts at signup, create them at first meaningful action (checkout, first workspace creation, etc.)

2. **Clerk privateMetadata as cross-system identity store** — eliminates a users table for MVP. Store `stripeCustomerId`, `externalServiceUserId` etc. here.

3. **Stripe Embedded Checkout** — better UX than redirect-based checkout, keeps user on your domain. Pattern: Server Action returns `client_secret`, client renders `EmbeddedCheckoutProvider`.

4. **`runAsUserId` isolation pattern** — if using an AI platform with partner/sub-account APIs (ChatBotKit, or similar), scope every call with the user's sub-account ID for free multi-tenancy.

5. **FormButton with useFormStatus** — zero-boilerplate loading states for Server Actions. Copy `src/components/ui/FormButton.tsx` directly.

6. **Zod env validation at module init** — validate all env vars at startup, not at runtime. Prevents cryptic undefined errors in production.

7. **Edge runtime for streaming** — all streaming AI endpoints use `export const runtime = 'edge'` for lower latency and better streaming performance.

8. **Lazy dataset creation** — don't create storage resources until the user actually uploads a file. Same pattern applies to any "create on first use" resource.

9. **Auth helper chain** — layered `getUser() → ensureExternalId() → getScopedClient()` pattern is clean and reusable for any SaaS with multiple external services per user.

10. **Cascade delete** — always clean up child resources (datasets, files) when deleting parent (bot). Build this into your Server Actions, not the UI.

---

## Lessons & Best Practices

### Architecture
- **No DB for MVP is viable** — Clerk metadata + external service IDs can replace a users table for simple SaaS apps. Add DB when you need querying, reporting, or relationships beyond what metadata can express.
- **Platform-as-infrastructure** — This app delegates ALL AI complexity (model routing, streaming, vector storage, file processing) to ChatBotKit. The app itself is just auth + billing + a thin UI layer. For our agency work, consider the same: build thin SaaS shells on top of specialized platforms.
- **Single price ID in env** — The pricing page shows 3 tiers visually but all three "Subscribe" buttons call the same `createCheckoutSession()` which uses one `STRIPE_PRICE_ID`. The pricing tiers are cosmetic only — if you want real tiered billing, you need one price ID per tier and pass it to the action.

### Stripe
- Use Embedded Checkout (`ui_mode: 'embedded'`) rather than hosted redirect for better UX and brand consistency.
- Store `stripeCustomerId` before creating the session — if session creation fails, you don't want to recreate the customer on retry.
- The `return_url` must use `{CHECKOUT_SESSION_ID}` as a literal placeholder — Stripe replaces it.
- Verify session status server-side (`stripe.checkout.sessions.retrieve`) before granting access — never trust client-side success redirects alone.

### Security
- `privateMetadata` in Clerk is server-side only — perfect for storing sensitive cross-system IDs (`stripeCustomerId`, `chatbotkitUserId`). Never put these in `publicMetadata`.
- All Server Actions call `auth()` first — even though middleware protects routes, always re-validate auth inside actions since they can be called directly.
- Edge runtime has no Node.js APIs — be careful with `Buffer`, `fs`, etc. in edge functions. Use `arrayBuffer()` and Web APIs instead.

### Known Issues / TODOs in the repo
- `error.ts` `captureException` is a stub — only does `console.error`. No Sentry or error tracking wired up.
- Auth `redirect('/')` comments say `// @todo redirect to specific page` — not production-ready.
- `next.config.js` has `serverActions.allowedOrigins: ['localhost:3000']` — must update for production domain.
- Pricing tiers are visual only — all plans use same `STRIPE_PRICE_ID`.
- No webhook handling for Stripe events (subscription cancellation, payment failure, etc.) — critical gap for production.
- No subscription status check before allowing dashboard access — a user could cancel their subscription and still access the dashboard.

### For Vietnam market adaptation
- Replace Stripe with VNPay or MoMo for local payment processing — keep the same Server Action pattern, swap the payment provider.
- Clerk supports Vietnamese locale and social login (Google, Facebook) which are popular in Vietnam.
- The `DOMAIN_URL` env var makes it easy to white-label for different client domains.
