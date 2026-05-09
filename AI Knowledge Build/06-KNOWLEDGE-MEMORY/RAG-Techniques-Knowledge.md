---
tags: [knowledge, rag, retrieval, embeddings, techniques]
source_repo: RAG_Techniques
extracted: 2026-05-09
notebooks_read: 37
---

# RAG Techniques - Knowledge Extraction

> Source: `C:\AI Build Learning\RAG_Techniques\` — NirDiamant's RAG_Techniques repo
> All major notebooks and scripts read and synthesized below.

---

## Overview & Technique Catalog

The repo contains **37 notebooks** covering the full spectrum of RAG patterns, from the simplest baseline to agentic, graph-based, and memory-augmented systems. All examples use a "Understanding Climate Change" PDF as the test document with OpenAI embeddings + FAISS as the default stack.

### Complete Technique List

| # | Technique | Category | Complexity |
|---|-----------|----------|------------|
| 1 | Simple RAG | Basic | Low |
| 2 | Semantic Chunking | Chunking | Medium |
| 3 | Choose Chunk Size | Chunking | Low |
| 4 | Contextual Chunk Headers (CCH) | Chunking | Medium |
| 5 | Proposition Chunking | Chunking | High |
| 6 | Context Enrichment Window | Retrieval | Medium |
| 7 | Fusion Retrieval (BM25 + Vector) | Retrieval | Medium |
| 8 | Reranking (LLM + Cross-Encoder) | Post-retrieval | Medium |
| 9 | Query Rewriting | Query Transform | Low |
| 10 | Step-back Prompting | Query Transform | Low |
| 11 | Sub-query Decomposition | Query Transform | Low |
| 12 | HyDE (Hypothetical Document Embedding) | Query Transform | Medium |
| 13 | HyPE (Hypothetical Prompt Embeddings) | Indexing | High |
| 14 | Hierarchical Indices | Indexing | High |
| 15 | Adaptive Retrieval | Routing | High |
| 16 | Self-RAG | Agentic | High |
| 17 | Corrective RAG (CRAG) | Agentic | High |
| 18 | GraphRAG | Graph | Very High |
| 19 | RAPTOR | Hierarchical Summarization | High |
| 20 | Document Augmentation | Indexing | High |
| 21 | Reliable RAG | Quality Control | Medium |
| 22 | Contextual Compression | Post-retrieval | Medium |
| 23 | Explainable Retrieval | Transparency | Medium |
| 24 | Retrieval with Feedback Loop | Continuous Learning | High |
| 25 | Agentic RAG (Contextual AI) | Agentic | High |
| 26 | MemoRAG | Memory | Very High |
| 27 | Dartboard RAG | Diversity | Medium |
| 28 | Relevant Segment Extraction (RSE) | Post-retrieval | Medium |
| 29 | JSON RAG | Structured Data | Low |
| 30 | Simple CSV RAG | Structured Data | Low |
| 31 | Microsoft GraphRAG | Graph | Very High |
| 32 | Multi-modal RAG (Captioning) | Multi-modal | High |
| 33 | Multi-modal RAG (ColPali) | Multi-modal | High |
| 34 | Graph RAG with Milvus | Graph | High |

---

## Basic RAG Patterns

### Simple RAG (Baseline)

The foundation pattern. Load → Chunk → Embed → Store → Retrieve → Answer.

```python
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

def encode_pdf(path, chunk_size=1000, chunk_overlap=200):
    loader = PyPDFLoader(path)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap, length_function=len
    )
    texts = text_splitter.split_documents(documents)
    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(texts, embeddings)
    return vectorstore

vectorstore = encode_pdf("doc.pdf", chunk_size=1000, chunk_overlap=200)
retriever = vectorstore.as_retriever(search_kwargs={"k": 2})
```

**Key parameters:**
- `chunk_size=1000`: characters per chunk (not tokens)
- `chunk_overlap=200`: overlap between consecutive chunks
- `k=2`: number of chunks to retrieve

### BM25 Retrieval (Keyword-based)

```python
from rank_bm25 import BM25Okapi
import numpy as np

def bm25_retrieval(bm25: BM25Okapi, cleaned_texts, query: str, k: int = 5):
    query_tokens = query.split()
    bm25_scores = bm25.get_scores(query_tokens)
    top_k_indices = np.argsort(bm25_scores)[::-1][:k]
    return [cleaned_texts[i] for i in top_k_indices]
```

### Simple CSV RAG

```python
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain_community.vectorstores import FAISS

loader = CSVLoader(file_path="data.csv")
docs = loader.load_and_split()
vector_store = FAISS.from_documents(docs, OpenAIEmbeddings())
retriever = vector_store.as_retriever()
```

### JSON RAG

Uses `jrag` library to extract specific fields from nested JSON via jsonpath-ng expressions:

```python
import jrag

jrag_config = {
    'Year': '$.year',
    'Category': '$.category',
    'Laureates': '$.laureates[*].full_name',
    'Motivation': '$.laureates[0].motivation'
}
text_to_embed = jrag.to_text(json_record, jrag_config)
# Outputs: "Year: 2024 | Category: chemistry | Laureates: [David Baker, ...]"
```

Then embed with `SentenceTransformer` + FAISS IndexFlatL2.

---

## Advanced RAG Techniques

### 1. Fusion Retrieval (Hybrid: BM25 + Vector)

Combines semantic similarity with keyword matching. `alpha` controls the balance (1.0 = pure vector, 0.0 = pure BM25).

```python
def fusion_retrieval(vectorstore, bm25, query: str, k: int = 5, alpha: float = 0.5):
    epsilon = 1e-8
    all_docs = vectorstore.similarity_search("", k=vectorstore.index.ntotal)

    # BM25 scores
    bm25_scores = bm25.get_scores(query.split())

    # Vector scores
    vector_results = vectorstore.similarity_search_with_score(query, k=len(all_docs))
    vector_scores = np.array([score for _, score in vector_results])

    # Normalize both to [0, 1]
    vector_scores = 1 - (vector_scores - np.min(vector_scores)) / (np.max(vector_scores) - np.min(vector_scores) + epsilon)
    bm25_scores = (bm25_scores - np.min(bm25_scores)) / (np.max(bm25_scores) - np.min(bm25_scores) + epsilon)

    # Weighted combination
    combined_scores = alpha * vector_scores + (1 - alpha) * bm25_scores
    sorted_indices = np.argsort(combined_scores)[::-1]
    return [all_docs[i] for i in sorted_indices[:k]]
```

**When to use:** Documents where exact keyword matches matter alongside semantic meaning. Good for technical docs, product names, IDs.

### 2. Hierarchical Indices

Two-tier search: summaries first, then drill into matching pages.

```python
async def encode_pdf_hierarchical(path, chunk_size=1000, chunk_overlap=200):
    loader = PyPDFLoader(path)
    documents = await asyncio.to_thread(loader.load)

    # Create page-level summaries using GPT-4
    summary_llm = ChatOpenAI(temperature=0, model_name="gpt-4o-mini")
    summary_chain = load_summarize_chain(summary_llm, chain_type="map_reduce")

    # ... batch summarize each page ...

    # Two vector stores: summaries + detailed chunks
    summary_vectorstore = FAISS.from_documents(summaries, embeddings)
    detailed_vectorstore = FAISS.from_documents(detailed_chunks, embeddings)
    return summary_vectorstore, detailed_vectorstore

def retrieve_hierarchical(query, summary_vectorstore, detailed_vectorstore, k_summaries=3, k_chunks=5):
    # First: find relevant summary pages
    top_summaries = summary_vectorstore.similarity_search(query, k=k_summaries)

    relevant_chunks = []
    for summary in top_summaries:
        page_number = summary.metadata["page"]
        # Then: get chunks only from those pages
        page_filter = lambda metadata: metadata["page"] == page_number
        page_chunks = detailed_vectorstore.similarity_search(query, k=k_chunks, filter=page_filter)
        relevant_chunks.extend(page_chunks)
    return relevant_chunks
```

**When to use:** Large documents (books, manuals) where a broad scan first saves time.

### 3. Adaptive Retrieval

Classifies query type and applies appropriate strategy. 4 strategies: Factual, Analytical, Opinion, Contextual.

```python
class QueryClassifier:
    def classify(self, query):
        # Uses LLM to return: "Factual" | "Analytical" | "Opinion" | "Contextual"
        ...

class AdaptiveRetriever:
    def __init__(self, texts):
        self.classifier = QueryClassifier()
        self.strategies = {
            "Factual": FactualRetrievalStrategy(texts),    # LLM enhances query, then rank by relevance
            "Analytical": AnalyticalRetrievalStrategy(texts),  # Generate sub-queries, ensure diversity
            "Opinion": OpinionRetrievalStrategy(texts),   # Find multiple viewpoints
            "Contextual": ContextualRetrievalStrategy(texts)  # Incorporate user context
        }

    def get_relevant_documents(self, query):
        category = self.classifier.classify(query)
        return self.strategies[category].retrieve(query)
```

### 4. Self-RAG

Multi-step RAG with self-evaluation at each stage. Decides whether to retrieve, evaluates relevance, assesses support, rates utility.

```python
def self_rag(query, vectorstore, top_k=3):
    # Step 1: Should we retrieve at all?
    retrieval_decision = retrieval_chain.invoke({"query": query}).response  # "yes" or "no"

    if retrieval_decision == 'yes':
        docs = vectorstore.similarity_search(query, k=top_k)

        # Step 2: Filter relevant docs
        relevant_contexts = []
        for context in [doc.page_content for doc in docs]:
            relevance = relevance_chain.invoke({"query": query, "context": context}).response
            if relevance == 'relevant':
                relevant_contexts.append(context)

        # Step 3: Generate + evaluate each response
        responses = []
        for context in relevant_contexts:
            response = generation_chain.invoke({"query": query, "context": context}).response
            support = support_chain.invoke({"response": response, "context": context}).response
            utility = utility_chain.invoke({"query": query, "response": response}).response
            responses.append((response, support, int(utility)))

        # Step 4: Pick best response (fully supported + highest utility)
        best = max(responses, key=lambda x: (x[1] == 'fully supported', x[2]))
        return best[0]
    else:
        return generation_chain.invoke({"query": query, "context": "No retrieval necessary."}).response
```

### 5. Corrective RAG (CRAG)

Uses relevance scoring to decide between: use document as-is (score > 0.7), do web search (score < 0.3), or combine both (ambiguous).

```python
def crag_process(query, faiss_index):
    retrieved_docs = retrieve_documents(query, faiss_index)
    eval_scores = [retrieval_evaluator(query, doc) for doc in retrieved_docs]
    max_score = max(eval_scores)

    if max_score > 0.7:
        final_knowledge = retrieved_docs[eval_scores.index(max_score)]
    elif max_score < 0.3:
        # Rewrite query for web, search DuckDuckGo, refine
        final_knowledge, sources = perform_web_search(query)
    else:
        # Combine best doc + web search results
        best_doc = retrieved_docs[eval_scores.index(max_score)]
        web_knowledge, web_sources = perform_web_search(query)
        final_knowledge = "\n".join(knowledge_refinement(best_doc) + web_knowledge)

    return generate_response(query, final_knowledge, sources)
```

### 6. GraphRAG

Builds a knowledge graph from documents. Nodes = chunks, edges = semantic similarity + shared concepts. Uses Dijkstra-like traversal to answer queries.

**Architecture:**
- `DocumentProcessor`: PDF → chunks + FAISS vector store
- `KnowledgeGraph`: Builds nx.Graph with nodes (chunks) and edges (similarity > 0.8 threshold)
- `QueryEngine`: Priority queue traversal of graph
- `Visualizer`: Shows traversal path

```python
# Edge weight formula
alpha, beta = 0.7, 0.3
edge_weight = alpha * similarity_score + beta * normalized_shared_concepts
```

**When to use:** Complex documents where connections between sections matter. Slower to build but better for multi-hop questions.

### 7. RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval)

Builds a multi-level tree of summaries using clustering. Bottom level = original chunks, higher levels = summaries of clusters.

```python
def build_raptor_tree(texts, max_levels=3):
    current_texts = texts
    for level in range(1, max_levels + 1):
        embeddings = embed_texts(current_texts)
        n_clusters = min(10, len(current_texts) // 2)
        cluster_labels = GaussianMixture(n_components=n_clusters).fit_predict(embeddings)

        # Summarize each cluster
        summaries = []
        for cluster in unique_labels:
            cluster_texts = [t for t, l in zip(current_texts, cluster_labels) if l == cluster]
            summaries.append(summarize_texts(cluster_texts))
        current_texts = summaries
    return tree_results
```

All levels stored in single FAISS vectorstore. Retrieval searches across all levels simultaneously.

### 8. MemoRAG

Uses a memory model (KV-cache simulation) to preprocess queries before retrieval. Especially useful for long documents and implicit queries.

```python
class MemoryStore:
    def memorize(self, document: str):
        # LLM extracts topic-detail KV pairs from document chunks
        # Stores in FAISS for retrieval
        ...

    def create_retrieval_queries(self, query: str):
        # Find relevant KV pairs from memory
        results = self.store.similarity_search_with_score(query, k=10)

        # Generate text spans (clues) and surrogate queries
        text_spans = llm(memorag_span_prompt.format(question=query, relevant_info=results))
        surrogate_queries = llm(memorag_sur_prompt.format(question=query, relevant_info=results))

        # Return combined list of retrieval queries
        return text_spans + surrogate_queries + [query]

def process_query(query, memory_store, vectorstore):
    # y = Θ_mem(q, D | θ_mem)
    retrieval_queries = memory_store.create_retrieval_queries(query)

    # c = Γ(y, D | γ)
    all_contexts = []
    for rq in retrieval_queries:
        all_contexts.extend(retrieve_context(rq, vectorstore, k=3))

    # y = Θ(q, c | θ)
    return generate_answer(query, list(dict.fromkeys(all_contexts)))
```

**Performance:** Showed substantial improvements on long-context tasks (600-page books) vs simple RAG.

---

## Chunking Strategies

### 1. Fixed-size Chunking (Baseline)

```python
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len
)
```

**Overlap rule of thumb:** 20% of chunk_size. Tested chunk sizes: 128, 256, 512, 1000.

### 2. Semantic Chunking

Splits at natural semantic boundaries rather than fixed character counts. Three breakpoint methods:

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai.embeddings import OpenAIEmbeddings

# Breakpoint types:
# - 'percentile': splits at differences > X percentile
# - 'standard_deviation': splits at differences > X std devs
# - 'interquartile': uses IQR distance

text_splitter = SemanticChunker(
    OpenAIEmbeddings(),
    breakpoint_threshold_type='percentile',
    breakpoint_threshold_amount=90
)
docs = text_splitter.create_documents([content])
```

**Advantage:** Preserves coherent ideas within each chunk. Better for complex documents.

### 3. Contextual Chunk Headers (CCH)

Prepend document title (and optionally summary) to each chunk before embedding.

```python
def get_document_title(document_text: str) -> str:
    # Ask LLM to generate/extract document title
    prompt = "What is the title of the following document?\n{document_text}"
    return llm(prompt)

# Embedding text = "Document Title: NIKE 2023 Annual Report\n\n{chunk_text}"
chunk_with_header = f"Document Title: {document_title}\n\n{chunk_text}"
```

**KITE Benchmark Results (CCH):**
| Dataset | Without CCH | With CCH |
|---------|-------------|----------|
| AI Papers | 4.5 | 4.7 |
| BVP Cloud | 2.6 | 6.3 |
| Sourcegraph | 5.7 | 5.8 |
| Supreme Court | 6.1 | 7.4 |
| **Average** | **4.72** | **6.04** (+27.9%) |

**Key insight from demo:** A chunk about Nike climate risk had 0.10 similarity to "Nike climate change impact" without the header, and 0.92 similarity WITH the title prepended.

### 4. Proposition Chunking

Breaks text into atomic, self-contained factual statements using LLM. Each proposition must be:
1. Single fact
2. Understandable without context
3. Uses full names (no pronouns)
4. Includes dates/qualifiers
5. One subject-predicate relationship

```python
class GeneratePropositions(BaseModel):
    propositions: List[str] = Field(...)

# Use LLM with few-shot examples to generate propositions
# Then quality-check each proposition (accuracy, clarity, completeness, conciseness)
# Threshold: 7/10 on all dimensions

class GradePropositions(BaseModel):
    accuracy: int      # 1-10
    clarity: int       # 1-10
    completeness: int  # 1-10
    conciseness: int   # 1-10
```

**Proposition vs Chunk comparison:**
| Aspect | Propositions | Chunks |
|--------|-------------|--------|
| Precision | High | Medium |
| Context | Low | High |
| Best for | Factoid queries | Complex queries |
| Info overload | Low | High |

### 5. Context Enrichment Window

Retrieve chunk by semantic similarity, then pad with N neighbors on each side.

```python
def split_text_to_chunks_with_indices(text, chunk_size, chunk_overlap):
    # Tag each chunk with its sequential index
    chunks.append(Document(page_content=chunk, metadata={"index": len(chunks), "text": text}))

def retrieve_with_context_overlap(vectorstore, retriever, query, num_neighbors=1, chunk_size=200, chunk_overlap=20):
    relevant_chunks = retriever.get_relevant_documents(query)
    for chunk in relevant_chunks:
        current_index = chunk.metadata.get('index')
        start_index = max(0, current_index - num_neighbors)
        end_index = current_index + num_neighbors + 1

        # Get neighbor chunks, sort by index, concatenate accounting for overlap
        neighbor_chunks = [get_chunk_by_index(vectorstore, i) for i in range(start_index, end_index)]
        # ... concatenate with overlap removal ...
```

### 6. Relevant Segment Extraction (RSE)

Post-retrieval technique: finds the best contiguous segments from clusters of relevant chunks. Solves a variant of the maximum sum subarray problem.

```python
irrelevant_chunk_penalty = 0.2  # chunks scoring below this threshold hurt segment score
relevance_values = [v - irrelevant_chunk_penalty for v in chunk_values]

def get_best_segments(relevance_values, max_length=20, overall_max_length=30, minimum_value=0.7):
    # Greedy search: find segments that maximize sum of relevance values
    # Skips negative starts/ends
    # Avoids overlapping segments
    ...
```

**KITE Benchmark Results (RSE):**
| Dataset | Top-k | RSE |
|---------|-------|-----|
| AI Papers | 4.5 | 7.9 |
| BVP Cloud | 2.6 | 4.4 |
| Sourcegraph | 5.7 | 6.6 |
| Supreme Court | 6.1 | 8.0 |
| **Average** | **4.72** | **6.73** (+42.6%) |

**Key insight:** Uses Cohere reranker + exponential rank decay to compute chunk values.

---

## Embedding & Retrieval Methods

### Embedding Providers (from helper_functions.py)

```python
from enum import Enum

class EmbeddingProvider(Enum):
    OPENAI = "openai"
    COHERE = "cohere"
    AMAZON_BEDROCK = "bedrock"

def get_langchain_embedding_provider(provider, model_id=None):
    if provider == EmbeddingProvider.OPENAI:
        return OpenAIEmbeddings()
    elif provider == EmbeddingProvider.COHERE:
        return CohereEmbeddings()
    elif provider == EmbeddingProvider.AMAZON_BEDROCK:
        return BedrockEmbeddings(model_id=model_id or "amazon.titan-embed-text-v2:0")
```

### HyDE (Hypothetical Document Embedding)

Generate a full hypothetical answer document, then embed THAT for retrieval instead of the raw query.

```python
class HyDERetriever:
    def __init__(self, files_path, chunk_size=500, chunk_overlap=100):
        self.hyde_prompt = PromptTemplate(
            template="""Given the question '{query}', generate a hypothetical document that directly answers this question.
            The document should be detailed and in-depth. Size: exactly {chunk_size} characters."""
        )

    def retrieve(self, query, k=3):
        # Generate hypothetical document
        hypothetical_doc = self.hyde_chain.invoke({"query": query, "chunk_size": self.chunk_size}).content
        # Use hypothetical doc as search query
        similar_docs = self.vectorstore.similarity_search(hypothetical_doc, k=k)
        return similar_docs, hypothetical_doc
```

**Intuition:** The hypothetical doc lives in the same embedding space as real docs, bridging the query-document gap.

### HyPE (Hypothetical Prompt Embeddings)

Reverse of HyDE: instead of expanding the query at search time, generate questions FOR each chunk AT INDEX TIME.

```python
def generate_hypothetical_prompt_embeddings(chunk_text: str):
    # LLM generates key questions this chunk would answer
    questions = question_chain.invoke({"chunk_text": chunk_text})
    # Embed each question
    vectors = embedding_model.embed_documents(questions)
    return chunk_text, vectors

# Store each chunk MULTIPLE TIMES (once per generated question)
for chunk, vectors in results:
    for vec in vectors:
        vector_store.add_embeddings([(chunk.page_content, vec)])
```

**Advantage:** No runtime overhead vs HyDE. Up to 42pp improvement in retrieval precision, 45pp in claim recall (per paper).

---

## Re-ranking & Filtering

### Method 1: LLM-based Reranking

```python
class RatingScore(BaseModel):
    relevance_score: float = Field(..., description="Relevance score 1-10")

def rerank_documents(query: str, docs: List[Document], top_n: int = 3):
    prompt_template = PromptTemplate(
        template="""On a scale of 1-10, rate the relevance of the following document to the query.
        Query: {query}
        Document: {doc}
        Relevance Score:"""
    )
    llm_chain = prompt_template | ChatOpenAI(temperature=0, model="gpt-4o").with_structured_output(RatingScore)

    scored_docs = [(doc, float(llm_chain.invoke({"query": query, "doc": doc.page_content}).relevance_score))
                   for doc in docs]
    return [doc for doc, _ in sorted(scored_docs, key=lambda x: x[1], reverse=True)[:top_n]]
```

### Method 2: Cross-Encoder Reranking

```python
from sentence_transformers import CrossEncoder

cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

class CrossEncoderRetriever(BaseRetriever):
    def get_relevant_documents(self, query):
        initial_docs = self.vectorstore.similarity_search(query, k=self.k)
        pairs = [[query, doc.page_content] for doc in initial_docs]
        scores = self.cross_encoder.predict(pairs)
        scored = sorted(zip(initial_docs, scores), key=lambda x: x[1], reverse=True)
        return [doc for doc, _ in scored[:self.rerank_top_k]]
```

**LLM vs Cross-Encoder:** Cross-encoder is faster and cheaper at inference, but LLM is more flexible. Both dramatically outperform cosine similarity alone — demonstrated with the France capital example where basic retrieval returns "The capital of France is great" (semantically similar but wrong) while reranking returns the chunk that actually explains Paris.

### Contextual Compression

Extract only the relevant portions from retrieved chunks:

```python
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain.retrievers import ContextualCompressionRetriever

compressor = LLMChainExtractor.from_llm(ChatOpenAI(model="gpt-4o-mini"))
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=base_retriever
)
```

### Dartboard RAG (Relevance + Diversity)

Prevents redundant top-k results when the database is dense. Uses a greedy selection algorithm balancing relevance and diversity.

```python
DIVERSITY_WEIGHT = 1.0
RELEVANCE_WEIGHT = 1.0
SIGMA = 0.1  # Smoothing

def greedy_dartsearch(query_distances, document_distances, documents, num_results):
    # Convert distances to log-normal probabilities
    query_probabilities = lognorm(query_distances, sigma)
    document_probabilities = lognorm(document_distances, sigma)

    # Start with most relevant doc
    selected_indices = [np.argmax(query_probabilities)]
    max_distances = document_probabilities[selected_indices[0]]

    while len(selected_indices) < num_results:
        # Combined score = diversity from selected + relevance to query
        updated_distances = np.maximum(max_distances, document_probabilities)
        combined_scores = updated_distances * DIVERSITY_WEIGHT + query_probabilities * RELEVANCE_WEIGHT
        normalized_scores = logsumexp(combined_scores, axis=1)
        normalized_scores[selected_indices] = -np.inf  # Mask already selected

        best_idx = np.argmax(normalized_scores)
        max_distances = updated_distances[best_idx]
        selected_indices.append(best_idx)

    return [documents[i] for i in selected_indices]
```

---

## Evaluation Methods

### Evaluation Stack

The repo uses `deepeval` for formal evaluation with three metrics:

```python
from deepeval.metrics import GEval, FaithfulnessMetric, ContextualRelevancyMetric

correctness_metric = GEval(
    name="Correctness",
    model="gpt-4-turbo",
    evaluation_params=[LLMTestCaseParams.EXPECTED_OUTPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
    evaluation_steps=["Determine whether the actual output is factually correct based on the expected output."]
)

faithfulness_metric = FaithfulnessMetric(threshold=0.7, model="gpt-4-turbo")
relevance_metric = ContextualRelevancyMetric(threshold=1, model="gpt-4-turbo")
```

### Quick Evaluation (used in most notebooks)

```python
def evaluate_rag(retriever, num_questions=5):
    # Generates questions about the document using LLM
    # Retrieves context for each
    # Scores Relevance (1-5), Completeness (1-5), Conciseness (1-5)
    # Returns JSON results
    ...
```

### Chunk Size Evaluation (LlamaIndex)

```python
# Tests chunk sizes: 128, 256, 512, 1024...
def evaluate_response_time_and_accuracy(chunk_size, eval_questions):
    Settings.chunk_size = chunk_size
    Settings.chunk_overlap = chunk_size // 5
    vector_index = VectorStoreIndex.from_documents(documents)
    query_engine = vector_index.as_query_engine(similarity_top_k=5)

    # Measures: avg response time, faithfulness, relevancy
    # Uses GPT-4 to evaluate faithfulness and relevancy
    # Uses GPT-3.5-turbo to generate responses
```

### Reliable RAG (Hallucination Detection)

```python
# Step 1: Retrieve docs
# Step 2: Grade each doc for relevance (binary: yes/no)
class GradeDocuments(BaseModel):
    binary_score: str  # "yes" or "no"

# Step 3: Generate answer
# Step 4: Check for hallucinations
class GradeHallucinations(BaseModel):
    binary_score: str  # "yes" = grounded, "no" = hallucinated

# Step 5: Highlight exact source segments used
class HighlightDocuments(BaseModel):
    id: List[str]
    title: List[str]
    source: List[str]
    segment: List[str]  # verbatim snippets from docs
```

---

## Code Patterns & Examples

### Pattern 1: Standard Pipeline Template

```python
# The default stack across 90% of notebooks
path = "data/document.pdf"
vectorstore = encode_pdf(path, chunk_size=1000, chunk_overlap=200)
retriever = vectorstore.as_retriever(search_kwargs={"k": 2})
context = retrieve_context_per_question(query, retriever)
answer = answer_question_from_context(query, context, qa_chain)
```

### Pattern 2: Rate Limiting with Exponential Backoff

```python
import asyncio, random
from openai import RateLimitError

async def exponential_backoff(attempt):
    wait_time = (2 ** attempt) + random.uniform(0, 1)
    await asyncio.sleep(wait_time)

async def retry_with_exponential_backoff(coroutine, max_retries=5):
    for attempt in range(max_retries):
        try:
            return await coroutine
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise e
            await exponential_backoff(attempt)
```

### Pattern 3: Structured LLM Output

All the notebooks use Pydantic BaseModel + `.with_structured_output()`:

```python
from pydantic import BaseModel, Field

class RelevanceScore(BaseModel):
    score: float = Field(..., description="Relevance score 1-10")

llm = ChatOpenAI(temperature=0, model="gpt-4o")
chain = prompt | llm.with_structured_output(RelevanceScore)
result = chain.invoke({"query": q, "doc": d})
score = result.score
```

### Pattern 4: Query Transformations

```python
# 1. Query Rewriting (more specific)
query_rewrite_template = """Rewrite this query to be more specific and likely to retrieve relevant info.
Original: {original_query}
Rewritten:"""

# 2. Step-back Prompting (broader context)
step_back_template = """Generate a broader, more general query for background context.
Original: {original_query}
Step-back:"""

# 3. Sub-query Decomposition (complex → simple)
subquery_template = """Decompose into 2-4 simpler sub-queries.
Original: {original_query}
Sub-queries:
1. ..."""
```

### Pattern 5: Document Augmentation via Question Generation

```python
def generate_questions(text: str) -> List[str]:
    # LLM generates 40 questions that text could answer
    # These questions are embedded alongside original text
    # When user queries, their question matches the pre-generated questions better
    ...

# Store both originals AND augmented questions in FAISS
for text_document in text_documents:
    for fragment in text_fragments:
        documents.append(Document(page_content=fragment, metadata={"type": "ORIGINAL"}))
    questions = generate_questions(text_document)
    for q in questions:
        documents.append(Document(page_content=q, metadata={"type": "AUGMENTED", "text": text_document}))
```

### Pattern 6: Feedback Loop

```python
# Collect feedback
feedback = {"query": q, "response": r, "relevance": 5, "quality": 4}
store_feedback(feedback)  # JSON file

# Adjust future retrievals based on feedback
def adjust_relevance_scores(query, docs, feedback_data):
    for doc in docs:
        relevant_feedback = [f for f in feedback_data if llm_says_relevant(query, f)]
        if relevant_feedback:
            avg_relevance = sum(f['relevance'] for f in relevant_feedback) / len(relevant_feedback)
            doc.metadata['relevance_score'] *= (avg_relevance / 3)  # 3 = neutral on 1-5 scale

# Periodic fine-tuning: add high-quality Q&A pairs to index
def fine_tune_index(feedback_data, texts):
    good_responses = [f for f in feedback_data if f['relevance'] >= 4 and f['quality'] >= 4]
    additional_texts = [f['query'] + " " + f['response'] for f in good_responses]
    return encode_from_string(" ".join(texts + additional_texts))
```

### Pattern 7: Explainable Retrieval

```python
class ExplainableRetriever:
    def retrieve_and_explain(self, query):
        docs = self.retriever.get_relevant_documents(query)
        explained_results = []
        for doc in docs:
            explanation = self.explain_chain.invoke({"query": query, "context": doc.page_content}).content
            explained_results.append({"content": doc.page_content, "explanation": explanation})
        return explained_results
```

---

## What We Can Reuse

### Immediately Reusable Components

1. **`helper_functions.py`** — Drop-in utility library:
   - `encode_pdf()` — PDF → FAISS vectorstore
   - `encode_from_string()` — String → FAISS vectorstore
   - `bm25_retrieval()` — BM25 keyword search
   - `get_langchain_embedding_provider()` — Multi-provider embedding factory
   - `retry_with_exponential_backoff()` — Rate limit handling
   - `replace_t_with_space()` — PDF text cleaning

2. **Fusion retrieval function** — Direct copy-paste ready. The `alpha=0.5` default is a good starting point.

3. **Cross-encoder reranker class** — `cross-encoder/ms-marco-MiniLM-L-6-v2` is free, fast, works offline.

4. **Structured output patterns** — All the Pydantic + `with_structured_output()` patterns are battle-tested.

5. **Evaluation pipeline** — The deepeval metrics (correctness, faithfulness, contextual relevancy) are the right framework.

### High-Value for Marketing/Sales Use Cases

| Technique | Use Case | Priority |
|-----------|----------|----------|
| Contextual Chunk Headers | Product docs, company knowledge base | HIGH |
| Relevant Segment Extraction | Long contract/document review | HIGH |
| Fusion Retrieval | Product search (keyword + semantic) | HIGH |
| HyPE | FAQ systems, customer support | HIGH |
| Query Rewriting | Improve search quality for user queries | HIGH |
| Sub-query Decomposition | Complex B2B qualification questions | MEDIUM |
| Feedback Loop | Improving retrieval based on sales outcomes | MEDIUM |
| Dartboard RAG | When docs have lots of repetitive content | MEDIUM |
| Self-RAG | High-stakes responses (pricing, contracts) | MEDIUM |
| CRAG | Mixed knowledge base + live web search | MEDIUM |
| Adaptive Retrieval | Multi-type query chatbots | LOW |
| GraphRAG | Complex product ecosystems | LOW |
| MemoRAG | Very long document corpora (books, manuals) | LOW |

---

## Lessons & Best Practices

### Chunking

1. **Start with 1000 chars / 200 overlap** — Good default. Test smaller (256-512) for fact-heavy docs, larger (1500+) for narrative docs.
2. **Always use overlap** — 20% of chunk size is the default. Prevents splitting mid-sentence.
3. **Add contextual headers** — The CCH experiment shows +27.9% improvement just from prepending document title. Almost zero cost.
4. **No overlap for RSE** — RSE specifically requires `chunk_overlap=0` to reconstruct clean segments.
5. **Proposition chunking is expensive** — Requires LLM call per chunk + quality check. Good for critical knowledge bases, overkill for simple search.

### Retrieval

1. **BM25 as a free booster** — Fusion retrieval (50/50 BM25 + vector) consistently outperforms pure vector. BM25 is essentially free to add.
2. **Rerank with Cross-Encoder before LLM** — Cheap, fast, big improvement. Retrieve k=30, rerank to top 5 before sending to LLM.
3. **Context window matters** — The France example proves cosine similarity alone is insufficient for "is this actually answering the question." Always rerank.
4. **Dartboard for dense corpora** — If you have duplicate/near-duplicate content (common in product catalogs), Dartboard prevents returning the same chunk 5 times.

### Query

1. **Query rewriting is almost always worth it** — One extra LLM call turns "what's the pricing" into "What are the specific pricing tiers, discount structures, and volume pricing for [product]?"
2. **Sub-queries for complex questions** — Instead of one retrieval, decompose into 3-4 sub-queries and merge. Better for "compare X vs Y" type questions.
3. **HyPE > HyDE for production** — HyDE requires LLM call per user query. HyPE moves that cost to indexing time. Better for high-volume.

### Architecture

1. **Modular retriever classes** — All the `BaseRetriever` subclass patterns make it easy to swap components.
2. **Save vectorstores locally** — `FAISS.save_local()` / `FAISS.load_local()` prevents re-embedding on restart.
3. **Async for hierarchical** — Use asyncio for concurrent summarization when building hierarchical indices.
4. **Batching for rate limits** — Batch LLM calls in groups of 5, use exponential backoff.
5. **Pydantic for all LLM outputs** — Structured outputs prevent parsing failures. Use `with_structured_output()` everywhere.

### Evaluation

1. **3 core metrics:** Correctness, Faithfulness, Contextual Relevancy
2. **Faithfulness vs correctness:** Faithfulness checks if the answer matches the retrieved context (is it grounded?). Correctness checks if the answer matches ground truth.
3. **Human feedback loop:** Store query + response + ratings. Fine-tune index periodically with high-quality Q&A pairs.
4. **Test at multiple chunk sizes** — Don't just pick one. The choose_chunk_size notebook tests 128, 256 and compares faithfulness + relevancy scores.

### Stack Recommendations

```
# Minimum viable production RAG
PDF → RecursiveCharacterTextSplitter(1000/200)
    + Contextual Chunk Headers
    → OpenAI text-embedding-3-small
    → FAISS
    → Fusion Retrieval (BM25 + vector, alpha=0.5)
    → Cross-Encoder Reranker
    → GPT-4o-mini

# Advanced production RAG
PDF → Semantic Chunking + CCH
    → HyPE (precompute question embeddings)
    → FAISS
    → Fusion Retrieval
    → Cohere Reranker v3
    → RSE (Relevant Segment Extraction)
    → Contextual Compression
    → GPT-4o
    + Feedback Loop
    + Hallucination detection
```

---

## References

- **NirDiamant/RAG_Techniques** GitHub repo
- CCH + RSE eval: KITE benchmark (D-Star-AI), FinanceBench (83% with CCH+RSE vs 19% baseline)
- Proposition Chunking: [Chen et al., 2023](https://doi.org/10.48550/arXiv.2312.06648)
- HyPE: [preprint](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5139335) — up to 42pp retrieval precision improvement
- Dartboard RAG: ["Better RAG using Relevant Information Gain"](https://arxiv.org/abs/2407.12101)
- MemoRAG: Qwen2-7B or Mistral-7B as memory model, kv-cache compression
