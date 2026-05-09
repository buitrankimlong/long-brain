---
tags: [knowledge, underthesea, vietnamese, nlp, tokenizer, ner]
source_repo: underthesea
---

# Underthesea - Vietnamese NLP Knowledge Extraction

## Overview & Architecture

Underthesea (v9.4.0) is an open-source Vietnamese NLP toolkit that has evolved into an **Agentic AI Toolkit** with built-in Vietnamese language processing. It combines:

1. **Core NLP Pipelines** — traditional CRF-based models for Vietnamese text (tokenizer, POS, NER, sentiment, chunking, classification)
2. **Deep Learning Layer** — HuggingFace Transformers-based models (optional `[deep]` install)
3. **Multi-provider AI Agent** — zero-dependency LLM agent supporting OpenAI, Azure, Anthropic, Gemini
4. **Agentic Toolkit** — tool calling, session management, tracing, streaming

### Pipeline Architecture (Layered)

```
sent_tokenize (sentence split)
    └── word_tokenize (CRF on regex-tokenized input)
         └── pos_tag (CRF on word-tokenized input)
              └── chunk (CRF on POS-tagged input)
                   └── ner (CRF on chunked input)
```

Each pipeline calls the previous one. They are lazy-loaded as singletons. All NLP models are bundled inside the package under `underthesea/pipeline/<task>/models/`.

### Package Layout

```
underthesea/
├── pipeline/
│   ├── word_tokenize/      # CRF + regex pre-tokenizer
│   ├── pos_tag/            # CRF POS tagger
│   ├── chunking/           # CRF chunker
│   ├── ner/                # CRF NER + optional Transformers NER
│   ├── sentiment/
│   │   ├── general/        # General domain binary sentiment
│   │   └── bank/           # Banking domain aspect-based sentiment
│   ├── classification/     # Text classifier (general + bank)
│   ├── lang_detect/        # FastText language ID
│   ├── text_normalize/     # Character + token normalization
│   ├── translate/          # En-Vi / Vi-En translation [deep]
│   ├── dependency_parse/   # Dependency parser [deep]
│   └── tts/                # Text-to-Speech [voice]
├── agent/                  # Multi-provider AI Agent
├── models/                 # FastCRFSequenceTagger (shared model class)
├── util/                   # Singleton decorator, utilities
└── file_utils.py           # Model cache at ~/.underthesea/
```

---

## Tech Stack & Dependencies

### Core Dependencies (always installed)

| Package | Purpose |
|---------|---------|
| `underthesea_core>=3.3.0` | Rust-compiled C extensions: `CRFTagger`, `CRFFeaturizer`, `TextClassifier`, `FastText` |
| `huggingface-hub` | Model downloading/caching from HuggingFace |
| `joblib` | Serialization of feature definitions and dictionaries |
| `requests` + `tqdm` | Model downloading with progress bars |
| `Click>=6.0` | CLI interface |
| `PyYAML` | Config files |

### Optional Dependency Groups

| Extra | Packages | Used For |
|-------|---------|---------|
| `[deep]` | `torch>=2.0.0`, `transformers>=4.30.0` | Deep NER, dependency parse, translation |
| `[voice]` | `jax`, `jaxlib`, `dm-haiku`, `optax`, `soundfile` | Text-to-Speech via vietTTS |
| `[prompt]` | `openai` | Prompt-based classification |
| `[trace]` | `langfuse>=2.0.0` | Agent observability |
| `[train]` | `seqeval` | Model training evaluation |

### Python Support
Python 3.10, 3.11, 3.12, 3.13, 3.14. Minimum: 3.9 (enforced at runtime).

### Model Storage
- Default cache: `~/.underthesea/` (controlled by `UNDERTHESEA_FOLDER`)
- Models: `~/.underthesea/models/`
- Datasets: `~/.underthesea/datasets/`
- Traces: `~/.underthesea/traces/`

---

## Word Segmentation / Tokenizer

### What It Does
Vietnamese is written without spaces between syllables inside a multi-syllable word (e.g., "khởi nghiệp" = startup). The tokenizer groups syllables into correct word units.

### How It Works (Two-Stage Pipeline)

**Stage 1 — Regex Pre-tokenizer** (`regex_tokenize.py`)

A priority-ordered regex pipeline splits raw text into atomic tokens before CRF processing. Priority order:

1. `specials` — arrows, ellipsis, dimensions (3x4), v.v.
2. `abbreviations` — Vietnamese abbreviations (T.Ư, Tp., Mr., NĐ-CP, vehicle plates)
3. `url` — full URL patterns (http/https/ftp)
4. `email` — email addresses
5. `phone` — hyphenated phone numbers
6. `datetime` — dates (DD/MM/YYYY, YYYY/MM/DD) and times
7. `name` — alphanumeric names (4K, 3G)
8. `number` — integers and decimals (60.542.000, 4.123,2)
9. `emoji` — basic emoticons (:), :D, <3)
10. `punct` — punctuation
11. `word_hyphen` — hyphenated words
12. `word` — generic word characters
13. `symbol` — +, -, %, $, etc.
14. `non_word` — catch-all

The `fixed_words` parameter injects custom patterns at the highest priority, useful for domain-specific terms.

**Stage 2 — CRF Sequence Tagger** (`FastCRFSequenceTagger`)

- Model file: `ws_crf_vlsp2013_20230727` (trained on VLSP 2013 corpus)
- Tags: `B-W` (begin word), `I-W` (inside multi-syllable word)
- Output reconstruction: `I-W` tokens are merged with the preceding token using a space

**Normalization hooks:**
- `use_character_normalize=True` — normalizes Vietnamese diacritics before tokenizing
- `use_token_normalize=True` — normalizes individual tokens after splitting

### Key API

```python
from underthesea import word_tokenize

word_tokenize("Chàng trai 9X Quảng Trị khởi nghiệp từ nấm sò")
# ["Chàng trai", "9X", "Quảng Trị", "khởi nghiệp", "từ", "nấm", "sò"]

word_tokenize("Bác sĩ bây giờ có thể thản nhiên báo tin", format="text")
# "Bác_sĩ bây_giờ có_thể thản_nhiên báo_tin"

# Domain-specific fixed words
word_tokenize("Cty TNHH Thép Miền Nam", fixed_words=["Thép Miền Nam"])
```

### Sentence Segmentation

```python
from underthesea import sent_tokenize
sent_tokenize("Taylor cho biết lúc đầu cô cảm thấy ngại. Amanda cũng thoải mái.")
# ["Taylor cho biết...", "Amanda cũng thoải mái."]
```

---

## Named Entity Recognition (NER)

### Two Modes

**Standard (CRF-based, no extra dependencies):**

```python
from underthesea import ner
ner("Chưa tiết lộ lịch trình tới Việt Nam của Tổng thống Mỹ Donald Trump")
# [('Việt Nam', 'Np', 'B-NP', 'B-LOC'),
#  ('Mỹ', 'Np', 'B-NP', 'B-LOC'),
#  ('Donald', 'Np', 'B-NP', 'B-PER'),
#  ('Trump', 'Np', 'B-NP', 'I-PER')]
```

Output is a 4-tuple: `(word, POS_tag, chunk_tag, NER_tag)`

NER tag scheme uses BIO format:
- `B-LOC` — beginning of location
- `I-PER` — inside person name
- `B-ORG` — beginning of organization
- `O` — not an entity

**Deep Learning (Transformers, requires `[deep]`):**

```python
ner("Bộ Công Thương xóa một tổng cục", deep=True)
# [{'entity': 'B-ORG', 'word': 'Bộ'},
#  {'entity': 'I-ORG', 'word': 'Công'},
#  {'entity': 'I-ORG', 'word': 'Thương'}]
```

HuggingFace model: `undertheseanlp/vietnamese-ner-v1.4.0a2` (token classification pipeline). Subword tokens with `##` prefix are merged back into whole words.

### CRF NER Architecture

The CRF NER model (`ner_crf_2017_10_12.bin`) uses rich feature templates including:
- Token lower-case, title-case (window of ±2)
- Word unigrams and bigrams (window of ±2)
- POS unigrams and bigrams (window of ±2)
- Previous NER tags (window of -3 to -1)

The pipeline requires chunked input, so internally calls: `word_tokenize -> pos_tag -> chunk -> NER CRF`.

---

## Sentiment Analysis

### Domain Support

**General domain** (binary: positive/negative):

```python
from underthesea import sentiment
sentiment("Sản phẩm chất lượng tốt, đóng gói cẩn thận.")   # 'positive'
sentiment("hàng kém chất lg, thất vọng")                    # 'negative'
sentiment.labels  # ['positive', 'negative']
```

**Banking domain** (aspect-based multi-label):

```python
sentiment("Đky qua đường link từ thứ 6 mà giờ chưa thấy ai lhe", domain='bank')
# ['CUSTOMER_SUPPORT#negative']
sentiment("Xem lại vẫn thấy xúc động và tự hào về BIDV", domain='bank')
# ['TRADEMARK#positive']
sentiment.bank.labels  # ['ACCOUNT#negative', 'CARD#positive', ...]
```

### Model Details
- General model: `sen-sentiment-general-1.0.0-20260207.bin` (downloaded on demand)
- Bank model: `sen-sentiment-bank-1.0.0-20260207.bin` (downloaded on demand)
- Backend: `underthesea_core.TextClassifier` (Rust-based)
- Models are downloaded from GitHub Releases to `~/.underthesea/models/`
- Models are lazy-loaded and cached globally in module scope

### Bank Sentiment with Confidence

```python
from underthesea.pipeline.sentiment.bank import sentiment_with_confidence
result = sentiment_with_confidence("Lãi suất cao quá")
# {"category": "INTEREST_RATE#negative", "confidence": 0.89}
```

---

## POS Tagging

### Usage

```python
from underthesea import pos_tag
pos_tag('Chợ thịt chó nổi tiếng ở Sài Gòn bị truy quét')
# [('Chợ', 'N'), ('thịt', 'N'), ('chó', 'N'), ('nổi tiếng', 'A'),
#  ('ở', 'E'), ('Sài Gòn', 'Np'), ('bị', 'V'), ('truy quét', 'V')]
```

### Vietnamese POS Tags

| Tag | Meaning | Example |
|-----|---------|---------|
| `N` | Common noun | bác sĩ, thịt |
| `Np` | Proper noun | Hà Nội, Donald Trump |
| `Nc` | Classifier noun | ông, bà, cái |
| `V` | Verb | bị, truy quét |
| `A` | Adjective | nổi tiếng, vĩ đại |
| `E` | Preposition | ở, của, tới |
| `M` | Numeral | 4, một |
| `L` | Determiner | những, các |
| `R` | Adverb | bây giờ, có thể |
| `P` | Pronoun | tôi, họ |
| `CH` | Punctuation | ? . , |

### Two Model Versions
- Default (v1): `pos_crf_2017_10_11.bin` — via `CRFPOSTagPredictor` singleton
- v2.0: `pos_crf_vlsp2013_20230303` — via `FastCRFSequenceTagger`, outputs BOI-format tags (B-N, B-V, etc.), prefix stripped

POS tagging first calls `word_tokenize` internally, then applies CRF on the tokenized list.

---

## Key Code Patterns (with snippets)

### Singleton Pattern for Models

All CRF predictors use a `@Singleton` decorator that defers instantiation until `Instance()` is called:

```python
@Singleton
class CRFNERPredictor:
    def __init__(self):
        self.model = CRFTagger()
        self.model.load(filepath)
        ...

# Usage
crf_model = CRFNERPredictor.Instance()  # lazy-loads on first call
```

### Lazy Optional Imports

The main `__init__.py` uses `functools.cache` to lazily load optional modules:

```python
optional_imports = {
    'classify': 'underthesea.pipeline.classification',
    'sentiment': 'underthesea.pipeline.sentiment',
    'lang_detect': 'underthesea.pipeline.lang_detect',
    ...
}

@cache
def get_optional_import(module_name, object_name):
    try:
        module = __import__(module_name, fromlist=[object_name])
        return getattr(module, object_name)
    except ImportError:
        return None
```

### FastCRFSequenceTagger — Shared Model Class

Used by both `word_tokenize` and `pos_tag` (v2.0). Wraps `CRFTagger` + `CRFFeaturizer` from `underthesea_core`:

```python
model = FastCRFSequenceTagger()
model.load("path/to/model_dir")  # loads models.bin, features.bin, dictionary.bin
tags = model.predict([[token] for token in tokens])  # returns tag list
```

### Model Download Pattern

All downloadable models follow this pattern:

```python
MODEL_URL = "https://github.com/undertheseanlp/underthesea/releases/download/resources/model.bin"
MODEL_NAME = "model.bin"

def _get_model_path():
    cache_dir = Path(UNDERTHESEA_FOLDER) / "models"
    cache_dir.mkdir(parents=True, exist_ok=True)
    model_path = cache_dir / MODEL_NAME
    if not model_path.exists():
        cached_path(MODEL_URL, cache_dir=cache_dir)
    return model_path
```

### Agent Pattern (Zero External Dependencies)

```python
from underthesea.agent import Agent, Tool, LLM

def search_product(query: str) -> dict:
    """Search for a product in catalog."""
    return {"results": [...]}

agent = Agent(
    name="sales-bot",
    provider=LLM(),           # auto-detects from env vars
    tools=[Tool(search_product)],
    instruction="Bạn là trợ lý bán hàng thông minh.",
)
response = agent("Tìm giúp tôi laptop dưới 20 triệu")
```

### Pipeline Chaining Pattern

The NLP pipelines chain naturally:

```python
# word_tokenize -> pos_tag -> chunk -> ner (automatic chaining)
from underthesea import ner
result = ner("Chủ tịch nước Nguyễn Xuân Phúc thăm Hà Nội")
# Each pipeline level output feeds into the next
```

---

## Models & Training Data

### Bundled CRF Models (shipped with package)

| Model File | Task | Training Data | Notes |
|-----------|------|--------------|-------|
| `ws_crf_vlsp2013_20230727` | Word segmentation | VLSP 2013 | Uses `FastCRFSequenceTagger` |
| `pos_crf_2017_10_11.bin` | POS tagging (v1) | VLSP 2017 | Singleton CRF, being deprecated |
| `pos_crf_vlsp2013_20230303` | POS tagging (v2) | VLSP 2013 | `FastCRFSequenceTagger`, BOI format |
| `ner_crf_2017_10_12.bin` | NER | VLSP 2017 | Singleton CRF |

### Downloaded Models (on demand, to `~/.underthesea/models/`)

| Model | Task | Source |
|-------|------|--------|
| `sen-sentiment-general-1.0.0-20260207.bin` | General sentiment | GitHub Releases |
| `sen-sentiment-bank-1.0.0-20260207.bin` | Banking sentiment | GitHub Releases |
| `sen-classifier-general-1.0.0-20260207.bin` | General text classification | GitHub Releases |
| `sen-bank-1.0.0-20260207.bin` | Banking text classification | GitHub Releases |
| `LANG_DETECT_FAST_TEXT` | Language detection | FastText (via ModelFetcher) |

### HuggingFace Models (for `[deep]`)

| Model | Task | Hub ID |
|-------|------|--------|
| Vietnamese NER | Token classification | `undertheseanlp/vietnamese-ner-v1.4.0a2` |

### Training Datasets Available

```bash
underthesea list-data
```

| Dataset | Type | Year |
|---------|------|------|
| CP_Vietnamese_VLC_v2_2022 | Plaintext corpus | 2023 |
| UIT_ABSA_RESTAURANT | Sentiment (ABSA) | 2021 |
| UIT_ABSA_HOTEL | Sentiment (ABSA) | 2021 |
| SE_Vietnamese-UBS | Sentiment | 2020 |
| DI_Vietnamese-UVD | Dictionary | 2020 |
| UTS2017-BANK | Banking categorized | 2017 |
| VNTC | News categorized | 2007 |

---

## What We Can Reuse (for Vietnam Market)

### 1. Vietnamese Text Pre-processing Pipeline

The regex tokenizer handles Vietnamese-specific patterns out of the box:
- Vietnamese diacritics (full Unicode range including ơ, ư, ă, đ with all tonal marks)
- Vietnamese abbreviations (T.Ư, NĐ-CP, ThS., TP.)
- Vehicle plate numbers (43H-0530)
- Vietnamese number format (60.542.000 with dot as thousands separator)

**Reuse for:** Any Vietnamese text processing pipeline, chatbot input normalization, data cleaning.

### 2. Sentiment Analysis for Vietnamese Customer Reviews

The banking domain sentiment with aspect-based labels (`ACCOUNT#negative`, `CARD#positive`, `INTEREST_RATE#negative`, `CUSTOMER_SUPPORT#negative`) directly maps to fintech/banking use cases common in Vietnam.

**Reuse for:** Customer review mining, complaint detection for Vietnamese banks/fintechs (BIDV, Vietcombank, MoMo, VNPay).

### 3. Named Entity Recognition for Vietnamese Content

NER identifies PER (people), LOC (locations), ORG (organizations) — essential for:
- Vietnamese news content extraction
- Lead generation (extracting company/person names from Vietnamese text)
- CRM data enrichment from Vietnamese text inputs

**Reuse for:** Content marketing automation, Vietnamese social listening, lead extraction from Zalo/Facebook posts.

### 4. Text Classification for Vietnamese Topics

General classifier covers: Thể thao, Kinh doanh, Khoa học, Chinh trị Xa hội, Đời sống, etc.
Banking classifier covers: ACCOUNT, CARD, DISCOUNT, INTEREST_RATE, etc.

**Reuse for:** Vietnamese content routing, support ticket categorization, social media monitoring.

### 5. Zero-dependency AI Agent for Vietnamese Workflows

The `underthesea.agent` module implements a full tool-calling loop with NO external LLM dependencies (uses only `urllib` + `json`). This is lighter than LangChain/CrewAI for simple Vietnamese-first agents.

**Reuse for:** Lightweight Vietnamese chatbot backend, marketing automation scripts, Vietnamese content generation agents.

### 6. Address Normalization (Vietnam Administrative Reform)

```python
from underthesea import convert_address
convert_address("Phường Phúc Xá, Quận Ba Đình, Thành phố Hà Nội").converted
# "Phường Hồng Hà, Thành phố Hà Nội"
```

Vietnam's 2025 administrative mergers changed hundreds of ward/district names. This converter handles mapping old to new names.

**Reuse for:** E-commerce address validation, delivery logistics, CRM address standardization.

### 7. Multi-session Agent Pattern

```python
from underthesea.agent import Session, Agent

session = Session(agent, progress_file="progress.json")
session.create_task("Phân tích thị trường", [
    "Thu thập dữ liệu",
    "Phân tích xu hướng",
    "Viết báo cáo",
])
session.run_until_complete(max_sessions=5)
```

Pattern for long-running research/analysis tasks with checkpointing — useful for content production pipelines.

---

## Lessons & Best Practices

### 1. Install Only What You Need

```bash
pip install underthesea              # Core NLP only (CRF models, no GPU)
pip install underthesea[deep]        # Add deep learning (Transformers + PyTorch)
pip install underthesea[voice]       # Add TTS (heavy: JAX required)
pip install underthesea[prompt]      # Add prompt-based classification (OpenAI)
pip install underthesea[trace]       # Add Langfuse observability
```

Deep mode requires ~2GB disk and GPU recommended for production inference.

### 2. All Models Are Lazy-Loaded and Singleton

No model is loaded at import time. First call triggers loading. Models are cached in module globals or via `@Singleton`. Safe to import `underthesea` at app startup without performance penalty.

### 3. Pipeline Dependency Chain

Never call a lower-level pipeline directly if you need higher-level output. The chain is:

```
text -> sent_tokenize -> word_tokenize -> pos_tag -> chunk -> ner
```

Each step adds information. The `ner()` function calls `chunk()` which calls `pos_tag()` which calls `word_tokenize()` automatically.

### 4. CRF vs Deep NER Tradeoff

| | CRF NER | Deep NER (`deep=True`) |
|-|---------|----------------------|
| Speed | Fast (Rust) | Slow (PyTorch) |
| Dependencies | None extra | torch + transformers |
| Accuracy | Good for news | Better for diverse text |
| Output format | 4-tuple with POS/chunk | Dict with entity/word |

Use CRF for production, Deep for higher accuracy research tasks.

### 5. Fixed Words for Domain-Specific Tokenization

```python
# Without fixed_words: "Vinamilk" might be split wrong
# With fixed_words: guaranteed to be kept as one token
word_tokenize("Sữa Vinamilk chất lượng cao", fixed_words=["Vinamilk"])
```

Use `fixed_words` for brand names, product names, Vietnamese company names.

### 6. Agent Tracing — Always On by Default

Every agent call writes to `~/.underthesea/traces/`. In production, set:

```bash
export UNDERTHESEA_TRACE_DISABLED=1   # Disable tracing
export UNDERTHESEA_TRACE_DIR=/path    # Custom trace directory
```

Or use Langfuse for production observability:

```python
from underthesea.agent import Agent, LangfuseTracer
agent = Agent(name="bot", tracer=LangfuseTracer())
```

### 7. Vietnamese Character Normalization is Critical

Vietnamese text from the web often has inconsistent Unicode encoding for diacritics (e.g., "Đảm bảo" vs "Ðảm baỏ"). Always apply:

```python
from underthesea import text_normalize
text_normalize("Ðảm baỏ chất lựơng")
# "Đảm bảo chất lượng"
```

This is automatically applied inside `word_tokenize` unless `use_character_normalize=False`.

### 8. Model Cache Location

All downloaded models go to `~/.underthesea/`. In Docker/serverless environments, mount this as a volume or pre-download models during image build to avoid cold-start delays.

```bash
# Pre-download models in Dockerfile
RUN python -c "from underthesea import sentiment; sentiment('test')"
RUN python -c "from underthesea import classify; classify('test')"
```

### 9. Sentiment Domain Selection

Do not use general sentiment for banking/fintech text — the aspect-based bank model is significantly more informative:

```python
# Weak: only positive/negative
sentiment("Phí chuyển tiền của Techcombank cao quá")  # 'negative'

# Better: aspect + polarity
sentiment("Phí chuyển tiền của Techcombank cao quá", domain='bank')
# ['FEE#negative']
```

### 10. Text Classification Categories (General Domain)

The general classifier covers Vietnamese news categories. Use as a routing signal in content pipelines:
- Thể thao (Sports)
- Kinh doanh (Business)
- Khoa học (Science)
- Chinh trị Xa hội (Politics & Society)
- Đời sống (Lifestyle)

Combine with `domain='bank'` for financial text to get granular banking topic labels.
