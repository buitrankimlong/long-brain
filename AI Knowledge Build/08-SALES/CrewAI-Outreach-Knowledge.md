---
tags: [knowledge, sales, crewai, outreach, campaign]
moc: "[[08 Ban Hang Tu Dong]]"
source_repo: Customer-Outreach-Campaign-crewAI
files_read: 2
---

# Customer Outreach Campaign (CrewAI) - Knowledge Extraction

## Overview & Architecture

This project demonstrates a 2-agent, 2-task CrewAI pipeline for B2B sales automation. The system:

1. **Profiles a lead company** by researching it using web search + local files
2. **Generates personalized outreach emails** targeting a specific decision-maker based on the profile

The workflow is strictly sequential: the lead profiling task must complete before the personalized outreach task begins. The output of Task 1 is implicitly consumed by Task 2 via the agent's context.

Design pattern: **Research-then-Compose** — one agent gathers intelligence, another agent uses that intelligence to craft communication.

Originally built as a Google Colab notebook (`customer_outreach.ipynb`). No separate Python package structure — everything is in one notebook.

---

## Tech Stack & Dependencies

```
crewai==0.28.8
crewai_tools==0.1.6
langchain_community==0.0.29
langchain_groq==0.0.1
textblob  (for sentiment analysis)
```

- **LLM**: Groq API with `gemma-7b-it` model (fast, free-tier friendly)
- **Web Search**: Serper API (`SerperDevTool`) — Google Search results via API
- **File Tools**: `DirectoryReadTool`, `FileReadTool` from crewai_tools
- **Custom Tool**: `SentimentAnalysisTool` built on `BaseTool`
- **Environment**: Google Colab (uses `google.colab.userdata` for secrets)

---

## CrewAI Agent Definitions (with code)

### Agent 1: Sales Representative

```python
sales_rep_agent = Agent(
    role="Sales Representative",
    goal="Identify high-value leads that match "
         "our ideal customer profile",
    backstory=(
        "As a part of the dynamic sales team at CrewAI, "
        "your mission is to scour "
        "the digital landscape for potential leads. "
        "Armed with cutting-edge tools "
        "and a strategic mindset, you analyze data, "
        "trends, and interactions to "
        "unearth opportunities that others might overlook. "
        "Your work is crucial in paving the way "
        "for meaningful engagements and driving the company's growth."
    ),
    allow_delegation=False,
    verbose=True,
    llm=llm
)
```

**Purpose**: Research agent. Gathers information about a lead company.
**Key setting**: `allow_delegation=False` — does not hand off to other agents.

---

### Agent 2: Lead Sales Representative

```python
lead_sales_rep_agent = Agent(
    role="Lead Sales Representative",
    goal="Nurture leads with personalized, compelling communications",
    backstory=(
        "Within the vibrant ecosystem of CrewAI's sales department, "
        "you stand out as the bridge between potential clients "
        "and the solutions they need."
        "By creating engaging, personalized messages, "
        "you not only inform leads about our offerings "
        "but also make them feel seen and heard."
        "Your role is pivotal in converting interest "
        "into action, guiding leads through the journey "
        "from curiosity to commitment."
    ),
    allow_delegation=False,
    verbose=True,
    llm=llm
)
```

**Purpose**: Copywriting agent. Takes the research profile and writes personalized emails.
**Key setting**: `allow_delegation=False`.

---

## Task Definitions (with code)

### Task 1: Lead Profiling Task

```python
lead_profiling_task = Task(
    description=(
        "Conduct an in-depth analysis of {lead_name}, "
        "a company in the {industry} sector "
        "that recently showed interest in our solutions. "
        "Utilize all available data sources "
        "to compile a detailed profile, "
        "focusing on key decision-makers, recent business "
        "developments, and potential needs "
        "that align with our offerings. "
        "This task is crucial for tailoring "
        "our engagement strategy effectively.\n"
        "Don't make assumptions and "
        "only use information you absolutely sure about."
    ),
    expected_output=(
        "A comprehensive report on {lead_name}, "
        "including company background, "
        "key personnel, recent milestones, and identified needs. "
        "Highlight potential areas where "
        "our solutions can provide value, "
        "and suggest personalized engagement strategies."
    ),
    tools=[directory_read_tool, file_read_tool, search_tool],
    agent=sales_rep_agent,
)
```

**Tools used**: `DirectoryReadTool`, `FileReadTool`, `SerperDevTool`
**Template variables**: `{lead_name}`, `{industry}`
**Anti-hallucination guard**: "Don't make assumptions and only use information you absolutely sure about."

---

### Task 2: Personalized Outreach Task

```python
personalized_outreach_task = Task(
    description=(
        "Using the insights gathered from "
        "the lead profiling report on {lead_name}, "
        "craft a personalized outreach campaign "
        "aimed at {key_decision_maker}, "
        "the {position} of {lead_name}. "
        "The campaign should address their recent {milestone} "
        "and how our solutions can support their goals. "
        "Your communication must resonate "
        "with {lead_name}'s company culture and values, "
        "demonstrating a deep understanding of "
        "their business and needs.\n"
        "Don't make assumptions and only "
        "use information you absolutely sure about."
    ),
    expected_output=(
        "A series of personalized email drafts "
        "tailored to {lead_name}, "
        "specifically targeting {key_decision_maker}."
        "Each draft should include "
        "a compelling narrative that connects our solutions "
        "with their recent achievements and future goals. "
        "Ensure the tone is engaging, professional, "
        "and aligned with {lead_name}'s corporate identity."
    ),
    tools=[sentiment_analysis_tool, search_tool],
    agent=lead_sales_rep_agent,
)
```

**Tools used**: `SentimentAnalysisTool` (custom), `SerperDevTool`
**Template variables**: `{lead_name}`, `{key_decision_maker}`, `{position}`, `{milestone}`
**Output**: Multiple email drafts (a series), not just one email.

---

## Crew Composition & Flow

```python
crew = Crew(
    agents=[sales_rep_agent, lead_sales_rep_agent],
    tasks=[lead_profiling_task, personalized_outreach_task],
    verbose=2,
    memory=True
)
```

- **Process**: Sequential (default in crewai 0.28.8) — tasks run in order
- **Memory**: `memory=True` — agents retain context across tasks (short-term memory)
- **Verbose**: Level 2 — full agent reasoning output printed

### Kickoff with inputs:

```python
inputs = {
    "lead_name": "DeepLearningAI",
    "industry": "Online Learning Platform",
    "key_decision_maker": "Andrew Ng",
    "position": "CEO",
    "milestone": "product launch"
}

result = crew.kickoff(inputs=inputs)
```

**Flow diagram**:
```
inputs dict
    |
    v
[sales_rep_agent]
    - reads ./instructions/ directory
    - reads specific files
    - searches web via Serper
    - outputs: lead profile report
    |
    v
[lead_sales_rep_agent]
    - receives lead profile from Task 1 context
    - searches web for additional context
    - checks sentiment of draft emails
    - outputs: series of personalized email drafts
    |
    v
result (Markdown string)
```

---

## Prompt Templates (copy actual prompts)

### Lead Profiling Task Description:
```
Conduct an in-depth analysis of {lead_name}, a company in the {industry} sector
that recently showed interest in our solutions. Utilize all available data sources
to compile a detailed profile, focusing on key decision-makers, recent business
developments, and potential needs that align with our offerings. This task is crucial
for tailoring our engagement strategy effectively.
Don't make assumptions and only use information you absolutely sure about.
```

### Lead Profiling Expected Output:
```
A comprehensive report on {lead_name}, including company background, key personnel,
recent milestones, and identified needs. Highlight potential areas where our solutions
can provide value, and suggest personalized engagement strategies.
```

### Personalized Outreach Task Description:
```
Using the insights gathered from the lead profiling report on {lead_name}, craft a
personalized outreach campaign aimed at {key_decision_maker}, the {position} of
{lead_name}. The campaign should address their recent {milestone} and how our solutions
can support their goals. Your communication must resonate with {lead_name}'s company
culture and values, demonstrating a deep understanding of their business and needs.
Don't make assumptions and only use information you absolutely sure about.
```

### Personalized Outreach Expected Output:
```
A series of personalized email drafts tailored to {lead_name}, specifically targeting
{key_decision_maker}. Each draft should include a compelling narrative that connects
our solutions with their recent achievements and future goals. Ensure the tone is
engaging, professional, and aligned with {lead_name}'s corporate identity.
```

### Agent Backstories (act as system prompts):

**Sales Rep backstory** — frames the agent as a hunter scanning the digital landscape:
```
As a part of the dynamic sales team at CrewAI, your mission is to scour the digital
landscape for potential leads. Armed with cutting-edge tools and a strategic mindset,
you analyze data, trends, and interactions to unearth opportunities that others might
overlook. Your work is crucial in paving the way for meaningful engagements and
driving the company's growth.
```

**Lead Sales Rep backstory** — frames the agent as a relationship builder:
```
Within the vibrant ecosystem of CrewAI's sales department, you stand out as the bridge
between potential clients and the solutions they need. By creating engaging, personalized
messages, you not only inform leads about our offerings but also make them feel seen and
heard. Your role is pivotal in converting interest into action, guiding leads through the
journey from curiosity to commitment.
```

---

## Configuration & Setup

### LLM Setup (Groq):
```python
from langchain_groq import ChatGroq

llm = ChatGroq(
    model="gemma-7b-it",
    groq_api_key=os.environ["GROQ_API_KEY"],
)
```

### Tools Setup:
```python
from crewai_tools import DirectoryReadTool, FileReadTool, SerperDevTool

directory_read_tool = DirectoryReadTool(directory='./instructions')
file_read_tool = FileReadTool()
search_tool = SerperDevTool()
```

Note: `DirectoryReadTool` is pointed at `./instructions` — this implies a local folder with company-specific instruction files or product documentation for the agents to read.

### Custom Tool (SentimentAnalysisTool):
```python
from crewai_tools import BaseTool
from textblob import TextBlob

class SentimentAnalysisTool(BaseTool):
    name: str = "Sentiment Analysis Tool"
    description: str = ("Analyzes the sentiment of text "
         "to ensure positive and engaging communication.")

    def _run(self, text: str) -> str:
        blob = TextBlob(text)
        sentiment_polarity = blob.sentiment.polarity

        if sentiment_polarity > 0:
            return "positive"
        elif sentiment_polarity < 0:
            return "negative"
        else:
            return "neutral"
```

Pattern for custom tools: subclass `BaseTool`, define `name`, `description`, and `_run(self, text: str) -> str`.

### Environment Variables Required:
- `GROQ_API_KEY` — for Groq LLM inference
- `SERPER_API_KEY` — for SerperDev web search

### Output Display:
```python
from IPython.display import Markdown
Markdown(result)
```

---

## What We Can Reuse

### 1. The 2-Agent Research-then-Compose Pattern
Extremely reusable for any sales/marketing automation:
- Agent 1: Researcher (uses web search + file tools)
- Agent 2: Writer/Composer (uses researcher output + sentiment check)

Apply to: cold email campaigns, LinkedIn outreach, proposal generation, RFP responses.

### 2. Template Variables Pattern
The `{variable}` syntax in task descriptions enables one crew to handle any lead:
- `{lead_name}`, `{industry}`, `{key_decision_maker}`, `{position}`, `{milestone}`
- Pass different `inputs` dict at `kickoff()` time to run for multiple leads

Batch mode: loop over a list of leads and call `crew.kickoff(inputs=lead)` for each.

### 3. SentimentAnalysisTool Pattern
Quality gate for generated content. Can be extended with:
- Real NLP models (HuggingFace transformers)
- Tone checking (formal/casual/aggressive)
- Brand voice alignment scoring
- Readability scoring (Flesch-Kincaid)

### 4. DirectoryReadTool for Product Knowledge
Point `DirectoryReadTool` at a folder of:
- Product sheets
- Case studies
- Pricing docs
- FAQ documents

Agents will automatically reference relevant files when crafting outreach.

### 5. Anti-Hallucination Guard Phrase
This prompt instruction is worth copying into all research tasks:
```
Don't make assumptions and only use information you absolutely sure about.
```

### 6. Memory=True for Context Passing
Enables Task 2 to access Task 1's output without explicit context wiring. Useful when tasks are tightly coupled and the second task needs everything from the first.

### 7. Groq as Free/Fast LLM Backend
Using Groq with `gemma-7b-it` instead of OpenAI:
- Much faster inference
- Free tier available
- Drop-in replacement via `langchain_groq`
- Can swap to `llama3-8b-8192` or `mixtral-8x7b-32768` for better quality

---

## Lessons & Best Practices

### Architecture Lessons

1. **Sequential is often enough**: For outreach campaigns, sequential task flow (research -> write) is simpler and more reliable than hierarchical or parallel flows. Only add complexity when justified.

2. **Separate research from writing**: Never have one agent do both. Research agents should be tool-heavy. Writing agents should be prompt-heavy. Mixing roles degrades both.

3. **Task description = prompt engineering**: The `description` field IS the task prompt. Invest heavily in it. Use specific output format requirements in `expected_output`.

4. **expected_output acts as a contract**: Be explicit about what format you want (e.g., "a series of email drafts" not just "an email"). The LLM uses this to know when it's done.

5. **`allow_delegation=False` for focused agents**: Prevents agents from creating sub-tasks or handing off work unexpectedly. Use `True` only in orchestrator/manager agents.

### Tool Design Lessons

6. **Custom tools are simple to build**: Just subclass `BaseTool`, add `name`, `description`, and `_run()`. The description is what the LLM reads to decide when to use the tool.

7. **Tool descriptions matter**: The agent decides which tool to use based on the tool's `description`. Write it clearly and specifically.

8. **Sentiment tool as a quality gate**: Running sentiment analysis on generated emails before sending is a useful pattern. In production, extend with actual NLP rather than TextBlob's basic polarity.

### Operational Lessons

9. **Groq is production-viable for this use case**: Speed matters in sales automation. Groq's inference is 10-20x faster than standard APIs — important when running 50+ leads.

10. **`./instructions` directory**: The repo implies a local `instructions/` folder for company-specific context. This is a good pattern — externalizing product knowledge from prompts into readable files.

11. **One notebook = good for prototyping**: The entire pipeline fits in one Jupyter notebook. For production, decompose into:
    - `agents.py`
    - `tasks.py`
    - `tools.py`
    - `crew.py`
    - `main.py` (with batch loop)

12. **`verbose=2` for debugging**: Set verbose to 2 during development to see full agent reasoning chains. Set to 0 or False in production to reduce noise.

13. **`memory=True` has storage implications**: In crewai 0.28.8, memory uses in-memory storage by default. For production with many leads, consider persistent memory backends.

### Prompt Engineering Lessons

14. **Backstory shapes behavior**: The backstory is like a system prompt for each agent. A well-crafted backstory ("bridge between potential clients and the solutions they need") nudges the agent toward relationship-focused, empathetic writing.

15. **Milestone as a personalization anchor**: Using `{milestone}` (e.g., "product launch") as a template variable ensures every email has a timely, relevant hook. This is the key to making outreach feel non-generic.

16. **"Don't make assumptions" constraint**: Explicitly telling agents to only use verified information reduces hallucinated company facts — critical for B2B outreach where wrong facts destroy credibility.

---

## Upgrade Path (Production Notes)

To scale this for a real agency:

| Current | Production Upgrade |
|---|---|
| Google Colab notebook | Python package with CLI |
| Single lead at a time | Batch processing with lead list CSV |
| Groq gemma-7b-it | Route: Sonnet for profiling, Haiku for drafts |
| TextBlob sentiment | Fine-tuned tone classifier |
| `./instructions` folder | Vector DB with product knowledge (pgvector) |
| In-memory CrewAI memory | Persistent memory (Redis or PostgreSQL) |
| Manual kickoff | Scheduled via cron or n8n workflow |
| Markdown output | CRM integration (HubSpot, Pipedrive) via API |

For Vietnam market: add Zalo message template generation as a third task, targeting Zalo OA outreach alongside email.
