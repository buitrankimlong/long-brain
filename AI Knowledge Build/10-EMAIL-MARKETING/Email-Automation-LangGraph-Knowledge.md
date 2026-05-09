# Email Automation with LangGraph - Complete Knowledge Extraction

**Source:** `langgraph-email-automation` by kaymen99
**Repo:** https://github.com/kaymen99/langgraph-email-automation
**Purpose:** AI-powered customer support email automation using LangGraph multi-agent workflow + RAG

---

## 1. Architecture Overview

### System Summary

The system continuously monitors a Gmail inbox, categorizes incoming emails using AI, generates contextual responses (with RAG for product inquiries), proofreads drafts, and sends approved replies. It uses 5 specialized AI agents orchestrated through a LangGraph StateGraph.

### The 5 Agents

| Agent | Role | LLM | Output Schema |
|---|---|---|---|
| **Email Categorizer** | Classifies emails into 4 categories | Llama 3.3 70B (Groq) | `CategorizeEmailOutput` (enum) |
| **RAG Query Designer** | Extracts up to 3 search queries from product inquiry emails | Llama 3.3 70B (Groq) | `RAGQueriesOutput` (list of strings) |
| **RAG Answer Generator** | Retrieves context from ChromaDB and answers queries | Llama 3.3 70B (Groq) | Plain string (StrOutputParser) |
| **Email Writer** | Drafts professional response emails with category-specific tone | Llama 3.3 70B (Groq) | `WriterOutput` (string) |
| **Email Proofreader** | Reviews drafts for accuracy, tone, quality; approves or requests rewrite | Llama 3.3 70B (Groq) | `ProofReaderOutput` (feedback + bool) |

### Email Categories (Enum)

```python
class EmailCategory(str, Enum):
    product_enquiry = "product_enquiry"
    customer_complaint = "customer_complaint"
    customer_feedback = "customer_feedback"
    unrelated = "unrelated"
```

### Workflow Flow

```
Load Inbox --> Check Empty? --[empty]--> END
                  |
              [process]
                  |
           Categorize Email
           /       |        \
    product_enquiry  complaint/feedback  unrelated
         |              |                  |
  Construct RAG     Email Writer      Skip Email --> Check Empty?
  Queries               |
     |              Proofreader
  Retrieve RAG      /    |     \
     |          send   rewrite   stop (max 3 trials)
  Email Writer    |      |        |
     |        Send Email  |    Categorize (next email)
  Proofreader      |     Email Writer
     |         Check Empty?
    ...
```

---

## 2. LangGraph Workflow - Complete Code

### State Definition

```python
from pydantic import BaseModel, Field
from typing import List, Annotated
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages

class Email(BaseModel):
    id: str = Field(..., description="Unique identifier of the email")
    threadId: str = Field(..., description="Thread identifier of the email")
    messageId: str = Field(..., description="Message identifier of the email")
    references: str = Field(..., description="References of the email")
    sender: str = Field(..., description="Email address of the sender")
    subject: str = Field(..., description="Subject line of the email")
    body: str = Field(..., description="Body content of the email")

class GraphState(TypedDict):
    emails: List[Email]
    current_email: Email
    email_category: str
    generated_email: str
    rag_queries: List[str]
    retrieved_documents: str
    writer_messages: Annotated[list, add_messages]  # Accumulates writer/proofreader conversation
    sendable: bool
    trials: int
```

**Key pattern:** `writer_messages` uses `Annotated[list, add_messages]` -- LangGraph's message accumulator reducer. This allows the writer agent to see previous drafts and proofreader feedback across rewrite iterations.

### Graph Construction (graph.py)

```python
from langgraph.graph import END, StateGraph

class Workflow():
    def __init__(self):
        workflow = StateGraph(GraphState)
        nodes = Nodes()

        # Define all graph nodes
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

        # Linear edge: load -> check empty
        workflow.add_edge("load_inbox_emails", "is_email_inbox_empty")

        # Conditional: empty inbox or process next email
        workflow.add_conditional_edges(
            "is_email_inbox_empty",
            nodes.check_new_emails,
            {"process": "categorize_email", "empty": END}
        )

        # Route by category
        workflow.add_conditional_edges(
            "categorize_email",
            nodes.route_email_based_on_category,
            {
                "product related": "construct_rag_queries",
                "not product related": "email_writer",
                "unrelated": "skip_unrelated_email"
            }
        )

        # RAG pipeline -> writer -> proofreader
        workflow.add_edge("construct_rag_queries", "retrieve_from_rag")
        workflow.add_edge("retrieve_from_rag", "email_writer")
        workflow.add_edge("email_writer", "email_proofreader")

        # Proofreader decision: send, rewrite, or stop
        workflow.add_conditional_edges(
            "email_proofreader",
            nodes.must_rewrite,
            {"send": "send_email", "rewrite": "email_writer", "stop": "categorize_email"}
        )

        # Loop back to check for more emails
        workflow.add_edge("send_email", "is_email_inbox_empty")
        workflow.add_edge("skip_unrelated_email", "is_email_inbox_empty")

        self.app = workflow.compile()
```

### Node Implementations (Key Patterns)

**Email processing uses stack pattern** -- `state["emails"][-1]` gets current email, `.pop()` removes it when done.

**Writer-Proofreader feedback loop:**
```python
def write_draft_email(self, state: GraphState) -> GraphState:
    inputs = (
        f'# **EMAIL CATEGORY:** {state["email_category"]}\n\n'
        f'# **EMAIL CONTENT:**\n{state["current_email"].body}\n\n'
        f'# **INFORMATION:**\n{state["retrieved_documents"]}'
    )
    writer_messages = state.get('writer_messages', [])
    draft_result = self.agents.email_writer.invoke({
        "email_information": inputs,
        "history": writer_messages  # Previous drafts + feedback
    })
    trials = state.get('trials', 0) + 1
    writer_messages.append(f"**Draft {trials}:**\n{draft_result.email}")
    return {"generated_email": draft_result.email, "trials": trials, "writer_messages": writer_messages}

def verify_generated_email(self, state: GraphState) -> GraphState:
    review = self.agents.email_proofreader.invoke({
        "initial_email": state["current_email"].body,
        "generated_email": state["generated_email"],
    })
    writer_messages = state.get('writer_messages', [])
    writer_messages.append(f"**Proofreader Feedback:**\n{review.feedback}")
    return {"sendable": review.send, "writer_messages": writer_messages}

def must_rewrite(self, state: GraphState) -> str:
    if state["sendable"]:
        state["emails"].pop()
        state["writer_messages"] = []
        return "send"
    elif state["trials"] >= 3:  # Max 3 rewrite attempts
        state["emails"].pop()
        state["writer_messages"] = []
        return "stop"
    else:
        return "rewrite"
```

**RAG retrieval -- iterates over multiple queries:**
```python
def retrieve_from_rag(self, state: GraphState) -> GraphState:
    final_answer = ""
    for query in state["rag_queries"]:
        rag_result = self.agents.generate_rag_answer.invoke(query)
        final_answer += query + "\n" + rag_result + "\n\n"
    return {"retrieved_documents": final_answer}
```

---

## 3. Agent Chain Definitions (agents.py)

### Pattern: LangChain LCEL with Structured Output

```python
from langchain_groq import ChatGroq
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

class Agents():
    def __init__(self):
        llama = ChatGroq(model_name="llama-3.3-70b-versatile", temperature=0.1)
        gemini = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.1)

        # Vector store setup
        embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
        vectorstore = Chroma(persist_directory="db", embedding_function=embeddings)
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

        # Agent 1: Categorizer (PromptTemplate | LLM.with_structured_output)
        self.categorize_email = (
            PromptTemplate(template=CATEGORIZE_EMAIL_PROMPT, input_variables=["email"])
            | llama.with_structured_output(CategorizeEmailOutput)
        )

        # Agent 2: RAG Query Designer
        self.design_rag_queries = (
            PromptTemplate(template=GENERATE_RAG_QUERIES_PROMPT, input_variables=["email"])
            | llama.with_structured_output(RAGQueriesOutput)
        )

        # Agent 3: RAG Answer Generator (classic RAG chain)
        self.generate_rag_answer = (
            {"context": retriever, "question": RunnablePassthrough()}
            | ChatPromptTemplate.from_template(GENERATE_RAG_ANSWER_PROMPT)
            | llama
            | StrOutputParser()
        )

        # Agent 4: Email Writer (with message history for feedback loop)
        writer_prompt = ChatPromptTemplate.from_messages([
            ("system", EMAIL_WRITER_PROMPT),
            MessagesPlaceholder("history"),
            ("human", "{email_information}")
        ])
        self.email_writer = writer_prompt | llama.with_structured_output(WriterOutput)

        # Agent 5: Proofreader
        self.email_proofreader = (
            PromptTemplate(
                template=EMAIL_PROOFREADER_PROMPT,
                input_variables=["initial_email", "generated_email"]
            )
            | llama.with_structured_output(ProofReaderOutput)
        )
```

### Structured Output Schemas

```python
class CategorizeEmailOutput(BaseModel):
    category: EmailCategory  # Enum: product_enquiry, customer_complaint, customer_feedback, unrelated

class RAGQueriesOutput(BaseModel):
    queries: List[str]  # Up to 3 search queries

class WriterOutput(BaseModel):
    email: str  # The draft email text

class ProofReaderOutput(BaseModel):
    feedback: str  # Detailed feedback
    send: bool     # True = ready to send, False = needs rewrite
```

---

## 4. Prompt Templates (Complete)

### CATEGORIZE_EMAIL_PROMPT

```
# **Role:**
You are a highly skilled customer support specialist working for a SaaS company specializing in AI agent design. Your expertise lies in understanding customer intent and meticulously categorizing emails to ensure they are handled efficiently.

# **Instructions:**
1. Review the provided email content thoroughly.
2. Use the following rules to assign the correct category:
   - **product_enquiry**: When the email seeks information about a product feature, benefit, service, or pricing.
   - **customer_complaint**: When the email communicates dissatisfaction or a complaint.
   - **customer_feedback**: When the email provides feedback or suggestions regarding a product or service.
   - **unrelated**: When the email content does not match any of the above categories.

# **EMAIL CONTENT:**
{email}

# **Notes:**
* Base your categorization strictly on the email content provided; avoid making assumptions or overgeneralizing.
```

### GENERATE_RAG_QUERIES_PROMPT

```
# **Role:**
You are an expert at analyzing customer emails to extract their intent and construct the most relevant queries for internal knowledge sources.

# **Instructions:**
1. Carefully read and analyze the email content provided.
2. Identify the main intent or problem expressed in the email.
3. Construct up to three concise, relevant questions that best represent the customer's intent or information needs.
4. Include only relevant questions. Do not exceed three questions.
5. If a single question suffices, provide only that.

# **EMAIL CONTENT:**
{email}

# **Notes:**
* Focus exclusively on the email content to generate the questions; do not include unrelated or speculative information.
* Ensure the questions are specific and actionable for retrieving the most relevant answer.
```

### GENERATE_RAG_ANSWER_PROMPT

```
# **Role:**
You are a highly knowledgeable and helpful assistant specializing in question-answering tasks.

# **Instructions:**
1. Carefully read the question and the provided context.
2. Analyze the context to identify relevant information that directly addresses the question.
3. Formulate a clear and precise response based only on the context. Do not infer or assume information that is not explicitly stated.
4. If the context does not contain sufficient information to answer the question, respond with: "I don't know."

# **Question:**
{question}

# **Context:**
{context}

# **Notes:**
* Stay within the boundaries of the provided context; avoid introducing external information.
* If multiple pieces of context are relevant, synthesize them into a cohesive and accurate response.
```

### EMAIL_WRITER_PROMPT (System Message)

```
# **Role:**
You are a professional email writer working as part of the customer support team at a SaaS company specializing in AI agent development. Your role is to draft thoughtful and friendly emails that effectively address customer queries based on the given category and relevant information.

# **Instructions:**
1. Determine the appropriate tone and structure for the email based on the category:
   - **product_enquiry**: Use the given information to provide a clear and friendly response addressing the customer's query.
   - **customer_complaint**: Express empathy, assure the customer their concerns are valued, and promise to do your best to resolve the issue.
   - **customer_feedback**: Thank the customer for their input and assure them their feedback is appreciated and will be considered.
   - **unrelated**: Politely ask the customer for more information and assure them of your willingness to help.
2. Write the email in the following format:
   Dear [Customer Name],
   [Email body responding to the query, based on the category and information provided.]
   Best regards,
   The Agentia Team
3. If a feedback is provided, use it to improve the email while ensuring it still aligns with the predefined guidelines.

# **Notes:**
* Return only the final email without any additional explanation or preamble.
* Always maintain a professional and empathetic tone that aligns with the context of the email.
* If the information provided is insufficient, politely request additional details from the customer.
* Make sure to follow any feedback provided when crafting the email.
```

### EMAIL_PROOFREADER_PROMPT

```
# **Role:**
You are an expert email proofreader working for the customer support team at a SaaS company specializing in AI agent development. Your role is to analyze and assess replies generated by the writer agent to ensure they accurately address the customer's inquiry, adhere to the company's tone and writing standards, and meet professional quality expectations.

# **Instructions:**
1. Analyze the generated email for:
   - **Accuracy**: Does it appropriately address the customer's inquiry based on the initial email and information provided?
   - **Tone and Style**: Does it align with the company's tone, standards, and writing style?
   - **Quality**: Is it clear, concise, and professional?
2. Determine if the email is:
   - **Sendable**: The email meets all criteria and is ready to be sent.
   - **Not Sendable**: The email contains significant issues requiring a rewrite.
3. Only judge the email as "not sendable" (send: false) if it lacks information or inversely contains irrelevant ones that would negatively impact customer satisfaction or professionalism.
4. Provide actionable and clear feedback for the writer agent if the email is deemed "not sendable."

# **INITIAL EMAIL:**
{initial_email}

# **GENERATED REPLY:**
{generated_email}

# **Notes:**
* Be objective and fair in your assessment. Only reject the email if necessary.
* Ensure feedback is clear, concise, and actionable.
```

---

## 5. Gmail API Integration Patterns

### Authentication

```python
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

def _get_gmail_service(self):
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)
```

### Fetching Unanswered Emails

Key logic: fetches recent emails (last 8 hours), cross-references with existing drafts to avoid duplicate responses, skips emails from own address.

```python
def fetch_unanswered_emails(self, max_results=50):
    recent_emails = self.fetch_recent_emails(max_results)
    drafts = self.fetch_draft_replies()
    threads_with_drafts = {draft['threadId'] for draft in drafts}

    seen_threads = set()
    unanswered_emails = []
    for email in recent_emails:
        thread_id = email['threadId']
        if thread_id not in seen_threads and thread_id not in threads_with_drafts:
            seen_threads.add(thread_id)
            email_info = self._get_email_info(email['id'])
            if self._should_skip_email(email_info):  # Skip own emails
                continue
            unanswered_emails.append(email_info)
    return unanswered_emails
```

### Email Body Extraction

Handles multipart MIME, prioritizes text/plain over text/html, strips HTML with BeautifulSoup:

```python
def _get_email_body(self, payload):
    def extract_body(parts):
        for part in parts:
            mime_type = part.get('mimeType', '')
            data = part['body'].get('data', '')
            if mime_type == 'text/plain':
                return decode_data(data)
            if mime_type == 'text/html':
                html_content = decode_data(data)
                return self._extract_main_content_from_html(html_content)
            if 'parts' in part:
                result = extract_body(part['parts'])
                if result: return result
        return ""
```

### Creating Draft Replies (Thread-Aware)

```python
def _create_reply_message(self, email, reply_text, send=False):
    message = self._create_html_email_message(
        recipient=email.sender,
        subject=email.subject,
        reply_text=reply_text
    )
    if email.messageId:
        message["In-Reply-To"] = email.messageId
        message["References"] = f"{email.references} {email.messageId}".strip()
        if send:
            message["Message-ID"] = f"<{uuid.uuid4()}@gmail.com>"
    body = {
        "raw": base64.urlsafe_b64encode(message.as_bytes()).decode(),
        "threadId": email.threadId
    }
    return body
```

**Key detail:** Sets `In-Reply-To` and `References` headers for proper Gmail thread grouping. Uses `threadId` in the API call body.

---

## 6. RAG Pipeline Details

### Vector Store Setup

- **Embeddings:** Google `text-embedding-004` (via `GoogleGenerativeAIEmbeddings`)
- **Vector DB:** ChromaDB with local persistence (`persist_directory="db"`)
- **Retriever:** Top-k=3 similarity search

### RAG Flow

1. Email categorized as `product_enquiry`
2. **Query Designer** extracts up to 3 focused questions from email
3. For each query, the **RAG chain** retrieves top-3 chunks from ChromaDB and generates an answer
4. All Q&A pairs concatenated into `retrieved_documents` string
5. Passed to **Email Writer** as context for drafting the response

### RAG Chain (LCEL)

```python
self.generate_rag_answer = (
    {"context": retriever, "question": RunnablePassthrough()}
    | ChatPromptTemplate.from_template(GENERATE_RAG_ANSWER_PROMPT)
    | llama
    | StrOutputParser()
)
```

---

## 7. Dependencies

```
langchain-core
langchain_community
langgraph
langchain-groq
langchain_google_genai
langchain_chroma
chromadb
google-api-python-client
google-auth-oauthlib
google-auth-httplib2
beautifulsoup4
python-dotenv
colorama
langserve
sse_starlette
uvicorn
gunicorn
fastapi
```

### Environment Variables

```env
MY_EMAIL=your_email@gmail.com
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_gemini_api_key
```

### Files Required

- `credentials.json` -- Gmail API OAuth credentials (from Google Cloud Console)
- `token.json` -- Auto-generated after first OAuth flow
- `db/` -- ChromaDB persistence directory (created by `create_index.py`)

---

## 8. Reusable Patterns for Our System

### Pattern 1: Writer-Proofreader Feedback Loop

The writer and proofreader agents form a self-correcting loop with max 3 iterations. The `writer_messages` state accumulates all drafts and feedback using LangGraph's `add_messages` reducer, giving the writer context about what to fix. This pattern is directly applicable to any content generation workflow.

### Pattern 2: Category-Based Routing with Conditional Edges

```python
workflow.add_conditional_edges(
    "categorize_email",
    nodes.route_email_based_on_category,
    {
        "product related": "construct_rag_queries",
        "not product related": "email_writer",
        "unrelated": "skip_unrelated_email"
    }
)
```

This routing function returns a string key that maps to the next node. Clean pattern for any multi-path workflow.

### Pattern 3: Structured Output for Reliable Agent Communication

Every agent uses `llm.with_structured_output(PydanticModel)` to guarantee parseable outputs. This eliminates string parsing and makes inter-agent communication type-safe.

### Pattern 4: Email Stack Processing

Emails are stored as a list and processed LIFO with `.pop()`. The graph loops back to check `is_email_inbox_empty` after each email, creating a batch-processing loop within a single graph invocation.

### Pattern 5: RAG with Multi-Query Decomposition

Instead of a single RAG query, the system generates up to 3 focused queries per email, retrieves separately, and concatenates results. This improves recall for complex product inquiries.

### Pattern 6: Deployment via LangServe

The compiled graph can be deployed as a REST API using LangServe + FastAPI, with a built-in playground at `/playground` for testing.

### Adaptation Notes for Our AI Agency

1. **Replace Groq/Llama with our model routing** -- Use Sonnet for categorization and RAG queries (cheap, fast), Opus for email writing and proofreading (quality matters)
2. **Replace ChromaDB with pgvector** -- Aligns with our PostgreSQL decision; avoids separate vector DB
3. **Add Zalo/email channel support** -- Extend the Gmail tools pattern to support Zalo OA API for Vietnam market
4. **Add semantic caching** -- Cache categorization results and RAG answers for repeated similar queries to hit 70%+ gross margin target
5. **Vietnamese language prompts** -- Adapt all 5 prompt templates for Vietnamese customer communication
6. **Webhook-based triggering** -- Replace the polling approach (8-hour window) with Gmail push notifications via Pub/Sub for real-time response

---

## Links

- Tutorial: https://dev.to/kaymen99/boost-customer-support-ai-agents-langgraph-and-rag-for-email-automation-21hj
- Repo: https://github.com/kaymen99/langgraph-email-automation
- Gmail API Quickstart: https://developers.google.com/gmail/api/quickstart/python
