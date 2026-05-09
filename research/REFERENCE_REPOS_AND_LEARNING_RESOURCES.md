# Reference Implementations & Learning Resources for Building Production AI Systems

> Comprehensive research compiled May 2026. All repos verified via web search.

---

## TABLE OF CONTENTS

1. [Full-Stack AI Application Examples](#1-full-stack-ai-application-examples)
2. [Multi-Agent System Implementations](#2-multi-agent-system-implementations)
3. [AI Chatbot Production Systems](#3-ai-chatbot-production-systems)
4. [AI Content Generation Systems](#4-ai-content-generation-systems)
5. [Awesome Lists for AI Systems](#5-awesome-lists-for-ai-systems)
6. [Boilerplate / Starter Kits](#6-boilerplate--starter-kits)
7. [Learning Repositories](#7-learning-repositories)
8. [Vietnamese / SEA Market Repos](#8-vietnamese--sea-market-repos)
9. [n8n AI Automation Workflow Collections](#9-n8n-ai-automation-workflow-collections)
10. [Chat Widgets & Embeddable Systems](#10-chat-widgets--embeddable-systems)
11. [AI Email & Outreach Systems](#11-ai-email--outreach-systems)
12. [Video Script & Content Automation](#12-video-script--content-automation)

---

## 1. FULL-STACK AI APPLICATION EXAMPLES

### Vercel AI SDK & Official Templates

| Repository | Description | Why Relevant |
|---|---|---|
| [vercel/chatbot](https://github.com/vercel/chatbot) | Full-featured, hackable Next.js AI chatbot built by Vercel. Production-ready with auth, multimodal, generative UI, artifacts, in-browser code execution. | **Gold standard** for Next.js + AI SDK chatbot. Study its architecture for auth, streaming, persistence patterns. |
| [vercel/ai](https://github.com/vercel/ai) | The AI Toolkit for TypeScript - free open-source library for building AI-powered applications and agents. | Core SDK to understand. Contains examples for every AI pattern. |
| [supabase-community/vercel-ai-chatbot](https://github.com/supabase-community/vercel-ai-chatbot) | Full-featured AI chatbot with Next.js + AI SDK + Supabase Auth + Postgres DB. | Study for Supabase integration patterns with AI chat. |
| [vercel/ai-chatbot-svelte](https://github.com/vercel/ai-chatbot-svelte) | Full-featured SvelteKit AI chatbot by Vercel. | Alternative framework reference for AI SDK. |
| [vercel-labs/ai-sdk-reasoning-starter](https://github.com/vercel-labs/ai-sdk-reasoning-starter) | Chatbot starter for reasoning models (o1, etc.). | Study for implementing reasoning model UX patterns. |
| [vercel/nextjs-subscription-payments](https://github.com/vercel/nextjs-subscription-payments) | SaaS subscription app with Next.js + Stripe + Supabase. | Reference for payment/subscription architecture. |

### FastAPI + LangChain/LangGraph Production Backends

| Repository | Description | Why Relevant |
|---|---|---|
| [wassim249/fastapi-langgraph-agent-production-ready-template](https://github.com/wassim249/fastapi-langgraph-agent-production-ready-template) | Production-ready FastAPI + LangGraph template with stateful conversations, long-term memory (mem0 + pgvector), tool calling, human-in-the-loop, Langfuse tracing, Prometheus metrics, JWT auth, rate limiting, Alembic migrations. | **Best-in-class** backend template. Study everything: auth, observability, memory, fallbacks. |
| [Harmeet10000/langchain-fastapi-production](https://github.com/Harmeet10000/langchain-fastapi-production) | Production-grade FastAPI + LangChain + LangGraph + LangSmith with Gemini, Pinecone vector storage, Crawl4AI web scraping, MCP integration. | Study for multi-tool agent backend architecture. |
| [fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template) | Official Full Stack FastAPI template with React, SQLModel, PostgreSQL, Docker, GitHub Actions. | Foundation template for any Python backend. |
| [MemduhG/langchain-fastapi-template](https://github.com/MemduhG/langchain-fastapi-template) | RAG template using FastAPI and LangChain. | Minimal RAG backend reference. |

### Complete RAG Applications with UI

| Repository | Description | Why Relevant |
|---|---|---|
| [langgenius/dify](https://github.com/langgenius/dify) | **129K+ stars.** Production-ready agentic workflow platform. Visual workflow builder, RAG pipeline, agent capabilities, model management, observability, 100+ model integrations. Backend-as-a-Service with APIs. | **Must-study platform.** The most complete open-source LLM app platform. Study its architecture for workflow design, RAG, multi-model support. |
| [danny-avila/LibreChat](https://github.com/danny-avila/LibreChat) | Enhanced ChatGPT clone with Agents, MCP, multi-provider (OpenAI, Anthropic, Google, etc.), artifacts, code interpreter, secure multi-user auth, conversation search. | Study for multi-provider chat system architecture and plugin system. |
| [open-webui/open-webui](https://github.com/open-webui/open-webui) | Self-hosted AI interface supporting Ollama + OpenAI-compatible APIs. Full chat UI with multi-user, model management, RAG, extensibility. | Study for self-hosted AI chat platform architecture. |
| [deepset-ai/haystack](https://github.com/deepset-ai/haystack) | Enterprise RAG framework. Modular pipelines for retrieval, routing, memory, generation. Used by The Economist, Oxford University Press. | Study for production RAG pipeline patterns and enterprise architecture. |
| [weaviate/Verba](https://github.com/weaviate/Verba) | Customizable RAG chatbot powered by Weaviate vector DB. | Study for Weaviate-based RAG implementation. |
| [deepset-ai/haystack-rag-app](https://github.com/deepset-ai/haystack-rag-app) | Example RAG backend + UI using Haystack. | Quick reference for Haystack-based RAG app. |
| [ranji-t/RAG-APP](https://github.com/ranji-t/RAG-APP) | Full-stack RAG: FastAPI/LangChain backend + Flutter frontend, Qdrant vector search, Ollama embeddings, GPT-4o, Docker Compose. | Study for containerized production RAG architecture. |
| [pdm21/RAGv1-Full-Stack](https://github.com/pdm21/RAGv1-Full-Stack) | React + FastAPI + LangChain + AWS Bedrock + ChromaDB + Docker + EC2 + Nginx. | Study for AWS deployment patterns for RAG. |
| [RafalWilinski/cloudflare-rag](https://github.com/RafalWilinski/cloudflare-rag) | Fullstack "Chat with your PDFs" RAG built entirely on Cloudflare (Workers, Pages, D1, KV, R2, AI Gateway). | Study for edge-deployed RAG architecture. |

### AI Dashboard Applications

| Repository | Description | Why Relevant |
|---|---|---|
| [adrianhajdin/ai_saas_app](https://github.com/adrianhajdin/ai_saas_app) | Full SaaS app with AI features, payments & credits system. Next.js 14, Clerk, MongoDB, Cloudinary AI, Stripe. | Study for AI SaaS with credits/payment system. |
| [linghong/smartchat](https://github.com/linghong/smartchat) | Multi-model AI chatbot platform with RAG (Pinecone) and model fine-tuning capability. Next.js + TypeScript. | Study for multi-model management and fine-tuning UI. |

---

## 2. MULTI-AGENT SYSTEM IMPLEMENTATIONS

### CrewAI

| Repository | Description | Why Relevant |
|---|---|---|
| [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | **50K+ stars.** Framework for orchestrating role-playing, autonomous AI agents. Collaborative intelligence for complex tasks. | Core framework to understand multi-agent patterns. |
| [crewAIInc/crewAI-examples](https://github.com/crewAIInc/crewAI-examples) | Official examples including **marketing_strategy**, lead scoring, content generation, and more. | Study marketing_strategy crew for our marketing use case. |
| [crewAIInc/awesome-crewai](https://github.com/crewAIInc/awesome-crewai) | Curated list of community-built CrewAI projects. | Discovery resource for CrewAI patterns. |
| [shaadclt/Customer-Outreach-Campaign-crewAI](https://github.com/shaadclt/Customer-Outreach-Campaign-crewAI) | CrewAI for sales outreach + lead profiling using LangChain. Identifies high-value leads, crafts personalized campaigns. | **Directly relevant** to our sales/marketing automation goals. |
| [OneDuckyBoy/Awesome-AI-Agents-HUB-for-CrewAI](https://github.com/OneDuckyBoy/Awesome-AI-Agents-HUB-for-CrewAI) | Multi-agent system projects showcase with CrewAI. | Collection of practical CrewAI implementations. |

### LangGraph

| Repository | Description | Why Relevant |
|---|---|---|
| [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | Build resilient language agents as graphs. TypeScript + Python. | Core framework for stateful agent workflows. |
| [langchain-ai/langgraph-example](https://github.com/langchain-ai/langgraph-example) | Production-ready HTTP microservice for LangGraph apps with built-in persistence. | Study for deploying LangGraph as microservice. |
| [langchain-ai/langgraph/tree/main/examples](https://github.com/langchain-ai/langgraph/tree/main/examples) | Official LangGraph examples directory. | Comprehensive example collection. |
| [von-development/awesome-LangGraph](https://github.com/von-development/awesome-LangGraph) | Index of LangChain + LangGraph ecosystem: concepts, projects, tools, templates, guides. | Discovery resource for LangGraph ecosystem. |
| [jkmaina/LangGraphProjects](https://github.com/jkmaina/LangGraphProjects) | Companion repo for "The Complete LangGraph Blueprint: Build 50+ AI Agents for Business Success." | 50+ practical agent implementations. |
| [dipanjanS/mastering-intelligent-agents-langgraph-workshop-dhs2025](https://github.com/dipanjanS/mastering-intelligent-agents-langgraph-workshop-dhs2025) | Full-day workshop: LLM I/O, tool-use, routing, memory, multi-agent systems, Agentic RAG, multimodal agents, deployment & monitoring. | Comprehensive learning resource with notebooks. |

### AutoGen / AG2 / Microsoft Agent Framework

| Repository | Description | Why Relevant |
|---|---|---|
| [microsoft/autogen](https://github.com/microsoft/autogen) | **177K+ stars.** Programming framework for agentic AI (now in maintenance mode). | Study the patterns even though it's being superseded. |
| [ag2ai/ag2](https://github.com/ag2ai/ag2) | AG2 (formerly AutoGen) - The Open-Source AgentOS. Sophisticated multi-agent collaboration through flexible orchestration patterns. | Active successor to AutoGen. |
| [victordibia/designing-multiagent-systems](https://github.com/victordibia/designing-multiagent-systems) | Book companion: "Designing Multi-Agent Systems: Principles, Patterns, and Implementation." | Study for multi-agent architecture theory + practice. |
| [jkmaina/autogen_blueprint](https://github.com/jkmaina/autogen_blueprint) | Companion for "The Complete AutoGen AI Agent Blueprint" book. Comprehensive code examples. | Practical implementations guide. |

### Agent Orchestration

| Repository | Description | Why Relevant |
|---|---|---|
| [kaymen99/sales-outreach-automation-langgraph](https://github.com/kaymen99/sales-outreach-automation-langgraph) | Automate lead research, qualification, and outreach with AI agents + LangGraph. Connects to HubSpot, Airtable, Google Sheets. | **Directly relevant** - sales automation with real CRM integrations. |
| [FareedKhan-dev/all-agentic-architectures](https://github.com/FareedKhan-dev/all-agentic-architectures) | Implementation of 17+ agentic architectures in runnable Jupyter notebooks. Progressive from foundational to advanced. | Study all major agent architecture patterns. |

---

## 3. AI CHATBOT PRODUCTION SYSTEMS

### Customer Support Systems

| Repository | Description | Why Relevant |
|---|---|---|
| [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | Open-source live-chat, email support, omni-channel desk. Alternative to Intercom/Zendesk. Includes "Captain" AI agent for automated responses. | **Production-grade** customer support platform. Study for omni-channel architecture. |
| [ChatFAQ/ChatFAQ](https://github.com/ChatFAQ/ChatFAQ) | Open-source ecosystem for RAG-based conversational solutions with Admin Dashboard for managing knowledge bases, LLMs, retrievers. | Study for FAQ chatbot with admin panel architecture. |
| [gpt-open/rag-gpt](https://github.com/gpt-open/rag-gpt) | Intelligent customer service with Flask + LLM + RAG. Supports websites, URLs, local files as knowledge base. | Study for quick customer service RAG deployment. |
| [gpt-open/rag-gpt-admin](https://github.com/gpt-open/rag-gpt-admin) | Web-based admin interface for RAG-GPT. Knowledge base management, query monitoring, feedback tracking. | Study for admin panel design for AI chatbot systems. |

### WhatsApp AI Chatbots

| Repository | Description | Why Relevant |
|---|---|---|
| [wassengerhq/whatsapp-chatgpt-bot](https://github.com/wassengerhq/whatsapp-chatgpt-bot) | Ready-to-use multimodal ChatGPT WhatsApp bot. GPT-4o with text + audio + image input, audio responses, RAG + MCP support. | Most complete WhatsApp AI chatbot with multimodal support. |
| [yesbhautik/Whatsapp-Ai-BOT](https://github.com/yesbhautik/Whatsapp-Ai-BOT) | WhatsApp bot powered by ChatGPT, Playground & DALL-E. NodeJS-based. | Study for WhatsApp + OpenAI integration. |
| [yym68686/chatgpt-telegram-bot](https://github.com/yym68686/chatgpt-telegram-bot) | Multi-provider Telegram bot (GPT-5, DALL-E, Groq, Gemini, Claude). Plugins: search, URL summary, ArXiv, code interpreter. | Most feature-rich Telegram AI bot. |

### Telegram AI Chatbots

| Repository | Description | Why Relevant |
|---|---|---|
| [n3d1117/chatgpt-telegram-bot](https://github.com/n3d1117/chatgpt-telegram-bot) | Telegram bot with OpenAI ChatGPT, DALL-E, Whisper. Weather, Spotify, web search, TTS, and more. | Clean, well-maintained Telegram bot reference. |
| [yesbhautik/Master-AI-BOT](https://github.com/yesbhautik/Master-AI-BOT) | GPT-4 Turbo Telegram bot with special chat modes, group chat, DALL-E integration. | Study for group chat AI patterns. |
| [Sneh-T-Shah/telegram-ai-chatbot](https://github.com/Sneh-T-Shah/telegram-ai-chatbot) | Telegram channel chatbot with OpenAI API and RAG. Scrapes websites for knowledge base. | Study for channel-based AI with RAG. |

### Sales Chatbot Systems

| Repository | Description | Why Relevant |
|---|---|---|
| [shaadclt/Customer-Outreach-Campaign-crewAI](https://github.com/shaadclt/Customer-Outreach-Campaign-crewAI) | Sales outreach + lead profiling with CrewAI + LangChain. | Study for AI-powered sales automation. |
| [kaymen99/sales-outreach-automation-langgraph](https://github.com/kaymen99/sales-outreach-automation-langgraph) | Lead research, qualification, outreach with LangGraph + CRM integration. | Study for full sales pipeline automation. |

---

## 4. AI CONTENT GENERATION SYSTEMS

### Blog & SEO Content

| Repository | Description | Why Relevant |
|---|---|---|
| [Citedy/citedy-seo-agent](https://github.com/Citedy/citedy-seo-agent) | AI SEO content automation: trend scouting, competitor analysis, article generation in 55 languages, social media adaptations, cron-based sessions. | **Comprehensive** SEO content pipeline. Study for multi-language content automation. |
| [nickwinder/klaude-blog](https://github.com/nickwinder/klaude-blog) | AI-powered blog automation with Claude Code agents. Research, writing, SEO optimization, social media generation. | Study for Claude-based content workflow. |
| [jordan-jakisa/blog_post_writer](https://github.com/jordan-jakisa/blog_post_writer) | AI agent that writes SEO-optimized blog posts as formatted markdown. | Simple blog generation reference. |
| [JamesEBall/SEOArticlegenAI](https://github.com/JamesEBall/SEOArticlegenAI) | OpenAI-powered SEO article generator. Batch generation from CSV prompts. | Study for bulk content generation patterns. |
| [nooqta/ai-content](https://github.com/nooqta/ai-content) | AI content generator with Next.js + Contentlayer + Tailwind + MDX. | Study for Next.js content generation UI. |
| [AJaySi/ALwrity](https://github.com/AJaySi/ALwrity) | ALwrity - AI Digital Marketing Platform (WIP). | Study for comprehensive AI marketing platform design. |

### Social Media Content Automation

| Repository | Description | Why Relevant |
|---|---|---|
| [Citedy/citedy-seo-agent](https://github.com/Citedy/citedy-seo-agent) | Adapts content for X, LinkedIn, Facebook, Reddit, Threads, Instagram, YouTube Shorts, Shopify. | Multi-platform social media content adaptation. |
| [naqashafzal/AI-Content-Studio](https://github.com/naqashafzal/AI-Content-Studio) | All-in-one: topic research, scriptwriting, voice generation, video creation, thumbnails, captions, YouTube + Facebook publishing. | End-to-end content automation pipeline. |

### Video Script Generation

| Repository | Description | Why Relevant |
|---|---|---|
| [HKUDS/ViMax](https://github.com/HKUDS/ViMax) | Multi-agent video framework: Director, Screenwriter, Producer, Video Generator all-in-one. RAG-based long script design. | Most sophisticated video generation pipeline. |
| [prakashdk/video-creator](https://github.com/prakashdk/video-creator) | Fully offline pipeline: script generation, TTS, image generation, subtitles, video assembly with background music. | Study for offline video creation pipeline. |
| [SamurAIGPT/AI-Faceless-Video-Generator](https://github.com/SamurAIGPT/AI-Faceless-Video-Generator) | Generate video script, voice, and talking face completely with AI. | Study for faceless video generation. |
| [khaoss85/youtube-autopilot](https://github.com/khaoss85/youtube-autopilot) | End-to-end YouTube automation: trend detection, multi-agent editorial, AI video generation (Veo), scheduled publishing. | Study for fully automated YouTube channel. |
| [Hritikraj8804/Autotube](https://github.com/Hritikraj8804/Autotube) | Automated YouTube Shorts: n8n + AI script generation + video processing. Docker-based, self-hosted. | Study for n8n-based video automation. |
| [rushindrasinha/youtube-shorts-pipeline](https://github.com/rushindrasinha/youtube-shorts-pipeline) | News to script to AI visuals to voiceover to captions to upload. ~3 min, ~$0.11/video. | Study for cost-efficient video pipeline. |
| [SamurAIGPT/AI-Youtube-Shorts-Generator](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator) | Turn long-form videos into viral 9:16 shorts using LLM highlight detection + Whisper. | Study for video repurposing pipeline. |

---

## 5. AWESOME LISTS FOR AI SYSTEMS

| Repository | Stars (approx.) | Description | Why Relevant |
|---|---|---|---|
| [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | **60K+** | 100+ production-ready AI Agents, RAG, Multi-Agent teams, Voice Agents, MCP, LLM apps with tutorials. Every template self-contained with full source code. | **#1 practical LLM resource.** Clone-and-run templates for nearly every AI pattern. |
| [kyrolabs/awesome-agents](https://github.com/kyrolabs/awesome-agents) | High | Curated list of open-source AI agent tools and products. | Discover agent frameworks and tools. |
| [slavakurilyak/awesome-ai-agents](https://github.com/slavakurilyak/awesome-ai-agents) | High | 300+ agentic AI resources with star counts for each project. | Comprehensive agent landscape overview. |
| [jim-schwoebel/awesome_ai_agents](https://github.com/jim-schwoebel/awesome_ai_agents) | High | 1,500+ resources and tools related to AI agents. | Largest agent resource collection. |
| [eudk/awesome-ai-tools](https://github.com/eudk/awesome-ai-tools) | High | Very large AI tool list, updated 2026. | General AI tools discovery. |
| [sarat9/awesome-ai-saas](https://github.com/sarat9/awesome-ai-saas) | Medium | List of handy AI/GPT tools and apps for everyday life. | Discover AI SaaS product ideas. |
| [steven2358/awesome-generative-ai](https://github.com/steven2358/awesome-generative-ai) | High | Curated list of modern generative AI projects and services. | Generative AI landscape. |
| [jihoo-kim/awesome-production-llm](https://github.com/jihoo-kim/awesome-production-llm) | Medium | Curated list of open-source libraries for production LLM. | Production LLM tooling. |
| [InftyAI/Awesome-LLMOps](https://github.com/InftyAI/Awesome-LLMOps) | High | Curated list of best LLMOps tools. | LLMOps tooling landscape. |
| [icefort-ai/awesome-llm-webapps](https://github.com/icefort-ai/awesome-llm-webapps) | Medium | Open source, actively maintained web apps for LLM applications. | LLM web app references. |
| [WangRongsheng/awesome-LLM-resources](https://github.com/WangRongsheng/awesome-LLM-resources) | High | World's best LLM resources: multimodal, agents, coding, data processing, model training/inference, MCP, SLMs. | Comprehensive LLM resource hub. |
| [alvinreal/awesome-opensource-ai](https://github.com/alvinreal/awesome-opensource-ai) | Medium | Curated list of truly open-source AI projects, models, tools, infrastructure. | Open-source AI discovery. |
| [kaushikb11/awesome-llm-agents](https://github.com/kaushikb11/awesome-llm-agents) | Medium | Curated list of LLM agent frameworks. | Agent framework comparison. |

### Marketing-Specific Awesome Lists

| Repository | Description | Why Relevant |
|---|---|---|
| [alternbits/awesome-ai-marketing](https://github.com/alternbits/awesome-ai-marketing) | Curated list of top AI tools for marketing (Sendinblue, LeadGenius, Jasper, etc.). | Discover AI marketing tools for integration/inspiration. |
| [jmedia65/awesome-ai-marketing](https://github.com/jmedia65/awesome-ai-marketing) | AI marketing tools organized by function with honest context on when each works. | Practical marketing tool recommendations. |
| [LLMbreaker/awesome-ai-sales-tools](https://github.com/LLMbreaker/awesome-ai-sales-tools) | AI tools for sales automation, LinkedIn outreach, cold email, B2B lead generation. | Sales automation tool discovery. |
| [best-of-ai/awesome-ai-seo](https://github.com/best-of-ai/awesome-ai-seo) | Curated list of AI SEO tools and resources. | SEO tool landscape. |
| [marketingtoolslist/awesome-marketing](https://github.com/marketingtoolslist/awesome-marketing) | Marketing tools, books, blogs, podcasts, resources. | Broad marketing resource collection. |

---

## 6. BOILERPLATE / STARTER KITS

### AI SaaS Starters (with Auth + Stripe + Admin)

| Repository | Description | Why Relevant |
|---|---|---|
| [wyattm14/chatbot-template](https://github.com/wyattm14/chatbot-template) | Chatbot in 2 minutes with Supabase Auth + Stripe fully integrated. Next.js, React, TypeScript, Tailwind. | **Best chatbot SaaS starter.** Auth + billing + chat in one template. |
| [jirhegg/ai-saas-starter-kit](https://github.com/jirhegg/ai-saas-starter-kit) | AI-powered document search + chatbot SaaS. Next.js, React, multi-LLM support. | Study for document AI SaaS architecture. |
| [mickasmt/next-saas-stripe-starter](https://github.com/mickasmt/next-saas-stripe-starter) | SaaS with User Roles & Admin Panel. Next.js 14, Prisma, Neon, Auth.js v5, Stripe, Shadcn/ui. | Study for role-based SaaS with admin panel. |
| [nextjs/saas-starter](https://github.com/nextjs/saas-starter) | Official Next.js SaaS starter with Postgres, Stripe, shadcn/ui. | Minimal official SaaS starter. |
| [michaelshimeles/nextjs-starter-kit](https://github.com/michaelshimeles/nextjs-starter-kit) | Ultimate Next.js starter with AI chat interface, file upload, subscription management. | Study for AI-integrated SaaS starter. |
| [adrianhajdin/saas-template](https://github.com/adrianhajdin/saas-template) | Next.js + Supabase + Clerk. Auth, subscriptions, payments out of the box. | Study for Clerk-based auth patterns. |
| [ayusshrathore/ai-saas](https://github.com/ayusshrathore/ai-saas) | AI SaaS platform: chat, image/video/music generation. Next.js, OpenAI, Replicate, Prisma, Stripe. | Study for multi-capability AI SaaS. |

### Next.js + Supabase Starters

| Repository | Description | Why Relevant |
|---|---|---|
| [Saas-Starter-Kit/Saas-Kit-supabase](https://github.com/Saas-Starter-Kit/Saas-Kit-supabase) | Modern SaaS boilerplate with React, Next.js, TypeScript, Tailwind, Shadcn, Stripe, Supabase. | Comprehensive Supabase SaaS boilerplate. |
| [imbhargav5/nextbase-nextjs-supabase-starter](https://github.com/imbhargav5/nextbase-nextjs-supabase-starter) | Next.js 16 + Supabase boilerplate. TypeScript, Tailwind CSS 4, ESLint, Prettier, Jest, Playwright. | Study for testing-ready Next.js + Supabase setup. |
| [makerkit/nextjs-saas-starter-kit-lite](https://github.com/makerkit/nextjs-saas-starter-kit-lite) | Lite Makerkit SaaS with Supabase, i18next, Turborepo. | Study for internationalized SaaS (relevant for Vietnamese). |

### Monorepo Templates

| Repository | Description | Why Relevant |
|---|---|---|
| [john-data-chen/turborepo-starter-kit](https://github.com/john-data-chen/turborepo-starter-kit) | Production-grade multi-platform monorepo with shared business logic. pnpm + Turborepo. | Study for monorepo architecture with AI. |
| [jkomyno/pnpm-monorepo-template](https://github.com/jkomyno/pnpm-monorepo-template) | Opinionated Node.js monorepo with pnpm, turborepo, vitest. | Clean monorepo reference. |
| [giovacalle/monorepo-starter](https://github.com/giovacalle/monorepo-starter) | Turborepo template with SvelteKit apps + API services + shared configs. | Study for multi-app monorepo patterns. |

### Python AI Backend Starters

| Repository | Description | Why Relevant |
|---|---|---|
| [fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template) | Official FastAPI full-stack: React, SQLModel, PostgreSQL, Docker, GitHub Actions, HTTPS. | Foundation for any Python AI backend. |
| [Aeternalis-Ingenium/FastAPI-Backend-Template](https://github.com/Aeternalis-Ingenium/FastAPI-Backend-Template) | FastAPI + PostgreSQL + async SQLAlchemy 2.0 + Alembic + Docker. | Study for async Python backend patterns. |

---

## 7. LEARNING REPOSITORIES

### System Design for AI Applications

| Repository | Description | Why Relevant |
|---|---|---|
| [gtzheng/Awesome-Agentic-System-Design](https://github.com/gtzheng/Awesome-Agentic-System-Design) | Resources for designing, evaluating, deploying agentic AI systems. Includes Databricks, OpenAI, Anthropic, MongoDB design patterns. | **Essential reading** for AI system architecture. |
| [lakshmanok/generative-ai-design-patterns](https://github.com/lakshmanok/generative-ai-design-patterns) | Catalog of design patterns for generative AI applications. Companion to O'Reilly ML Design Patterns book. | Study for GenAI application architecture patterns. |
| [ai-standards/ai-design-patterns](https://github.com/ai-standards/ai-design-patterns) | Open catalog: ACV (Agent/Controller/View), Tool Adapter, Sandbox-First, Fallback Chain patterns. | Named patterns for AI system components. |
| [FareedKhan-dev/all-agentic-architectures](https://github.com/FareedKhan-dev/all-agentic-architectures) | 17+ agentic architectures implemented end-to-end in Jupyter notebooks. Progressive difficulty. | **Hands-on** study of every major agent pattern. |
| [mercari/ml-system-design-pattern](https://github.com/mercari/ml-system-design-pattern) | System design patterns for ML training, serving, and operations in production. | Study for ML ops patterns. |
| [arunpshankar/Python-Design-Patterns-for-AI](https://github.com/arunpshankar/Python-Design-Patterns-for-AI) | Python design patterns adapted for AI workflows. | Study for clean AI code architecture. |

### AI Engineering Best Practices

| Repository | Description | Why Relevant |
|---|---|---|
| [patchy631/ai-engineering-hub](https://github.com/patchy631/ai-engineering-hub) | In-depth tutorials on LLMs, RAGs, and real-world AI agent applications. | Practical AI engineering tutorials. |
| [alirezadir/Production-Level-Deep-Learning](https://github.com/alirezadir/Production-Level-Deep-Learning) | Guideline for production-level DL systems. Covers data pipelines, Flask/uWSGI/Nginx serving, Docker/K8s, end-to-end MLOps. | Study for production ML deployment patterns. |
| [SE-ML/awesome-seml](https://github.com/SE-ML/awesome-seml) | Software engineering best practices for ML applications. | Study for ML software engineering standards. |
| [rohitg00/ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch) | Learn it. Build it. Ship it for others. | Beginner-to-production AI engineering guide. |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Production-grade engineering skills for AI coding agents. Structured workflows for specs, testing, review, shipping. | Study for production-quality AI agent code. |

### Comprehensive Learning

| Repository | Description | Why Relevant |
|---|---|---|
| [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | 100+ self-contained LLM app templates with full tutorials. | Best hands-on learning resource for LLM apps. |
| [dipanjanS/mastering-intelligent-agents-langgraph-workshop-dhs2025](https://github.com/dipanjanS/mastering-intelligent-agents-langgraph-workshop-dhs2025) | Full-day workshop notebooks: prompting to tool-use to multi-agent to deployment. | Comprehensive LangGraph learning path. |
| [victordibia/designing-multiagent-systems](https://github.com/victordibia/designing-multiagent-systems) | Book: "Designing Multi-Agent Systems: Principles, Patterns, and Implementation." | Theoretical + practical multi-agent knowledge. |
| [jkmaina/LangGraphProjects](https://github.com/jkmaina/LangGraphProjects) | 50+ AI agents for business success with LangGraph. | Large collection of business-oriented agent examples. |

---

## 8. VIETNAMESE / SEA MARKET REPOS

| Repository | Description | Why Relevant |
|---|---|---|
| [undertheseanlp/underthesea](https://github.com/undertheseanlp/underthesea) | **Underthesea** - Vietnamese NLP Toolkit. Sentence/word segmentation, POS tagging, NER, text classification, sentiment analysis, dependency parsing. Now includes conversational AI agent with OpenAI support. | **Essential** for any Vietnamese language AI processing. |
| [undertheseanlp/chatbot](https://github.com/undertheseanlp/chatbot) | Vietnamese Chatbot by the underthesea NLP research group. | Study for Vietnamese-specific chatbot patterns. |
| [undertheseanlp/NLP-Vietnamese-progress](https://github.com/undertheseanlp/NLP-Vietnamese-progress) | Tracks progress in Vietnamese NLP: datasets, state-of-the-art solutions for common Vietnamese NLP tasks. | Benchmarks and datasets for Vietnamese NLP. |
| [mailong25/bert-vietnamese-question-answering](https://github.com/mailong25/bert-vietnamese-question-answering) | Vietnamese question answering system with BERT. | Study for Vietnamese QA implementation. |
| [namnv1113/Nanibot_ZaloAIChallenge2019_VietnameseWikiQA](https://github.com/namnv1113/Nanibot_ZaloAIChallenge2019_VietnameseWikiQA) | Zalo AI Challenge 2019 - Vietnamese Wikipedia Question Answering. F1 score 79.15%. | Study for Zalo AI competition approaches. |

---

## 9. N8N AI AUTOMATION WORKFLOW COLLECTIONS

| Repository | Description | Why Relevant |
|---|---|---|
| [oxbshw/ultimate-n8n-ai-workflows](https://github.com/oxbshw/ultimate-n8n-ai-workflows) | **3,400+** n8n AI workflows. Largest high-quality collection. | Massive workflow library. Search for specific use cases. |
| [enescingoz/awesome-n8n-templates](https://github.com/enescingoz/awesome-n8n-templates) | 280+ free templates: Gmail, Telegram, Slack, Discord, WhatsApp, OpenAI, RAG chatbots, email automation, social media. | Well-organized, categorized templates. |
| [wassupjay/n8n-free-templates](https://github.com/wassupjay/n8n-free-templates) | 200+ plug-and-play workflows fusing automation with AI stack (vector DBs, embeddings, LLMs). Import JSON and activate. | Production-ready AI-enhanced workflows. |
| [Danitilahun/n8n-workflow-templates](https://github.com/Danitilahun/n8n-workflow-templates) | 2,053 workflows with lightning-fast documentation system (search, analysis, browsing). | Large collection with good documentation. |
| [tannu64/n8n-automation-2025-AI-Agent-Suite](https://github.com/tannu64/n8n-automation-2025-AI-Agent-Suite) | AI agents, RAG systems, enterprise workflows. Gmail, WhatsApp, Telegram, Slack integrations. | Enterprise-focused n8n AI workflows. |
| [lucaswalter/n8n-ai-automations](https://github.com/lucaswalter/n8n-ai-automations) | n8n workflows + AI automations from The Recap AI YouTube channel. | Video-accompanied n8n learning resource. |

---

## 10. CHAT WIDGETS & EMBEDDABLE SYSTEMS

| Repository | Description | Why Relevant |
|---|---|---|
| [Hexastack/Hexabot](https://github.com/Hexastack/Hexabot) | Open-source AI chatbot/agent builder. React/Next.js admin panel, multi-channel, multilingual, embeddable live chat widget. | **Most complete** open-source chatbot builder with admin + widget. |
| [ConvoStack/convostack](https://github.com/ConvoStack/convostack) | Plug-and-play embeddable AI chatbot widget + backend deployment framework. | Study for embeddable chat architecture. |
| [opencx-labs/OpenChat](https://github.com/opencx-labs/OpenChat) | LLM custom-chatbots console. Embed chatbots as widgets on websites or internal tools. | Study for chatbot management console design. |
| [taylorwilsdon/open-webui-embeddable-widget](https://github.com/taylorwilsdon/open-webui-embeddable-widget) | Lightweight embedded Open WebUI widget for RAG workflows in existing apps. Few lines of code. | Study for minimal chat widget embedding. |
| [buildship-ai/buildship-chat-widget](https://github.com/rowyio/buildship-chat-widget) | AI Chat Widget connecting to OpenAI Assistant, databases, tools. | Study for assistant-connected widget. |

---

## 11. AI EMAIL & OUTREACH SYSTEMS

| Repository | Description | Why Relevant |
|---|---|---|
| [hasnaintypes/sendable-ai](https://github.com/hasnaintypes/sendable-ai) | Research-first AI email outreach engine. Next.js + Convex + Gemini. Audience research, intent-based generation, multi-step follow-ups. | **Best full-stack** email outreach system. Study for Next.js + AI outreach architecture. |
| [kaymen99/sales-outreach-automation-langgraph](https://github.com/kaymen99/sales-outreach-automation-langgraph) | Lead research + qualification + outreach with LangGraph. HubSpot, Airtable, Google Sheets CRM integration. | Study for CRM-integrated outreach automation. |
| [nikhil-ai-insights/daily-hr-referral-cold-email-system-v2](https://github.com/nikhil-ai-insights/daily-hr-referral-cold-email-system-v2) | n8n workflow for personalized cold email. Google Sheets contacts, AI agent email generation, Gmail sending with rate limiting. | Study for n8n-based email automation. |
| [PaulleDemon/Email-automation](https://github.com/PaulleDemon/Email-automation) | Open-source cold email outreach tool. | Simple email automation reference. |
| [KrishBakshi/AutoMailAI](https://github.com/KrishBakshi/AutoMailAI) | Automates cold emails for jobs, internships, sales using Gemini 2.0 Flash. Auto-draft in Gmail. | Study for Gemini-based email generation. |

---

## 12. VIDEO SCRIPT & CONTENT AUTOMATION

(See Section 4 for detailed video generation repos)

---

## TOP 20 MUST-STUDY REPOSITORIES (Priority Order)

These are the highest-value repos to study for building a production AI system:

| # | Repository | Why It's #1 Priority |
|---|---|---|
| 1 | [langgenius/dify](https://github.com/langgenius/dify) | 129K+ stars. The complete reference for building an AI platform: workflows, RAG, agents, multi-model, observability. |
| 2 | [Shubhamsaboo/awesome-llm-apps](https://github.com/Shubhamsaboo/awesome-llm-apps) | 60K+ stars. 100+ runnable AI app templates. Best learning-by-doing resource. |
| 3 | [vercel/chatbot](https://github.com/vercel/chatbot) | Official Vercel AI chatbot. Gold standard for Next.js + AI SDK patterns. |
| 4 | [wassim249/fastapi-langgraph-agent-production-ready-template](https://github.com/wassim249/fastapi-langgraph-agent-production-ready-template) | Best production Python AI backend template with every enterprise feature. |
| 5 | [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) | 50K+ stars. Core multi-agent framework. Study for agent orchestration. |
| 6 | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) | Core stateful agent framework. Essential for complex agent workflows. |
| 7 | [danny-avila/LibreChat](https://github.com/danny-avila/LibreChat) | Most complete ChatGPT alternative. Multi-provider, plugins, MCP. |
| 8 | [open-webui/open-webui](https://github.com/open-webui/open-webui) | Self-hosted AI platform. Study for offline-capable AI chat architecture. |
| 9 | [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | Production customer support platform. Study for omni-channel architecture. |
| 10 | [deepset-ai/haystack](https://github.com/deepset-ai/haystack) | Enterprise RAG framework. Production patterns for document retrieval. |
| 11 | [Hexastack/Hexabot](https://github.com/Hexastack/Hexabot) | Best open-source chatbot builder with admin panel + embeddable widget. |
| 12 | [ChatFAQ/ChatFAQ](https://github.com/ChatFAQ/ChatFAQ) | FAQ chatbot with RAG + admin dashboard for knowledge base management. |
| 13 | [FareedKhan-dev/all-agentic-architectures](https://github.com/FareedKhan-dev/all-agentic-architectures) | 17+ agent architectures implemented. Best architecture learning resource. |
| 14 | [gtzheng/Awesome-Agentic-System-Design](https://github.com/gtzheng/Awesome-Agentic-System-Design) | AI system design patterns from Databricks, OpenAI, Anthropic, MongoDB. |
| 15 | [crewAIInc/crewAI-examples](https://github.com/crewAIInc/crewAI-examples) | Official CrewAI examples including marketing_strategy crew. |
| 16 | [kaymen99/sales-outreach-automation-langgraph](https://github.com/kaymen99/sales-outreach-automation-langgraph) | Sales automation with LangGraph + CRM integration. Directly relevant. |
| 17 | [undertheseanlp/underthesea](https://github.com/undertheseanlp/underthesea) | Essential for Vietnamese NLP processing. |
| 18 | [oxbshw/ultimate-n8n-ai-workflows](https://github.com/oxbshw/ultimate-n8n-ai-workflows) | 3,400+ n8n AI workflows for automation reference. |
| 19 | [wyattm14/chatbot-template](https://github.com/wyattm14/chatbot-template) | Chatbot SaaS starter with auth + Stripe. Quick launch template. |
| 20 | [Citedy/citedy-seo-agent](https://github.com/Citedy/citedy-seo-agent) | SEO content automation in 55 languages with social media adaptation. |

---

## SUMMARY STATISTICS

- **Total unique repositories cataloged:** 120+
- **Awesome/curated lists:** 20+
- **Full-stack application references:** 25+
- **Multi-agent implementations:** 15+
- **Chatbot systems (WhatsApp/Telegram/Web):** 20+
- **Content generation pipelines:** 15+
- **SaaS starter kits:** 12+
- **Vietnamese/SEA specific:** 5+
- **n8n workflow collections:** 6+ (totaling 6,000+ workflows)
- **Learning/architecture repos:** 12+

---

*Research conducted May 2026 via comprehensive web search.*
