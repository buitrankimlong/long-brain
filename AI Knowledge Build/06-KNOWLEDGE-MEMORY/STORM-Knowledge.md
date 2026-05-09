---
tags: [knowledge, research, storm, stanford, dspy]
source_repo: storm
files_read: 20
---

# STORM (Stanford) - Knowledge Extraction

## Overview & Architecture

STORM (Synthesis of Topic Outlines through Retrieval and Multi-perspective Question Asking) is a Stanford research system that writes Wikipedia-style articles from scratch by automating the pre-writing research phase. It was published at NAACL 2024 and Co-STORM at EMNLP 2024.

**The core insight**: Good long-form articles require good questions first. STORM automates the question-generation process using multiple simulated expert perspectives and grounded web search.

### Two Variants

**STORM** (automated, batch mode):
1. Pre-writing stage: Internet research via perspective-guided simulated conversations
2. Writing stage: Generate full article with citations from collected knowledge

**Co-STORM** (interactive, human-in-the-loop):
- Adds a human user who can inject utterances to steer discourse
- Maintains a live "mind map" (knowledge base tree) as shared conceptual space
- Multi-agent roundtable with moderator, experts, and simulated/real user

### STORM Pipeline (4 Stages)

```
Topic Input
  -> KnowledgeCurationModule  (research via persona-guided conversations + search)
  -> OutlineGenerationModule  (hierarchical article outline)
  -> ArticleGenerationModule  (section-by-section writing with inline citations)
  -> ArticlePolishingModule   (lead section + optional dedup)
  -> Final Article Output
```

### Co-STORM Pipeline

```
Topic Input
  -> warm_start()      (mini-STORM: multi-perspective QA to seed knowledge base)
  -> step() x N        (turn-based discourse: expert answers / moderator questions / user input)
  -> knowledge_base.reorganize()  (expand + clean mind map)
  -> generate_report() (article from mind map nodes)
```

---

## Tech Stack & Dependencies

### Core Dependencies (`requirements.txt`)
```
dspy_ai==2.4.9          # Core LM programming framework (ALL prompts use dspy)
litellm                  # Universal LLM API layer (supports 100+ models)
sentence-transformers    # Embeddings for retrieval in STORM (paraphrase-MiniLM-L6-v2)
numpy                    # Vector math for cosine similarity
diskcache                # Local disk caching for LM calls (~/.storm_local_cache)
trafilatura              # Web page content extraction
langchain-text-splitters # Chunk documents for VectorRM
langchain-huggingface    # HuggingFace embeddings for VectorRM
qdrant-client            # Vector store for VectorRM
langchain-qdrant         # Qdrant integration for VectorRM
wikipedia                # Wikipedia API (for persona generator)
toml                     # secrets.toml config loading
```

### LM Support
- Via **litellm**: Any model (OpenAI, Anthropic, Azure, Together AI, Mistral, Groq, Ollama, DeepSeek, Gemini)
- Via **ClaudeModel** class: Direct Anthropic API with backoff/retry
- Local disk cache: `~/.storm_local_cache` (litellm disk cache - avoids duplicate API calls)

### Search/Retrieval Modules (`rm.py`)
- `YouRM` - You.com search
- `BingSearch` - Bing Web Search API
- `SerperRM` - Serper (Google proxy)
- `BraveRM` - Brave Search
- `DuckDuckGoSearchRM` - DuckDuckGo (free, no key)
- `TavilySearchRM` - Tavily (AI-optimized search)
- `SearXNG` - Self-hosted open-source metasearch
- `GoogleSearch` - Google Custom Search
- `AzureAISearch` - Azure AI Search
- `VectorRM` - Custom document corpus via Qdrant + HuggingFace embeddings

---

## Key Code Patterns (with snippets)

### Pattern 1: DSPy Signature = Declarative Prompts

All prompts are defined as `dspy.Signature` classes with typed fields. No raw string prompts.

```python
class AskQuestionWithPersona(dspy.Signature):
    """You are an experienced Wikipedia writer... Ask good questions...
    When you have no more question to ask, say "Thank you so much for your help!"
    """
    topic = dspy.InputField(prefix="Topic you want to write: ", format=str)
    persona = dspy.InputField(prefix="Your persona besides being a Wikipedia writer: ", format=str)
    conv = dspy.InputField(prefix="Conversation history:\n", format=str)
    question = dspy.OutputField(format=str)

class WriteSection(dspy.Signature):
    """Write a Wikipedia section based on collected information.
    Use [1], [2], ..., [n] inline citations.
    """
    info = dspy.InputField(prefix="The collected information:\n", format=str)
    topic = dspy.InputField(prefix="The topic of the page: ", format=str)
    section = dspy.InputField(prefix="The section you need to write: ", format=str)
    output = dspy.OutputField(prefix="Write the section with proper inline citations...\n", format=str)
```

### Pattern 2: DSPy Module = Composable LM Pipeline

```python
class ConvToSection(dspy.Module):
    def __init__(self, engine):
        super().__init__()
        self.write_section = dspy.Predict(WriteSection)
        self.engine = engine

    def forward(self, topic, outline, section, collected_info):
        info = ""
        for idx, storm_info in enumerate(collected_info):
            info += f"[{idx + 1}]\n" + "\n".join(storm_info.snippets)

        with dspy.settings.context(lm=self.engine):
            section = self.write_section(topic=topic, info=info, section=section).output
        return dspy.Prediction(section=section)
```

### Pattern 3: Multi-LM Configuration

Different components use different models for cost/quality balance:

```python
class STORMWikiLMConfigs(LMConfigs):
    def __init__(self):
        self.conv_simulator_lm = None   # Cheap model: query splitting, answer synthesis
        self.question_asker_lm = None   # Cheap model: persona-guided questioning
        self.outline_gen_lm = None      # Strong model: organize collected knowledge
        self.article_gen_lm = None      # Strong model: write sections with citations
        self.article_polish_lm = None   # Strong model: lead section + dedup

# Usage:
gpt_35 = LitellmModel(model='gpt-3.5-turbo', max_tokens=500, **kwargs)
gpt_4 = LitellmModel(model='gpt-4o', max_tokens=3000, **kwargs)
lm_configs.set_conv_simulator_lm(gpt_35)
lm_configs.set_article_gen_lm(gpt_4)
```

### Pattern 4: Perspective-Guided Persona Generation

STORM discovers different research angles by looking at Wikipedia pages of related topics:

```python
class CreateWriterWithPersona(dspy.Module):
    def forward(self, topic, draft=None):
        # Step 1: Find related Wikipedia pages
        related_topics = self.find_related_topic(topic=topic).related_topics

        # Step 2: Scrape their table of contents for structure inspiration
        for url in urls:
            title, toc = get_wiki_page_title_and_toc(url)
            examples.append(f"Title: {title}\nTable of Contents: {toc}")

        # Step 3: Generate diverse editor personas from the examples
        personas = self.gen_persona(topic=topic, examples=examples).personas
        return dspy.Prediction(personas=personas, ...)
```

Default persona always prepended: `"Basic fact writer: Basic fact writer focusing on broadly covering the basic facts about the topic."`

### Pattern 5: Parallel Conversation Simulation

Multiple persona conversations run concurrently via ThreadPoolExecutor:

```python
def _run_conversation(self, conv_simulator, topic, ground_truth_url, considered_personas, callback_handler):
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_persona = {
            executor.submit(run_conv, persona): persona
            for persona in considered_personas
        }
        for future in as_completed(future_to_persona):
            persona = future_to_persona[future]
            conv = future.result()
            conversations.append((persona, conv.dlg_history))
    return conversations
```

### Pattern 6: KnowledgeBase Tree (Co-STORM Mind Map)

The knowledge base is a hierarchical tree of `KnowledgeNode` objects, each holding information UUIDs:

```python
class KnowledgeBase:
    def insert_from_outline_string(self, outline_string):
        # Parse "#"-prefixed outline into tree nodes
        for line in outline_string.split("\n"):
            level = line.count("#")
            title = line.strip("# ").strip()
            parent_node = last_node_at_level.get(level - 1)
            new_node = self.insert_node(new_node_name=title, parent_node=parent_node)

    def reorganize(self):
        # Top-down expansion: split nodes with too many snippets into subtopics
        # Bottom-up cleaning: remove empty leaf nodes, merge single-child nodes
        self.trim_empty_leaf_nodes()
        self.merge_single_child_nodes()
        self.expand_node_module(knowledge_base=self)
        self.trim_empty_leaf_nodes()
        self.merge_single_child_nodes()
        self.update_all_info_path()

    def get_knowledge_base_structure_embedding(self):
        # Cache the embedding of the entire tree structure string
        # Used for semantic matching when inserting new information
        outline_string = self.get_node_hierarchy_string(include_full_path=True)
        if hash(outline_string) != self.kb_embedding["hash"]:
            self.kb_embedding["encoded_structure"] = self.encoder.encode(outline_strings)
```

### Pattern 7: Information Retrieval with Semantic Similarity

STORM stores all collected snippets and retrieves them per-section using cosine similarity:

```python
class StormInformationTable(InformationTable):
    def prepare_table_for_retrieval(self):
        self.encoder = SentenceTransformer("paraphrase-MiniLM-L6-v2")
        self.encoded_snippets = self.encoder.encode(self.collected_snippets)

    def retrieve_information(self, queries, search_top_k):
        for query in queries:
            encoded_query = self.encoder.encode(query)
            sim = cosine_similarity([encoded_query], self.encoded_snippets)[0]
            sorted_indices = np.argsort(sim)
            # Take top-k most similar snippets
            for i in sorted_indices[-search_top_k:][::-1]:
                selected_urls.append(self.collected_urls[i])
```

### Pattern 8: Engine Decorator Pattern for Timing/Usage Tracking

```python
class Engine(ABC):
    def apply_decorators(self):
        # Auto-apply timing + LM/RM usage tracking to all run_* methods
        methods_to_decorate = [m for m in dir(self) if m.startswith("run_")]
        for method_name in methods_to_decorate:
            original_method = getattr(self, method_name)
            decorated_method = self.log_execution_time_and_lm_rm_usage(original_method)
            setattr(self, method_name, decorated_method)
```

### Pattern 9: Disk Caching for LM Calls

```python
# In lm.py and encoder.py - automatic disk cache for all LiteLLM calls
disk_cache_dir = os.path.join(Path.home(), ".storm_local_cache")
litellm.cache = Cache(disk_cache_dir=disk_cache_dir, type="disk")
LM_LRU_CACHE_MAX_SIZE = 3000  # In-memory LRU cache on top
```

### Pattern 10: VectorRM for Custom Document Corpus

```python
class VectorRM(dspy.Retrieve):
    """Use Qdrant + HuggingFace embeddings to search custom documents."""
    # CSV format required: content, title, url, description(optional)

    def init_online_vector_store(self, url, api_key):
        # Connect to hosted Qdrant
        self.qdrant_client = QdrantClient(url=url, api_key=api_key)

    def init_offline_vector_store(self, vector_store_path):
        # Use local Qdrant on-disk storage
        self.qdrant_client = QdrantClient(path=vector_store_path)
```

---

## Configuration & Setup

### secrets.toml (API Keys)

```toml
OPENAI_API_KEY = "sk-..."
OPENAI_API_TYPE = "openai"           # or "azure"
ANTHROPIC_API_KEY = "sk-ant-..."
BING_SEARCH_API_KEY = "..."
ENCODER_API_TYPE = "openai"          # Required for Co-STORM (embeddings)
YDC_API_KEY = "..."                  # You.com
SERPER_API_KEY = "..."
BRAVE_API_KEY = "..."
TAVILY_API_KEY = "..."
```

### STORMWikiRunnerArguments (Key Params)

| Param | Default | Description |
|---|---|---|
| `output_dir` | required | Where to save results |
| `max_conv_turn` | 3 | Questions per persona conversation |
| `max_perspective` | 3 | Number of expert personas |
| `max_search_queries_per_turn` | 3 | Search queries per expert answer |
| `search_top_k` | 3 | Web results per query |
| `retrieve_top_k` | 3 | Snippets retrieved per section |
| `max_thread_num` | 10 | Parallel threads (reduce if rate-limited) |

### Co-STORM RunnerArgument (Key Params)

| Param | Default | Description |
|---|---|---|
| `total_conv_turn` | 20 | Max conversation turns |
| `warmstart_max_num_experts` | 3 | Experts in warm start |
| `max_num_round_table_experts` | 2 | Active experts per turn |
| `moderator_override_N_consecutive_answering_turn` | 3 | Force moderator after N answer turns |
| `node_expansion_trigger_count` | 10 | Expand node when it has >10 snippets |
| `disable_moderator` | False | Skip moderator (cheaper) |

### Output Files Structure (STORM)

```
output_dir/topic_name/
    conversation_log.json           # All persona conversations with search results
    raw_search_results.json         # URL -> snippets map
    direct_gen_outline.txt          # LLM parametric knowledge outline (draft)
    storm_gen_outline.txt           # Refined outline from conversations
    url_to_info.json                # Sources used in final article
    storm_gen_article.txt           # Full article with [n] citations
    storm_gen_article_polished.txt  # Article + lead section
    run_config.json                 # LM configs used
    llm_call_history.jsonl          # All LLM calls (for debugging/cost)
```

---

## API & Integration Patterns

### Minimal STORM Integration

```python
from knowledge_storm import STORMWikiRunnerArguments, STORMWikiRunner, STORMWikiLMConfigs
from knowledge_storm.lm import LitellmModel
from knowledge_storm.rm import DuckDuckGoSearchRM  # Free, no API key

lm_configs = STORMWikiLMConfigs()
kwargs = {"api_key": "sk-...", "temperature": 1.0, "top_p": 0.9}

# Cost-optimized setup: cheap for research, strong for writing
lm_configs.set_conv_simulator_lm(LitellmModel(model='gpt-3.5-turbo', max_tokens=500, **kwargs))
lm_configs.set_question_asker_lm(LitellmModel(model='gpt-3.5-turbo', max_tokens=500, **kwargs))
lm_configs.set_outline_gen_lm(LitellmModel(model='gpt-4o', max_tokens=400, **kwargs))
lm_configs.set_article_gen_lm(LitellmModel(model='gpt-4o', max_tokens=700, **kwargs))
lm_configs.set_article_polish_lm(LitellmModel(model='gpt-4o', max_tokens=4000, **kwargs))

rm = DuckDuckGoSearchRM(k=3, safe_search="On", region="us-en")
engine_args = STORMWikiRunnerArguments(output_dir="./results", max_perspective=3)
runner = STORMWikiRunner(engine_args, lm_configs, rm)

runner.run(
    topic="Vietnamese AI Market",
    do_research=True,
    do_generate_outline=True,
    do_generate_article=True,
    do_polish_article=True,
)
runner.post_run()
runner.summary()  # Prints timing + token usage
```

### Resume/Incremental Mode

```python
# Skip research if already done, just regenerate article
runner.run(
    topic=topic,
    do_research=False,           # Load from conversation_log.json
    do_generate_outline=True,
    do_generate_article=True,
    do_polish_article=True,
)
```

### Claude Integration

```python
from knowledge_storm.lm import ClaudeModel

conv_simulator_lm = ClaudeModel(model="claude-3-haiku-20240307", max_tokens=500, **claude_kwargs)
question_asker_lm = ClaudeModel(model="claude-3-sonnet-20240229", max_tokens=500, **claude_kwargs)
outline_gen_lm = ClaudeModel(model="claude-3-opus-20240229", max_tokens=400, **claude_kwargs)
article_gen_lm = ClaudeModel(model="claude-3-opus-20240229", max_tokens=700, **claude_kwargs)
```

### Co-STORM Integration

```python
from knowledge_storm.collaborative_storm.engine import CollaborativeStormLMConfigs, RunnerArgument, CoStormRunner
from knowledge_storm.lm import LitellmModel
from knowledge_storm.logging_wrapper import LoggingWrapper
from knowledge_storm.rm import BingSearch

lm_config = CollaborativeStormLMConfigs()
lm_config.init(lm_type="openai")  # or "azure", "together"

runner = CoStormRunner(
    lm_config=lm_config,
    runner_argument=RunnerArgument(topic="LLM Agents in Vietnam"),
    logging_wrapper=LoggingWrapper(lm_config),
    rm=BingSearch(bing_search_api_key="...", k=10),
)

runner.warm_start()           # Seeds knowledge base
conv_turn = runner.step()     # System generates next turn
runner.step(user_utterance="What about Vietnam-specific use cases?")  # User injects
runner.knowledge_base.reorganize()
article = runner.generate_report()
```

### Custom Retriever (VectorRM with your own docs)

```python
from knowledge_storm.rm import VectorRM

# Your CSV: columns = content, title, url, description
vector_rm = VectorRM(
    collection_name="my_docs",
    embedding_model="all-MiniLM-L6-v2",
    k=5,
)
vector_rm.init_offline_vector_store(vector_store_path="./my_qdrant_db")
# Or online: vector_rm.init_online_vector_store(url="http://...", api_key="...")
```

### Callback Handler for Progress Tracking

```python
from knowledge_storm.storm_wiki.modules.callback import BaseCallbackHandler

class MyCallback(BaseCallbackHandler):
    def on_identify_perspective_start(self):
        print("Identifying research perspectives...")

    def on_information_gathering_start(self):
        print("Searching the web...")

    def on_dialogue_turn_end(self, dlg_turn):
        print(f"Completed research turn: {dlg_turn.user_utterance[:50]}")

    def on_information_organization_start(self):
        print("Organizing outline...")

runner.run(topic=topic, ..., callback_handler=MyCallback())
```

---

## What We Can Reuse

### 1. Perspective-Guided Research Pattern
The core "find related topics -> scrape their structure -> generate expert personas -> simulate conversations" pattern is directly applicable for any deep research task. Adapt for:
- Market research: personas = analyst, customer, regulator, competitor
- Technical research: personas = developer, architect, security expert, PM
- Vietnamese market: personas = local business owner, consumer, investor, regulator

### 2. Multi-LM Cost Routing
The pattern of using cheap models (Haiku/GPT-3.5) for conversational/query tasks and strong models (Opus/GPT-4) for final synthesis is proven effective. Match our architecture:
- Sonnet for routine (query decomp, answer synthesis)
- Opus for complex (outline generation, article writing)

### 3. DSPy Signatures for Structured Prompts
Instead of raw f-strings, define prompts as typed `dspy.Signature` classes. Benefits:
- Self-documenting with field names and docstring as instructions
- Easy to swap underlying models
- Built-in ChainOfThought, Predict, ReAct predictor types
- Optimizable with DSPy's MIPRO/BootstrapFewShot optimizers

### 4. LiteLLM Disk Cache
The `~/.storm_local_cache` disk cache pattern eliminates repeat API calls during development and testing. Use in our systems:
```python
import litellm
from litellm.caching.caching import Cache
litellm.cache = Cache(disk_cache_dir="~/.my_app_cache", type="disk")
```

### 5. ThreadPoolExecutor for Parallel LLM Calls
All parallel work uses Python `concurrent.futures.ThreadPoolExecutor`. Use `as_completed()` pattern for collecting results as they arrive.

### 6. KnowledgeBase Tree Structure (Mind Map)
The `KnowledgeNode` + `KnowledgeBase` pattern for organizing information hierarchically is excellent for:
- Client research memory
- Campaign knowledge accumulation
- Sales conversation context tracking

### 7. Information Deduplication via URL Hashing
The `Information` class uses URL + snippet set as unique identifier (MD5 hash). Good pattern for deduplicating web-sourced content.

### 8. Retriever Abstraction Pattern
The `Retriever` base class with `retrieve(query, exclude_urls)` interface is a clean abstraction. Add our own retrieval sources (Zalo data, VietnamWorks, internal DB) by extending `dspy.Retrieve`.

### 9. Resumable Pipeline
The run/skip pattern (`do_research=False` to load cached results) is essential for iterative development and cost control. Always implement resume capability in long pipelines.

### 10. Article Section Tree
`ArticleSectionNode` + `Article` with `#`/`##`/`###` markdown parsing is a clean way to represent hierarchical documents programmatically. Useful for structured report generation.

---

## Lessons & Best Practices

### Research Quality
1. **Perspective diversity is critical**: Without multiple personas, research stays shallow. The default "Basic fact writer" + domain-specific personas catches both breadth and depth.
2. **Ground truth URL exclusion**: Always exclude the reference article URL from search to prevent data leakage in evaluation.
3. **Conversation history truncation**: STORM only sends the last 4 turns fully to the LM; earlier turns are summarized as "Omit the answer here due to space limit." This is a smart context window management technique.

### Cost Optimization
4. **Different models for different tasks**: Query splitting and answer synthesis need less power than outline generation and article writing. Use 5x cost ratio.
5. **Disk caching is essential**: Development without caching burns API budget fast. Enable from day 1.
6. **max_conv_turn=3 is the sweet spot**: More turns yields diminishing returns but linear cost increase.
7. **max_thread_num tuning**: 10 threads may trigger rate limits. Start at 3 for Anthropic, tune up.

### Architecture
8. **Modular interface design**: The abstract base classes (`Engine`, `KnowledgeCurationModule`, `OutlineGenerationModule`, etc.) enable swapping any component without changing others. Follow this pattern in our systems.
9. **All state serializable**: Both `STORMWikiRunner` and `CoStormRunner` can serialize/deserialize full state to/from dicts. Essential for stateful web apps and resumable jobs.
10. **Streamlit integration**: STORM has native Streamlit thread context support (`add_script_run_ctx`). Good reference for building our own web UIs.

### DSPy Patterns
11. **Use `dspy.ChainOfThought` for complex reasoning**: `dspy.Predict` for straightforward extraction, `dspy.ChainOfThought` for tasks requiring step-by-step thinking.
12. **`dspy.settings.context(lm=engine)`**: Scoped LM switching within a module. Essential for multi-LM architectures.
13. **`show_guidelines=False`**: Use for generation tasks with non-OpenAI models to avoid hallucinated prompt echo.

### Co-STORM Specific
14. **Warm start is key UX**: Users join mid-stream with context already built. The warm start (mini-STORM) gives the system a head start before human enters.
15. **Moderator override after N consecutive expert turns**: Prevents the conversation from going too deep on one angle. Good discourse management heuristic.
16. **Node expansion at count=10**: The knowledge base stays manageable by expanding nodes that become too large. Tunable via `node_expansion_trigger_count`.
17. **Mind map reduces cognitive load**: As conversations go long, the hierarchical knowledge base helps both the LLM agents and human users track what has been covered.

### Integration
18. **DuckDuckGo is free for prototyping**: No API key needed, good for local development before committing to paid search APIs.
19. **SearXNG for self-hosted**: If data privacy matters, run SearXNG locally and point STORM at it.
20. **VectorRM for proprietary data**: When grounding on internal documents (client data, product catalogs, past campaigns), use VectorRM with Qdrant. The CSV format is simple to prepare.

---

## Source Files Reference

| File | Purpose |
|---|---|
| `knowledge_storm/interface.py` | Abstract base classes for all pipeline components |
| `knowledge_storm/lm.py` | LitellmModel, ClaudeModel, OpenAI wrappers with caching |
| `knowledge_storm/rm.py` | All retrieval modules (YouRM, BingSearch, VectorRM, etc.) |
| `knowledge_storm/dataclass.py` | ConversationTurn, KnowledgeNode, KnowledgeBase |
| `knowledge_storm/encoder.py` | LiteLLM embedding wrapper with disk cache |
| `knowledge_storm/storm_wiki/engine.py` | STORMWikiRunner, STORMWikiLMConfigs, STORMWikiRunnerArguments |
| `knowledge_storm/storm_wiki/modules/persona_generator.py` | Perspective-guided persona generation via Wikipedia |
| `knowledge_storm/storm_wiki/modules/knowledge_curation.py` | ConvSimulator, WikiWriter, TopicExpert, StormKnowledgeCurationModule |
| `knowledge_storm/storm_wiki/modules/outline_generation.py` | WriteOutline, StormOutlineGenerationModule |
| `knowledge_storm/storm_wiki/modules/article_generation.py` | ConvToSection, StormArticleGenerationModule |
| `knowledge_storm/storm_wiki/modules/article_polish.py` | PolishPageModule, WriteLeadSection |
| `knowledge_storm/storm_wiki/modules/storm_dataclass.py` | DialogueTurn, StormInformationTable, StormArticle |
| `knowledge_storm/collaborative_storm/engine.py` | CoStormRunner, DiscourseManager, CollaborativeStormLMConfigs |
| `knowledge_storm/collaborative_storm/modules/co_storm_agents.py` | CoStormExpert, Moderator, SimulatedUser, PureRAGAgent |
| `examples/storm_examples/run_storm_wiki_claude.py` | Full Claude integration example |
| `examples/costorm_examples/run_costorm_gpt.py` | Full Co-STORM example |
