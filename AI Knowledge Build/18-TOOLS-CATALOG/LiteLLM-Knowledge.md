---
tags: [knowledge, litellm, gateway, proxy, llm-routing, cost-tracking, load-balancing, caching]
source_repo: litellm (BerriAI/litellm on GitHub)
files_read: 12
---
# LiteLLM - Knowledge Extraction

## Overview & Architecture

LiteLLM is a unified LLM API gateway that provides a single OpenAI-compatible interface to 100+ LLM providers (OpenAI, Anthropic, Gemini, Bedrock, Azure, Groq, Mistral, Ollama, etc.). Built by BerriAI (Y Combinator W23), MIT licensed, v1.85.0+.

**Two deployment modes:**

1. **Python SDK** - Direct library integration via `litellm.completion()`, translates calls to any provider
2. **Proxy Server (AI Gateway)** - Self-hosted FastAPI server with virtual keys, spend tracking, load balancing, guardrails, admin UI

**Core value proposition:** Write once against OpenAI format, route to any provider. No vendor lock-in. Production-grade with 8ms P95 latency at 1K RPS.

### Architecture Diagram (Conceptual)

```
Your App / Agent Framework
        |
        v
  LiteLLM (SDK or Proxy)
   |-- Router (load balancing, fallbacks, retries)
   |-- Cost Calculator (per-token pricing for all models)
   |-- Cache Layer (Redis, in-memory, S3, semantic)
   |-- Auth & Budget (virtual keys, team/user spend limits)
        |
        v
  100+ LLM Providers
  (OpenAI, Anthropic, Bedrock, Vertex, Azure, Ollama, ...)
```

## Tech Stack & Dependencies

| Component | Technology |
|-----------|-----------|
| Language | Python 3.10-3.13 |
| Web Framework | FastAPI + Uvicorn/Gunicorn |
| Database | PostgreSQL (via Prisma ORM) |
| Caching | Redis / Redis Cluster / In-Memory / S3 / GCS / Azure Blob / Disk |
| Monitoring | Prometheus + 40+ callback integrations (Langfuse, Datadog, OpenTelemetry) |
| Admin UI | Next.js dashboard |
| Container | Docker (signed with cosign) |
| Build | uv (uv_build) |

### Core Dependencies
```
httpx, openai, tiktoken, tokenizers, pydantic, aiohttp,
click, jinja2, python-dotenv, jsonschema, fastuuid
```

### Proxy Additional Dependencies
```
fastapi, uvicorn, gunicorn, prisma, PyJWT, cryptography,
boto3, azure-identity, redis, prometheus-client, apscheduler,
mcp, a2a-sdk, websockets, orjson
```

## Key Code Patterns (with code snippets)

### Pattern 1: Unified Completion Interface

```python
from litellm import completion

# Same function, any provider - just change the model string
response = completion(model="openai/gpt-4o", messages=[{"role": "user", "content": "Hello"}])
response = completion(model="anthropic/claude-sonnet-4-20250514", messages=[{"role": "user", "content": "Hello"}])
response = completion(model="bedrock/amazon.titan-text-express-v1", messages=[{"role": "user", "content": "Hello"}])
response = completion(model="ollama/llama3", messages=[{"role": "user", "content": "Hello"}])
```

The `completion()` function signature accepts 40+ OpenAI-compatible parameters:

```python
def completion(
    model: str,
    messages: List = [],
    timeout: Optional[Union[float, str, httpx.Timeout]] = None,
    temperature: Optional[float] = None,
    top_p: Optional[float] = None,
    n: Optional[int] = None,
    stream: Optional[bool] = None,
    max_tokens: Optional[int] = None,
    tools: Optional[List] = None,
    tool_choice: Optional[str] = None,
    response_format: Optional[dict] = None,
    # ... 30+ more params
    **kwargs,
) -> Union[ModelResponse, CustomStreamWrapper]
```

### Pattern 2: Provider Routing (3-Stage Pipeline)

```python
# Stage 1: Provider Detection - infer from model string or explicit param
model, custom_llm_provider, dynamic_api_key, api_base = get_llm_provider(
    model=model, custom_llm_provider=custom_llm_provider,
    api_base=api_base, api_key=api_key,
)

# Stage 2: Responses API Bridge Check
responses_api_model_info, model = responses_api_bridge_check(...)

# Stage 3: Provider-Specific Handler Dispatch
if custom_llm_provider == "azure":
    response = azure_chat_completions.completion(...)
elif custom_llm_provider == "anthropic":
    response = anthropic_chat_completions.completion(...)
elif custom_llm_provider == "groq":
    response = base_llm_http_handler.completion(...)
# ... 30+ provider branches
```

### Pattern 3: Router with Load Balancing

```python
from litellm import Router

router = Router(
    model_list=[
        {"model_name": "gpt-4", "litellm_params": {"model": "azure/gpt-4", "api_base": "https://endpoint1.openai.azure.com/"}},
        {"model_name": "gpt-4", "litellm_params": {"model": "azure/gpt-4", "api_base": "https://endpoint2.openai.azure.com/"}},
        {"model_name": "gpt-4", "litellm_params": {"model": "openai/gpt-4"}},
    ],
    routing_strategy="least-busy",  # or "usage-based-routing", "latency-based-routing", "cost-based-routing", "simple-shuffle"
    num_retries=3,
    fallbacks=[{"gpt-4": ["claude-sonnet"]}],
    allowed_fails=3,
    cooldown_time=60,
)

response = await router.acompletion(model="gpt-4", messages=[...])
```

**Available routing strategies:**
| Strategy | Selector Class | Description |
|----------|---------------|-------------|
| `simple-shuffle` | None (random) | Random selection across deployments |
| `least-busy` | LeastBusyLoggingHandler | Route to deployment with fewest in-flight requests |
| `usage-based-routing` | LowestTPMLoggingHandler | Route based on tokens-per-minute usage |
| `usage-based-routing-v2` | LowestTPMLoggingHandler_v2 | Improved TPM-based routing |
| `latency-based-routing` | LowestLatencyLoggingHandler | Route to fastest responding deployment |
| `cost-based-routing` | LowestCostLoggingHandler | Route to cheapest available deployment |

### Pattern 4: Fallback Chain Architecture

```
Primary Model Group
    |-- Fail --> Check fallback_param models (try sequentially)
    |-- ContextWindowError --> context_window_fallbacks
    |-- ContentPolicyError --> content_policy_fallbacks
    |-- MidStreamFallback --> Reconstruct prompt with partial content, retry
    |-- All fail --> default_fallbacks
```

Router constructor fallback params:
```python
Router(
    fallbacks=[{"gpt-4": ["claude-sonnet", "gemini-pro"]}],
    context_window_fallbacks=[{"gpt-4": ["gpt-4-32k"]}],
    content_policy_fallbacks=[{"dall-e-3": ["stable-diffusion"]}],
    default_fallbacks=["gpt-3.5-turbo"],
    max_fallbacks=5,
)
```

### Pattern 5: Cost Calculation

```python
from litellm import completion_cost, cost_per_token

# After getting response
cost = completion_cost(completion_response=response)

# Or calculate manually
input_cost, output_cost = cost_per_token(
    model="gpt-4o",
    prompt_tokens=1000,
    completion_tokens=500,
    custom_llm_provider="openai",
)
```

Cost routing through provider-specific calculators:
```python
# Provider dispatch for accurate pricing
if custom_llm_provider == "anthropic":
    return anthropic_cost_per_token(model=model, usage=usage_block)
elif custom_llm_provider == "openai":
    return openai_cost_per_token(model=model, usage=usage_block, service_tier=service_tier)
elif custom_llm_provider == "bedrock":
    return bedrock_cost_per_token(model=model, usage=usage_block)
```

Supports: custom pricing, batch discounts (50% off), margin/discount configs, per-provider cost lookup from global `litellm.model_cost` dictionary.

### Pattern 6: Caching

```python
import litellm
from litellm import completion
from litellm.caching.caching import Cache

# In-memory cache
litellm.cache = Cache(type="local", ttl=300)

# Redis cache
litellm.cache = Cache(type="redis", host="localhost", port=6379, ttl=600)

# Semantic cache (vector similarity)
litellm.cache = Cache(
    type="redis-semantic",
    similarity_threshold=0.8,
    embedding_model="text-embedding-ada-002",
)

# S3 cache
litellm.cache = Cache(type="s3", s3_bucket_name="my-cache-bucket")
```

**Supported cache backends:**
| Backend | Class | Use Case |
|---------|-------|----------|
| `local` | InMemoryCache | Dev/testing, single instance |
| `redis` | RedisCache | Distributed, production |
| `redis-semantic` | RedisSemanticCache | Similar query deduplication |
| `qdrant-semantic` | QdrantSemanticCache | Dedicated vector DB caching |
| `s3` | S3Cache | Cloud object storage |
| `gcs` | GCSCache | Google Cloud |
| `azure` | AzureBlobCache | Azure storage |
| `disk` | DiskCache | Persistent local |

Cache key generation: SHA-256 hash of all LLM API parameters with optional namespace prefix.

### Pattern 7: Exception Standardization

```python
# All provider errors mapped to standard types
except Exception as e:
    raise exception_type(
        model=model,
        custom_llm_provider=custom_llm_provider,
        original_exception=e,
        completion_kwargs=completion_kwargs,
    )
```

Pre-execution validation:
```python
messages = validate_and_fix_openai_messages(messages=messages)
tools = validate_and_fix_openai_tools(tools=tools)
tool_choice = validate_chat_completion_tool_choice(tool_choice=tool_choice)
```

## Configuration & Setup

### Docker Compose (Production)

```yaml
services:
  litellm:
    image: docker.litellm.ai/berriai/litellm:main-stable
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: "postgresql://llmproxy:dbpassword9090@db:5432/litellm"
      STORE_MODEL_IN_DB: "True"
    depends_on:
      - db

  db:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: litellm
      POSTGRES_USER: llmproxy
      POSTGRES_PASSWORD: dbpassword9090
    volumes:
      - postgres_data:/var/lib/postgresql/data

  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Proxy Config YAML

```yaml
model_list:
  - model_name: gpt-4
    litellm_params:
      model: azure/gpt-4-deployment
      api_base: https://my-endpoint.openai.azure.com/
      api_key: os.environ/AZURE_API_KEY
    model_info:
      vision: true

  - model_name: claude-sonnet
    litellm_params:
      model: anthropic/claude-sonnet-4-20250514
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: local-llama
    litellm_params:
      model: ollama/llama3
      api_base: http://localhost:11434

litellm_settings:
  cache: true
  callbacks: ["otel", "prometheus"]
  drop_params: true
  num_retries: 3
  allowed_fails: 3
  cooldown_time: 60

router_settings:
  routing_strategy: "least-busy"
  enable_tag_filtering: true

guardrails:
  - guardrail_name: "content-filter"
    litellm_params:
      guardrail: bedrock
      guardrailIdentifier: "abc123"
      mode: "pre_call"
```

### Quick Start Commands

```bash
# Install as SDK
uv add litellm

# Install with proxy
uv add 'litellm[proxy]'

# Run proxy server
litellm --model gpt-4o --port 4000

# Run with config
litellm --config config.yaml

# Point any OpenAI client to proxy
export OPENAI_API_BASE=http://localhost:4000
```

## API & Integration Patterns

### Using Proxy as OpenAI Drop-in

```python
import openai

client = openai.OpenAI(
    api_key="sk-anything",  # virtual key from LiteLLM
    base_url="http://localhost:4000"
)

# Now use ANY model through unified interface
response = client.chat.completions.create(
    model="gpt-4",  # routes per proxy config
    messages=[{"role": "user", "content": "Hello"}]
)
```

### Supported Endpoints
- `/chat/completions` - Chat completions
- `/completions` - Text completions
- `/embeddings` - Embeddings
- `/images/generations` - Image generation
- `/audio/transcriptions` - Speech-to-text
- `/audio/speech` - Text-to-speech
- `/batches` - Batch processing
- `/rerank` - Reranking
- `/models` - List available models

### A2A Protocol Integration

```python
from litellm.a2a_protocol import A2AClient

request = SendMessageRequest(
    id=str(uuid4()),
    params=MessageSendParams(message={...})
)
response = await client.send_message(request)
```

### MCP Tools Integration

```python
from mcp.client.stdio import stdio_client

tools = await experimental_mcp_client.load_mcp_tools(session=session, format="openai")
response = await litellm.acompletion(
    model="gpt-4o",
    messages=[...],
    tools=tools
)
```

### Callback / Observability Integration

```python
import litellm

# Built-in integrations
litellm.success_callback = ["langfuse", "prometheus", "datadog"]
litellm.failure_callback = ["langfuse", "sentry"]

# Or custom callbacks
class MyCallback(litellm.Callback):
    def log_success_event(self, kwargs, response_obj, start_time, end_time):
        print(f"Cost: {kwargs.get('response_cost')}")

litellm.callbacks = [MyCallback()]
```

### Proxy Authentication & Budget

```python
# Proxy manages virtual keys with budgets
# POST /key/generate
{
    "models": ["gpt-4", "claude-sonnet"],
    "max_budget": 100.0,        # USD
    "budget_duration": "monthly",
    "team_id": "team-marketing",
    "metadata": {"user": "john@company.com"}
}
```

Spend tracking architecture:
- Redis-first reads for cross-pod consistency
- Dual cache (in-memory + Redis) for performance
- Cold-start seeding from PostgreSQL
- Per-key, per-team, per-user, per-organization tracking
- Window-based budget enforcement

## What We Can Reuse

### For Our AI Agency System

1. **Model Routing Pattern** - The `get_llm_provider()` + provider dispatch pattern is directly reusable for building our own multi-model gateway. Use "Sonnet for routine, Opus for complex" routing.

2. **Cost Tracking** - `cost_per_token()` and `completion_cost()` pattern with the global `model_cost` dictionary. Essential for client billing in agency work. Supports custom margins/discounts.

3. **Caching Strategy** - Semantic caching with similarity threshold is exactly what we need for 70%+ gross margin target. Similar queries hit cache instead of API.

4. **Router + Fallbacks** - Production-grade pattern for reliability. Cooldown + health checks + fallback chains.

5. **Proxy as Gateway** - Deploy LiteLLM proxy as our central AI gateway. All client projects route through it. Get spend tracking, rate limiting, and key management for free.

6. **Budget Enforcement** - Virtual keys with per-client budgets. Perfect for agency billing model.

### Direct Integration Options

```python
# Option 1: Use LiteLLM as our routing layer in LangGraph
from litellm import Router

router = Router(
    model_list=[
        {"model_name": "fast", "litellm_params": {"model": "anthropic/claude-sonnet-4-20250514"}},
        {"model_name": "smart", "litellm_params": {"model": "anthropic/claude-opus-4-20250514"}},
    ],
    routing_strategy="cost-based-routing",
)

# Option 2: Deploy proxy, point all services at it
# All LangGraph agents, CrewAI agents, custom tools -> http://litellm:4000

# Option 3: Use cost calculator standalone
from litellm import completion_cost
# Track costs across all client projects for billing
```

### PostgreSQL + pgvector Alignment

LiteLLM uses PostgreSQL (Prisma ORM) for spend tracking - aligns with our PostgreSQL + pgvector decision. Can share the same database infrastructure.

## Lessons & Best Practices

### Architecture Lessons

1. **Unified Interface Pattern** - Abstracting 100+ providers behind one interface is powerful. The model string convention (`provider/model-name`) is elegant and widely adopted.

2. **Dual Cache is Essential** - In-memory for speed + Redis for distributed consistency. Never rely on just one layer in production.

3. **Cooldown > Circuit Breaker** - LiteLLM's cooldown pattern (track failures in window, disable for N seconds) is simpler and more practical than full circuit breaker for LLM APIs.

4. **Cost-Aware Routing** - `cost-based-routing` strategy automatically picks cheapest provider. Combined with semantic caching, this is how you hit 70%+ margins.

5. **Exception Standardization** - Every provider throws different errors. Mapping them all to standard types (`exception_type()`) is critical for reliable fallback logic.

6. **Pre-validation** - `validate_and_fix_openai_messages()` pattern - fix common issues before sending to provider. Reduces errors and retries.

### Production Patterns

7. **Async Wrapping** - LiteLLM wraps sync provider SDKs in `loop.run_in_executor()` for async contexts. Practical pattern when provider SDKs don't support async natively.

8. **Config Stacking** - Global defaults < provider config < per-request params. Three levels of override for flexibility.

9. **Drop Params** - `drop_params=True` silently removes parameters unsupported by target provider. Essential for cross-provider compatibility.

10. **Model Cost Map** - Maintaining a global dictionary of per-model pricing that auto-updates. Critical for accurate billing.

### Operational Lessons

11. **Health Checks with Staleness** - `DeploymentHealthCache` with staleness threshold prevents routing to endpoints that haven't been checked recently.

12. **Tag-Based Routing** - Assign models to teams/projects via tags. Enables multi-tenant setups where different clients get different model access.

13. **Guardrail Modes** - `pre_call`, `during_call`, `post_call` execution modes for content safety. Layer them for defense in depth.

14. **Prometheus + Custom Labels** - Built-in Prometheus metrics with custom label support. Essential for per-client cost dashboards in agency model.

### Key Numbers

- 100+ LLM providers supported
- 8ms P95 latency at 1K RPS (proxy)
- 40+ observability callback integrations
- Default cooldown: 60 seconds
- Default client TTL: 3600 seconds (1 hour)
- Default soft budget: $50 USD per key
- Default max fallbacks: 5
- Batch pricing: 50% discount applied automatically
