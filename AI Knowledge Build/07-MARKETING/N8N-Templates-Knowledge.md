---
tags: [knowledge, marketing, n8n, automation, templates, workflows]
source_repo: awesome-n8n-templates
files_read: 12
---

# Awesome N8N Templates - Knowledge Extraction

## Overview

- **Repo**: `enescingoz/awesome-n8n-templates` (GitHub, 19,000+ stars, CC-BY-4.0)
- **Size**: 280+ templates across 18 categories, 299 JSON workflow files (as of March 2026)
- **Purpose**: Largest open-source collection of ready-to-import n8n workflow templates
- **Usage**: Download `.json` file -> import via n8n "Workflows -> Import from File" -> configure credentials -> activate

### Why n8n Over Zapier/Make
- Open-source, self-hostable (no vendor lock-in, full data control)
- 400+ built-in integrations
- Visual drag-and-drop editor (no code required)
- AI-native: built-in LangChain, OpenAI, Claude, Gemini, vector DB support
- Free self-host or generous cloud free tier

---

## Template Categories

| Category | Template Count | Primary Use |
|----------|---------------|-------------|
| AI Research, RAG & Data Analysis | 39 | Research, vector DBs, web scraping |
| OpenAI & LLMs | 19 | AI agents, chatbots, automation |
| Telegram | 18+ | Bots, voice, customer support |
| Google Drive & Sheets | 13 | Documents, leads, fine-tuning |
| PDF & Document Processing | 11 | Q&A, parsing, extraction |
| Other Integrations | 31 | Misc platforms |
| Gmail & Email Automation | 12 | Email AI, labeling, cold outreach |
| WordPress | 6 | AI content, chatbots |
| Social Media (Instagram/Twitter) | 12 | Social posting, repurposing |
| WhatsApp | 4 | Business chatbots, sales prep |
| Discord | ~5 | Community automation |
| Slack | 9 | Bots, alerts, ticketing |
| Notion | 8 | Knowledge base, vector store |
| Airtable | 5 | CRM, data extraction |
| Forms & Surveys | 3 | Lead qualification, subscriptions |
| Database & Storage | 6 | SQL agents, MongoDB, Supabase |
| HR & Recruitment | 4 | CV screening, job posting |
| DevOps | 2 | Docker, Linux server automation |

---

## Marketing Automation Templates

### Email Marketing
| Template | What It Does | Key Tech |
|----------|-------------|----------|
| **LeadPilot Lite - AI Cold Email Writer** | Webhook -> parse lead list -> GPT-4o-mini writes personalized subject + body + follow-up -> logs to Google Sheets | OpenAI gpt-4o-mini, Google Sheets, Webhook |
| **InboxZero Lite - AI Email Classifier** | Classifies Gmail emails as urgent/important/info/spam, logs to Google Sheets | OpenAI gpt-4o-mini, Gmail |
| **Auto-label incoming Gmail messages with AI** | Suggests and assigns labels (Partnership, Inquiry, etc.) automatically | Gmail API, AI nodes |
| **Compose reply draft in Gmail with OpenAI Assistant** | Triggers on new email, creates AI-written draft reply | OpenAI Assistant, Gmail |
| **AI Email Auto-Responder with Ollama** | Classifies incoming emails, filters spam, drafts replies using local Ollama (no API key) | Ollama (local), IMAP |
| **Human in the Loop Email Response** | Fetch email -> AI summarize -> draft reply -> human reviews before send | AI, IMAP |

### Content Marketing
| Template | What It Does | Key Tech |
|----------|-------------|----------|
| **FlowScribe Lite - AI Content Repurposing** | One blog post -> 4 platform-optimized posts (Twitter thread, LinkedIn, Instagram, Facebook) | OpenAI gpt-4o-mini, Webhook |
| **AI Social Media Content Generator with Ollama** | Topic input -> optimized posts for Twitter/LinkedIn/Reddit/Instagram with quality review | Ollama (local) |
| **Automate Blog Creation in Brand Voice with AI** | Generates WordPress posts matching brand voice | WordPress, AI |
| **Write a WordPress post from a few keywords** | Keywords -> full AI-written blog post published to WordPress | WordPress, AI |
| **Auto-Categorize blog posts in WordPress with AI** | Automatically categorizes existing WordPress posts | WordPress, AI |
| **Auto-Tag Blog Posts in WordPress with AI** | Auto-tags posts for SEO and discoverability | WordPress, AI |
| **Author and Publish Blog Posts From Google Sheets** | Google Sheets as content calendar -> auto-publishes to CMS | Google Sheets |
| **AI Blog Writer Pipeline with Ollama** | Research topic -> outline -> full draft -> edit, entirely local | Ollama (local) |

### Social Media
| Template | What It Does | Key Tech |
|----------|-------------|----------|
| **AI agent for Instagram DM inbox** | AI agent manages Instagram DMs automatically | Manychat, OpenAI |
| **Generate Instagram Content from Top Trends** | Analyzes trends -> generates images + captions | AI image generation |
| **Twitter Virtual AI Influencer** | Manages a fully AI-driven Twitter presence | OpenAI |
| **OpenAI-powered tweet generator** | Generates tweets from topics | OpenAI |
| **Post New YouTube Videos to X** | Auto-posts YouTube video links to X/Twitter | YouTube, Twitter API |
| **Reddit AI digest** | AI-curated Reddit content digest | Reddit API, OpenAI |
| **AI-Powered Social Media Amplifier** | Amplifies social presence across platforms | OpenAI |
| **Upload to Instagram and TikTok from Google Drive** | Publishes media directly from Drive to IG/TikTok | Google Drive, Instagram, TikTok |
| **Speed Up Social Media Banners With BannerBear** | Auto-generates social banners | BannerBear.com API |
| **UTM Link Creator & QR Code Generator** | Creates UTM links + QR codes + schedules GA reports | Google Analytics |

### Analytics & SEO
| Template | What It Does | Key Tech |
|----------|-------------|----------|
| **Generate SEO Seed Keywords Using AI** | AI generates SEO keyword lists for content | OpenAI |
| **Summarize SERPBear data with AI** | Summarizes SEO rank tracker data | SERPBear, OpenRouter, Baserow |
| **Send Google Analytics data to AI for analysis** | GA data -> AI analysis -> saved to Baserow | Google Analytics, Baserow |
| **Summarize Umami data with AI** | Umami analytics -> AI insights -> Baserow | Umami, OpenRouter |
| **Scrape Trustpilot Reviews & Analyze Sentiment** | Scrapes reviews -> sentiment analysis | DeepSeek, OpenAI |
| **Social Media Analysis and Automated Email Generation** | Analyzes social data -> email report | Analytics APIs |
| **Automate Pinterest Analysis & AI Content Suggestions** | Pinterest data -> AI content recommendations | Pinterest API |

---

## Sales Automation Templates

| Template | What It Does | Key Tech |
|----------|-------------|----------|
| **Qualify new leads in Google Sheets via GPT-4** | GPT-4 scores/qualifies leads in a Sheet for sales prioritization | Google Sheets, GPT-4 |
| **AI-Driven Lead Management with ERPNext** | Lead intake -> AI qualification -> ERPNext CRM update | ERPNext, OpenAI |
| **Automate Sales Meeting Prep with AI & APIFY** | Researches prospect via Apify -> sends brief to WhatsApp | Apify, WhatsApp, AI |
| **Qualify replies from Pipedrive persons with AI** | AI categorizes/qualifies CRM reply emails | Pipedrive, OpenAI |
| **Handling Appointment Leads and Follow-up** | Appointment form -> AI qualify -> schedule via Cal.com -> Twilio follow-up | Twilio, Cal.com, AI |
| **AI web researcher for sales** | AI researches prospects from web for sales teams | Jina AI, OpenAI |
| **Automate Your RFP Process with OpenAI Assistants** | Processes RFP documents with AI for faster responses | OpenAI Assistants |
| **lemlist + GPT-3: Supercharge sales workflows** | AI-enhances lemlist cold email sequences | lemlist, GPT-3 |
| **Classify lemlist replies with OpenAI** | Auto-classifies and routes email replies for sales follow-up | lemlist, OpenAI |
| **ClientFlow Lite - Client Onboarding Automation** | Webhook -> validate -> welcome email + Google Sheets log | Gmail, Google Sheets |
| **vAssistant for Hubspot Chat using OpenAI and Airtable** | AI chat assistant for HubSpot using Airtable as knowledge base | HubSpot, Airtable, OpenAI |

---

## AI/LLM Integration Templates

### Agent Patterns
| Template | What It Does | Key Tech |
|----------|-------------|----------|
| **Agentic Telegram AI bot with LangChain** | Full conversational agent with memory, dynamic tool use | LangChain, OpenAI, Telegram |
| **AI agent that can scrape webpages** | Autonomous scraping agent | OpenAI |
| **AI chatbot that can search the web** | AI with live web search capability | OpenAI, search API |
| **Ask a human for help when AI doesn't know** | Human-in-the-loop escalation pattern | OpenAI |
| **Using External Workflows as Tools in n8n** | Compose workflows as tools for AI agents | n8n native |
| **AI Agent to Chat with Supabase/PostgreSQL DB** | Natural language SQL queries via AI | Supabase/Postgres, OpenAI |
| **Chat with Google Sheet using AI** | NL queries against spreadsheet data | Google Sheets, OpenAI |
| **Host Your Own AI Deep Research Agent** | Autonomous multi-step research with web access | Apify, OpenAI o3 |
| **Open Deep Research - Autonomous Research Workflow** | Deep research agent, fully autonomous | OpenAI |

### RAG (Retrieval-Augmented Generation)
| Template | What It Does | Key Tech |
|----------|-------------|----------|
| **RAG Chatbot for Company Documents (Google Drive + Gemini)** | Answers questions from company docs in Drive | Google Drive, Gemini, vector store |
| **Complete business WhatsApp AI-Powered RAG Chatbot** | WhatsApp bot backed by knowledge base | WhatsApp Business API, OpenAI, vector store |
| **AI-Powered Email Automation with RAG** | Summarizes & responds to emails using RAG knowledge | OpenAI, vector store |
| **AI-Powered RAG Workflow for Stock Earnings Reports** | RAG on financial docs for analysis | OpenAI, vector DB |
| **Build a Financial Documents Assistant (Qdrant + Mistral)** | Vector search over financial docs | Qdrant, Mistral AI |
| **Chat with GitHub API Documentation (Pinecone + OpenAI)** | RAG chatbot over API docs | Pinecone, OpenAI |
| **Notion knowledge base AI assistant** | Queries Notion as knowledge base | Notion, OpenAI |
| **Personal Shopper Chatbot for WooCommerce with RAG** | Product search via RAG in WooCommerce | Google Drive, OpenAI |
| **KB Tool - Confluence Knowledge Base** | AI queries Confluence docs | Confluence |

### Multi-modal & Voice
| Template | What It Does | Key Tech |
|----------|-------------|----------|
| **Telegram Messaging Agent for Text/Audio/Images** | Handles all modalities in Telegram | OpenAI, Telegram |
| **AI Voice Chat (Webhook + ElevenLabs + OpenAI + Gemini)** | Full voice conversation pipeline | ElevenLabs, OpenAI, Gemini |
| **Translate Telegram audio messages (55 languages)** | Voice -> transcribe -> translate -> reply | OpenAI Whisper, Telegram |
| **Narrating over a Video using Multimodal AI** | Generates narration for video content | Multimodal LLM |
| **AI Voice Chatbot for Customer Service** | Voice-based customer service bot | ElevenLabs, OpenAI |

### Local/Self-Hosted AI
| Template | What It Does | Key Tech |
|----------|-------------|----------|
| **Private & Local Ollama Self-Hosted AI Assistant** | Fully local AI assistant, no API keys | Ollama |
| **Chat with local LLMs using n8n and Ollama** | Connect any local Ollama model | Ollama |
| **AI Email Auto-Responder with Ollama** | Local email classification + reply drafting | Ollama, IMAP |
| **AI Blog Writer Pipeline with Ollama** | Full blog writing pipeline, local | Ollama |
| **Extract personal data with self-hosted Mistral NeMo** | Local data extraction | Mistral NeMo |
| **DeepSeek V3 Chat & R1 Reasoning Quick Start** | Fast start with DeepSeek models | DeepSeek |
| **Local Multi-LLM Testing & Performance Tracker** | Test & compare multiple local LLMs | Ollama |

---

## Data Processing Templates

| Template | What It Does | Key Tech |
|----------|-------------|----------|
| **Summarize New Documents from Google Drive to Google Sheets** | Auto-summarizes new Drive docs | Google Drive, OpenAI |
| **Chat with PDF docs using AI (quoting sources)** | PDF Q&A with source citations | OpenAI, embeddings |
| **CV Resume PDF Parsing with Multimodal Vision AI** | Converts PDF to images -> vision model screens fit | Vision LLM |
| **Extract invoice data via LlamaParse** | Extracts structured data from invoices | LlamaParse |
| **Breakdown Documents into Study Notes (MistralAI + Qdrant)** | Turns docs into structured study notes | Mistral, Qdrant |
| **Context-Aware Chunking: Google Drive to Pinecone** | Smart document chunking for RAG | Pinecone, OpenRouter, Gemini |
| **Convert URL HTML to Markdown** | Web pages -> clean Markdown | HTTP, parser |
| **Generate SQL queries from schema only** | NL to SQL with schema context only | OpenAI, PostgreSQL |
| **Chat with PostgreSQL DB** | Natural language DB queries | LangChain, PostgreSQL |
| **MongoDB AI Agent - Movie Recommendations** | AI agent over MongoDB | MongoDB, OpenAI |
| **Ultimate Scraper Workflow for n8n** | Comprehensive multi-source web scraper | Jina AI, HTTP |
| **DataForge Lite - AI URL Data Extractor** | POST URL -> extract structured JSON | OpenAI, Webhook |
| **Autonomous AI crawler** | AI-powered autonomous web crawling | OpenAI |

---

## Key Workflow Patterns

### 1. Webhook-Triggered Pipeline (most common)
```
Webhook (POST) -> Code node (validate/parse) -> AI node -> Code node (merge) -> Output (Sheets/email/respond)
```
Used in: LeadPilot Lite, FlowScribe Lite, ClientFlow Lite

### 2. Scheduled Polling Pattern
```
Schedule Trigger -> Fetch data source -> AI process -> Store/notify
```
Used in: Daily recipe Telegram, Market news email, Reddit digest

### 3. Event-Driven Trigger Pattern
```
Email/Form arrives -> Filter/route -> AI classify/respond -> Log result
```
Used in: Gmail labeling, Email auto-responder, Lead qualifier

### 4. RAG Pipeline Pattern
```
Document ingestion: Source -> Chunk -> Embed -> Vector DB
Query: User message -> Retrieve relevant chunks -> LLM + context -> Response
```
Used in: WhatsApp RAG Chatbot, Company Docs Chatbot, Financial Docs Assistant

### 5. Human-in-the-Loop Pattern
```
Trigger -> AI process -> Stage result -> Human review -> Approve/Edit -> Send
```
Used in: IMAP email response, Email approval workflow

### 6. Multi-step AI Agent Pattern
```
User input -> LangChain Agent -> Tool calls (web/DB/API) -> Reasoning loop -> Final response
```
Used in: Agentic Telegram bot, AI Deep Research Agent, AI web scraper

### 7. Parallel Fan-out Pattern
```
Trigger -> Parse -> [Branch 1 (email)] + [Branch 2 (Sheets log)] -> Merge -> Respond
```
Used in: ClientFlow Lite (sends email AND logs simultaneously)

---

## Integration Patterns (APIs, Webhooks)

### Trigger Types Used Across Templates
- **Webhook (POST)**: Most common - external systems push data to n8n
- **Schedule/Cron**: Time-based polling and daily reports
- **Email trigger (IMAP/Gmail)**: New email events
- **Form submission**: n8n native forms or external
- **Chat message**: Telegram/WhatsApp/Slack webhook

### AI Model Integration Patterns
- **Direct OpenAI node**: Simple one-shot completions, structured JSON output (`responseFormat: "json_object"`)
- **LangChain Agent node**: Multi-step reasoning with tools, memory management
- **OpenAI Assistant**: Stateful conversation with file upload support
- **Ollama node**: Local model access (no API costs)
- **OpenRouter**: Model-agnostic routing (access Gemini, Claude, Mistral via single endpoint)

### Data Storage Patterns
| Storage | Use Case |
|---------|----------|
| Google Sheets | Pipeline tracking, lead logs, content calendars |
| Supabase | Long-term chat memory, vector storage |
| Pinecone | Production vector search |
| Qdrant | Self-hosted vector search |
| Airtable | Structured CRM/project data |
| NocoDB/Baserow | Self-hosted spreadsheet DB |
| PostgreSQL | Relational data + pgvector |
| MongoDB | Document store |

### Key API Integrations Demonstrated
- **Messaging**: WhatsApp Business API, Telegram Bot API, Twilio, LINE
- **Email**: Gmail API, Outlook/Microsoft Graph, IMAP/SMTP
- **Social**: Instagram Graph API, Twitter/X API, Reddit API, Pinterest API, LinkedIn
- **CMS**: WordPress REST API, Strapi
- **CRM**: HubSpot, Pipedrive, ERPNext, Monday.com
- **Research/Scraping**: Apify, Jina AI, Brave Search, Perplexity API
- **Voice**: ElevenLabs, Vapi.ai, Bland.ai

---

## What We Can Reuse

### High-Priority Templates for AI Agency Business

#### 1. Lead Generation & Sales
- **LeadPilot Lite** - Cold email writer: customize with our service offerings, connect to our lead list
- **Qualify leads in Google Sheets via GPT-4** - Instant lead scoring pipeline
- **Automate Sales Meeting Prep** - Research prospects before calls, send brief via WhatsApp/Telegram
- **ClientFlow Lite** - Onboarding new clients with welcome email + CRM logging

#### 2. Marketing Content Production
- **FlowScribe Lite** - One article -> 4 social platform posts (Twitter, LinkedIn, Instagram, Facebook)
- **AI Social Media Content Generator (Ollama)** - Local, free, no API costs for bulk content
- **AI Blog Writer Pipeline (Ollama)** - Full blog pipeline locally, zero ongoing cost
- **Auto-Blog + Auto-Tag + Auto-Categorize** - WordPress content machine

#### 3. Customer Service Automation
- **SupportFlow Lite** - Lightweight AI chatbot using Google Sheets as knowledge base
- **Complete WhatsApp AI RAG Chatbot** - Full business chatbot with RAG (resell to clients)
- **AI Email Auto-Responder (Ollama)** - Local email handling with no API cost
- **Telegram AI bot with LangChain** - Full-featured support bot

#### 4. Client-Facing Products (Resellable)
- **WhatsApp Business RAG Chatbot** - Deploy for e-commerce/retail clients
- **WordPress AI Chatbot (Supabase + OpenAI)** - Embed on client websites
- **AI Customer Feedback Sentiment Analysis** - Monthly reporting tool for clients
- **HR & IT Helpdesk Chatbot with Audio** - Internal tool for corporate clients

#### 5. Agency Operations
- **VoiceAgent Lite** - Log phone calls from Vapi/Bland to Sheets
- **Zoom AI Meeting Assistant** - Auto-generate meeting summaries + ClickUp tasks + follow-up calls
- **AI to organize Todoist Inbox** - Personal productivity
- **Obsidian Notes Read Aloud as Podcast** - Convert knowledge base to audio

#### 6. Vietnam Market Relevance
- **WhatsApp + Telegram bots** - Primary messaging channels in Vietnam
- **Translate audio messages (55 languages)** - Vietnamese voice translation pipeline
- **LINE Assistant** - LINE popular in parts of Southeast Asia
- **Local Ollama templates** - Cost-effective for clients who can't use cloud APIs

---

## Lessons & Best Practices

### Workflow Design
1. **Always validate input first** - All "Lite" templates include a Code node that validates required fields and throws descriptive errors before hitting AI
2. **Use `retryOnFail: true, maxTries: 3`** on AI nodes - network errors are common, automatic retry prevents broken workflows
3. **Structured JSON output from AI** - Use `responseFormat: "json_object"` with OpenAI and define schema in system prompt for reliable parsing
4. **Parallel execution for independent tasks** - Fan out to multiple nodes simultaneously (email + log) then merge, rather than sequential
5. **Environment variables for secrets** - Use `$env.MY_VARIABLE` for API keys and config, never hardcode
6. **Sticky notes for documentation** - Complex workflows include sticky note nodes explaining each step

### AI Prompting in Workflows
- System prompt defines persona + output format strictly
- User prompt injects dynamic data via n8n expressions: `{{$json.name}}`, `{{$json.email}}`
- Temperature 0.3-0.7 range: lower for data extraction/classification, higher for creative writing
- Keep JSON output schemas simple and flat - easier to parse in downstream Code nodes
- Include example outputs in system prompts for complex structured responses

### Cost Optimization Patterns
- **gpt-4o-mini over gpt-4** for classification/labeling tasks (10x cheaper, good enough)
- **Ollama (local)** for high-volume tasks: blog writing, content generation, bulk email classification
- **OpenRouter** for model routing - switch between providers without code changes
- **Batch processing** leads/emails in loops rather than individual API calls

### Credential & Security
- Each template requires setting up credentials per service in n8n
- WhatsApp templates need Meta Business API approval (not instant)
- Gmail templates use OAuth2 (more setup but secure)
- Telegram bots require @BotFather setup (5 minutes)

### Architecture Patterns for Client Deployments
- Use webhooks as entry points -> clients can trigger from any system
- Store results in Google Sheets as the "no-code database" for non-technical clients
- Add `Respond to Webhook` node to confirm receipt immediately (prevents timeout)
- Supabase for stateful chat memory (persists across sessions)
- Use n8n's built-in Forms for quick intake without external form tools

### Template Modification Strategy
1. Start with closest "Lite" template (minimal, understandable)
2. Add more AI nodes for richer processing
3. Add more output channels (email + Slack + CRM)
4. Add error handling branches
5. Add monitoring/alerting

### n8n Node Reference
Key nodes used across all templates:
- `n8n-nodes-base.webhook` - entry point
- `n8n-nodes-base.code` - JavaScript logic, parsing, validation
- `n8n-nodes-base.openAi` - direct OpenAI calls
- `@n8n/n8n-nodes-langchain.agent` - LangChain AI agents
- `@n8n/n8n-nodes-langchain.lmChatOpenAi` - OpenAI LLM for LangChain
- `n8n-nodes-base.googleSheets` - Sheets read/write
- `n8n-nodes-base.gmail` - Gmail operations
- `n8n-nodes-base.respondToWebhook` - send response back
- `n8n-nodes-base.scheduleTrigger` - cron scheduling
- `n8n-nodes-base.stickyNote` - workflow documentation
