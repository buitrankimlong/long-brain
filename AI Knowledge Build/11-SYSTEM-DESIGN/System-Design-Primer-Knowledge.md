---
tags: [knowledge, system-design, scalability, architecture, database, cache]
source_repo: system-design-101, awesome-system-design-resources, awesome-scalability
files_read: 6
---
# System Design Primer - Knowledge Extraction

## Overview

This knowledge file synthesizes system design knowledge from three major repositories in our vault:

1. **system-design-101** (ByteByteGo) - Visual explanations of complex systems covering APIs, databases, caching, security, architecture, DevOps, and real-world case studies from Netflix, Uber, Twitter, Airbnb, and more.
2. **awesome-system-design-resources** (AlgoMaster) - Curated learning roadmap with core concepts, interview problems (easy/medium/hard), must-read papers (Paxos, MapReduce, Dynamo, Spanner, Kafka, Bigtable, ZooKeeper), and engineering articles.
3. **awesome-scalability** - Battle-tested patterns from companies serving millions to billions of users, organized by scalability, availability, stability, performance, and intelligence.

Key reference: The "Designing Data-Intensive Applications" (DDIA) book by Martin Kleppmann is universally recommended across all three repos.

---

## Scalability Patterns

### Vertical vs Horizontal Scaling
- **Vertical (Scale Up)**: Add more CPU/RAM/storage to a single machine. Simpler but has hardware limits and creates a single point of failure.
- **Horizontal (Scale Out)**: Add more machines. More complex but virtually unlimited scale. Preferred for large systems.
- Hidden costs of scale-out: network complexity, data consistency, operational overhead.

### Microservices and Orchestration
- Domain-Oriented Microservice Architecture (Uber pattern)
- Service architecture layers: Domain Gateways, Value-Added Services, BFF (Backend for Frontend)
- Containerization (Docker, Kubernetes) used at Pinterest, Netflix, Riot Games, Stripe
- Key trade-off: Monolith first, then extract microservices as needed (Amazon Prime Video moved back from microservices to monolith for their monitoring service)

### Key Scalability Strategies (8 Must-Know)
1. **Stateless services** - No server-side session state; enables any instance to handle any request
2. **Horizontal scaling** - Add more instances behind load balancers
3. **Database sharding** - Distribute data across multiple database instances
4. **Caching** - Multi-layer caching (client, CDN, application, database)
5. **Async processing** - Message queues for non-blocking operations
6. **Read replicas** - Separate read and write database workloads
7. **Load balancing** - Distribute traffic across healthy instances
8. **Auto-scaling** - Dynamic resource allocation based on demand (Netflix Scryer for predictive auto-scaling)

### Consistent Hashing
- Distributes data/load across nodes evenly
- Minimizes redistribution when nodes are added/removed
- Used at Netflix (content distribution), Vimeo (load balancing)
- Algorithmic trade-offs between balance, lookup speed, and memory

### The Twelve-Factor App
- Methodology for building SaaS apps that are portable, scalable, and deployable
- Key factors: codebase, dependencies, config, backing services, build/release/run, processes, port binding, concurrency, disposability, dev/prod parity, logs, admin processes

---

## Availability Patterns

### High Availability Design
- **Target**: "Five nines" = 99.999% uptime = ~5 minutes downtime/year
- **The Calculus of Service Availability**: Availability of dependent services multiplied together (chain is as weak as weakest link)
- Design principles: redundancy, failover, graceful degradation, self-healing

### Failover Strategies
- **Active-passive (cold/warm standby)**: Standby takes over when primary fails. Simpler but wastes resources.
- **Active-active (hot standby)**: Multiple nodes serve traffic simultaneously. Better utilization, harder to implement.
- **ELB for automatic failover** (GoSquared pattern)
- **MySQL High Availability** patterns at GitHub and Eventbrite
- **Multi-region disaster recovery** with Kafka at Uber

### Resilience Engineering
- **Chaos Engineering**: Intentionally inject failures to find weaknesses (Netflix Chaos Monkey)
- **Circuit Breaker**: Stop calling failing services to prevent cascade failures (Shopify, Zendesk, Traveloka)
- **Bulkhead Pattern**: Isolate components so failure in one doesn't affect others
- **Timeouts and Retries**: With exponential backoff and jitter
- **Throttling**: Maintain steady pace under load

### Disaster Recovery Strategies (Cloud)
- Backup and restore (cheapest, slowest RTO)
- Pilot light (minimal always-running core)
- Warm standby (scaled-down copy running)
- Multi-site active-active (most expensive, fastest RTO)

### CAP Theorem
- In a distributed system, you can only guarantee 2 of 3: Consistency, Availability, Partition tolerance
- Since network partitions are inevitable, real choice is CP vs AP
- **CP databases**: Prioritize consistency (e.g., traditional RDBMS with strong consistency)
- **AP databases**: Prioritize availability (e.g., Cassandra, DynamoDB with eventual consistency)
- Most misunderstood: CAP is about behavior during network partitions, not normal operation

---

## Database Patterns (SQL vs NoSQL, Sharding, Replication)

### SQL vs NoSQL Decision Guide
- **SQL (Relational)**: ACID transactions, structured data, complex joins, strong consistency. Use for financial data, user accounts, relational data.
- **NoSQL**: Flexible schema, horizontal scaling, high throughput. Types:
  - **Document** (MongoDB): Semi-structured data, content management
  - **Key-Value** (Redis, DynamoDB): Session management, caching, simple lookups
  - **Wide-Column** (Cassandra, HBase): Time-series, IoT, analytics at scale
  - **Graph** (Neo4j): Relationship-heavy data, social networks, recommendations
- PostgreSQL is the "most loved" database (StackOverflow surveys) - supports JSON, full-text search, and with pgvector extension handles vector similarity search
- Lesson from Salesforce: SQL and NoSQL are not mutually exclusive; use polyglot persistence

### Database Sharding (4 Key Algorithms)
1. **Range-based sharding**: Partition by data range (e.g., dates). Simple but can create hotspots.
2. **Hash-based sharding**: Hash a key to determine shard. Even distribution but hard to do range queries.
3. **Directory-based sharding**: Lookup table maps data to shards. Flexible but lookup table is SPOF.
4. **Geo-based sharding**: Partition by geography. Good for location-based services.
- Key concepts: shard key selection, resharding strategies, cross-shard queries
- Cross-shard transactions at 10M RPS (Dropbox case study)

### Data Replication Patterns
- **Read Replica Pattern**: Write to primary, read from replicas. Reduces read load.
- **Multi-master replication**: Multiple nodes accept writes. Complex conflict resolution.
- **Synchronous vs Asynchronous replication**: Trade-off between consistency and latency.
- Crash-safe replication for MySQL (Booking.com pattern)

### ACID Properties
- **Atomicity**: All or nothing transactions
- **Consistency**: Data remains valid after transactions
- **Isolation**: Concurrent transactions don't interfere (isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable)
- **Durability**: Committed data survives system failures

### Database Performance
- **Indexing**: B-Tree (balanced reads/writes) vs LSM-Tree (write-optimized)
- **Connection pooling**: Reuse database connections
- **Query optimization**: Proper indexing, avoiding N+1 queries
- **Pessimistic vs Optimistic Locking**: Trade-off between contention and conflict handling

### Storage Systems
- **Block storage**: Raw storage volumes (EBS)
- **File storage**: Hierarchical file system (EFS, NFS)
- **Object storage**: Flat namespace with metadata (S3) - top 6 use cases include backup, media, static assets, data lakes, ML training data, archival

---

## Caching Strategies

### 5 Core Caching Strategies
1. **Cache-Aside (Lazy Loading)**: App checks cache first, loads from DB on miss, writes to cache. Most common pattern.
2. **Read-Through**: Cache sits between app and DB; cache loads data on miss automatically.
3. **Write-Through**: Every write goes to cache AND DB simultaneously. Strong consistency but higher write latency.
4. **Write-Behind (Write-Back)**: Write to cache first, async write to DB later. Fast writes but risk of data loss.
5. **Write-Around**: Write directly to DB, bypass cache. Reduces cache pollution for infrequently read data.

### Cache Eviction Policies (Top 8)
1. LRU (Least Recently Used) - most common
2. LFU (Least Frequently Used)
3. FIFO (First In First Out)
4. LIFO (Last In First Out)
5. MRU (Most Recently Used)
6. Random Replacement
7. TTL (Time To Live)
8. ARC (Adaptive Replacement Cache)

### Cache Failure Patterns
- **Cache Stampede/Thundering Herd**: Many requests hit DB simultaneously when cache expires
- **Cache Penetration**: Requests for non-existent data bypass cache every time
- **Cache Avalanche**: Many cache entries expire at same time, overwhelming DB
- **Hot Key Problem**: Single key gets disproportionate traffic (solution: key replication across cache nodes)

### Distributed Caching
- **Redis vs Memcached**: Redis supports data structures, persistence, replication; Memcached is simpler, multi-threaded
- Why Redis is fast: in-memory, single-threaded event loop, efficient data structures, I/O multiplexing
- Redis persistence: RDB snapshots + AOF (Append Only File)
- Redis architecture evolution: standalone, sentinel (HA), cluster (sharding)
- Netflix uses caching 4 ways: EVCache for session/personalization, client-side caching, CDN caching, application-level caching

### Multi-Layer Cache Architecture
```
Client Cache -> CDN -> API Gateway Cache -> Application Cache (Redis) -> Database Cache (Query Cache)
```

---

## Load Balancing

### Load Balancing Algorithms (Top 6)
1. **Round Robin**: Distribute sequentially. Simple but ignores server capacity.
2. **Weighted Round Robin**: Assign weights based on server capacity.
3. **Least Connections**: Send to server with fewest active connections.
4. **Weighted Least Connections**: Combine weights with connection count.
5. **IP Hash**: Hash client IP to determine server. Ensures session affinity.
6. **Least Response Time**: Route to fastest-responding server.

### Load Balancer Types
- **Layer 4 (Transport)**: Routes based on IP/port. Faster, less flexible. (Facebook Katran)
- **Layer 7 (Application)**: Routes based on HTTP headers, URL, cookies. More flexible, can do content-based routing.
- **DNS-based**: Distribute at DNS level (Dropbox, Hulu patterns)
- **Global Server Load Balancing (GSLB)**: Distribute across data centers

### Real-World Implementations
- Facebook: Katran (L4) + custom L7, supporting 1.3B+ users
- Netflix: Zuul 2 cloud gateway + Eureka for service discovery
- GitHub: GLB (GitHub Load Balancer)
- Twitter: Deterministic Aperture algorithm

### Load Balancer vs API Gateway vs Reverse Proxy
- **Load Balancer**: Distributes traffic across servers
- **API Gateway**: Single entry point for APIs; handles auth, rate limiting, request routing, protocol translation
- **Reverse Proxy**: Sits in front of servers; handles SSL termination, compression, caching
- In practice, modern systems often combine all three (e.g., Nginx, HAProxy, AWS ALB)

---

## CDN & Reverse Proxy

### Content Delivery Network (CDN)
- Geographically distributed servers that cache content close to users
- **Push CDN**: Origin pushes content to CDN nodes proactively. Good for static content that changes infrequently.
- **Pull CDN**: CDN fetches content from origin on first request, caches it. Better for dynamic/frequently changing content.
- Key benefits: reduced latency, reduced origin load, DDoS protection, SSL termination

### CDN Architecture
- Edge servers (PoPs - Points of Presence) worldwide
- Origin server as the source of truth
- Cache invalidation strategies: TTL-based, purge API, versioned URLs
- Cost optimization: cache hit ratio monitoring, selective caching

### Reverse Proxy Patterns
- **SSL/TLS termination**: Offload encryption/decryption from application servers
- **Compression**: Brotli compression (LinkedIn: boosted site speed; Dropbox, Booking.com, Yelp)
- **Static file serving**: Serve cached static assets without hitting application servers
- **Request buffering**: Shield backend from slow clients
- **Why Nginx is popular**: Event-driven architecture, low memory footprint, high concurrency

---

## Async Processing (Message Queues)

### Message Queue Patterns
- **Point-to-Point**: One producer, one consumer per message. Good for task distribution.
- **Publish/Subscribe (Pub/Sub)**: One producer, multiple consumers receive same message. Good for event broadcasting.
- **Request/Reply**: Async request with correlation ID for matching response.
- **Dead Letter Queue (DLQ)**: Failed messages routed to separate queue for investigation.

### Message Queue Evolution
IBM MQ -> RabbitMQ -> Apache Kafka -> Apache Pulsar

### Apache Kafka Deep Dive
- Distributed streaming platform, not just a message queue
- **Why Kafka is fast**: Sequential I/O, zero-copy, batching, compression, partitioning
- **Top 5 use cases**: Log aggregation, stream processing, event sourcing, metrics collection, commit log
- **Can Kafka lose messages?** Yes, under specific conditions (unclean leader election, producer acks=0, consumer offset issues)
- **Delivery semantics**: At-most-once, at-least-once, exactly-once (idempotent producers + transactional consumers)

### Event-Driven Architecture
- **Event Sourcing**: Store state changes as immutable events, rebuild state by replaying
- **CQRS (Command Query Responsibility Segregation)**: Separate read and write models
- **Change Data Capture (CDC)**: Capture database changes as events for downstream systems
- McDonald's uses event-driven architecture for their ordering system

### Eventual Consistency Patterns
- **Saga Pattern**: Distributed transactions as sequence of local transactions with compensating actions
- **Outbox Pattern**: Write events to outbox table in same transaction as data change
- **Idempotency**: Ensure operations can be safely retried (top 6 cases: payments, API calls, message processing, database operations, file uploads, email sending)

---

## Communication (REST, RPC, GraphQL)

### API Architectural Styles Comparison
| Style | Format | Transport | Use Case |
|-------|--------|-----------|----------|
| REST | JSON/XML | HTTP | Web APIs, CRUD operations |
| GraphQL | JSON | HTTP | Complex queries, mobile apps |
| gRPC | Protocol Buffers | HTTP/2 | Microservice-to-microservice |
| SOAP | XML | HTTP/SMTP | Enterprise, legacy systems |
| WebSocket | Binary/Text | TCP | Real-time bidirectional |
| Webhooks | JSON | HTTP | Event notifications |

### REST API Best Practices
- Use nouns for resources, HTTP verbs for actions
- Version your API (URL path or header)
- Implement pagination (cursor-based preferred over offset for large datasets)
- Use proper HTTP status codes
- Implement HATEOAS for discoverability
- Security: HTTPS, OAuth 2.0, rate limiting, input validation

### GraphQL
- Query exactly what you need (solve over-fetching/under-fetching)
- Single endpoint, strongly typed schema
- LinkedIn uses GraphQL in production
- Adoption patterns: wrapping REST APIs, BFF layer, full GraphQL backend

### gRPC
- Uses Protocol Buffers (binary serialization, smaller than JSON)
- HTTP/2: multiplexing, server push, header compression
- 4 types: Unary, Server streaming, Client streaming, Bidirectional streaming
- Best for internal microservice communication

### Real-Time Communication
- **Short/Long Polling**: Client repeatedly asks server for updates. Simple but inefficient.
- **Server-Sent Events (SSE)**: Server pushes updates to client over HTTP. One-directional.
- **WebSockets**: Full-duplex communication over single TCP connection. Best for chat, gaming, live updates.

---

## Security

### Authentication Mechanisms (Top 4)
1. **Session-based**: Server stores session state. Traditional, simple, but not stateless.
2. **JWT (JSON Web Token)**: Stateless tokens containing claims. Good for distributed systems. Self-contained but cannot be revoked easily.
3. **OAuth 2.0**: Delegation protocol for third-party access. Flows: Authorization Code, Implicit, Client Credentials, Device Code.
4. **SSO (Single Sign-On)**: One login for multiple applications.

### Comparison: Session vs JWT vs PASETO
- Sessions: Server-side state, good for traditional web apps
- JWT: Stateless, good for APIs and microservices, but susceptible to algorithm confusion attacks
- PASETO: Safer alternative to JWT, no algorithm negotiation

### API Security (Top 12 Tips)
1. Use HTTPS everywhere
2. Use OAuth 2.0 for authorization
3. Implement rate limiting
4. Validate and sanitize all inputs
5. Use API keys for identification (not authentication)
6. Use encryption for sensitive data (symmetric for speed, asymmetric for key exchange)
7. Implement proper error handling (don't leak internals)
8. Use security headers
9. Implement logging and monitoring
10. Use API gateways for centralized security
11. Implement CORS properly
12. Regular security audits and penetration testing

### Password Security
- Never store plaintext passwords
- Use bcrypt/scrypt/Argon2 for hashing (not MD5/SHA-1)
- Salt each password uniquely
- Implement rate limiting on login attempts

### HTTPS/SSL/TLS
- TLS handshake: Client Hello, Server Hello + Certificate, Key Exchange, Symmetric Encryption established
- Certificate chain: Root CA -> Intermediate CA -> Server Certificate
- Symmetric encryption for data (AES), asymmetric for key exchange (RSA/ECDSA)

### Network Security
- **Firewalls**: Packet filtering, stateful inspection, application-layer filtering
- **VPN**: Encrypt all traffic between client and server
- **SSH**: Secure remote access with key-based authentication
- **DevSecOps**: Integrate security into CI/CD pipeline

---

## Key Diagrams & Concepts

### Latency Numbers Every Programmer Should Know
- L1 cache reference: ~0.5 ns
- L2 cache reference: ~7 ns
- Main memory reference: ~100 ns
- SSD random read: ~150 us
- HDD seek: ~10 ms
- Send packet CA->Netherlands->CA: ~150 ms
- Key insight: Memory is 1000x faster than SSD, SSD is 100x faster than HDD

### System Design Building Blocks
```
Clients -> DNS -> CDN -> Load Balancer -> API Gateway
    -> Web Servers -> Application Servers
    -> Cache (Redis) -> Database (Primary + Replicas)
    -> Message Queue -> Workers
    -> Object Storage (S3) -> Search (Elasticsearch)
    -> Monitoring -> Logging
```

### 10 Essential Components of Production Web App
1. DNS + Domain management
2. Load Balancer (L4/L7)
3. Web/Application servers
4. Database (primary + replicas)
5. Cache layer (Redis/Memcached)
6. CDN for static assets
7. Message queue for async tasks
8. Object storage for files
9. Monitoring and alerting
10. CI/CD pipeline

### Key System Design Trade-offs (Top 10)
1. Performance vs Scalability
2. Latency vs Throughput
3. Availability vs Consistency (CAP)
4. SQL vs NoSQL
5. Normalization vs Denormalization
6. Caching vs Freshness
7. Strong vs Eventual Consistency
8. Stateful vs Stateless
9. Batch vs Stream Processing
10. Push vs Pull Architecture

### Distributed System Patterns (Top 7)
1. Ambassador (proxy sidecar)
2. Circuit Breaker
3. CQRS
4. Event Sourcing
5. Leader Election
6. Publisher/Subscriber
7. Sharding

### Must-Read Papers for Distributed Systems
1. Paxos: Consensus algorithm for distributed systems
2. MapReduce: Parallel processing of large datasets
3. Google File System (GFS): Distributed file storage
4. Dynamo: Amazon's highly available key-value store
5. Kafka: Distributed messaging for log processing
6. Spanner: Google's globally-distributed database
7. Bigtable: Distributed storage for structured data
8. ZooKeeper: Wait-free coordination service
9. LSM-Tree: Write-optimized storage structure
10. Chubby: Distributed lock service

---

## What We Can Reuse for AI Systems

### For Our AI Marketing/Sales Automation Platform

**Architecture Decisions (Aligned with CLAUDE.md)**:
- **Modular monolith first**: Start simple, extract services when bottlenecks appear. Amazon Prime Video case study validates this approach.
- **PostgreSQL + pgvector**: PostgreSQL is battle-tested, "eating the database world." pgvector handles vector similarity for AI embeddings without a separate vector DB until 1M+ vectors.

**Caching for AI Cost Optimization (Target: 70%+ Gross Margin)**:
- **Semantic caching**: Cache-aside pattern with Redis for LLM responses. Hash the semantic meaning of queries to find cache hits.
- **Multi-layer caching**: Client -> CDN (static assets) -> Redis (API responses, LLM outputs) -> PostgreSQL (persistent)
- **Write-behind pattern**: Cache AI-generated content first, persist async for speed.
- Cache eviction: LRU with TTL for LLM responses (content goes stale).

**Model Routing (Sonnet for Routine, Opus for Complex)**:
- API Gateway pattern: Route requests based on complexity scoring
- Circuit breaker: Fall back to cheaper model if premium model is down
- Rate limiting per client to control AI costs

**Message Queues for AI Workflows**:
- **Async processing**: LLM calls are slow (1-30s); use message queues to handle them asynchronously
- **Dead Letter Queue**: Failed AI generations go to DLQ for retry/human review
- **Event-driven architecture**: Content generation -> Review -> Publishing pipeline
- Kafka-style event sourcing for audit trail of all AI-generated content

**Scalability for Vietnam Market**:
- CDN for static marketing content delivery across Vietnam
- Read replicas for dashboard/analytics queries (separate from write path)
- Auto-scaling for campaign burst traffic (Tet holiday, flash sales)
- Geo-sharding consideration for Zalo/MoMo integration

**Monitoring and Observability**:
- Logging, Tracing, Metrics (the three pillars)
- Track: LLM latency, cache hit ratio, cost per request, error rates
- ELK Stack (Elasticsearch, Logstash, Kibana) for log management

**Security for Client Data**:
- JWT for API authentication (stateless, good for distributed services)
- OAuth 2.0 for third-party integrations (Zalo, MoMo, VNPay)
- Encrypt PII at rest and in transit
- Rate limiting to prevent abuse of AI endpoints

**Real-World Architecture Inspiration**:
- Netflix: Multi-layer caching, event-driven, microservice resilience
- Airbnb: Monolith to microservices evolution, payment system
- Uber: Domain-oriented microservices, geo-sharding, Kafka for real-time
- Discord: Trillions of messages with Cassandra (then ScyllaDB)
- Slack: Real-time messaging architecture, WebSocket patterns

---

## Quick Reference: System Design Interview Framework

1. **Clarify requirements** (functional + non-functional: scale, latency, availability)
2. **Estimate scale** (users, QPS, storage, bandwidth)
3. **Define API** (REST endpoints, request/response)
4. **Design high-level architecture** (draw the building blocks)
5. **Deep dive** into critical components (database schema, caching strategy, etc.)
6. **Address bottlenecks** (scaling, single points of failure, monitoring)
7. **Discuss trade-offs** (CAP, consistency models, cost vs performance)
