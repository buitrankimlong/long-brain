---
tags: [knowledge, marketing, ai-skills, techniques]
source_repo: ai-marketing-skills
files_read: 42
---

# AI Marketing Skills - Knowledge Extraction

## Overview

**Source:** `ai-marketing-skills` repo by Single Brain (singlebrain.com) — battle-tested on real pipelines generating millions in revenue. MIT license.

**What this is:** Open-source Claude Code skills for marketing and sales teams. Not prompts — complete workflows with scripts, scoring algorithms, expert panels, and automation pipelines. Each skill is a `SKILL.md` file you drop into your Claude Code project, and the AI agent knows how to use all tools in that skill.

**How to use with Claude Code:**
```bash
cp ai-marketing-skills/growth-engine/SKILL.md .claude/skills/growth-engine.md
# Then ask Claude Code: "Run an experiment testing carousel vs static posts"
```

**Repo structure:** 20+ skill categories, each containing:
- `SKILL.md` — agent instructions (the "skill brain")
- Python scripts — actual automation code
- `references/` — templates, rules, expert panels
- `scoring-rubrics/` — quality scoring criteria

---

## Marketing Skills Catalog

### 1. Growth Engine
**Purpose:** Autonomous marketing A/B experimentation framework.
**Core concept:** Karpathy-style autoresearch applied to marketing. Creates experiments with hypotheses, logs data points, runs real statistics (bootstrap CI + Mann-Whitney U), auto-promotes winners to a living playbook.

**Scripts:**
- `experiment-engine.py` — create/log/score/list experiments, check playbook, suggest next tests
- `autogrowth-weekly-scorecard.py` — weekly review across all channels
- `pacing-alert.py` — campaign health monitoring

**Statistical rigor:** p < 0.05 AND ≥ 15% lift required for winner. Bootstrap 1000 iterations. Batch mode up to 10 variants.

**Workflow:** playbook check → publish & log → score → weekly scorecard → suggest next variable.

---

### 2. Sales Pipeline
**Purpose:** Website visitor identification → qualified pipeline automation.

**Data flow:**
```
RB2B Webhook → Ingest (score) → Suppress (5 layers) → Route (classify) → Instantly
HubSpot CRM  → Deal Resurrector → Review Queue
Brave Search → Trigger Prospector → Outreach Queue
Prospect DB  → ICP Analyzer → Filter Recommendations
```

**Scripts:**
- `rb2b_webhook_ingest.py` — webhook server + intent scoring
- `rb2b_suppression_pipeline.py` — 5-layer suppression (existing client, bad fit, etc.)
- `rb2b_instantly_router.py` — full pipeline: score → suppress → route → enroll
- `deal_resurrector.py` — 3-layer dead deal revival: time decay + POC expansion + champion tracking (follows contacts who left to their new companies)
- `trigger_prospector.py` — web signal monitoring: new hires, funding, agency searches
- `icp_learning_analyzer.py` — learns from approve/reject, auto-rewrites ICP

**Integrations:** HubSpot, Instantly, Brave Search, PostgreSQL

---

### 3. Content Ops (Expert Panel System)
**Purpose:** Ship content that scores 90+ every time via recursive expert panel.

**Core concept:** Auto-assembles 7-10 domain experts tailored to content type. Scores recursively until 90+. Max 3 rounds. Humanizer weighted 1.5x.

**Expert panel assembly rules:**
1. Start with content-type experts from `experts/` directory
2. Add 1-3 domain/industry experts
3. Always include AI Writing Detector (humanizer) and Brand Voice Match
4. Check `references/patterns.md` for learned rejection patterns
5. Cap at 10 experts

**Pre-built expert panels:** LinkedIn, Instagram, Newsletter, X (Twitter), YouTube Shorts, Podcast Quotes, SEO Strategy, Recruiting, Humanizer

**Scoring rubrics:**
- `content-quality.md` — blog, social, email, newsletter, scripts
- `strategic-quality.md` — strategy, recommendations, analysis
- `conversion-quality.md` — landing pages, ads, CTAs
- `visual-quality.md` — charts, data viz, infographics
- `evaluation-quality.md` — candidate evaluations

**Scripts:**
- `editorial-brain.py` — main orchestrator
- `content-quality-gate.py` — pass/fail quality check
- `content-quality-scorer.py` — detailed scoring
- `content-transform.py` — content transformation
- `quote-mining-engine.py` — extract quotable moments

**Memory system:** Approved/rejected patterns saved to `references/patterns.md`. Panel auto-docks points for known-bad patterns.

---

### 4. Outbound Engine (Cold Email)
**Purpose:** ICP definition → emails in inbox, fully automated.

**Modes:** Start from scratch OR optimize existing Instantly campaigns.

**Phase 1 — Discovery:** Infrastructure check (warmup scores, account inventory), performance data pull, ICP definition, business context, expert panel config.

**Phase 2 — Expert Panel Scoring:** 10 outbound experts score copy recursively to 90+. See expert panel roster in reference files.

**Phase 3 — Deliverables:** Strategy doc with pre-analysis, ICP summary, scoring rounds, final copy, implementation plan, capacity math, weekly targets, STOP/START lists.

**Capacity math formula:**
```
Accounts ready (score ≥80, ≥14 days warmup) × 30 emails/day = conservative daily volume
Daily volume × 22 working days = monthly send capacity
Monthly sends × reply rate = expected replies
Expected replies × qualification rate = pipeline opportunities
```

**Weekly metrics benchmarks:**

| Metric | Good | Great |
|--------|------|-------|
| Open rate | 40%+ | 60%+ |
| Reply rate | 3%+ | 7%+ |
| Positive reply rate | 1%+ | 3%+ |
| Meeting rate | 0.5%+ | 1.5%+ |

**Scripts:** `cold-outbound-sender.py`, `competitive-monitor.py`, `cross-signal-detector.py`, `instantly-audit.py`, `lead-pipeline.py`

---

### 5. SEO Ops
**Purpose:** Find keywords competitors missed, prove content ROI.

**Tools:**
- `content_attack_brief.py` — full keyword intelligence: topic fingerprint, BOFU keywords ranked by Impact × Confidence, trending keywords, competitor gap analysis, decaying page alerts
- `gsc_client.py` — Google Search Console API client (striking distance, trend, devices, sites)
- `gsc_auth.py` — one-time OAuth setup
- `trend_scout.py` — multi-source trends: Google Trends RSS, Hacker News, Reddit, X/Twitter, YouTube

**Scoring model:**
- **Impact (0-10):** Volume + CPC + Funnel Stage + Trend direction
- **Confidence (0-10):** Keyword Difficulty + Current ranking + Topic authority
- **Priority = Impact × Confidence** (max 100)

**Funnel classification:**
- BOFU: "agency", "services", "pricing", "best", "vs", "hire"
- MOFU: "how to", "guide", "roi", "case study"
- TOFU: pure informational

**Recommended cadence:** Weekly full brief, daily striking distance check, 2x/week trend scout, monthly competitor gap review.

---

### 6. Revenue Intelligence
**Purpose:** Prove content ROI and turn sales calls into strategy.

**Tools:**
- `gong_insight_pipeline.py` — extracts from Gong or transcript files: objections (pricing/timing/competition/authority/need), buying signals, competitive mentions, pricing discussions, content topic suggestions, follow-up drafts
- `revenue_attribution.py` — maps content to closed revenue; supports first-touch, linear, time-decay models; CPA by content type; content gap analysis
- `client_report_generator.py` — unified report from GA4 + HubSpot + Ahrefs + Gong; anomaly detection; period-over-period comparison

**Recommended workflow:** Weekly Gong insights → monthly attribution report → monthly client reports → quarterly gap analysis.

---

### 7. Conversion Ops
**Purpose:** Score landing pages and turn survey data into lead magnets.

**CRO Audit scoring dimensions (each 0-100):**
1. Headline Clarity — value prop in <5 seconds
2. CTA Visibility — prominent, contrasting, above fold
3. Social Proof — testimonials, logos, case studies, numbers
4. Urgency — scarcity, deadlines, limited offers
5. Trust Signals — security badges, guarantees, privacy
6. Form Friction — field count, intimidation factor
7. Mobile Responsiveness — viewport, responsive patterns, touch targets
8. Page Speed Indicators — image optimization, script count

**Survey-to-Lead-Magnet Engine:** Ingests CSV, clusters respondents by pain point, generates lead magnet briefs per segment (title, format, hook, content outline, CTA, viral potential score).

**No API keys required** — both tools work with local analysis only.

---

### 8. Podcast Ops
**Purpose:** One episode → 20+ content pieces across every platform.

**Content atoms extracted:** Narrative arcs, quotable moments, controversial takes, data points, stories, frameworks, predictions.

**Output per episode (15-20 pieces):**
- Short-form video clips (3-5): TikTok/Reels/Shorts
- Twitter/X threads (2-3)
- LinkedIn article draft (1)
- Newsletter section (1)
- Quote cards (3-5)
- Blog post outline with SEO keywords (1)
- YouTube Shorts/TikTok script (1)

**Viral scoring formula:**
```
Viral Score = (Novelty × 0.4) + (Controversy × 0.3) + (Utility × 0.3)
```
- 80+: Priority publish
- 60-79: Solid content
- 40-59: Filler only
- Below 40: Cut it

**Dedup engine:** Flags >70% semantic overlap between pieces or against recent history (30 days).

---

### 9. Team Ops
**Purpose:** Performance audits + meeting intelligence.

**Elon Algorithm (5 steps):**
1. Question requirements
2. Delete redundancies
3. Simplify workflows
4. Accelerate bottlenecks
5. Automate what's possible

**Output:** Stack rank (A/B/C players), individual scorecards, org recommendations, promote/coach/exit actions.

**Meeting Action Extractor output:** Decisions (who + context), action items (owner + deadline + priority), open questions, key insights/quotes, follow-up meetings needed, implicit commitments — all with confidence scores. Optional push to HubSpot as tasks.

---

### 10. Sales Playbook (Value-Based Pricing)
**Purpose:** Move deals from $10K/mo → $40-100K/mo via value-based pricing.

**Framework (5 principles):**
1. Lead with data, not your pitch — show competitive gaps first
2. Anchor high — present premium tier first so target feels reasonable
3. Tie price to value — every dollar maps to projected ROI
4. Use competitive triggers — competitor rankings activate urgency without being pushy
5. Present tiered options — 3-4 tiers with clear tradeoffs, always include performance option

**Call analyzer scoring (0-100):**
- Showed data before pitching: 20 pts
- Presented tiered options: 20 pts
- Anchored high first: 15 pts
- Tied price to value/ROI: 15 pts
- Used competitive triggers: 15 pts
- Got prospect to state their own pain: 15 pts

**Scripts:** `value_pricing_briefing.py`, `value_pricing_packager.py`, `call_analyzer.py`, `pricing_pattern_library.py`

---

### 11. Autoresearch (Karpathy-Style Optimization)
**Purpose:** Pre-launch content optimization without traffic. 50+ variants, expert scoring, evolved winners.

**Expert panel (5 personas):**
1. CMO at mid-market B2B ($50M+ revenue)
2. Skeptical founder
3. Conversion rate optimizer
4. Senior copywriter
5. CEO/founder (customize with real voice)

**Round structure per element:**
```
Round 1: 10 variants → score all → keep top 3
Round 2: Analyze top 3 → evolve 10 new → keep top 3
Round 3: Target weakest dimension → 10 variants → keep top 1
Cross-breeding: Top winner per element → 5 combinations → holistic score → 1 winner
```

**Stop condition:** Score hits threshold (default 80) OR 3 rounds complete.

**Quality gates:**
- < 70: Don't ship. Fundamental problem.
- 70-79: Marginal. One more round.
- 80-84: Good. Shippable.
- 85-89: Strong. Ship with confidence.
- 90+: Rare. Ship immediately.

**Critical API efficiency:** ALWAYS batch all variants into one API call. 10 variants = 1 call, never 10 calls.

**Content types:** Landing pages, email sequences, ad copy, form pages. Each has specific score dimensions.

---

### 12. Deck Generator
**Purpose:** AI-generated slide decks with consistent visual styles in minutes.

**Style presets:** whiteboard, corporate, minimalist, dark-tech, playful, editorial.

**Cost:** ~$0.04/image, ~$0.56 for a 14-slide deck. ~2 minutes build time.

**Tech:** Imagen 4.0 via Google Generative Language API + optional Google Slides API.

---

### 13. YouTube Competitive Analysis
**Purpose:** Find outlier videos (2x+ average views) and packaging patterns.

**Predefined channel sets:** AI creators (Matt Wolfe, Alex Finn, etc.), Business creators (Hormozi, Gary Vee, etc.)

**Proven packaging skeletons (Long-form):**
- "X, Clearly Explained"
- "X hours of Y in Z minutes"
- "The Laziest Way to X"
- "Give me X minutes and I'll Y"
- "X INSANE Use Cases for Y"

**Shorts formats:**
- "2024 vs 2025 X" (year comparison)
- "Bad Good Great X" (tier ranking)
- "Stop doing X, do Y instead" (contrarian)

---

### 14. X Long-Form Post Writer
**Purpose:** Write X posts/threads in authentic founder/CEO voice with AI-slop detection.

**Mandatory structure:**
1. Hook (1-2 lines) — contrarian claim or surprising stat
2. Setup (2-3 lines) — credibility/context
3. Sections — each: problem → what actually happened → fix/lesson
4. ASCII diagram (mandatory, at least one per post)
5. Uncomfortable truth
6. Payoff — was it worth it?

**Mandatory humanizer pass:** 24-pattern AI slop detector runs before every finalization.

---

### 15. Lead Dossier
**Purpose:** Multi-source account research, cascade enrichment, full lead pipeline.

**Account research output:** Website analysis, tech stack (CRM/marketing tools), hiring signals, news/funding signals, 3-5 sentence research brief.

**Cascade enrichment waterfall:**
1. Has email from primary source? → Done
2. Try email finder API → Found? → Done
3. Has LinkedIn URL? → Tag as fallback
4. None → Tag as no-contact

**Lead pipeline:** search → verify → dedupe → upload. Saves auditable JSON run log.

**Safety rules:** Never upload unverified leads, always deduplicate, log everything, rate limit aware, idempotent re-runs.

---

### 16. Finance Ops
**Purpose:** AI CFO briefings from QuickBooks exports + codebase cost estimation.

**CFO Briefing:** Accepts P&L, Balance Sheet, General Ledger, Cash Flow. Auto-detects file types. MoM comparison. Scenario modeling (base/bull/bear 12-month projections).

**Codebase Cost Estimator:** Analyzes LOC, architectural complexity, applies productivity rates, organizational overhead, full team cost. Always shows ranges (low/avg/high), never single number. Includes AI ROI analysis.

---

### 17. Clone Site
**Purpose:** Pixel-perfect website clone using Chrome MCP + Next.js + shadcn/ui + Tailwind.

**5 phases:** Reconnaissance → Foundation Build → Component Specification & Dispatch → Page Assembly → Visual QA Diff.

**Core principles:**
- Completeness beats speed — extract exact CSS values, never estimate
- Small tasks, perfect results — if builder prompt > 150 lines, split the section
- Real content, real assets — never generate content that exists on the site
- Foundation first — global CSS, TypeScript types, global assets before any components
- Extract appearance AND behavior — static + scroll/hover/click states

---

## AI Tools & Techniques for Marketing

### Statistical Methods Used
- **Bootstrap Confidence Intervals** (1000 iterations) — experiment winner validation
- **Mann-Whitney U Test** — non-parametric comparison for A/B tests
- **p < 0.05 AND ≥ 15% lift** — dual condition for declaring winners (prevents false positives)
- **Intent scoring** — RB2B webhook scores page visits by URL pattern match
- **ICP scoring** — multi-signal scoring: seniority, company size, industry, buying signals
- **Semantic similarity** — dedup engine flags >70% overlap between content pieces

### Integrations Catalog

| Category | Tools Integrated |
|----------|-----------------|
| CRM | HubSpot |
| Cold Email | Instantly |
| Sales Intelligence | Gong |
| SEO | Ahrefs, Google Search Console |
| Web Analytics | GA4 |
| Lead Research | Clay, Apollo, LeadMagic, Brave Search |
| Email Verification | LeadMagic or similar |
| Visitor ID | RB2B |
| Finance | QuickBooks |
| AI APIs | Anthropic Claude, OpenAI GPT, Imagen 4.0 (Google Gemini) |
| Transcription | OpenAI Whisper |
| Search | Brave Search API |
| Social | YouTube Data API v3 |
| Slide decks | Google Slides API |
| Tech detection | BuiltWith |

### Automation Patterns Used
1. **Webhook ingestion** — RB2B fires webhook → script scores + routes in real time
2. **Waterfall enrichment** — try primary source → fallback → LinkedIn → tag no-contact
3. **Recursive scoring** — run panel → score < 90 → improve → re-run (max 3 rounds)
4. **Batch API calls** — all variants scored in one API call (efficiency pattern)
5. **Champion tracking** — follow contacts who leave companies to their new employer
6. **Signal monitoring** — periodic web search for buying triggers (new hires, funding)
7. **Content deduplication** — semantic hash comparison against 30-day history
8. **Playbook auto-promotion** — winning experiments automatically added to living best-practices doc

---

## Prompt Templates for Marketing

### Cold Email First Sentence Patterns
```
# Pattern 1: Company name opener
"{{companyName}}'s recent [specific thing]..."

# Pattern 2: Market observation
"Most [industry] companies we talk to are [specific problem]..."

# Pattern 3: Specific finding
"Your [blog post / LinkedIn post / job listing] on [topic]..."

# Pattern 4: Relevant trend
"Since [relevant event] happened in [industry]..."
```

### Cold Email CTA Templates (Soft Asks — Preferred)
```
"Worth a look?"
"Want the data?"
"Does this match what you're seeing?"
"Relevant to what you're working on?"
"Happy to share what we found — useful?"
```

### ICP Definition Template (Key Fields)
```
Target Titles: [Primary] / [Secondary] / [Never target]
Target Industries: [Primary verticals] / [Secondary] / [Excluded]
Company Size: [Min employees] – [Max] / [Sweet spot]
Revenue Range: $[Min] – $[Max] ARR
Buying Signals: [New VP hire / Funding / Product launch / Job postings]
Anti-ICP: [<10 employees / Nonprofit / Government / Existing clients]
Primary Offer: [Free audit / Demo / Strategy call]
Known Objections: [Top 1-3 objections + how to neutralize]
```

### X (Twitter) Post Structure Template
```
[Hook: contrarian claim or surprising stat — 1-2 lines]

[Setup: credibility/context — 2-3 lines]

[Problem section]
[What actually happened]
[Fix/lesson]

[ASCII diagram in code block — mandatory]

[Uncomfortable truth]

[Payoff: was it worth it? Yes, here's why]
```

### Expert Panel Scoring Format
```
## Round [N] — Score: [AVG]/100

| Expert | Score | Key Feedback |
|--------|-------|--------------|
| [Name] | [0-100] | [One-line rationale] |

**Aggregate:** [weighted average — humanizer at 1.5x]
**Top 3 weaknesses:** [ranked]
**Changes made:** [specific edits addressing each weakness]
```

### Podcast Content Atom Format
```
- Type: [narrative_arc | quote | controversial_take | data_point | story | framework | prediction]
- Content: [extracted text]
- Timestamp: [start - end]
- Context: [what was being discussed]
- Viral Score: [0-100]
- Suggested platforms: [where this works best]
```

---

## Workflow Patterns

### Pattern 1: Content Production Loop (Content Ops)
```
1. Ingest content from RSS/transcript/upload
2. Editorial brain extracts content atoms
3. Generate platform-specific pieces from atoms
4. Score each piece on viral potential (Novelty × Controversy × Utility)
5. Dedup against recent history (30 days)
6. Assemble scored content into weekly calendar
7. Expert panel quality gate (90+ required)
8. Publish approved pieces
```

### Pattern 2: Cold Outbound Loop (Outbound Engine)
```
1. Define ICP → collect all fields
2. Source leads (Apollo/Clay → verify → dedup)
3. Write email sequence → expert panel scoring (10 experts recursive to 90+)
4. Infrastructure check (warmup scores, account inventory)
5. Capacity math → set weekly targets
6. Launch → monitor (open rate / reply rate / positive reply rate)
7. Log results → growth engine experiment
8. Score experiment → promote winners to playbook
9. Suggest next variable to test
```

### Pattern 3: Sales Intelligence Loop (Revenue Intelligence)
```
1. Weekly: Gong transcript extraction → structured insights JSON
2. Extract: objections / buying signals / competitive mentions
3. Feed objections → content topic suggestions → content team
4. Feed follow-up drafts → outbound sequences
5. Monthly: attribution report (content → pipeline → revenue)
6. Monthly: client report (GA4 + HubSpot + Ahrefs + Gong → executive summary)
7. Quarterly: content gap analysis → editorial calendar adjustment
```

### Pattern 4: Visitor-to-Pipeline Loop (Sales Pipeline)
```
1. Visitor lands on site → RB2B identifies person
2. Webhook fires → intent scoring (URL pattern matching)
3. 5-layer suppression (existing client / bad fit / already in sequence / etc.)
4. Company classification (agency / competitor / ICP / non-ICP)
5. Route to Instantly campaign based on classification
6. Enroll in appropriate cold email sequence
7. Trigger prospector runs parallel: web signals for companies showing buying intent
8. Deal resurrector periodically reviews closed-lost deals for revival opportunity
9. ICP analyzer learns from approve/reject decisions → rewrites targeting filters
```

### Pattern 5: Pre-Launch Content Optimization (Autoresearch)
```
1. Input: existing page/email/ad/form
2. Parse into optimizable elements
3. Run autoresearch rounds per element:
   - Generate 10 variants
   - Batch-score with 5-expert panel (1 API call)
   - Keep top 3
   - Evolve next 10 from winners
   - Repeat max 3 rounds
4. Cross-breed: combine top winners from each element
5. Output: optimized content + experiment log + optimization report
6. Deploy if score ≥ 80, validate with real traffic
```

---

## Content Creation Techniques

### The 24 AI Slop Patterns to Avoid (Humanizer System)

**Banned vocabulary (instant -5 per word):**
`delve, tapestry, leverage, multifaceted, nuanced, pivotal, realm, robust, seamless, testament, transformative, utilize, whilst, keen, embark, comprehensive, intricate, commendable, meticulous, paramount, groundbreaking, innovative, cutting-edge, synergy, holistic, paradigm, ecosystem, Additionally, crucial, enduring, enhance, fostering, garner, showcase, vibrant, valuable, profound, renowned`

**Critical patterns to eliminate:**
- Significance inflation: "stands as", "is a testament", "pivotal moment" (-10)
- Superficial -ing phrases: "highlighting", "showcasing", "underscoring" (-8)
- Promotional language: "boasts a", "vibrant", "commitment to" (-8)
- Vague attributions: "Experts believe", "Industry reports" (-8)
- AI vocabulary clustering: multiple banned words in same paragraph (-10)
- "Not X, it's Y" constructions: define things directly, never by negation (-5)
- Generic positive conclusions: "The future looks bright" (-10)
- Collaborative artifacts: "I hope this helps", "Let me know" (-10)
- Sycophantic tone: "Great question!", "Excellent point!" (-8)

**What good writing has:**
- Opinions, not just reporting
- Varied sentence rhythm (short punches + longer ones)
- Specific details: names, dates, numbers
- Simple verbs (is, has, does) over elaborate constructions
- First-person perspective when appropriate
- Humor, edge, or personality

### Cold Email Copy Rules

**Never start with:** I, We, Our team, "Hope this finds you well", "My name is"

**Body length limits:**
- Step 1: 3 sentences max (open + value + CTA)
- Steps 2-4: 3-5 sentences (new angle, not repeat)
- Step 5 (bump): 1-2 sentences
- Step 6 (breakup): 2-3 sentences

**Stats framing:** Use "observation" not "study" — "Most brands we audit are leaving 30-40% of SEO traffic unconverted" beats "According to our data, 73% have this problem."

**Subject line sweet spot:** 3-7 words, no exclamation points, no caps, no emoji in B2B.

**Links:** None in Step 1. Max 1 in Steps 2-3. Never link to forms in Steps 1-2.

**Tone:** Peer-to-peer, not vendor-to-prospect. Cold email that converts sounds like a text from a knowledgeable peer.

### LinkedIn Content Rules
- Hook before "see more" fold is non-negotiable — first 2-3 lines must compel the click
- Story arc: Setup → insight → takeaway
- Professional but not corporate: no jargon, no "I'm excited to announce"
- Engagement CTA: genuine question, not "like and share"
- Format: short paragraphs, white space, scannable

### Content Quality Scoring Formula (0-100)
- Hook Power (0-25): generic → interesting → strong curiosity gap → impossible to scroll past
- Voice Authenticity (0-25): sounds like a real person, specific numbers, contrarian + data
- Value Density (0-25): every sentence earns its place, actionable insight
- Engagement Potential (0-25): shareable, debate-sparking, platform-native

### Viral Score Formula for Content
```
Viral Score = (Novelty × 0.4) + (Controversy × 0.3) + (Utility × 0.3)
```
- Novelty: contrarian takes, unexpected data, first-to-say
- Controversy: strong opinions, challenges norms, picks a side
- Utility: frameworks, how-tos, templates, specific numbers

---

## What We Can Reuse

### For AI Agency (Vietnam Market)

**Immediately applicable skills:**
1. **Outbound Engine** — Cold email automation for client acquisition. Use Instantly campaigns. Start with the expert panel scoring workflow even before automating.
2. **Content Ops Expert Panel** — Recursive quality scoring for any content. Drop `content-ops/SKILL.md` into projects. Humanizer + brand voice match on all client deliverables.
3. **Autoresearch** — Pre-launch optimization for client landing pages. 50 variants, 5 experts, no traffic needed. Directly billable as a service.
4. **Sales Playbook** — Value-based pricing framework. Use `value_pricing_briefing.py` before every client call. Tiered packaging pattern directly applicable.
5. **Growth Engine** — Statistical A/B testing framework. Run real experiments for clients with bootstrap CI — differentiates from "vibes-based" agencies.

**Reusable patterns (adapt for Vietnamese market):**
- ICP template — adapt with Vietnam-specific fields (Zalo, MoMo integration, Vietnamese company size tiers)
- Expert panel system — add Vietnamese marketing experts, Vietnam consumer psychology experts
- Cold email copy rules — adapt tone for Vietnamese business culture (more relationship-focused)
- Viral scoring formula — content virality works similarly but channels differ (Facebook dominant over Twitter in Vietnam)

**Data/API integrations to adapt:**
- Replace RB2B (US-focused) with alternative visitor identification for Vietnamese sites
- Outbound: Instantly works globally, usable as-is
- HubSpot: works globally, usable as-is
- Gong: replace with local call recording tools if needed
- GSC/GA4/Ahrefs: fully applicable in Vietnam

**Reference files to copy and customize:**
- `outbound-engine/references/icp-template.md` → create Vietnamese ICP template
- `outbound-engine/references/copy-rules.md` → adapt for Vietnamese email tone
- `content-ops/experts/humanizer.md` → adapt banned vocabulary for Vietnamese content
- `x-longform-post/references/voice-template.md` → create founder voice template per client

### Reusable Code Patterns (Python)
- **Webhook server pattern** (`rb2b_webhook_ingest.py`) — simple HTTP webhook receiver in stdlib
- **Exponential backoff + rate limiting** — all scripts handle 429s gracefully
- **Waterfall enrichment** (`cascade-enricher.py`) — try API 1 → fallback API 2 → LinkedIn → tag
- **Idempotent pipeline** — safe to re-run, dedup catches repeats
- **Batch API calls** — single prompt for multiple variants (efficiency pattern from autoresearch)
- **JSON run logging** — every pipeline run saves auditable JSON log

### SKILL.md Pattern for Claude Code
Each `SKILL.md` file follows this structure — reuse for building custom skills:
```yaml
---
name: skill-name
description: >-
  When to invoke this skill. Trigger phrases. Modes supported.
---

## Preamble (runs on skill start)
[version check + telemetry init commands]

# Skill Name
[brief description]

## When to Use / When NOT to Use
[clear trigger conditions]

## Commands / Workflow
[step-by-step agent instructions with exact CLI commands]

## Configuration
[environment variables table]

## Reference Files
[table of reference files and their purposes]
```

---

## Lessons & Best Practices

### On Experimentation
- Never declare a winner without both statistical significance (p < 0.05) AND meaningful lift (≥ 15%). One alone is not enough.
- Run playbook check BEFORE creating new content — apply proven rules first, then experiment at the margins.
- Batch mode (up to 10 variants) allows rapid multi-variant testing without sequential overhead.
- Suggest next experiments programmatically — don't rely on human creativity for what variable to test next.

### On Content Quality
- 90/100 is the non-negotiable target. 89 is not "close enough" — it means another round.
- The humanizer score is weighted 1.5x because AI-sounding content destroys trust faster than any other flaw.
- After 3 rounds below 90, the problem is strategic (wrong positioning), not tactical (wrong words). Stop optimizing, reframe.
- Learned rejection patterns are gold — every time a user rejects 90+ content, the reason becomes a rule for all future content.

### On Cold Email
- The first sentence is everything. If it doesn't make the prospect think "hm, relevant" — the email is dead.
- Observation-framed stats beat study-framed stats. "Most brands we audit..." beats "According to our data...".
- Soft CTAs convert better than hard CTAs in Step 1. Never ask for a meeting before establishing relevance.
- Step 1 has one job: earn Step 2. Not to close, not to book a call, just to earn a reply.
- Never fabricate: no fake client names, no unverified revenue numbers, no made-up URLs.

### On Sales
- Lead with data (competitive gaps) before mentioning services. The prospect's numbers, not your pitch.
- Present the premium tier first — anchor high so the target tier feels reasonable by comparison.
- The champion tracking pattern (deal resurrector) is high ROI: contacts who change companies bring their problem context to the new company and are already warm.

### On Marketing Operations
- ICP should be auto-learning — use approve/reject signals to update targeting filters, not just a static document.
- Multi-source deduplication is critical before any upload — one duplicate can burn a domain.
- Warm up email accounts for minimum 14 days, score ≥ 80 before sending. Never skip this.
- Keep telemetry opt-in. Never collect code, file paths, or repo content in usage analytics.

### On Agency Business Model
- The expert panel system is directly billable as a "content quality audit" service.
- Autoresearch is directly billable as "landing page optimization" before driving paid traffic.
- The value-based pricing framework shows the path from $10K/mo → $40-100K/mo deals — study the call analyzer scoring rubric and train on it.
- Revenue attribution (content → pipeline → revenue) is the proof layer that justifies retainer renewals.
- These skills work with Claude Code (Anthropic API) and OpenAI — model routing by task type is cost optimization.
