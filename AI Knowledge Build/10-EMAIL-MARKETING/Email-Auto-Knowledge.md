---
tags: [knowledge, email, automation, langgraph, workflow]
source_repo: langgraph-email-automation
files_read: 13
---

# LangGraph Email Automation - Knowledge Extraction

## Overview & Architecture

This is a **customer support email automation system** built on LangGraph. It monitors a Gmail inbox, categorizes incoming emails using an LLM, generates AI-drafted replies (with RAG for product questions), proofreads those drafts, and either sends them or saves them as Gmail drafts.

The system runs as a **cyclic LangGraph workflow** with conditional routing. It processes emails one at a time from a queue (the `emails` list in state), looping back to the inbox check after each email is handled.

Key design principle: **writer-proofreader loop with a max 3-trial retry**. If the proofreader rejects a draft, the writer gets the feedback and rewrites. After 3 failed attempts, the email is skipped.

High-level flow:
```
load_inbox_emails
  -> is_email_inbox_empty
     -> [empty] END
     -> [process] categorize_email
        -> [product_enquiry] construct_rag_queries -> retrieve_from_rag -> email_writer
        -> [complaint/feedback] email_writer
        -> [unrelated] skip_unrelated_email -> is_email_inbox_empty
  email_writer -> email_proofreader
     -> [send] send_email -> is_email_inbox_empty
     -> [rewrite] email_writer  (loops, max 3 trials)
     -> [stop] categorize_email (skip after 3 failed rewrites)
```

---

## Tech Stack & Dependencies

| Library | Purpose |
|---|---|
| `langgraph` | Graph-based agent workflow orchestration |
| `langchain-core` | Prompt templates, runnables, output parsers |
| `langchain-groq` | LLM access: Llama 3.3-70b-versatile |
| `langchain_google_genai` | LLM: Gemini 1.5 Flash; Embeddings: text-embedding-004 |
| `langchain_chroma` | Vector store interface |
| `chromadb` | Local persistent vector database |
| `langchain_community` | TextLoader for RAG document ingestion |
| `google-api-python-client` | Gmail API client |
| `google-auth-oauthlib` | Gmail OAuth2 authentication |
| `beautifulsoup4` | HTML email body parsing |
| `langserve` | Deploy LangGraph as FastAPI endpoint |
| `fastapi` + `uvicorn` | API server for deployment |
| `python-dotenv` | Environment variable management |
| `colorama` | Terminal output coloring |

**Required env vars:**
```env
MY_EMAIL=your_email@gmail.com
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_gemini_api_key
```

**Gmail API:** Requires `credentials.json` from Google Cloud Console. On first run, OAuth flow opens a browser; saves `token.json` for subsequent runs. Scope: `https://www.googleapis.com/auth/gmail.modify`.

---

## LangGraph Graph Definition (with code)

File: `src/graph.py`

```python
from langgraph.graph import END, StateGraph
from .state import GraphState
from .nodes import Nodes

class Workflow():
    def __init__(self):
        workflow = StateGraph(GraphState)
        nodes = Nodes()

        # Node registration
        workflow.add_node("load_inbox_emails", nodes.load_new_emails)
        workflow.add_node("is_email_inbox_empty", nodes.is_email_inbox_empty)
        workflow.add_node("categorize_email", nodes.categorize_email)
        workflow.add_node("construct_rag_queries", nodes.construct_rag_queries)
        workflow.add_node("retrieve_from_rag", nodes.retrieve_from_rag)
        workflow.add_node("email_writer", nodes.write_draft_email)
        workflow.add_node("email_proofreader", nodes.verify_generated_email)
        workflow.add_node("send_email", nodes.create_draft_response)
        workflow.add_node("skip_unrelated_email", nodes.skip_unrelated_email)

        # Entry point
        workflow.set_entry_point("load_inbox_emails")

        # Edges
        workflow.add_edge("load_inbox_emails", "is_email_inbox_empty")
        workflow.add_conditional_edges(
            "is_email_inbox_empty",
            nodes.check_new_emails,
            {"process": "categorize_email", "empty": END}
        )
        workflow.add_conditional_edges(
            "categorize_email",
            nodes.route_email_based_on_category,
            {
                "product related": "construct_rag_queries",
                "not product related": "email_writer",
                "unrelated": "skip_unrelated_email"
            }
        )
        workflow.add_edge("construct_rag_queries", "retrieve_from_rag")
        workflow.add_edge("retrieve_from_rag", "email_writer")
        workflow.add_edge("email_writer", "email_proofreader")
        workflow.add_conditional_edges(
            "email_proofreader",
            nodes.must_rewrite,
            {"send": "send_email", "rewrite": "email_writer", "stop": "categorize_email"}
        )
        workflow.add_edge("send_email", "is_email_inbox_empty")
        workflow.add_edge("skip_unrelated_email", "is_email_inbox_empty")

        self.app = workflow.compile()
```

**Running the graph** (`main.py`):
```python
config = {'recursion_limit': 100}
for output in app.stream(initial_state, config):
    for key, value in output.items():
        print(f"Finished running: {key}:")
```

---

## State Schema & Management

File: `src/state.py`

```python
class Email(BaseModel):
    id: str
    threadId: str
    messageId: str
    references: str
    sender: str
    subject: str
    body: str

class GraphState(TypedDict):
    emails: List[Email]           # Queue of unprocessed emails
    current_email: Email          # Email currently being processed
    email_category: str           # One of 4 categories
    generated_email: str          # Current draft reply
    rag_queries: List[str]        # Up to 3 queries for RAG retrieval
    retrieved_documents: str      # Concatenated RAG answers
    writer_messages: Annotated[list, add_messages]  # Full history of drafts + feedback
    sendable: bool                # Proofreader verdict
    trials: int                   # Rewrite attempt counter
```

Key state management patterns:
- `emails` acts as a **processing queue** — `state["emails"].pop()` removes the last item after processing
- `writer_messages` uses `add_messages` annotation for automatic message accumulation (LangGraph's built-in reducer)
- `trials` tracks rewrite attempts; resets to 0 after each email is handled
- `retrieved_documents` resets to `""` after send, `trials` resets to `0`

**Initial state** for `main.py`:
```python
initial_state = {
    "emails": [], "current_email": {"id":"","threadId":"","messageId":"",
    "references":"","sender":"","subject":"","body":""},
    "email_category": "", "generated_email": "", "rag_queries": [],
    "retrieved_documents": "", "writer_messages": [], "sendable": False, "trials": 0
}
```

---

## Email Processing Nodes

File: `src/nodes.py`

All nodes are methods on the `Nodes` class. The class holds `self.agents` (all LLM chains) and `self.gmail_tools` (Gmail API wrapper).

| Node method | Role |
|---|---|
| `load_new_emails` | Fetches unanswered Gmail messages, converts to `Email` objects |
| `is_email_inbox_empty` | Pass-through node; routing happens in `check_new_emails` conditional |
| `check_new_emails` | Returns `"empty"` or `"process"` based on `len(state['emails'])` |
| `categorize_email` | Pops last email from queue, invokes categorize agent, sets `current_email` + `email_category` |
| `route_email_based_on_category` | Maps category string to routing key |
| `construct_rag_queries` | Calls design_rag_queries agent on email body, returns list of queries |
| `retrieve_from_rag` | Iterates queries, calls RAG chain for each, concatenates results |
| `write_draft_email` | Builds structured input, calls email_writer agent, appends draft to `writer_messages` |
| `verify_generated_email` | Proofreads draft, appends feedback to `writer_messages`, sets `sendable` bool |
| `must_rewrite` | Decision node: `"send"` if sendable, `"stop"` if trials >= 3, `"rewrite"` otherwise |
| `create_draft_response` | Saves reply as Gmail draft (does NOT auto-send) |
| `send_email_response` | Sends reply directly via Gmail API (defined but not wired into graph) |
| `skip_unrelated_email` | Pops email from queue without processing |

Notable detail: `send_email_response` is defined in `nodes.py` but the graph wires `send_email` to `create_draft_response` — the system **saves drafts, not auto-sends**.

---

## Classification & Routing Logic

### Email Categories (Enum)

```python
class EmailCategory(str, Enum):
    product_enquiry = "product_enquiry"
    customer_complaint = "customer_complaint"
    customer_feedback = "customer_feedback"
    unrelated = "unrelated"
```

### Routing Decision

```python
def route_email_based_on_category(self, state: GraphState) -> str:
    category = state["email_category"]
    if category == "product_enquiry":
        return "product related"      # -> RAG pipeline
    elif category == "unrelated":
        return "unrelated"            # -> skip
    else:
        return "not product related"  # -> direct email_writer (complaint or feedback)
```

### Rewrite/Send Decision

```python
def must_rewrite(self, state: GraphState) -> str:
    if state["sendable"]:
        state["emails"].pop()
        state["writer_messages"] = []
        return "send"
    elif state["trials"] >= 3:
        state["emails"].pop()
        state["writer_messages"] = []
        return "stop"
    else:
        return "rewrite"
```

**Max retries: 3.** After 3 failed proofreads, the email is dropped and the system moves to the next one.

---

## Prompt Templates (Actual Prompts)

File: `src/prompts.py`

### 1. CATEGORIZE_EMAIL_PROMPT
```
# Role:
You are a highly skilled customer support specialist working for a SaaS company specializing in AI agent design.

# Instructions:
1. Review the provided email content thoroughly.
2. Use the following rules to assign the correct category:
   - product_enquiry: When the email seeks information about a product feature, benefit, service, or pricing.
   - customer_complaint: When the email communicates dissatisfaction or a complaint.
   - customer_feedback: When the email provides feedback or suggestions.
   - unrelated: When the email content does not match any of the above categories.

# EMAIL CONTENT:
{email}

# Notes:
* Base your categorization strictly on the email content provided; avoid making assumptions.
```

### 2. GENERATE_RAG_QUERIES_PROMPT
```
# Role:
You are an expert at analyzing customer emails to extract their intent and construct the most relevant queries for internal knowledge sources.

# Instructions:
1. Carefully read and analyze the email content provided.
2. Identify the main intent or problem expressed in the email.
3. Construct up to three concise, relevant questions that best represent the customer's intent.
4. Include only relevant questions. Do not exceed three questions.
5. If a single question suffices, provide only that.

# EMAIL CONTENT:
{email}

# Notes:
* Focus exclusively on the email content; do not include unrelated or speculative information.
* Ensure the questions are specific and actionable for retrieving the most relevant answer.
```

### 3. GENERATE_RAG_ANSWER_PROMPT
```
# Role:
You are a highly knowledgeable and helpful assistant specializing in question-answering tasks.

# Instructions:
1. Carefully read the question and the provided context.
2. Analyze the context to identify relevant information that directly addresses the question.
3. Formulate a clear and precise response based ONLY on the context.
4. If the context does not contain sufficient information, respond with: "I don't know."

# Question: {question}
# Context: {context}

# Notes:
* Stay within the boundaries of the provided context.
* If multiple pieces of context are relevant, synthesize them into a cohesive response.
```

### 4. EMAIL_WRITER_PROMPT (System prompt with history)
```
# Role:
You are a professional email writer working as part of the customer support team at a SaaS company specializing in AI agent development.

# Tasks:
1. Use the provided email category, subject, content, and additional information to craft a professional and helpful response.
2. Ensure the tone matches the email category, showing empathy, professionalism, and clarity.

# Instructions:
1. Determine tone based on category:
   - product_enquiry: Clear and friendly response using given information.
   - customer_complaint: Express empathy, assure concerns are valued, promise resolution.
   - customer_feedback: Thank the customer, assure feedback is appreciated and will be considered.
   - unrelated: Politely ask for more information.
2. Write in this format:
   Dear [Customer Name],
   [Email body]
   Best regards,
   The Agentia Team
3. If feedback is provided, use it to improve the email.

# Notes:
* Return only the final email without explanation.
* Always maintain professional and empathetic tone.
* If information is insufficient, politely request additional details.
```

### 5. EMAIL_PROOFREADER_PROMPT
```
# Role:
You are an expert email proofreader for the customer support team at a SaaS company specializing in AI agent development.

# Instructions:
1. Analyze the generated email for:
   - Accuracy: Does it address the customer's inquiry?
   - Tone and Style: Does it align with company standards?
   - Quality: Is it clear, concise, and professional?
2. Determine if sendable (true) or not sendable (false).
3. Only judge "not sendable" if it lacks information or contains irrelevant content that would negatively impact customer satisfaction.
4. Provide actionable feedback if not sendable.

# INITIAL EMAIL: {initial_email}
# GENERATED REPLY: {generated_email}

# Notes:
* Be objective and fair. Only reject if necessary.
* Ensure feedback is clear, concise, and actionable.
```

---

## Structured Output Schemas

File: `src/structure_outputs.py`

All agents use `llm.with_structured_output(PydanticModel)` for reliable output parsing:

```python
class CategorizeEmailOutput(BaseModel):
    category: EmailCategory  # Enum: product_enquiry | customer_complaint | customer_feedback | unrelated

class RAGQueriesOutput(BaseModel):
    queries: List[str]  # Up to 3 questions

class WriterOutput(BaseModel):
    email: str  # Full draft email text

class ProofReaderOutput(BaseModel):
    feedback: str  # Explanation of verdict
    send: bool     # True = ready to send, False = needs rewrite
```

---

## Agents Architecture

File: `src/agents.py`

All agents are LangChain LCEL chains stored as attributes of `Agents()`. The class is instantiated once in `Nodes.__init__()`.

```python
# LLMs
llama = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.1)
gemini = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)

# Embeddings + Vector store
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
vectorstore = Chroma(persist_directory="db", embedding_function=embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

# Agent chains
self.categorize_email = email_category_prompt | llama.with_structured_output(CategorizeEmailOutput)
self.design_rag_queries = generate_query_prompt | llama.with_structured_output(RAGQueriesOutput)
self.generate_rag_answer = {"context": retriever, "question": RunnablePassthrough()} | qa_prompt | llama | StrOutputParser()
self.email_writer = writer_prompt | llama.with_structured_output(WriterOutput)
# writer_prompt uses ChatPromptTemplate with MessagesPlaceholder("history") for rewrite feedback loop
self.email_proofreader = proofreader_prompt | llama.with_structured_output(ProofReaderOutput)
```

The **writer agent** uses `MessagesPlaceholder("history")` in its `ChatPromptTemplate`. This passes the accumulated `writer_messages` (all previous drafts + proofreader feedback) to the writer on each rewrite, enabling iterative improvement.

---

## Gmail Tools

File: `src/tools/GmailTools.py`

```python
class GmailToolsClass:
    def fetch_unanswered_emails(max_results=50)
    # Fetches last 8 hours of emails, skips threads that already have drafts,
    # skips emails sent by MY_EMAIL (self-sent)

    def fetch_recent_emails(max_results=50)
    # Gmail API query: after:{timestamp-8h} before:{now}

    def fetch_draft_replies()
    # Returns list of {draft_id, threadId, id} for deduplication

    def create_draft_reply(initial_email, reply_text)
    # Saves reply as Gmail draft (not sent)

    def send_reply(initial_email, reply_text)
    # Sends reply immediately via Gmail API

    def _create_reply_message(email, reply_text, send=False)
    # Builds MIME message with proper In-Reply-To + References headers for threading
    # Sets Re: prefix on subject if not already present
    # Encodes as base64 for Gmail API raw format

    def _get_email_body(payload)
    # Prefers text/plain over text/html
    # Recursively handles multipart MIME
    # Strips HTML with BeautifulSoup if needed
    # Cleans whitespace with regex

    def _should_skip_email(email_info)
    # Returns True if sender is MY_EMAIL (skip own emails)
```

**Authentication flow:** Looks for `token.json`. If missing or expired, runs `InstalledAppFlow` (opens browser) using `credentials.json`. Saves refreshed token automatically.

---

## RAG Pipeline

File: `create_index.py` (one-time setup script)

```python
# Load and chunk agency knowledge document
loader = TextLoader("./data/agency.txt")
doc_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
doc_chunks = doc_splitter.split_documents(docs)

# Create and persist vector store
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
vectorstore = Chroma.from_documents(doc_chunks, embeddings, persist_directory="db")
```

Settings: chunk_size=300, chunk_overlap=50, k=3 retrieved chunks per query.

The `data/agency.txt` file contains company knowledge: product features, pricing plans ($0/$49/$99/month), FAQs. This is what RAG retrieves to answer `product_enquiry` emails.

RAG execution in nodes: For each of up to 3 queries, RAG runs separately and results are concatenated with query text as prefix before being passed to the writer.

---

## Configuration & Setup

### Step-by-step setup
1. Clone repo, create venv, `pip install -r requirements.txt`
2. Create `.env` with `MY_EMAIL`, `GROQ_API_KEY`, `GOOGLE_API_KEY`
3. Get Gmail API `credentials.json` from Google Cloud Console (enable Gmail API)
4. Put company knowledge in `data/agency.txt`
5. Run `python create_index.py` to build ChromaDB vector store
6. Run `python main.py` to start workflow (or `python deploy_api.py` for API)

### API Deployment (`deploy_api.py`)
Uses `langserve.add_routes(app, runnable)` to expose the LangGraph app as a FastAPI endpoint.
- API runs on `localhost:8000`
- Docs at `/docs`
- LangServe playground at `/playground`
- CORS: all origins allowed

### Recursion limit
```python
config = {'recursion_limit': 100}
app.stream(initial_state, config)
```
Set to 100 to accommodate processing many emails through the full loop.

---

## What We Can Reuse

### High-value reusable patterns

1. **Email queue processing loop**: The pattern of storing all emails in state as a list, processing one at a time (pop from end), and looping back to the empty-check node is directly portable to any batch-processing workflow.

2. **Writer + Proofreader loop with max retries**: The `trials` counter + `must_rewrite` conditional with 3-attempt max is a robust pattern for any LLM generation task requiring quality gates. Direct copy-paste value.

3. **Structured output for routing**: Using `llm.with_structured_output(Pydantic)` for classification and then routing based on enum values is clean and type-safe. Avoids fragile string parsing.

4. **MessagesPlaceholder for iterative refinement**: Passing full draft+feedback history via `MessagesPlaceholder("history")` lets the writer improve based on prior feedback. Reusable for any iterative generation (blog posts, ad copy, proposals).

5. **RAG query decomposition**: Breaking a user message into up to 3 targeted queries before retrieval gives better recall than a single query. Pattern is `email -> N queries -> N RAG calls -> concatenate -> pass to writer`.

6. **Gmail deduplication logic**: Skip threads that already have draft replies (check threadId against existing drafts) + skip own emails. Essential for production Gmail bots.

7. **MIME reply threading**: Proper `In-Reply-To` + `References` headers to maintain email thread continuity. The `_create_reply_message` method is drop-in reusable.

8. **Agent class pattern**: Centralizing all LLM chains as attributes of a single `Agents()` class, instantiated once, is clean separation of concerns. All chains are LCEL pipelines.

---

## Lessons & Best Practices

### What works well
- **LangGraph StateGraph** makes complex conditional flows readable and maintainable. The graph definition in `graph.py` is only ~70 lines but captures a sophisticated workflow.
- **Pydantic structured outputs** eliminate output parsing errors. Every agent returns a typed object. Critical for production.
- **Low temperature (0.1)** on all LLMs for consistency in classification and writing tasks.
- **Separate LLMs per task**: Using Llama 3.3-70b for text tasks and Gemini for embeddings keeps costs manageable while using best-fit models.
- **Pass-through node pattern**: `is_email_inbox_empty` is just `return state` — its sole purpose is to be a routing hub. This is a valid LangGraph pattern for shared decision points.

### Gotchas & limitations
- **No scheduling**: `main.py` runs once and exits. There is no polling loop or cron job. You need an external scheduler (cron, APScheduler, Celery) to run it repeatedly.
- **Draft not auto-send**: The graph wires `send_email` to `create_draft_response` (saves draft) not `send_email_response` (sends immediately). The direct-send method exists but is not wired. This is a safety measure.
- **Gmail fetches last 8 hours only**: The time window is hardcoded in `fetch_recent_emails`. For a production system, track last-processed timestamp persistently.
- **`emails.pop()` in conditional node**: `must_rewrite` modifies state directly (side effect inside a routing function). This works but is not idiomatic — better to do it in the send/skip nodes.
- **No persistence**: State is in-memory only. If the workflow crashes mid-run, progress is lost. LangGraph supports checkpointers (SQLite, PostgreSQL) for persistence — not implemented here.
- **Single-document RAG**: Only `agency.txt` is indexed. For multi-document RAG, update `create_index.py` to loop over files or use a directory loader.
- **writer_messages grows unbounded within one email**: The `add_messages` reducer accumulates all drafts and feedback. For emails needing many rewrites, this context could get large. The 3-trial max mitigates this.
- **CORS wide open**: `allow_origins=["*"]` in `deploy_api.py` is for development only. Lock down for production.

### Architecture decision: Why LangGraph over simple script?
- The conditional routing (especially the rewrite loop) is hard to express cleanly in a linear script
- LangGraph's `.stream()` gives visibility into which node is running at each step
- Easy to add new nodes (e.g., escalation to human, Slack notification) without refactoring

### Adaptation for Vietnam market / AI agency use
- Replace `data/agency.txt` with Vietnamese business knowledge base
- Add a `language_detection` node to route to Vietnamese/English writer prompts
- Integrate with Zalo API instead of (or alongside) Gmail for Vietnamese customers
- The writer prompt's company name ("Agentia Team") and tone are easy to swap
- For Zalo Business, replace `GmailToolsClass` with a Zalo OA API wrapper using the same interface
