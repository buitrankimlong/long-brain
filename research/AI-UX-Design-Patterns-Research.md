# Comprehensive AI/UX Design Patterns Research
## For AI Products, Chatbots, and AI-Powered Applications
### Research Date: May 2026

---

## Table of Contents
1. [AI Chatbot UX Design Patterns](#1-ai-chatbot-ux-design-patterns)
2. [AI Dashboard Design Patterns](#2-ai-dashboard-design-patterns)
3. [AI Product UX Best Practices](#3-ai-product-ux-best-practices)
4. [AI Form & Input Design](#4-ai-form--input-design)
5. [Design Systems for AI Products](#5-design-systems-for-ai-products)
6. [Inspiration & Examples](#6-inspiration--examples)
7. [Accessibility in AI Products](#7-accessibility-in-ai-products)

---

## 1. AI Chatbot UX Design Patterns

### 1.1 Chat Bubble Design Best Practices

**Alignment & Layout:**
- Align received messages to the LEFT, sent messages to the RIGHT -- this creates a clear visual hierarchy and natural conversation flow
- Use different background colors for different participants (e.g., light gray for AI, blue for user)
- Rounded corners on bubbles (border-radius 12-16px) appear visually clean and approachable
- Add subtle shadows to give bubbles a sense of depth

**Spacing:**
- Padding inside bubbles: 20px top, 10px sides, 15px bottom for readability
- Consistent padding inside all bubbles for a neat appearance
- Group consecutive messages from the same sender with reduced spacing between them

**Typography:**
- Use 14-16px font size for message text
- Clear contrast between message text and bubble background
- Support markdown rendering for AI responses (bold, lists, code blocks, links)

**Sources:**
- [CometChat: UI/UX Best Practices for Chat App Design](https://www.cometchat.com/blog/chat-app-design-best-practices)
- [BricxLabs: 16 Chat UI Design Patterns That Work in 2026](https://bricxlabs.com/blogs/message-screen-ui-deisgn)
- [SimplyAsk: Tips for Designing AI Agent Chat Bubbles](https://www.simplyask.ai/blog/your-ai-agent-chat-bubbles-suck-heres-how-to-make-them-look-cool)
- [Uxcel: Chat & Messaging Best Practices](https://uxcel.com/lessons/chat--messaging-best-practices-001)

---

### 1.2 Typing Indicators & Loading States

**Typing Indicator Design:**
- Use animated bouncing dots (3 dots) inside a chat bubble shape to indicate AI is processing
- Smooth transitions: fade or bounce animations to communicate activity without distraction
- Avatar stack should be vertically aligned with and the same height as the bubble, with 5px spacing between indicator dots
- Remove the indicator once streaming begins

**AI-Specific Loading States (Beyond Spinners):**
- **Processing Stage**: Display a loading indicator like an avatar with accompanying text in the chat bubble (e.g., "Thinking...")
- **Generation Stage**: Switch to streaming text once output begins
- **Skeleton screens** reduce perceived waiting by showing immediate visual progress -- users feel the app is faster even though actual load time is identical
- Shimmer animations moving left-to-right are perceived as shorter in duration than pulsing skeletons
- Avoid displaying a loading state for under one second to prevent UI flickering
- Use "[Generating/Loading] [specific artifact]" as messaging format -- "Generating" for new content, "Loading" for retrieving data

**Key Stat**: A 2025 NNGroup analysis of 50 AI-generated dashboards found 100% had a generic spinner instead of a proper loading state.

**Sources:**
- [Cloudscape Design System: Generative AI Loading States](https://cloudscape.design/patterns/genai/genai-loading-states/)
- [Onething Design: Skeleton Screens vs Loading Spinners](https://www.onething.design/post/skeleton-screens-vs-loading-spinners)
- [NNGroup: Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)
- [VibeCoder: Empty States, Loading States, Error States](https://blog.vibecoder.me/empty-states-loading-states-error-states)

---

### 1.3 Error Handling in Chatbots

**The Graceful Degradation Hierarchy:**
1. **Full AI Response** -- Complex, personalized, context-aware output
2. **Simplified AI Response** -- Basic but accurate information
3. **Rule-Based Response** -- Predefined, reliable answers
4. **Human Handoff** -- Clear escalation to human assistance

**Error Message Best Practices:**
- Use plain language: "We're at capacity" not "Error 503"
- Always confirm user work is saved (reduces anxiety)
- Offer 2-3 clear recovery options: retry, queue, or offline mode
- Use warm colors (amber/yellow) for capacity issues, not harsh red
- Preserve user context and input across error states

**Fallback Design:**
- "Sorry, I didn't get that. I can help you [X] or [Y]. Do you want to try one of those things?" -- redirects users toward capabilities
- Effective fallback strategies recover 74% of failing conversations
- Fallback quality predicts 67% of CSAT variance

**When AI Doesn't Know:**
- The AI should acknowledge limitations, explain issues, and offer next steps
- For every AI feature, always have a manual fallback (e.g., if AI can't auto-categorize, show an uncategorized item with manual selector -- don't show an error)
- Phrases like "I might not have the latest information on this" build trust

**Sources:**
- [AIUX Design Guide: Error Recovery & Graceful Degradation](https://www.aiuxdesign.guide/patterns/error-recovery)
- [Clearly Design: Designing for AI Failures](https://clearly.design/articles/ai-design-4-designing-for-ai-failures)
- [GroovyWeb: 12 UI Mistakes That Kill AI-Powered Apps in 2026](https://www.groovyweb.co/blog/ui-mistakes-ai-apps-2026)
- [Microsoft: Design Graceful Fallbacks and Handoffs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/cux-fallbacks)
- [UXContent: Designing Chatbots Fallback Logic](https://uxcontent.com/designing-chatbots-fallbacks/)

---

### 1.4 Suggested Prompts / Quick Replies

**Types of Prompt Suggestions (per NNGroup):**
- **Use-case prompts**: Examples demonstrating effective AI interaction (different from followup suggestions or autocomplete)
- **Simple**: Short phrases or single sentences -- for broad systems and low-complexity tasks
- **Complex**: Entire conversations, images, or video demos -- for specialized systems and high-complexity tasks

**UI Patterns for Suggestions:**
| Pattern | Best For | Format |
|---------|----------|--------|
| **Pills/Chips** | Broad systems, multiple quick options | Clickable phrases |
| **Cards** | Specialized systems, longer examples | Spacious format with context |
| **Carousels** | Multiple curated use cases | One example at a time |
| **Videos** | Demonstrating workflows | Rich visual context |
| **Libraries** | Exploration and inspiration | Curated collections with outputs |

**Placement:**
- Position suggestions NEAR the text input field -- the primary focus of user attention during AI interaction
- For broad systems, use general examples to showcase capabilities
- Specific and targeted suggestions help users quickly determine relevance (generic prompts rarely engage)

**Personalization:**
- Adapt suggestions based on user expertise level, previous interactions, browsing behavior, and account history
- Track engagement with analytics; randomize display order to isolate content impact from positioning
- Remove consistently ignored suggestions

**Sources:**
- [NNGroup: Designing Use-Case Prompt Suggestions](https://www.nngroup.com/articles/designing-use-case-prompt-suggestions/)
- [SAP Fiori: AI Prompt Input](https://www.sap.com/design-system/fiori-design-web/v1-136/ui-elements/ai-prompt-input/usage)
- [Emarsys Design System: AI Prompt Input](https://designsystem.emarsys.net/patterns/ai-guidelines/ai-prompt-input)

---

### 1.5 Rich Message Types

**Cards:**
- Comprise a title, description, link, and images
- Use for presenting structured information like products, articles, or search results

**Carousels:**
- Horizontally scrollable set of up to 10 vertical rich cards
- Allow users to swipe through related content within a single message
- Ideal for product browsing, recommendations, comparison shopping

**Buttons:**
- Use for quick choices and structured inputs
- Product carousels show scrollable cards with images, prices, and buy buttons
- Buttons reduce typing friction and guide users through structured flows

**Forms in Chat:**
- Embed lightweight forms within the chat for collecting structured data
- Use for collecting shipping addresses, preferences, or multi-field input

**Best Practice:** Use buttons for quick choices, cards for rich results, and carousels for browsing. Don't force everything into plain text.

**Sources:**
- [SMS-iT Blog: RCS Design Patterns: Cards, Carousels, and CTAs](https://blog.smsit.ai/2025/10/21/rcs-design-patterns-cards-carousels-and-ctas/)
- [Microsoft: Add Rich Card Attachments to Messages](https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-add-rich-cards)
- [Sendbird: 15 Chatbot UI Examples](https://sendbird.com/blog/chatbot-ui)
- [AIUX Design Guide: Conversational UI](https://www.aiuxdesign.guide/patterns/conversational-ui)

---

### 1.6 File Upload in Chat

**Design Principles:**
- Upload UX should be minimal and built into the flow -- don't interrupt the routine
- Offer BOTH drag-and-drop AND a traditional click option
- Clearly highlighted drop zone with visual cues (color/border changes) on hover
- Animate the drop with a short transition (100ms) for a "snap into place" feel
- Pair drag-and-drop area with short text outlining file requirements (accepted types, max size)

**Visual Feedback:**
- Dotted border or highlight around the drop zone when active
- Show upload progress indicators within the chat context
- Display file thumbnails/previews after upload

**Sources:**
- [Eleken: File Upload UI Tips for Designers](https://www.eleken.co/blog-posts/file-upload-ui)
- [Uploadcare: File Uploader UX Best Practices](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [NNGroup: Drag-and-Drop](https://www.nngroup.com/articles/drag-drop/)
- [Smashing Magazine: Drag-and-Drop UX Guidelines](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)

---

### 1.7 Voice Input in Chat

**Design Considerations:**
- Voice interfaces need shorter responses, confirmation prompts, and interruption handling compared to text
- Decide whether to use direct live audio processing or chain speech-to-text then text reasoning then text-to-speech
- The best conversational UIs blend chat with structured UI elements (buttons, cards, carousels) so users can switch between typing, clicking, and speaking
- With LLMs like ChatGPT and Claude, Voice UI has shifted from rigid command-and-control to truly conversational

**Emerging Tools:**
- Wispr Flow for voice-to-text dictation
- Pipecat for open-source voice and multimodal conversational AI
- Vercel AI Elements now includes voice components (Speech Input, Transcription, Voice Selector, Persona)

**Sources:**
- [AIUX Design Guide: Conversational UI](https://www.aiuxdesign.guide/patterns/conversational-ui)
- [FuseLabCreative: Voice UI Design Guide 2026](https://fuselabcreative.com/voice-user-interface-design-guide-2026/)
- [UXPin: Designing for Voice UI](https://www.uxpin.com/studio/blog/voice-user-interface/)

---

### 1.8 Multi-Turn Conversation Design

**Key Patterns:**
- Maintain messages as structured arrays with role/content pairs
- Include system messages to establish assistant behavior
- Distinguish between single-turn (one-off completions) and multi-turn (ongoing chat) interactions
- Prepend context or persona information for consistent AI responses
- Disable input fields while responses stream to prevent overlapping calls or scrambled message ordering

**State Management:**
- Use flags like `isLoading` to manage submission state
- Preserve user context across turns
- Support message editing and regeneration within conversation threads
- Implement auto-scroll that watches message array changes

**Sources:**
- [Patterns.dev: AI UI Patterns](https://www.patterns.dev/react/ai-ui-patterns/)
- [AI SDK: Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot)

---

### 1.9 Human Handoff UX

**The Critical Moment:**
The handoff from AI to human agents is the highest-stakes moment in any hybrid model. When done wrong, customers feel they wasted time. When done right, the AI conversation becomes a head start, not a dead end.

**Operational Triggers:**
- Explicit user request for human agent = immediate handoff
- Repeated fallback situations (fallback_count >= 2)
- Low confidence scores on high-value intents like refunds/billing (confidence < 0.4)

**Common Failure Patterns:**
1. **"The Amnesia Problem"**: Agent picks up with no conversation record; customer repeats everything
2. **"The Cold Transfer"**: Handoff without warning or context; customer lands in generic queue

**Three Principles for Great Handoff:**
1. **No Starting Over**: Human agents see the full transcript, AI summary, and detected intent BEFORE greeting the customer
2. **Honest Wait Times**: "About 3 minutes" builds more credibility than silence
3. **Explain the Why**: "I'm connecting you with a specialist who handles shipping exceptions" is better than generic "transferring you"

**Key Stats:**
- 80% of people will only use chatbots if they know a human option exists
- 82% of consumers prefer instant chatbot responses for basic issues but expect smooth path to a person when things get complicated

**Sources:**
- [Standard Beagle: Chatbot Handoff UX](https://standardbeagle.com/chatbot-handoff-ux/)
- [Social Intents: AI Chatbot with Human Handoff Guide](https://www.socialintents.com/blog/ai-chatbot-with-human-handoff/)
- [Bucher+Suter: Escalation Design](https://www.bucher-suter.com/escalation-design-why-ai-fails-at-the-handoff-not-the-automation/)
- [Alhena.ai: Designing Trust: Hybrid AI Support UX](https://alhena.ai/blog/designing-trust-hybrid-ai-human-support/)
- [Beefed.ai: Chatbot Fallback & Escalation Best Practices](https://beefed.ai/en/chatbot-fallback-escalation)

---

### 1.10 Feedback Mechanisms

**Binary Feedback (Thumbs Up/Down):**
- Place thumbs up/down after each AI response
- When thumbs down is selected, show follow-up: "irrelevant, incorrect, too vague, or inappropriate"
- Provide instant confirmation when feedback is submitted
- ChatGPT includes thumbs on each response with detailed comments option on thumbs down

**Limitations of Binary Feedback:**
- Often fails to capture WHY a response was unsatisfactory (accuracy, completeness, tone)
- Should be treated as a full feedback and observability system, not just icons on screen
- Thumbs data helps prompt engineers assess model effectiveness

**Building a Comprehensive System (per Microsoft Research):**
- Binary feedback should connect to: regression catching, hallucination detection, tool failure identification, and value assessment
- Visualize improvement -- show users how their input enhanced system performance
- Enable reversibility -- allow users to reset or undo learned behaviors
- Ensure transparency -- disclose what data drives learning

**Best Practices:**
1. Make feedback obvious -- use thumbs up/down, corrections, and preference controls
2. Acknowledge immediately -- instant confirmation when feedback is submitted
3. Maintain stability -- balance adaptation with system consistency
4. Be transparent about what data is collected and how it's used

**Sources:**
- [Shape of AI: Rating Pattern](https://www.shapeof.ai/patterns/rating)
- [AIUX Design Guide: Feedback Loops](https://www.aiuxdesign.guide/patterns/feedback-loops)
- [Microsoft Data Science: Beyond Thumbs Up and Down](https://medium.com/data-science-at-microsoft/beyond-thumbs-up-and-thumbs-down-a-human-centered-approach-to-evaluation-design-for-llm-products-d2df5c821da5)
- [The Training Boss: Thumbs Up & Down for LLM Responses](https://thetrainingboss.com/thumbs-up-down-for-llm-responses/)

---

### 1.11 Chat History & Search

**Conversation History Design:**
- Conversations automatically saved and named with AI-generated summary of the topic
- Use first user query (or AI summary of first exchange) as default conversation name
- "Contract review -- Acme MSA" is far more useful than a timestamp
- Let users rename conversations manually and delete unneeded ones
- Group conversations by timeframe: "Today," "This month," specific months

**Search Features:**
- Search input field to filter previous conversations
- Show matching keywords with context around search terms
- Typeahead suggestions and search history for faster lookup
- Natural language processing for conversational phrase searching (not just exact keywords)
- List layouts with titles, snippets, and relevant metadata

**PatternFly Implementation (Reference Architecture):**
- Drawer-based conversation history panel with focus trap
- Optional search input with customizable placeholder and ARIA labels
- Optional "New chat" button
- Per-conversation dropdown menus for actions (delete, share, rename)
- Temporal grouping of conversations

**Sources:**
- [PatternFly: Chatbot Conversation History](https://www.patternfly.org/patternfly-ai/chatbot/chatbot-conversation-history/)
- [BricxLabs: 16 Chat UI Design Patterns](https://bricxlabs.com/blogs/message-screen-ui-deisgn)
- [DesignPixil: AI Chatbot Interface Design](https://designpixil.com/blog/ai-chatbot-interface-design)

---

### 1.12 Mobile Chat UX vs Desktop

**Mobile-Specific Guidelines:**
- Chatbot should take up 60-80% of screen height when open
- Width: 90-95% of the screen
- Closed chat button: 50-60px wide for easy tapping
- Mobile-first design is critical -- most customers use phones
- Poor thumb navigation loses sales

**Universal Principles:**
- Responsive layout adapts without breaking conversational flow
- Support both quick replies/buttons for structured inputs AND free-text for natural conversation
- A good chatbot UI feels invisible -- clean, fast, easy to read
- Consistent experience across devices is essential

**Sources:**
- [Jotform: The 20 Best Looking Chatbot UIs in 2026](https://www.jotform.com/ai/agents/best-chatbot-ui/)
- [StoreAgent: 15 Chatbot UI Examples That Convert](https://storeagent.ai/chatbot-ui-examples/)
- [Tidio: 7 Best Chatbot UI Design Examples](https://www.tidio.com/blog/chatbot-ui/)
- [Lazarev Agency: 33 Chatbot UI Examples](https://www.lazarev.agency/articles/chatbot-ui-examples)

---

## 2. AI Dashboard Design Patterns

### 2.1 AI Analytics Dashboard Layouts

**Cognitive Load Management:**
- Group related metrics into visible sections with clear labels
- Establish visual hierarchy where the 3-5 most important metrics read first
- Use progressive disclosure -- supporting detail available on demand
- Whitespace is essential for readability

**Anti-Patterns to Avoid:**
- Pie charts with more than 4 segments
- 3D chart effects
- Dual-axis charts
- Decorative visualizations that fill space without informing decisions

**Sources:**
- [Eleken: AI Dashboard Design Guide](https://www.eleken.co/blog-posts/ai-dashboard-design)
- [Dribbble: AI Dashboard Inspiration](https://dribbble.com/search/ai-dashboard)
- [Muzli: 60+ Dashboard Design Ideas (2026 Trends)](https://muz.li/inspiration/dashboard-inspiration/)

---

### 2.2 Token Usage Visualization

**Open-Source Dashboard Tools:**
- **Tokscale**: CLI tool + visualization dashboard for tracking token usage and costs across Claude Code, Cursor, OpenCode, Codex, Gemini, Kimi, and more. Features a global leaderboard + 2D/3D contributions graph
- **Tokdash**: Beautiful visualization and analytics for LLM API consumption with 3D visualizations, cost tracking, and accurate token counting
- **Codeburn**: Interactive TUI dashboard for terminal-based cost monitoring with cost projections based on historical usage and breakdown by functionality (debugging, code completion, documentation)
- **OpenCode Monitor**: Real-time token consumption with model-specific pricing, budget setting, and alerts

**Enterprise Solutions:**
- **Grafana + Anthropic Integration**: Pre-built API usage dashboard tracking token consumption, costs, and model usage
- **Langfuse**: Tracks usage and costs of LLM generations with breakdowns by usage types
- **Microsoft AI Foundry + Azure API Management**: Granular token-level telemetry with custom dashboards

**Sources:**
- [Tokscale GitHub](https://github.com/junhoyeo/tokscale)
- [Tokdash GitHub](https://github.com/JingbiaoMei/Tokdash)
- [Grafana: Monitor Claude Usage and Costs](https://grafana.com/blog/how-to-monitor-claude-usage-and-costs-introducing-the-anthropic-integration-for-grafana-cloud/)
- [Langfuse: Token & Cost Tracking](https://langfuse.com/docs/observability/features/token-and-cost-tracking)
- [n8n: AI Model Usage Dashboard Template](https://n8n.io/workflows/9497-ai-model-usage-dashboard-track-token-metrics-and-costs-for-llm-workflows/)

---

### 2.3 Conversation Analytics & Model Performance

**Key Metrics to Track:**
- Completion rate, fallback rate, misunderstanding rate
- Resolution time and satisfaction scores
- Token usage per conversation
- Cost per interaction
- User engagement patterns

---

### 2.4 Knowledge Base Management UI

**Design Principles:**
- Anticipate what users might need to do; ensure elements are easy to access, understand, and use
- Functions and layout should not be complicated, allowing team members to familiarize rapidly
- Support initial data/query training and fine-tuning based on user behavior and feedback
- Integrate AI-powered search that learns from search patterns

**Features to Include:**
- Document upload and management
- Content organization and tagging
- AI training status indicators
- Content gap identification
- Usage analytics showing which articles are most/least helpful

**Sources:**
- [Zendesk: AI Knowledge Base Complete Guide](https://www.zendesk.com/service/help-center/ai-knowledge-base/)
- [Guru: AI Knowledge Base Ultimate Guide](https://www.getguru.com/reference/ai-knowledge-base)
- [Document360: AI-Powered Knowledge Base Software](https://document360.com/blog/ai-powered-knowledge-base/)

---

## 3. AI Product UX Best Practices

### 3.1 Showing AI Confidence Levels

**Implementation Approaches:**
- Phrases like "I'm 70 percent confident" or "I might be wrong" help users gauge when to double-check
- Three-level rating system (High/Moderate/Low) to indicate AI certainty
- 63% of users are more likely to rely on AI systems that display confidence levels or explain reasoning

**Visual Patterns:**
- Color-coded indicators (green/yellow/red for high/medium/low confidence)
- Confidence bars or percentage displays
- Textual hedging language integrated into responses

**Sources:**
- [ScreamingBox: Designing AI Interfaces Users Can Trust](https://www.screamingbox.net/blog/designing-ai-interfaces-users-can-trust-how-transparency-ux-and-explainability-build-confidence)
- [ACM: Impact of Confidence Ratings on User Trust in LLMs](https://dl.acm.org/doi/10.1145/3708319.3734178)
- [UXmatters: Design Psychology of Trust in AI](https://www.uxmatters.com/mt/archives/2025/11/the-design-psychology-of-trust-in-ai-crafting-experiences-users-believe-in.php)

---

### 3.2 Explaining AI Decisions (XAI)

**Principles:**
- Explain for understanding, not completeness (Google PAIR guidebook)
- Focus on sharing the information users need to make decisions; avoid explaining everything
- Pair text with visuals -- makes explanations faster, richer, and more trustworthy

**Transparency Layers:**
1. **Algorithmic Transparency**: Revealing logic, data sources, and processes
2. **Interaction Transparency**: Showing how AI uses input during live use
3. **Social Transparency**: Acknowledging ethical, societal, and fairness implications

**Sources:**
- [Eleken: Explainable AI UI Design (XAI)](https://www.eleken.co/blog-posts/explainable-ai-ui-design-xai)
- [Standard Beagle: Designing Trust in AI Products](https://standardbeagle.com/designing-trust-in-ai-products/)
- [Aubergine: How UX Design Can Help Build Trust in AI Systems](https://www.aubergine.co/insights/building-trust-in-ai-through-design)

---

### 3.3 AI Transparency Patterns

**Shape of AI "Trust Builders" Category:**
- **Caveats**: Warnings about limitations
- **Consent**: Getting user permission
- **Data Ownership**: Clarifying who owns what
- **Disclosure**: Marking AI-generated content
- **Footprints**: Showing what data was used
- **Incognito Mode**: Privacy controls
- **Watermarks**: Identifying AI-generated content

**Sources:**
- [Shape of AI](https://www.shapeof.ai/)
- [IBM: What Is AI Transparency](https://www.ibm.com/think/topics/ai-transparency)
- [Zendesk: AI Transparency Comprehensive Guide](https://www.zendesk.com/blog/ai-transparency/)

---

### 3.4 Progressive Disclosure for AI Features

**Core Principle:**
Show essential features first, unveil advanced capabilities on demand. Prevents cognitive overload in powerful AI tools.

**Implementation:**
1. Start with fundamental information; reveal sophisticated AI features only when needed
2. Use clear triggers: "Show more" buttons, tooltips, step-by-step flows
3. Cap disclosure at 2-3 layers maximum
4. Test with both novice and expert users

**Real-World Examples:**
- **Loom**: Shows basic video tools first, reveals AI transcription on "more options"
- **Google Docs**: Essential writing tools reveal Smart Compose
- **ChatGPT**: Simple interface with expandable settings menu

**Sources:**
- [AIUX Design Guide: Progressive Disclosure](https://www.aiuxdesign.guide/patterns/progressive-disclosure)
- [NNGroup: Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/)
- [Agentic Design: Progressive Disclosure Patterns](https://agentic-design.ai/patterns/ui-ux-patterns/progressive-disclosure-patterns)

---

### 3.5 Onboarding for AI Products

**First Impressions:**
- Most users decide within the first 5 seconds whether a chatbot is worth engaging
- Avoid long welcome messages or vague opening lines
- Open with a crisp prompt: "Need help with your order or account?" followed by clear reply buttons

**Google Gemini Example:**
- Clean empty state with friendly greeting: "Hello, Sam. How can I help you today?"
- Four cards with different CTA prompts showcasing a broad variety of actions the AI can solve

**Onboarding Principles (NNGroup):**
- Tutorials should be brief yet informative
- Rather than displaying all features at once, introduce them as users engage with each specific feature
- Targeted approach reduces cognitive overload and increases retention

**AI-Specific Empty States:**
- Dashboard empty states: "Need help getting started? Ask our AI assistant!"
- "I see your project list is empty. Would you like me to walk you through creating your first project?"
- Empty states are major onboarding opportunities -- blank canvases for education, nudging, or personality

**Sources:**
- [NNGroup: New Users Need Support with Generative-AI Tools](https://www.nngroup.com/articles/new-AI-users-onboarding/)
- [Eleken: Empty State UX Examples](https://www.eleken.co/blog-posts/empty-state-ux)
- [NNGroup: Designing Empty States](https://www.nngroup.com/articles/empty-state-interface-design/)
- [Smashing Magazine: Empty States in User Onboarding](https://www.smashingmagazine.com/2017/02/user-onboarding-empty-states-mobile-apps/)

---

### 3.6 Streaming Text Animation Patterns

**Smooth Streaming:**
- Receive chunks from the server as fast as possible, but stream to users at a consistent, readable pace
- Token-by-token rendering is the baseline expectation for AI chat in 2026
- Components need to handle markdown rendering mid-stream, code block detection while tokens arrive, and graceful error states when stream fails

**Technical Architecture:**
- Server-Sent Events (SSE): Backend returns `text/event-stream` and pushes structured events
- Dynamic message replacement for typing animation while streaming
- Update latest message continuously for live assistant feel

**Implementation Best Practice:**
- Server-side: Enable `stream: true` on model API calls
- Client-side: Use readers to consume response chunks incrementally
- Update component state as new text arrives
- Auto-scroll to bottom as messages grow

**Sources:**
- [Upstash: Smooth Text Streaming in AI SDK v5](https://upstash.com/blog/smooth-streaming)
- [Patterns.dev: AI UI Patterns](https://www.patterns.dev/react/ai-ui-patterns/)
- [AI SDK: Chatbot](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot)

---

## 4. AI Form & Input Design

### 4.1 Prompt Input Field Design

**Emarsys Design System AI Prompt Input Anatomy:**
- **Label**: Mandatory (for accessibility -- placeholders disappear when typing)
- **Input field**: Text input or textarea for prompt entry
- **AI button**: Triggers generation (features AI icon), disabled until valid input exists
- **Character counter**: Shows remaining characters or overage (optional)
- **Clear icon**: Appears when field contains value; removes content on click
- **AI unit counter**: Shows available AI units remaining with tooltip

**Variants:**
1. With Label (required for accessibility)
2. With Character Counter
3. With Textarea (for longer inputs; auto-height with max constraints)
4. With AI Unit Counter

**States:** Enabled, Disabled, Suggestions & Autocomplete, Clear Icon

**Best Practices:**
- Improve efficiency with predictive text features: typeahead suggestions, auto-completion, error correction
- Create personalized interactions adapting to user input over time
- Support multiple input modalities (text, voice, file)
- Use specific, concise placeholder text guiding users on AI capabilities
- Never repeat labels in placeholder text

**When NOT to Use Prompt Input:**
- Straightforward tasks with limited AI functions (use quick prompts instead)
- Highly technical domain-specific knowledge

**Sources:**
- [Emarsys Design System: AI Prompt Input](https://designsystem.emarsys.net/patterns/ai-guidelines/ai-prompt-input)
- [SAP Fiori: AI Prompt Input](https://www.sap.com/design-system/fiori-design-web/v1-136/ui-elements/ai-prompt-input/usage)
- [UI Patterns: Input Prompt](https://ui-patterns.com/patterns/InputPrompt)

---

### 4.2 Context/File Attachment UX

See Section 1.6 (File Upload in Chat) for detailed patterns.

**Additional Context Attachment Patterns (Shape of AI "Tuners"):**
- **Attachments**: Files and documents added to context
- **Connectors**: Links to external data sources
- **Filters**: Narrowing scope of AI processing
- **Parameters**: Fine-tuning numerical/categorical inputs

---

### 4.3 Model Selection UI

**Design Patterns:**
- Allow users to select and switch between different AI models
- Show model trade-offs: cost, latency, context window, capability level
- Assign distinct models for different features (e.g., fast model for summaries, powerful model for complex tasks)
- UI buttons to cycle between outputs generated by each model

**Zed Editor Example:**
- Default model for agentic work (agent panel, inline assistant): claude-sonnet-4-5
- Default "fast" model (thread summarization, git commit messages): gpt-5-nano
- Users can manually edit default_model in settings
- Distinct model assignments per feature type

**Sources:**
- [Zed: Agent Settings](https://zed.dev/docs/ai/agent-settings)
- [GainHQ: AI Model Selection Guide](https://gainhq.com/blog/ai-model-selection/)

---

### 4.4 Settings & Configuration Panels

**Key Configuration Areas:**
- Model selection (per-feature model assignment)
- Temperature / creativity controls
- Context window / token limits
- Response length preferences
- Safety / content filter settings
- API key management
- Notification preferences
- Data retention / privacy settings

---

### 4.5 Conversation Starter Templates

**Design Principles:**
- Show suggested prompt bubbles like "Brainstorm startup ideas" or "Summarize a meeting" to encourage exploration
- Use general examples for broad AI tools to showcase capabilities at first glance
- Broad examples are more approachable than niche or trendy prompts
- Include 3-5 key strengths aligned with user needs

**Welcome Message Types:**
- **Informative**: "Hi! I can help you check balances, transfer money, and more."
- **Instructional**: "To get started, type 'Balance' to check your account balance or 'Transfer' to send money."
- **Engaging**: Use personality-appropriate tone to make the AI approachable

**Sources:**
- [Jotform: 45+ Chatbot Welcome Messages](https://www.jotform.com/ai/agents/ai-chatbot-welcome-examples/)
- [FlowHunt: 30+ Chatbot Welcome Messages](https://www.flowhunt.io/blog/30-chatbot-welcome-messages-to-make-a-great-first-impression/)
- [Zapier: 8 AI Prompt Templates](https://zapier.com/blog/ai-prompt-templates/)

---

## 5. Design Systems for AI Products

### 5.1 Vercel AI SDK + AI Elements

**Overview:** AI Elements is an open-source library of 20+ production-ready React components built on shadcn/ui, tightly integrated with AI SDK hooks like `useChat`.

**Component Categories:**

**Chatbot Components:**
Attachments, Chain of Thought, Checkpoint, Confirmation, Context, Conversation, Inline Citation, Message, Model Selector, Plan, Prompt Input, Queue, Reasoning, Shimmer, Sources, Suggestion, Task, Tool

**Code Components:**
Agent, Artifact, Code Block, Commit, Environment Variables, File Tree, JSX Preview, Package Info, Sandbox, Schema Display, Snippet, Stack Trace, Terminal, Test Results, Web Preview

**Voice Components:**
Audio Player, Mic Selector, Persona (animated AI visual with states: idle, listening, thinking, speaking, asleep), Speech Input, Transcription, Voice Selector

**Workflow Components:**
Canvas, Connection, Controls, Edge, Node, Panel, Toolbar

**Key Hooks:** `useChat`, `useCompletion` for managing messages, input, submission, and streaming

**Sources:**
- [Vercel: Introducing AI Elements](https://vercel.com/changelog/introducing-ai-elements)
- [AI Elements](https://elements.ai-sdk.dev/)
- [AI SDK UI Documentation](https://ai-sdk.dev/docs/ai-sdk-ui)
- [GitHub: vercel/ai-elements](https://github.com/vercel/ai-elements)

---

### 5.2 shadcn/ui Chat Components

**shadcn-chatbot-kit (by Blazity):**
- Built on top of and fully compatible with shadcn/ui ecosystem
- Beautiful, customizable AI chatbots with full control over components
- Components installed to your codebase for full customization

**shadcn-chat (by Jakob Hoeg):**
- CLI for adding customizable and re-usable chat components
- Build chat interfaces in minutes

**Zola:**
- Open-source Shadcn chat UI for interacting with multiple AI models
- Built with Next.js, shadcn/ui, and prompt-kit

**Sources:**
- [shadcn-chatbot-kit](https://shadcn-chatbot-kit.vercel.app/)
- [GitHub: Blazity/shadcn-chatbot-kit](https://github.com/Blazity/shadcn-chatbot-kit)
- [GitHub: jakobhoeg/shadcn-chat](https://github.com/jakobhoeg/shadcn-chat)
- [shadcn.io: 50+ React AI Chat Components](https://www.shadcn.io/ai)

---

### 5.3 prompt-kit Components

**Core Components:**
- Prompt Input, Message, Chat Container, Markdown, Code Block

**Conversation Elements:**
- Avatar, System Message, Reasoning, Chain of Thought, Thinking Bar

**Interactive Features:**
- Prompt Suggestion, File Upload, Feedback Bar, Tool, Scroll Button

**Visual Elements:**
- Loader, Text Shimmer, Image, Source (displays website sources with URL details, titles, hover descriptions)

**Layout Helpers:**
- Steps (sequential process visualization)

Built on shadcn/ui with React, Tailwind CSS, and TypeScript. Free, accessible, customizable.

**Sources:**
- [prompt-kit: Chat UI](https://www.prompt-kit.com/chat-ui)
- [All Shadcn: Prompt Kit](https://allshadcn.com/tools/prompt-kit/)

---

### 5.4 Ant Design X (AI Components)

**Design Paradigm: RICH**
- **R**ole, **I**ntention, **C**onversation, **H**ybrid UI

**Four-Stage Interaction Flow:** Awaken, Express, Confirm, Feedback

**Components:**
- **Welcome** (Activate category)
- **User Guide** (Activate category)
- **Quick Commands** (Execute category)
- **Loading Progress** (Confirm category)
- **Results** (Feedback category)
- **Manage Chats** (General category)
- **@ant-design/x-card**: Dynamic card rendering via A2UI protocol for AI agents to build and render interactive interfaces through structured JSON streams

**Note on Accessibility:** Unlike Material Design which has accessibility "baked-in" to every component, Ant Design leaves this to developers.

**Sources:**
- [Ant Design X](https://x.ant.design/)
- [GitHub: ant-design/x](https://github.com/ant-design/x)

---

### 5.5 Other Notable Libraries

**assistant-ui (~7.9k GitHub stars):**
- Most popular UI library for building AI chat
- Composable primitives for any chat UX
- Production-ready: streaming, auto-scroll, retries, attachments, markdown, code highlighting, voice input
- React-only (framework lock-in)
- [assistant-ui.com](https://www.assistant-ui.com/)

**CopilotKit (~28.6k GitHub stars):**
- Full agent framework with UI (commercial options)
- Deep agent-app state sync, generative UI
- Heaviest lock-in (architecture/runtime)
- [GitHub: CopilotKit](https://github.com/CopilotKit/CopilotKit)

**Deep Chat (~3.3k GitHub stars):**
- Single Web Component, framework-agnostic
- Built-in connections to OpenAI, HuggingFace, Cohere, Azure
- Speech-to-text, text-to-speech, file uploads, image handling
- Functional chat in under 10 minutes
- Configuration-based rather than composable

**TanStack AI (Alpha):**
- From creators of React Query
- Framework-agnostic hooks, type-safe
- No pre-built UI components yet; watch this space

**Chainlit (~11.4k GitHub stars):**
- Python-first, full-stack
- Polished web UI with reasoning steps
- Community-maintained since May 2025

**Google A2UI:**
- Declarative format, framework-agnostic
- Agent-generated UI without XSS risks
- Infrastructure layer, not complete solution

**Sources:**
- [DEV.to: I Evaluated Every AI Chat UI Library in 2026](https://dev.to/alexander_lukashov/i-evaluated-every-ai-chat-ui-library-in-2026-heres-what-i-found-and-what-i-built-4p10)
- [Medium: Overview of UI Libraries for AI Chat Interfaces 2026](https://alexander-lukashov.medium.com/the-overview-of-ui-libraries-for-ai-chat-interfaces-in-2026-146a1492114a)
- [TheFrontKit: Best AI Chat UI Kits 2026](https://thefrontkit.com/blogs/best-ai-chat-ui-kits-2026)

---

### 5.6 AI UX Pattern Catalogs & Guidebooks

**The Shape of AI (shapeof.ai):**
Pattern library with 6 categories:
1. **Wayfinders**: Galleries, follow-ups, initial CTAs, nudges, prompt details, randomizers, suggestions, templates
2. **Prompt Actions**: Auto-fill, chained actions, expand, inline actions, inpainting, madlibs, open inputs, regenerate, restructure, restyle, summary, synthesis, transform
3. **Tuners**: Attachments, connectors, filters, model management, modes, parameters, preset styles, prompt enhancers, saved styles, voice/tone
4. **Governors**: Action plans, branches, citations, controls, cost estimates, draft mode, memory, references, sample responses, shared vision, stream of thought, variations, verification
5. **Trust Builders**: Caveats, consent, data ownership, disclosure, footprints, incognito mode, watermarks
6. **Identifiers**: Avatars, color, iconography, naming, personality

**Google PAIR People + AI Guidebook (pair.withgoogle.com/guidebook):**
Chapters: User Needs + Defining Success; Data Collection + Evaluation; Mental Models; Explainability + Trust; Feedback + Control; Errors + Graceful Failure. Includes design patterns, case studies, workshop kit, and glossary.

**Other Catalogs:**
- [aiuxdesign.guide](https://www.aiuxdesign.guide/) -- AI UX Design Patterns with detailed pattern pages
- [aiverse.design](https://www.aiverse.design/) -- Playbook for designing AI products
- [aiuxpatterns.com](https://www.aiuxpatterns.com/) -- AI UX Patterns Guide
- [Smashing Magazine: Design Patterns for AI Interfaces](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/)

**Sources:**
- [Shape of AI](https://www.shapeof.ai/)
- [Google PAIR Guidebook](https://pair.withgoogle.com/guidebook/)
- [AIUX Design Guide](https://www.aiuxdesign.guide/)

---

## 6. Inspiration & Examples

### 6.1 Best AI Product Designs to Study

**Tier 1 - Industry Leaders:**
- **ChatGPT**: Ample white space, suggested prompts guiding capability exploration, multifunctional support (voice input, file uploads), thumbs up/down on each response
- **Claude**: Explains WHY each UX decision exists, connects user behavior to product design and business outcomes; Opus 4.7 improved vision with high-res image support
- **Perplexity**: Clear screen-by-screen breakdown, lists specific UI elements, search-first paradigm with citations to original sources
- **Notion AI**: Best example of AI that makes an existing product better rather than standalone -- intelligence woven into workspace
- **Jasper**: Found its niche going deep as the best AI platform for marketing teams specifically

**Tier 2 - Noteworthy Designs:**
- **Cleo** (fintech chatbot): Witty humor, GIFs, emojis making financial advice entertaining; vibrant visuals and interactive budgeting tools
- **PayPal Support Chat**: Guided responses with clarifying questions, availability notifications, alternative self-service resources
- **Privado Dining AI Agent**: Intelligence embedded directly into workflow with context-aware summaries and proactive conflict detection

**Sources:**
- [Eleken: 31 Chatbot UI Examples from Product Designers](https://www.eleken.co/blog-posts/chatbot-ui-examples)
- [Lazarev Agency: 33 Chatbot UI Examples](https://www.lazarev.agency/articles/chatbot-ui-examples)
- [Jotform: 20 Best Looking Chatbot UIs](https://www.jotform.com/ai/agents/best-chatbot-ui/)
- [Pickaxe: Top 15 AI Platforms in 2026](https://pickaxe.co/post/top-ai-platforms)

---

### 6.2 UI Analysis: ChatGPT vs Claude vs Perplexity

**ChatGPT:**
- Conversational chatbot with GPT-5.4 (most powerful version)
- Designed to generate text, reason, execute code, analyze documents, maintain long conversations
- Clean interface prioritizing the conversation

**Claude:**
- Better for designing products users actually stick with
- Connects user behavior to product design and business outcomes
- Claude Design (April 2026) for visual deliverables

**Perplexity:**
- Search engine powered by AI with real-time web information
- Synthesizes and returns answers with citations
- Perplexity Computer (Feb 2026): Cloud-based agent orchestrating 19 different AI models for multi-step workflows
- Model-agnostic design supporting Claude, Gemini, and OpenAI

**Sources:**
- [ClickForest: ChatGPT vs Claude vs Perplexity Comparison 2026](https://www.clickforest.com/en/blog/ai-tools-comparison)
- [UX Collective: Time to Magic Moment: Claude, ChatGPT & Perplexity](https://uxdesign.cc/time-to-magic-moment-claude-chatgpt-perplexity-7df7ec3a4fe6)
- [AI Insider: ChatGPT vs Claude vs Gemini vs Perplexity 2026](https://aiinsider.in/ai-learning/chatgpt-vs-claude-vs-gemini-vs-perplexity-2026/)

---

### 6.3 Awards & Showcases

- **A' Artificial Intelligence and Machine Learning Design Award 2026**: [competition.adesignaward.com](https://competition.adesignaward.com/ada-category.php?C=142)
- **The AI Design Awards**: [designaward.ai](https://designaward.ai/) -- A global stage for AI's brightest creators
- **Future Product Days Awards 2026**: AI, UX Design, and Entrepreneurship categories; Copenhagen, Sept 23 2026
- **Tom's Guide AI Awards 2026**: [tomsguide.com](https://www.tomsguide.com/ai/toms-guide-ai-awards-2026)
- **The National AI Awards 2026**: [thenationalaiawards.com](https://thenationalaiawards.com/awards/)

**Design Inspiration Platforms:**
- [Dribbble: AI Dashboard](https://dribbble.com/search/ai-dashboard)
- [Dribbble: Chat History](https://dribbble.com/search/chat-history)
- [Mobbin: Mobile Chat UI Screens](https://mobbin.com/explore/mobile/screens/chat-bot)
- [Muzli: Dashboard Inspiration](https://muz.li/inspiration/dashboard-inspiration/)

---

## 7. Accessibility in AI Products

### 7.1 Screen Reader Compatibility

**Requirements:**
- Use semantic HTML and ARIA roles for screen reader compatibility
- Each conversation block must be identifiable -- screen reader users must know if message is from bot or user
- Use ARIA live regions to announce new messages
- Provide meaningful alt text for all interactive elements

**Key Stat:** WebAIM's 2025 survey found 87% of assistive technology users encountered at least one AI interface failure weekly. For 63%, these failures meant they could not complete tasks on AI-powered customer service portals.

**Sources:**
- [BOIA: Five Key Accessibility Considerations for Chatbots](https://www.boia.org/blog/five-key-accessibility-considerations-for-chatbots)
- [SiteLint: Making Chatbots Accessible](https://www.sitelint.com/blog/making-chatbots-accessible-a-guide-to-enhance-usability-for-users-with-disabilities)

---

### 7.2 Keyboard Navigation

**Requirements:**
- The entire conversation must be navigable via keyboard with and without assistive technology
- Add `tabindex` attribute to the conversation container to make it keyboard focusable and scrollable using arrow keys
- Full keyboard navigation enabling users who cannot use a mouse to interact with the chatbot
- Common complaint: chatbots that ignore keyboard navigation after a few responses

**Sources:**
- [CANAXESS: Accessible Chatbot Design](https://www.canaxess.com.au/infocard/chatbots/)
- [Inovarc AI: Chatbot Accessibility Common Issues](https://inovarcai.io/chatbot-accessibility-common-issues-and-fixes/)

---

### 7.3 Color Contrast & Status Indicators

**Requirements:**
- Comply with WCAG color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Use warm colors (amber/yellow) for capacity issues, not harsh red
- Don't rely on color alone to convey status -- use icons, text, or patterns as well
- Test with color blindness simulators

---

### 7.4 Alt Text for AI-Generated Images

**Best Practice:**
- Modern AI tools can generate meaningful alt text automatically
- AI can adapt layouts to cognitive preferences
- Always provide descriptive alt text for any images generated by AI
- Include context about what the image represents, not just what it looks like

---

### 7.5 WCAG Compliance

**Key Standards:**
- Platform should support or be configurable to comply with latest WCAG guidelines
- Material Design has accessibility "baked-in" to every component; Ant Design leaves it to developers
- AI-generated interfaces are often NOT accessible by default -- 87% of AI-generated dashboards in one study had no empty state design, and 78% had no error state design

**Critical Gaps:**
- Focus management during streaming responses
- Announcing new content without disrupting reading flow
- Providing accessible alternatives for visual-only features (confidence bars, loading animations)
- Ensuring form controls within chat (buttons, file uploads) are fully keyboard accessible

**Sources:**
- [BRICS-ECON: Accessibility Risks in AI-Generated Interfaces](https://brics-econ.org/accessibility-risks-in-ai-generated-interfaces-wcag-and-real-world-failures)
- [AEL Data: How to Build Accessible Chatbots](https://aeldata.com/how-to-build-accessible-chatbots-for-users-with-disabilities/)

---

## Quick Reference: Key Resources

### Pattern Libraries & Guidebooks
| Resource | URL | Focus |
|----------|-----|-------|
| Shape of AI | https://www.shapeof.ai/ | AI UX pattern catalog (6 categories, dozens of patterns) |
| Google PAIR Guidebook | https://pair.withgoogle.com/guidebook/ | Human-centered AI design (chapters + patterns) |
| AIUX Design Guide | https://www.aiuxdesign.guide/ | Detailed AI UX pattern pages |
| Aiverse | https://www.aiverse.design/ | Playbook for designing AI products |
| Patterns.dev AI | https://www.patterns.dev/react/ai-ui-patterns/ | Technical implementation patterns |

### Component Libraries
| Library | URL | Framework | Stars |
|---------|-----|-----------|-------|
| Vercel AI Elements | https://elements.ai-sdk.dev/ | React (shadcn/ui) | Vercel-backed |
| assistant-ui | https://www.assistant-ui.com/ | React | ~7.9k |
| CopilotKit | https://github.com/CopilotKit/CopilotKit | React | ~28.6k |
| prompt-kit | https://www.prompt-kit.com/ | React (shadcn/ui) | -- |
| Deep Chat | https://github.com/OvidijusParsworthy/deep-chat | Web Components | ~3.3k |
| Ant Design X | https://x.ant.design/ | React | -- |
| shadcn-chatbot-kit | https://shadcn-chatbot-kit.vercel.app/ | React (shadcn/ui) | -- |
| Chainlit | https://github.com/Chainlit/chainlit | Python | ~11.4k |

### Design Inspiration
| Resource | URL |
|----------|-----|
| Dribbble AI Dashboard | https://dribbble.com/search/ai-dashboard |
| Mobbin Chat Bot Screens | https://mobbin.com/explore/mobile/screens/chat-bot |
| Muzli Dashboards | https://muz.li/inspiration/dashboard-inspiration/ |
| Eleken Chatbot Examples | https://www.eleken.co/blog-posts/chatbot-ui-examples |
| Lazarev Chatbot Examples | https://www.lazarev.agency/articles/chatbot-ui-examples |

---

*Research compiled from 50+ web sources, May 2026*
