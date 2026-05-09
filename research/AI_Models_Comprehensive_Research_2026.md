# Comprehensive AI Models Research Guide (May 2026)

---

## TABLE OF CONTENTS
1. [Commercial LLM Models for Chatbot](#1-commercial-llm-models-for-chatbot)
2. [Open-Source LLM Models for Chatbot](#2-open-source-llm-models-for-chatbot)
3. [Embedding Models for RAG/Search](#3-embedding-models-for-ragsearch)
4. [Reranking Models](#4-reranking-models)
5. [Code Generation Models](#5-code-generation-models)
6. [Data Analysis & Reasoning Models](#6-data-analysis--reasoning-models)
7. [Vector Databases](#7-vector-databases-storage-for-ai)
8. [AI Model Routers & Gateways](#8-ai-model-routers--gateways)
9. [Specialized Analysis Models](#9-specialized-analysis-models)

---

## 1. COMMERCIAL LLM MODELS FOR CHATBOT

### OpenAI Models

| Model | Input $/1M | Output $/1M | Context Window | Speed | Best For |
|-------|-----------|-------------|----------------|-------|----------|
| GPT-5.5 | $5.00 | $30.00 | 1M (922K in / 128K out) | Moderate | Most capable; complex multi-step tasks, agentic workflows |
| GPT-5.5-pro | $30.00 | $180.00 | 1M | Slow | Hardest problems requiring maximum intelligence |
| GPT-5.4 | $2.50 | $10.00 | 400K | Fast | Production frontier model, balanced cost/quality |
| GPT-5.4 mini | $0.75 | $4.50 | 400K | Very Fast (62 tok/s) | High-volume production, great quality/cost ratio |
| GPT-5 (legacy) | $1.25 | $10.00 | 128K | Fast | Previous gen, still capable |
| GPT-5-mini (legacy) | $0.25 | $2.00 | 128K | Very Fast | Budget workloads |
| GPT-4o (legacy) | $2.50 | $10.00 | 128K | Fast | Legacy, being superseded |

**Strengths:** Broadest ecosystem, excellent tool use, strong agentic capabilities, widest third-party integration.
**Weaknesses:** Premium pricing at flagship tier; reasoning tokens on o-series inflate bills 3-10x; >272K input on GPT-5.5 charges 2x input / 1.5x output.
**Batch API:** 50% discount on all models for async workloads.

---

### Anthropic Claude Models

| Model | Input $/1M | Output $/1M | Context Window | Speed | Best For |
|-------|-----------|-------------|----------------|-------|----------|
| Claude Opus 4.7 | $5.00 | $25.00 | 1M | Moderate | Hardest reasoning, research, complex analysis |
| Claude Opus 4.6 | $5.00 | $25.00 | 1M | Moderate | Deep coding, long-context tasks |
| Claude Sonnet 4.6 | $3.00 | $15.00 | 1M | Fast | Default production model, best balance |
| Claude Haiku 4.5 | $1.00 | $5.00 | 200K | Very Fast | High-volume, cost-sensitive tasks |

**Strengths:** 1M context at flat rate (no surcharge), best-in-class coding (SWE-bench leader), excellent instruction following, strong extended thinking mode.
**Weaknesses:** Smaller ecosystem than OpenAI; no built-in web search; higher output pricing than competitors.
**Cost Savings:** Prompt caching = 90% off cached input ($0.50/M for Opus). Batch processing = 50% off all tokens.

---

### Google Gemini Models

| Model | Input $/1M | Output $/1M | Context Window | Speed | Best For |
|-------|-----------|-------------|----------------|-------|----------|
| Gemini 2.5 Pro | $1.25 (<=200K) / $2.50 (>200K) | $10.00 / $15.00 | 1M | Fast | Cost-effective frontier, multimodal |
| Gemini 2.5 Flash | $0.30 | $2.50 | 1M | Very Fast | High-throughput production |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | 1M | Fastest | Ultra-budget, simple tasks |

**Strengths:** Best price-to-performance ratio at Pro tier; native multimodal (text, image, audio, video); generous free tier; 1M context on all tiers.
**Weaknesses:** Slightly below Claude/GPT on hardest reasoning tasks; less mature developer ecosystem for agents.

---

### Mistral Models

| Model | Input $/1M | Output $/1M | Context Window | Best For |
|-------|-----------|-------------|----------------|----------|
| Mistral Large 3 | $0.50 | $1.50 | 128K | European data sovereignty, multilingual |
| Mistral Small 3.1 | $0.10 | $0.30 | 128K | Lightweight tasks, edge deployment |
| Codestral | $0.30 | $0.90 | 256K | Code completion, IDE integration |

**Strengths:** Cheapest frontier-class output ($1.50/M for Large); strong EU compliance story; excellent code model.
**Weaknesses:** Smaller model ecosystem; lower benchmark scores than top-tier competitors.

---

### xAI Grok Models

| Model | Input $/1M | Output $/1M | Context Window | Best For |
|-------|-----------|-------------|----------------|----------|
| Grok 4 | $3.00 | $15.00 | 256K | Reasoning, real-time X/Twitter data |
| Grok 4.1 Fast | $0.20 | $0.50 | 2M (largest available) | Budget tasks, huge context needs |
| Grok 3 (legacy) | $3.00 | $15.00 | 131K | Previous gen |

**Strengths:** 2M context window (largest of any frontier model); integrated web search and X data; competitive pricing on Fast tier.
**Weaknesses:** Smaller developer community; additional charges for server-side tools ($5/1K calls for web search).

---

### Cohere Command Models

| Model | Input $/1M | Output $/1M | Context Window | Best For |
|-------|-----------|-------------|----------------|----------|
| Command R+ (08-2024) | $2.50 | $10.00 | 128K | RAG-optimized generation |
| Command R | $0.15 | $0.60 | 128K | Lightweight RAG tasks |

**Strengths:** Purpose-built for RAG with inline citations; strong needle-in-a-haystack recall at 100K+ tokens; integrated Embed + Rerank + Command stack.
**Weaknesses:** Not a generalist model; lower benchmark scores on non-RAG tasks; smaller community.

---

### MASTER COMPARISON TABLE - Commercial LLMs

| Model | Input $/1M | Output $/1M | Context | Quality Tier | Speed |
|-------|-----------|-------------|---------|-------------|-------|
| GPT-5.5 | $5.00 | $30.00 | 1M | Elite | Moderate |
| Claude Opus 4.7 | $5.00 | $25.00 | 1M | Elite | Moderate |
| Gemini 2.5 Pro | $1.25 | $10.00 | 1M | Frontier | Fast |
| GPT-5.4 | $2.50 | $10.00 | 400K | Frontier | Fast |
| Claude Sonnet 4.6 | $3.00 | $15.00 | 1M | Frontier | Fast |
| Grok 4 | $3.00 | $15.00 | 256K | Frontier | Fast |
| Mistral Large 3 | $0.50 | $1.50 | 128K | Strong | Fast |
| GPT-5.4 mini | $0.75 | $4.50 | 400K | Strong | Very Fast |
| Claude Haiku 4.5 | $1.00 | $5.00 | 200K | Good | Very Fast |
| Gemini 2.5 Flash | $0.30 | $2.50 | 1M | Good | Very Fast |
| DeepSeek V4 Flash (API) | $0.14 | $0.28 | 1M | Good | Fast |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | 1M | Basic | Fastest |

**Recommendation by Use Case:**
- **Highest quality, cost no object:** GPT-5.5 or Claude Opus 4.7
- **Best value frontier model:** Gemini 2.5 Pro ($1.25 input)
- **High-volume production:** GPT-5.4 mini or Gemini 2.5 Flash
- **Ultra-budget:** DeepSeek V4 Flash API or Gemini Flash-Lite
- **RAG-specific:** Cohere Command R+
- **Maximum context:** Grok 4.1 Fast (2M tokens)

---

## 2. OPEN-SOURCE LLM MODELS FOR CHATBOT

### Meta Llama 4

| Variant | Total Params | Active Params | Architecture | Context | License |
|---------|-------------|--------------|--------------|---------|---------|
| Llama 4 Scout | ~109B | ~17B | MoE (16 experts) | 10M tokens | Meta Custom (700M MAU) |
| Llama 4 Maverick | ~400B | ~17B | MoE (128 experts) | 1M tokens | Meta Custom (700M MAU) |

**Strengths:** Largest context window of any open model (Scout: 10M); strong general knowledge (MMLU-Pro 80.5% beats GPT-4o); massive community and tooling support.
**Weaknesses:** Meta custom license with 700M MAU clause (not truly open); fallen behind Chinese labs on coding; requires significant hardware for full precision.
**VRAM:** Maverick Q4: ~110GB (2x A100 80GB); Scout Q4: ~60GB (1x A100 80GB).
**Best For:** General-purpose chatbot, long-context document processing, enterprises within MAU threshold.

---

### DeepSeek V4

| Variant | Total Params | Active Params | Architecture | Context | License |
|---------|-------------|--------------|--------------|---------|---------|
| DeepSeek V4 Pro | 1.6T | 49B | MoE | 1M | MIT |
| DeepSeek V4 Flash | 284B | 13B | MoE | 1M | MIT |

**API Pricing (discounted through May 31, 2026):**
- V4 Flash: $0.14/M input, $0.28/M output
- V4 Pro: $0.435/M input (cache miss), $0.87/M output (75% discount; list: $1.74/$3.48)

**Strengths:** Best open-source coder (80.6% SWE-bench Verified); MIT license (truly open); extremely competitive API pricing; 1M context; 384K max output.
**Weaknesses:** Geopolitical concerns (Chinese origin); less tooling ecosystem than Llama; requires massive hardware for self-hosting Pro.
**VRAM:** V4 Pro Q4: ~400GB+ (multi-node); V4 Flash Q4: ~80GB (1x A100 80GB).
**Best For:** Coding tasks, budget-conscious deployments, enterprises needing MIT license.

---

### Alibaba Qwen 3.5 / 3.6

| Variant | Total Params | Active Params | Context | License |
|---------|-------------|--------------|---------|---------|
| Qwen 3.5-0.8B | 0.8B | 0.8B (dense) | 256K | Apache 2.0 |
| Qwen 3.5-2B | 2B | 2B (dense) | 256K | Apache 2.0 |
| Qwen 3.5-9B | 9B | 9B (dense) | 256K | Apache 2.0 |
| Qwen 3.5-27B | 27B | 27B (dense) | 256K | Apache 2.0 |
| Qwen 3.5-122B-A10B | 122B | 10B | 256K | Apache 2.0 |
| Qwen 3.5-397B-A17B | 397B | 17B | 256K-1M | Apache 2.0 |
| Qwen 3.6-35B-A3B | 35B | 3B | 256K | Apache 2.0 |

**Strengths:** Best multilingual support (201 languages); strongest open scientific reasoner (beats most closed models on GPQA Diamond); full Apache 2.0 license; widest size range from 0.8B to 397B; thinking + non-thinking modes.
**Weaknesses:** Less mature English-specific tooling than Llama; fewer deployment guides in English.
**VRAM:** 9B Q4: ~5.5GB; 27B Q4: ~15GB (runs on 16GB MacBook); 397B-A17B: multi-GPU setup.
**Best For:** Multilingual chatbots, scientific reasoning, on-device deployment (smaller sizes).

---

### Google Gemma 4

| Variant | Params | Architecture | Context | License |
|---------|--------|-------------|---------|---------|
| Gemma 4 5B | ~5B | Dense | 256K | Apache 2.0 |
| Gemma 4 8B | ~8B | Dense | 256K | Apache 2.0 |
| Gemma 4 26B (MoE) | 26B total / 4B active | MoE | 256K | Apache 2.0 |
| Gemma 4 31B | ~31B | Dense | 256K | Apache 2.0 |

**Strengths:** Excellent math (AIME 2026: 89.2%); Apache 2.0 license; practical for local/on-device deployment; strong science (GPQA Diamond: 84.3%).
**Weaknesses:** Slightly behind Qwen 3.5 and DeepSeek V4 on coding; no 70B+ tier available.
**Best For:** On-device AI, mobile deployment, math/science-focused chatbots.

---

### Mistral Medium 3.5

| Params | Active | Architecture | Context | License |
|--------|--------|-------------|---------|---------|
| ~675B total | ~41B active | MoE | 128K | Apache 2.0 |

**Strengths:** Strong EU compliance story; competitive with Llama 4 Maverick; excellent multilingual for European languages.
**Weaknesses:** Released April 29, 2026 -- still maturing; fewer community resources.

---

### Other Notable Open-Source Models

| Model | Params | Specialty | License | Notes |
|-------|--------|-----------|---------|-------|
| Phi-4 | 14B | Reasoning/Math | MIT | Beats 70B+ models on math reasoning |
| GLM-5.1 | 744B/40B MoE | Agentic Coding | MIT | #1 SWE-Bench Pro (58.4); 200K context |
| Hermes 3 | Various (fine-tune) | Function Calling | Apache 2.0 | Best for structured tool use on local models |

---

### WHEN TO USE WHICH OPEN-SOURCE MODEL

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| General chatbot | Qwen 3.5-9B or Llama 4 Scout | Best quality at manageable size |
| Coding assistant | DeepSeek V4 Pro/Flash | Best SWE-bench scores, MIT license |
| Multilingual | Qwen 3.5 (any size) | 201 languages, Apache 2.0 |
| On-device / mobile | Gemma 4 5B or Qwen 3.5-2B | Small, efficient, Apache 2.0 |
| Scientific reasoning | Qwen 3.5-397B or Gemma 4 31B | Top GPQA scores |
| Function calling / agents | GLM-5.1 or Hermes 3 | Purpose-built for tool use |
| Long document processing | Llama 4 Scout | 10M token context |
| EU data sovereignty | Mistral Medium 3.5 | French company, EU hosted |
| Budget (minimal hardware) | Phi-4 14B or Gemma 4 8B | Strong quality on single consumer GPU |

---

## 3. EMBEDDING MODELS FOR RAG/SEARCH

### Commercial Embedding Models

| Model | Price/1M Tokens | Dimensions | Max Context | MTEB Score | Languages | Special Features |
|-------|----------------|-----------|-------------|-----------|-----------|-----------------|
| OpenAI text-embedding-3-small | $0.02 | 1,536 | 8,192 | ~62.3 | Multi | Matryoshka (256-1536) |
| OpenAI text-embedding-3-large | $0.13 | 3,072 | 8,192 | ~64.6 | Multi | Matryoshka (256-3072) |
| Voyage AI voyage-4-lite | $0.02 | 1,024 | 32K | ~63 | Multi | Budget leader |
| Voyage AI voyage-4 | $0.06 | 1,024 | 32K | ~66 | Multi | Best value commercial |
| Voyage AI voyage-4-large | $0.12 | 2,048 | 32K | ~68 | Multi | Quality leader for retrieval |
| Voyage AI voyage-3-large | $0.18 | 2,048 | 32K | ~68 | Multi | Previous gen, still strong |
| Cohere embed-v4 | $0.12 (text) / $0.47 (image) | 1,536 | 128K | ~65.2 | 100+ | Multimodal, longest context |
| Google Gemini Embedding 2 | $0.20 | 3,072 | 8,192 | ~64 | Multi | Natively multimodal (text, image, audio, video) |
| Google text embedding | $0.15 | 768 | 8,192 | ~62 | Multi | Text-only, cheaper |
| Jina embeddings-v3 | $0.02 | 1,024 | 8,192 | ~65.5 | 89 | Task-specific LoRA adapters, late chunking |

### Open-Source Embedding Models

| Model | Params | Dimensions | Max Context | MTEB Score | Languages | Features |
|-------|--------|-----------|-------------|-----------|-----------|----------|
| NV-Embed-v2 | ~7B | 1,024 | 32K | ~69.1 (top MTEB) | Multi | GPU-optimized, NVIDIA hardware |
| BGE-M3 | ~568M | 1,024 | 8,192 | ~66.1 | 100+ | Dense + sparse + multi-vector hybrid |
| Nomic Embed Text v2 | ~137M | 768 | 8,192 | ~64.5 | ~100 | MoE architecture, dense + sparse |
| Stella (various) | Various | Various | Various | ~67 | Multi | Strong on clustering |
| Jina embeddings-v3 (self-host) | 570M | 1,024 | 8,192 | ~65.5 | 89 | Also available as open-source |

### EMBEDDING MODEL RECOMMENDATIONS

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Safe default, quick start | OpenAI text-embedding-3-small ($0.02) | Widest integration, good enough for 90% of apps |
| Maximum retrieval quality (API) | Voyage AI voyage-4-large ($0.12) | Top retrieval MTEB scores |
| Maximum quality (self-hosted) | NV-Embed-v2 | Top overall MTEB; needs NVIDIA GPU |
| Long documents (API) | Cohere embed-v4 (128K context) | Only API model handling full contracts/papers |
| Budget with long docs | Jina embeddings-v3 ($0.02, 8K context) | Best value with late chunking |
| Multilingual (self-hosted) | BGE-M3 | 100+ languages, hybrid retrieval built-in |
| Multimodal (images + text) | Cohere embed-v4 or Gemini Embedding 2 | Native image/text in same vector space |
| On-device / Ollama | Nomic Embed Text v2 | Lightweight, runs on CPU, Ollama-native |
| Hybrid search (dense + sparse) | BGE-M3 (self-hosted) or Nomic v2 | Single model outputs both dense and sparse vectors |

---

## 4. RERANKING MODELS

### Commercial Rerankers

| Model | Pricing | Latency | Quality (ELO) | Languages | Features |
|-------|---------|---------|---------------|-----------|----------|
| Cohere Rerank 3.5 | $2.00/1K searches | ~600ms | 1629 | 100+ | Up to 100 docs per search; multilingual leader |
| Voyage Rerank 2.5 | ~$0.05/1K queries | ~595ms | ~1610 | Multi | Best speed/quality balance; instruction-following |
| Zerank 2 | Contact sales | ~700ms | 1638 (top) | Multi | Highest accuracy |

### Open-Source Rerankers

| Model | Params | Quality | Latency | Languages | Notes |
|-------|--------|---------|---------|-----------|-------|
| mxbai-rerank-large-v2 | 1.5B | SOTA open-source | Moderate | Multi | Based on Qwen; long context; code/JSON support |
| mxbai-rerank-base-v2 | 0.5B | Very good | Fast | Multi | Lighter version |
| BGE-reranker-v2-m3 | ~568M | Good | Fast | 100+ | Multilingual, self-hosted, full control |
| Jina Reranker v2 | ~137M | Good | Fast | Multi | Lightweight, open-source |
| FlashRank | ~4MB | Moderate | Ultra-fast | English | Zero torch dependency; CPU-only; ~4MB total |

### RERANKING RECOMMENDATIONS

| Use Case | Recommended | Why |
|----------|-------------|-----|
| Production RAG (managed) | Cohere Rerank 3.5 | Best multilingual, 100+ languages |
| Speed-critical production | Voyage Rerank 2.5 | Lowest latency with high quality |
| Self-hosted, maximum quality | mxbai-rerank-large-v2 | Open-source SOTA |
| Self-hosted, lightweight | FlashRank | 4MB, CPU, zero dependencies |
| Multilingual self-hosted | BGE-reranker-v2-m3 | 100+ languages, free |
| Budget / prototyping | FlashRank or BGE-reranker-v2-m3 | Free, easy to deploy |

---

## 5. CODE GENERATION MODELS

### SWE-Bench Verified Scores (May 2026)

| Model | SWE-Bench Verified | SWE-Bench Pro | Type | Pricing (Input/Output per 1M) |
|-------|-------------------|---------------|------|-------------------------------|
| Claude Opus 4.7 | 87.6% | ~55% | Commercial | $5.00 / $25.00 |
| DeepSeek V4 Pro | 80.6% | ~50% | Open Source (MIT) | $0.435 / $0.87 (discounted) |
| Claude Opus 4.6 | 80.9% | ~52% | Commercial | $5.00 / $25.00 |
| GPT-5.4 | ~77% | ~48% | Commercial | $2.50 / $10.00 |
| GPT-5.3 Codex | ~75% | 77.3 (Pro) | Commercial | Codex API pricing |
| GLM-5.1 | 77.8% | 58.4% (SOTA) | Open Source (MIT) | Self-hosted |
| Gemini 2.5 Pro | ~73% | ~45% | Commercial | $1.25 / $10.00 |
| Qwen3-Coder (480B MoE) | ~72% | ~44% | Open Source (Apache 2.0) | Self-hosted |
| Claude Sonnet 4.6 | ~70% | ~42% | Commercial | $3.00 / $15.00 |
| Codestral | 86.6% (HumanEval) | N/A | Commercial | $0.30 / $0.90 |

### Open-Source Code Models

| Model | Params | HumanEval | Specialty | License | Context |
|-------|--------|-----------|-----------|---------|---------|
| DeepSeek V4 Pro | 1.6T/49B MoE | ~88% | Full-stack coding | MIT | 1M |
| GLM-5.1 | 744B/40B MoE | ~85% | Agentic coding (SWE-Bench Pro #1) | MIT | 200K |
| Qwen3-Coder | 480B MoE | 88.4% | Comprehensive coding | Apache 2.0 | 256K |
| Codestral (Mistral) | 22B | 86.6% | Code completion, IDE | Commercial | 256K |
| StarCoder 2 | 15B | ~70% | Budget code assistance | BigCode OpenRAIL-M | 16K |

### CODE MODEL RECOMMENDATIONS

| Use Case | Recommended | Why |
|----------|-------------|-----|
| Best coding quality (commercial) | Claude Opus 4.7 | Highest SWE-bench Verified |
| Best coding quality (open source) | DeepSeek V4 Pro | 80.6% SWE-bench, MIT license |
| Agentic coding workflows | GLM-5.1 | #1 SWE-Bench Pro |
| IDE code completion | Codestral | Best fill-in-the-middle, fast, 256K context |
| Budget coding API | Gemini 2.5 Pro | Strong coding at $1.25/M input |
| Self-hosted, consumer GPU | Qwen 3.5-9B (Coder variant) | Fits on 8GB VRAM |
| Data governance constraints | StarCoder 2 | Strict open-data training provenance |

---

## 6. DATA ANALYSIS & REASONING MODELS

### Reasoning Model Comparison

| Model | Input $/1M | Output $/1M | Architecture | Math | Science | Notes |
|-------|-----------|-------------|-------------|------|---------|-------|
| OpenAI o3 | $2.00 | $8.00 | Chain-of-thought | Excellent | Excellent | Hidden reasoning tokens billed as output (3-10x actual cost) |
| OpenAI o4-mini | $1.10 | $4.40 | Chain-of-thought | Very Good | Very Good | Same price as o3-mini, faster (62 tok/s) |
| Claude Opus (extended thinking) | $5.00 | $25.00 | Hybrid reasoning | Excellent (91.7% on 100-step proofs) | Excellent | 2.3% hallucination rate; flat pricing |
| Claude Sonnet (extended thinking) | $3.00 | $15.00 | Hybrid reasoning | Very Good | Very Good | Best value reasoning model |
| DeepSeek R1 | $0.14 | $0.55 | Reinforcement learning CoT | Good | Good | 671B/37B MoE; MIT license; cheapest by far |
| Gemini 2.5 Pro (thinking) | $1.25 | $10.00 | Built-in thinking mode | Very Good | Very Good | No extra charge for thinking tokens |
| Qwen 3.5 (thinking mode) | Free (self-host) | Free (self-host) | Thinking + non-thinking toggle | Very Good | Excellent (GPQA leader) | Apache 2.0 |

### TRUE COST COMPARISON FOR ANALYSIS TASKS

**Key insight:** OpenAI o3/o4-mini charge reasoning tokens as output. A typical analysis task might use 5-20x more reasoning tokens than visible output.

Example: Analyzing a 10-page financial report:
| Model | Listed Cost | Actual Cost (with reasoning) | Quality |
|-------|------------|------------------------------|---------|
| o3 | ~$0.08 | ~$0.40-$0.80 | Excellent |
| o4-mini | ~$0.04 | ~$0.20-$0.44 | Very Good |
| Claude Opus (extended) | ~$0.15 | ~$0.15 (flat pricing) | Excellent |
| Claude Sonnet (extended) | ~$0.09 | ~$0.09 (flat pricing) | Very Good |
| DeepSeek R1 | ~$0.01 | ~$0.03-$0.05 | Good |
| Gemini 2.5 Pro (thinking) | ~$0.05 | ~$0.05 (included) | Very Good |

### WHEN TO USE REASONING vs. STANDARD MODELS

| Task Type | Use Reasoning? | Recommended |
|-----------|---------------|-------------|
| Simple Q&A, summarization | No | Standard model (GPT-5.4 mini, Haiku) |
| Multi-step math | Yes | o3 or Claude Opus extended |
| Complex data analysis | Yes | Claude Sonnet extended or Gemini thinking |
| Financial modeling | Yes | o3 or Claude Opus extended |
| Scientific research | Yes | Qwen 3.5 thinking (free) or Claude Opus |
| Code debugging | Maybe | Claude Sonnet extended (best value) |
| Legal analysis | Yes | Claude Opus extended (lowest hallucination) |
| Budget reasoning | Yes | DeepSeek R1 (10-50x cheaper) |

---

## 7. VECTOR DATABASES (STORAGE FOR AI)

### Managed Cloud Comparison

| Database | Pricing Model | Cost at 10M Vectors | Cost at 100M Vectors | Best Feature | Weaknesses |
|----------|--------------|---------------------|---------------------|-------------|------------|
| **Pinecone** | Usage-based (storage + queries + compute) | ~$70/mo | ~$700+/mo | Easiest to use, serverless | Costs grow fast at scale; vendor lock-in |
| **Qdrant Cloud** | Resource-based (CPU/RAM) | ~$65/mo | ~$300/mo | Fastest open-source (10-25% faster); Rust | Less mature managed offering |
| **Weaviate Cloud** | Dimension-based ($0.095/1M dims) | ~$135/mo | ~$500/mo | Best hybrid search (keyword + vector) | Higher base cost |
| **Zilliz Cloud** (Milvus) | CU-based ($0.096/CU-hr) + storage ($0.04/GB/mo) | ~$80-150/mo | ~$250-500/mo | Best at billion-scale; GPU acceleration | Complex pricing model |

### Self-Hosted / Embedded Comparison

| Database | Language | License | p99 Latency (10M) | Best Feature | Weaknesses |
|----------|---------|---------|-------------------|-------------|------------|
| **Qdrant** | Rust | Apache 2.0 | ~12ms | Fastest; excellent filtering | Needs dedicated infrastructure |
| **Milvus** | Go/C++ | Apache 2.0 | ~18ms | Billion-scale distributed | Complex to operate; higher memory |
| **Weaviate** | Go | BSD-3 | ~16ms | Hybrid search built-in | Higher resource usage than Qdrant |
| **pgvector** (PostgreSQL) | C | PostgreSQL License | ~25ms | Use existing Postgres; no new infra | Slower than dedicated; limited filtering |
| **ChromaDB** | Python | Apache 2.0 | ~20ms | Simplest API; 5-min setup | Not for billion-scale |
| **LanceDB** | Rust | Apache 2.0 | ~15ms | Embedded/serverless; columnar format | Newer, smaller community |
| **Redis Vector Search** | C | Redis Source Available | ~8ms | Ultra-low latency; in-memory | RAM-limited; expensive at scale |

### COST AT SCALE (Self-Hosted, 10M vectors)

| Solution | Monthly Cost (VPS) | Notes |
|----------|-------------------|-------|
| pgvector on RDS | ~$45/mo | Cheapest if you already run Postgres |
| ChromaDB on VPS | ~$30/mo | 4GB RAM VPS handles millions of chunks |
| LanceDB on VPS | ~$30/mo | Disk-efficient; scales better than Chroma |
| Qdrant on VPS | ~$50/mo | Needs more RAM for speed |
| Milvus on VPS | ~$60/mo | Overkill for <10M vectors |

### VECTOR DATABASE RECOMMENDATIONS

| Use Case | Recommended | Why |
|----------|-------------|-----|
| Quick prototype / MVP | ChromaDB | 5-minute setup, Pythonic API |
| Already using PostgreSQL | pgvector | No new infrastructure needed |
| Production RAG (<100M vectors) | Qdrant | Fastest, open-source, great filtering |
| Hybrid search (keyword + semantic) | Weaviate | Best built-in hybrid search |
| Billion-scale enterprise | Milvus / Zilliz | Distributed, GPU-accelerated |
| Embedded / edge / serverless | LanceDB | No server needed, columnar format |
| Ultra-low latency cache | Redis Vector Search | In-memory, sub-10ms |
| Managed, zero-ops | Pinecone | Easiest, but watch costs at scale |

---

## 8. AI MODEL ROUTERS & GATEWAYS

### Comparison Table

| Feature | OpenRouter | LiteLLM | Portkey | Helicone |
|---------|-----------|---------|---------|----------|
| **Type** | Managed marketplace | Open-source proxy | Enterprise gateway | Observability + gateway |
| **Models** | 300+ hosted | 140+ providers (proxy) | 250+ via proxy | 300+ (proxy/gateway) |
| **Self-Hosted** | No | Yes (primary mode) | Partial | Yes (open-source) |
| **Open Source** | No | Yes (Apache 2.0) | Partial | Yes |
| **Pricing** | Markup on model prices | Free (self-hosted) / $250+/mo (cloud) | Free tier (10K req/mo) / $49+/mo | Free (10K req/mo) / usage-based |
| **Key Strength** | Widest model catalog, zero setup | Full control, zero vendor lock-in | Guardrails, budgets, reliability | Best observability, cost tracking |
| **Routing** | Model selection | Load balancing, fallbacks | Smart routing, A/B testing | Request routing |
| **Observability** | Basic | Basic logging | Advanced traces + analytics | Best-in-class (sessions, traces) |
| **Caching** | Response caching | Semantic caching | Semantic caching | Semantic caching |
| **Guardrails** | None | Basic | Advanced (PII, content) | Moderate |
| **Ideal User** | Individual devs, prototyping | DevOps teams, self-hosted | Enterprise production | Teams needing cost control |

### RECOMMENDATIONS BY SPEND

| Monthly API Spend | Recommended | Why |
|-------------------|-------------|-----|
| <$2,000/mo | OpenRouter or Portkey Free | Simplest, free tiers sufficient |
| $2,000-$10,000/mo | Any of the three | OpenRouter (simple), Portkey (observability), LiteLLM (savings) |
| >$10,000/mo | LiteLLM (self-hosted) | OpenRouter markup becomes significant line item |
| Enterprise / compliance | LiteLLM or Portkey | Self-hosted options for data sovereignty |

---

## 9. SPECIALIZED ANALYSIS MODELS

### Speech-to-Text (Whisper & Alternatives)

| Model | Params | WER (Clean) | WER (Real-world) | Languages | Speed (GPU) | Best For |
|-------|--------|-------------|-------------------|-----------|-------------|----------|
| Whisper Large-v3 | 1.55B | 2.7% | 8-12% | 99+ | 1x real-time | Maximum accuracy |
| Whisper Large-v3 Turbo | 809M | 3-4% | 9-13% | 99+ | 2x real-time | Best speed/accuracy balance |
| Whisper Medium | 769M | 4-6% | 12-18% | 99+ | 4x real-time | Good balance |
| Whisper Small | 244M | 6-8% | 15-22% | 99+ | 8x real-time | Resource-constrained |
| Whisper Base | 74M | 8-12% | 20-30% | 99+ | 16x real-time | Ultra-lightweight |
| Whisper Tiny | 39M | 10-15% | 25-35% | 99+ | 32x real-time | Real-time on CPU |

**English-only variants** (.en) perform 5-15% better for English-only use, especially at smaller sizes.

**Commercial Alternatives:**
| Service | WER (Real-world) | Pricing | Latency | Best For |
|---------|-------------------|---------|---------|----------|
| AssemblyAI Universal-2 | 5-8% | $0.65/hr | Real-time | Production APIs, speaker diarization |
| OpenAI Whisper API | 8-12% | $0.006/min | Near real-time | Easy integration |
| Google Speech-to-Text v2 | 6-10% | $0.016/15sec | Real-time | Streaming, multilingual |
| Deepgram Nova-3 | 5-8% | $0.0043/min | Real-time | Lowest latency |

---

### Document AI / OCR Models

| Tool | Type | Speed (GPU) | Strengths | Weaknesses | Best For |
|------|------|-------------|-----------|------------|----------|
| **MinerU** | Open Source | 0.21 sec/page | Fastest; 84 languages; CJK leader; formulas & tables | Less polished API | CJK documents, high throughput |
| **Docling** (IBM) | Open Source | 0.49 sec/page | Structured output (DoclingDocument); production RAG; table extraction | Slower than MinerU | Enterprise RAG pipelines |
| **Marker** | Open Source | 0.86 sec/page | Broadest format support (PDF, DOCX, PPTX, EPUB, HTML); optional LLM layer | Slowest | General-purpose, multi-format |
| **Surya** | Open Source | Varies | 90+ language OCR; text detection + layout analysis | OCR only (no structuring) | Multilingual OCR component |
| **pdf-craft** | Open Source | Moderate | Book-optimized | Narrow use case | Books and long-form documents |

**Recommendation:** Marker is the safest default. MinerU for CJK or speed-critical pipelines. Docling for enterprise RAG with structured output.

---

### Sentiment Analysis Models

| Approach | Model | Accuracy | Speed | Cost | Best For |
|----------|-------|----------|-------|------|----------|
| Fine-tuned BERT | RoBERTa-sentiment | >90% | Very Fast | Free (self-hosted) | High-volume production |
| Fine-tuned BERT | DeBERTa-v3 | >91% | Fast | Free (self-hosted) | Maximum accuracy |
| LLM-based | GPT-5.4 mini / Haiku | ~88-92% | Moderate | API costs | Zero-shot, flexible |
| Specialized | Vader (rule-based) | ~75% | Instant | Free | Social media, quick analysis |

**Recommendation:** For production sentiment at scale, use fine-tuned RoBERTa or DeBERTa. For flexibility with no training, use LLM (Haiku at $1/M is cost-effective).

---

### Named Entity Recognition (NER) Models

| Model | Accuracy (F1) | Speed | Languages | Cost |
|-------|---------------|-------|-----------|------|
| spaCy (transformer-based) | ~92% | Fast | 20+ | Free |
| Flair NER | ~93% | Moderate | Multi | Free |
| GLiNER (zero-shot) | ~88% | Fast | Multi | Free |
| LLM-based (GPT/Claude) | ~90% | Slow | All | API costs |

**Recommendation:** spaCy for production speed, Flair for maximum F1, GLiNER for custom entity types without training.

---

### Translation Models

| Model/Service | Languages | Quality (European) | Quality (Low-resource) | Cost | Latency |
|---------------|-----------|--------------------|-----------------------|------|---------|
| DeepL | 33 | Best | N/A | $25/mo (API Free) / $5.49/M chars | Low |
| Google Translate | 130+ | Excellent | Good | $20/1M chars | Low |
| GPT-5.4 / Claude Sonnet | All | Excellent | Good | API token costs | Moderate |
| NLLB-200 (Meta, open source) | 200+ | Good | Best | Free (self-hosted) | Moderate |
| SeamlessM4T (Meta, open source) | 100+ | Good | Good | Free (self-hosted) | Moderate |
| Aya (Cohere, open source) | 100+ | Good | Good | Free (self-hosted) | Moderate |

**Recommendation:** DeepL for European languages. NLLB-200 for low-resource languages. LLMs for context-aware translation with tone/style control.

---

### Summarization Models

| Approach | Model | Quality | Speed | Cost |
|----------|-------|---------|-------|------|
| LLM (best quality) | Claude Sonnet 4.6 / GPT-5.4 | Excellent | Moderate | API costs |
| LLM (budget) | Gemini Flash / Haiku | Good | Fast | Low API costs |
| Specialized | BART-large-CNN | Good (news) | Fast | Free |
| Specialized | Pegasus | Good (academic) | Fast | Free |

**Recommendation:** LLMs have surpassed specialized models for summarization. Use Gemini Flash ($0.30/M) or Haiku ($1/M) for budget summarization at scale.

---

### Classification Models

| Approach | Model | Accuracy | Speed | Cost | Training Data Needed |
|----------|-------|----------|-------|------|---------------------|
| Fine-tuned BERT | DeBERTa-v3-large | >95% | Very Fast | Free | 500+ labeled examples |
| Zero-shot | GPT-5.4 mini / Haiku | ~88-92% | Moderate | API costs | None |
| Few-shot | SetFit | ~93% | Fast | Free | 8-16 examples per class |
| Embedding + classifier | text-embedding-3 + SVM | ~90% | Fast | Minimal API | 50+ examples |

**Recommendation:** SetFit for few-shot classification (minimal data). Fine-tuned DeBERTa for maximum accuracy with training data. LLM zero-shot for prototyping.

---

## SUMMARY: BEST MODEL FOR EACH TASK

| Task | Best Commercial | Best Open Source | Best Budget |
|------|----------------|-----------------|-------------|
| **Chatbot (general)** | Claude Sonnet 4.6 | Qwen 3.5-9B | Gemini Flash-Lite |
| **Chatbot (complex)** | GPT-5.5 / Claude Opus 4.7 | DeepSeek V4 Pro | DeepSeek R1 |
| **Coding** | Claude Opus 4.7 | DeepSeek V4 Pro | Codestral ($0.30/M) |
| **Embeddings** | Voyage AI voyage-4 | BGE-M3 | OpenAI small ($0.02) |
| **Reranking** | Cohere Rerank 3.5 | mxbai-rerank-large-v2 | FlashRank (4MB) |
| **Reasoning/Analysis** | Claude Opus (extended) | Qwen 3.5 thinking | DeepSeek R1 ($0.14/M) |
| **Vector Storage** | Pinecone (easy) | Qdrant (fast) | pgvector (free) |
| **RAG Pipeline** | Cohere stack | BGE-M3 + Qdrant + Qwen | pgvector + Nomic + DeepSeek |
| **Translation** | DeepL | NLLB-200 | Google Translate (free tier) |
| **Speech-to-Text** | Deepgram Nova-3 | Whisper Large-v3 | Whisper Tiny |
| **Document OCR** | N/A | MinerU (speed) / Marker (versatility) | Surya |
| **Sentiment** | N/A | RoBERTa fine-tuned | Vader |
| **Summarization** | Claude Sonnet 4.6 | Qwen 3.5-9B | Gemini Flash ($0.30/M) |
| **NER** | N/A | spaCy / Flair | GLiNER |
| **API Gateway** | Portkey (enterprise) | LiteLLM (self-hosted) | OpenRouter (free tier) |

---

*Research compiled May 2026. Prices and benchmarks change frequently. Always verify current pricing on provider websites before making production decisions.*
