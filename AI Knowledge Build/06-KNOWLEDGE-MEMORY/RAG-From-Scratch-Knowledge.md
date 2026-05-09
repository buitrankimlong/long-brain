---
tags: [knowledge, rag, from-scratch, retrieval, implementation]
source_repo: rag-from-scratch
---

# RAG from Scratch - Knowledge Extraction

> Source: `C:\AI Build Learning\rag-from-scratch\` (LangChain official repo)
> Notebooks: Parts 1-18 covering full RAG landscape from basics to advanced patterns
> Video playlist: https://youtube.com/playlist?list=PLfaIDFEXuae2LXbO1_PKyVJiQ23ZztA0x

---

## Overview & Approach

RAG (Retrieval Augmented Generation) solves a core LLM limitation: models are trained on a fixed corpus and cannot reason about private or recent information. Fine-tuning is NOT the answer for factual recall - it is expensive and poor at memorizing facts. RAG uses in-context learning by retrieving relevant documents and injecting them into the prompt at inference time.

The repo builds RAG understanding in 18 parts, organized into 4 phases:
1. **Indexing** (Parts 1-4): Load, split, embed, store documents
2. **Query Transformation** (Parts 5-9): Rewrite/modify questions before retrieval
3. **Routing & Query Construction** (Parts 10-11): Direct queries to right sources
4. **Advanced Indexing & Retrieval** (Parts 12-18): Multi-rep, RAPTOR, ColBERT, re-ranking, CRAG, Self-RAG

---

## RAG Architecture Components

### The 3 Core Phases
```
INDEXING:    Documents -> Loader -> Splitter -> Embedder -> VectorStore
RETRIEVAL:   Query -> [Transform] -> VectorStore.search() -> Relevant Docs
GENERATION:  {context: docs, question: query} -> Prompt -> LLM -> Answer
```

### Key Components
| Component | Role | LangChain Class |
|-----------|------|----------------|
| Document Loader | Load raw content (web, PDF, YouTube) | `WebBaseLoader`, `YoutubeLoader` |
| Text Splitter | Chunk documents into pieces | `RecursiveCharacterTextSplitter` |
| Embeddings | Convert text to vectors | `OpenAIEmbeddings` |
| Vector Store | Store & search embeddings | `Chroma` |
| Retriever | Interface to search vectorstore | `vectorstore.as_retriever()` |
| LLM | Generate final answer | `ChatOpenAI` |
| Prompt | Structure context + question | `ChatPromptTemplate` |

---

## Step-by-step Implementation

### Part 1: Full RAG Pipeline (Quickstart)

Complete end-to-end RAG in ~20 lines:

```python
import bs4
from langchain import hub
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader
from langchain_community.vectorstores import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

#### INDEXING ####
loader = WebBaseLoader(
    web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent/",),
    bs_kwargs=dict(
        parse_only=bs4.SoupStrainer(
            class_=("post-content", "post-title", "post-header")
        )
    ),
)
docs = loader.load()

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_documents(docs)

vectorstore = Chroma.from_documents(documents=splits, embedding=OpenAIEmbeddings())
retriever = vectorstore.as_retriever()

#### RETRIEVAL and GENERATION ####
prompt = hub.pull("rlm/rag-prompt")
llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

rag_chain.invoke("What is Task Decomposition?")
```

---

## Indexing & Embedding Patterns

### Part 2: Indexing Deep Dive

**Token counting** (important for chunk size planning):
```python
import tiktoken

def num_tokens_from_string(string: str, encoding_name: str) -> int:
    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

# cl100k_base = encoding for GPT-3.5/GPT-4
num_tokens_from_string("Hello world", "cl100k_base")
```

**Cosine similarity from scratch**:
```python
import numpy as np

def cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    return dot_product / (norm_vec1 * norm_vec2)

# 1.0 = identical, 0 = orthogonal, -1 = opposite
embd = OpenAIEmbeddings()
query_result = embd.embed_query("What kinds of pets do I like?")
document_result = embd.embed_query("My favorite pet is a cat.")
similarity = cosine_similarity(query_result, document_result)
```

**Recommended splitter** (RecursiveCharacterTextSplitter):
- Splits on `["\n\n", "\n", " ", ""]` in order
- Keeps paragraphs -> sentences -> words together
- `from_tiktoken_encoder` counts tokens accurately (not chars)

```python
text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
    chunk_size=300,
    chunk_overlap=50
)
splits = text_splitter.split_documents(blog_docs)
```

**Vectorstore indexing**:
```python
vectorstore = Chroma.from_documents(documents=splits, embedding=OpenAIEmbeddings())
retriever = vectorstore.as_retriever(search_kwargs={"k": 1})  # k = number of docs to return
```

### Part 12: Multi-Representation Indexing

Key insight: **Index summaries for retrieval, return full documents for generation**.

```python
import uuid
from langchain_core.documents import Document
from langchain.storage import InMemoryByteStore
from langchain.retrievers.multi_vector import MultiVectorRetriever

# Step 1: Generate summaries of full documents
chain = (
    {"doc": lambda x: x.page_content}
    | ChatPromptTemplate.from_template("Summarize the following document:\n\n{doc}")
    | ChatOpenAI(model="gpt-3.5-turbo", max_retries=0)
    | StrOutputParser()
)
summaries = chain.batch(docs, {"max_concurrency": 5})

# Step 2: Store summaries in vectorstore, full docs in docstore
vectorstore = Chroma(collection_name="summaries", embedding_function=OpenAIEmbeddings())
store = InMemoryByteStore()
id_key = "doc_id"

retriever = MultiVectorRetriever(
    vectorstore=vectorstore,
    byte_store=store,
    id_key=id_key,
)

doc_ids = [str(uuid.uuid4()) for _ in docs]

# Link summaries to original docs via doc_id
summary_docs = [
    Document(page_content=s, metadata={id_key: doc_ids[i]})
    for i, s in enumerate(summaries)
]

retriever.vectorstore.add_documents(summary_docs)
retriever.docstore.mset(list(zip(doc_ids, docs)))

# Retrieval: searches summaries but returns full docs
retrieved_docs = retriever.get_relevant_documents("Memory in agents")
```

**Why this works**: Compact summaries improve retrieval precision. Full docs give LLM complete context for generation.

### Part 13: RAPTOR (Recursive Abstractive Processing)

RAPTOR builds a hierarchical tree of document summaries:
- Cluster similar chunks
- Summarize each cluster
- Repeat recursively
- Index all levels (leaves + summaries)

This enables retrieval at multiple levels of abstraction. Full code: https://github.com/langchain-ai/langchain/blob/master/cookbook/RAPTOR.ipynb

### Part 14: ColBERT (Late Interaction Retrieval)

ColBERT produces **per-token embeddings** (not single document embedding):
- Each token in doc gets its own contextual vector
- Each token in query gets its own vector
- Score = sum of max-similarity of each query token to any doc token
- Much more expressive than single-vector similarity

```python
from ragatouille import RAGPretrainedModel

RAG = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")

# Index documents
RAG.index(
    collection=[full_document],
    index_name="my-index",
    max_document_length=180,
    split_documents=True,
)

# Search
results = RAG.search(query="What animation studio did Miyazaki found?", k=3)

# Use as LangChain retriever
retriever = RAG.as_langchain_retriever(k=3)
```

---

## Retrieval Strategies

### Part 3: Basic Retrieval
```python
retriever = vectorstore.as_retriever(search_kwargs={"k": 1})
docs = retriever.get_relevant_documents("What is Task Decomposition?")
```

### Part 15: Re-ranking with RRF and Cohere

**Reciprocal Rank Fusion (RRF)** - combine multiple ranked lists:
```python
from langchain.load import dumps, loads

def reciprocal_rank_fusion(results: list[list], k=60):
    """Takes multiple lists of ranked documents, returns fused ranking."""
    fused_scores = {}
    for docs in results:
        for rank, doc in enumerate(docs):
            doc_str = dumps(doc)
            if doc_str not in fused_scores:
                fused_scores[doc_str] = 0
            # RRF formula: 1 / (rank + k)
            fused_scores[doc_str] += 1 / (rank + k)

    reranked_results = [
        (loads(doc), score)
        for doc, score in sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
    ]
    return reranked_results
```

**Cohere Re-rank** (neural re-ranking):
```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CohereRerank

retriever = vectorstore.as_retriever(search_kwargs={"k": 10})
compressor = CohereRerank()
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=retriever
)
compressed_docs = compression_retriever.get_relevant_documents(question)
```

---

## Query Transformation Strategies (Parts 5-9)

These are the most powerful RAG improvements. The core idea: **the user's original question is often a poor retrieval query**. Transform it before retrieval.

### Part 5: Multi-Query (Different Perspectives)

Generate 5 different versions of the question to overcome limitations of distance-based similarity search:

```python
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain.load import dumps, loads

template = """You are an AI language model assistant. Your task is to generate five
different versions of the given user question to retrieve relevant documents from a vector
database. By generating multiple perspectives on the user question, your goal is to help
the user overcome some of the limitations of the distance-based similarity search.
Provide these alternative questions separated by newlines. Original question: {question}"""
prompt_perspectives = ChatPromptTemplate.from_template(template)

generate_queries = (
    prompt_perspectives
    | ChatOpenAI(temperature=0)
    | StrOutputParser()
    | (lambda x: x.split("\n"))
)

def get_unique_union(documents: list[list]):
    """Unique union of retrieved docs - deduplicates across multiple retrievals."""
    flattened_docs = [dumps(doc) for sublist in documents for doc in sublist]
    unique_docs = list(set(flattened_docs))
    return [loads(doc) for doc in unique_docs]

# Full chain: generate queries -> retrieve for each -> deduplicate
question = "What is task decomposition for LLM agents?"
retrieval_chain = generate_queries | retriever.map() | get_unique_union
docs = retrieval_chain.invoke({"question": question})

# Final RAG chain
from operator import itemgetter
template = """Answer the following question based on this context:
{context}
Question: {question}
"""
prompt = ChatPromptTemplate.from_template(template)
llm = ChatOpenAI(temperature=0)

final_rag_chain = (
    {"context": retrieval_chain, "question": itemgetter("question")}
    | prompt
    | llm
    | StrOutputParser()
)
final_rag_chain.invoke({"question": question})
```

### Part 6: RAG-Fusion (Multi-Query + RRF)

Generate multiple queries then use RRF to re-rank results:

```python
template = """You are a helpful assistant that generates multiple search queries based on a single input query. \n
Generate multiple search queries related to: {question} \n
Output (4 queries):"""
prompt_rag_fusion = ChatPromptTemplate.from_template(template)

generate_queries = (
    prompt_rag_fusion
    | ChatOpenAI(temperature=0)
    | StrOutputParser()
    | (lambda x: x.split("\n"))
)

# Chain: generate 4 queries -> retrieve for each -> RRF re-rank
retrieval_chain_rag_fusion = generate_queries | retriever.map() | reciprocal_rank_fusion

final_rag_chain = (
    {"context": retrieval_chain_rag_fusion, "question": itemgetter("question")}
    | prompt
    | llm
    | StrOutputParser()
)
```

### Part 7: Decomposition (Break into Sub-questions)

Two approaches to decomposition:

**Approach A: Answer Recursively** (each answer informs next question)
```python
template = """You are a helpful assistant that generates multiple sub-questions related to an input question. \n
The goal is to break down the input into a set of sub-problems / sub-questions that can be answers in isolation. \n
Generate multiple search queries related to: {question} \n
Output (3 queries):"""
prompt_decomposition = ChatPromptTemplate.from_template(template)

generate_queries_decomposition = (
    prompt_decomposition | llm | StrOutputParser() | (lambda x: x.split("\n"))
)

# Answer each sub-question, accumulate Q&A context for next question
decomposition_prompt = ChatPromptTemplate.from_template("""Here is the question you need to answer:
\n --- \n {question} \n --- \n
Here is any available background question + answer pairs:
\n --- \n {q_a_pairs} \n --- \n
Here is additional context relevant to the question:
\n --- \n {context} \n --- \n
Use the above context and any background question + answer pairs to answer the question: \n {question}
""")

def format_qa_pair(question, answer):
    return f"Question: {question}\nAnswer: {answer}".strip()

q_a_pairs = ""
for q in questions:
    rag_chain = (
        {"context": itemgetter("question") | retriever,
         "question": itemgetter("question"),
         "q_a_pairs": itemgetter("q_a_pairs")}
        | decomposition_prompt
        | llm
        | StrOutputParser()
    )
    answer = rag_chain.invoke({"question": q, "q_a_pairs": q_a_pairs})
    q_a_pairs = q_a_pairs + "\n---\n" + format_qa_pair(q, answer)
```

**Approach B: Answer Individually** (all sub-questions answered in parallel, then synthesized)
```python
def retrieve_and_rag(question, prompt_rag, sub_question_generator_chain):
    """RAG on each sub-question independently."""
    sub_questions = sub_question_generator_chain.invoke({"question": question})
    rag_results = []
    for sub_question in sub_questions:
        retrieved_docs = retriever.get_relevant_documents(sub_question)
        answer = (prompt_rag | llm | StrOutputParser()).invoke({
            "context": retrieved_docs,
            "question": sub_question
        })
        rag_results.append(answer)
    return rag_results, sub_questions

answers, questions = retrieve_and_rag(question, prompt_rag, generate_queries_decomposition)

# Synthesize all Q&A pairs into final answer
context = format_qa_pairs(questions, answers)
synthesis_prompt = ChatPromptTemplate.from_template("""Here is a set of Q+A pairs:
{context}
Use these to synthesize an answer to the question: {question}
""")
final_rag_chain = synthesis_prompt | llm | StrOutputParser()
```

### Part 8: Step Back Prompting

Abstract the specific question to a more general one, retrieve for both, use both contexts:

```python
from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate

# Few-shot examples teach the model to "step back"
examples = [
    {"input": "Could the members of The Police perform lawful arrests?",
     "output": "what can the members of The Police do?"},
    {"input": "Jan Sindel's was born in what country?",
     "output": "what is Jan Sindel's personal history?"},
]

example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}"),
])
few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    examples=examples,
)
step_back_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert at world knowledge. Your task is to step back and paraphrase a question to a more generic step-back question, which is easier to answer."),
    few_shot_prompt,
    ("user", "{question}"),
])

generate_queries_step_back = step_back_prompt | ChatOpenAI(temperature=0) | StrOutputParser()

# Use BOTH normal context and step-back context
response_prompt_template = """You are an expert of world knowledge. I am going to ask you a question. Your response should be comprehensive and not contradicted with the following context if they are relevant. Otherwise, ignore them if they are not relevant.

# {normal_context}
# {step_back_context}

# Original Question: {question}
# Answer:"""

chain = (
    {
        "normal_context": RunnableLambda(lambda x: x["question"]) | retriever,
        "step_back_context": generate_queries_step_back | retriever,
        "question": lambda x: x["question"],
    }
    | ChatPromptTemplate.from_template(response_prompt_template)
    | ChatOpenAI(temperature=0)
    | StrOutputParser()
)
chain.invoke({"question": question})
```

### Part 9: HyDE (Hypothetical Document Embeddings)

Generate a hypothetical answer document, embed it, use that embedding to search (instead of embedding the question):

```python
# HyDE: Generate hypothetical document that ANSWERS the question
template = """Please write a scientific paper passage to answer the question
Question: {question}
Passage:"""
prompt_hyde = ChatPromptTemplate.from_template(template)

generate_docs_for_retrieval = (
    prompt_hyde | ChatOpenAI(temperature=0) | StrOutputParser()
)

# Retrieve using the hypothetical document as query
retrieval_chain = generate_docs_for_retrieval | retriever
retrieved_docs = retrieval_chain.invoke({"question": question})

# Generate final answer
final_rag_chain = (
    ChatPromptTemplate.from_template("Answer the following question based on this context:\n{context}\nQuestion: {question}")
    | llm
    | StrOutputParser()
)
final_rag_chain.invoke({"context": retrieved_docs, "question": question})
```

**Why HyDE works**: The embedding space of a hypothetical answer is closer to real relevant documents than the embedding of the question itself. Questions and answers live in different areas of embedding space.

---

## Routing Strategies (Parts 10-11)

### Part 10: Logical Routing (LLM-based Classification)

Use structured output / function-calling to classify query and route to correct datasource:

```python
from typing import Literal
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_openai import ChatOpenAI

class RouteQuery(BaseModel):
    """Route a user query to the most relevant datasource."""
    datasource: Literal["python_docs", "js_docs", "golang_docs"] = Field(
        ...,
        description="Given a user question choose which datasource would be most relevant",
    )

llm = ChatOpenAI(model="gpt-3.5-turbo-0125", temperature=0)
structured_llm = llm.with_structured_output(RouteQuery)

system = """You are an expert at routing a user question to the appropriate data source.
Based on the programming language the question is referring to, route it to the relevant data source."""

prompt = ChatPromptTemplate.from_messages([
    ("system", system),
    ("human", "{question}"),
])

router = prompt | structured_llm

def choose_route(result):
    if "python_docs" in result.datasource.lower():
        return "chain for python_docs"
    elif "js_docs" in result.datasource.lower():
        return "chain for js_docs"
    else:
        return "golang_docs"

from langchain_core.runnables import RunnableLambda
full_chain = router | RunnableLambda(choose_route)
```

### Part 10: Semantic Routing (Embedding-based)

Route to the most semantically similar prompt template:

```python
from langchain.utils.math import cosine_similarity
from langchain_openai import OpenAIEmbeddings

physics_template = """You are a very smart physics professor. ...\nHere is a question:\n{query}"""
math_template = """You are a very good mathematician. ...\nHere is a question:\n{query}"""

embeddings = OpenAIEmbeddings()
prompt_templates = [physics_template, math_template]
prompt_embeddings = embeddings.embed_documents(prompt_templates)

def prompt_router(input):
    query_embedding = embeddings.embed_query(input["query"])
    similarity = cosine_similarity([query_embedding], prompt_embeddings)[0]
    most_similar = prompt_templates[similarity.argmax()]
    return PromptTemplate.from_template(most_similar)

chain = (
    {"query": RunnablePassthrough()}
    | RunnableLambda(prompt_router)
    | ChatOpenAI()
    | StrOutputParser()
)
```

### Part 11: Query Structuring (Natural Language to Metadata Filters)

Convert natural language queries into structured queries with filters:

```python
import datetime
from typing import Literal, Optional
from langchain_core.pydantic_v1 import BaseModel, Field

class TutorialSearch(BaseModel):
    """Search over a database of tutorial videos."""
    content_search: str = Field(..., description="Similarity search query applied to video transcripts.")
    title_search: str = Field(..., description="Key words that could be in a video title.")
    min_view_count: Optional[int] = Field(None, description="Minimum view count filter.")
    max_view_count: Optional[int] = Field(None, description="Maximum view count filter.")
    earliest_publish_date: Optional[datetime.date] = Field(None, description="Earliest publish date filter.")
    latest_publish_date: Optional[datetime.date] = Field(None, description="Latest publish date filter.")
    min_length_sec: Optional[int] = Field(None, description="Minimum video length in seconds.")
    max_length_sec: Optional[int] = Field(None, description="Maximum video length in seconds.")

llm = ChatOpenAI(model="gpt-3.5-turbo-0125", temperature=0)
structured_llm = llm.with_structured_output(TutorialSearch)

system = """You are an expert at converting user questions into database queries. ..."""
prompt = ChatPromptTemplate.from_messages([
    ("system", system),
    ("human", "{question}"),
])

query_analyzer = prompt | structured_llm

# Examples of what gets generated:
# "videos on chat langchain published in 2023"
# -> content_search="chat langchain", earliest_publish_date=2023-01-01, latest_publish_date=2024-01-01

# "how to use multi-modal models in an agent, only videos under 5 minutes"
# -> content_search="multi-modal models agent", max_length_sec=300
```

---

## Generation & Prompting

### Basic RAG Prompt
```python
from langchain.prompts import ChatPromptTemplate

template = """Answer the question based only on the following context:
{context}

Question: {question}
"""
prompt = ChatPromptTemplate.from_template(template)

# Or pull from LangChain Hub (community maintained)
from langchain import hub
prompt = hub.pull("rlm/rag-prompt")
```

### LCEL Chain Pattern
```python
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

result = rag_chain.invoke("What is Task Decomposition?")
```

### Format Documents Helper
```python
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)
```

---

## Advanced RAG Patterns

### Pattern Map

```
Basic RAG
    -> Query Transformations (improve recall)
        -> Multi-Query (5 perspectives)
        -> RAG-Fusion (multi-query + RRF re-ranking)
        -> Decomposition (break into sub-questions)
        -> Step Back (abstract to general question)
        -> HyDE (hypothetical document embedding)
    -> Routing (send to right source)
        -> Logical (LLM classifies)
        -> Semantic (embedding similarity)
        -> Query Structuring (NL -> structured filters)
    -> Advanced Indexing (improve precision)
        -> Multi-Representation (summaries + full docs)
        -> RAPTOR (hierarchical summaries)
        -> ColBERT (per-token embeddings)
    -> Advanced Retrieval (improve quality)
        -> Re-ranking (RRF, Cohere)
        -> CRAG (corrective RAG - grade docs, web search fallback)
        -> Self-RAG (decide when to retrieve, grade relevance)
    -> Long Context
        -> Lost-in-middle problem
        -> Context window optimization
```

### CRAG (Corrective RAG) - Part 16
- Retrieve documents
- Grade each document for relevance
- If irrelevant: trigger web search for fresh data
- If relevant: use as-is
- Implemented with LangGraph for stateful decision-making
- Notebook: https://github.com/langchain-ai/langgraph/blob/main/examples/rag/langgraph_crag.ipynb

### Self-RAG - Part 17
- Agent decides WHETHER to retrieve at all
- Grades retrieved documents for relevance
- Grades generation for hallucination
- Grades generation for answer quality
- Iterates if quality insufficient
- Implemented with LangGraph
- Notebook: https://github.com/langchain-ai/langgraph/tree/main/examples/rag

### Long Context Impact - Part 18
- "Lost-in-the-middle" problem: LLMs perform better when relevant info is at beginning or end of context
- Optimal context placement matters
- Reference: https://docs.google.com/presentation/d/1mJUiPBdtf58NfuSEQ7pVSEQ2Oqmek7F1i4gBwR6JDss/

---

## Code Patterns & Examples

### Pattern 1: Basic Indexing Setup (reusable)
```python
import bs4
from langchain_community.document_loaders import WebBaseLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

def build_vectorstore(url: str, chunk_size: int = 300, chunk_overlap: int = 50):
    loader = WebBaseLoader(
        web_paths=(url,),
        bs_kwargs=dict(parse_only=bs4.SoupStrainer(
            class_=("post-content", "post-title", "post-header")
        )),
    )
    docs = loader.load()

    text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    splits = text_splitter.split_documents(docs)

    vectorstore = Chroma.from_documents(documents=splits, embedding=OpenAIEmbeddings())
    return vectorstore.as_retriever()
```

### Pattern 2: Multi-Query Retrieval (reusable)
```python
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain.load import dumps, loads

def build_multi_query_retriever(retriever, n_queries: int = 5):
    template = f"""You are an AI language model assistant. Generate {n_queries}
    different versions of the given user question for vector database retrieval.
    Provide alternatives separated by newlines. Original question: {{question}}"""

    generate_queries = (
        ChatPromptTemplate.from_template(template)
        | ChatOpenAI(temperature=0)
        | StrOutputParser()
        | (lambda x: x.split("\n"))
    )

    def get_unique_union(documents: list[list]):
        flattened_docs = [dumps(doc) for sublist in documents for doc in sublist]
        return [loads(doc) for doc in list(set(flattened_docs))]

    return generate_queries | retriever.map() | get_unique_union
```

### Pattern 3: RRF Re-ranking (reusable)
```python
from langchain.load import dumps, loads

def reciprocal_rank_fusion(results: list[list], k: int = 60):
    """Merge multiple ranked result lists using RRF formula."""
    fused_scores = {}
    for docs in results:
        for rank, doc in enumerate(docs):
            doc_str = dumps(doc)
            if doc_str not in fused_scores:
                fused_scores[doc_str] = 0
            fused_scores[doc_str] += 1 / (rank + k)

    return [
        (loads(doc), score)
        for doc, score in sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
    ]
```

### Pattern 4: Semantic Router (reusable)
```python
from langchain.utils.math import cosine_similarity
from langchain_openai import OpenAIEmbeddings
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableLambda

def build_semantic_router(prompt_templates: list[str], labels: list[str]):
    """Routes query to most semantically similar prompt template."""
    embeddings = OpenAIEmbeddings()
    prompt_embeddings = embeddings.embed_documents(prompt_templates)

    def prompt_router(input):
        query_embedding = embeddings.embed_query(input["query"])
        similarity = cosine_similarity([query_embedding], prompt_embeddings)[0]
        chosen_idx = similarity.argmax()
        print(f"Routing to: {labels[chosen_idx]}")
        return PromptTemplate.from_template(prompt_templates[chosen_idx])

    return RunnableLambda(prompt_router)
```

### Pattern 5: Query Structuring with Pydantic
```python
from langchain_core.pydantic_v1 import BaseModel, Field
from typing import Optional, Literal
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

def build_query_analyzer(schema_class: BaseModel, system_prompt: str):
    llm = ChatOpenAI(model="gpt-3.5-turbo-0125", temperature=0)
    structured_llm = llm.with_structured_output(schema_class)
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{question}"),
    ])
    return prompt | structured_llm
```

### Pattern 6: HyDE Retrieval (reusable)
```python
def build_hyde_retriever(retriever):
    """Hypothetical Document Embeddings retriever."""
    template = """Please write a passage that would answer the following question:
Question: {question}
Passage:"""

    generate_hypothetical_doc = (
        ChatPromptTemplate.from_template(template)
        | ChatOpenAI(temperature=0)
        | StrOutputParser()
    )

    return generate_hypothetical_doc | retriever
```

---

## What We Can Reuse

### For AI Agency Business (Vietnam Market)

1. **Multi-Query RAG** - Apply to customer FAQ systems, product search. Generate multiple query perspectives to handle Vietnamese spelling variations and informal language.

2. **Semantic Router** - Route customer queries to specialized agents (sales, support, technical). Embed descriptions of each department's expertise.

3. **Query Structuring** - Convert natural language queries to structured filters for product databases (price range, category, brand). Particularly useful for e-commerce clients.

4. **Multi-Representation Indexing** - For large document sets (contracts, manuals, policies). Index summaries for fast retrieval, return full docs for accurate generation.

5. **HyDE** - For technical support RAG where users describe symptoms (not official terminology). Generate hypothetical answer, find similar official docs.

6. **RRF Re-ranking** - Easy quality boost for any RAG system with minimal cost. Add as a wrapper around any existing retriever.

7. **ColBERT via RAGatouille** - For high-precision retrieval use cases. More accurate than cosine similarity on single embeddings.

### Architecture Decisions
- Use `RecursiveCharacterTextSplitter.from_tiktoken_encoder()` not char-based splitting
- `chunk_size=300, chunk_overlap=50` for fine-grained retrieval; `chunk_size=1000, chunk_overlap=200` for broader context
- MultiVectorRetriever pattern (summaries + full docs) for best precision + completeness tradeoff
- CRAG + LangGraph for production systems needing reliability
- Self-RAG for agentic systems that need to decide when/whether to retrieve

---

## Lessons & Best Practices

### Indexing
1. Chunk size matters: smaller chunks = better precision, larger = more context per chunk
2. Always use token-based splitting (tiktoken), not character-based
3. `chunk_overlap` prevents information loss at chunk boundaries (50-200 tokens)
4. Index summaries for retrieval, store full docs for generation (Multi-Vector pattern)
5. Metadata filtering dramatically improves precision for structured data sources

### Retrieval
1. The original user question is often a poor retrieval query - always consider transformation
2. Multi-query (5 perspectives) + deduplication is cheapest quality improvement
3. RRF is better than simple score averaging for combining ranked lists
4. k=4 is a reasonable default; increase for complex questions
5. Cosine similarity is the right metric for OpenAI embeddings (not L2 distance)
6. ColBERT > single-vector similarity for domain-specific or nuanced queries

### Query Transformation Priority (cheapest to most expensive)
1. Multi-Query (1 LLM call for 5 queries)
2. RAG-Fusion (1 LLM call + RRF, no extra cost)
3. HyDE (1 LLM call, generates hypothetical doc)
4. Step Back (1 LLM call, abstracts question)
5. Decomposition (1 LLM call to decompose + N calls to answer sub-questions)

### Generation
1. Temperature=0 for factual RAG (deterministic, less hallucination)
2. Always include "Answer based ONLY on the following context" to prevent hallucination
3. LCEL pipe syntax (`|`) makes chains composable and easy to modify
4. `StrOutputParser()` to get plain string from LLM response
5. Use LangSmith tracing during development to debug chain behavior

### Production Considerations
1. Start with basic RAG, add complexity only when quality is insufficient
2. CRAG and Self-RAG (LangGraph) for production reliability
3. Semantic caching can reduce costs significantly (same/similar queries)
4. Model routing: use cheaper models for retrieval decisions, expensive for final generation
5. Long context window does NOT solve retrieval - "lost in the middle" still applies

### LangChain LCEL Patterns
```python
# Parallel retrieval
{"context": retriever | format_docs, "question": RunnablePassthrough()}

# Map over list (retrieve for each query)
generate_queries | retriever.map()

# Lambda in chain
(lambda x: x.split("\n"))

# itemgetter for dict access
itemgetter("question")

# Conditional routing
router | RunnableLambda(choose_route)
```

---

## Dependencies

```bash
pip install langchain_community tiktoken langchain-openai langchainhub chromadb langchain
pip install youtube-transcript-api pytube  # for YouTube loader
pip install cohere  # for Cohere re-ranking
pip install ragatouille  # for ColBERT
```

```python
# Environment setup
import os
os.environ['LANGCHAIN_TRACING_V2'] = 'true'  # LangSmith tracing
os.environ['LANGCHAIN_ENDPOINT'] = 'https://api.smith.langchain.com'
os.environ['LANGCHAIN_API_KEY'] = '<your-key>'
os.environ['OPENAI_API_KEY'] = '<your-key>'
```

---

## Summary: RAG Parts Reference

| Part | Topic | Key Technique |
|------|-------|--------------|
| 1 | Overview | Full pipeline end-to-end |
| 2 | Indexing | Tokens, embeddings, cosine similarity |
| 3 | Retrieval | Basic similarity search |
| 4 | Generation | Prompt + LLM + LCEL chain |
| 5 | Multi-Query | 5 query perspectives + dedup |
| 6 | RAG-Fusion | Multi-query + RRF re-ranking |
| 7 | Decomposition | Break question into sub-questions |
| 8 | Step Back | Abstract to general question |
| 9 | HyDE | Hypothetical document embedding |
| 10 | Routing | Logical (LLM) + Semantic (embedding) |
| 11 | Query Structuring | NL to metadata filters |
| 12 | Multi-Vector | Summaries index, full docs return |
| 13 | RAPTOR | Hierarchical recursive summarization |
| 14 | ColBERT | Per-token late interaction retrieval |
| 15 | Re-ranking | RRF + Cohere neural rerank |
| 16 | CRAG | Corrective RAG with LangGraph |
| 17 | Self-RAG | Agentic retrieval decisions |
| 18 | Long Context | Lost-in-middle, context optimization |
