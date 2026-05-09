---
tags: [knowledge, saas, boilerplate, nextjs, stripe, clerk]
source_repo: SaaS-Boilerplate
---

# SaaS Boilerplate - Knowledge Extraction

> Repo: `C:/AI Build Learning/repos/06-templates-boilerplate/SaaS-Boilerplate/`
> Version: 1.7.7 | Live demo: https://react-saas.com
> License: MIT | Author: CreativeDesignsGuru (ixartz)

---

## Overview & Architecture

This is a free, open-source, production-ready SaaS starter kit built on Next.js 14 App Router. It provides the full skeleton for a multi-tenant SaaS product — authentication, organizations, billing stubs, i18n, observability, and testing — all wired together.

### High-level architecture

```
Browser
  └── Next.js 14 App Router (src/app/)
        ├── [locale]/(unauth)/          <- Public landing page
        ├── [locale]/(auth)/            <- Clerk-protected area
        │     ├── dashboard/            <- Main app UI
        │     └── onboarding/          <- Org selection flow
        └── Middleware (Clerk + next-intl)
              └── DB (DrizzleORM → PGlite dev / PostgreSQL prod)
```

### Key design principles
- Nothing hidden — all source code is customizable
- Minimal code: only essentials, no unnecessary abstractions
- `FIXME:` comments mark every place you need to customize
- `PRO` comments mark features only in paid versions
- SEO-first: metadata, sitemap, robots.txt, JSON-LD, Open Graph all included
- Dependencies updated monthly

---

## Tech Stack & Dependencies

### Core
| Package | Version | Role |
|---|---|---|
| `next` | ^14.2.35 | Framework (App Router) |
| `react` / `react-dom` | ^18.3.1 | UI runtime |
| `typescript` | ^5.6.3 | Type safety |
| `tailwindcss` | ^3.4.14 | Styling |
| Shadcn UI (via Radix) | various | Component library |

### Auth & Multi-tenancy
| Package | Version | Role |
|---|---|---|
| `@clerk/nextjs` | ^6.18.3 | Auth + org management |
| `@clerk/localizations` | ^3.14.2 | i18n for Clerk UI |
| `@clerk/themes` | ^2.1.36 | Clerk UI theming |

### Database
| Package | Version | Role |
|---|---|---|
| `drizzle-orm` | ^0.35.1 | Type-safe ORM |
| `drizzle-kit` | ^0.26.2 | Migrations + studio |
| `pg` | ^8.13.0 | PostgreSQL driver (prod) |
| `@electric-sql/pglite` | ^0.2.12 | In-process PG (dev/test) |

### Billing
| Package | Version | Role |
|---|---|---|
| `stripe` | ^16.12.0 | Payment processing |

### i18n
| Package | Version | Role |
|---|---|---|
| `next-intl` | ^3.21.1 | Internationalization |

### Observability
| Package | Version | Role |
|---|---|---|
| `@sentry/nextjs` | ^8.34.0 | Error monitoring |
| `pino` | ^9.5.0 | Structured logging |
| `@logtail/pino` | ^0.5.2 | Log shipping to Better Stack |

### Forms & Validation
| Package | Version | Role |
|---|---|---|
| `react-hook-form` | ^7.53.0 | Form state management |
| `@hookform/resolvers` | ^3.9.0 | Zod integration |
| `zod` | ^3.23.8 | Schema validation |
| `@t3-oss/env-nextjs` | ^0.11.1 | Type-safe env vars |

### Dev Tooling
- ESLint (antfu config) + Prettier
- Husky + lint-staged + Commitlint + Commitizen
- Vitest + React Testing Library (unit)
- Playwright (E2E + integration)
- Storybook 8 (UI development)
- Semantic Release (automated CHANGELOG + versioning)
- Checkly (monitoring-as-code)
- Codecov (coverage reporting)
- Percy (visual regression, optional)
- @next/bundle-analyzer

---

## Multi-Tenancy Implementation

Multi-tenancy is handled entirely through **Clerk Organizations**. Each tenant = one Clerk Organization. There is no custom tenant table in the database.

### Flow
1. User signs up → creates or joins a Clerk Organization
2. Middleware checks `authObj.orgId` — if missing, redirects to `/onboarding/organization-selection`
3. The `OrganizationList` Clerk component handles creation/selection
4. After selecting an org, user lands on `/dashboard`
5. The `OrganizationSwitcher` component (in `DashboardHeader`) lets users switch orgs

### Onboarding redirect (middleware)
```typescript
// src/middleware.ts
if (
  authObj.userId
  && !authObj.orgId
  && req.nextUrl.pathname.includes('/dashboard')
  && !req.nextUrl.pathname.endsWith('/organization-selection')
) {
  const orgSelection = new URL('/onboarding/organization-selection', req.url);
  return NextResponse.redirect(orgSelection);
}
```

### Organization selection page
```tsx
// src/app/[locale]/(auth)/onboarding/organization-selection/page.tsx
<OrganizationList
  afterSelectOrganizationUrl="/dashboard"
  afterCreateOrganizationUrl="/dashboard"
  hidePersonal        // forces org context, no personal workspace
  skipInvitationScreen
/>
```

### Organization profile page (settings + member management)
```tsx
// Clerk's built-in full UI component
<OrganizationProfile
  routing="path"
  path={getI18nPath('/dashboard/organization-profile', locale)}
  afterLeaveOrganizationUrl="/onboarding/organization-selection"
/>
```

### Database link
The local `organization` table in PostgreSQL stores only the Stripe subscription data linked to the Clerk org ID. The org ID (text primary key) comes from Clerk, not auto-generated.

---

## Auth (Clerk) Patterns

### Setup
1. Create Clerk app at clerk.com
2. Enable Organizations: Dashboard > Organization management > Settings > Enable organization
3. Add env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

### Middleware integration
```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
  '/api(.*)',
  '/:locale/api(.*)',
]);

// Clerk only activates on sign-in/sign-up pages and protected routes
// Everything else uses only intl middleware (public pages are fast)
```

### ClerkProvider with i18n
```tsx
// src/app/[locale]/(auth)/layout.tsx  — 'use client'
import { enUS, frFR } from '@clerk/localizations';

<ClerkProvider
  localization={clerkLocale}       // locale-aware Clerk UI
  signInUrl={signInUrl}
  signUpUrl={signUpUrl}
  signInFallbackRedirectUrl={dashboardUrl}
  signUpFallbackRedirectUrl={dashboardUrl}
  afterSignOutUrl={afterSignOutUrl}
>
```

### Sign-in / Sign-up pages (catch-all routes)
```
src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx
src/app/[locale]/(auth)/(center)/sign-up/[[...sign-up]]/page.tsx
```
Both use Clerk's hosted component: `<SignIn path={...} />` / `<SignUp path={...} />`. The `[[...slug]]` catch-all is required for Clerk's multi-step flows (email verify, MFA, etc.).

### User profile
```
/dashboard/user-profile/[[...user-profile]]/page.tsx
```
Uses `<UserProfile routing="path" />` Clerk component.

### Dashboard header controls
```tsx
// src/features/dashboard/DashboardHeader.tsx
<OrganizationSwitcher hidePersonal skipInvitationScreen ... />
<UserButton userProfileMode="navigation" userProfileUrl="/dashboard/user-profile" />
```

### Supported auth features (all from Clerk)
- Email/password sign-up and sign-in
- Magic links (passwordless)
- Social login: Google, Facebook, Twitter, GitHub, Apple, and more
- Passkeys (passwordless)
- Multi-Factor Authentication (MFA/TOTP)
- User Impersonation (admin feature)
- Forgot/reset password
- Update email, update password, delete account

---

## Billing (Stripe) Integration

> Note: In the free version, Stripe is wired for the pricing display and the database schema stores subscription data, but the actual checkout/webhook flow is a PRO feature. The infrastructure and types are present as scaffolding.

### Pricing plans config
```typescript
// src/utils/AppConfig.ts
export const PLAN_ID = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const;

export const PricingPlanList: Record<string, PricingPlan> = {
  free:       { price: 0,   interval: 'month', testPriceId: '', devPriceId: '', prodPriceId: '', features: {...} },
  premium:    { price: 79,  interval: 'month', testPriceId: 'price_premium_test', devPriceId: '...', prodPriceId: '', ... },
  enterprise: { price: 199, interval: 'month', testPriceId: 'price_enterprise_test', devPriceId: '...', prodPriceId: '...', ... },
};
```
Each plan has 3 Stripe price IDs: `testPriceId` (Vitest mocking), `devPriceId` (Stripe test mode), `prodPriceId` (live).

### Environment variable for billing context
```
BILLING_PLAN_ENV=dev|test|prod    # controls which priceId is used
```

### Database schema (organization table)
```sql
-- migrations/0000_init-db.sql
CREATE TABLE "organization" (
  "id"                                   text PRIMARY KEY,    -- Clerk org ID
  "stripe_customer_id"                   text,
  "stripe_subscription_id"              text,
  "stripe_subscription_price_id"         text,
  "stripe_subscription_status"           text,
  "stripe_subscription_current_period_end" bigint,
  "updated_at"                           timestamp DEFAULT now(),
  "created_at"                           timestamp DEFAULT now()
);
CREATE UNIQUE INDEX "stripe_customer_id_idx" ON "organization" ("stripe_customer_id");
```

### Subscription types
```typescript
// src/types/Subscription.ts
export type IStripeSubscription = {
  stripeSubscriptionId: string | null;
  stripeSubscriptionPriceId: string | null;
  stripeSubscriptionStatus: string | null;
  stripeSubscriptionCurrentPeriodEnd: number | null;
};

export type PlanDetails =
  | { isPaid: true;  plan: PricingPlan; stripeDetails: IStripeSubscription; }
  | { isPaid: false; plan: PricingPlan; stripeDetails?: undefined; };
```

### Setup commands
```bash
stripe login
npm run stripe:setup-price    # creates price in Stripe, copy ID to AppConfig.ts
```
Configure customer portal at: https://dashboard.stripe.com/test/settings/billing/portal

### Required env vars
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## RBAC System

Role-based access control is delegated entirely to **Clerk Organizations**. There is no custom RBAC table.

### How it works
- Clerk Organizations natively support roles: `org:admin`, `org:member` (default), plus custom roles
- Role checking happens at the Clerk level during protected route access
- The `ProtectFallback` component is used to wrap UI elements that require specific permissions

### ProtectFallback component
```tsx
// src/features/auth/ProtectFallback.tsx
// Used to show a tooltip explaining "not enough permission" when a user
// tries to interact with a feature they don't have access to
export const ProtectFallback = (props: { trigger: React.ReactNode }) => (
  <TooltipProvider delayDuration={0}>
    <Tooltip>
      <TooltipTrigger asChild>{props.trigger}</TooltipTrigger>
      <TooltipContent>
        <p>{t('not_enough_permission')}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
```

### Route-level protection
All `/dashboard/**` and `/api/**` routes are protected by the middleware using `createRouteMatcher`. Any unauthenticated request is redirected to `/sign-in`.

### Organization membership enforcement
Users with no active organization are redirected to `/onboarding/organization-selection`. This prevents access to the dashboard with a personal (non-org) context (`hidePersonal` is set on all org components).

---

## Key Code Patterns (with snippets)

### 1. Type-safe environment variables (T3 Env)
```typescript
// src/libs/Env.ts
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const Env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().min(1),
    DATABASE_URL: z.string().optional(),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    BILLING_PLAN_ENV: z.enum(['dev', 'test', 'prod']),
    LOGTAIL_SOURCE_TOKEN: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1),
    NEXT_PUBLIC_APP_URL: z.string().optional(),
  },
  // ...runtimeEnv mapping
});
```
Env vars are validated at startup. Missing required vars crash the build — no silent failures.

### 2. Dual-mode database (dev vs prod)
```typescript
// src/libs/DB.ts
// PGlite (in-process) for local dev — no Docker needed
// PostgreSQL (pg Client) for production
if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD && Env.DATABASE_URL) {
  // PostgreSQL (prod)
  client = new Client({ connectionString: Env.DATABASE_URL });
  await client.connect();
  drizzle = drizzlePg(client, { schema });
  await migratePg(drizzle, { migrationsFolder: './migrations' });
} else {
  // PGlite (dev/fallback) — stored in globalThis to survive HMR
  if (!global.client) {
    global.client = new PGlite();
    await global.client.waitReady;
    global.drizzle = drizzlePglite(global.client, { schema });
  }
  // migrations auto-run on first connect
}

export const db = drizzle;
```
**Key insight**: `globalThis` trick prevents multiple PGlite instances during Next.js hot reload.

### 3. Middleware combining Clerk + i18n
```typescript
// src/middleware.ts
// Clerk only wraps sign-in/up and protected routes
// Public pages (landing) only go through intl middleware = faster
export default function middleware(request, event) {
  if (request.nextUrl.pathname.includes('/sign-in')
    || request.nextUrl.pathname.includes('/sign-up')
    || isProtectedRoute(request)) {
    return clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) await auth.protect({ unauthenticatedUrl: signInUrl });
      // org enforcement redirect
      return intlMiddleware(req);
    })(request, event);
  }
  return intlMiddleware(request);  // public pages bypass Clerk entirely
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next|monitoring).*)', '/', '/(api|trpc)(.*)'],
  // Note: 'monitoring' excluded to avoid blocking Sentry tunnel
};
```

### 4. Route group architecture (App Router)
```
src/app/[locale]/
  (auth)/           <- Clerk-protected segment
    (center)/       <- Centered layout for sign-in/up
      sign-in/[[...sign-in]]/
      sign-up/[[...sign-up]]/
    dashboard/      <- Main app
    onboarding/     <- First-run flow
    layout.tsx      <- ClerkProvider wrapper
  (unauth)/         <- Public pages
    page.tsx        <- Landing page
  layout.tsx        <- NextIntlClientProvider + html/body
```
Route groups `(auth)` and `(unauth)` share the locale segment but have different layouts. The `(center)` group adds a centered layout specifically for auth pages.

### 5. Utility: cn() helper
```typescript
// src/utils/Helpers.ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));   // standard Shadcn pattern
}
```

### 6. Utility: base URL + i18n path
```typescript
export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_ENV === 'production') return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
};

export const getI18nPath = (url: string, locale: string) => {
  if (locale === AppConfig.defaultLocale) return url;  // no prefix for default locale
  return `/${locale}${url}`;
};
```

### 7. Logger (Pino + Better Stack)
```typescript
// src/libs/Logger.ts
// Dev: pretty-prints to console with colors
// Prod (LOGTAIL_SOURCE_TOKEN set): multistream → BetterStack + console
export const logger = pino({ base: undefined }, stream);
```

### 8. Dashboard layout pattern
```tsx
// export const dynamic = 'force-dynamic';   <- prevents static generation for auth pages
export default function DashboardLayout({ children }) {
  return (
    <>
      <div className="shadow-md">
        <div className="mx-auto flex max-w-screen-xl ...">
          <DashboardHeader menu={[...]} />
        </div>
      </div>
      <div className="min-h-[calc(100vh-72px)] bg-muted">
        <div className="mx-auto max-w-screen-xl px-3 pb-16 pt-6">
          {children}
        </div>
      </div>
    </>
  );
}
```

---

## Database & Data Patterns

### Schema file: single source of truth
```typescript
// src/models/Schema.ts
// All tables defined here, DrizzleKit generates migrations from diffs

export const organizationSchema = pgTable('organization', {
  id: text('id').primaryKey(),            // Clerk org ID — no serial, use Clerk's ID
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
  stripeSubscriptionStatus: text('stripe_subscription_status'),
  stripeSubscriptionCurrentPeriodEnd: bigint('stripe_subscription_current_period_end', { mode: 'number' }),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(table.stripeCustomerId),
}));

export const todoSchema = pgTable('todo', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),    // Clerk user ID
  // ...
});
```

### Migration workflow
```bash
npm run db:generate    # generates SQL migration from schema diff
npm run db:migrate     # applies migration to production DB
npm run db:studio      # opens Drizzle Studio GUI
```
Migrations auto-run on next DB interaction in development. In production, they run during `next build`.

### Drizzle config
```typescript
// drizzle.config.ts
export default defineConfig({
  out: './migrations',
  schema: './src/models/Schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  verbose: true,
  strict: true,
});
```

### Local dev database
Uses PGlite (WebAssembly PostgreSQL running in-process). No Docker, no external DB setup needed for local dev. Data is ephemeral (in memory) unless configured otherwise.

---

## Configuration & Setup

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk public key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Sign-in path (e.g. `/sign-in`) |
| `DATABASE_URL` | Prod only | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe public key |
| `BILLING_PLAN_ENV` | Yes | `dev`, `test`, or `prod` |
| `LOGTAIL_SOURCE_TOKEN` | Optional | Better Stack log ingestion |
| `NEXT_PUBLIC_APP_URL` | Optional | Override base URL |
| `CROWDIN_PROJECT_ID` | CI only | i18n sync |
| `CROWDIN_PERSONAL_TOKEN` | CI only | i18n sync |
| `CHECKLY_API_KEY` | CI only | Monitoring |
| `CODECOV_TOKEN` | CI only | Coverage reporting |

### Quick customization checklist
1. Search codebase for `FIXME:` — all customization points are tagged
2. Update `src/utils/AppConfig.ts` — app name, locales, pricing plans
3. Update Stripe price IDs in `AppConfig.ts` after `npm run stripe:setup-price`
4. Replace favicon files in `public/`
5. Update Sentry `org` and `project` in `next.config.mjs`
6. Update email in `checkly.config.ts`

### i18n setup
- Default locale: English
- Translations: `src/locales/en.json`, `fr.json`
- Locales config in `AppConfig.ts` (`locales` array)
- Locale prefix: `as-needed` — default locale has no prefix in URL
- Translation sync: automated via Crowdin + GitHub Actions
- Server components: `getTranslations()` | Client components: `useTranslations()`

### next.config.mjs wrappers
```
withSentryConfig(
  bundleAnalyzer(
    withNextIntl(
      { /* nextjs config */ }
    )
  )
)
```
Three wrappers compose: Sentry source maps, bundle analysis, i18n routing.

---

## What We Can Reuse

### High-value reusable pieces

1. **Dual-mode DB pattern** (`src/libs/DB.ts`)
   - PGlite for local dev (zero setup), PostgreSQL for prod
   - The `globalThis` HMR guard pattern is essential for any Next.js DB module

2. **T3 Env type-safe config** (`src/libs/Env.ts`)
   - Validates all env vars at startup with Zod
   - Separates server/client/shared vars cleanly

3. **Middleware pattern: Clerk + next-intl composition**
   - Only applies Clerk where needed (perf optimization)
   - Org enforcement redirect logic is clean and reusable

4. **Multi-tenancy via Clerk Organizations**
   - Zero custom code for org management, member invites, switching
   - Just configure `hidePersonal` to enforce org-only context

5. **Pricing plan config structure** (`AppConfig.ts`)
   - Three price ID slots per plan (test/dev/prod) controlled by env var
   - Clean separation of concern

6. **Organization DB table schema**
   - Minimal: only Stripe subscription fields linked to Clerk org ID
   - Add more org-level fields here as needed

7. **Dashboard layout with `force-dynamic`**
   - Pattern for any page that can't be statically generated

8. **`cn()` utility + `getI18nPath()` + `getBaseUrl()`**
   - Standard Shadcn `cn`, plus two utility functions every Next.js project needs

9. **Logger with dual output** (`src/libs/Logger.ts`)
   - Pretty console in dev, BetterStack in prod, with simple env-based toggle

10. **Feature-based folder structure**
    ```
    src/
      features/auth/     <- auth-specific components
      features/billing/  <- pricing UI components
      features/dashboard/ <- dashboard shell components
      templates/         <- full-page layout sections (Hero, Footer, Navbar...)
      components/        <- generic reusable UI
      libs/              <- third-party integrations
      models/            <- DB schema
      utils/             <- helpers and config
    ```

### Landing page templates (ready-to-use)
- `Hero.tsx`, `Features.tsx`, `Pricing.tsx`, `FAQ.tsx`, `CTA.tsx`, `Footer.tsx`, `Navbar.tsx`
- All i18n-ready with `useTranslations()`
- Responsive with Tailwind + Shadcn

---

## Lessons & Best Practices

### Architecture decisions worth noting

1. **Clerk for everything auth-related**: No custom JWT, no custom sessions, no RBAC tables. Clerk handles users, orgs, roles, MFA, social login, impersonation. The tradeoff is Clerk vendor lock-in.

2. **Organizations = tenants**: The Clerk `orgId` is the tenant ID everywhere. The local DB just stores Stripe data keyed to this ID. Clean and minimal.

3. **PGlite eliminates dev database setup friction**: Developers can clone and run `npm run dev` immediately — no Docker, no DB server, no seed scripts. Huge DX win.

4. **Auto-migration on startup**: Drizzle runs `migrate()` automatically on the first DB connection. No separate migration step needed in dev. In prod, it runs at build time.

5. **Middleware performance optimization**: Public pages (landing, blog) skip Clerk entirely and only pass through the lightweight intl middleware. Only auth-required pages invoke Clerk middleware.

6. **`force-dynamic` on dashboard layout**: Any page with auth/user-specific data must opt out of static generation. Set `export const dynamic = 'force-dynamic'` at the layout level to avoid subtle caching bugs.

7. **Three Stripe price IDs per plan**: Separating test/dev/prod price IDs and controlling which one is active via `BILLING_PLAN_ENV` is a clean pattern that prevents accidentally charging real money in tests.

8. **Catch-all routes for Clerk components**: `[[...sign-in]]` and `[[...sign-up]]` are required, not optional. Clerk's multi-step UI (email verify, MFA prompts) uses sub-paths internally.

9. **`as-needed` locale prefix**: Default locale has clean URLs (`/dashboard`), non-default locales get prefixed (`/fr/dashboard`). Best practice for SEO.

10. **Component co-location**: Feature-specific components live in `src/features/[feature]/`, not in `src/components/`. Generic UI components go in `src/components/`. This is cleaner than a flat components directory.

### What is NOT included in the free version (need Pro/Max)
- Stripe checkout page and webhook handler (full billing flow)
- Dark mode
- Todo app CRUD example
- oRPC end-to-end typesafe APIs
- Self-hosted auth (Better Auth)
- Transactional emails (React Email)
- Sidebar dashboard layout
- Latest Next.js 16 / React 19 / Tailwind 4

### Gotchas & warnings
- `stripe:setup-price` script must be run and price IDs updated in `AppConfig.ts` before billing works
- Clerk Organization must be enabled in the Clerk Dashboard (not on by default)
- Sentry `org` and `project` in `next.config.mjs` must be updated or Sentry setup is broken
- `BILLING_PLAN_ENV` is a required env var — build will fail without it (T3 Env validation)
- `DATABASE_URL` is optional — if omitted, PGlite is used (dev/fallback mode)
- The `/monitoring` path is excluded from middleware matcher to allow Sentry tunnel to work
- `suppressHydrationWarning` on `<html>` and `<body>` are intentional — needed for next-themes and Sentry overlay compatibility
