---
tags: [activepieces, automation, workflow, open-source, zapier-alternative, n8n-alternative, mcp, ai-agents, self-host, docker]
description: Activepieces-Open-Source-Automation-Platform
created: 2026-05-21
moc: "[[18 Catalog Cong Cu]]"
github: https://github.com/activepieces/activepieces
---

# Activepieces — Open-Source AI-First Automation Platform

> **Repo**: https://github.com/activepieces/activepieces (22k+ stars, MIT license)
> **Website**: https://www.activepieces.com/
> **Version analyzed**: 0.83.0 (2026)
> **Rating**: 4.8/5 trên G2 (141+ reviews)

---

## Tổng quan

Activepieces là nền tảng workflow automation **open-source (MIT)**, AI-first. "Developer-friendly Zapier" — vừa low-code cho business user, vừa đủ mạnh cho engineer. Nổi bật nhất: **MIT license** (tự do hoàn toàn, embed vào sản phẩm riêng) và **MCP-first** (mỗi piece = 1 MCP server).

---

## Kiến trúc kỹ thuật

### Stack
| Component | Tech |
|-----------|------|
| Backend API | Fastify (Node.js) |
| Worker | BullMQ + Redis (distributed job queue) |
| Engine | isolated-vm (sandboxed execution) |
| Frontend | React 18 + XYFlow (visual flow builder) |
| Database | PostgreSQL 14 + pgvector (AI embeddings) |
| ORM | TypeORM (hỗ trợ SQLite cho CE) |
| Codebase | Nx monorepo, 100% TypeScript |

### Flow Execution Pipeline
```
Trigger (webhook/polling) → BullMQ Queue (Redis) → 
Worker picks job → Engine sandbox (isolated-vm) → 
Step execution (piece actions/code) → 
Store results → Update FlowRun status
```

### FlowRun Lifecycle
```
QUEUED → RUNNING → {SUCCEEDED, FAILED, PAUSED, STOPPED, INTERNAL_ERROR, QUOTA_EXCEEDED, CANCELED}
```

Flows hỗ trợ **pause-and-resume** via metadata (delay timestamps hoặc webhook request IDs).

### Editions
| Edition | Model | Key Features |
|---------|-------|--------------|
| Community (CE) | MIT Open Source | Core engine, community pieces, SQLite |
| Cloud | SaaS/Stripe | Multi-tenancy, RBAC, Git Sync, SSO |
| Enterprise (EE) | License Key | Self-hosted multi-tenancy, SAML, audit logs, custom branding |

---

## So sánh Activepieces vs n8n vs Zapier

| Tiêu chí | Activepieces | n8n | Zapier |
|-----------|-------------|-----|--------|
| License | **MIT** (tự do hoàn toàn) | Sustainable Use (hạn chế thương mại) | Proprietary |
| Integrations | 280+ pieces | 1,000+ nodes | 7,000+ |
| Self-host | Docker, miễn phí | Docker, miễn phí | Không |
| AI Agents | Native, MCP-first | LLM nodes mạnh | Basic AI |
| MCP Support | **280+ pieces = MCP servers** | Không native | Không |
| UX | Step-based (dễ dùng) | Node-based canvas (mạnh, khó hơn) | Dropdown menus (dễ nhất) |
| Code Steps | TypeScript, isolated-vm | JavaScript/Python | Basic |
| Pricing Cloud | Free 1,000 tasks/mo, Plus $25/mo | Free 5 workflows | $29.99/mo+ |
| Multi-tenancy | Platform entity (white-label) | User workspaces | Không |

### Khi nào chọn cái nào?
- **Activepieces**: Cần MIT license (embed sản phẩm), team non-technical, AI+MCP native, white-label, startup budget thấp
- **n8n**: Cần nhiều integrations (1,000+), team kỹ thuật, AI pipeline phức tạp (vector DB, RAG), community lớn
- **Zapier**: Non-technical users, cần 7,000+ apps, không muốn self-host

---

## Tính năng nổi bật

1. **MIT License** — embed vào sản phẩm riêng không hạn chế (n8n KHÔNG cho phép)
2. **AI-first + MCP native** — mỗi piece tự động thành MCP server cho Claude/Cursor
3. **TypeScript type-safe SDK** — tạo custom pieces dễ, 60% pieces do community đóng góp
4. **Self-host nhẹ** — single container PGLite + in-memory Redis (không cần DB riêng cho deployment nhỏ)
5. **Visual builder step-based** — trực quan hơn n8n cho non-tech users
6. **Tables** — mini-database tích hợp (thay Airtable/Google Sheets)
7. **Enterprise** — RBAC, audit logs, SSO/SAML, Git Sync, custom branding

---

## Điểm yếu
- Ít integrations hơn n8n (280 vs 1,000+) và Zapier (7,000+)
- AI pipeline chưa mature bằng n8n (n8n có native OpenAI/Claude/vector DB nodes)
- Community nhỏ hơn, ít templates
- Cloud version có bug (v0.78.1 CPU spike, khuyến cáo v0.77.8)

---

## Self-host Docker Setup

```yaml
# docker-compose.yml
services:
  activepieces:
    image: activepieces/activepieces:latest
    ports:
      - "8080:80"
    environment:
      - AP_ENGINE_EXECUTABLE_PATH=dist/packages/engine/main.js
      - AP_ENCRYPTION_KEY=<random-32-char>
      - AP_JWT_SECRET=<random-32-char>
      - AP_POSTGRES_DATABASE=activepieces
      - AP_POSTGRES_HOST=postgres
      - AP_POSTGRES_PASSWORD=activepieces
      - AP_POSTGRES_PORT=5432
      - AP_POSTGRES_USERNAME=activepieces
      - AP_REDIS_HOST=redis
      - AP_REDIS_PORT=6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=activepieces
      - POSTGRES_PASSWORD=activepieces
      - POSTGRES_USER=activepieces
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Production: đặt sau reverse proxy (Nginx/Caddy) + TLS.

---

## Pieces SDK — Tạo custom integration

```typescript
import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';

export const myPiece = createPiece({
  displayName: 'My Service',
  auth: PieceAuth.SecretText({ 
    displayName: 'API Key',
    required: true 
  }),
  actions: [{
    name: 'send_message',
    displayName: 'Send Message',
    props: {
      message: Property.ShortText({ displayName: 'Message', required: true })
    },
    async run(context) {
      const apiKey = context.auth;
      const { message } = context.propsValue;
      const response = await fetch('https://api.myservice.com/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      return response.json();
    }
  }],
  triggers: [{
    name: 'new_message',
    displayName: 'New Message',
    type: TriggerStrategy.WEBHOOK,
    props: {},
    async onEnable(context) { /* register webhook */ },
    async onDisable(context) { /* cleanup webhook */ },
    async run(context) { return [context.payload.body]; }
  }]
});
```

Pieces là npm packages, publish lên npmjs.com → tự động thành MCP server.


## Source Code

docker-compose.yml:
```yaml
services:
  activepieces:
    image: activepieces/activepieces:latest
    ports:
      - "8080:80"
    environment:
      - AP_ENGINE_EXECUTABLE_PATH=dist/packages/engine/main.js
      - AP_ENCRYPTION_KEY=<random-32-char>
      - AP_JWT_SECRET=<random-32-char>
      - AP_POSTGRES_DATABASE=activepieces
      - AP_POSTGRES_HOST=postgres
      - AP_POSTGRES_PASSWORD=activepieces
      - AP_POSTGRES_PORT=5432
      - AP_POSTGRES_USERNAME=activepieces
      - AP_REDIS_HOST=redis
      - AP_REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=activepieces
      - POSTGRES_PASSWORD=activepieces
      - POSTGRES_USER=activepieces
    volumes:
      - postgres_data:/var/lib/postgresql/data
  redis:
    image: redis:7
    volumes:
      - redis_data:/data
volumes:
  postgres_data:
  redis_data:
```

custom-piece-example.ts:
```typescript
import { createPiece, PieceAuth, Property, TriggerStrategy } from '@activepieces/pieces-framework';

export const myPiece = createPiece({
  displayName: 'My Service',
  auth: PieceAuth.SecretText({ displayName: 'API Key', required: true }),
  actions: [{
    name: 'send_message',
    displayName: 'Send Message',
    props: {
      message: Property.ShortText({ displayName: 'Message', required: true })
    },
    async run(context) {
      const apiKey = context.auth;
      const { message } = context.propsValue;
      const response = await fetch('https://api.myservice.com/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      return response.json();
    }
  }],
  triggers: [{
    name: 'new_message',
    displayName: 'New Message',
    type: TriggerStrategy.WEBHOOK,
    props: {},
    async onEnable(context) { /* register webhook */ },
    async onDisable(context) { /* cleanup webhook */ },
    async run(context) { return [context.payload.body]; }
  }]
});
```

## GitHub
https://github.com/activepieces/activepieces
