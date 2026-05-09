---
tags: [knowledge, sales, ai-agent, langchain, salesgpt]
moc: "[[08 Ban Hang Tu Dong]]"
source_repo: SalesGPT
files_read: 22
---

# SalesGPT - Knowledge Extraction

## Overview & Architecture

SalesGPT is an open-source, context-aware AI Sales Agent built on LangChain and LiteLLM. It simulates a real sales representative across multiple channels: voice, email, SMS, WhatsApp, WeChat, and other messaging platforms.

**Core Concept:** The agent is "context-aware" - it knows which stage of the sales conversation it is in and responds accordingly. It uses two parallel LLM chains running every turn:

1. **StageAnalyzerChain** - Analyzes conversation history and decides which conversation stage to move to (or stay at).
2. **SalesConversationChain** - Generates the actual agent utterance given the current stage and context.

When tools are enabled, a third component is used:
3. **AgentExecutor with LLMSingleActionAgent** - Handles tool calls (product lookup, payment link generation, email, Calendly).

**Key design decision:** Stage analysis is a separate LLM call, not embedded in the generation prompt. This allows independent control of conversation flow logic versus response generation.

### Architecture Flow

```
User Input
    |
    v
human_step()  --> appends "User: {input} <END_OF_TURN>" to conversation_history
    |
    v
step() / astep()
    |
    +--> [use_tools=True]  sales_agent_executor.invoke(inputs)
    |                         --> LLMSingleActionAgent
    |                         --> Tool calls (ProductSearch, GeneratePaymentLink, SendEmail, etc.)
    |                         --> Final output
    |
    +--> [use_tools=False] sales_conversation_utterance_chain.invoke(inputs)
    |                         --> Direct LLM generation
    |
    v
Append "{salesperson_name}: {output} <END_OF_TURN>" to conversation_history
    |
    v
determine_conversation_stage()
    --> StageAnalyzerChain analyzes full history
    --> Returns integer 1-8 indicating current stage
    --> Updates self.current_conversation_stage
```

### Class Hierarchy

```
Chain (LangChain base)
  └── SalesGPT (main controller)
        ├── StageAnalyzerChain (LLMChain subclass)
        ├── SalesConversationChain (LLMChain subclass)
        ├── CustomAgentExecutor (AgentExecutor subclass) [optional, tools mode]
        └── knowledge_base (RetrievalQA) [embedded in tools]
```


## Tech Stack & Dependencies

| Component | Library / Version |
|---|---|
| Core framework | LangChain 0.1.0 |
| LLM abstraction | LiteLLM ^1.10.2 (supports 50+ providers) |
| OpenAI models | langchain-openai 0.0.2, openai 1.7.0 |
| AWS Bedrock | boto3, aioboto3 ^12.3.0 |
| Vector store | ChromaDB ^0.4.18 |
| Embeddings | OpenAIEmbeddings |
| Data validation | Pydantic ^2.5.2 |
| API server | FastAPI + uvicorn |
| Token counting | tiktoken ^0.5.2 |
| Payment | Stripe (via external payment gateway) |
| Meeting scheduling | Calendly API |
| Email | Gmail SMTP (smtplib) |
| Observability | LangSmith tracing |
| Python version | 3.8-3.11 |


## Key Code Patterns (with snippets)

### Pattern 1: SalesGPT as a LangChain Chain

The main agent extends LangChain's `Chain` class, making it composable with other LangChain components.

```python
class SalesGPT(Chain):
    conversation_history: List[str] = []
    conversation_stage_id: str = "1"
    current_conversation_stage: str = CONVERSATION_STAGES.get("1")
    stage_analyzer_chain: StageAnalyzerChain = Field(...)
    sales_agent_executor: Union[CustomAgentExecutor, None] = Field(...)
    knowledge_base: Union[RetrievalQA, None] = Field(...)
    sales_conversation_utterance_chain: SalesConversationChain = Field(...)

    # Agent persona - all configurable
    salesperson_name: str = "Ted Lasso"
    salesperson_role: str = "Business Development Representative"
    company_name: str = "Sleep Haven"
    company_business: str = "..."
    company_values: str = "..."
    conversation_purpose: str = "find out whether they are looking to achieve better sleep..."
    conversation_type: str = "call"
    use_tools: bool = False
```

### Pattern 2: Factory Method from_llm

The canonical way to instantiate SalesGPT. All configuration comes through kwargs.

```python
@classmethod
def from_llm(cls, llm: ChatLiteLLM, verbose: bool = False, **kwargs) -> "SalesGPT":
    stage_analyzer_chain = StageAnalyzerChain.from_llm(llm, verbose=verbose)
    sales_conversation_utterance_chain = SalesConversationChain.from_llm(
        llm, verbose=verbose,
        use_custom_prompt=kwargs.pop("use_custom_prompt", False),
        custom_prompt=kwargs.pop("custom_prompt", None),
    )

    if use_tools:
        product_catalog = kwargs.pop("product_catalog", None)
        tools = get_tools(product_catalog)
        prompt = CustomPromptTemplateForTools(
            template=SALES_AGENT_TOOLS_PROMPT,
            tools_getter=lambda x: tools,
            input_variables=[...],
        )
        llm_chain = LLMChain(llm=llm, prompt=prompt, verbose=verbose)
        output_parser = SalesConvoOutputParser(ai_prefix=kwargs.get("salesperson_name", ""))
        sales_agent_with_tools = LLMSingleActionAgent(
            llm_chain=llm_chain,
            output_parser=output_parser,
            stop=["\nObservation:"],
            allowed_tools=tool_names,
        )
        sales_agent_executor = CustomAgentExecutor.from_agent_and_tools(
            agent=sales_agent_with_tools, tools=tools, verbose=verbose,
            return_intermediate_steps=True,
        )

    return cls(
        stage_analyzer_chain=stage_analyzer_chain,
        sales_conversation_utterance_chain=sales_conversation_utterance_chain,
        sales_agent_executor=sales_agent_executor,
        knowledge_base=knowledge_base,
        model_name=llm.model,
        verbose=verbose,
        use_tools=use_tools,
        **kwargs,
    )
```

### Pattern 3: _call Method - The Conversation Step

Every agent turn calls `_call`, which assembles context and dispatches to the right chain:

```python
def _call(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
    inputs = {
        "input": "",
        "conversation_stage": self.current_conversation_stage,
        "conversation_history": "\n".join(self.conversation_history),
        "salesperson_name": self.salesperson_name,
        "salesperson_role": self.salesperson_role,
        "company_name": self.company_name,
        "company_business": self.company_business,
        "company_values": self.company_values,
        "conversation_purpose": self.conversation_purpose,
        "conversation_type": self.conversation_type,
    }
    if self.use_tools:
        ai_message = self.sales_agent_executor.invoke(inputs)
        output = ai_message["output"]
    else:
        ai_message = self.sales_conversation_utterance_chain.invoke(inputs, return_intermediate_steps=True)
        output = ai_message["text"]

    agent_name = self.salesperson_name
    output = agent_name + ": " + output
    if "<END_OF_TURN>" not in output:
        output += " <END_OF_TURN>"
    self.conversation_history.append(output)
    return ai_message
```

### Pattern 4: Conversation History Format

Conversation history is stored as a flat list of strings with special tokens:

```python
# Agent message format:
"Ted Lasso: Hello! How are you today? <END_OF_TURN>"

# User message format (from human_step):
"User: I want to know about mattress prices <END_OF_TURN>"

# End of call signal:
"<END_OF_CALL>"  # Agent decides conversation is done
```

### Pattern 5: Output Parser for Tool Calls

Regex-based parser extracts Action/Action Input from LLM output:

```python
class SalesConvoOutputParser(AgentOutputParser):
    ai_prefix: str = "AI"

    def parse(self, text: str) -> Union[AgentAction, AgentFinish]:
        regex = r"Action: (.*?)[\n]*Action Input: (.*)"
        match = re.search(regex, text)
        if not match:
            # No tool call - finish with agent response
            return AgentFinish(
                {"output": text.split(f"{self.ai_prefix}:")[-1].strip()}, text
            )
        action = match.group(1)
        action_input = match.group(2)
        return AgentAction(action.strip(), action_input.strip(" ").strip('"'), text)
```

### Pattern 6: Custom Prompt Template for Tools

Builds the agent_scratchpad from intermediate steps (ReAct pattern):

```python
class CustomPromptTemplateForTools(StringPromptTemplate):
    template: str
    tools_getter: Callable

    def format(self, **kwargs) -> str:
        intermediate_steps = kwargs.pop("intermediate_steps")
        thoughts = ""
        for action, observation in intermediate_steps:
            thoughts += action.log
            thoughts += f"\nObservation: {observation}\nThought: "
        kwargs["agent_scratchpad"] = thoughts
        tools = self.tools_getter(kwargs["input"])
        kwargs["tools"] = "\n".join([f"{tool.name}: {tool.description}" for tool in tools])
        kwargs["tool_names"] = ", ".join([tool.name for tool in tools])
        return self.template.format(**kwargs)
```

### Pattern 7: Stage Analyzer Chain

```python
class StageAnalyzerChain(LLMChain):
    @classmethod
    def from_llm(cls, llm: ChatLiteLLM, verbose: bool = True) -> LLMChain:
        prompt = PromptTemplate(
            template=STAGE_ANALYZER_INCEPTION_PROMPT,
            input_variables=["conversation_history", "conversation_stage_id", "conversation_stages"],
        )
        return cls(prompt=prompt, llm=llm, verbose=verbose)
```

Invocation with full stage dict:

```python
stage_analyzer_output = self.stage_analyzer_chain.invoke(
    input={
        "conversation_history": "\n".join(self.conversation_history).rstrip("\n"),
        "conversation_stage_id": self.conversation_stage_id,
        "conversation_stages": "\n".join(
            [str(key) + ": " + str(value) for key, value in CONVERSATION_STAGES.items()]
        ),
    },
    return_only_outputs=False,
)
self.conversation_stage_id = stage_analyzer_output.get("text")
```

### Pattern 8: Async Support

Full async equivalents for all operations, useful for the FastAPI server:

```python
async def astep(self, stream: bool = False):
    if not stream:
        return await self.acall(inputs={})
    else:
        return await self._astreaming_generator()

async def adetermine_conversation_stage(self):
    stage_analyzer_output = await self.stage_analyzer_chain.ainvoke(...)
```

### Pattern 9: Streaming Generator

For voice/real-time applications with <1s latency target:

```python
def _streaming_generator(self):
    messages = self._prep_messages()
    return self.sales_conversation_utterance_chain.llm.completion_with_retry(
        messages=messages,
        stop="<END_OF_TURN>",
        stream=True,
        model=self.model_name,
    )
```

### Pattern 10: Session Management in API

The FastAPI server maintains a sessions dict keyed by session_id:

```python
sessions = {}

@app.post("/chat")
async def chat_with_sales_agent(req: MessageList, ...):
    if req.session_id in sessions:
        sales_api = sessions[req.session_id]
    else:
        sales_api = SalesGPTAPI(config_path=..., product_catalog=..., ...)
        sessions[req.session_id] = sales_api

    response = await sales_api.do(req.human_say)
    return response
```


## Sales Conversation Flow

### The 8 Stages

```python
CONVERSATION_STAGES = {
    "1": "Introduction: Start the conversation by introducing yourself and your company. Be polite and respectful while keeping the tone of the conversation professional. Your greeting should be welcoming. Always clarify in your greeting the reason why you are calling.",
    "2": "Qualification: Qualify the prospect by confirming if they are the right person to talk to regarding your product/service. Ensure that they have the authority to make purchasing decisions.",
    "3": "Value proposition: Briefly explain how your product/service can benefit the prospect. Focus on the unique selling points and value proposition of your product/service that sets it apart from competitors.",
    "4": "Needs analysis: Ask open-ended questions to uncover the prospect's needs and pain points. Listen carefully to their responses and take notes.",
    "5": "Solution presentation: Based on the prospect's needs, present your product/service as the solution that can address their pain points.",
    "6": "Objection handling: Address any objections that the prospect may have regarding your product/service. Be prepared to provide evidence or testimonials to support your claims.",
    "7": "Close: Ask for the sale by proposing a next step. This could be a demo, a trial or a meeting with decision-makers. Ensure to summarize what has been discussed and reiterate the benefits.",
    "8": "End conversation: It's time to end the call as there is nothing else to be said.",
}
```

### Stage Progression Rules

- Stages do NOT have to be visited in linear order - the LLM can skip stages.
- If conversation history is empty, always start at Stage 1 (Introduction).
- Agent can jump back to earlier stages (e.g., back to Needs Analysis after an objection).
- The stage analyzer returns only a number (1-8), no explanation text.
- Stage 8 triggers end of conversation; API checks for `<END_OF_CALL>` token.

### Conversation Turn Flow Per Exchange

```
1. User sends message
2. human_step() - append to history
3. step() - generate agent response (with or without tool calls)
4. Append agent response to history
5. determine_conversation_stage() - separate LLM call to update stage
6. Return response to user
```

### End of Conversation Detection

```python
# In SalesGPTAPI.do():
if "<END_OF_CALL>" in self.sales_agent.conversation_history[-1]:
    print("Sales Agent determined it is time to end the conversation.")
    self.sales_agent.conversation_history[-1] = \
        self.sales_agent.conversation_history[-1].replace("<END_OF_CALL>", "")

# In run.py CLI:
if "<END_OF_CALL>" in sales_agent.conversation_history[-1]:
    print("Sales Agent determined it is time to end the conversation.")
    break
```


## Prompt Templates

### 1. SALES_AGENT_INCEPTION_PROMPT (No Tools - Direct Generation)

```
Never forget your name is {salesperson_name}. You work as a {salesperson_role}.
You work at company named {company_name}. {company_name}'s business is the following: {company_business}.
Company values are the following. {company_values}
You are contacting a potential prospect in order to {conversation_purpose}
Your means of contacting the prospect is {conversation_type}

If you're asked about where you got the user's contact information, say that you got it from public records.
Keep your responses in short length to retain the user's attention. Never produce lists, just answers.
Start the conversation by just a greeting and how is the prospect doing without pitching in your first turn.
When the conversation is over, output <END_OF_CALL>
Always think about at which conversation stage you are at before answering:

1: Introduction: Start the conversation by introducing yourself and your company. Be polite and respectful while keeping the tone of the conversation professional. Your greeting should be welcoming. Always clarify in your greeting the reason why you are calling.
2: Qualification: Qualify the prospect by confirming if they are the right person to talk to regarding your product/service. Ensure that they have the authority to make purchasing decisions.
3: Value proposition: Briefly explain how your product/service can benefit the prospect. Focus on the unique selling points and value proposition of your product/service that sets it apart from competitors.
4: Needs analysis: Ask open-ended questions to uncover the prospect's needs and pain points. Listen carefully to their responses and take notes.
5: Solution presentation: Based on the prospect's needs, present your product/service as the solution that can address their pain points.
6: Objection handling: Address any objections that the prospect may have regarding your product/service. Be prepared to provide evidence or testimonials to support your claims.
7: Close: Ask for the sale by proposing a next step. This could be a demo, a trial or a meeting with decision-makers. Ensure to summarize what has been discussed and reiterate the benefits.
8: End conversation: The prospect has to leave to call, the prospect is not interested, or next steps where already determined by the sales agent.

Example 1:
Conversation history:
{salesperson_name}: Hey, good morning! <END_OF_TURN>
User: Hello, who is this? <END_OF_TURN>
{salesperson_name}: This is {salesperson_name} calling from {company_name}. How are you?
User: I am well, why are you calling? <END_OF_TURN>
{salesperson_name}: I am calling to talk about options for your home insurance. <END_OF_TURN>
User: I am not interested, thanks. <END_OF_TURN>
{salesperson_name}: Alright, no worries, have a good day! <END_OF_TURN> <END_OF_CALL>
End of example 1.

You must respond according to the previous conversation history and the stage of the conversation you are at.
Only generate one response at a time and act as {salesperson_name} only! When you are done generating, end with '<END_OF_TURN>' to give the user a chance to respond.

Conversation history:
{conversation_history}
{salesperson_name}:
```

Key prompt engineering decisions:
- Persona injected at the top ("Never forget your name is...") - strong identity anchoring
- Stage definitions embedded in the prompt body (8 stages listed inline)
- Concrete few-shot example conversation - dramatically improves consistency
- Explicit format instruction: end with `<END_OF_TURN>`
- "No lists" instruction: keeps voice-friendly responses
- "Short response" instruction: retains attention

### 2. SALES_AGENT_TOOLS_PROMPT (With Tools - ReAct Pattern)

Same persona and stage section as above, then adds ReAct tool-use instructions:

```
TOOLS:
------

{salesperson_name} has access to the following tools:

{tools}

To use a tool, please use the following format:

Thought: Do I need to use a tool? Yes
Action: the action to take, should be one of {tools}
Action Input: the input to the action, always a simple string input
Observation: the result of the action

If the result of the action is "I don't know." or "Sorry I don't know", then you have to say that to the user as described in the next sentence.
When you have a response to say to the Human, or if you do not need to use a tool, or if tool did not help, you MUST use the format:

Thought: Do I need to use a tool? No
{salesperson_name}: [your response here, if previously used a tool, rephrase latest observation, if unable to find the answer, say it]

You must respond according to the previous conversation history and the stage of the conversation you are at.
Only generate one response at a time and act as {salesperson_name} only!

Begin!

Previous conversation history:
{conversation_history}

Thought:
{agent_scratchpad}
```

### 3. STAGE_ANALYZER_INCEPTION_PROMPT

```
You are a sales assistant helping your sales agent to determine which stage of a sales conversation should the agent stay at or move to when talking to a user.
Start of conversation history:
===
{conversation_history}
===
End of conversation history.

Current Conversation stage is: {conversation_stage_id}

Now determine what should be the next immediate conversation stage for the agent in the sales conversation by selecting only from the following options:
{conversation_stages}

The answer needs to be one number only from the conversation stages, no words.
Only use the current conversation stage and conversation history to determine your answer!
If the conversation history is empty, always start with Introduction!
If you think you should stay in the same conversation stage until user gives more input, just output the current conversation stage.
Do not answer anything else nor add anything to your answer.
```

Key prompt engineering decisions:
- Completely separate prompt from generation - concerns are separated
- Only outputs a single number - zero-ambiguity parsing
- Instruction to stay in current stage if no new info - prevents premature jumping
- Explicit empty history handling ("always start with Introduction!")

### 4. Chinese (CN) Prompts - prompts_cn.py

Full Chinese translations of all three prompts exist. The structure is identical, only language differs. The CN Stage Analyzer ends with: "若没有之前的对话记录，直接输出数字 1" (If no prior history, directly output number 1). This demonstrates the pattern is fully language-agnostic.

### 5. Custom Prompt Support via Config

Agents can override the default prompt entirely via config:

```json
{
    "use_custom_prompt": "True",
    "custom_prompt": "Never forget your name is {salesperson_name}..."
}
```

Required template variables for custom prompts:
`{salesperson_name}`, `{salesperson_role}`, `{company_name}`, `{company_business}`, `{company_values}`, `{conversation_purpose}`, `{conversation_type}`, `{conversation_history}`


## Tools & Knowledge Base Integration

### Tool List (4 built-in tools)

```python
tools = [
    Tool(
        name="ProductSearch",
        func=knowledge_base.run,
        description="useful for when you need to answer questions about product information or services offered, availability and their costs.",
    ),
    Tool(
        name="GeneratePaymentLink",
        func=generate_stripe_payment_link,
        description="useful to close a transaction with a customer. You need to include product name and quantity and customer name in the query input.",
    ),
    Tool(
        name="SendEmail",
        func=send_email_tool,
        description="Sends an email based on the query input. The query should specify the recipient, subject, and body of the email.",
    ),
    Tool(
        name="SendCalendlyInvitation",
        func=generate_calendly_invitation_link,
        description="Useful for when you need to create invite for a personal meeting. Sends a calendly invitation based on the query input.",
    ),
]
```

### Knowledge Base Setup (RAG Pattern)

Product catalog is a plain text file loaded into ChromaDB:

```python
def setup_knowledge_base(product_catalog: str = None, model_name: str = "gpt-3.5-turbo"):
    with open(product_catalog, "r") as f:
        product_catalog = f.read()

    text_splitter = CharacterTextSplitter(chunk_size=5000, chunk_overlap=200)
    texts = text_splitter.split_text(product_catalog)

    llm = ChatOpenAI(model_name="gpt-4-0125-preview", temperature=0)
    embeddings = OpenAIEmbeddings()
    docsearch = Chroma.from_texts(texts, embeddings, collection_name="product-knowledge-base")

    knowledge_base = RetrievalQA.from_chain_type(
        llm=llm, chain_type="stuff", retriever=docsearch.as_retriever()
    )
    return knowledge_base
```

### Payment Link Generation Flow

```python
def generate_stripe_payment_link(query: str) -> str:
    # Step 1: Use LLM to extract Stripe price_id from natural language
    price_id = get_product_id_from_query(query, PRODUCT_PRICE_MAPPING)
    # price_id comes from: {"product_name": "stripe_price_id", ...} JSON mapping

    # Step 2: Call payment gateway API
    payload = json.dumps({"prompt": query, **price_id, "stripe_key": os.getenv("STRIPE_API_KEY")})
    response = requests.request("POST", PAYMENT_GATEWAY_URL, headers=headers, data=payload)
    return response.text  # Returns Stripe checkout URL
```

Product-to-Stripe price mapping (example_product_price_id_mapping.json):

```json
{
    "Luxury Cloud-Comfort Memory Foam Mattress": "price_1Owv99B795AYY8p1mjtbKyxP",
    "Classic Harmony Spring Mattress": "price_1Owv9qB795AYY8p1tPcxCM6T",
    "EcoGreen Hybrid Latex Mattress": "price_1OwvLDB795AYY8p1YBAMBcbi",
    "Plush Serenity Bamboo Mattress": "price_1OwvMQB795AYY8p1hJN2uS3S"
}
```

### Email Tool Flow

LLM extracts structured data from natural language, then sends via Gmail SMTP:

```python
def send_email_tool(query):
    # LLM extracts: {"recipient": "...", "subject": "...", "body": "..."}
    email_details = get_mail_body_subject_from_query(query)
    result = send_email_with_gmail(email_details)
    return result
```

### Calendly Meeting Scheduling

```python
def generate_calendly_invitation_link(query):
    event_type_uuid = os.getenv("CALENDLY_EVENT_UUID")
    payload = {
        "max_event_count": 1,
        "owner": f"https://api.calendly.com/event_types/{event_type_uuid}",
        "owner_type": "EventType"
    }
    response = requests.post('https://api.calendly.com/scheduling_links', json=payload, headers=headers)
    # Returns: "url: https://calendly.com/..."
```

### Product Catalog Format (plain text)

```
Sleep Haven product 1: Luxury Cloud-Comfort Memory Foam Mattress
Experience the epitome of opulence...
Price: $999
Sizes available for this product: Twin, Queen, King

Sleep Haven product 2: Classic Harmony Spring Mattress
...
Price: $1,299
```

### AWS Bedrock / Claude Integration

For Anthropic Claude models on Bedrock, a custom `BedrockCustomModel` wraps the Bedrock API and implements the LangChain `ChatOpenAI` interface:

```python
class BedrockCustomModel(ChatOpenAI):
    model: str
    system_prompt: str

    def _generate(self, messages, ...) -> ChatResult:
        response = completion_bedrock(
            model_id=self.model,
            system_prompt=self.system_prompt,
            messages=[{"content": last_message.content, "role": "user"}],
        )
        content = response["content"][0]["text"]
        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])
```

Usage:
```python
llm = BedrockCustomModel(
    type="bedrock-model",
    model="anthropic.claude-3-sonnet-20240229-v1:0",
    system_prompt="You are a helpful assistant."
)
```


## Configuration & Setup

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-xxx

# Payment (for GeneratePaymentLink tool)
STRIPE_API_KEY=sk_test_xxx
PAYMENT_GATEWAY_URL=https://agent-payments-gateway.vercel.app/payment
PRODUCT_PRICE_MAPPING=examples/example_product_price_id_mapping.json
GPT_MODEL=gpt-3.5-turbo-1106

# Email (for SendEmail tool)
GMAIL_MAIL=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Calendly (for SendCalendlyInvitation tool)
CALENDLY_API_KEY=your_api_key
CALENDLY_EVENT_UUID=your_event_uuid

# AWS Bedrock (for Anthropic/Claude models)
AWS_REGION_NAME=us-east-1

# Observability
LANGCHAIN_TRACING_V2=false
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_PROJECT=your_project_name

# API Server
AUTH_KEY=your_secret_key
ENVIRONMENT=production   # if set, requires Bearer auth on all endpoints
CONFIG_PATH=examples/example_agent_setup.json
PRODUCT_CATALOG=examples/sample_product_catalog.txt
USE_TOOLS_IN_API=True
```

### Agent Config JSON

```json
{
    "salesperson_name": "Ted Lasso",
    "salesperson_role": "Business Development Representative",
    "company_name": "Sleep Haven",
    "company_business": "Sleep Haven is a premium mattress company...",
    "company_values": "Our mission at Sleep Haven is to help people achieve a better night's sleep...",
    "conversation_purpose": "find out whether they are looking to achieve better sleep via buying a premier mattress.",
    "conversation_type": "call",
    "use_custom_prompt": "True",
    "custom_prompt": "Never forget your name is {salesperson_name}..."
}
```

### Quick Start Code

```python
from salesgpt.agents import SalesGPT
from langchain_community.chat_models import ChatLiteLLM

llm = ChatLiteLLM(temperature=0.4, model_name="gpt-4-0125-preview")

sales_agent = SalesGPT.from_llm(
    llm,
    use_tools=True,
    verbose=False,
    product_catalog="examples/sample_product_catalog.txt",
    salesperson_name="Ted Lasso",
    salesperson_role="Sales Representative",
    company_name="Sleep Haven",
    company_business="Sleep Haven is a premium mattress company...",
)
sales_agent.seed_agent()
sales_agent.determine_conversation_stage()
sales_agent.step()

user_input = input("Your response: ")
sales_agent.human_step(user_input)
sales_agent.step()
```


## API & Integration Patterns

### FastAPI Backend Endpoints

```
GET  /           -> {"message": "Hello World"}
GET  /botname    -> {"name": "Ted Lasso", "model": "gpt-3.5-turbo-0613"}
POST /chat       -> Full conversation turn
```

### POST /chat Request/Response

Request body:
```json
{
    "session_id": "unique-session-id",
    "human_say": "What mattress prices do you have?"
}
```

Response payload:
```json
{
    "bot_name": "Ted Lasso",
    "response": "We offer three mattresses...",
    "conversational_stage": "Value proposition: Briefly explain...",
    "tool": "ProductSearch",
    "tool_input": "mattress prices",
    "action_output": "Sleep Haven offers three mattresses...",
    "action_input": "",
    "model_name": "gpt-3.5-turbo-0613"
}
```

The response includes full tool usage details - useful for frontend display and audit logging.

### SalesGPTAPI Wrapper Class

High-level API layer used by the FastAPI server:

```python
class SalesGPTAPI:
    def __init__(self, config_path, verbose, max_num_turns=20, model_name, product_catalog, use_tools):
        self.sales_agent = self.initialize_agent()
        self.current_turn = 0

    async def do(self, human_input=None) -> dict:
        # One full turn: human input -> agent response -> stage update
        # Enforces max_num_turns limit
        # Returns full payload dict

    async def do_stream(self, conversation_history, human_input=None):
        # Streaming version (partially implemented, yields tokens)
```

### CORS Configuration (pre-configured)

```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://react-frontend:80",
    "https://sales-gpt-frontend.vercel.app"
]
```

### Bearer Token Authentication

When `ENVIRONMENT=production`, all endpoints require:
```
Authorization: Bearer {AUTH_KEY}
```

### Docker Deployment

```bash
docker-compose up -d           # Start all (backend port 8000, frontend port 3000)
docker-compose up -d backend   # Backend only
```

Access: `http://localhost:3000/chat`

### CLI Usage

```bash
python run.py --verbose True --config examples/example_agent_setup.json
python run.py --max_num_turns 10
```


## What We Can Reuse

### 1. The Two-Chain Architecture (Most Valuable)

Separate "what stage am I in" reasoning from "what should I say" generation. Apply to any multi-step conversation:

```python
# Per turn in our Vietnamese market AI sales agent:
stage = stage_analyzer.invoke({"history": history, "current_stage": stage_id})
# -> returns "3" (Value Proposition stage)

response = response_generator.invoke({**persona_context, "stage": stage})
# -> returns natural language response appropriate to that stage
```

### 2. ReAct Tool-Use Pattern

The `Thought/Action/Action Input/Observation` loop is battle-tested. Reuse `CustomPromptTemplateForTools` and `SalesConvoOutputParser` directly for any tool-enabled agent.

### 3. Conversation History with Turn Tokens

```python
"User: {input} <END_OF_TURN>"
"{AgentName}: {output} <END_OF_TURN>"
```

Clean, parseable, LLM-agnostic. The `<END_OF_TURN>` token controls generation stopping reliably.

### 4. Agent Config via JSON File

Multi-tenant system: each client gets a config file. Zero code changes for new client persona. Critical for agency business model.

### 5. Product Catalog as Plain Text + RAG

Load product info as text, chunk it, embed into ChromaDB. No structured DB needed. Swap ChromaDB for pgvector to match our architecture.

### 6. LiteLLM for Multi-Provider Support

`ChatLiteLLM` instead of `ChatOpenAI` = switch between GPT-4, Claude, Gemini, Llama by changing model_name. Directly enables our Sonnet/Opus routing strategy.

### 7. Payment Tool Pattern - Adaptable to Vietnam

The pattern: `natural language -> LLM extracts product intent -> look up price ID -> call payment API -> return URL` is directly applicable to:
- MoMo payment QR codes
- VNPay payment links
- ZaloPay checkout URLs

Just replace `generate_stripe_payment_link` with a Vietnamese payment gateway wrapper.

### 8. Session Management Pattern

```python
sessions = {}  # session_id -> SalesGPTAPI instance
```

Simplest possible multi-user session manager. Replace with Redis for production.

### 9. `<END_OF_CALL>` Signal Pattern

Having the LLM signal conversation end via a special token is elegant and reliable. The API strips the token before returning to client. Reuse for any conversation-ending logic.

### 10. Model Routing in Practice

GPT-3.5-turbo for conversation management (cheap), GPT-4 for knowledge base QA (accurate). Demonstrates model routing in a real production context - exactly what our 70% margin target requires.

### 11. time_logger Decorator

```python
@time_logger
def seed_agent(self): ...
```

Zero-cost performance monitoring for every agent method. Pin down where latency actually comes from.

### 12. Multi-Language Architecture

The project ships English, Chinese, and Spanish variants. For Vietnamese market: translate prompts, keep same Python code. Pay special attention to Stage Analyzer - it must return only a number regardless of language.

### 13. `<END_OF_CALL>` + max_num_turns Defense

Always implement both: LLM-signaled end AND hard turn limit. Defense in depth against runaway conversations.


## Lessons & Best Practices

### 1. Stage-Awareness is the Core Innovation

Most sales chatbots are stateless. The stage analyzer solves this. Key insight: **use a separate LLM call for meta-reasoning** (what stage am I in?) vs. object-level reasoning (what should I say?). Separation of concerns makes each chain simpler, cheaper, and more debuggable.

### 2. Keep System Prompts Short and Actionable

The prompts use these proven techniques:
- "Never forget your name is..." - strong identity anchoring, prevents persona drift
- "Keep your responses in short length" - explicit formatting control
- "Never produce lists, just answers" - voice-friendly, attention-retaining
- "Only generate one response at a time" - prevents runaway generation
- Concrete few-shot examples - the single biggest quality improvement

### 3. The `<END_OF_TURN>` Token Pattern

Training the LLM to output a special token when done speaking is far more reliable than detecting conversation end programmatically. Also used as a stop token for streaming to truncate output early.

### 4. Tools Need Minimal, Precise Descriptions

Tool descriptions inject directly into the prompt. Short and specific beats long and thorough:
- Good: "useful for when you need to answer questions about product information or services offered, availability and their costs."
- The description IS the tool selection heuristic. Write it from the LLM's perspective.

### 5. RAG for Product Knowledge Reduces Hallucination

Without a knowledge base, the agent invents product details and prices. With `ProductSearch` returning real data from a vector store, factual errors about the product catalog nearly disappear. This is the #1 reliability improvement.

### 6. Async Throughout for Production APIs

The `acall`, `astep`, `adetermine_conversation_stage` async variants are required for multi-user production. One blocking LLM call freezes all concurrent sessions without them.

### 7. LLM Temperature by Task Type

- Stage Analyzer: temperature 0.0-0.2 (want deterministic stage classification)
- Conversation generation: temperature 0.2-0.4 (want natural variation, not hallucination)
- Tool parameter extraction (product ID lookup): temperature 0 (want exact matching)

### 8. Max Turns as Safety Net

Always set `max_num_turns` (default 20 in the API). Without it, a confused user or edge case can run the agent indefinitely. The API returns a friendly fallback message when the limit is hit.

### 9. Model Routing in Practice

Use cheaper models for conversation management, expensive models only for critical reasoning. SalesGPT uses GPT-3.5-turbo for main agent conversation (cheap/fast) and GPT-4 for knowledge base QA (accurate). This is the exact pattern needed to hit our 70% margin target.

### 10. Config-Driven Persona

The McDonald's order hotline example proves the same codebase handles completely different use cases via config alone. Every client is a JSON file. No code changes needed. Essential for agency model at scale.

### 11. Intermediate Steps in API Response

Return `intermediate_steps` (which tools were called, with what inputs, and what they returned) in the API response. This enables:
- Debugging in development
- Frontend display ("Searched for: mattress prices")
- Audit logging in production
- Human-in-the-loop review workflows

### 12. LLM as Intent Parser for Structured Actions

The `get_product_id_from_query()` pattern (LLM translates "I'll take two of those" -> Stripe price ID) is a general pattern. Use it whenever you need to bridge natural language to a structured API call. This is the key to making tool use feel natural.

### 13. Voice Optimization Targets

The architecture targets <1s round-trip for voice:
- Streaming generator: start TTS before full response arrives
- Async throughout: avoid I/O blocking
- Short response instruction in prompt: keep audio clips brief
- No list generation: lists break TTS prosody

### 14. Testing Without API Spend

```python
with patch("salesgpt.agents.SalesGPT._call", return_value=MOCK_RESPONSE):
    sales_agent.step()
```

Mock at the `_call` level to run full integration tests without spending API credits. Essential for CI/CD.

### 15. CustomAgentExecutor Pattern

The `CustomAgentExecutor` subclass adds `intermediate_steps` capture that the base `AgentExecutor` doesn't expose cleanly. When you need to inspect what an agent did internally (for logging, debugging, or the API response), subclass the executor.


## Project Structure Summary

```
SalesGPT/
├── salesgpt/
│   ├── agents.py          # SalesGPT main class - the controller
│   ├── chains.py          # StageAnalyzerChain + SalesConversationChain
│   ├── prompts.py         # English prompt templates (3 prompts)
│   ├── prompts_cn.py      # Chinese prompt templates
│   ├── stages.py          # CONVERSATION_STAGES dict (8 stages)
│   ├── templates.py       # CustomPromptTemplateForTools
│   ├── tools.py           # 4 tools + knowledge base setup
│   ├── parsers.py         # SalesConvoOutputParser (ReAct output parsing)
│   ├── models.py          # BedrockCustomModel (AWS Bedrock support)
│   ├── salesgptapi.py     # SalesGPTAPI wrapper for FastAPI
│   ├── custom_invoke.py   # CustomAgentExecutor (captures intermediate steps)
│   └── logger.py          # time_logger decorator
├── examples/
│   ├── example_agent_setup.json           # Sleep Haven config
│   ├── example_cn_agent_setup.json        # Chinese version
│   ├── example_es_agent_setup.json        # Spanish version
│   ├── mcdonalds_worker.json              # McDonald's order hotline config
│   ├── sample_product_catalog.txt         # Plain text product catalog
│   └── example_product_price_id_mapping.json  # Stripe price ID mapping
├── run.py                 # CLI entry point
├── run_api.py             # FastAPI server (port 8000)
├── docker-compose.yml     # Docker setup (backend + frontend)
└── pyproject.toml         # Dependencies (poetry)
```
