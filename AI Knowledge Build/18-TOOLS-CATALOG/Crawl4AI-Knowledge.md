---
tags: [knowledge, tools, crawl4ai, scraping, web-crawling, ai]
source_repo: crawl4ai
files_read: 32
---

# Crawl4AI - Knowledge Extraction

## Overview & Architecture

Crawl4AI is an open-source, async-first web crawler purpose-built for LLM pipelines. Its tagline: "Turns the web into clean, LLM-ready Markdown for RAG, agents, and data pipelines." It is the most-starred open-source crawler on GitHub (50k+ stars).

**Current version**: v0.8.6
**Python requirement**: 3.8+
**License**: Open source, no API key required
**Install**:
```bash
pip install -U crawl4ai
crawl4ai-setup         # installs Playwright browsers
crawl4ai-doctor        # verifies installation
```

### High-Level Architecture

```
User Code
   └── AsyncWebCrawler              # Main entry point (async context manager)
         ├── BrowserConfig          # Browser setup (Playwright)
         ├── CrawlerRunConfig       # Per-crawl behavior config
         ├── AsyncPlaywrightCrawlerStrategy  # Actual Playwright crawling
         │     └── BrowserManager  # Browser pool + session management
         ├── ContentScrapingStrategy (LXMLWebScrapingStrategy)
         ├── MarkdownGenerationStrategy (DefaultMarkdownGenerator)
         ├── ExtractionStrategy    # LLM / CSS / Cosine / Regex
         ├── ChunkingStrategy      # RegexChunking / NLP / Fixed / Sliding
         ├── ContentFilterStrategy # BM25 / Pruning / LLM filter
         ├── DeepCrawlStrategy     # BFS / DFS / BestFirst
         └── BaseDispatcher        # MemoryAdaptive / Semaphore (for arun_many)
```

The crawler is entirely async (`asyncio` + `playwright.async_api`). It exposes two usage patterns:
1. **Context manager** (`async with AsyncWebCrawler() as crawler`) — recommended for scripts
2. **Explicit lifecycle** (`await crawler.start()` / `await crawler.close()`) — for long-running services

---

## Tech Stack & Dependencies

| Category | Library | Notes |
|---|---|---|
| Browser automation | `playwright >= 1.49`, `patchright >= 1.49` | Chromium/Firefox/WebKit |
| Anti-bot stealth | `playwright-stealth >= 2.0` | Optional stealth mode |
| HTML parsing | `lxml ~5.3`, `beautifulsoup4 ~4.12`, `cssselect >= 1.2` | Fast lxml is default |
| LLM calls | `unclecode-litellm == 1.81.13` | Fork replacing litellm (supply chain fix) |
| Async HTTP | `aiohttp >= 3.11`, `httpx[http2] >= 0.27` | For HTTP-only crawls and head-peeks |
| Markdown | Custom `html2text` fork (bundled) | Converts HTML -> Markdown |
| Content ranking | `rank-bm25 ~0.2`, `snowballstemmer ~2.2` | BM25 content filtering |
| Embeddings | `sentence-transformers` (HuggingFace) | For CosineStrategy |
| ML clustering | `scipy`, `sklearn` | Hierarchical clustering in CosineStrategy |
| Data validation | `pydantic >= 2.10` | Models + configs |
| Caching | `aiosqlite ~0.20` | SQLite-based async cache |
| Hashing | `xxhash ~3.4` | Fast page fingerprinting |
| Memory monitoring | `psutil >= 6.1.1` | MemoryAdaptiveDispatcher |
| PDF processing | `pypdf >= 6`, `pdf2image >= 1.17` | PDF crawler support |
| SSL | `pyOpenSSL >= 25.3` | SSL certificate extraction |
| Shape analysis | `alphashape >= 1.3`, `shapely >= 2.0` | AdaptiveCrawler coverage detection |
| NLP | `nltk >= 3.9` | Sentence tokenization for chunking |
| User agent | `fake-useragent >= 2.2` | Random UA generation |

---

## Crawling Engine (async, Playwright)

### AsyncWebCrawler — Main Entry Point

```python
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# Simple usage
async with AsyncWebCrawler() as crawler:
    result = await crawler.arun(url="https://example.com")
    print(result.markdown)  # Clean LLM-ready markdown

# Full config usage
browser_config = BrowserConfig(
    browser_type="chromium",    # chromium | firefox | webkit
    headless=True,
    browser_mode="dedicated",   # dedicated | builtin | cdp | docker
    viewport_width=1920,
    viewport_height=1080,
    proxy_config=ProxyConfig(server="http://proxy:8080", username="u", password="p"),
    enable_stealth=True,        # playwright-stealth bypass
    user_agent_mode="random",   # rotate UAs automatically
    cookies=[{"name": "session", "value": "abc", "url": "https://example.com"}],
    headers={"Accept-Language": "en-US"},
    java_script_enabled=True,
    ignore_https_errors=True,
    memory_saving_mode=True,    # for high-volume crawling (1000+ pages)
    max_pages_before_recycle=500,  # recycle browser to reclaim memory
    avoid_ads=True,             # block ad/tracker domains
)
```

### BrowserConfig — Key Parameters

- `browser_mode`: `"dedicated"` (new instance each time), `"builtin"` (shared CDP), `"cdp"` (explicit CDP URL), `"docker"` (Docker container)
- `use_managed_browser`: Connect via Chrome DevTools Protocol
- `cdp_url`: WebSocket CDP endpoint (`ws://localhost:9222/devtools/browser/`)
- `use_persistent_context`: Persistent profile with saved auth
- `user_data_dir`: Path to Chrome user profile
- `storage_state`: Pre-loaded cookies + localStorage (dict or path)
- `enable_stealth`: Use playwright-stealth (cannot combine with `builtin` mode)
- `text_mode`: Disable images for faster crawls
- `light_mode`: Disable background features for performance
- `init_scripts`: JS snippets run on every page before navigation

### Set Global Defaults (decorator pattern)

```python
# Set once, affects all new instances
BrowserConfig.set_defaults(headless=False, viewport_width=1920)
cfg = BrowserConfig()  # headless=False, viewport_width=1920
BrowserConfig.reset_defaults()  # clear overrides
```

### Hooks System

Hooks are called at specific lifecycle points for custom behavior:

```python
async def on_page_ready(page, context, **kwargs):
    await page.click("#accept-cookies")

crawler.crawler_strategy.set_hook("after_goto", on_page_ready)
```

Available hooks:
- `on_browser_created` — after browser launch
- `on_page_context_created` — after new page context created
- `on_user_agent_updated` — after UA change
- `on_execution_started` / `on_execution_ended`
- `before_goto` / `after_goto` — before/after navigation
- `before_return_html` / `before_retrieve_html`

### CrawlerRunConfig — Per-Crawl Control

```python
config = CrawlerRunConfig(
    # Caching
    cache_mode=CacheMode.BYPASS,   # ENABLED | DISABLED | READ_ONLY | WRITE_ONLY | BYPASS
    check_cache_freshness=True,     # ETag/Last-Modified validation before using cache

    # Content control
    css_selector="article.main",   # Extract specific element
    target_elements=["article", ".content"],  # Elements for Markdown + extraction
    excluded_tags=["nav", "footer", "aside"],
    excluded_selector=".ads, .cookie-banner",
    word_count_threshold=10,

    # JavaScript
    js_code="window.scrollTo(0, document.body.scrollHeight)",
    js_code_before_wait="document.querySelector('.load-more').click()",
    wait_for="css:.loaded-content",   # CSS or JS condition
    wait_until="networkidle",

    # Behavior
    scan_full_page=True,           # scroll entire page (infinite scroll)
    scroll_delay=0.2,
    process_iframes=True,
    flatten_shadow_dom=True,       # v0.8.5: Shadow DOM flattening
    remove_consent_popups=True,    # v0.8.5: Remove GDPR/cookie banners
    remove_overlay_elements=True,
    simulate_user=True,            # mouse moves + clicks anti-bot

    # Output
    screenshot=True,
    pdf=True,

    # Link handling
    exclude_external_links=True,
    exclude_social_media_links=True,
    score_links=True,              # BM25-based link quality scoring
)
```

---

## Extraction Strategies

All strategies inherit from `ExtractionStrategy` with `extract()` and `run()` methods.
Input format to each strategy: `"markdown"` (default), `"html"`, or `"fit_markdown"`.

### 1. LLMExtractionStrategy

Uses any LLM (via litellm) to extract structured data. Supports ALL providers.

```python
from crawl4ai import LLMExtractionStrategy, LLMConfig
from pydantic import BaseModel

class Article(BaseModel):
    title: str
    author: str
    date: str
    summary: str

strategy = LLMExtractionStrategy(
    llm_config=LLMConfig(
        provider="openai/gpt-4o-mini",   # or anthropic/claude-3-haiku, ollama/llama3, etc.
        api_token="sk-...",
    ),
    schema=Article.model_json_schema(),  # structured output
    extraction_type="schema",            # "block" (free-form) or "schema" (structured)
    instruction="Extract the main article details",
    chunk_token_threshold=2048,          # split long pages into chunks
    overlap_rate=0.1,                    # 10% overlap between chunks
    apply_chunking=True,
    input_format="markdown",             # what to feed to LLM
    force_json_response=True,            # force JSON output
    verbose=True,
)

# Token usage tracking built-in
strategy.show_usage()
# strategy.total_usage.total_tokens
# strategy.usages  # per-request list
```

Supported providers (format: `"provider/model"`):
- `openai/gpt-4o`, `openai/gpt-4o-mini`, `openai/o3-mini`
- `anthropic/claude-3-haiku-20240307`, `anthropic/claude-3-5-sonnet-20240620`
- `gemini/gemini-2.0-flash`, `gemini/gemini-1.5-pro`
- `groq/llama3-70b-8192` (sequential with 500ms delay to respect rate limits)
- `ollama/llama3` (no token needed)
- `deepseek/deepseek-chat`

Chunking behavior: long content is split into `chunk_token_threshold`-sized chunks (default 2048 tokens), LLM called per chunk, results merged. Groq runs sequentially; all others run in `ThreadPoolExecutor(max_workers=4)`.

### 2. JsonCssExtractionStrategy

Fast, zero-LLM structured extraction using CSS selectors. Schema-defined.

```python
from crawl4ai import JsonCssExtractionStrategy

schema = {
    "name": "Product Listings",
    "baseSelector": ".product-card",      # base element repeated on page
    "fields": [
        {"name": "title", "selector": "h2.title", "type": "text"},
        {"name": "price", "selector": ".price", "type": "text"},
        {"name": "image_url", "selector": "img", "type": "attribute", "attribute": "src"},
        {"name": "url", "selector": "a.link", "type": "attribute", "attribute": "href"},
        {
            "name": "specs",
            "selector": "ul.specs",
            "type": "nested_list",
            "fields": [
                {"name": "spec", "selector": "li", "type": "text"}
            ]
        },
        {
            "name": "full_price",            # computed field
            "type": "computed",
            "expression": "float(price.replace('$', '')) * 1.1"  # safe AST eval
        }
    ]
}

strategy = JsonCssExtractionStrategy(schema=schema)
# Returns: List[Dict] — one dict per .product-card element
```

Field types: `text`, `html`, `attribute`, `nested`, `nested_list`, `list`, `computed`

### 3. JsonXPathExtractionStrategy / JsonLxmlExtractionStrategy

Same schema as CSS version but uses XPath selectors. lxml version is fastest for large pages.

```python
schema = {
    "baseSelector": "//div[@class='product-card']",
    "fields": [
        {"name": "title", "selector": ".//h2", "type": "text"},
        {"name": "href", "selector": ".//a/@href", "type": "attribute", "attribute": "href"},
    ]
}
strategy = JsonXPathExtractionStrategy(schema=schema)
```

### 4. CosineStrategy

Semantic extraction using sentence embeddings + hierarchical clustering. No LLM needed.

```python
from crawl4ai import CosineStrategy

strategy = CosineStrategy(
    semantic_filter="product pricing features",  # pre-filter by cosine sim to query
    word_count_threshold=10,     # min words per cluster
    max_dist=0.2,                # max cophenetic distance for cluster formation
    linkage_method="ward",       # hierarchical clustering method
    top_k=3,                     # number of top topic categories
    model_name="sentence-transformers/all-MiniLM-L6-v2",  # HuggingFace model
    sim_threshold=0.3,           # cosine similarity threshold for pre-filter
)
# Returns clusters with topic tags from Reuters multilabel classifier
```

How it works:
1. Split content by delimiter or double newlines
2. Filter chunks by cosine similarity to `semantic_filter` embedding
3. Compute pairwise cosine distance matrix
4. Hierarchical clustering (scipy `linkage` + `fcluster`)
5. Filter clusters by word count
6. Assign topic tags via Reuters multilabel classifier

### 5. RegexExtractionStrategy

Extract content matching regex patterns.

---

## Chunking Strategies

Used by `LLMExtractionStrategy` to split content before LLM calls.

```python
from crawl4ai.chunking_strategy import (
    RegexChunking,          # split on regex pattern (default: double newline)
    NlpSentenceChunking,    # NLTK sentence tokenizer
    TopicSegmentationChunking,  # NLTK TextTilingTokenizer
    FixedLengthWordChunking,    # fixed N words per chunk
    SlidingWindowChunking,      # sliding window, no overlap control
    OverlappingWindowChunking,  # sliding window with explicit overlap
    IdentityChunking,           # no chunking, returns [full_text]
)

# Default in CrawlerRunConfig
chunking = RegexChunking(patterns=[r"\n\n"])  # split on double newline

# Fixed word chunks
chunking = FixedLengthWordChunking(chunk_size=100)

# Overlapping window
chunking = OverlappingWindowChunking(window_size=1000, overlap=100)
```

Use in crawl run:
```python
config = CrawlerRunConfig(
    chunking_strategy=RegexChunking(patterns=[r"\n\n", r"\n#{1,3} "]),
    extraction_strategy=LLMExtractionStrategy(...)
)
```

---

## Content Filtering Strategies

Applied before generating `fit_markdown` — removes nav/footer/sidebar/ads noise.

```python
from crawl4ai.content_filter_strategy import (
    PruningContentFilter,   # heuristic tree pruning
    BM25ContentFilter,      # BM25 relevance to user query
    LLMContentFilter,       # LLM-based filtering
)
from crawl4ai import DefaultMarkdownGenerator

# BM25 filter — keeps only content relevant to query
md_generator = DefaultMarkdownGenerator(
    content_filter=BM25ContentFilter(
        user_query="product pricing specifications",
        bm25_threshold=1.0
    )
)

config = CrawlerRunConfig(markdown_generator=md_generator)

# Access filtered output:
result.markdown.fit_markdown   # filtered markdown
result.markdown.raw_markdown   # full unfiltered markdown
result.markdown.markdown_with_citations  # with numbered citations
result.markdown.references_markdown      # reference list
```

The `BM25ContentFilter` uses `rank-bm25` with `snowballstemmer` for stemming. `PruningContentFilter` uses tag scores, word counts, and link density to prune DOM branches.

---

## Structured Output

### CrawlResult Model

```python
class CrawlResult(BaseModel):
    url: str
    html: str                    # raw HTML
    cleaned_html: str            # sanitized HTML
    success: bool
    markdown: MarkdownGenerationResult  # string-compatible object
    extracted_content: str       # JSON string from extraction strategy
    links: Dict[str, List[Dict]] # {"internal": [...], "external": [...]}
    media: Dict[str, List[Dict]] # {"images": [...], "videos": [...], "audios": [...]}
    metadata: dict               # page title, description, og tags, etc.
    screenshot: str              # base64 PNG
    pdf: bytes
    mhtml: str
    tables: List[Dict]           # extracted tables [{headers, rows, caption}]
    status_code: int
    response_headers: dict
    ssl_certificate: SSLCertificate
    network_requests: List[Dict] # intercepted network requests
    console_messages: List[Dict] # browser console output
    session_id: str
    cache_status: str            # "hit" | "hit_validated" | "miss"
    crawl_stats: Dict            # anti-bot retry/proxy stats
```

`result.markdown` is a `StringCompatibleMarkdown` — behaves as a string (returns `raw_markdown`) but also has `.fit_markdown`, `.markdown_with_citations`, `.references_markdown` properties.

### Link Model

```python
class Link(BaseModel):
    href: str
    text: str
    title: str
    base_domain: str
    intrinsic_score: float    # URL structure + text quality score
    contextual_score: float   # BM25 relevance score vs query
    total_score: float        # combined score
    head_data: dict           # metadata from link target's <head>
```

---

## Deep Crawling

### BFS (Breadth-First Search)

```python
from crawl4ai.deep_crawling import BFSDeepCrawlStrategy, FilterChain
from crawl4ai.deep_crawling.filters import URLPatternFilter, DomainFilter, ContentTypeFilter
from crawl4ai.deep_crawling.scorers import KeywordRelevanceScorer, CompositeScorer

filter_chain = FilterChain([
    URLPatternFilter(patterns=["*/docs/*", "*/api/*"]),  # include only these paths
    DomainFilter(allowed_domains=["docs.example.com"]),
    ContentTypeFilter(allowed_types=["text/html"]),
])

scorer = CompositeScorer([
    KeywordRelevanceScorer(keywords=["API", "authentication", "endpoint"], weight=1.0),
])

deep_strategy = BFSDeepCrawlStrategy(
    max_depth=3,
    max_pages=50,
    filter_chain=filter_chain,
    url_scorer=scorer,
    score_threshold=0.5,     # skip URLs below this score
    include_external=False,
    # Crash recovery:
    resume_state=saved_state,
    on_state_change=save_callback,
    should_cancel=cancel_check_fn,
)

config = CrawlerRunConfig(deep_crawl_strategy=deep_strategy, stream=True)

async with AsyncWebCrawler() as crawler:
    async for result in await crawler.arun("https://docs.example.com", config=config):
        print(result.url, result.markdown[:500])
```

### DFS and BestFirst strategies

```python
from crawl4ai.deep_crawling import DFSDeepCrawlStrategy, BestFirstCrawlingStrategy

# DFS — depth first
DFSDeepCrawlStrategy(max_depth=5, max_pages=100)

# Best-First — greedily follows highest-scored URLs first
BestFirstCrawlingStrategy(max_depth=3, url_scorer=scorer)
```

### Available Filters

- `URLPatternFilter` — glob patterns for URL paths
- `DomainFilter` — whitelist/blacklist domains
- `ContentTypeFilter` — filter by Content-Type header
- `SEOFilter` — filter by page SEO signals
- `ContentRelevanceFilter` — filter by content relevance to query

### Available Scorers

- `KeywordRelevanceScorer` — keyword presence in URL
- `URLScorer` — base URL quality score
- `DomainAuthorityScorer` — domain-level authority
- `FreshnessScorer` — URL date signals (year in URL path)
- `PathDepthScorer` — prefer shallower/deeper paths
- `CompositeScorer` — weighted combination of multiple scorers

The `FilterChain.apply()` is async and runs filters concurrently. Deep crawl supports **crash recovery** via `resume_state` dict + `on_state_change` async callback — save state to disk, resume on restart.

---

## Caching System

```python
from crawl4ai import CacheMode

# Modes
CacheMode.ENABLED     # read + write (default behavior)
CacheMode.DISABLED    # no caching
CacheMode.READ_ONLY   # use cache but never write
CacheMode.WRITE_ONLY  # always crawl but store result
CacheMode.BYPASS      # skip cache this call only (default in CrawlerRunConfig)

# Smart cache validation — checks ETag/Last-Modified before using cached result
config = CrawlerRunConfig(
    cache_mode=CacheMode.ENABLED,
    check_cache_freshness=True,       # HTTP head check before using cache
    cache_validation_timeout=10.0,
)
# result.cache_status: "hit" | "hit_validated" | "hit_fallback" | "miss"
```

Cache is stored in SQLite (`aiosqlite`) at `~/.crawl4ai/cache/`.

---

## Dispatchers (Concurrent Crawling)

### MemoryAdaptiveDispatcher — for `arun_many()`

Automatically throttles concurrency based on system memory.

```python
from crawl4ai import MemoryAdaptiveDispatcher, RateLimiter

dispatcher = MemoryAdaptiveDispatcher(
    memory_threshold_percent=85.0,   # start throttling at 85% RAM
    critical_threshold_percent=95.0, # emergency stop at 95%
    recovery_threshold_percent=80.0, # resume at 80%
    max_session_permit=20,           # max concurrent crawls
    rate_limiter=RateLimiter(
        base_delay=(1.0, 3.0),   # random delay range between requests
        max_delay=60.0,
        max_retries=3,
        rate_limit_codes=[429, 503],  # codes triggering exponential backoff
    ),
)

urls = ["https://example.com/page1", "https://example.com/page2", ...]

async with AsyncWebCrawler(config=browser_config) as crawler:
    results = await crawler.arun_many(
        urls=urls,
        config=run_config,
        dispatcher=dispatcher,
    )
    # or stream results:
    config = CrawlerRunConfig(stream=True)
    async for result in await crawler.arun_many(urls=urls, config=config):
        process(result)
```

Rate limiter uses per-domain state with exponential backoff: on 429/503, doubles delay (capped at `max_delay`). On success, gradually reduces delay (`* 0.75`).

### SemaphoreDispatcher — simple concurrency limit

```python
from crawl4ai import SemaphoreDispatcher
dispatcher = SemaphoreDispatcher(semaphore_count=10)
```

---

## Anti-Bot Detection (v0.8.5)

3-tier detection system in `antibot_detector.py`:

**Tier 1** — High-confidence structural markers (always trigger):
- Akamai `Reference #` patterns
- Cloudflare challenge form / error spans / JS challenge
- PerimeterX `window._pxAppId`
- DataDome `captcha-delivery.com`
- Imperva `_Incapsula_Resource`
- Kasada `KPSDK.scriptStart`

**Tier 2** — Medium confidence (only on short pages < 10KB):
- "Access Denied", "Checking your browser"

**Tier 3** — Structural integrity check (empty shell / silent block)

When blocked, the crawler escalates through proxy tiers automatically (if configured).

Anti-bot options in `BrowserConfig`:
- `enable_stealth=True` — playwright-stealth
- `user_agent_mode="random"` — rotate user agents
- `simulate_user=True` (CrawlerRunConfig) — mouse simulation
- `override_navigator=True` — spoof navigator properties
- `flatten_shadow_dom=True` — handle Shadow DOM anti-bot tricks

---

## Special Input Types

```python
# Standard URL
result = await crawler.arun("https://example.com")

# Raw HTML — prefix with "raw:"
result = await crawler.arun("raw:<html><body>Hello World</body></html>")

# Local file
result = await crawler.arun("file:///path/to/local.html")

# PDF crawling
from crawl4ai.processors.pdf import PDFContentScrapingStrategy
config = CrawlerRunConfig(scraping_strategy=PDFContentScrapingStrategy())
result = await crawler.arun("https://example.com/document.pdf")

# Virtual scroll (Twitter/Instagram-style feeds)
from crawl4ai import VirtualScrollConfig
config = CrawlerRunConfig(
    virtual_scroll_config=VirtualScrollConfig(
        container_selector=".feed-container",
        scroll_count=20,
        scroll_by="container_height",
        wait_after_scroll=0.5,
    )
)
```

---

## Configuration & Setup

### Environment Variables

```bash
CRAWL4_AI_BASE_DIRECTORY=~/.crawl4ai   # cache + logs location
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...
DEEPSEEK_API_KEY=...
PROXIES=http://user:pass@ip:port,http://ip2:port2  # comma-separated list
```

### pyproject.toml / setup.py

Key install extras:
- `pip install crawl4ai` — base (no ML models)
- `pip install crawl4ai[all]` — includes torch + sentence-transformers for CosineStrategy
- `pip install crawl4ai[torch]` — just PyTorch
- `pip install crawl4ai[transformer]` — HuggingFace models

### Serialization (API-safe)

Configs and strategies serialize/deserialize cleanly for API transport:

```python
# Serialize
config_dict = browser_config.dump()        # -> dict (type + params structure)
config = BrowserConfig.load(config_dict)   # -> BrowserConfig

# Allowlisted types only (security: prevents arbitrary class instantiation)
# Includes: BrowserConfig, CrawlerRunConfig, LLMConfig, all strategies, all filters/scorers
```

### CLI

```bash
# Basic crawl
crwl https://example.com -o markdown

# Deep crawl BFS, max 10 pages
crwl https://docs.example.com --deep-crawl bfs --max-pages 10

# LLM extraction
crwl https://example.com/products -q "Extract all product prices"
```

### Docker Deployment

```bash
# Docker Compose provided in repo
docker-compose up
# Exposes REST API for remote crawling via Crawl4aiDockerClient
```

### Cloud API

Crawl4AI Cloud API in closed beta — positioned as "drastically more cost-effective" than alternatives.

---

## Adaptive Crawler

An advanced crawler that determines when "enough information" has been gathered about a topic — avoids crawling unnecessary pages.

```python
from crawl4ai.adaptive_crawler import AdaptiveCrawler, CrawlState

# CrawlState tracks:
# - crawled_urls, knowledge_base
# - term_frequencies, document_frequencies (TF-IDF-style)
# - new_terms_history (saturation detection)
# - kb_embeddings, query_embeddings (if using embedding strategy)
# - semantic_gaps via alphashape coverage analysis
```

Two saturation strategies:
1. **Statistical** — tracks new term discovery rate, stops when marginal gain drops below threshold
2. **Embedding** — tracks semantic coverage using alpha shapes in embedding space

State is persistent (save to disk, resume crawl across sessions).

---

## What We Can Reuse

### For AI Marketing/Sales Data Pipeline

1. **Competitor intelligence scraping** — use `JsonCssExtractionStrategy` for structured product/pricing data without LLM cost
2. **Content marketing research** — use `BM25ContentFilter` + `DefaultMarkdownGenerator` to get clean, relevant markdown from any page
3. **Lead enrichment** — crawl company websites with `score_links=True` + `LinkPreviewConfig` to score and rank internal pages
4. **Bulk URL processing** — `MemoryAdaptiveDispatcher` handles hundreds of URLs with auto-throttling and backoff
5. **LLM extraction pipeline** — `LLMExtractionStrategy` with Pydantic schemas → structured JSON → PostgreSQL

### Reusable Patterns

```python
# Pattern 1: Schema-based structured scraping (zero LLM cost)
strategy = JsonCssExtractionStrategy(schema={
    "baseSelector": ".product",
    "fields": [
        {"name": "name", "selector": "h2", "type": "text"},
        {"name": "price", "selector": ".price", "type": "text"},
        {"name": "url", "selector": "a", "type": "attribute", "attribute": "href"},
    ]
})

# Pattern 2: LLM extraction with Pydantic schema
class Lead(BaseModel):
    company: str
    contact_email: str
    phone: str
    industry: str

strategy = LLMExtractionStrategy(
    llm_config=LLMConfig(provider="openai/gpt-4o-mini", api_token=OPENAI_API_KEY),
    schema=Lead.model_json_schema(),
    extraction_type="schema",
)

# Pattern 3: Mass crawl with memory-safe dispatcher
async with AsyncWebCrawler(config=BrowserConfig(headless=True)) as crawler:
    results = await crawler.arun_many(
        urls=url_list,
        config=CrawlerRunConfig(cache_mode=CacheMode.ENABLED, markdown_generator=md_gen),
        dispatcher=MemoryAdaptiveDispatcher(max_session_permit=10),
    )

# Pattern 4: Session reuse for authenticated crawling
config = CrawlerRunConfig(session_id="my-session")  # reuse same browser context
result1 = await crawler.arun("https://app.example.com/login", config=config)
result2 = await crawler.arun("https://app.example.com/dashboard", config=config)
```

---

## Lessons & Best Practices

### Performance

- Use `CacheMode.ENABLED` in development, `CacheMode.BYPASS` only for fresh data needs
- `text_mode=True` in BrowserConfig for text-only pages (no images) — significant speedup
- `light_mode=True` disables background throttling and other features
- `memory_saving_mode=True` + `max_pages_before_recycle=500` for long-running high-volume crawls
- Use `JsonCssExtractionStrategy` or `JsonXPathExtractionStrategy` instead of LLM when page structure is predictable — 10-100x cheaper
- `LLMExtractionStrategy` with `gpt-4o-mini` for cost efficiency; use `apply_chunking=True` with `chunk_token_threshold=2048`
- For Groq rate limits: hardcoded 500ms delay between chunks in `LLMExtractionStrategy`

### Anti-Bot

- `enable_stealth=True` + `user_agent_mode="random"` as baseline
- `simulate_user=True` + `override_navigator=True` for harder targets
- Proxy rotation via `ProxyConfig` list in `BrowserConfig.proxy_config`
- `RoundRobinProxyStrategy` for automatic proxy cycling
- Built-in detection of Cloudflare, Akamai, PerimeterX, DataDome, Imperva (v0.8.5)
- `flatten_shadow_dom=True` for sites that hide content in Shadow DOM (v0.8.5)
- `remove_consent_popups=True` handles OneTrust, Cookiebot, TrustArc, Quantcast (v0.8.5)

### Extraction Strategy Selection Guide

| Scenario | Strategy | Cost |
|---|---|---|
| Page with predictable repeated elements (products, listings) | `JsonCssExtractionStrategy` | Free |
| XPath needed for complex selection | `JsonXPathExtractionStrategy` | Free |
| Semantic clustering without LLM | `CosineStrategy` | Free (CPU) |
| Ad-hoc extraction with natural language instruction | `LLMExtractionStrategy` (block) | LLM tokens |
| Structured JSON output with schema | `LLMExtractionStrategy` (schema) | LLM tokens |
| Just need clean text, no structure | `DefaultMarkdownGenerator` + BM25 filter | Free |

### Deep Crawling Tips

- Always set `max_pages` to avoid runaway crawls
- Use `stream=True` in config to process results as they arrive (better memory efficiency)
- `resume_state` + `on_state_change` for crawls > 1000 pages — save to disk every N pages
- `BestFirstCrawlingStrategy` with `KeywordRelevanceScorer` for focused topic crawls
- `FilterChain` + `URLPatternFilter` to stay within intended site sections

### Security Notes

- Serialization uses allowlist (`ALLOWED_DESERIALIZE_TYPES`) — only known-safe types deserializable from API input
- `_safe_eval_expression` uses AST validation — no imports, no dunder access in computed fields
- `unclecode-litellm` (not `litellm`) — supply chain compromise hotfix in v0.8.6

### Vietnam Market Relevance

- Works with Vietnamese sites (unicode preserved in markdown)
- `JSON_ENSURE_ASCII=False` in user settings preserves Vietnamese characters in JSON output
- No special configuration needed for Vietnamese content
- E-commerce scraping (product listings, prices) ideal for `JsonCssExtractionStrategy`
- Zalo/social media links automatically excluded via `exclude_social_media_links=True` + `SOCIAL_MEDIA_DOMAINS` config
