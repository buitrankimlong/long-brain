---
tags: [MOC, system-design, kien-truc, patterns]
description: System design - architecture, patterns, scaling, databases
updated: 2026-05-09
---

# 11 Thiet Ke He Thong

## Knowledge Files
- [[System-Design-Primer-Knowledge]] - Scalability, caching, databases, load balancing, async

## Key Decisions cho AI SaaS
- Start: **Modular monolith** (khong microservices)
- DB: **PostgreSQL + pgvector** (khong can vector DB rieng den 1M+ vectors)
- Target: **70%+ gross margin** qua semantic caching + model routing
- Framework: **LangGraph** (production) + **CrewAI** (prototype)

## Research chi tiet
- `research/Software-Architecture-and-System-Design-Research.md` - Patterns, SOLID, DDD
- `research/scalable-systems-research.md` - Scaling, DevOps, monitoring, security
- `research/System-Design-Architecture-Resources.md` - Books (332k stars repo), case studies

## Architecture Patterns
1. Modular Monolith -> consensus 2026
2. Clean Architecture -> dependency inversion
3. Hexagonal -> ports & adapters
4. Event-Driven -> async, message queues
5. CQRS -> command/query separation

## Repos
`system-design-primer/` | `system-design-101/` | `awesome-scalability/`

## Lien ket
-> [[12 Trien Khai]] | [[13 Dong Goi San Pham]] | [[Dashboard]]
