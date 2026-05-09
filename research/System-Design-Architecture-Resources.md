# System Design & Software Architecture - Comprehensive Learning Resources

> Deep research compiled May 2026. All links verified at time of research.

---

## Table of Contents
1. [GitHub Repositories](#1-github-repositories--curated-lists)
2. [Real-World Architecture Case Studies](#2-real-world-architecture-case-studies)
3. [Essential Books](#3-essential-books)
4. [Free Courses & Tutorials](#4-free-courses--tutorials)
5. [Architecture Templates & Starters](#5-architecture-templates--starters)
6. [Tools for System Design & Documentation](#6-tools-for-system-design--documentation)
7. [AI-Specific Architecture Patterns](#7-ai-specific-architecture-patterns)

---

## 1. GitHub Repositories & Curated Lists

### Tier 1: Must-Have Repositories

| Repository | Stars | Description |
|---|---|---|
| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 332K+ | The gold standard. Covers scalability, availability, consistency patterns, CDNs, load balancers, databases, caches. Includes Anki flashcards and real design problems (Twitter, Pastebin, Mint, scaling AWS). |
| [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | 65K+ | Visual explanations of complex systems. Covers REST vs GraphQL, Reverse Proxy vs API Gateway vs Load Balancer, microservices patterns, authentication methods, DevOps/SRE concepts. |
| [ashishps1/awesome-system-design-resources](https://github.com/ashishps1/awesome-system-design-resources) | 20K+ | Free resources to learn System Design concepts and prepare for interviews. |
| [charlax/professional-programming](https://github.com/charlax/professional-programming) | 49K+ | Collection of learning resources for software engineers covering design patterns, Docker, Git, debugging, technical writing, and cognitive skills. |

### Tier 2: Architecture & Scalability Focused

| Repository | Stars | Description |
|---|---|---|
| [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) | 60K+ | Patterns of scalable, reliable, and performant large-scale systems. Case studies from battle-tested systems serving millions to billions of users. Includes "Scaling Git at Microsoft" and "Scaling Multitenant Architecture at Shopify". |
| [mehdihadeli/awesome-software-architecture](https://github.com/mehdihadeli/awesome-software-architecture) | 8K+ | Articles, videos, and resources on architecture patterns and principles. Covers CQRS, Event Sourcing, Circuit Breaker, Bulkhead patterns, arc42 templates, and ADRs. Also available at [awesome-architecture.com](https://awesome-architecture.com/). |
| [madd86/awesome-system-design](https://github.com/madd86/awesome-system-design) | 9K+ | Curated list of distributed systems resources, books, and courses. |
| [simskij/awesome-software-architecture](https://github.com/simskij/awesome-software-architecture) | 2K+ | Curated list of resources on software architecture. |

### Additional Notable Repos

- [fabianmagrini/awesome-architecture](https://github.com/fabianmagrini/awesome-architecture) - Resources on software architecture in the Agile and Cloud era
- [drveillard/system-design-architecture](https://github.com/drveillard/system-design-architecture) - Collection of design and architecture principles, books, and best practices
- [alexpulver/awesome-architecture](https://github.com/alexpulver/awesome-architecture) - Collection of architecture-related resources

---

## 2. Real-World Architecture Case Studies

### Netflix - Scaling to 300M+ Subscribers

**Architecture:** Cloud-native microservices on AWS with 1000+ loosely coupled services.

**Key Design Decisions:**
- **Two-Plane Architecture:** Control Plane (AWS) handles browsing, recommendations, account management. Data Plane (Open Connect CDN) handles actual video streaming.
- **Independent Scaling:** Each microservice scales independently. Friday night login spike? Only login containers scale up.
- **Key Infrastructure:** Edge gateway (Zuul), container orchestration (Titus), automated delivery (Spinnaker), streaming pipelines (Kafka).
- **Fault Tolerance:** Asynchronous communication via APIs, event queues (Kafka), and service discovery. Failure in one service doesn't cascade.

**Read More:**
- [Inside Netflix's Architecture (Substack)](https://rockybhatia.substack.com/p/inside-netflixs-architecture-how)
- [Netflix Architecture Case Study (Clustox)](https://www.clustox.com/blog/netflix-case-study/)
- [Netflix Tech Stack: CDN and Microservices (VdoCipher)](https://www.vdocipher.com/blog/netflix-tech-stack-and-architecture/)
- [Microservices at Netflix Scale (GOTO Conference PDF)](https://gotocon.com/dl/goto-amsterdam-2016/slides/RuslanMeshenberg_MicroservicesAtNetflixScaleFirstPrinciplesTradeoffsLessonsLearned.pdf)

---

### Uber - Real-Time at Massive Scale

**Architecture:** Event-driven, geospatially indexed system handling millions of concurrent rides.

**Key Design Decisions:**
- **H3 Hexagonal Spatial Index:** Open-sourced geospatial indexing system. Divides Earth into hexagons instead of calculating exact lat/long for every user/driver pair.
- **Real-Time Communication:** WebSockets for continuous driver location push to riders.
- **Data Storage:** Apache Cassandra for petabytes of trip data across global data centers.
- **Message Streaming:** Apache Kafka as the messaging backbone for event-driven communication.
- **Caching:** Redis as both cache and real-time data store for driver locations.

**Read More:**
- [How Uber Handles Millions of Rides (DEV Community)](https://dev.to/frankdotdev/how-uber-handles-millions-of-rides-a-system-design-masterclass-l35)
- [Uber System Design (GeeksforGeeks)](https://www.geeksforgeeks.org/system-design-of-uber-app-uber-system-architecture/)
- [Architecture Behind Uber Live Tracking (DEV Community)](https://dev.to/meeth_gangwar_f56b17f5aff/the-architecture-behind-uber-live-tracking-5bbm)
- [Uber System Design Complete Guide](https://grokkingthesystemdesign.com/guides/uber-system-design/)

---

### Shopify - Handling Flash Sales (173B Requests on Black Friday 2024)

**Architecture:** Ruby on Rails monolith with sharp architectural decisions, React frontend, MySQL, and Kafka.

**Key Design Decisions:**
- **Pod Architecture:** Moved from shards to "pods" - fully isolated instances of Shopify with own datastores (MySQL, Redis, memcached). A failure in one pod doesn't impact others.
- **Black Friday 2024 Stats:** 173 billion requests, peaked at 284 million requests/minute, 12 TB of traffic/minute through edge.
- **Deceptively Simple Stack:** Ruby on Rails + React + MySQL + Kafka, but with years of deliberate refactoring and trade-offs.

**Read More:**
- [Shopify's Architecture for Flash Sales (InfoQ)](https://www.infoq.com/presentations/shopify-architecture-flash-sale/)
- [How Shopify Handles Flash Sales at 32M Requests/Minute](https://newsletter.systemdesign.one/p/shopify-flash-sale)
- [Shopify Tech Stack (ByteByteGo)](https://blog.bytebytego.com/p/shopify-tech-stack)
- [Shopify Engineering Blog](https://shopify.engineering/)
- [Shopify Flash Sales YouTube Talk](https://www.youtube.com/watch?v=MV5Kdwzwcag)

---

### Discord - Trillions of Messages & Millions of Concurrent Users

**Architecture:** Elixir-based gateway for WebSocket connections, Rust data service, ScyllaDB storage.

**Key Design Decisions:**
- **Gateway Infrastructure:** Built with Elixir/BEAM for lightweight parallel processes. Single server handles tens/hundreds of thousands of concurrent processes.
- **Message Storage Evolution:**
  1. MongoDB (2015) - worked until ~100M messages, then latency issues
  2. Cassandra (2017) - worked until trillions of messages across 177 nodes, then unpredictable latency
  3. ScyllaDB (2022) - current primary store, significantly smaller footprint
- **Request Coalescing:** When multiple users request the same data (e.g., popular message in high-traffic channel), system avoids duplicate database queries.
- **Channel-Based Routing:** All requests for same channel go to same service instance, reducing DB load.

**Read More:**
- [How Discord Stores Trillions of Messages (Official Blog)](https://discord.com/blog/how-discord-stores-trillions-of-messages)
- [How Discord Scaled to 15M Users on One Server (GeeksforGeeks)](https://www.geeksforgeeks.org/system-design/how-discord-scaled-to-15-million-users-on-one-server/)
- [How Discord Stores Trillions of Messages (ByteByteGo)](https://blog.bytebytego.com/p/how-discord-stores-trillions-of-messages)
- [How Discord Serves 15M Users on One Server (ByteByteGo)](https://blog.bytebytego.com/p/how-discord-serves-15-million-users)

---

### Notion - Block-Based Real-Time Collaboration

**Architecture:** Block-based data model, WebSocket-based real-time sync, sharded PostgreSQL.

**Key Design Decisions:**
- **Block-Based Data Model:** Every piece of content (paragraph to database row) is a composable block that can be nested, linked, queried, and collaboratively edited.
- **Six Major Subsystems:** Block storage service, real-time collaboration/sync engine, hierarchy/relationship management, database/query engine, versioning/history service, and search.
- **Real-Time Sync:** Clients maintain WebSocket connections to MessageStore. Edits saved to TransactionQueue (IndexedDB/SQLite) until server confirms or rejects.
- **Conflict Resolution:** CRDT (Conflict-free Replicated Data Types) for handling concurrent edits.
- **Evolution:** Started as monolithic PostgreSQL, decomposed into services with sharded storage and dedicated search/sync engines as user base scaled.

**Read More:**
- [Notion's Data Model: Block-Based Architecture (Official Blog)](https://www.notion.com/blog/data-model-behind-notion)
- [Notion System Design Explained (Educative)](https://www.educative.io/blog/notion-system-design)
- [Notion System Design Interview Guide](https://www.systemdesignhandbook.com/guides/notion-system-design-interview/)

---

### Open Source Projects with Great Architecture to Study

| Project | Why Study It |
|---|---|
| [The Architecture of Open Source Applications (Book)](https://aosabook.org/en/) | Free online book where authors of 50+ open source apps explain their architecture decisions |
| **Linux Kernel** | Powers supercomputers, cloud, Android, IoT. Now integrating Rust for memory safety |
| **Kubernetes** | Container orchestration - excellent distributed systems architecture |
| **Zed Editor** | Lightning-fast collaborative code editor built in Rust. Unique real-time collaboration architecture |
| **PyTorch** | Deep learning framework - study how computation graphs and GPU scheduling are architected |
| **Blender** | 3D creation suite - massive codebase with excellent modular architecture |

---

## 3. Essential Books

### The Core Canon (Must-Read)

| Book | Author(s) | Key Focus |
|---|---|---|
| **Designing Data-Intensive Applications** | Martin Kleppmann | The "Bible" of modern system design. Covers data storage, replication, distributed systems, stream processing, and scalability. The most recommended book across all lists. |
| **System Design Interview Vol. 1** | Alex Xu | 16 practical design problems in ~270 pages. Step-by-step approach to designing systems at scale. Endorsed by The Pragmatic Engineer. |
| **System Design Interview Vol. 2** | Alex Xu & Sahn Lam | Advanced design problems building on Vol. 1. |
| **Clean Architecture** | Robert C. Martin | Principles of component design, dependency rules, and boundary management. |
| **Building Microservices** (2nd Ed.) | Sam Newman | Practical guide to service decomposition, communication patterns, and deployment strategies. |
| **Domain-Driven Design** | Eric Evans | Tackling software complexity through domain modeling. Bounded contexts, aggregates, repositories. |
| **Fundamentals of Software Architecture** | Mark Richards & Neal Ford | Bridge from senior engineer to architect. Architectural styles, quality attributes, communication patterns. |
| **The Pragmatic Programmer** (20th Anniversary) | David Thomas & Andrew Hunt | Timeless software craftsmanship principles. |

### Advanced / Specialized (Highly Recommended)

| Book | Author(s) | Key Focus |
|---|---|---|
| **Software Architecture: The Hard Parts** | Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani | Trade-off decisions in complex distributed systems. Coupling vs cohesion, data ownership in microservices. |
| **Head First Software Architecture** | Raju Gandhi, Mark Richards, Neal Ford | Visual, brain-friendly introduction to architecture for beginners. |
| **Software Engineering at Google** | Titus Winters, Tom Manshreck, Hyrum Wright | Hard-won lessons from managing one of the world's largest codebases. |
| **Designing Distributed Systems** | Brendan Burns | Patterns and paradigms for scalable, reliable services (from co-creator of Kubernetes). |
| **Release It!** (2nd Ed.) | Michael Nygard | Stability patterns, capacity planning, and designing for production. |
| **Staff Engineer** | Will Larson | Operating as a staff-plus engineer, including architectural leadership. |

---

## 4. Free Courses & Tutorials

### Best YouTube Channels for System Design

| Channel | Subscribers | Best For |
|---|---|---|
| **[ByteByteGo](https://www.youtube.com/@ByteByteGo)** | 1.37M | #1 overall. Visual pattern-based explanations from Alex Xu (author of the #1 system design book). |
| **[Gaurav Sen](https://www.youtube.com/@gaborsen)** | 718K | Best for fundamentals. One of the original system design educators on YouTube. |
| **[Hello Interview](https://www.youtube.com/@HelloInterview)** | 150K+ | Rapidly praised on Reddit/Blind. Consistent structure: clarify requirements, estimate scale, design high-level, drill into components, discuss trade-offs. |
| **[Hussein Nasser](https://www.youtube.com/@haborsen)** | 445K | Deep engineering layers: TCP/IP behavior, PostgreSQL internals, proxy architectures, connection pooling. |
| **[freeCodeCamp](https://www.youtube.com/@freecodecamp)** | 10M+ | Full system design course progressing from foundational concepts to production-ready systems. |

### Free Online Resources

| Resource | Link | Description |
|---|---|---|
| **freeCodeCamp System Design Course** | [freecodecamp.org/news/learn-software-system-design](https://www.freecodecamp.org/news/learn-software-system-design/) | Comprehensive free course covering databases, scaling, load balancing |
| **Coursera System Design Courses** | [coursera.org/courses?query=system+design](https://www.coursera.org/courses?query=system+design) | Multiple courses from universities and companies (audit for free) |
| **Coursesity Free Tutorials** | [coursesity.com/free-tutorials-learn/system-design](https://coursesity.com/free-tutorials-learn/system-design) | 25+ free system design courses curated |
| **The Architecture of Open Source Applications** | [aosabook.org](https://aosabook.org/en/) | Free online book with architecture explanations from 50+ open source project authors |
| **High Scalability Blog** | [highscalability.com](http://highscalability.com/) | Real-world architecture case studies |
| **system-design-primer (GitHub)** | [github.com/donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | Free, self-paced curriculum with Anki flashcards |

### Affordable Paid Options

- **Mastering the System Design Interview** by Frank Kane (ex-Amazon hiring manager) - ~$10 on Udemy during sales
- **System Design Masterclass (2026)** on [Udemy](https://www.udemy.com/course/system-design-masterclass/) - From FAANG insiders
- **Grokking the System Design Interview** on [DesignGurus.io](https://www.designgurus.io/blog/best-system-design-courses-for-beginners)

---

## 5. Architecture Templates & Starters

### Next.js / Turborepo Monorepo Templates

| Template | Description | Link |
|---|---|---|
| **next-forge** (by Vercel) | Production-grade Turborepo template. Covers auth, DB/ORM, payments, docs, blog, observability, analytics, emails, feature flags, dark mode. | [github.com/vercel/next-forge](https://github.com/vercel/next-forge) |
| **turborepo-nextjs** | Production-ready monorepo: Next.js 15, React 19, TypeScript, tRPC, Prisma, feature module system. | [github.com/nass59/turborepo-nextjs](https://github.com/nass59/turborepo-nextjs) |
| **turborepo-example** | Modern monorepo: Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, Nextra docs, TypeScript 5.9, pnpm workspaces. | [github.com/owieth/turborepo-example](https://github.com/owieth/turborepo-example) |
| **NyxForge** | Minimal TurboRepo template optimized for scalable, high-performance Next.js apps. | [github.com/parazeeknova/nyxforge](https://github.com/parazeeknova/nyxforge) |
| **turborepo-shadcn-nextjs** | Next.js + Nextra + shared shadcn/ui, powered by Bun, Vitest, Playwright, Storybook, Biome. | [github.com/gmickel/turborepo-shadcn-nextjs](https://github.com/gmickel/turborepo-shadcn-nextjs) |
| **next-express-turborepo** | Full-stack monorepo: Turbopack + Next.js + Express.js + Tailwind + shadcn. | [github.com/ivesfurtado/next-express-turborepo](https://github.com/ivesfurtado/next-express-turborepo) |

### Python / FastAPI Templates

| Template | Description | Link |
|---|---|---|
| **Full Stack FastAPI Template** (Official) | Official template by Tiangolo. FastAPI + React + SQLModel + PostgreSQL + Docker + GitHub Actions + automatic HTTPS. Generate with `copier copy`. | [github.com/fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template) |
| **FastAPI Production Boilerplate** | Modular and scalable with core/app/tests directories. Security, DB connections, configuration, middlewares. | [github.com/iam-abbas/FastAPI-Production-Boilerplate](https://github.com/iam-abbas/FastAPI-Production-Boilerplate) |
| **FastAPI Best Practices** | Netflix Dispatch-inspired domain-based structure (auth, aws, posts each with router/schemas/models/service). | [github.com/zhanymkanov/fastapi-best-practices](https://github.com/zhanymkanov/fastapi-best-practices) |
| **Heavyweight FastAPI** | Postgres + Alembic, Django-inspired structure for scale. | [github.com/Grey-A/heavyweight-fastapi](https://github.com/Grey-A/heavyweight-fastapi) |
| **FastAPI LangGraph Agent Template** | Production-ready template for AI agent applications with LangGraph integration. | [github.com/wassim249/fastapi-langgraph-agent-production-ready-template](https://github.com/wassim249/fastapi-langgraph-agent-production-ready-template) |

### Docker / Kubernetes / CI/CD Templates

| Template | Description | Link |
|---|---|---|
| **docker-compose-anywhere** | Opinionated template for deploying Docker Compose apps in production with zero downtime. | [github.com/hadijaveed/docker-compose-anywhere](https://github.com/hadijaveed/docker-compose-anywhere) |
| **Kompose** | Official Kubernetes tool to convert Docker Compose files to Kubernetes manifests (Deployments, Services, PVCs, ConfigMaps, Secrets). | [github.com/kubernetes/kompose](https://github.com/kubernetes/kompose) |
| **GitLab CI/CD Templates** | Shared GitLab pipeline templates repository. | [github.com/chesapeaketechnology/gitlab-templates](https://github.com/chesapeaketechnology/gitlab-templates) |
| **GitLab CI/CD Examples** | Official examples covering various languages and frameworks. | [docs.gitlab.com/ci/examples](https://docs.gitlab.com/ci/examples/) |
| **GitHub Actions Workflows** | Store YAML files in `.github/workflows/`. Matrix builds for multi-environment testing. Large marketplace of pre-built actions. | [GitHub Actions Docs](https://docs.github.com/en/actions) |

### CI/CD Best Practices (2025-2026)

- **GitHub Actions:** Larger marketplace, matrix builds, workflow reuse across repos
- **GitLab CI:** Merge trains for stable main branch, parent-child pipelines, built-in security scanning, canary deployments
- **Modern Frontend CI/CD:** [Feature-Sliced Design Pipeline Guide](https://feature-sliced.design/blog/frontend-cicd-pipeline-guide)

---

## 6. Tools for System Design & Documentation

### Architecture Diagramming Tools

| Tool | Type | Best For | Link |
|---|---|---|---|
| **Excalidraw** | Visual Canvas (Open Source) | Quick hand-drawn sketches, brainstorming, real-time collaboration with end-to-end encryption. In 2026, Excalidraw + MCP has become the default AI canvas for engineers. | [excalidraw.com](https://excalidraw.com/) |
| **Draw.io / diagrams.net** | Drag-and-Drop (Open Source) | Formal documentation, enterprise workflows, Confluence integration. Best for detailed architecture and process diagrams. | [draw.io](https://draw.io/) |
| **Mermaid** | Code-as-Diagram | Documentation-embedded diagrams, README files, version-controlled diagrams. Clean three-way merge in git. 30 seconds for a 6-node sequence diagram vs 3 minutes in Draw.io. | [mermaid.js.org](https://mermaid.js.org/) |
| **PlantUML** | Code-as-Diagram | Most powerful UML tool. Sequence diagrams, class diagrams, component diagrams. | [plantuml.com](https://plantuml.com/) |

**Recommended Approach:** Combine tools. Draw.io for detailed architecture diagrams, Excalidraw for quick sketches and team discussions, Mermaid for diagrams in documentation and README files.

### Architecture Decision Records (ADR)

| Resource | Description | Link |
|---|---|---|
| **joelparkerhenderson/architecture-decision-record** | Comprehensive ADR examples, templates, and documentation. Multiple template styles. | [github.com/joelparkerhenderson/architecture-decision-record](https://github.com/joelparkerhenderson/architecture-decision-record) |
| **MADR (Markdown Any Decision Records)** | Popular template with simple/elaborate versions. Bare and minimal variants available. | [github.com/adr/madr](https://github.com/adr/madr) |
| **Log4brains** | ADR management and publication tool. Ships with MADR template. | [github.com/thomvaill/log4brains](https://github.com/thomvaill/log4brains) |
| **pmerson/ADR-template** | Clean Markdown template for ADRs. | [github.com/pmerson/ADR-template](https://github.com/pmerson/ADR-template) |
| **ADR GitHub Organization** | Central hub for ADR tools and templates. | [adr.github.io](https://adr.github.io/) |

**Common ADR Templates:**
- **Nygard Template:** Title, Status, Context, Decision, Consequences
- **Y-Statements:** "In the context of [use case], facing [concern] we decided for [option] to achieve [quality], accepting [downside]"
- **Best Practice:** Store ADRs next to source code in the same git repository

### API Documentation Tools

| Tool | Description | Link |
|---|---|---|
| **Swagger UI** | Interactive API documentation from OpenAPI specs. | [swagger.io](https://swagger.io/) |
| **Redoc** | Three-panel responsive API documentation. Supports OpenAPI 3.1, 3.0, and Swagger 2.0. Available as CLI, HTML tag, and React component. | [github.com/Redocly/redoc](https://github.com/Redocly/redoc) |
| **OpenAPI Template** | Starting point for describing APIs in OpenAPI/Swagger format. | [github.com/Redocly/openapi-template](https://github.com/Redocly/openapi-template) |
| **Swagger Codegen** | Template-driven engine to generate docs, API clients, and server stubs from OpenAPI definitions. | [github.com/swagger-api](https://github.com/swagger-api) |

---

## 7. AI-Specific Architecture Patterns

### RAG (Retrieval-Augmented Generation) Architecture

**Core Patterns for 2026:**
- Production RAG systems merge dense vector retrieval, sparse BM25, and metadata filtering
- Re-ranking with Reciprocal Rank Fusion and cross-encoder re-ranking for precision
- RAG expanding beyond text to images, videos, and structured data
- Organizations deploying RAG saw 67% improvement in response accuracy vs static model outputs

**9 RAG Architectures Every AI Developer Must Know:**
- [Towards AI Guide](https://pub.towardsai.net/rag-architectures-every-ai-developer-must-know-a-complete-guide-f3524ee68b9c)

**Key Resources:**
- [RAG, MCP and Agentic AI: Architecture Patterns for 2026](https://aetherlink.ai/en/blog/rag-mcp-and-agentic-ai-architecture-patterns-for-2026)
- [Agentic RAG Survey (arXiv)](https://arxiv.org/abs/2501.09136)
- [Build a RAG Agent with LangChain](https://docs.langchain.com/oss/python/langchain/rag)
- [Agentic RAG: Architecture and Use Cases (Vellum)](https://www.vellum.ai/blog/agentic-rag)

### Multi-Agent System Architecture

**Design Principles:**
- Agents combine LLM reasoning with tool use (APIs, workflows, databases)
- Agentic workflow: plan -> act -> observe -> refine
- Explicit autonomy tiers: observe-only, recommend-with-approval, execute-with-logging, fully autonomous
- Regulatory and risk tolerance determines which tier each workflow occupies

**Enterprise Examples:**
- Morgan Stanley: Retrieval agents over internal financial research
- PwC: Agents for tax and compliance
- ServiceNow: Multi-turn RAG for IT workflows

**Key Resources:**
- [AI Agent Architecture: Complete Guide 2026 (Monday.com)](https://monday.com/blog/ai-agents/ai-agent-architecture/)
- [AI Agent Architecture: Build Systems That Work (Redis)](https://redis.io/blog/ai-agent-architecture/)
- [Agentic AI Gateway for Enterprise (Medium)](https://medium.com/vedcraft/agentic-ai-gateway-the-proven-architecture-pattern-for-enterprise-genai-security-and-governance-3abe0ca8af6a)

### AI Gateway Architecture

**Purpose:** AI gateways sit between applications and LLM providers, handling routing, caching, rate limiting, and security.

**Key Capabilities:**
- Built on high-performance proxy cores (like Envoy) for massive concurrent streaming responses
- Native integration with knowledge bases/vector databases
- Automatic retrieval of relevant materials based on user questions
- Session/conversation state management for multi-turn dialogue

**Key Resources:**
- [AI Gateway Deep Dive 2026 (Jimmy Song)](https://jimmysong.io/blog/ai-gateway-in-depth/)
- [Building a Universal AI Gateway (Medium)](https://medium.com/@garfieldheron/building-a-universal-ai-gateway-lessons-from-connecting-a-personal-knowledge-base-to-multiple-llms-3430cfa2bb09)
- [Agentic Architecture Blueprint for Enterprise (Kore.ai)](https://www.kore.ai/blog/agentic-architecture-blueprint-for-intelligent-enterprise)

### Conversation Management Architecture

**Three Key Strategies:**
1. **Rule-Based Systems:** Pre-defined rules and decision trees. Excel in structured domains with predictable interactions.
2. **Knowledge-Based Approaches:** Leverage domain-specific information for context-aware responses.
3. **Hybrid Systems:** Rules + knowledge bases for structured tasks, neural networks for open-ended interactions. Best balance of reliability and flexibility.

**Memory and Session State:** Let the assistant carry context across turns for natural conversation flow.

**Key Resources:**
- [Conversational Agent Architecture (SmythOS)](https://smythos.com/developers/agent-development/conversational-agent-architecture/)
- [LLM Chatbot Architecture (Rasa)](https://rasa.com/blog/llm-chatbot-architecture)
- [Architecture of AI Knowledge Assistants (CrateDB)](https://cratedb.com/use-cases/chatbots/architecture-of-ai-knowledge-assistants)
- [Contextual Chatbot with Amazon Bedrock Knowledge Bases (AWS)](https://aws.amazon.com/blogs/machine-learning/build-a-contextual-chatbot-application-using-knowledge-bases-for-amazon-bedrock/)

### Knowledge Base Architecture

**Four Core Components:**
1. **Context Data:** Foundation layer - vast amounts of data processed, chunked, and stored alongside embeddings in a vector store
2. **LLM Gateway:** Routes requests, manages prompts, handles model selection
3. **Chatbot/Agent Layer:** Orchestrates retrieval and generation
4. **Monitoring & Reporting:** Tracks performance, accuracy, and usage patterns

**The Knowledge Layer:** Connects agents to enterprise data using vector databases, enterprise search, and RAG. Unifies structured and unstructured information (CRM data, policies, APIs, documents) into shared context that agents can reason over.

---

## Quick-Start Reading Order (Suggested)

For someone new to system design:

1. **Start here:** [system-design-primer](https://github.com/donnemartin/system-design-primer) (free, comprehensive)
2. **Visual learning:** [ByteByteGo system-design-101](https://github.com/ByteByteGoHq/system-design-101) + ByteByteGo YouTube
3. **First book:** "Designing Data-Intensive Applications" by Martin Kleppmann
4. **Interview prep:** "System Design Interview" Vol. 1 & 2 by Alex Xu
5. **Architecture depth:** "Fundamentals of Software Architecture" by Richards & Ford
6. **Real-world study:** Read the Netflix, Discord, Shopify, and Uber case studies above
7. **Practice:** Use Excalidraw for whiteboarding, Mermaid for documentation, ADRs for decisions
8. **Build:** Pick a template from Section 5 and build something

---

*Last updated: May 2026*
