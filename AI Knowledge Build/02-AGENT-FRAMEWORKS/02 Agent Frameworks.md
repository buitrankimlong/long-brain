---
tags: [MOC, agent-frameworks, langgraph, crewai]
description: Agent frameworks - LangChain, CrewAI, LangGraph, OpenAI, Google ADK
updated: 2026-05-09
---

# 02 Agent Frameworks

## Knowledge Files (duc ket tu source code)
- [[LangGraph-Code-Knowledge]] - StateGraph, nodes, edges, checkpointing
- [[CrewAI-Examples-Knowledge]] - 16 crews, marketing_strategy, 7 patterns
- [[OpenAI-Agents-Knowledge]] - Agents, Handoffs, Guardrails, Tools
- [[Google-ADK-Knowledge]] - Agent class, A2A native, MCP integration
- [[Mastra-Knowledge]] - TypeScript agents, workflows, RAG, tools
- [[Vercel-AI-SDK-Knowledge]] - AI SDK 6, streaming, tools, providers
- [[LangChain-Academy-Knowledge]] - Official LangChain courses
- [[Deep-Agents-Knowledge]] - Advanced agent patterns tu scratch

## So sanh nhanh
| Framework | Khi dung | Ngon ngu |
|-----------|---------|----------|
| LangGraph | Production, complex stateful | Python/TS |
| CrewAI | Fast prototype, role-based teams | Python |
| OpenAI SDK | Clean handoffs, guardrails | Python/TS |
| Google ADK | A2A native, Google ecosystem | Multi |
| Mastra | TypeScript projects | TypeScript |
| Vercel AI SDK | Next.js frontend streaming | TypeScript |

## Multi-Agent Patterns
1. Supervisor (1 dieu phoi nhieu agent)
2. Pipeline (tuan tu)
3. Fan-out/Fan-in (song song)
4. Specialist (chuyen mon rieng)
5. Validation Chain (Producer + Reviewer)
6. Self-Evaluation Loop (tu danh gia + retry)

## Repos
`langgraph/` | `openai-agents-python/` | `adk-python/` | `mastra/` | `ai/` (Vercel) | `crewAI-examples/`

## Lien ket
-> [[01 Nen Tang AI]] | [[14 Claude Code]] | [[03 Mo Hinh LLM]] | [[Dashboard]]
