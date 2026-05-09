---
tags: [knowledge, genai, course, microsoft, advanced]
source_repo: generative-ai-for-beginners
lessons: 11-21
---

# GenAI for Beginners - Course Knowledge Part 2 (Lessons 11-21)

Source: `C:\AI Build Learning\generative-ai-for-beginners\`
Microsoft's "Generative AI for Beginners" course - advanced half.

---

## LESSON 11: Integrating with Function Calling

**Folder:** `11-integrating-with-function-calling/`
**Video:** https://youtu.be/DgUdCLX8qYQ

### The Problem Function Calling Solves

Before function calling, LLM responses were unstructured and inconsistent. Two identical prompts asking for JSON could return `3.7` vs `3.7 GPA` - no guaranteed schema. Also, models were frozen at training time, so they couldn't answer "What is the current weather in Stockholm?"

Function Calling in Azure OpenAI solves:
1. **Consistent response format** - LLM is forced to follow a schema you define
2. **External data access** - LLM can trigger real API calls to get live data

Key insight: **The LLM does NOT actually execute functions.** It only decides which function to call and with what arguments. Your code then executes the actual function and passes results back to the LLM for natural language synthesis.

### The 3-Step Function Calling Flow

```
Step 1: User message + function definitions -> LLM
Step 2: LLM returns structured JSON with function name + args (NOT a text answer)
Step 3: Your code executes the function, passes result back to LLM -> LLM returns natural language answer
```

### Code: Setting Up Azure OpenAI Client

```python
import os
import json
from openai import AzureOpenAI
from dotenv import load_dotenv
load_dotenv()

client = AzureOpenAI(
    api_key=os.environ['AZURE_OPENAI_API_KEY'],
    api_version="2023-07-01-preview"
)
deployment = os.environ['AZURE_OPENAI_DEPLOYMENT']
```

### Code: Defining Functions for the LLM

Functions are defined as a list of dicts with `name`, `description`, and `parameters` (JSON Schema format):

```python
functions = [
   {
      "name": "search_courses",
      "description": "Retrieves courses from the search index based on the parameters provided",
      "parameters": {
         "type": "object",
         "properties": {
            "role": {
               "type": "string",
               "description": "The role of the learner (i.e. developer, data scientist, student, etc.)"
            },
            "product": {
               "type": "string",
               "description": "The product that the lesson is covering (i.e. Azure, Power BI, etc.)"
            },
            "level": {
               "type": "string",
               "description": "The level of experience the learner has prior to taking the course (i.e. beginner, intermediate, advanced)"
            }
         },
         "required": ["role"]
      }
   }
]
```

### Code: Making the Function Call

```python
messages = [{"role": "user", "content": "Find me a good course for a beginner student to learn Azure."}]

response = client.chat.completions.create(
    model=deployment,
    messages=messages,
    functions=functions,
    function_call="auto"   # LLM decides which function to call
)

print(response.choices[0].message)
```

LLM response (NOT a text answer - it's a structured call):
```json
{
  "role": "assistant",
  "function_call": {
    "name": "search_courses",
    "arguments": "{\n  \"role\": \"student\",\n  \"product\": \"Azure\",\n  \"level\": \"beginner\"\n}"
  }
}
```

### Code: Full Integration - Executing the Function and Getting Final Answer

```python
import requests

def search_courses(role, product, level):
    url = "https://learn.microsoft.com/api/catalog/"
    params = {"role": role, "product": product, "level": level}
    response = requests.get(url, params=params)
    modules = response.json()["modules"]
    results = []
    for module in modules[:5]:
        title = module["title"]
        url = module["url"]
        results.append({"title": title, "url": url})
    return str(results)

# Check if LLM wants to call a function
response_message = response.choices[0].message
if response_message.function_call.name:
    function_name = response_message.function_call.name
    available_functions = {"search_courses": search_courses}
    function_to_call = available_functions[function_name]
    function_args = json.loads(response_message.function_call.arguments)
    function_response = function_to_call(**function_args)

    # Add both LLM response and function result to message history
    messages.append({
        "role": response_message.role,
        "function_call": {
            "name": function_name,
            "arguments": response_message.function_call.arguments,
        },
        "content": None
    })
    messages.append({
        "role": "function",
        "name": function_name,
        "content": function_response,
    })

    # Second LLM call: synthesize natural language answer from function results
    second_response = client.chat.completions.create(
        messages=messages,
        model=deployment,
        function_call="auto",
        functions=functions,
        temperature=0
    )
    print(second_response.choices[0].message)
```

### Use Cases for Function Calling

| Use Case | Example Function Signature |
|---|---|
| Calling external tools | `send_email(to: string, body: string)` |
| API/DB queries | `get_completed(student_name: string, assignment: int, current_status: string)` |
| Structured data extraction | `get_important_facts(agreement_name: string, date_signed: string, parties_involved: list)` |

### Important Notes
- Functions are included in the system message and consume tokens
- `function_call="auto"` lets LLM choose which function to call
- `function_call="none"` disables function calling
- Always add function result to messages array with `"role": "function"` before the second LLM call

### Assignment
- Add more parameters to find courses (e.g., native language)
- Create error handling when function call returns no results
- Reference: [Learn API Catalog docs](https://learn.microsoft.com/training/support/catalog-api-developer-reference)

---

## LESSON 12: Designing UX for AI Applications

**Folder:** `12-designing-ux-for-ai-applications/`
**Video:** https://youtu.be/VKbCejSICA8

### The Four Pillars of Good AI UX

An AI application must be:

1. **Useful** - functionality matches its intended purpose (e.g., accurately grades papers, generates relevant flashcards)
2. **Reliable** - performs consistently; handles errors gracefully without blaming the user
3. **Accessible** - usable by everyone including people with disabilities; follow accessibility guidelines
4. **Pleasant** - enjoyable to use; users return and business revenue increases

### Designing for Trust and Transparency

Trust failures come in two forms:
- **Mistrust**: user rejects app because they don't trust AI output
- **Overtrust**: user trusts AI too much (e.g., teacher doesn't verify AI-graded papers)

**Explainability** strategies:
- Add details that explain how AI arrived at output
- Make it explicit that output is AI-generated, not human. Instead of "Start chatting with your tutor" say "Use AI tutor that adapts to your needs"
- Simplify explanations - teachers and students are not AI experts
- Persona-based responses: a "student" persona should not get direct answers, but guidance to solve problems

**Control** strategies:
- Allow users to modify prompts to get different results
- Let users modify/regenerate output after it is produced
- Provide opt-in/opt-out for data the AI uses
- Create intentional friction between prompts and results so users don't forget they're talking to AI

### Designing for Collaboration and Feedback

- Build feedback loops into the UI (e.g., thumbs up/down on responses)
- Clearly communicate capabilities AND limitations upfront
- Handle out-of-scope requests gracefully: "Sorry, our product has been trained with data in the following subjects... I cannot respond to the question you asked."
- Design for errors - AI will make mistakes; make error messages simple and explainable

### Assignment Checklist
- Pleasant: add explanations, encourage exploration, word error messages well
- Usability: navigable by both mouse and keyboard
- Trust: add human-in-the-loop to verify AI output
- Control: implement opt-in/opt-out for data collection

**Prerequisite reading:** https://learn.microsoft.com/training/modules/ux-design

---

## LESSON 13: Securing AI Applications

**Folder:** `13-securing-ai-applications/`
**Video:** https://youtu.be/m0vXwsx5DNg

### Why AI Security Is Different

ML models cannot distinguish between malicious input and legitimate anomalous data. Training data often comes from uncurated public datasets open to third-party contributions. Attackers can contribute malicious data without needing to "hack" anything - they just contribute. Over time, low-confidence malicious data becomes high-confidence trusted data if the data structure remains valid.

### The Primary Threat: Data Poisoning

Data poisoning = intentionally changing training data to make a model make mistakes.

Four types:

| Attack Type | Description | Example |
|---|---|---|
| **Label Flipping** | Flipping labels on a subset of training data | Spam filter mislabels legitimate email as spam |
| **Feature Poisoning** | Subtly modifying features to introduce bias | Adding irrelevant keywords to manipulate recommendation systems |
| **Data Injection** | Injecting malicious data into training set | Fake user reviews to skew sentiment analysis |
| **Backdoor Attacks** | Hidden pattern that triggers malicious behavior | Face recognition misidentifies a specific person when backdoor image is shown |

### OWASP Top 10 for LLMs

Key vulnerabilities from https://llmtop10.com:

- **Prompt Injection** - crafted inputs cause LLM to behave outside intended behavior
- **Supply Chain Vulnerabilities** - compromised Python packages, external datasets
- **Overreliance** - users taking hallucinated LLM output at face value with real-world negative consequences

### MITRE ATLAS Framework

MITRE created [ATLAS (Adversarial Threat Landscape for AI Systems)](https://atlas.mitre.org) - a knowledgebase of adversarial tactics/techniques for AI systems. It is modeled after MITRE ATT&CK and complements it with AI-specific TTPs.

### Security Testing Methods

| Method | Purpose |
|---|---|
| **Data sanitization** | Remove/anonymize sensitive info from training data; prevents data leakage |
| **Adversarial testing** | Generate adversarial examples to test model robustness |
| **Model verification** | Verify model parameters/architecture to detect model stealing |
| **Output validation** | Validate quality/reliability of LLM output for consistency and accuracy |

### AI Red Teaming (Microsoft's Approach)

AI red teaming goes beyond traditional security testing:
1. **Expansive scope** - covers both security vulnerabilities AND responsible AI (bias, harmful content)
2. **Malicious AND benign failures** - tests not just attackers but also regular users encountering harmful content
3. **Continuous** - AI apps evolve constantly; red teaming must be ongoing

OpenAI safety evaluation examples:
- **Persuasion**: MakeMeSay (trick AI into saying secret word), MakeMePay (convince AI to donate money), Ballot Proposal (influence AI political views)
- **Steganography**: Hidden messages, text compression for secret messaging, Schelling Point coordination without direct communication

### Data Protection Best Practices
- Only share data that is necessary and relevant with LLMs
- Anonymize or encrypt data before sharing
- Always verify accuracy of LLM-generated output
- Report suspicious/abnormal LLM behaviors
- Use cloud services with data protection features
- Implement data governance and ethics frameworks

### Key Resources
- [MITRE ATLAS](https://atlas.mitre.org)
- [OWASP LLM Top 10](https://llmtop10.com)
- [Must Learn AI Security (free ebook)](https://github.com/rod-trent/OpenAISecurity/tree/main/Must_Learn/Book_Version)
- [Planning red teaming for LLMs](https://learn.microsoft.com/azure/ai-services/openai/concepts/red-teaming)
- [Microsoft AI Red Team blog post](https://www.microsoft.com/security/blog/2023/08/07/microsoft-ai-red-team-building-future-of-safer-ai)

---

## LESSON 14: The Generative AI Application Lifecycle (LLMOps)

**Folder:** `14-the-generative-ai-application-lifecycle/`
**Video:** https://youtu.be/ewtQY_RJrzs

### MLOps vs LLMOps: The Paradigm Shift

| Aspect | MLOps (Classic ML) | LLMOps (GenAI) |
|---|---|---|
| Focus | Data Scientists | App Developers |
| Key method | Training custom models | Using Models-as-a-Service + integrations |
| Key metrics | Accuracy, Precision, Recall | Quality, Harm, Honesty, Cost, Latency |

LLMOps metrics explained:
- **Quality**: Is the response good, relevant, coherent?
- **Harm**: Does it violate Responsible AI principles?
- **Honesty**: Is the response grounded (does it make sense, is it factually correct)?
- **Cost**: Solution budget - token costs
- **Latency**: Average time for token response

### The LLM Lifecycle: 3 Major Phases

**Phase 1: Ideating/Exploring**
- Explore based on business needs
- Prototype using PromptFlow
- Test whether hypothesis could work

**Phase 2: Building/Augmenting**
- Evaluate on larger datasets
- Implement Fine-Tuning and/or RAG
- Test robustness; if it fails, restructure data or add flow steps
- Verify metrics

**Phase 3: Operationalizing**
- Add monitoring and alerts
- Deploy to production
- Integrate into application

Overarching cycle: **Management** - security, compliance, governance

The lifecycle is NOT linear - it has integrated feedback loops and is iterative.

### Tooling

**Azure AI Platform** - https://azure.microsoft.com/solutions/ai
- AI Studio (web portal): explore models, samples, tools
- Manage resources, UI development flows, SDK/CLI for code-first development

**PromptFlow** - https://microsoft.github.io/promptflow/index.html
- Design and build apps from VS Code with visual + functional tools
- Test and fine-tune for quality
- Push and deploy via Azure AI Studio

### Hands-On Demo
- [Contoso Chat Demo](https://nitya.github.io/contoso-chat) - full LLMOps lifecycle in action
- [Ignite breakout session video](https://www.youtube.com/watch?v=DdOylyrTOWg)

---

## LESSON 15: RAG and Vector Databases

**Folder:** `15-rag-and-vector-databases/`
**Video:** https://youtu.be/4l8zhHUBeyI

### Why RAG?

LLMs have two major limitations:
1. Knowledge cutoff (e.g., GPT-4 cutoff = September 2021)
2. No access to private/confidential data (company manuals, personal notes)

RAG (Retrieval Augmented Generation) solves this by connecting the LLM to an external knowledge base at query time.

### How RAG Works

```
1. Ingest: Load documents -> chunk -> embed -> store in vector DB
2. Query: User asks question -> embed question -> search vector DB for similar chunks
3. Augment: Retrieved chunks added to LLM prompt as context
4. Generate: LLM answers using both pre-trained knowledge + retrieved context
```

Architecture uses transformer encoder-decoder:
- **Encoder**: input text -> vectors (captures meaning)
- **Decoder**: vectors -> document index -> generates new text based on query

Two RAG approaches from the original paper ([arxiv.org/pdf/2005.11401.pdf](https://arxiv.org/pdf/2005.11401.pdf)):
- **RAG-Sequence**: Use retrieved documents to predict best complete answer
- **RAG-Token**: Use documents to generate next token, retrieve more, answer query

### Why RAG vs Fine-Tuning?

| Aspect | RAG | Fine-Tuning |
|---|---|---|
| Data freshness | Always current (retrieval is live) | Frozen at training time |
| Cost | More economical | Expensive - requires retraining |
| Fabrication | Reduced - uses verifiable data | Still possible |
| Best for | Domain-specific Q&A, up-to-date info | Style/format adaptation |

### Vector Databases

Vector DBs store numerical representations (embeddings) of documents. Why needed:
- LLMs have token limits - can't pass entire knowledge base
- Chunking reduces cost (fewer tokens per query)
- Enables semantic similarity search

Popular vector DBs: Azure Cosmos DB, Pinecone, Chromadb, Qdrant, DeepLake, Clarifyai, ScaNN

Create Azure Cosmos DB:
```bash
az login
az group create -n <resource-group-name> -l <location>
az cosmosdb create -n <cosmos-db-name> -r <resource-group-name>
az cosmosdb list-keys -n <cosmos-db-name> -g <resource-group-name>
```

### Code: Text Chunking

```python
def split_text(text, max_length, min_length):
    words = text.split()
    chunks = []
    current_chunk = []

    for word in words:
        current_chunk.append(word)
        if len(' '.join(current_chunk)) < max_length and len(' '.join(current_chunk)) > min_length:
            chunks.append(' '.join(current_chunk))
            current_chunk = []

    # If the last chunk didn't reach the minimum length, add it anyway
    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks
```

Embedding models to choose from: word2vec, text-embedding-ada-002 (OpenAI), Azure Computer Vision. Selection depends on: languages, content type, input size, output length.

### Code: Building a Local Search Index

```python
from sklearn.neighbors import NearestNeighbors

embeddings = flattened_df['embeddings'].to_list()

# Create the search index
nbrs = NearestNeighbors(n_neighbors=5, algorithm='ball_tree').fit(embeddings)

# Query the index
distances, indices = nbrs.kneighbors(embeddings)
```

### Search Types

| Type | How | When to use |
|---|---|---|
| **Keyword search** | Text matching | Exact terms |
| **Vector/Semantic search** | Embedding similarity (cosine distance) | Meaning/intent matching |
| **Hybrid** | Combination of keyword + vector | Best general purpose |

Similarity measurements:
- **Cosine similarity** - angle between two vectors (most common)
- **Euclidean distance** - straight line between vector endpoints
- **Dot product** - sum of products of corresponding elements

### Code: Full RAG Chatbot Implementation

```python
user_input = "what is a perceptron?"

def chatbot(user_input):
    # Embed the question
    query_vector = create_embeddings(user_input)

    # Find most similar chunks
    distances, indices = nbrs.kneighbors([query_vector])

    # Build context from retrieved chunks
    history = []
    for index in indices[0]:
        history.append(flattened_df['chunks'].iloc[index])

    history.append(user_input)

    messages = [
        {"role": "system", "content": "You are an AI assistant that helps with AI questions."},
        {"role": "user", "content": "\n\n".join(history)}
    ]

    response = openai.chat.completions.create(
        model="gpt-4",
        temperature=0.7,
        max_tokens=800,
        messages=messages
    )

    return response.choices[0].message

chatbot(user_input)
```

### RAG Evaluation Metrics

- **Quality**: Does response sound natural, fluent, and human-like?
- **Groundedness**: Did the response come from the supplied documents?
- **Relevance**: Does the response match the question asked?
- **Fluency**: Is the response grammatically correct?

### RAG Use Cases

- **Enterprise Q&A**: Ground company data for employee chatbots
- **Recommendation systems**: Match similar values (movies, restaurants)
- **Personalized chatbots**: Store chat history, personalize based on user data
- **Image search**: Vector embeddings for image recognition and anomaly detection

### Frameworks to Simplify RAG

Semantic Kernel, LangChain, AutoGen

---

## LESSON 16: Open Source Models

**Folder:** `16-open-source-models/`
**Video:** https://youtu.be/CuICgfuHFSg

### True Open Source vs "Open Models"

For a model to be truly open source (per OSI definition), it needs:
- Datasets used to train the model (publicly available)
- Full model weights from training
- Evaluation code
- Fine-tuning code
- Full model weights and training metrics

Very few models meet all criteria. [OLMo by Allen Institute (AllenAI)](https://huggingface.co/allenai/OLMo-7B) is one example. Most "open source" LLMs (Llama, Mistral, Falcon) are more accurately called **"open models"**.

### Benefits of Open Models

| Benefit | Detail |
|---|---|
| **Highly customizable** | Access to training info enables creating specialized domain models (code, math, biology) |
| **Cost** | Lower cost-per-token vs proprietary models |
| **Flexibility** | Mix and match models; HuggingChat lets users select model at runtime |

### Key Open Models

**Llama 2 (Meta)**
- Optimized for chat applications via RLHF (lots of dialogue + human feedback)
- Fine-tuned versions: [Japanese Llama](https://huggingface.co/elyza/ELYZA-japanese-Llama-2-7b), [Llama Pro](https://huggingface.co/TencentARC/LLaMA-Pro-8B)

**Mistral**
- High performance + efficiency using Mixture-of-Experts (MoE) approach
- MoE = group of specialized expert models; only relevant experts activated per input
- Fine-tuned versions: [BioMistral](https://huggingface.co/BioMistral/BioMistral-7B) (medical), [OpenMath Mistral](https://huggingface.co/nvidia/OpenMath-Mistral-7B-v0.1-hf) (math)

**Falcon (TII)**
- Falcon-40B: 40B params, outperforms GPT-3 with less compute
- Uses FlashAttention + multiquery attention to reduce memory at inference
- Fine-tuned versions: [OpenAssistant falcon-40b](https://huggingface.co/OpenAssistant/falcon-40b-sft-top1-560), [GPT4ALL](https://huggingface.co/nomic-ai/gpt4all-falcon)

### How to Choose an Open Model

1. Azure AI Studio filter by task - see what tasks the model is trained for
2. [Hugging Face LLM Leaderboard](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard) - best performing models by metrics
3. [Artificial Analysis](https://artificialanalysis.ai) - compare LLMs across types (quality vs price vs speed)
4. Search for fine-tuned versions in your specific domain
5. Experiment with multiple models against your use case

**Get started:** [Azure AI Foundry Model Catalog](https://ai.azure.com) has a Hugging Face collection with all discussed models.

---

## LESSON 17: AI Agents

**Folder:** `17-ai-agents/`
**Video:** https://youtu.be/yAXVW-lUINc

### What Are AI Agents?

> AI Agents allow Large Language Models (LLMs) to perform tasks by giving them access to a **state** and **tools**.

Key components:
- **LLMs**: GPT-3.5, GPT-4, Llama-2, etc. - the reasoning core
- **State**: Context the LLM works in - past actions + current context. Frameworks maintain this easier.
- **Tools**: Database, API, external application, or even another LLM

### Framework 1: LangChain Agents

- Uses `AgentExecutor` to manage state (built-in function)
- `AgentExecutor` accepts the `agent` + available `tools`, and stores chat history
- [LangChain tool catalog](https://integrations.langchain.com/tools) - community-built tools ready to import
- **LangSmith** - visibility tool to understand which tool LLM used and why

### Framework 2: AutoGen (Microsoft)

Focus: conversations between agents. Two key properties:

**Conversable**: LLMs can converse with each other to complete tasks via `AssistantAgent`:
```python
autogen.AssistantAgent(name="Coder", llm_config=llm_config)
pm = autogen.AssistantAgent(
    name="Product_manager",
    system_message="Creative in software product ideas.",
    llm_config=llm_config,
)
```

**Customizable**: Agents can be LLMs, users, or tools. `UserProxyAgent` handles human interaction:
```python
user_proxy = UserProxyAgent(name="user_proxy")
```

State management: assistant agent generates Python code to complete tasks.
System message example:
```python
system_message="For weather related tasks, only use the functions you have been provided with. Reply TERMINATE when the task is done."
```

Start conversation:
```python
user_proxy.initiate_chat(chatbot, message="I am planning a trip to NYC next week, can you help me pick out what to wear?")
```

The agent will suggest tool calls:
```
chatbot (to user_proxy):
***** Suggested tool Call: get_weather *****
Arguments: {"location":"New York City, NY","time_period":"7","temperature_unit":"Celsius"}
```

[AutoGen code samples](https://microsoft.github.io/autogen/docs/Examples/)

### Framework 3: TaskWeaver (Microsoft)

"Code-first" agent - works with Python DataFrames, not just strings. Best for data analysis and generation tasks (graphs, charts, random numbers).

State management via `Planner` LLM that maps user requests to tasks. Tools are `Plugins` (Python classes or code interpreter) stored as embeddings for semantic search.

Plugin example for anomaly detection:
```python
class AnomalyDetectionPlugin(Plugin):
    def __call__(self, df: pd.DataFrame, time_col_name: str, value_col_name: str):
```

Code is verified before executing. `experience` feature stores conversation context to YAML file for long-term memory - model improves over time.

### Framework 4: JARVIS (Microsoft)

Unique approach: the LLM manages state AND the tools are **other specialized AI models**.

Flow:
1. General-purpose LLM receives user request
2. LLM identifies specific task + required data
3. LLM formats request for specialized model (as JSON):
   ```python
   [{"task": "object-detection", "id": 0, "dep": [-1], "args": {"image": "e1.jpg"}}]
   ```
4. Specialized model (object detection, transcription, image captioning, etc.) returns prediction
5. LLM interprets results and generates final natural language response
6. If multiple models required, LLM orchestrates them and combines results

[JARVIS GitHub](https://github.com/microsoft/JARVIS)

### Choosing a Framework

| Framework | Best For |
|---|---|
| LangChain | Rich tool ecosystem, existing LangChain integrations |
| AutoGen | Multi-agent conversation workflows, human-in-the-loop |
| TaskWeaver | Data analysis, Python DataFrames, code-heavy tasks |
| JARVIS | Orchestrating multiple specialized AI models |

### Assignment
Build with AutoGen:
- Simulate business meeting with different departments of a startup
- Create system messages for each department persona
- Enable user to pitch a product idea
- Each department LLM generates follow-up questions

---

## LESSON 18: Fine-Tuning LLMs

**Folder:** `18-fine-tuning/`
**Video:** https://youtu.be/6UAwhL9Q-TQ

### What Is Fine-Tuning?

Fine-tuning = take a pre-trained LLM and retrain it with additional data for a specific task or domain, creating a **custom model**.

Compared to other techniques:
- **Prompt Engineering**: modifies the prompt input; does NOT change the model
- **RAG**: augments prompts with retrieved context; does NOT change the model
- **Fine-Tuning**: CHANGES the model itself by retraining on new data

Fine-tuning this course focuses on is **supervised fine-tuning**: adding new labeled data not in original training set (different from unsupervised fine-tuning that uses original data with different hyperparameters).

Side benefit: fine-tuned models need fewer few-shot examples in prompts, reducing token usage and cost.

### When Should You Fine-Tune?

Fine-tuning is an **advanced technique** - if done incorrectly it can degrade model performance. Ask these questions first:

1. **Use Case**: What specific aspect of the model do you want to improve?
2. **Alternatives**: Have you tried prompt engineering and RAG first? Establish a baseline.
3. **Costs**:
   - Tunability: is the model available for fine-tuning?
   - Effort: preparing training data, evaluating, refining
   - Compute: running fine-tuning jobs + deploying fine-tuned model
   - Data: do you have sufficient quality examples?
4. **Benefits**:
   - Quality: does fine-tuned model outperform the baseline?
   - Cost: does it reduce token usage by simplifying prompts?
   - Extensibility: can you repurpose the base model for new domains?

Decision video: [To fine-tune or not to fine-tune](https://www.youtube.com/watch?v=0Jo-z-MFxJs)

### What You Need to Fine-Tune

- A pre-trained model (that supports fine-tuning)
- A curated dataset of examples
- A training environment (compute)
- A hosting environment for the fine-tuned model

### Fine-Tuning Tutorials by Provider

| Provider | Tutorial | What You Learn |
|---|---|---|
| OpenAI | [How to fine-tune chat models](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_finetune_chat_models.ipynb) | Fine-tune `gpt-35-turbo` for "recipe assistant" |
| Azure OpenAI | [GPT 3.5 Turbo fine-tuning tutorial](https://learn.microsoft.com/azure/ai-services/openai/tutorials/fine-tune) | Fine-tune `gpt-35-turbo-0613` on Azure end-to-end |
| Hugging Face | [Fine-tuning LLMs with TRL](https://www.philschmid.de/fine-tune-llms-in-2024-with-trl) | Fine-tune open LLM (CodeLlama 7B) with transformers + TRL |
| HF AutoTrain | [AutoTrain Advanced](https://github.com/huggingface/autotrain-advanced/) | No-code fine-tuning via GUI, CLI, or YAML config |
| Unsloth | [Fine-tuning with Unsloth](https://github.com/unslothai/unsloth) | Open-source framework; ready-to-use notebooks; supports TTS, BERT, multimodal |

Additional resources in `18-fine-tuning/RESOURCES.md`

---

## LESSON 19: Small Language Models (SLMs) and Microsoft Phi-3/3.5

**Folder:** `19-slm/`

### What Are Small Language Models (SLMs)?

SLMs are scaled-down variants of LLMs that retain substantial functionality with significantly reduced computational footprint. Built by compressing or distilling LLMs.

SLMs can perform:
- Text generation
- Text completion
- Translation
- Summarization

With trade-offs in performance/depth vs larger models.

### LLM vs SLM Comparison

| Factor | LLM | SLM |
|---|---|---|
| **Parameters** | ~1.76T (GPT-4) | ~7B (Mistral 7B) |
| **Comprehension** | Broad, versatile, multi-domain | Deep but domain-specific |
| **Computing** | Requires large-scale GPU clusters | Trainable on local machines with moderate GPUs |
| **Bias** | More susceptible (trained on raw internet data) | Less susceptible (domain-specific training data) |
| **Inference speed** | Slow (needs parallel compute for acceptable speed) | Fast (efficient on local hardware) |
| **Architecture** | Self-attention encoder-decoder (GPT-4) | Sliding window attention decoder-only (Mistral 7B) |

### Microsoft Phi-3/3.5 Family

Microsoft's SLM family targeting text, vision, and agent (MoE) scenarios.

**Phi-3 / 3.5 Instruct (Text)**

| Model | Params | Key Feature |
|---|---|---|
| Phi-3-mini | 3.8B | Outperforms models 2x its size; available on Azure AI Studio, Hugging Face, Ollama |
| Phi-3-small | 7B | Beats GPT-3.5T on language, reasoning, coding, math |
| Phi-3-medium | 14B | Outperforms Gemini 1.0 Pro |
| Phi-3.5-mini | 3.8B | Upgrade of Phi-3-mini; 20+ languages; stronger long context support |

**Phi-3 / 3.5 Vision (Multimodal)**

| Model | Params | Key Feature |
|---|---|---|
| Phi-3-Vision | 4.2B | Outperforms Claude-3 Haiku and Gemini 1.0 Pro V on OCR, tables, diagrams |
| Phi-3.5-Vision | 4.2B | Multi-image support (videos); beats Claude-3.5 Sonnet and Gemini 1.5 Flash on OCR/tables |

**Phi-3.5-MoE (Mixture of Experts)**
- 16 x 3.8B expert modules
- Only 6.6B active parameters at inference
- Achieves quality comparable to much larger models
- Can be pretrained with far less compute vs dense models

### Deploying Phi-3/3.5: Four Approaches

**1. GitHub Models (Cloud - simplest)**
```python
# Use Azure AI Inference SDK or OpenAI SDK
# Access via https://models.inference.ai.azure.com with GITHUB_TOKEN
```

**2. Azure AI Studio (Cloud - for Vision/MoE)**
- [Phi-3 Cookbook Azure AI Studio Quickstart](https://github.com/microsoft/Phi-3CookBook/blob/main/md/02.QuickStart/AzureAIStudio_QuickStart.md)

**3. NVIDIA NIM (Cloud with NVIDIA optimization)**
```python
# NVIDIA NIM = NVIDIA Inference Microservices
# Deploy with single command; TensorRT + TensorRT-LLM under the hood
# Standard APIs; supports autoscaling on Kubernetes
```

**4. Ollama (Local - simplest local deployment)**
```bash
ollama run phi3.5
```

**5. Hugging Face Transformers (Local - GPU recommended)**
```python
# pip install transformers
# Requires GPU for Vision and MoE models
# See: 19-slm/python/phi35-instruct-demo.ipynb
# See: 19-slm/python/phi35-vision-demo.ipynb
# See: 19-slm/python/phi35_moe_demo.ipynb
```

**6. ONNX Runtime for GenAI (Cross-platform, edge-friendly)**

Install:
```python
pip install onnxruntime
pip install onnxruntime-genai
```

Basic usage:
```python
import onnxruntime_genai as og

model = og.Model('path_to_your_model.onnx')
tokenizer = og.Tokenizer(model)

input_text = "Hello, how are you?"
input_tokens = tokenizer.encode(input_text)
output_tokens = model.generate(input_tokens)
output_text = tokenizer.decode(output_tokens)
print(output_text)
```

Phi-3.5-Vision with ONNX (streaming):
```python
import onnxruntime_genai as og

model = og.Model('./Your Phi-3.5-vision-instruct ONNX Path')
processor = model.create_multimodal_processor()
tokenizer_stream = processor.create_stream()

prompt = "<|user|>\n<|image_1|>\nYour Prompt<|end|>\n<|assistant|>\n"
image = og.Images.open('./Your Image Path')
inputs = processor(prompt, images=image)

params = og.GeneratorParams(model)
params.set_inputs(inputs)
params.set_search_options(max_length=3072)

generator = og.Generator(model, params)
while not generator.is_done():
    generator.compute_logits()
    generator.generate_next_token()
    new_token = generator.get_next_tokens()[0]
    print(tokenizer_stream.decode(new_token), end='', flush=True)
```

**Other runtimes:** Apple MLX (Apple Metal/M-series), Qualcomm QNN (NPU), Intel OpenVINO (CPU/GPU)

Reference: [Phi-3 Cookbook](https://github.com/microsoft/phi-3cookbook)

---

## LESSON 20: Building with Mistral Models

**Folder:** `20-mistral/`

Three Mistral models covered, all available free on GitHub Model marketplace.

### Mistral Large 2 (2407) - Enterprise Flagship

Upgrades over original Mistral Large:
- Context window: 128k tokens (vs 32k)
- Math/coding accuracy: 76.9% (vs 60.4%)
- Multilingual: English, French, German, Spanish, Italian, Portuguese, Dutch, Russian, Chinese, Japanese, Korean, Arabic, Hindi

Best for:
- **RAG** - due to 128k context window
- **Function Calling** - native support; parallel and sequential calls
- **Code Generation** - excellent Python, Java, TypeScript, C++

### Code: RAG with Mistral Large 2 and FAISS

```python
pip install faiss-cpu
```

```python
import requests
import numpy as np
import faiss
import os
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from azure.ai.inference import EmbeddingsClient

endpoint = "https://models.inference.ai.azure.com"
model_name = "Mistral-large"
token = os.environ["GITHUB_TOKEN"]

client = ChatCompletionsClient(
    endpoint=endpoint,
    credential=AzureKeyCredential(token),
)

# Load text, chunk it
response = requests.get('https://raw.githubusercontent.com/run-llama/llama_index/main/docs/docs/examples/data/paul_graham/paul_graham_essay.txt')
text = response.text
chunk_size = 2048
chunks = [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]

# Embed chunks with Cohere multilingual model
embed_model_name = "cohere-embed-v3-multilingual"
embed_client = EmbeddingsClient(endpoint=endpoint, credential=AzureKeyCredential(token))
embed_response = embed_client.embed(input=chunks, model=embed_model_name)

text_embeddings = np.array([item.embedding for item in embed_response.data])

# Build FAISS index
d = text_embeddings.shape[1]
index = faiss.IndexFlatL2(d)
index.add(text_embeddings)

# Query in Korean - multilingual support
question = "저자가 대학에 오기 전에 주로 했던 두 가지 일은 무엇이었나요?"
question_embedding = np.array(embed_client.embed(input=[question], model=embed_model_name).data[0].embedding)

D, I = index.search(question_embeddings.reshape(1, -1), k=2)
retrieved_chunks = [chunks[i] for i in I.tolist()[0]]

prompt = f"""Context information is below.
---------------------
{retrieved_chunks}
---------------------
Given the context information and not prior knowledge, answer the query.
Query: {question}
Answer:"""

chat_response = client.complete(
    messages=[
        SystemMessage(content="You are a helpful assistant."),
        UserMessage(content=prompt),
    ],
    temperature=1.0, top_p=1.0, max_tokens=1000, model=model_name
)
print(chat_response.choices[0].message.content)
```

### Mistral Small - Cost-Efficient SLM

Advantages over Mistral Large:
- **80% price reduction**
- **Lower latency** - faster responses
- **Flexible deployment** - fewer resource constraints

Best for: summarization, sentiment analysis, translation, frequent requests, low-latency code review/suggestions

```python
import os
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential

endpoint = "https://models.inference.ai.azure.com"
model_name = "Mistral-small"
token = os.environ["GITHUB_TOKEN"]

client = ChatCompletionsClient(endpoint=endpoint, credential=AzureKeyCredential(token))

response = client.complete(
    messages=[
        SystemMessage(content="You are a helpful coding assistant."),
        UserMessage(content="Can you write a Python function to the fizz buzz test?"),
    ],
    temperature=1.0, top_p=1.0, max_tokens=1000, model=model_name
)
print(response.choices[0].message.content)
```

### Mistral NeMo - Open Source Apache2

The only free model in the lesson with Apache 2.0 license. Upgrade of Mistral 7B.

Unique features:
- **Tekken tokenizer** (more efficient than tiktoken for multilingual + code)
- **Fine-tunable** base model
- **Native Function Calling** - one of the first open source models with this

### Code: Comparing Tokenizers (NeMo vs Large)

```python
pip install mistral-common
```

```python
from mistral_common.protocol.instruct.messages import UserMessage
from mistral_common.protocol.instruct.request import ChatCompletionRequest
from mistral_common.protocol.instruct.tool_calls import Function, Tool
from mistral_common.tokens.tokenizers.mistral import MistralTokenizer

model_name = "open-mistral-nemo"  # change to "mistral-large-latest" to compare

tokenizer = MistralTokenizer.from_model(model_name)

tokenized = tokenizer.encode_chat_completion(
    ChatCompletionRequest(
        tools=[
            Tool(function=Function(
                name="get_current_weather",
                description="Get the current weather",
                parameters={
                    "type": "object",
                    "properties": {
                        "location": {"type": "string", "description": "The city and state, e.g. San Francisco, CA"},
                        "format": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "Temperature unit"},
                    },
                    "required": ["location", "format"],
                },
            ))
        ],
        messages=[UserMessage(content="What's the weather like today in Paris")],
        model=model_name,
    )
)
tokens, text = tokenized.tokens, tokenized.text
print(len(tokens))  # NeMo returns fewer tokens than Mistral Large
```

### Mistral Model Selection Guide

| Model | When to Use |
|---|---|
| Mistral Large 2 | Complex tasks, RAG, code generation, enterprise, multilingual |
| Mistral Small | High-frequency requests, cost-sensitive, low-latency tasks |
| Mistral NeMo | Open source Apache2, fine-tuning needed, better tokenization |

---

## LESSON 21: Building with Meta Llama Models

**Folder:** `21-meta/`

### The Llama Family (Meta)

Two main models covered from the "Llama Herd":

**Llama 3.1** - upgrades over Llama 3:
- Context window: 128k tokens (vs 8k)
- Max output tokens: 4096 (vs 2048)
- Better multilingual support

**Llama 3.2** - adds multimodality (images)

Available variants on GitHub Model marketplace:
- Llama 3.1 - 70B Instruct
- Llama 3.1 - 405B Instruct
- Llama 3.2 - 11B Vision Instruct
- Llama 3.2 - 90B Vision Instruct

[GitHub Models prototyping docs](https://docs.github.com/en/github-models/prototyping-with-ai-models)

### Llama 3.1 Key Capabilities

- **Native Function Calling** - call external tools and functions
- **Built-in tools**: `brave_search` (web/current info), `wolfram_alpha` (complex math)
- **Better RAG Performance** - 128k context window
- **Synthetic Data Generation** - create fine-tuning data

### Code: Llama 3.1 Native Function Calling

```python
import os
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import AssistantMessage, SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential

token = os.environ["GITHUB_TOKEN"]
endpoint = "https://models.inference.ai.azure.com"
model_name = "meta-llama-3.1-405b-instruct"

client = ChatCompletionsClient(endpoint=endpoint, credential=AzureKeyCredential(token))

tool_prompt = f"""
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Environment: ipython
Tools: brave_search, wolfram_alpha
Cutting Knowledge Date: December 2023
Today Date: 23 July 2024

You are a helpful assistant<|eot_id|>
"""

messages = [
    SystemMessage(content=tool_prompt),
    UserMessage(content="What is the weather in Stockholm?"),
]

response = client.complete(messages=messages, model=model_name)
print(response.choices[0].message.content)
# LLM responds with: <|python_tag|>brave_search.call(query="Stockholm weather")
```

### Llama 3.2 - Multimodal Capabilities

Key additions over Llama 3.1:
- Text + image prompt support
- Small/medium size variations: 11B and 90B (flexible deployment)
- Text-only variations: 1B and 3B (edge/mobile devices, low latency)

### Code: Llama 3.2 Multimodal (Image + Text)

```python
import os
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import (
    SystemMessage, UserMessage,
    TextContentItem, ImageContentItem,
    ImageUrl, ImageDetailLevel,
)
from azure.core.credentials import AzureKeyCredential

token = os.environ["GITHUB_TOKEN"]
endpoint = "https://models.inference.ai.azure.com"
model_name = "Llama-3.2-90B-Vision-Instruct"

client = ChatCompletionsClient(endpoint=endpoint, credential=AzureKeyCredential(token))

response = client.complete(
    messages=[
        SystemMessage(content="You are a helpful assistant that describes images in details."),
        UserMessage(
            content=[
                TextContentItem(text="What's in this image?"),
                ImageContentItem(
                    image_url=ImageUrl.load(
                        image_file="sample.jpg",
                        image_format="jpg",
                        detail=ImageDetailLevel.LOW
                    )
                ),
            ],
        ),
    ],
    model=model_name,
)
print(response.choices[0].message.content)
```

### Llama Model Selection Guide

| Model | Parameters | Best For |
|---|---|---|
| Llama 3.1 70B | 70B | Balanced performance, function calling, RAG |
| Llama 3.1 405B | 405B | Maximum quality, complex reasoning |
| Llama 3.2 11B Vision | 11B | Image understanding, cost-efficient multimodal |
| Llama 3.2 90B Vision | 90B | High-quality image analysis, visual Q&A |
| Llama 3.2 1B/3B | 1-3B | Edge devices, mobile, low latency, text-only |

---

## WHAT TO PRACTICE

### Immediate Exercises (Lessons 11-15)

1. **Function Calling**: Build a chatbot that calls the Microsoft Learn Catalog API to recommend courses. Add parameters for language, role, and level. Add error handling.

2. **UX Design Audit**: Take any AI app you have and apply the trust/transparency checklist: add AI disclosure, thumbs up/down feedback, opt-out for data collection.

3. **Security Testing**: For any AI app, identify: What data am I feeding the LLM? Could it leak? What happens if someone tries prompt injection? Implement input sanitization.

4. **RAG Pipeline**: Build a full RAG pipeline:
   - Load a PDF or text file
   - Chunk it with `split_text()`
   - Embed with `text-embedding-ada-002`
   - Store in a vector DB (Chromadb locally, or Azure AI Search)
   - Build a chatbot that answers questions from the document

5. **LLMOps**: Use PromptFlow to build a simple flow. Track Quality, Harm, Honesty, Cost, Latency metrics.

### Intermediate Exercises (Lessons 16-18)

6. **Open Model Comparison**: Use [Artificial Analysis](https://artificialanalysis.ai) to compare performance/price tradeoff for your use case. Run the same prompt against Mistral 7B, Llama 3.1 70B, and GPT-4 and compare outputs.

7. **AI Agents**: Build an AutoGen multi-agent app - e.g., two agents (Researcher + Writer) that collaborate to produce a blog post. Have a UserProxyAgent validate the final output.

8. **Fine-Tuning Decision**: Take a use case from your agency work. Go through the fine-tuning decision checklist (use case, alternatives tried, costs, benefits). Document whether fine-tuning is justified.

### Advanced Exercises (Lessons 19-21)

9. **Run Phi-3.5 Locally**: Install Ollama and run `ollama run phi3.5`. Compare output quality to GPT-3.5 on a domain-specific task. Measure latency.

10. **Mistral RAG**: Replicate the Mistral Large 2 RAG example with your own document. Replace the Paul Graham essay with a Vietnamese business document and use the multilingual embedding model.

11. **Llama Multimodal**: Use Llama 3.2 Vision to build an image analysis tool. Feed product images and extract structured data (name, price, features) using function calling.

---

## KEY CONCEPTS REFERENCE

### Decision Framework: Which Technique to Use?

```
Need up-to-date or private data?
  YES -> Use RAG
  NO  -> Continue

Need consistent structured output from LLM?
  YES -> Use Function Calling
  NO  -> Continue

Need LLM to take actions and use tools?
  YES -> Use AI Agents (LangChain/AutoGen/TaskWeaver)
  NO  -> Continue

Need to change model behavior/style/domain?
  YES -> Consider Fine-Tuning (try prompt engineering first)
  NO  -> Standard prompt engineering is sufficient
```

### Model Size Decision Framework

```
Resource-constrained? (mobile, edge, low budget)
  YES -> SLM (Phi-3-mini, Mistral Small, Llama 3.2 1B/3B)
  NO  -> Continue

Need broad versatility across many domains?
  YES -> Large model (GPT-4, Llama 3.1 405B, Mistral Large)
  NO  -> Continue

Specific domain (medical, code, math)?
  YES -> Domain fine-tuned SLM (BioMistral, OpenMath Mistral, CodeLlama)
  NO  -> General-purpose medium model
```

### Important Links Summary

| Topic | Resource |
|---|---|
| Function Calling | [Learn API Catalog Reference](https://learn.microsoft.com/training/support/catalog-api-developer-reference) |
| UX Design | [UX Design Module](https://learn.microsoft.com/training/modules/ux-design) |
| AI Security | [MITRE ATLAS](https://atlas.mitre.org) |
| AI Security | [OWASP LLM Top 10](https://llmtop10.com) |
| AI Security | [Must Learn AI Security ebook](https://github.com/rod-trent/OpenAISecurity/tree/main/Must_Learn/Book_Version) |
| LLMOps | [PromptFlow](https://microsoft.github.io/promptflow/index.html) |
| LLMOps | [Azure AI Studio](https://ai.azure.com) |
| LLMOps | [Contoso Chat Demo](https://nitya.github.io/contoso-chat) |
| RAG | [Original RAG paper](https://arxiv.org/pdf/2005.11401.pdf) |
| Open Models | [Hugging Face LLM Leaderboard](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard) |
| Open Models | [Artificial Analysis](https://artificialanalysis.ai) |
| Open Models | [Azure AI Foundry Model Catalog](https://ai.azure.com) |
| AI Agents | [AutoGen docs](https://microsoft.github.io/autogen) |
| AI Agents | [AutoGen Examples](https://microsoft.github.io/autogen/docs/Examples/) |
| AI Agents | [TaskWeaver](https://microsoft.github.io/TaskWeaver) |
| AI Agents | [JARVIS GitHub](https://github.com/microsoft/JARVIS) |
| Fine-Tuning | [To fine-tune or not video](https://www.youtube.com/watch?v=0Jo-z-MFxJs) |
| Fine-Tuning | [OpenAI cookbook](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_finetune_chat_models.ipynb) |
| Fine-Tuning | [Hugging Face TRL guide](https://www.philschmid.de/fine-tune-llms-in-2024-with-trl) |
| SLM/Phi-3 | [Phi-3 Cookbook](https://github.com/microsoft/phi-3cookbook) |
| Mistral | [GitHub Models marketplace](https://docs.github.com/en/github-models/prototyping-with-ai-models) |
| GenAI Collection | [Full learning collection](https://aka.ms/genai-collection) |
