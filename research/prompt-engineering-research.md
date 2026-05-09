# Comprehensive Prompt Engineering Research
## Libraries, Templates, Frameworks & Best Practices for Business Use Cases
### Research Date: May 2026

---

# TABLE OF CONTENTS

1. [Prompt Libraries (GitHub)](#1-prompt-libraries-github)
2. [System Prompt Engineering](#2-system-prompt-engineering)
3. [Prompt Frameworks & Techniques](#3-prompt-frameworks--techniques)
4. [Prompt Templates for Specific Tasks](#4-prompt-templates-for-specific-tasks)
5. [Prompt Management & Versioning](#5-prompt-management--versioning)
6. [Vietnamese Language Prompts](#6-vietnamese-language-prompts)

---

# 1. PROMPT LIBRARIES (GitHub)

## 1.1 Major Open-Source Prompt Collections

### awesome-chatgpt-prompts (f/prompts.chat) - 143k+ Stars
- **Repo**: https://github.com/f/prompts.chat
- **Website**: https://prompts.chat
- **Description**: The world's largest open-source prompt library for AI. Works with ChatGPT, Claude, Gemini, Llama, Mistral, and more. Featured in Forbes and referenced by Harvard and Columbia.
- **Use Cases**: Role-based prompts (act as a marketer, developer, translator, etc.), creative writing, coding, business scenarios
- **Format**: Each prompt defines a role + instructions. Community-contributed and regularly updated.

### ai-boost/awesome-prompts
- **Repo**: https://github.com/ai-boost/awesome-prompts
- **Description**: Curated list of chatgpt prompts from top-rated GPTs in the GPTs Store. Includes prompt engineering, prompt attack & prompt protect techniques, plus advanced prompt engineering papers.
- **Business Prompts Include**:
  - Senior equity analyst prompt (business model assessment, financial health, competitive moat, valuation)
  - Market research director prompt (market sizing and GTM recommendations)

### promptslab/Awesome-Prompt-Engineering
- **Repo**: https://github.com/promptslab/awesome-prompt-engineering
- **Description**: Hand-curated resources for Prompt Engineering with a focus on GPT, ChatGPT, PaLM, etc. Comprehensive academic and practical resource list.

### dair-ai/Prompt-Engineering-Guide - The Gold Standard
- **Repo**: https://github.com/dair-ai/Prompt-Engineering-Guide
- **Website**: https://www.promptingguide.ai
- **Description**: The most comprehensive prompt engineering guide available. Includes guides, papers, lessons, notebooks, and resources for prompt engineering, context engineering, RAG, and AI Agents. Covers 18+ distinct techniques with research backing.
- **Techniques Covered**: Zero-shot, Few-shot, Chain-of-Thought, Meta Prompting, Self-Consistency, Generate Knowledge, Prompt Chaining, Tree of Thoughts, RAG, Automatic Reasoning and Tool-use, Automatic Prompt Engineer, Active-Prompt, Directional Stimulus, Program-Aided Language Models, ReAct, Reflexion, Multimodal CoT, Graph Prompting

### sankyn1/awesome-chatgpt-prompts
- **Repo**: https://github.com/sankyn1/awesome-chatgpt-prompts
- **Description**: Updated daily with unique prompts for SEO, business, developing, writing, education, and marketing.

## 1.2 System Prompt Leaks & Collections (For Learning)

### asgeirtj/system_prompts_leaks
- **Repo**: https://github.com/asgeirtj/system_prompts_leaks
- **Description**: Extracted system prompts from ChatGPT (GPT-5.5 Thinking), Claude (Opus 4.7, Opus 4.6, Sonnet 4.6, Claude Code), Gemini (3.1 Pro, 3 Flash, Gemini CLI), Grok (4.3 beta), Perplexity, and more. Updated regularly.
- **Why Useful**: Study how industry-leading AI products structure their system prompts for production use.

### Piebald-AI/claude-code-system-prompts
- **Repo**: https://github.com/Piebald-AI/claude-code-system-prompts
- **Description**: All parts of Claude Code's system prompt: 24 builtin tool descriptions, sub agent prompts (Plan/Explore/Task), utility prompts. Updated for each Claude Code version (v2.1.133 as of May 2026).

### elder-plinius/CL4R1T4S
- **Repo**: https://github.com/elder-plinius/CL4R1T4S
- **Description**: Leaked system prompts for ChatGPT, Claude, Gemini, Grok, Perplexity, Cursor, Lovable, Replit, and more. Focused on AI systems transparency.

### x1xhlol/system-prompts-and-models-of-ai-tools
- **Repo**: https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools
- **Description**: Full system prompts for Augment Code, Claude Code, Cursor, Devin AI, Junie, Kiro, Lovable, Manus, NotionAI, Perplexity, Replit, Same.dev, Trae, Windsurf, Xcode, v0, and more.

## 1.3 Coding Prompt Collections

### baz-scm/awesome-reviewers
- **Repo**: https://github.com/baz-scm/awesome-reviewers
- **Description**: Ready-to-use system prompts for Agentic Code Review. Each prompt distilled from thousands of real code review comments in leading open source repositories.

### thibaultyou/prompt-blueprint
- **Repo**: https://github.com/thibaultyou/prompt-blueprint
- **Description**: Includes Anthropic best practices guides and structured prompt templates for development workflows.

### anthropics/prompt-eng-interactive-tutorial
- **Repo**: https://github.com/anthropics/prompt-eng-interactive-tutorial
- **Description**: Anthropic's official Interactive Prompt Engineering Tutorial with hands-on Jupyter notebooks.

---

# 2. SYSTEM PROMPT ENGINEERING

## 2.1 How to Write Effective System Prompts for Chatbots

### Core Structure (Contract-Style Format)
Based on 2026 best practices, an effective system prompt should include:

```
ROLE: Define who the AI is (e.g., "You are a senior marketing strategist...")
GOAL: What the AI should accomplish in the conversation
CONTEXT: Background information, company details, knowledge base references
CONSTRAINTS: What the AI should NOT do, boundaries, limitations
UNCERTAINTY RULE: How to handle questions outside its knowledge
OUTPUT FORMAT: Expected response structure (bullet points, JSON, markdown, etc.)
TONE: Communication style (professional, friendly, casual, etc.)
EXAMPLES: 2-5 input/output examples for consistency
```

### Key Best Practices (2026)

1. **Structure beats length** - Write success criteria and an output contract rather than long rambling prompts
2. **Define clear roles and tone** - Assign a persona to frame the conversation
3. **Use few-shot learning** - Include 2-5 well-crafted examples in `<example>` tags
4. **Strategic prompt placement** - Critical information should be at the beginning or end of the context window, not buried in the middle
5. **Be explicit about constraints** - Tell the AI what it CANNOT do, as "an agent that doesn't understand its constraints will improvise in unexpected directions"
6. **Use XML tags** (for Claude) - Separate sections with `<thinking>`, `<answer>`, `<context>`, etc.

### Official References
- **Anthropic Claude**: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- **OpenAI**: https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt
- **Google Cloud**: https://cloud.google.com/discover/what-is-prompt-engineering

## 2.2 System Prompt for Sales Chatbot

```
ROLE: You are [Chatbot Name], the lead generation and sales assistant for [Company Name].

GOAL: Engage website visitors, qualify leads, and guide them toward a purchase or booking a demo.

TASKS:
- Greet visitors with a personalized welcome message
- Qualify leads by collecting: Contact details, Needs, Goals, Budget, Timeline
- Present relevant products/services based on expressed needs
- Handle objections using the company's value propositions
- Guide qualified leads to schedule a demo or make a purchase
- Escalate complex inquiries to a human sales representative

TONE: Professional yet warm. Confident without being pushy. Solution-oriented.

CONSTRAINTS:
- Never make up pricing not in the knowledge base
- Never disparage competitors
- Never promise features that don't exist
- If unsure about a technical question, say "Let me connect you with a specialist"
- Do not share internal company information

KNOWLEDGE BASE: [Reference to product catalog, pricing, FAQs]

ESCALATION: If the lead scores above [threshold] or requests human contact,
provide the scheduling link: [URL]
```

## 2.3 System Prompt for Customer Support Bot

```
ROLE: You are [Chatbot Name], the AI customer support assistant at [Company Name].
You are helpful, professional, clever, and friendly.

GOAL: Assist users with anything related to [Company Name] products and services.
You are an expert in all things [Company Name], offering answers and guidance
based on the company's knowledge base.

BEHAVIOR:
- Ask clarifying questions when the issue is ambiguous
- Provide step-by-step troubleshooting for common issues
- Collect account email, project/order ID, and problem description for issue reports
- Anticipate customer needs by offering solutions to FAQs
- Show patience and understanding in all interactions

ESCALATION PROTOCOL:
- If the issue cannot be resolved: collect additional details and end with
  "Our support team will contact you within [timeframe]"
- For billing disputes: always escalate to human agent
- For safety concerns: escalate immediately

CONSTRAINTS:
- Only provide advice within the scope of [Company Name] products
- Never access, modify, or share customer personal data beyond what they provide
- Never make promises about refunds or compensation without authorization
- Reference ticket number: generate one in format [PREFIX-XXXXX]

OUTPUT FORMAT: Use short paragraphs. Use numbered steps for instructions.
Include relevant links from the knowledge base when available.
```

## 2.4 System Prompt for Marketing Content Generation

```
ROLE: You are a senior marketing content strategist with 15 years of experience
in digital marketing, SEO, and brand storytelling.

GOAL: Create compelling, on-brand marketing content that drives engagement
and conversions for [Company/Brand Name].

BRAND VOICE: [Describe: e.g., "Professional yet approachable. Uses data to
back claims. Avoids jargon. Speaks directly to the reader."]

TARGET AUDIENCE: [Define demographics, psychographics, pain points]

CONTENT GUIDELINES:
- Always lead with benefits, not features
- Include a clear call-to-action (CTA) in every piece
- Use the AIDA framework (Attention-Interest-Desire-Action) for persuasive copy
- Optimize for SEO when specified (include target keywords naturally)
- Maintain brand consistency across all content types
- Back claims with data points or examples when possible

OUTPUT REQUIREMENTS:
- Specify content type (blog post, social caption, email, ad copy)
- Include suggested headlines/subject lines (3 options minimum)
- Mark sections that need human review or brand-specific input with [REVIEW]
- Word count adherence within 10% of target

CONSTRAINTS:
- No unverified health or financial claims
- No competitor bashing
- Follow [industry] advertising regulations
```

## 2.5 System Prompt for Data Analysis

```
ROLE: You are a senior data analyst with expertise in business intelligence,
statistical analysis, and data visualization best practices.

GOAL: Analyze data, identify patterns and insights, and present findings
in clear, actionable terms for business stakeholders.

APPROACH:
1. First understand the business question being asked
2. Examine the data structure and quality
3. Apply appropriate analytical methods
4. Present findings with confidence levels
5. Recommend actionable next steps

OUTPUT FORMAT:
- Executive Summary (2-3 sentences)
- Key Findings (bullet points with supporting data)
- Methodology Notes (brief)
- Recommendations (prioritized, actionable)
- Caveats and Limitations

CONSTRAINTS:
- Distinguish between correlation and causation
- State confidence levels and sample size limitations
- Flag potential biases in the data
- Never fabricate data points or statistics
- If data is insufficient, say so and recommend what additional data is needed
```

## 2.6 Multi-Agent System Prompts

### Design Principles (2026)
Based on Google's Eight Essential Multi-Agent Design Patterns and current research:

**Architecture-First Approach**: Design the system as an architecture first, prompts second. Flow design has overtaken prompt tricks as the highest-leverage work.

**Core Multi-Agent Patterns**:

1. **Parallel Fan-Out/Gather**: A primary agent spawns parallel agents for specific tasks; outputs feed into a synthesizer agent that aggregates and approves/rejects decisions.

2. **Generator and Critic**: One agent creates content, another validates it and provides feedback for iterative refinement.

3. **Orchestrator Pattern**: A central agent routes tasks to specialized sub-agents based on intent classification.

**Example Orchestrator System Prompt**:
```
ROLE: You are the orchestrator agent for [System Name]. Your job is to:
1. Analyze the user's request
2. Determine which specialized agent(s) should handle it
3. Route the request with appropriate context
4. Synthesize responses from multiple agents if needed
5. Ensure quality and consistency of the final response

AVAILABLE AGENTS:
- ResearchAgent: For information gathering and fact-checking
- WriterAgent: For content creation and editing
- AnalystAgent: For data analysis and reporting
- CustomerAgent: For customer-facing interactions

ROUTING RULES:
- If request involves data: route to AnalystAgent first, then WriterAgent for formatting
- If request involves content creation: route to ResearchAgent for facts, then WriterAgent
- If request is customer-facing: always route through CustomerAgent for tone check
- For complex requests: use parallel routing and synthesize

CONSTRAINTS:
- Never skip the quality check step
- Always preserve context between agent handoffs
- Log all routing decisions for debugging
```

**Key Insight**: Each agent's system prompt should define both WHO the agent is AND what it explicitly CANNOT do. An agent without clear constraints will improvise unpredictably.

**References**:
- Google's Multi-Agent Design Patterns: https://www.infoq.com/news/2026/01/multi-agent-design-patterns/
- Sitepoint Agentic Design Patterns Guide: https://www.sitepoint.com/the-definitive-guide-to-agentic-design-patterns-in-2026/
- AI Agent Prompt Engineering Patterns: https://paxrel.com/blog-ai-agent-prompts

---

# 3. PROMPT FRAMEWORKS & TECHNIQUES

## 3.1 Chain of Thought (CoT)

**What**: Enables complex reasoning by prompting intermediate reasoning steps.
**When to Use**: Math problems, logic puzzles, multi-step analysis, complex decision-making.
**Key Insight**: LLMs' reasoning capabilities need to be "guided out" -- showing reasoning steps causes the model to mimic the "reason first, then answer" pattern.

**Zero-shot CoT** (simplest):
```
[Your question here]

Let's think step by step.
```

**Few-shot CoT** (with examples):
```
Q: A store has 50 apples. They sell 23 and receive a shipment of 15. How many do they have?
A: Let's think step by step.
- Started with 50 apples
- Sold 23: 50 - 23 = 27
- Received 15: 27 + 15 = 42
- The store has 42 apples.

Q: [Your actual question]
A: Let's think step by step.
```

**Guided CoT** (for Claude):
```
Think through this problem step by step:
1. First, identify the key variables
2. Then, determine the relationships between them
3. Apply the relevant formula or logic
4. Verify your answer

Use <thinking> tags for your reasoning and <answer> tags for the final result.
```

**Reference**: https://www.promptingguide.ai/techniques/cot

## 3.2 Tree of Thought (ToT)

**What**: Explores multiple reasoning paths simultaneously using a tree structure, evaluating and pruning branches.
**When to Use**: Creative problem solving, strategic planning, complex problems with multiple valid approaches, brainstorming.
**Key Difference from CoT**: CoT follows a single linear chain; ToT branches out and explores several paths simultaneously.

**How It Works**:
1. Generate multiple initial thoughts/approaches
2. Evaluate each branch for promise
3. Expand promising branches, prune dead ends
4. Uses BFS (breadth-first) or DFS (depth-first) search algorithms

**Prompt Template**:
```
I need to solve [problem]. Please explore this using a Tree of Thoughts approach:

Step 1: Generate 3 different initial approaches to this problem.
Step 2: For each approach, evaluate its feasibility (score 1-10) and identify key risks.
Step 3: For the top 2 approaches, develop them further with 2 sub-strategies each.
Step 4: Evaluate all sub-strategies and select the most promising path.
Step 5: Develop the winning strategy into a detailed plan.

Show your reasoning at each branching point.
```

**Limitations**: Not ideal for strict sequential reasoning (math, coding logic) where each step depends on the previous one.

**Reference**: https://www.promptingguide.ai/techniques/tot

## 3.3 ReAct (Reasoning + Acting)

**What**: Combines verbal reasoning traces with actions, enabling dynamic reasoning and interaction with external environments (tools, APIs, databases).
**When to Use**: Agent-based systems, tasks requiring external information, research tasks, tool-using AI.

**The ReAct Loop**:
```
Thought: [Reason about what to do next]
Action: [Take an action - search, calculate, API call]
Observation: [Result of the action]
Thought: [Reason about the observation]
Action: [Next action based on new information]
... (repeat until task complete)
Answer: [Final response]
```

**Best Practice**: Combine ReAct with CoT to use both internal knowledge AND external information during reasoning.

**Reference**: https://www.promptingguide.ai/techniques/react

## 3.4 Few-Shot Prompting

**What**: Provide 2-5 examples of desired input/output pairs to teach the model the pattern.
**When to Use**: Classification tasks, format-specific outputs, style matching, when zero-shot is insufficient.
**Best Practice**: 3-5 examples is the optimal cost-to-quality tradeoff.

**Template**:
```
Classify the following customer feedback as Positive, Negative, or Neutral.

Example 1:
Input: "The product arrived on time and works great!"
Output: Positive

Example 2:
Input: "Terrible experience. Product broke after one day."
Output: Negative

Example 3:
Input: "It's okay, nothing special but does the job."
Output: Neutral

Now classify:
Input: "[Customer's actual feedback]"
Output:
```

**Reference**: https://www.promptingguide.ai/techniques/fewshot

## 3.5 Zero-Shot Prompting

**What**: Give instructions with NO examples; rely on the model's training.
**When to Use**: Simple tasks, well-defined output formats, when you want speed over precision.
**Strategy**: Start with zero-shot. Add few-shot examples only if accuracy is insufficient.

**Example**:
```
Classify the following text into one of these categories: Sports, Politics, Technology, Entertainment.

Text: "The new quantum computing chip achieved 1000 qubit coherence..."
Category:
```

## 3.6 Self-Consistency Prompting

**What**: Generate multiple reasoning paths for the same problem, then select the most consistent (majority vote) answer.
**When to Use**: Math, logic, any task where accuracy is critical and the cost of multiple generations is acceptable.
**Performance**: Self-consistency on top of CoT boosted GSM8K math accuracy by +17.9% (Wang et al., Google Research).

**How to Apply**:
1. Run the same CoT prompt 5-10 times with temperature > 0
2. Collect all final answers
3. Take the majority vote answer
4. Cost tradeoff: 5-10x more tokens for significantly higher accuracy

**Reference**: https://www.promptingguide.ai/techniques/consistency

## 3.7 Prompt Chaining

**What**: Link multiple LLM calls together, using the output of one step as input for the next.
**When to Use**: Complex multi-step workflows, content pipelines, document processing, research tasks.

**Benefits**: Increases transparency, controllability, and reliability. Each step can be tested and debugged independently.

**Business Example - Content Creation Pipeline**:
```
Chain Step 1 (Research): "List the top 5 trends in [industry] for 2026 with brief descriptions."
     |
     v
Chain Step 2 (Outline): "Based on these trends, create a blog post outline targeting [audience]."
     |
     v
Chain Step 3 (Draft): "Write the full blog post following this outline. Target: 1500 words."
     |
     v
Chain Step 4 (Edit): "Review this blog post for clarity, SEO optimization, and brand voice alignment."
     |
     v
Chain Step 5 (Metadata): "Generate: title tag (60 chars), meta description (155 chars), 5 social media captions."
```

**Best Practices**:
- Define your goal and list steps to handle separately
- Design each prompt with specific instructions and output format details
- Test each prompt in your chain independently
- Include error handling between steps

**Reference**: https://www.promptingguide.ai/techniques/prompt_chaining
**AWS Guide**: https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/workflow-for-prompt-chaining.html

## 3.8 Meta-Prompting (Prompts That Generate Prompts)

**What**: A technique where prompts are used to generate, refine, or analyze OTHER prompts rather than directly answering questions.
**When to Use**: Automating prompt creation, optimizing existing prompts, creating prompt libraries at scale.

**Key Advantage**: Token efficiency -- focuses on structure rather than content, reducing token usage.

**Types**:
- **Standard Meta-Prompting**: Ask the AI to create a prompt for a specific task
- **Recursive Meta Prompting (RMP)**: AI generates and refines its own prompts in a self-improvement loop

**Template - Prompt Generator**:
```
You are a prompt engineering expert. Create an optimized prompt for the following task:

TASK: [Describe what you want the AI to do]
TARGET MODEL: [Claude/GPT-4/etc.]
OUTPUT FORMAT: [Desired format]
AUDIENCE: [Who will use this prompt]

Generate a production-ready prompt that includes:
1. Clear role definition
2. Specific instructions
3. Output format specification
4. 2-3 few-shot examples
5. Edge case handling
6. Constraints and guardrails

Also explain WHY you made each design choice.
```

**Reference**: https://www.promptingguide.ai/techniques/meta-prompting
**GitHub**: https://github.com/meta-prompting/meta-prompting

## 3.9 Constitutional AI Prompting

**What**: A method where the AI self-critiques and revises its responses according to a set of principles ("constitution").
**Origin**: Anthropic research paper (December 2022).
**When to Use**: Safety-critical applications, reducing harmful outputs, alignment.

**How It Works**:
1. AI generates an initial response
2. AI critiques its own response against constitutional principles
3. AI revises the response based on the critique
4. Process can repeat for further refinement

**Result**: Achieves harmlessness comparable to RLHF with ~80% less human feedback. Models are simultaneously more helpful AND less harmful.

**Practical Application** (Self-Critique Pattern):
```
First, respond to the user's question.
Then, review your response against these principles:
- Is it helpful and accurate?
- Could it cause harm if misused?
- Does it respect privacy and confidentiality?
- Is it fair and unbiased?

If any principle is violated, revise your response and explain the change.
```

**Reference**: https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback

## 3.10 Skeleton-of-Thought (SoT)

**What**: First creates a skeleton (outline) of the answer, then expands each point in parallel.
**When to Use**: Long-form content generation, reducing latency in real-time applications.

**Performance**: 2x+ speed improvement on 8 out of 12 models tested. In 60% of cases, quality equals or exceeds traditional methods.

**How It Works**:
1. **Skeleton Phase**: AI produces a structured outline (3-5 word bullet points)
2. **Expansion Phase**: Each outline point is expanded in detail (can be parallelized)

**Template**:
```
Step 1: Provide a skeleton outline for the answer to this question: [question]
Each point should be 3-5 words maximum.

Step 2: Now expand each skeleton point into a detailed paragraph.
```

**Limitations**: Not suitable for sequential reasoning tasks (math, coding) where each step builds on the previous one.

**Reference**: https://learnprompting.org/docs/advanced/decomposition/skeleton_of_thoughts

---

# 4. PROMPT TEMPLATES FOR SPECIFIC TASKS

## 4.1 Blog Post Generation

```
ROLE: You are a senior content writer specializing in [industry/niche].

TASK: Write a [word count]-word blog post about "[topic]".

TARGET AUDIENCE: [Demographics, knowledge level, pain points]
TARGET KEYWORD: [Primary SEO keyword]
SECONDARY KEYWORDS: [List 3-5]

STRUCTURE:
- Compelling headline (3 options)
- Hook/introduction (address a pain point)
- [Number] main sections with H2 headers
- Actionable takeaways in each section
- Real-world examples or data points
- Conclusion with clear CTA

TONE: [e.g., Professional but conversational, data-driven, authoritative]

SEO REQUIREMENTS:
- Include target keyword in H1, first paragraph, and 2-3 H2s
- Use natural keyword variations throughout
- Include internal link suggestions: [list existing content]
- Suggest meta title (60 chars) and meta description (155 chars)

DO NOT: Use filler phrases like "In today's digital landscape" or "It's no secret that"
```

## 4.2 Social Media Caption Generation

```
Create [number] [platform] captions for [product/service/topic].

TARGET AUDIENCE: [Demographics]
BRAND VOICE: [Description]

REQUIREMENTS PER CAPTION:
- Under [character limit] characters
- Include a question to drive comments
- End with a relevant call to action
- Include [number] relevant hashtags
- Emoji usage: [minimal/moderate/heavy]

STYLE: Increase "punchiness" and remove introductory fluff.

VARIATIONS:
1. Educational/informative angle
2. Behind-the-scenes/authentic angle
3. Problem/solution angle
4. Social proof/testimonial angle
5. Urgency/FOMO angle
```

## 4.3 Email Writing

```
TASK: Write a [type] email.
TYPE: [cold outreach / follow-up / newsletter / transactional / win-back]

CONTEXT:
- Sender: [Role at Company]
- Recipient: [Role, relationship, previous interactions]
- Goal: [What action should the reader take?]
- Key message: [Main point to communicate]

FORMAT:
- Subject line: 3 options (under 50 characters, curiosity-driven)
- Preview text: Under 90 characters
- Body: [word count] words maximum
- CTA: Clear, single action
- Signature: [format]

TONE: [Professional / casual / urgent / empathetic]

CONSTRAINTS:
- No jargon unless industry-specific
- Use the I/you ratio: more "you" than "I"
- Include specific value proposition within first 2 sentences
- Mobile-friendly formatting (short paragraphs)
```

## 4.4 SEO Content

```
Create SEO-optimized content for the keyword "[target keyword]".

SEARCH INTENT: [Informational / Transactional / Navigational / Commercial]
CURRENT RANKING: [If applicable]
COMPETITORS RANKING: [Top 3 competitor URLs for reference]

DELIVERABLES:
1. Title tag (under 60 characters, keyword-front-loaded)
2. Meta description (under 155 characters, includes CTA)
3. H1 headline (compelling, includes primary keyword)
4. Content outline with H2/H3 structure
5. FAQ section (5 questions targeting "People Also Ask")
6. Internal linking suggestions
7. Schema markup recommendations

CONTENT GUIDELINES:
- Word count: [target] words
- Keyword density: 1-2% for primary, 0.5-1% for secondary
- Include LSI keywords naturally
- Use short paragraphs (2-3 sentences max for readability)
- Add value beyond what competitors offer
```

## 4.5 Ad Copy Generation

```
Create [number] ad copy variations for [platform: Google/Facebook/LinkedIn/Instagram].

PRODUCT/SERVICE: [Description]
TARGET AUDIENCE: [Demographics, psychographics, pain points]
UNIQUE VALUE PROPOSITION: [Key differentiator]
OFFER: [Discount, free trial, limited time, etc.]

FRAMEWORK: Use [AIDA / PAS / StoryBrand] framework.

FORMAT REQUIREMENTS:
- [Platform-specific character limits]
- Headline: [limit]
- Description: [limit]
- CTA: [options]

VARIATIONS:
1. Benefit-led (focus on outcome)
2. Pain-point-led (address frustration)
3. Social-proof-led (testimonials/numbers)
4. Urgency-led (scarcity/time-limited)
5. Question-led (curiosity gap)

TONE: [Confident / Playful / Authoritative / Empathetic]
BRAND GUIDELINES: [Key phrases to use/avoid]
```

**Proven Copywriting Frameworks**:
- **AIDA**: Attention - Interest - Desire - Action
- **PAS**: Problem - Agitate - Solution
- **StoryBrand**: Character - Problem - Guide - Plan - CTA - Failure - Success

## 4.6 Product Description

```
Write a [word count]-word SEO product description for [product name].

TARGET KEYWORD: "[keyword]"
TARGET AUDIENCE: [Who buys this]

STRUCTURE:
1. Lead with the MAIN BENEFIT (not a feature)
2. 3-5 key features with benefit explanations
3. Social proof signals (awards, reviews, usage stats)
4. Technical specifications (if applicable)
5. Soft CTA (not aggressive sales language)

TONE: [Match brand voice]
AVOID: Generic adjectives ("amazing," "great," "best-in-class")
INCLUDE: Sensory language, specific numbers, use cases
```

## 4.7 FAQ Generation from Documents

```
TASK: Generate a comprehensive FAQ section from the following document.

DOCUMENT: [Paste content or reference]

REQUIREMENTS:
- Generate [5-15] question-answer pairs
- Questions should be in the natural language customers would use
- Answers should be concise (2-4 sentences each)
- Group questions by category if more than 10
- Include "People Also Ask" style questions for SEO
- Format answers to be scannable (short paragraphs, bold key terms)

PRIORITIZE:
- Questions that address common customer concerns
- Questions that would reduce support ticket volume
- Questions targeting long-tail SEO keywords

OUTPUT FORMAT:
## [Category Name]
**Q: [Question]**
A: [Answer]
```

## 4.8 Meeting Summary

```
TASK: Summarize the following meeting transcript/notes.

MEETING: [Title/Purpose]
DATE: [Date]
ATTENDEES: [List]

TRANSCRIPT/NOTES:
[Paste content]

OUTPUT FORMAT:
## Meeting Summary
**Date**: [Date]
**Duration**: [Duration]
**Attendees**: [Names]

### Executive Summary
[2-3 sentence overview of the meeting]

### Key Decisions Made
- [Decision 1] - Decided by: [Name]
- [Decision 2] - Decided by: [Name]

### Action Items
| Action Item | Owner | Deadline | Priority |
|------------|-------|----------|----------|
| [Task] | [Name] | [Date] | [H/M/L] |

### Discussion Highlights
- [Key point 1]
- [Key point 2]

### Open Issues / Parking Lot
- [Unresolved item 1]
- [Unresolved item 2]

### Next Meeting
[Date/Time if discussed]
```

## 4.9 Code Review

```
ROLE: You are a senior software engineer conducting a thorough code review.

CODE TO REVIEW:
[Paste code]

LANGUAGE: [Programming language]
CONTEXT: [What the code does, PR description]

REVIEW CHECKLIST:
1. **Bugs**: Logic errors, null handling, race conditions, off-by-one errors
2. **Security**: Injection risks, auth issues, data exposure, input validation
3. **Performance**: N+1 queries, unnecessary loops, memory leaks, caching opportunities
4. **Maintainability**: Naming conventions, complexity, duplication, SOLID principles
5. **Edge Cases**: Boundary conditions, empty inputs, concurrent access
6. **Testing**: Test coverage gaps, missing test cases

OUTPUT FORMAT:
For each issue found:
- **Severity**: Critical / Major / Minor / Suggestion
- **Location**: File and line number
- **Issue**: What's wrong
- **Why**: Why this matters
- **Fix**: Suggested code change

End with an overall assessment and approval recommendation.
```

## 4.10 Data Extraction

```
TASK: Extract structured data from the following [document type].

INPUT:
[Paste content: invoice, resume, form, email, etc.]

EXTRACT THE FOLLOWING FIELDS:
- [Field 1]: [description/format]
- [Field 2]: [description/format]
- [Field 3]: [description/format]

RULES:
- If any field is missing, return "Not found"
- If a value is ambiguous, return the most likely interpretation with a [UNCERTAIN] flag
- Normalize dates to YYYY-MM-DD format
- Normalize currency to [format]
- Remove extra whitespace and formatting artifacts

OUTPUT FORMAT: JSON
{
  "field_1": "value",
  "field_2": "value",
  "field_3": "value",
  "confidence": "high/medium/low",
  "notes": "any ambiguities or issues found"
}
```

## 4.11 Translation

```
ROLE: You are a professional translator specializing in [domain: legal, medical, technical, marketing].

TASK: Translate the following text from [source language] to [target language].

TEXT:
[Content to translate]

GUIDELINES:
- Prioritize natural-sounding [target language] over literal translation
- Preserve the original tone and intent
- Maintain formatting (headers, bullet points, etc.)
- For technical terms: provide the translated term with the original in parentheses on first use
- For idioms: use equivalent [target language] expressions, not literal translations
- For brand names and proper nouns: keep original unless an official localized version exists

OUTPUT:
[Translation]

NOTES:
- Flag any culturally sensitive content that may need adaptation
- Note any terms where multiple valid translations exist
- Highlight any ambiguous passages in the source text
```

## 4.12 Summarization

```
TASK: Summarize the following [content type] in [target length].

CONTENT:
[Paste text, article, report, etc.]

SUMMARIZATION TYPE: [Choose one]
- Executive Summary: Key decisions and bottom line
- Abstract: Academic-style overview
- TL;DR: Casual, conversational summary
- Bullet Points: Scannable key points
- Progressive: 1-sentence, 1-paragraph, and full summary versions

REQUIREMENTS:
- Preserve the most important facts and figures
- Maintain the original author's conclusions
- Do not introduce information not in the source
- Note any significant omissions from the summary
- Target audience: [Who will read this summary]

OUTPUT LENGTH: [Word count or sentence count]
```

---

# 5. PROMPT MANAGEMENT & VERSIONING

## 5.1 Key Tools Comparison

### Promptfoo
- **Website**: https://www.promptfoo.dev
- **GitHub**: https://github.com/promptfoo/promptfoo (Now part of OpenAI, remains open source MIT)
- **What It Does**: CLI and library for evaluating and red-teaming LLM apps
- **Key Features**:
  - Test prompts, agents, and RAGs
  - Red teaming / pentesting / vulnerability scanning for AI
  - Compare performance across GPT, Claude, Gemini, Llama, and more
  - YAML-based declarative test configurations (version-controllable)
  - Assertion types: exact match, contains, regex, JSON schema, cost thresholds, latency limits, LLM-graded evaluations
  - CI/CD integration with GitHub Actions (auto-test on PRs)
  - Multi-provider support for cross-model testing
  - Live reloads and caching for fast development
- **Best For**: Developer teams who want CI/CD discipline for prompts

### Langfuse
- **Website**: https://langfuse.com
- **What It Does**: Open-source prompt management, observability, and evaluation platform
- **Key Features**:
  - Version control: automatic version IDs + custom labels (staging, production)
  - Deployment workflow: create -> test -> deploy -> monitor
  - Protected prompt labels for production safety
  - Quick rollback by reassigning the "production" label
  - SDK integration (Python, JS/TS)
  - Tracks cost, latency, token usage, and evaluation metrics per version
  - A/B testing support built-in
  - Integrates with Promptfoo for evaluation
- **Pricing**: Open source (self-host free), cloud plans available
- **Best For**: Teams needing prompt lifecycle management with observability

### PromptLayer
- **Website**: https://www.promptlayer.com
- **What It Does**: Comprehensive prompt management platform with visual workspace
- **Key Features**:
  - Visual prompt editor (no code required)
  - Version history with diff comparison
  - Model-agnostic prompt blueprints
  - Environment management (production/development)
  - A/B testing based on user segments
  - Cost, latency, usage, and feedback tracking
  - Non-technical team access (editors can modify prompts without engineering)
  - SOC2 Type 2, GDPR, HIPAA, CCPA certified
- **Pricing**: Free plan available, Pro at $249/month, Enterprise on request
- **Best For**: Teams where non-technical stakeholders need to edit prompts

### Other Notable Tools
- **Braintrust**: CI/CD integration via GitHub Action, auto-experiments on PRs (https://www.braintrust.dev)
- **Portkey**: A/B test prompts and models with traffic splitting (https://portkey.ai)
- **Maxim**: Prompt testing and optimization with evaluation framework (https://www.getmaxim.ai)

## 5.2 Prompt Versioning Best Practices

1. **Use Labels, Not Version Numbers**: Assign labels like `production`, `staging`, `experiment-v2` rather than hardcoded version numbers. This allows updating which version is live without code changes.

2. **Separate Prompts from Code**: Store prompts outside your Git repository for application code. Use a prompt CMS or separate repo. This enables:
   - Non-technical team members to edit prompts
   - Prompt updates without app deployments
   - Better access control

3. **Environment-Based Deployment**: Maintain separate labels/environments:
   - `development`: For testing new prompt versions
   - `staging`: For validation before production
   - `production`: The live version fetched by your application

4. **Rollback Strategy**: Always keep previous versions accessible. Use labels so rollback = moving the `production` label to the previous version.

5. **Protected Labels**: Lock production labels so only admins can modify them, preventing accidental changes.

## 5.3 Prompt Testing Workflows

### Pre-Production Testing
```
1. Write new prompt version
2. Run automated test suite (Promptfoo):
   - Standard queries (common user intents)
   - Adversarial inputs (jailbreak attempts, toxic content)
   - Edge cases (ambiguous intent, poor grammar)
   - Multi-turn conversations (context maintenance)
3. Compare against baseline version (metrics: accuracy, latency, cost, safety)
4. Human review of sample outputs
5. Promote to staging with `staging` label
6. Validate in staging environment
7. Promote to production with `production` label
```

### A/B Testing in Production
```
1. Define hypothesis: "Prompt B will increase user satisfaction by X%"
2. Set up traffic split (e.g., 90% prompt A / 10% prompt B)
3. Run for statistically significant duration
4. Measure: accuracy, user satisfaction, task completion, cost, latency
5. Gradually increase winner's traffic share
6. Monitor for edge cases that only appear at scale
```

### Evaluation Approaches
- **LLM-as-Judge**: Use one model to evaluate another's output
- **Programmatic Rules**: Check for specific patterns, formats, keyword presence
- **Human Ratings**: Expert evaluation of sample outputs
- **Composite Scores**: Combine multiple signals into a single quality metric

## 5.4 Storing Prompts: Decision Framework

| Storage Method | Pros | Cons | Best For |
|---------------|------|------|----------|
| **Prompt CMS** (PromptLayer, Langfuse) | Visual editing, access control, versioning, A/B testing, rollback | Cost, vendor dependency | Production apps with non-technical editors |
| **Separate Git Repo** | Version control, code review, free, CI/CD integration | Requires dev skills, tied to deploy cycles | Developer-heavy teams |
| **Database** | Flexible, dynamic, runtime updates | Need to build UI, no built-in versioning | Custom platforms with specific needs |
| **Config Files** (YAML/JSON) | Simple, version-controlled, easy to understand | Manual management, no built-in analytics | Small projects, prototypes |
| **In Application Code** | Simplest, no infrastructure | Hard to update, no separation of concerns | Quick prototypes only |

**Recommended Approach for Production**:
- Use a Prompt CMS (PromptLayer or Langfuse) as the source of truth
- Pull prompts at runtime via SDK
- Use Promptfoo for automated testing in CI/CD
- Keep a backup in version control

---

# 6. VIETNAMESE LANGUAGE PROMPTS

## 6.1 Vietnamese Language Considerations

Vietnamese has unique characteristics that affect prompt engineering:
- **Tonal language**: 6 tones that change word meaning
- **Diacritics**: Essential for correct meaning (e.g., "ma" has 6+ meanings depending on tone marks)
- **Grammar structure**: Subject-Verb-Object, but with different modifier ordering than English
- **Politeness levels**: Formal/informal registers significantly affect communication

## 6.2 Best Models for Vietnamese (2026)

Based on current benchmarks:
1. **Qwen3-235B-A22B**: Outstanding Vietnamese language support
2. **Meta-Llama-3.1-8B-Instruct**: Strong multilingual capabilities including Vietnamese
3. **Qwen/Qwen3-8B**: Good Vietnamese support in a smaller model
4. **Claude (Opus/Sonnet)**: Strong Vietnamese capabilities across all tasks
5. **GPT-4o/GPT-5**: Reliable Vietnamese output

## 6.3 Vietnamese Marketing Prompts

```
VAI TRO: Ban la mot chuyen gia marketing so tai Viet Nam voi 10 nam kinh nghiem
trong linh vuc [nganh hang].

NHIEM VU: Tao noi dung marketing cho [san pham/dich vu] nham vao
doi tuong khach hang Viet Nam.

DOI TUONG MUC TIEU:
- Do tuoi: [range]
- Khu vuc: [thanh pho/tinh]
- Thu nhap: [muc]
- So thich: [danh sach]
- Nen tang su dung: [Zalo/Facebook/TikTok/Instagram]

YEU CAU:
- Su dung ngon ngu tu nhien, gan gui voi nguoi Viet
- Tuan thu van hoa va phong tuc Viet Nam
- Bao gom tu khoa SEO tieng Viet
- Phu hop voi nen tang [ten nen tang]
- Ton trong cac quy dinh quang cao tai Viet Nam

GIONG VAN: [Trang trong / Than thien / Tre trung / Chuyen nghiep]
```

(Note: Prompts can be written with or without Vietnamese diacritics. For best results, use full diacritics.)

## 6.4 Vietnamese Customer Service Prompts

```
ROLE: You are a Vietnamese-speaking customer service assistant for [Company Name].

LANGUAGE RULES:
- Respond in Vietnamese by default
- Add "Da" at the beginning of responses to show politeness and friendliness
- Use formal pronouns (Anh/Chi/Quy khach) unless the customer uses informal language
- If the customer writes in English, respond in English
- For technical terms without Vietnamese equivalents, use the English term with
  a Vietnamese explanation in parentheses

CULTURAL GUIDELINES:
- Be extra polite and patient (Vietnamese customers value respectful service)
- Avoid direct "no" - use softening language ("Em xin phep..." / "Rat tiec...")
- Use appropriate honorifics based on perceived age/status
- During Tet and holidays, include appropriate greetings

SAMPLE RESPONSE PATTERN:
"Da, [honorific] [name] oi,
[Acknowledge their concern]
[Provide solution/information]
[Ask if they need further help]
[Polite closing]"
```

## 6.5 Bilingual Prompt Techniques (Vietnamese + English)

```
CONTEXT: You serve customers who may write in Vietnamese or English.

LANGUAGE DETECTION AND RESPONSE:
1. Detect the customer's language from their message
2. Respond in the SAME language they used
3. If they code-switch (mix Vietnamese and English), respond in the dominant language
4. For product names and technical terms:
   - In Vietnamese responses: Use Vietnamese term first, English in parentheses
     Example: "Tri tue nhan tao (AI)"
   - In English responses: Use English term only

FORMATTING:
- Vietnamese text: Use proper diacritical marks (dau sac, huyen, hoi, nga, nang)
- Numbers: Use Vietnamese format (1.000.000 VND, not 1,000,000 VND)
- Dates: Use DD/MM/YYYY format (Vietnamese standard)
- Currency: Always specify VND for Vietnamese context

KNOWLEDGE BASE HANDLING:
- If knowledge base is in English, translate relevant portions naturally into Vietnamese
- Do not provide literal translations; adapt content culturally
- For legal/policy content, provide both Vietnamese and English versions
```

## 6.6 Vietnamese AI Ecosystem

- **FPT.AI**: Leading Vietnamese NLP platform, integrated with Zalo and Facebook
- **Viettel AI**: Enterprise Vietnamese language processing
- **BotStar / Harafunnel**: E-commerce chatbot platforms popular in Vietnam
- **Viet Prompter**: Specialized GPT for crafting prompts in Vietnamese (https://www.yeschat.ai/gpts-9t55QixFU4D-Viet-Prompter)
- **Chat Tieng Viet**: GPT specialized for Vietnamese-speaking users

**Market Context**: 78% of online Vietnamese used an AI platform in the past 3 months (2025 data). 89% of Vietnamese firms use AI in marketing. Gen Z (18-24) drives adoption with 81% ChatGPT usage.

**Academic Research**: "Prompt Engineering with Large Language Models for Vietnamese Sentiment Classification" - PACLIC 2024 (https://aclanthology.org/2024.paclic-1.17/)

---

# APPENDIX: COMPREHENSIVE RESOURCE LINKS

## GitHub Repositories
| Repository | Stars | Focus |
|-----------|-------|-------|
| [f/prompts.chat](https://github.com/f/prompts.chat) | 143k+ | World's largest open-source prompt library |
| [dair-ai/Prompt-Engineering-Guide](https://github.com/dair-ai/Prompt-Engineering-Guide) | 55k+ | Comprehensive prompt engineering guide |
| [promptslab/awesome-prompt-engineering](https://github.com/promptslab/awesome-prompt-engineering) | - | Curated prompt engineering resources |
| [ai-boost/awesome-prompts](https://github.com/ai-boost/awesome-prompts) | - | Top GPT prompts from GPTs Store |
| [asgeirtj/system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) | - | System prompts from major AI products |
| [elder-plinius/CL4R1T4S](https://github.com/elder-plinius/CL4R1T4S) | - | AI system prompt transparency |
| [Piebald-AI/claude-code-system-prompts](https://github.com/Piebald-AI/claude-code-system-prompts) | - | Claude Code system prompts |
| [baz-scm/awesome-reviewers](https://github.com/baz-scm/awesome-reviewers) | - | Code review system prompts |
| [anthropics/prompt-eng-interactive-tutorial](https://github.com/anthropics/prompt-eng-interactive-tutorial) | - | Anthropic's official tutorial |
| [meta-prompting/meta-prompting](https://github.com/meta-prompting/meta-prompting) | - | Meta prompting implementation |
| [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | - | Prompt testing & red-teaming tool |

## Official Documentation & Guides
- [Anthropic Claude Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [OpenAI Prompt Engineering Guide](https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt)
- [Google Cloud Prompt Engineering Guide](https://cloud.google.com/discover/what-is-prompt-engineering)
- [Promptingguide.ai - DAIR.AI](https://www.promptingguide.ai)
- [Learn Prompting](https://learnprompting.org)
- [AWS Agentic AI Patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-patterns/workflow-for-prompt-chaining.html)

## Tools & Platforms
- [Promptfoo](https://www.promptfoo.dev) - Open-source prompt testing & evaluation
- [Langfuse](https://langfuse.com) - Open-source prompt management & observability
- [PromptLayer](https://www.promptlayer.com) - Visual prompt management platform
- [Braintrust](https://www.braintrust.dev) - AI product evaluation
- [Portkey](https://portkey.ai) - AI gateway with A/B testing
- [Maxim](https://www.getmaxim.ai) - Prompt testing & optimization

## Learning Resources
- [Lakera Prompt Engineering Guide 2026](https://www.lakera.ai/blog/prompt-engineering-guide)
- [SurePrompts - Every Technique Explained](https://sureprompts.com/blog/advanced-prompt-engineering-techniques)
- [Voiceflow - Prompt Engineering for Chatbots](https://www.voiceflow.com/blog/prompt-engineering)
- [Prompt Builder Best Practices 2026](https://promptbuilder.cc/blog/prompt-engineering-best-practices-2026)
- [Sitepoint - Agentic Design Patterns 2026](https://www.sitepoint.com/the-definitive-guide-to-agentic-design-patterns-in-2026/)
- [Google Multi-Agent Design Patterns](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/)

## Marketing & Business Prompt Resources
- [50+ Marketing Prompts 2026](https://smartaiforbiz.com/best-ai-prompts-for-marketing-2026/)
- [Perfect Marketing Prompt Structure](https://www.brandedagency.com/blog/perfect-marketing-prompt)
- [AI Prompts for Social Media 2026](https://www.vendasta.com/blog/ai-prompts-for-social-media/)
- [40+ Copywriting Prompts for Ad Copy](https://www.typeface.ai/blog/ai-copywriting-prompts-for-high-converting-ad-copy)
- [AI Email Prompt Templates](https://findskill.ai/blog/ai-email-prompt-templates/)
- [Prompts for Customer Service](https://wonderchat.io/blog/10-prompts-for-ai-customer-service-chatbots)
- [Sales AI Prompts Guide 2026](https://reply.io/ai-prompts-for-sales/)

## Vietnamese AI Resources
- [Vietnamese Sentiment Classification Research](https://aclanthology.org/2024.paclic-1.17/)
- [Best Open Source LLM for Vietnamese 2026](https://www.siliconflow.com/articles/en/best-open-source-LLM-for-Vietnamese)
- [Viet Prompter GPT](https://www.yeschat.ai/gpts-9t55QixFU4D-Viet-Prompter)
- [AI Customer Service in Vietnam](https://www.nucamp.co/blog/coding-bootcamp-viet-nam-vnm-customer-service-work-smarter-not-harder-top-5-ai-prompts-every-customer-service-professional-in-viet-nam-should-use-in-2025)

---

*Research compiled May 2026. Links and information verified at time of research.*
