---
tags: [knowledge, agents, masterclass, patterns]
source_repo: ai-agents-masterclass
---

# AI Agents Masterclass - Knowledge Extraction

> Source: `C:\AI Build Learning\ai-agents-masterclass\`
> Author: Cole Medin (YouTube: @ColeMedin)
> Extracted: 2026-05-09

---

## Overview & Course Structure

A progressive YouTube masterclass teaching AI agent development from scratch to production-grade systems. Each numbered folder corresponds to one video episode. Non-numbered folders are supplemental standalone projects.

### Numbered Episodes (Core Masterclass)
| Folder | Topic |
|--------|-------|
| `1-first-agent` | Raw OpenAI API + manual tool calling loop |
| `2-langchain-agent` | Same agent rewritten with LangChain abstractions |
| `3-agent-ui` | Add Streamlit UI + streaming responses |
| `4-task-management-agent` | Multi-tool Asana agent (CRUD) |
| `5-rag-agent` | RAG with HuggingFace local LLM + Chroma |
| `6-rag-task-agent` | RAG + Asana tools combined |
| `7-langgraph-agent` | Rebuild with LangGraph StateGraph + persistence |
| `8-n8n-asana-agent` | Streamlit UI calling n8n webhook as backend |
| `9-n8n-rag-agent` | (folder present, no Python files extracted) |
| `10-deploy-ai-agent-langserve` | Deploy LangGraph agent via FastAPI + LangServe |

### Supplemental Projects
- `cost-saving-ai-router` - LLM routing (cheap vs expensive model)
- `llama3-function-calling-agent` - Local Llama3 (HuggingFace) tool calling without native tool support
- `local-llm-tool-calling` - Local LLM with JSON-structured tool calling
- `o1-ai-agent` - OpenAI o1-mini reasoning model agent
- `sql-ai-agent` - Multi-agent SQL system with OpenAI Swarm
- `local-swarm-agent` - Same Swarm system running on local Ollama models
- `pydantic-ai` - Pydantic AI framework web search agent
- `korvus-simple-rag` - Korvus (PostgreSQL-based) RAG pipeline
- `llm-agent-evaluation-framework` - Evaluation-ready LangGraph agent
- `n8n-langchain-agent` / `n8n-langchain-agent-advanced` - n8n webhooks as agent tools
- `n8n-streamlit-agent` - Streamlit with Supabase auth + n8n backend
- `local-ai-packaged` - OpenWebUI pipe function for n8n
- `madlibs` - Structured output / prompt chaining demo
- `streamlit-chatbot` - Minimal baseline chatbot
- `v0-agent-frontend` - (frontend only, no Python files)

---

## Agent Architecture Patterns

### Pattern 1: Raw OpenAI Loop (Baseline)
The simplest agent - direct API calls with manual tool dispatch.

```python
# 1-first-agent/agents.py
def prompt_ai(messages):
    completion = client.chat.completions.create(
        model=model,
        messages=messages,
        tools=get_tools()
    )
    response_message = completion.choices[0].message
    tool_calls = response_message.tool_calls

    if tool_calls:
        available_functions = {"create_asana_task": create_asana_task}
        messages.append(response_message)  # Add AI message with tool_call info

        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            function_response = available_functions[function_name](**function_args)

            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": function_response
            })

        # Second call: AI processes tool results
        second_response = client.chat.completions.create(model=model, messages=messages)
        return second_response.choices[0].message.content

    return response_message.content
```

Key insight: Tools defined as JSON schema objects in `get_tools()`. Two-step call: first to decide tool, second to respond with result.

---

### Pattern 2: LangChain ReAct Agent (Standard)
Use `@tool` decorator + `bind_tools()`. Recursive function handles multi-tool chains.

```python
# 2-langchain-agent/langchain-agent.py
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage

@tool
def create_asana_task(task_name, due_on="today"):
    """Full docstring = tool description for the LLM"""
    ...

def prompt_ai(messages, nested_calls=0):
    if nested_calls > 5:
        raise "AI is tool calling too much!"

    tools = [create_asana_task]
    # Auto-selects OpenAI or Anthropic based on model name
    asana_chatbot = ChatOpenAI(model=model) if "gpt" in model.lower() else ChatAnthropic(model=model)
    asana_chatbot_with_tools = asana_chatbot.bind_tools(tools)

    ai_response = asana_chatbot_with_tools.invoke(messages)

    if len(ai_response.tool_calls) > 0:
        messages.append(ai_response)
        for tool_call in ai_response.tool_calls:
            tool_output = available_functions[tool_call["name"]].invoke(tool_call["args"])
            messages.append(ToolMessage(tool_output, tool_call_id=tool_call["id"]))
        return prompt_ai(messages, nested_calls + 1)  # Recursive

    return ai_response
```

Key difference from Pattern 1: `@tool` decorator auto-generates JSON schema from docstring + type hints. Recursive calls handle multi-step reasoning.

---

### Pattern 3: Streaming Agent with UI
Same logic but uses `stream()` and `yield` to push chunks to Streamlit.

```python
# 3-agent-ui/agent-with-ui.py (condensed)
def prompt_ai(messages, nested_calls=0):
    stream = asana_chatbot_with_tools.stream(messages)
    first = True
    for chunk in stream:
        if first:
            gathered = chunk
            first = False
        else:
            gathered = gathered + chunk  # Accumulate chunks
        yield chunk  # Stream to UI

    if len(gathered.tool_calls) > 0:
        messages.append(gathered)
        for tool_call in gathered.tool_calls:
            tool_output = selected_tool.invoke(tool_call["args"])
            messages.append(ToolMessage(tool_output, tool_call_id=tool_call["id"]))
        # Recursive yield
        for additional_chunk in prompt_ai(messages, nested_calls + 1):
            yield additional_chunk
```

Streamlit integration:
```python
with st.chat_message("assistant"):
    stream = prompt_ai(st.session_state.messages)
    response = st.write_stream(stream)  # Built-in streaming display
st.session_state.messages.append(AIMessage(content=response))
```

---

### Pattern 4: LangGraph StateGraph (Production Standard)
Explicit graph with nodes, edges, and conditional routing. Supports persistence/memory via checkpointer.

```python
# 7-langgraph-agent/runnable.py (the key pattern)
from langgraph.graph import END, StateGraph
from langgraph.graph.message import AnyMessage, add_messages
from langgraph.checkpoint.aiosqlite import AsyncSqliteSaver
from typing import Annotated
from typing_extensions import TypedDict

class GraphState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]  # add_messages = append reducer

async def call_model(state: GraphState, config: RunnableConfig):
    response = await chatbot_with_tools.ainvoke(state["messages"], config)
    return {"messages": response}

def tool_node(state: GraphState):
    last_message = state["messages"][-1]
    outputs = []
    for call in last_message.tool_calls:
        tool = available_functions.get(call['name'])
        output = tool.invoke(call['args'])
        outputs.append(ToolMessage(output, tool_call_id=call['id']))
    return {'messages': outputs}

def should_continue(state: GraphState):
    last_message = state["messages"][-1]
    if not last_message.tool_calls:
        return END
    return "tools"

def get_runnable():
    workflow = StateGraph(GraphState)
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", tool_node)
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges("agent", should_continue)
    workflow.add_edge("tools", "agent")

    # In-memory SQLite checkpointer = conversation persistence per thread_id
    memory = AsyncSqliteSaver.from_conn_string(":memory:")
    return workflow.compile(checkpointer=memory)
```

Consuming LangGraph with streaming events:
```python
async for event in chatbot.astream_events({"messages": messages}, config, version="v2"):
    if event["event"] == "on_chat_model_stream":
        yield event["data"]["chunk"].content
```

Config carries `thread_id` for conversation isolation:
```python
config = {"configurable": {"thread_id": thread_id}}
```

---

### Pattern 5: OpenAI Swarm Multi-Agent
Each agent is specialized; transfers control by returning another agent object.

```python
# sql-ai-agent/sql_agents.py
from swarm import Agent

sql_router_agent = Agent(
    name="Router Agent",
    instructions="You are an orchestrator... determine which agent to transfer to."
)
rss_feed_agent = Agent(
    name="RSS Feed Agent",
    instructions=sql_agent_instructions + "\n\nHelp with RSS feed data.",
    functions=[run_sql_select_statement]
)

# Transfer functions - returning Agent object = handoff
def transfer_to_rss_feeds_agent():
    return rss_feed_agent

def transfer_back_to_router_agent():
    """Call this function if a user is asking about data not handled by the current agent."""
    return sql_router_agent

sql_router_agent.functions = [transfer_to_rss_feeds_agent, transfer_to_user_agent, transfer_to_analytics_agent]
rss_feed_agent.functions.append(transfer_back_to_router_agent)

# Run
from swarm.repl import run_demo_loop
run_demo_loop(sql_router_agent)
```

Local Ollama Swarm variant:
```python
# local-swarm-agent/run.py
ollama_client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")
client = Swarm(client=ollama_client)
# Each agent can specify its own model:
sql_router_agent = Agent(name="Router Agent", model="qwen2.5:3b", ...)
rss_feed_agent = Agent(name="RSS Feed Agent", model="qwen2.5-coder:7b", ...)
```

---

### Pattern 6: Pydantic AI Agent
Type-safe agent framework with dependency injection for context.

```python
# pydantic-ai/web_search_agent.py
from pydantic_ai import Agent, RunContext
from dataclasses import dataclass

@dataclass
class Deps:
    client: AsyncClient
    brave_api_key: str | None

web_search_agent = Agent(
    model,
    system_prompt='You are an expert at researching the web...',
    deps_type=Deps,
    retries=2
)

@web_search_agent.tool
async def search_web(ctx: RunContext[Deps], web_query: str) -> str:
    """Search the web given a query..."""
    # ctx.deps provides typed access to injected dependencies
    if ctx.deps.brave_api_key is None:
        return "Test result..."
    # Make API call with ctx.deps.client

# Run
async def main():
    async with AsyncClient() as client:
        deps = Deps(client=client, brave_api_key=os.getenv('BRAVE_API_KEY'))
        result = await web_search_agent.run('Your question', deps=deps)
        print(result.data)
```

Streaming in Streamlit:
```python
async with web_search_agent.run_stream(
    messages[-1].content, deps=deps, message_history=messages[:-1]
) as result:
    async for message in result.stream_text(delta=True):
        yield message
```

---

### Pattern 7: LangServe Deployment
Expose LangGraph agent as REST API using FastAPI + LangServe.

```python
# 10-deploy-ai-agent-langserve/langserve-endpoints.py
from langserve import add_routes
from fastapi import FastAPI

app = FastAPI(title="LangServe AI Agent")
runnable = get_runnable()
add_routes(app, runnable)
uvicorn.run(app, host="0.0.0.0", port=8000)
```

Remote client consumes the endpoint:
```python
from langserve import RemoteRunnable
chatbot = RemoteRunnable("http://localhost:8000")
async for event in chatbot.astream_events({"messages": messages}, config, version="v1"):
    if event["event"] == "on_chat_model_stream":
        yield event["data"]["chunk"].content
```

---

## Multi-Agent Systems

### Swarm Router Pattern
Orchestrator agent with no direct capabilities - only routes to specialists. Each specialist has a `transfer_back_to_router` function for escalation.

Architecture:
```
User
 └─> Router Agent (no tools, just routing)
      ├─> RSS Feed Agent (SQL queries + enthusiastic about feeds)
      ├─> User Agent (SQL queries about users)
      └─> Analytics Agent (SQL + accurate numbers, cites sources)
           └─> (each has transfer_back_to_router)
```

Pattern for handoff:
```python
# Agent A - returns Agent B to transfer control
def transfer_to_analytics_agent():
    return analytics_agent  # No docstring needed, name is self-explanatory

def transfer_back_to_router_agent():
    """Call this function if a user is asking about data that is not handled by the current agent."""
    return sql_router_agent  # Docstring guides WHEN to call it
```

### LangGraph Multi-Tool Agent
Single agent with many tools (Asana + Google Drive + Vector DB), tools separated into module files:

```python
# llm-agent-evaluation-framework/runnable.py
from tools.asana_tools import available_asana_functions
from tools.google_drive_tools import available_drive_functions
from tools.vector_db_tools import available_vector_db_functions

# Merge dicts - Python 3.9+ dict union operator
available_functions = available_asana_functions | available_drive_functions | available_vector_db_functions
tools = [tool for _, tool in available_functions.items()]
```

### n8n as Agent Backend
Two integration patterns:

1. **n8n webhook AS a tool** - LangChain agent calls n8n webhooks:
```python
def invoke_n8n_webhook(method, url, function_name, payload=None):
    headers = {"Authorization": f"Bearer {N8N_BEARER_TOKEN}"}
    response = requests.post(url, headers=headers, json=payload)
    return json.dumps(response.json(), indent=2)

@tool
def summarize_slack_conversation():
    return invoke_n8n_webhook("GET", SUMMARIZE_SLACK_CONVERSATION_WEBHOOK, ...)

@tool
def send_slack_message(message):
    return invoke_n8n_webhook("POST", SEND_SLACK_MESSAGE_WEBHOOK, ..., {"message": message})
```

2. **n8n AS the agent** - Streamlit just calls n8n webhook, n8n handles all AI logic:
```python
def prompt_ai(user_input):
    payload = {"chatInput": user_input, "sessionId": session_id}
    headers = {"Authorization": f"Bearer {webhook_auth}"}
    response = requests.post(webhook_url, json=payload, headers=headers)
    return response.json()  # n8n returns {"output": "AI response"}
```

---

## Tool Use & Function Calling

### Tool Definition: Three Methods

**Method 1: Raw JSON Schema (vanilla OpenAI)**
```python
def get_tools():
    return [{
        "type": "function",
        "function": {
            "name": "create_asana_task",
            "description": "Creates a task in Asana...",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_name": {"type": "string", "description": "The name of the task"},
                    "due_on": {"type": "string", "description": "Due date YYYY-MM-DD"}
                },
                "required": ["task_name"]
            }
        }
    }]
```

**Method 2: LangChain @tool decorator (recommended)**
```python
@tool
def create_asana_task(task_name: str, project_gid: str, due_on: str = "today") -> str:
    """
    Creates a task in Asana given the name of the task and when it is due

    Example call:
    create_asana_task("Test Task", "2024-06-24")
    Args:
        task_name (str): The name of the task
        project_gid (str): The ID of the project to add the task to
        due_on (str): Due date YYYY-MM-DD. If not given, current day is used
    Returns:
        str: API response or error message
    """
    # Implementation...
```

**Method 3: JSON output parsing (for models without native tool support)**
```python
# o1-ai-agent and local-llm-tool-calling
class ToolCall(BaseModel):
    name: str = Field(description="Name of the function to run")
    args: dict = Field(description="Arguments for the function call")

class ToolCallOrResponse(BaseModel):
    tool_calls: List[ToolCall] = Field(description="List of tool calls, empty if no tool needed")
    content: str = Field(description="Response to user if no tool needed")

parser = JsonOutputParser(pydantic_object=ToolCallOrResponse)
asana_chatbot = ChatOpenAI(model=model, temperature=1) | parser
ai_response = asana_chatbot.invoke(messages)  # Returns dict, not AI message

# Check for tool calls
if len(ai_response["tool_calls"]) > 0:
    for tool_call in ai_response["tool_calls"]:
        output = available_tools[tool_call["name"]].invoke(tool_call["args"])
```

### Tool Docstring Best Practices
The masterclass shows a consistent docstring format that serves double duty as both developer docs and LLM instructions:
```python
"""
One-line description for the LLM.

Example call:
function_name("example", "args")

Args:
    param1 (type): Description. Include constraints ("format YYYY-MM-DD", "not the name but the ID", etc.)
    param2 (type): Description with defaults noted.
Returns:
    str: Description of what is returned including response format for complex objects.
    The API response is an array of objects where each object looks like:
    {'gid': '1207789085525921', 'name': 'Project Name', 'resource_type': 'project'}
"""
```

### Available Functions Map Pattern
Always maintain a dict mapping name strings to tool objects:
```python
available_functions = {
    "create_asana_task": create_asana_task,
    "get_asana_projects": get_asana_projects,
    "update_asana_task": update_asana_task,
    "delete_task": delete_task
}

# Use it to build the tools list AND dispatch calls
tools = [tool for _, tool in available_functions.items()]
selected_tool = available_functions[tool_call["name"].lower()]
output = selected_tool.invoke(tool_call["args"])
```

### Tool Sets in This Repo
Complete working tool sets you can copy:

**Asana CRUD** (`tools/asana_tools.py`):
- `create_asana_task(task_name, project_gid, due_on)`
- `get_asana_projects()`
- `create_asana_project(project_name, due_on)`
- `get_asana_tasks(project_gid)`
- `update_asana_task(task_gid, data)` - data = `{"completed": True, "due_on": "YYYY-MM-DD"}`
- `delete_task(task_gid)`

**Google Drive** (`tools/google_drive_tools.py`):
- `search_file(query)` - query format: `name contains 'example'`
- `download_file(file_id, file_name, mime_type)`
- `upload_file(file_path, folder_id)`
- `delete_file(file_id)`
- `update_file(file_id, new_file_path)`
- `search_folder(query)`
- `create_folder(folder_name, parent_folder_id)`
- `delete_folder(folder_id)`
- `create_text_file(content, file_name)`

**Vector DB (Chroma RAG)** (`tools/vector_db_tools.py`):
- `query_documents(question)` - similarity search, returns top 3 with source
- `add_doc_to_knowledgebase(file_path)` - adds local file to Chroma
- `clear_knowledgebase()` - resets Chroma collection

**n8n Webhooks** (`n8n-langchain-agent/tools.py`):
- `summarize_slack_conversation()`
- `send_slack_message(message)`
- `create_google_doc(document_title, document_text)`

---

## Memory & State Management

### Conversation Memory: messages list
All examples use the same core pattern - maintain a list of typed message objects:

```python
# Initialize with system context
messages = [SystemMessage(content=f"You are... The current date is: {datetime.now().date()}")]

# User turn
messages.append(HumanMessage(content=user_input))

# AI turn (append after getting response)
messages.append(AIMessage(content=response_content))

# Tool turn (during tool execution)
messages.append(ToolMessage(tool_output, tool_call_id=tool_call["id"]))
```

In Streamlit, use `st.session_state.messages` to persist across reruns.

### LangGraph Persistence (Thread-based)
LangGraph with checkpointer provides automatic multi-turn memory. Each conversation identified by `thread_id`:

```python
# Generate once per session
thread_id = str(uuid.uuid4())

config = {"configurable": {"thread_id": thread_id}}
app.astream_events({"messages": new_messages_only}, config)
# LangGraph automatically loads + appends history for this thread_id
```

Memory backends:
- `AsyncSqliteSaver.from_conn_string(":memory:")` - in-memory, lost on restart
- Can swap to PostgreSQL checkpointer for persistence across restarts

### o1 "Thought" Memory Pattern
For models without native tool support, inject tool results as AI "thoughts":
```python
# Add result as an AI message that starts with "Thought:"
messages.append(AIMessage(content=f"Thought: - I called {tool_name} with args {tool_call['args']} and got back: {tool_output}."))

# Filter thoughts from display (show to LLM, hide from user)
if message_content.startswith("Thought:"):
    continue  # Don't render in UI
```

Repeat prevention:
```python
invoked_tools = []
if str(tool_call) not in invoked_tools:
    # Call tool
    invoked_tools.append(str(tool_call))
else:
    add_thought("Thought: - I already called this tool. I need to respond now and not make another tool call.")
```

---

## Code Patterns & Examples

### Model Selection Pattern (Multi-Provider)
Simple string matching to pick provider:
```python
# Simple two-way
asana_chatbot = ChatOpenAI(model=model) if "gpt" in model.lower() else ChatAnthropic(model=model)

# Multi-provider mapping (from evaluation framework)
model_mapping = {
    "gpt": ChatOpenAI,
    "claude": ChatAnthropic,
    "groq": ChatGroq,
    "llama": ChatGroq
}
for key, chatbot_class in model_mapping.items():
    if key in model.lower():
        chatbot = chatbot_class(model=model)
        break

# Provider-explicit override (advanced)
provider_mapping = {
    "openai": ChatOpenAI,
    "anthropic": ChatAnthropic,
    "ollama": ChatOllama,
    "llama": ChatGroq
}
if provider == "auto":
    # Use model_mapping
else:
    # Use provider_mapping
```

### Cost-Saving AI Router
Use cheap/fast model to classify query complexity, then route to appropriate model:

```python
# cost-saving-ai-router/cost-saving-task-agent.py
def decide_model_from_prompt(messages):
    ai_router = ChatGroq(model=groq_model)  # Free/cheap model for routing
    latest_messages = "\n\n".join([m.content for m in messages[-3:]])

    router_prompt = f"""
    Determine if the request requires one action (not complicated) or multiple actions (complicated).

    Last three messages:
    {latest_messages}

    Output CHEAP if not complicated, EXPENSIVE if complicated.
    Your output needs to be CHEAP or EXPENSIVE, nothing else.
    """
    response = ai_router.invoke(router_prompt)
    return response.content  # "CHEAP" or "EXPENSIVE"

# Then in the main function:
router_decided_model = decide_model_from_prompt(st.session_state.messages)
# Use Groq (free) for simple tasks, OpenAI GPT-4o for complex
asana_chatbot = ChatGroq(model=groq_model) if router_decided_model.lower() == "cheap" else ChatOpenAI(model=openai_model)
```

### RAG Pipeline

**Load & embed documents:**
```python
# 6-rag-task-agent/rag-document-loader.py
from langchain_community.document_loaders import DirectoryLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings
from langchain_chroma import Chroma

loader = DirectoryLoader("meeting_notes")  # Loads .txt, .pdf, etc.
documents = loader.load()
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
docs = text_splitter.split_documents(documents)

embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
Chroma.from_documents(docs, embedding_function, persist_directory="./chroma_db")
```

**Query at runtime:**
```python
db = Chroma(persist_directory="./chroma_db", embedding_function=embedding_function)
similar_docs = db.similarity_search(question, k=3)
docs_formatted = [
    f"Source: {doc.metadata.get('source', 'NA')}\nContent: {doc.page_content}"
    for doc in similar_docs
]
```

**RAG-as-tool (agent decides when to search docs):**
```python
@tool
def query_documents(question: str) -> str:
    """Uses RAG to query documents for information..."""
    similar_docs = db.similarity_search(question, k=3)
    return str([f"Source: {doc.metadata.get('source')}\nContent: {doc.page_content}" for doc in similar_docs])
```

**RAG pre-injection (always include context):**
```python
# 5-rag-agent approach - inject context before every LLM call
user_prompt = messages[-1].content
retrieved_context = query_documents(user_prompt)
formatted_prompt = f"Context:\n{retrieved_context}\nQuestion:\n{user_prompt}"
ai_response = doc_chatbot.invoke(messages[:-1] + [HumanMessage(content=formatted_prompt)])
```

### Streamlit Boilerplate (Complete Pattern)
```python
import streamlit as st
from langchain_core.messages import SystemMessage, AIMessage, HumanMessage
import json

def main():
    st.title("My Agent")

    # Initialize session state
    if "messages" not in st.session_state:
        st.session_state.messages = [
            SystemMessage(content=f"System prompt here. Current date: {datetime.now().date()}")
        ]

    # Render existing messages
    for message in st.session_state.messages:
        message_json = json.loads(message.json())
        message_type = message_json["type"]
        if message_type in ["human", "ai", "system"]:
            with st.chat_message(message_type):
                st.markdown(message_json["content"])

    # Handle user input
    if prompt := st.chat_input("What would you like to do today?"):
        st.chat_message("user").markdown(prompt)
        st.session_state.messages.append(HumanMessage(content=prompt))

        with st.chat_message("assistant"):
            stream = prompt_ai(st.session_state.messages)
            response = st.write_stream(stream)  # For generator-based streaming

        st.session_state.messages.append(AIMessage(content=response))
```

For async + LangGraph streaming:
```python
async def main():
    # ... (same init code)
    if prompt := st.chat_input("..."):
        # ...
        response_content = ""
        with st.chat_message("assistant"):
            message_placeholder = st.empty()
            async for chunk in prompt_ai(st.session_state.messages):
                response_content += chunk
                message_placeholder.markdown(response_content)  # Live update
        st.session_state.messages.append(AIMessage(content=response_content))

if __name__ == "__main__":
    asyncio.run(main())
```

### Structured Output with Pydantic + LangChain
```python
# madlibs/madlibs.py
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_core.prompts import PromptTemplate

class MadLib(BaseModel):
    text: str = Field(description="Mad Lib text with ___ for blanks")
    blanks: List[str] = Field(description="Array of blank types in order")

parser = JsonOutputParser(pydantic_object=MadLib)
prompt = PromptTemplate(template=mad_libs_prompt, input_variables=["theme"])

# LCEL chain
mad_lib_chain = prompt | ChatOpenAI(model=model) | parser
result = mad_lib_chain.invoke({"theme": "space exploration"})
# result is a dict: {"text": "...", "blanks": ["Noun", "Verb", ...]}
```

### Google Drive OAuth
```python
# tools/google_drive_tools.py
SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.file']

def get_google_drive_service():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("credentials/credentials.json", SCOPES)
            creds = flow.run_local_server(port=0)
        with open("token.json", "w") as token:
            token.write(creds.to_json())
    return build("drive", "v3", credentials=creds)
```

### Korvus RAG (PostgreSQL-based)
```python
# korvus-simple-rag/korvus_rag.py
from korvus import Collection, Pipeline

collection = Collection("squad")
pipeline = Pipeline("squadv1", {
    "text": {
        "splitter": {"model": "recursive_character"},
        "semantic_search": {"model": "intfloat/e5-small-v2"}
    }
})
await collection.add_pipeline(pipeline)
await collection.upsert_documents(documents[:200])

results = await collection.vector_search(
    {"query": {"fields": {"text": {"query": query}}}, "limit": 5},
    pipeline
)
```

### OpenWebUI n8n Pipe Function
```python
# local-ai-packaged/n8n_pipe.py
class Pipe:
    class Valves(BaseModel):
        n8n_url: str = Field(default="https://n8n.yourdomain.com/webhook/...")
        n8n_bearer_token: str = Field(default="...")
        input_field: str = Field(default="chatInput")
        response_field: str = Field(default="output")

    async def pipe(self, body: dict, __user__=None, __event_emitter__=None, __event_call__=None):
        messages = body.get("messages", [])
        question = messages[-1]["content"]
        headers = {"Authorization": f"Bearer {self.valves.n8n_bearer_token}"}
        payload = {"sessionId": chat_id, self.valves.input_field: question}
        response = requests.post(self.valves.n8n_url, json=payload, headers=headers)
        return response.json()[self.valves.response_field]
```

---

## What We Can Reuse

### Directly Copy-Paste
1. **LangGraph runnable template** (`7-langgraph-agent/runnable.py`) - Complete StateGraph with tool node, conditional edges, in-memory checkpointer. Drop in your tools.

2. **Asana tool set** (`tools/asana_tools.py`) - Full CRUD: create/get/update/delete tasks and projects. Client management business use case.

3. **Google Drive tool set** (`tools/google_drive_tools.py`) - Search, CRUD for files and folders. Upload/download with OAuth2.

4. **Vector DB tool set** (`tools/vector_db_tools.py`) - query_documents, add_doc_to_knowledgebase, clear_knowledgebase with Chroma.

5. **Streamlit chat UI boilerplate** - Both sync streaming and async LangGraph streaming versions.

6. **n8n webhook helper** (`n8n-langchain-agent/tools.py` - `invoke_n8n_webhook()`) - Generic GET/POST helper for calling any n8n webhook as a tool.

7. **Cost router pattern** (`cost-saving-ai-router`) - Use cheap LLM to classify, route to expensive only when needed.

8. **RAG document loader** (`6-rag-task-agent/rag-document-loader.py`) - DirectoryLoader + text splitter + Chroma persist.

### Patterns to Adapt for Vietnam Market / Agency Use
- **n8n as tools**: Perfect for Zalo/MoMo/VNPay integrations - implement webhooks in n8n, expose as tools
- **AI Router**: Use free Groq/Ollama for simple queries, Claude Sonnet for complex - maps to 70% margin target
- **Swarm multi-agent**: Router agent pattern for specialized agents (sales, support, billing)
- **LangGraph + LangServe**: Containerize and deploy the runnable.py pattern for production API
- **Supabase auth + n8n** (`n8n-streamlit-agent`): Login/signup flow ready for SaaS packaging

### Architecture for Production (Agency SaaS)
Combine these pieces:
```
Frontend (Streamlit / v0 React)
    └─> LangServe endpoint (FastAPI)
          └─> LangGraph StateGraph
                ├─> Agent node (ChatOpenAI/Anthropic with model routing)
                └─> Tools node
                      ├─> n8n webhook tools (CRM, Zalo, email)
                      ├─> Vector DB tools (Chroma/pgvector)
                      └─> Direct API tools (Asana-style CRUD)
```

---

## Lessons & Best Practices

### Agent Design
1. **Never expose IDs to users** - The system message pattern: "You never give IDs to the user since those are just for you to keep track of." Use IDs internally for API calls.

2. **Ask before creating** - "When a user asks to create a task and you don't know the project to add it to for sure, clarify with the user." Prevents wrong-project mistakes.

3. **Include current date in system prompt** - `f"The current date is: {datetime.now().date()}"` - agents need this for relative date calculations ("due tomorrow", "next week").

4. **Limit recursive depth** - All recursive tool-calling functions have a guard: `if nested_calls > 5: raise "AI is tool calling too much!"` - prevents infinite loops from bad tool outputs.

5. **Return strings from tools** - All tools return `str` (or serialize to JSON string). Never return raw objects. Use `json.dumps(api_response, indent=2)` for readability.

6. **Graceful error handling in tools** - Every tool wraps in try/except and returns error as string (not raise). LLM can then decide how to respond: `return f"Exception when calling TasksApi: {e}"`

### LangGraph Specific
7. **Filter empty AI messages** - The evaluation framework shows this fix for Anthropic streaming:
```python
messages = list(filter(
    lambda m: not isinstance(m, AIMessage) or hasattr(m, "response_metadata") and m.response_metadata,
    state["messages"]
))
```
Prevents sending empty streaming chunks to Anthropic which causes errors.

8. **Use `add_messages` reducer** - `Annotated[list[AnyMessage], add_messages]` in TypedDict state means you return just the new message, not the full list. LangGraph handles appending.

9. **Separate runnable.py from UI** - Every production example separates the `get_runnable()` function into its own module. UI imports it with `@st.cache_resource` to avoid re-creating on every Streamlit rerun.

### RAG Best Practices
10. **Pre-load Chroma separately** - Use `rag-document-loader.py` to build the DB once, then the agent loads from `persist_directory`. Don't rebuild on every startup.

11. **RAG as a tool vs RAG pre-injection** - Tool approach (agent decides when to search) is better for task agents. Pre-injection approach is better for pure Q&A chatbots.

12. **SentenceTransformer for local embeddings** - `all-MiniLM-L6-v2` is used consistently. Free, no API calls, good quality for English text.

### Cost Optimization
13. **Model routing saves 5-10x** - Groq llama3 (free) for simple queries, GPT-4o only for complex multi-step tasks. The router itself uses the cheap model.

14. **Return minimal tool output** - The cost-saving agent returns `"Task created successfully!"` instead of the full API response JSON. Less tokens for the LLM to process.

### Local LLM Patterns
15. **JSON prompt engineering for non-tool models** - For HuggingFace/Llama models without native function calling, provide the tool schema in the system message and use `JsonOutputParser`. The `tool_text` format in `o1-ai-agent` and `local-llm-tool-calling` is the template.

16. **Ollama uses OpenAI-compatible API** - `OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")` - any OpenAI SDK code works with Ollama, including Swarm.

17. **Different models per Swarm agent** - The router can use a tiny fast model (qwen2.5:3b), specialists use larger models (qwen2.5-coder:7b). Mix and match based on task complexity.

### Deployment
18. **LangServe = one-line API deployment** - `add_routes(app, runnable)` + `uvicorn.run()` = full REST API with streaming, input validation, and playground UI at `/docs`.

19. **`@st.cache_resource`** - Use this for expensive init: `get_runnable()`, `get_chroma_instance()`, `get_local_model()`. Runs once, cached across Streamlit reruns.

20. **Session ID for conversation isolation** - `session_id = str(uuid.uuid4())` generated once per browser session, passed to n8n/LangGraph to maintain separate conversation histories for different users.

---

## Technology Stack Summary

| Layer | Tool Used |
|-------|-----------|
| LLM Providers | OpenAI GPT-4o, Anthropic Claude, Groq (llama3), HuggingFace, Ollama |
| Agent Framework | LangChain, LangGraph, OpenAI Swarm, Pydantic AI |
| Vector DB | Chroma (local), Korvus (PostgreSQL-based) |
| Embeddings | SentenceTransformer all-MiniLM-L6-v2 (free, local) |
| UI | Streamlit |
| Deployment | FastAPI + LangServe + uvicorn |
| Automation | n8n (webhooks) |
| Auth | Supabase |
| Task Management | Asana API |
| File Storage | Google Drive API |
| Comms | Slack API (via n8n) |
| DB | SQLite (for Swarm SQL agent demo) |
