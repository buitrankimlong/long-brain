---
tags: [knowledge, erxes, marketing, sales, support, crm, xos, plugin-architecture]
source_repo: erxes
files_read: 25
---
# Erxes - Knowledge Extraction

## Overview & Architecture

**erxes** (pronounced "erk-sis") is a source-available Experience Operating System (XOS) that unifies marketing, sales, operations, and support into one self-hosted platform. It positions itself as a replacement for HubSpot, Zendesk, Linear, and Wix combined.

**Version**: 3.0.20 | **License**: AGPLv3 (core) + Enterprise Edition plugins | **Origin**: Mongolia

### Core Architecture: Nx Monorepo + Microservices

erxes uses a **plugin-based microservices architecture** inside an Nx monorepo:

```
                    API Gateway (Port 4000)
                    Apollo Router + Service Discovery
                              |
              +---------------+---------------+
              |               |               |
         Core API        Plugin APIs      Plugin APIs
         (3300)        (3304-3305+)      (dynamic ports)
              |               |               |
              +-------+-------+-------+-------+
                      |               |
                   MongoDB         Redis + BullMQ
                                  Elasticsearch
```

**Frontend**: Module Federation micro-frontends with a Core UI host (port 3001) loading plugin UIs as remotes dynamically.

### Key Design Decisions
- **Plugin-first**: Everything beyond core is a plugin -- sales, frontline (support), accounting, content, POS, tourism
- **Multi-tenant via subdomains**: Every request carries a `subdomain` for tenant isolation; models are scoped per tenant
- **GraphQL Federation**: Each plugin exposes its own GraphQL subgraph; the gateway federates them via Apollo Router
- **tRPC alongside GraphQL**: Type-safe internal APIs via tRPC v11 for service-to-service calls
- **Service Discovery via Redis**: Plugins register/deregister with the gateway through Redis keys
- **SaaS + Self-hosted**: Same codebase supports both modes via `VERSION=saas` env flag

## Tech Stack & Dependencies

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 18+, TypeScript 5.7.3 |
| **Package Manager** | pnpm 9.12.3 (enforced, npm/yarn blocked) |
| **Build System** | Nx 20.0.8 with intelligent caching |
| **Backend Framework** | Express.js + Apollo Server v4 + tRPC v11 |
| **Database** | MongoDB (Mongoose 8.13.2) |
| **Cache/Queue** | Redis (ioredis) + BullMQ 5.40 |
| **Search** | Elasticsearch 7 |
| **Frontend Framework** | React 18.3.1 |
| **Bundler** | Rspack 1.0.5 (Rust-based, replaces Webpack) |
| **Micro-frontends** | Module Federation (@module-federation/enhanced 0.6.6) |
| **Styling** | TailwindCSS 4.1 + Radix UI + custom design system (erxes-ui) |
| **State Management** | Jotai (atomic) + Apollo Client (server state) |
| **Forms** | React Hook Form + Zod validation |
| **Auth** | JWT + WorkOS for SSO |
| **Real-time** | GraphQL Subscriptions via graphql-redis-subscriptions |
| **Apps** | Next.js 14-16 (client portal, POS) |
| **Cloud Storage** | AWS S3 + Azure Blob + Google Cloud Storage |
| **Email** | Nodemailer + SendGrid |

## Key Code Patterns (with code snippets)

### 1. Plugin Registration Pattern (startPlugin)

Every backend plugin uses a single `startPlugin()` call that wires up everything:

```typescript
// backend/plugins/sales_api/src/main.ts
startPlugin({
  name: 'sales',
  port: 3305,
  graphql: async () => ({
    typeDefs: await typeDefs(),
    resolvers,
  }),
  expressRouter: router,
  hasSubscriptions: true,
  subscriptionPluginPath: require('path').resolve(__dirname, 'apollo', 'subscription.ts'),
  apolloServerContext: async (subdomain, context) => {
    const models = await generateModels(subdomain, context);
    context.models = models;
    context.loaders = createLoaders(subdomain, models);
    return context;
  },
  trpcAppRouter: {
    router: appRouter,
    createContext: async (subdomain, context) => {
      const models = await generateModels(subdomain);
      context.models = models;
      return context;
    },
  },
  meta: {
    automations,
    segments,
    tags: { types: [{ type: 'deal', description: 'Sales' }] },
    notifications,
    payments: { callback: async ({ subdomain }, data) => { /* ... */ } },
  },
});
```

The `startPlugin()` function (in `erxes-api-shared/utils/start-plugin.ts`) handles:
- Express app setup with CORS, rate limiting, cookie parsing
- Apollo Server with subgraph schema (Federation)
- tRPC middleware mounting at `/trpc`
- Health check endpoint
- Service discovery registration via Redis
- Automation, segment, notification initialization
- Graceful shutdown (SIGINT/SIGTERM)

### 2. Service Discovery via Redis

```typescript
// Plugins register on startup
await joinErxesGateway({
  name: 'sales',
  port: 3305,
  hasSubscriptions: true,
  meta: { automations, segments },
});

// Gateway discovers plugins from ENABLED_PLUGINS env var
const enabledPlugins = process.env.ENABLED_PLUGINS?.split(',') || [];
// Returns ['core', 'sales', 'frontline', ...]

// Redis keys: erxesservice:config:{pluginName}
```

### 3. Multi-Tenancy Pattern (Subdomain-scoped Models)

```typescript
// Every resolver receives subdomain in context
const resolver = async (_, args, { subdomain, models, user }) => {
  // models are automatically scoped to this tenant's database
  const deals = await models.Deals.find({});
};

// Model generation is cached per subdomain
export const generateModels = createGenerateModels<IModels>(loadClasses);
```

### 4. Gateway Proxy Pattern

The gateway proxies requests to plugins dynamically:

```typescript
// Gateway routes /pl:{serviceName}/* to the plugin's address
app.use('/pl:serviceName', async (req, res) => {
  const service = await getPlugin(serviceName);
  return createProxyMiddleware({
    target: service.address,
    changeOrigin: true,
    pathRewrite: { [`^/pl:${serviceName}`]: '/' },
  })(req, res);
});
```

### 5. Frontend Module Federation Config

```typescript
// frontend/plugins/sales_ui/module-federation.config.ts
const config: ModuleFederationConfig = {
  name: 'sales_ui',
  exposes: {
    './config': './src/config.tsx',
    './sales': './src/modules/Main.tsx',
    './Widgets': './src/widgets/Widgets.tsx',
    './relationWidget': './src/widgets/relation/RelationWidgets.tsx',
    './automationsWidget': './src/widgets/automations/components/AutomationRemoteEntry.tsx',
  },
  shared: (libraryName, defaultConfig) => {
    const coreLibraries = new Set(['react', 'react-dom', 'react-router', 'erxes-ui', '@apollo/client', 'jotai', 'ui-modules', 'react-i18next']);
    return coreLibraries.has(libraryName) ? defaultConfig : false;
  },
};
```

### 6. Frontend Plugin Configuration (IUIConfig)

```typescript
// frontend/plugins/sales_ui/src/config.tsx
export const CONFIG: IUIConfig = {
  name: 'sales',
  path: 'sales',
  navigationGroup: {
    name: 'sales',
    icon: IconBriefcase,
    content: () => <Suspense fallback={<div />}><MainNavigation /></Suspense>,
  },
  modules: [
    { name: 'sales', icon: IconBriefcase, path: 'sales', hasAutomation: true },
    { name: 'deals', path: 'sales/deals' },
    { name: 'pos', icon: IconBriefcase, path: 'sales/pos' },
  ],
  widgets: {
    relationWidgets: [{ name: 'deals', icon: IconSandbox }],
  },
};
```

### 7. Meta System (Automations, Segments, Import/Export)

Plugins declare automation actions/triggers and segment types via meta:

```typescript
// meta/automations.ts
export default {
  constants: {
    actions: [{ type: 'sales:createDeal', label: 'Create deal' }],
    triggers: [{ type: 'sales:dealCreated', label: 'Deal created' }],
  },
  actions: async ({ subdomain, data }) => { /* execute action */ },
};

// meta/segments.ts - Dynamic segmentation
export default {
  contentTypes: [{ type: 'sales:deal', fields: [{ key: 'amount', type: 'number' }] }],
};
```

## Configuration & Setup

### Environment Variables

```bash
MONGO_URL=mongodb://localhost:27017/erxes
REDIS_HOST=localhost
REDIS_PORT=6379
ENABLED_PLUGINS=operation,sales,frontline    # Comma-separated plugin list
DOMAIN=http://localhost:3000
REACT_APP_API_URL=http://localhost:4000
DISABLE_CHANGE_STREAM=true                   # Disable MongoDB change streams in dev
SAAS_MODE=true                               # Optional SaaS mode
VERSION=os|saas                              # OS (self-hosted) or SaaS
```

### Port Allocation

| Service | Port |
|---------|------|
| Gateway | 4000 |
| Core API | 3300 |
| Core UI | 3001 |
| Frontline API | 3304 |
| Sales API | 3305 |
| Plugin UIs | 3005+ |
| BullMQ Dashboard | 4000/bullmq-board |

### Docker Strategy

Each service has its own optimized multi-stage Dockerfile:
- Stage 1: Install production deps with pnpm, strip unnecessary files (.d.ts, tests, docs)
- Stage 2: Minimal runtime with Node 22 Alpine
- Shared library (`erxes-api-shared`) is copied into `node_modules` directly
- Runs as non-root user (UID 1000)

### Nx Workspace Configuration

```json
// nx.json highlights
{
  "plugins": ["@nx/eslint/plugin", "@nx/jest/plugin", "@nx/webpack/plugin", "@nx/storybook/plugin"],
  "generators": {
    "@nx/react": { "application": { "bundler": "rspack", "style": "tailwind" } }
  }
}
```

### pnpm Workspace

```yaml
packages:
  - 'backend/**'
  - 'frontend/**'
```

## API & Integration Patterns

### GraphQL Federation

- Gateway uses Apollo Router to compose subgraphs from all plugins
- Each plugin builds a subgraph schema via `buildSubgraphSchema()` from `@apollo/subgraph`
- Cross-service references use `@key` directives

### tRPC for Type-Safe Internal APIs

- Each plugin mounts tRPC at `/trpc` endpoint
- Gateway proxies tRPC calls to the correct plugin
- Uses `createTRPCContext()` from shared utils to inject subdomain and models

### Real-time via GraphQL Subscriptions

- Uses `graphql-redis-subscriptions` for PubSub across services
- Each plugin can expose a `subscriptionPlugin.js` file
- WebSocket connections handled via `graphql-ws`

### Rate Limiting

- Gateway: 5000 requests per 15 minutes per IP (global)
- File endpoints: 500 requests per 15 minutes per IP
- Subscription files: 1000 requests per 15 minutes per IP

### Authentication Flow

- JWT-based authentication via `jsonwebtoken`
- User extracted from headers via middleware (`userMiddleware`)
- App API tokens supported with Redis caching (1-hour TTL)
- WorkOS integration for SSO

## Repository Structure

```
erxes/
  backend/
    gateway/           # API Gateway (Apollo Router, proxy, service discovery)
    core-api/          # Core: contacts, products, segments, automations, documents
    erxes-api-shared/  # Shared library: utils, core-types, core-modules
    plugins/           # 11 backend plugins (sales, frontline, accounting, content, etc.)
    services/          # Background services (automations engine, logs)
  frontend/
    core-ui/           # Module Federation host app
    libs/              # erxes-ui (design system), ui-modules (shared components)
    plugins/           # 10 frontend plugins matching backend plugins
  apps/
    client-portal-template/  # Next.js 16 customer portal
    posclient-front/         # Next.js 14 POS with PWA
    frontline-widgets/       # Embeddable chat/form widgets
  scripts/
    create-plugin.js         # Plugin generator CLI
    start-api-dev.js         # Start all API services
    start-ui-dev.js          # Start all UI plugins
```

### Core API Modules (23 modules)

apps, auth, automations, brands, broadcast, bundle, clientportal, conformities, contacts, documents, forms, import-export, internalNote, logs, notifications, organization, permissions, products, properties, relations, segments, tags, template

### Backend Plugins (11)

sales_api, frontline_api, operation_api, accounting_api (EE), content_api (EE), tourism_api (EE), payment_api, posclient_api, loyalty_api, insurance_api, mongolian_api

## What We Can Reuse

### 1. Plugin Architecture Pattern
The `startPlugin()` pattern is an excellent blueprint for building a modular marketing/sales platform:
- Single function call to wire up GraphQL, tRPC, Express routes, WebSockets
- Meta system for declaring automations, segments, tags, notifications
- Service discovery via Redis for dynamic plugin registration
- Clean separation between core and plugins

### 2. Multi-Tenancy via Subdomain
The `createGenerateModels()` pattern with subdomain-scoped database connections is directly applicable for an AI agency serving multiple clients.

### 3. Module Federation for Micro-Frontends
The shared library set (react, apollo, jotai, erxes-ui) and plugin config pattern (`IUIConfig`) is a proven approach for extensible UIs.

### 4. Automation/Segment Meta System
The declarative meta system where plugins register their automation triggers/actions and segment fields is a powerful pattern for a marketing automation platform.

### 5. Import/Export Framework
The `createCoreModuleProducerHandler()` pattern provides a standardized way for plugins to expose import/export capabilities.

### 6. BullMQ Job Queue Dashboard
Gateway exposes BullMQ Board at `/bullmq-board` for monitoring job queues -- useful for any async processing system.

### 7. Docker Build Strategy
Multi-stage Dockerfile with aggressive cleanup (stripping .d.ts, tests, docs, LICENSE files) and shared library injection pattern.

## Lessons & Best Practices

### Architecture Lessons

1. **Monorepo + Microservices works**: erxes proves that an Nx monorepo can effectively manage 20+ microservices with shared code, avoiding the "distributed monolith" problem through proper shared library boundaries.

2. **GraphQL Federation is the right gateway pattern**: Rather than a single massive GraphQL schema, each plugin owns its domain schema and the gateway composes them. This enables independent deployment.

3. **tRPC + GraphQL coexistence**: GraphQL for external/frontend APIs, tRPC for type-safe internal service-to-service calls. Best of both worlds.

4. **Redis as service mesh**: Instead of complex service meshes (Istio, Linkerd), erxes uses Redis for service discovery, pub/sub, caching, and job queues. Simpler and sufficient for most scales.

5. **Plugin generator is essential**: The `create-plugin.js` script scaffolds both backend and frontend with full boilerplate. This dramatically lowers the barrier to extending the platform.

### Code Quality Patterns

6. **Graceful shutdown everywhere**: Both gateway and plugins handle SIGINT/SIGTERM, closing HTTP servers, MongoDB connections, and deregistering from service discovery.

7. **Rate limiting at multiple levels**: Gateway-level global limits, endpoint-specific limits for file serving, and subscription file limits.

8. **Path aliases for clean imports**: `~/*` for service root, `@/*` for modules, `erxes-api-shared/*` for shared library.

9. **Lazy loading in Module Federation**: All remote modules use `React.lazy()` + `Suspense` to avoid blocking the host app.

### What to Avoid

10. **No implicit any is disabled**: For legacy compatibility, `noImplicitAny` is off. For new projects, keep it strict.

11. **MongoDB for everything**: erxes uses MongoDB exclusively. For relational data (sales pipelines, org structures), PostgreSQL with pgvector would be better for our use case.

12. **Complex connection resolver**: The `connectionResolvers.ts` file (680+ lines) loads 50+ models in one function. A more modular approach with per-module model registration would be cleaner.

### Key Takeaways for Our AI Agency Platform

- **Start with the plugin pattern**: Define a `startPlugin()` equivalent early. It pays dividends as the system grows.
- **Use the meta system pattern**: Plugins declaring their capabilities (automations, segments, notifications) through metadata is more maintainable than hard-coding integrations.
- **Redis is the backbone**: Service discovery, caching, pub/sub, job queues -- Redis handles it all. One dependency, many uses.
- **Rspack over Webpack**: erxes switched to Rspack for faster builds. Follow their lead.
- **Module Federation for extensibility**: If we need client-customizable UIs, Module Federation is the proven approach.
