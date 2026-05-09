---
tags: [knowledge, tools, browser-use, automation, playwright, ai-agent]
source_repo: browser-use
files_read: 28
---

# Browser Use - Knowledge Extraction

## Overview & Architecture

Browser Use is an async Python (>=3.11) library that enables AI agents to autonomously control web browsers via Chrome DevTools Protocol (CDP). It bridges LLMs and real browser sessions: the LLM reasons about DOM state and screenshots, then emits structured action decisions which are dispatched through an event bus and executed via CDP.

**Version:** 0.12.6 (as of extraction date)
**License:** MIT
**Core repo:** https://github.com/browser-use/browser-use

### High-Level Architecture

```
User Task String
      |
   [Agent]          <- orchestrator: task + LLM + browser loop
      |
   [MessageManager] <- assembles prompts from history + browser state
      |
   [LLM]            <- OpenAI / Anthropic / Google / Groq / Ollama / etc.
      |
   [AgentOutput]    <- structured JSON: thinking + evaluation + memory + actions[]
      |
   [Tools/Registry] <- maps action names to handler functions
      |
   [EventBus]       <- bubus event bus dispatches events
      |
   [BrowserSession] <- CDP session manager with watchdog services
      |
   [DomService]     <- extracts and serializes DOM tree
```

**Key design principles:**
- Event-driven: all browser interactions go through a typed event bus (`bubus`)
- Pydantic v2 models everywhere for data validation
- Lazy imports in `__init__.py` for fast startup
- Watchdog pattern: each browser concern is a separate watchdog service
- `service.py` holds main logic, `views.py` holds pydantic models for each subcomponent

---

## Tech Stack & Dependencies

### Core Runtime
```toml
# Python
requires-python = ">=3.11,<4.0"

# Browser control
cdp-use==1.4.5        # typed CDP protocol wrapper
bubus==1.5.6          # event bus

# LLM providers (all included by default)
openai==2.16.0
anthropic==0.76.0
google-genai==1.65.0
groq==1.0.0
ollama==0.6.1

# Data validation
pydantic==2.12.5

# Async
aiohttp==3.13.4
anyio==4.12.1

# DOM processing
markdownify==1.2.2    # HTML -> Markdown for LLM consumption

# File processing
pypdf==6.10.2
reportlab==4.4.9
python-docx==1.2.0
pillow==12.2.0        # image processing for vision

# Protocol
mcp==1.26.0           # Model Context Protocol

# Observability
posthog==7.7.0        # telemetry
```

### Optional Extras
```toml
cli = ["textual==7.4.0"]                  # TUI interface
aws = ["boto3==1.42.37"]                  # AWS Bedrock
oci = ["oci==2.166.0"]                    # Oracle Cloud
video = ["imageio[ffmpeg]==2.37.2"]       # session recording
```

### Supported LLM Providers
All exposed via unified `BaseChatModel` interface in `browser_use/llm/`:
- `ChatOpenAI` (GPT-4o, GPT-4.1, etc.)
- `ChatAnthropic` (Claude Sonnet, Opus, Haiku)
- `ChatGoogle` (Gemini 2.0, 2.5)
- `ChatBrowserUse` (fine-tuned bu-30b-a3b model, $0.20/1M input tokens)
- `ChatGroq`, `ChatOllama`, `ChatMistral`, `ChatLiteLLM`, `ChatAzureOpenAI`
- `ChatVercel`, `ChatDeepSeek`, `ChatOCIRaw`, `ChatCerebras`

---

## Agent Loop & Decision Making

### The Step Loop

The agent runs in a `while self.state.n_steps <= max_steps` loop. Each step has 3 phases:

```python
async def step(self, step_info: AgentStepInfo | None = None) -> None:
    try:
        # Phase 1: Gather browser state, build prompt messages
        browser_state_summary = await self._prepare_context(step_info)

        # Phase 2: Call LLM, get structured action output
        await self._get_next_action(browser_state_summary)

        # Phase 3: Execute the actions returned by LLM
        await self._execute_actions()

        # Phase 4: Post-processing (downloads, loop detection, plan update)
        await self._post_process()

    except Exception as e:
        await self._handle_step_error(e)
    finally:
        await self._finalize(browser_state_summary)
```

### AgentOutput Structure

Every LLM call returns a structured `AgentOutput`:

```python
class AgentOutput(BaseModel):
    thinking: str | None           # chain-of-thought (optional, disabled in flash_mode)
    evaluation_previous_goal: str  # was the last action successful?
    memory: str                    # what to remember across steps
    next_goal: str                 # immediate goal this step
    current_plan_item: int | None  # which plan step is active
    plan_update: list[str] | None  # provide new plan if needed
    action: list[ActionModel]      # 1-5 actions to execute
```

### Agent Modes

Three output variants are created dynamically from the same base:

| Mode | Schema | Use case |
|------|--------|----------|
| Default (`use_thinking=True`) | Full with thinking field | Most models |
| No-thinking | evaluation + memory + next_goal + action | Faster, lower cost |
| Flash mode | action only | browser-use fine-tuned model |

Flash mode automatically activates when using `ChatBrowserUse()`.

### Planning System

The agent has a built-in planning feature:
- LLM can emit `plan_update: ["step1", "step2", ...]` to set or revise a plan
- `plan_update` tracks each step's status: `pending` / `current` / `done` / `skipped`
- After `planning_replan_on_stall` (default 3) consecutive failures, a replan nudge is injected
- After `planning_exploration_limit` (default 5) steps without a plan, an exploration nudge is injected

### Loop Detection

`ActionLoopDetector` tracks behavioral loops without blocking:
- Computes SHA-256 hash of each action (normalized: URL stripped to domain, search queries sorted by tokens, etc.)
- Rolling window of 20 recent action hashes
- Page fingerprints: SHA-256 of DOM text + element count + URL
- Escalating nudge messages injected at 5, 8, 12 repetitions
- Page stagnation nudge if the same fingerprint appears 5+ times consecutively

```python
class ActionLoopDetector(BaseModel):
    window_size: int = 20
    recent_action_hashes: list[str]
    recent_page_fingerprints: list[PageFingerprint]
    max_repetition_count: int = 0
    consecutive_stagnant_pages: int = 0
```

### Judge System

After task completion, an optional LLM judge evaluates the trace:
```python
class JudgementResult(BaseModel):
    reasoning: str | None
    verdict: bool              # pass/fail
    failure_reason: str | None
    impossible_task: bool      # was it even solvable?
    reached_captcha: bool      # did CAPTCHAs block progress?
```

### Message Compaction

Long sessions use automatic history compaction:
```python
class MessageCompactionSettings(BaseModel):
    enabled: bool = True
    compact_every_n_steps: int = 25
    trigger_char_count: int | None = None   # ~40000 chars / ~10k tokens
    trigger_token_count: int | None = None
    keep_last_items: int = 6
    summary_max_chars: int = 6000
```

---

## Browser Controller & Actions

### Action Space (Tools Registry)

All actions are registered in `browser_use/tools/` and dispatched as events to `BrowserSession`. The full action set:

| Action | Parameters | Description |
|--------|-----------|-------------|
| `navigate` | `url, new_tab` | Navigate to URL |
| `click` | `index OR (coordinate_x, coordinate_y)` | Click element by DOM index or pixel coordinates |
| `input` | `index, text, clear` | Type text into element |
| `scroll` | `down, pages, index` | Scroll page or element |
| `search` | `query, engine` | Web search (default: duckduckgo) |
| `extract` | `query, extract_links, extract_images, start_from_char, output_schema` | Extract content from page as markdown |
| `search_page` | `pattern, regex, case_sensitive, context_chars, css_scope, max_results` | Find text/patterns in page content |
| `find_elements` | `selector, attributes, max_results, include_text` | CSS selector query |
| `send_keys` | `keys` | Keyboard shortcuts (Enter, Escape, Control+o, etc.) |
| `switch_tab` | `tab_id` | Switch to tab by 4-char ID |
| `close_tab` | `tab_id` | Close a tab |
| `go_back` | (none) | Browser back navigation |
| `wait` | (none) | Wait for page to load |
| `screenshot` | `file_name` | Take screenshot (or include in next observation) |
| `upload_file` | `index, path` | Upload file to input element |
| `get_dropdown_options` | `index` | Get all options from a `<select>` |
| `select_dropdown_option` | `index, text` | Select option by visible text |
| `save_as_pdf` | `file_name, print_background, landscape, scale, paper_format` | Save page as PDF |
| `done` | `text, success, files_to_display` | Complete the task |
| `structured_output` | `data, success` | Return structured data matching schema |

### Custom Tool Registration

```python
from browser_use import Tools

tools = Tools()

@tools.action(description='Search for products by keyword and return prices.')
async def search_products(keyword: str) -> ActionResult:
    # custom logic
    return ActionResult(extracted_content=f"Found products for: {keyword}")

agent = Agent(task="...", llm=llm, browser=browser, tools=tools)
```

Actions can also be registered with Pydantic input models:

```python
class MyParams(BaseModel):
    query: str
    limit: int = 10

tools.registry.action(description='...', param_model=MyParams)(my_handler)
```

### ActionResult

```python
class ActionResult(BaseModel):
    is_done: bool | None = False
    success: bool | None = None
    error: str | None = None
    extracted_content: str | None = None      # shown to LLM once or permanently
    long_term_memory: str | None = None       # always stays in LLM context
    include_extracted_content_only_once: bool = False
    attachments: list[str] | None = None      # file paths
    images: list[dict[str, Any]] | None = None
    metadata: dict | None = None
```

### Coordinate Clicking

Models that support coordinate clicking (claude-sonnet-4, claude-opus-4, gemini-3-pro, browser-use models) get `set_coordinate_clicking(True)` which switches the click action from index-only to `index | (coordinate_x, coordinate_y)`.

---

## DOM Extraction & Processing

### DomService

Located at `browser_use/dom/service.py`. Uses CDP DOMSnapshot + Accessibility Tree:

```python
class DomService:
    def __init__(
        self,
        browser_session: BrowserSession,
        cross_origin_iframes: bool = False,
        paint_order_filtering: bool = True,
        max_iframes: int = 100,
        max_iframe_depth: int = 5,
        viewport_threshold: int | None = 1000,  # px - elements below threshold hidden
    ):
```

**Processing pipeline:**
1. CDP `DOMSnapshot.captureSnapshot` - full DOM snapshot with computed styles
2. CDP `Accessibility.getFullAXTree` - accessibility tree overlay
3. `build_snapshot_lookup` merges the two trees into `EnhancedDOMTreeNode`
4. `ClickableElementDetector` marks interactive elements
5. `DOMTreeSerializer` converts tree to LLM-readable format

### EnhancedDOMTreeNode

The unified DOM+AX node structure:
```python
@dataclass
class EnhancedDOMTreeNode:
    node_id: int
    backend_node_id: int
    session_id: SessionID
    frame_id: str
    target_id: TargetID
    node_type: NodeType
    tag_name: str | None
    attributes: dict[str, str] | None
    is_scrollable: bool
    is_visible: bool                    # within viewport_threshold
    absolute_position: DOMRect | None
    children_nodes: list[Self]
    shadow_roots: list[Self]            # Shadow DOM support
    parent_node: Self | None
    ax_node: EnhancedAXNode | None      # Merged accessibility data
    snapshot_node: ...                  # Raw snapshot data with computed_styles
    content_document: Self | None       # For iframes
```

### LLM-Facing DOM Format

The serialized DOM sent to LLM uses an XML-like tree with integer indexes:
```
[33]<div />
    User form
    [35]<input type=text placeholder=Enter name />
    *[38]<button aria-label=Submit form />
        Submit
[40]<a />
    About us
```

- `*[N]` marks new elements that appeared since the last step
- `|SCROLL|` prefix on scrollable containers
- `|SHADOW(open)|` / `|SHADOW(closed)|` for shadow DOM
- Hidden elements below viewport threshold are noted but not indexed

### Default Attributes Extracted

```python
DEFAULT_INCLUDE_ATTRIBUTES = [
    'title', 'type', 'checked', 'id', 'name', 'role', 'value',
    'placeholder', 'aria-label', 'aria-expanded', 'data-state',
    'aria-checked', 'pattern', 'min', 'max', 'minlength', 'maxlength',
    'step', 'accept', 'multiple', 'inputmode', 'autocomplete',
    'contenteditable', 'required', 'disabled', 'invalid',
    # ... and more ARIA/AX attributes
]
```

### search_page Action (JavaScript-based)

The `search_page` action runs a JavaScript TreeWalker across all text nodes, builds a flat text corpus, then applies regex to it. This is "free and instant" vs. the `extract` action which calls a full LLM.

### find_elements Action

CSS selector query returning element attributes:
```python
class FindElementsAction(BaseModel):
    selector: str           # e.g. "table tr", "a.link", "div.product"
    attributes: list[str] | None  # ["href", "src", "class"]
    max_results: int = 50
    include_text: bool = True
```

---

## Vision Capabilities

### Screenshot Integration

Every step captures a screenshot regardless of `use_vision` setting (for cloud sync and history). Vision is then controlled at the prompt level:

- `use_vision=True` - screenshot always included in LLM input
- `use_vision=False` - screenshot captured but not sent to LLM
- `use_vision='auto'` - screenshot action available for LLM to request on demand

### Vision Detail Level

```python
vision_detail_level: Literal['auto', 'low', 'high'] = 'auto'
```

### LLM Screenshot Size

Auto-configured per model to optimize cost/quality:
```python
# Claude Sonnet models auto-get 1400x850 resize
if model_name.startswith('claude-sonnet'):
    llm_screenshot_size = (1400, 850)

# Can be set manually
agent = Agent(llm_screenshot_size=(1280, 720), ...)
```

### System Prompt Vision Section

From `system_prompt.md`:
```
<browser_vision>
If you used screenshot before, you will be provided with a screenshot of the current page
with bounding boxes around interactive elements. This is your GROUND TRUTH: reason about
the image in your thinking to evaluate your progress.
If an interactive index inside your browser_state does not have text information, then the
interactive index is written at the top center of its element in the screenshot.
Use screenshot if you are unsure or simply want more information.
</browser_vision>
```

### Element Bounding Boxes

When screenshot is provided, bounding boxes are overlaid on interactive elements. The `DOMWatchdog` handles this via CDP highlight APIs.

---

## Multi-tab Support

### Tab Management

`BrowserSession` tracks all open tabs (CDP targets) and maintains one "agent focus" target:

```python
# Tab events
class SwitchTabEvent(BaseEvent[None]):
    tab_id: str  # 4-char ID

class CloseTabEvent(BaseEvent[None]):
    tab_id: str

class TabCreatedEvent(BaseEvent[None]):
    target_id: TargetID
    url: str
```

### Tab State in Prompts

Tabs are shown in the browser state as:
```
Open Tabs: [{tab_id: "a1b2", url: "https://..."}, ...]
```

Agent can switch with `switch_tab(tab_id="a1b2")` or open new tab with `navigate(url="...", new_tab=True)`.

### PopupsWatchdog

Manages JavaScript dialogs (alert, confirm, prompt) and new popup windows automatically. Popup tabs that match agent-opened URLs are tracked; unexpected popups are blocked or closed.

### AboutBlankWatchdog

Handles `about:blank` pages - when the agent navigates to a blank tab, the watchdog can redirect or signal the agent.

---

## Configuration & Setup

### Quickstart

```python
from browser_use import Agent, Browser, ChatBrowserUse

async def main():
    browser = Browser()         # BrowserSession alias
    agent = Agent(
        task="Find the number of stars of the browser-use repo",
        llm=ChatBrowserUse(),   # or ChatOpenAI(), ChatAnthropic(), etc.
        browser=browser,
    )
    result = await agent.run()

asyncio.run(main())
```

### BrowserSession / BrowserProfile

```python
from browser_use import BrowserSession, BrowserProfile

# Minimal
session = BrowserSession(headless=True)

# Full profile control
profile = BrowserProfile(
    headless=False,
    user_data_dir='./my_chrome_profile',   # persist cookies/login
    allowed_domains=['*.google.com', 'github.com'],   # security sandbox
    downloads_path='./downloads',
    viewport=ViewportSize(width=1920, height=1080),
    proxy=ProxySettings(server='http://proxy:8080'),
    enable_default_extensions=True,        # uBlock Origin, cookie handlers
)
session = BrowserSession(browser_profile=profile)
```

### Agent Full Configuration

```python
agent = Agent(
    task="Your task",
    llm=ChatOpenAI(model='gpt-4o'),

    # Browser
    browser=session,                    # or browser_profile=profile

    # Vision
    use_vision=True,                    # True / False / 'auto'
    vision_detail_level='auto',         # 'auto' / 'low' / 'high'
    llm_screenshot_size=(1400, 850),   # resize screenshots for LLM

    # Actions
    max_actions_per_step=5,
    tools=custom_tools,                 # extend default action space

    # Output
    output_model_schema=MyOutputSchema, # structured Pydantic output

    # Memory & history
    message_compaction=True,           # auto-compact history at 40k chars
    max_history_items=None,            # unlimited by default

    # Planning
    enable_planning=True,
    planning_replan_on_stall=3,
    planning_exploration_limit=5,

    # Loop detection
    loop_detection_window=20,
    loop_detection_enabled=True,

    # Sensitive data (redacted from LLM/logs)
    sensitive_data={'username': 'john', 'password': 'secret'},
    # Domain-specific format:
    # sensitive_data={'github.com': {'token': 'ghp_xxx'}}

    # Reliability
    max_failures=5,
    step_timeout=180,
    llm_timeout=75,
    final_response_after_failure=True,

    # Callbacks
    register_new_step_callback=my_step_callback,
    register_done_callback=my_done_callback,
    register_should_stop_callback=my_stop_check,

    # Misc
    generate_gif=False,                # or path string
    save_conversation_path='./logs/',
    use_thinking=True,                 # chain-of-thought
    flash_mode=False,                  # streamlined for bu model
    use_judge=True,                    # post-task LLM judge
)
```

### Environment Variables

```bash
# LLM keys
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...
DEEPSEEK_API_KEY=...
GROK_API_KEY=...

# Browser-use config
BROWSER_USE_LOGGING_LEVEL=info          # debug / info / warning / error
BROWSER_USE_HEADLESS=false
BROWSER_USE_ALLOWED_DOMAINS=example.com,google.com
BROWSER_USE_API_KEY=your-key           # cloud features
ANONYMIZED_TELEMETRY=true

# Proxy
BROWSER_USE_PROXY_URL=http://proxy:8080
BROWSER_USE_NO_PROXY=localhost,127.0.0.1
BROWSER_USE_PROXY_USERNAME=user
BROWSER_USE_PROXY_PASSWORD=pass

# Timeouts
BROWSER_USE_ACTION_TIMEOUT_S=180
TIMEOUT_NavigateToUrlEvent=30
TIMEOUT_ClickElementEvent=15

# Docker
IN_DOCKER=true  # auto-detected, enables --no-sandbox etc.
```

### Docker Support

```python
# Dockerfile.fast includes Chromium
FROM browser-use/browser-use:latest
# or with GPU
FROM browser-use/browser-use:gpu

# Profile auto-detects Docker and enables:
# --no-sandbox, --disable-gpu-sandbox, --disable-dev-shm-usage, --no-zygote
```

---

## Event-Driven Browser Architecture

### Event Bus (bubus)

All browser actions are dispatched as typed events through `bubus.EventBus`. This decouples action callers from handlers and allows multiple watchdogs to react:

```python
# In tools/service.py
await self.browser_session.event_bus.emit(NavigateToUrlEvent(url='https://...'))

# In session.py - event handler
async def on_NavigateToUrlEvent(self, event: NavigateToUrlEvent) -> None:
    page = await self.get_current_page()
    await page.goto(event.url, wait_until=event.wait_until)
```

### Watchdog Services

Located in `browser_use/browser/watchdogs/`:

| Watchdog | Responsibility |
|----------|---------------|
| `DOMWatchdog` | DOM tree extraction, screenshots, element highlighting |
| `SecurityWatchdog` | Domain allowlist/blocklist, redirect interception |
| `PopupsWatchdog` | JS dialogs, popup windows |
| `DownloadsWatchdog` | PDF auto-download, file tracking |
| `AboutBlankWatchdog` | Empty page redirects |
| `CaptchaWatchdog` | CAPTCHA detection and wait (cloud feature) |
| `CrashWatchdog` | Browser crash detection and recovery |
| `RecordingWatchdog` | Video session recording |
| `HarRecordingWatchdog` | HTTP Archive recording |
| `StorageStateWatchdog` | Cookie/localStorage persistence |
| `PermissionsWatchdog` | Browser permission grants |
| `LocalBrowserWatchdog` | Local browser lifecycle management |

### SecurityWatchdog Pattern

The security watchdog blocks navigation to non-allowed domains:

```python
class SecurityWatchdog(BaseWatchdog):
    LISTENS_TO = [NavigateToUrlEvent, NavigationCompleteEvent, TabCreatedEvent]
    EMITS = [BrowserErrorEvent]

    async def on_NavigateToUrlEvent(self, event: NavigateToUrlEvent) -> None:
        if not self._is_url_allowed(event.url):
            # Stop event propagation
            raise ValueError(f'Navigation to {event.url} blocked by security policy')
```

### CDP Integration (cdp-use)

Browser-use uses `cdp-use` for typed CDP calls. Pattern:

```python
# Send CDP command
await cdp_client.send.DOMSnapshot.enable(session_id=session_id)
await cdp_client.send.Target.attachToTarget(
    params=AttachToTargetParameters(targetId=target_id, flatten=True)
)

# Register CDP event handler
cdp_client.register.Browser.downloadWillBegin(callback_func)
# NOT: cdp_client.on(...)  -- doesn't exist in cdp-use
```

---

## MCP Integration

### Browser Use as MCP Server

```bash
# Run as MCP server for Claude Desktop integration
uvx browser-use[cli] --mcp
```

This exposes browser automation tools to any MCP client (Claude Desktop, etc.).

### MCP Client - Connecting to External MCP Servers

```python
from browser_use import Tools
from browser_use.mcp.client import MCPClient

tools = Tools()

# Connect browser-use agent to an external MCP server
mcp_client = MCPClient(
    server_name="filesystem",
    command="npx",
    args=["@modelcontextprotocol/server-filesystem@latest", "/path"]
)
await mcp_client.register_to_tools(tools)

# All MCP tools now available as agent actions
agent = Agent(task="...", llm=llm, tools=tools)
```

MCP tools are dynamically discovered from the server and auto-registered with matching Pydantic parameter models.

---

## Skills System

Skills are pre-built automation sequences exposed as agent actions:

```python
# Load skills by ID from Browser Use Cloud
agent = Agent(
    task="...",
    llm=llm,
    skills=['*'],               # load all available skills
    # or specific: skills=['skill-id-1', 'skill-id-2']
)
```

Skills that require authentication cookies show up as "unavailable" in the agent's context until the user is logged in to the relevant site. The agent sees which cookies are missing and can navigate to authenticate first.

---

## What We Can Reuse

### 1. The Event Bus Pattern (bubus)

The `bubus` event bus pattern is excellent for decoupling browser actions from their handlers. Reusable for any agent architecture where multiple services need to react to the same events.

```bash
pip install bubus==1.5.6
```

### 2. DOM Extraction for Custom Agents

`DomService` can be used standalone to get a clean, LLM-ready DOM representation from any Chrome session. Works with existing Chrome via CDP URL.

### 3. Structured Output Pattern

The `AgentOutput` pattern - structured JSON with `thinking`, `evaluation`, `memory`, `next_goal`, `actions[]` - is a battle-tested format for browser agents. Reuse this schema for custom agents.

### 4. ActionLoopDetector

The loop detection system with normalized action hashing and page fingerprinting is directly reusable. Copy `ActionLoopDetector` from `agent/views.py`.

### 5. Sensitive Data Handling Pattern

Domain-scoped sensitive data dict with redaction in logs and prompts:
```python
sensitive_data = {
    'github.com': {'token': 'ghp_xxx', 'password': 'secret'},
    'google.com': {'api_key': 'AIza...'}
}
```

### 6. Multi-LLM Abstraction

The `BaseChatModel` interface in `browser_use/llm/base.py` provides a clean multi-provider LLM abstraction. Each provider implements `ainvoke()` returning a unified response object.

### 7. BrowserProfile + Chrome Args

The curated Chrome launch flags in `browser_use/browser/profile.py` are battle-tested for:
- Anti-detection (`--disable-blink-features=AutomationControlled`)
- Docker compatibility (`--no-sandbox`, `--disable-dev-shm-usage`)
- Agent-friendly behavior (scrollbars always visible, no focus loss, etc.)

### 8. Message Compaction Strategy

The `MessageCompactionSettings` approach to managing long agent histories is reusable: trigger on character count, keep N recent items, summarize the rest with a cheaper LLM.

### 9. Custom Tool Registration with Pydantic

The `@tools.action(description='...')` decorator pattern with auto-generated JSON schema from Pydantic models is the cleanest tool registration API seen in this space.

---

## Lessons & Best Practices

### 1. CDP over Playwright for Production

Browser-use migrated from Playwright to direct CDP (`cdp-use`). CDP gives lower latency, more control, and no Playwright abstraction overhead. Critical for tight action loops.

### 2. Always Capture Screenshots Even When Vision is Off

Screenshots are cheap now and valuable for debugging, cloud sync, and GIF generation. Capture always; conditionally include in LLM prompts.

### 3. Flash Mode for Throughput

`flash_mode=True` strips `thinking`, `evaluation_previous_goal`, `next_goal` from the output schema. Massively reduces output tokens for simple tasks. Use with the `ChatBrowserUse` fine-tuned model.

### 4. Model-Specific Timeouts

```python
# Auto-detected timeouts
if 'gemini-3-pro' in model: timeout = 90
elif 'gemini' in model:     timeout = 75
elif 'groq' in model:       timeout = 30
elif 'o3' in model or 'claude' in model: timeout = 90
else:                        timeout = 75  # default
```

### 5. DuckDuckGo Over Google for Searches

Default search engine is DuckDuckGo because it has fewer CAPTCHAs. Configurable per search action.

### 6. Domain Allowlisting is Critical for Security

When passing sensitive credentials, always set `allowed_domains` on the BrowserSession to prevent prompt injection attacks from malicious pages.

```python
browser = Browser(allowed_domains=['yourapp.com', '*.yourapp.com'])
agent = Agent(sensitive_data={'username': 'john', 'password': 'secret'}, browser=browser)
```

### 7. Page Stagnation Detection

If `extract` doesn't get better results after multiple calls on the same page, try `search_page` (instant, JS-based, no LLM cost) or `find_elements` with a CSS selector first.

### 8. Multi-step Actions Per Step

Up to 5 actions per step (`max_actions_per_step=5`) reduces round-trips. For predictable sequences (navigate + wait + click + type + submit), the LLM can batch them.

### 9. Message Manager Architecture

Keep a separate `MessageManager` class that owns prompt assembly. Never mix prompt logic with business logic. The message manager handles: system prompt, history, browser state, vision, available actions, sensitive data redaction.

### 10. Structured Output for Data Extraction

For web scraping tasks, define a Pydantic schema upfront:
```python
class ProductData(BaseModel):
    name: str
    price: float
    url: str

agent = Agent(
    task="Scrape all products from page 1",
    output_model_schema=ProductData,  # LLM returns validated JSON
    llm=llm,
)
result = await agent.run()
# result.final_result() contains ProductData instance
```

### 11. Watchdog Pattern for Browser Concerns

Any cross-cutting browser concern (security, downloads, popups, recording) should be a separate watchdog that listens to events and handles its domain independently. Avoids tangled session code.

### 12. Fallback LLM for Resilience

```python
agent = Agent(
    llm=ChatOpenAI(model='gpt-4o'),
    fallback_llm=ChatAnthropic(model='claude-haiku-3-5'),  # if primary fails
)
```

### 13. Cost Calculation

Enable cost tracking to measure ROI:
```python
agent = Agent(calculate_cost=True, pricing_url='...')
result = await agent.run()
print(result.usage)  # total input/output tokens + cost
```

### 14. Pause/Resume Support

The agent supports external pause/resume without losing state:
```python
await agent.pause()   # agent finishes current step then pauses
await agent.resume()  # continues from where it left off
```

---

## CLI Usage

```bash
# Install
uv add browser-use

# Template generation
uvx browser-use init --template default
uvx browser-use init --template advanced
uvx browser-use init --template tools

# CLI browser control (persistent between commands)
browser-use open https://example.com
browser-use state          # see clickable elements
browser-use click 5        # click element by index
browser-use type "Hello"   # type text
browser-use screenshot page.png
browser-use close

# MCP server mode (for Claude Desktop)
uvx browser-use[cli] --mcp
```

### Claude Code Skill Integration

```bash
mkdir -p ~/.claude/skills/browser-use
curl -o ~/.claude/skills/browser-use/SKILL.md \
  https://raw.githubusercontent.com/browser-use/browser-use/main/skills/browser-use/SKILL.md
```

---

## File Map

```
browser-use/
├── browser_use/
│   ├── agent/
│   │   ├── service.py          # Agent class - main orchestrator
│   │   ├── views.py            # AgentOutput, ActionResult, AgentState, etc.
│   │   ├── prompts.py          # SystemPrompt builder
│   │   ├── system_prompts/     # .md prompt templates per model/mode
│   │   ├── message_manager/    # MessageManager - prompt assembly
│   │   └── judge.py            # Post-task LLM judge
│   ├── browser/
│   │   ├── session.py          # BrowserSession - CDP session manager
│   │   ├── profile.py          # BrowserProfile, Chrome launch args
│   │   ├── events.py           # Typed event definitions
│   │   ├── watchdogs/          # Per-concern watchdog services
│   │   └── views.py            # BrowserStateSummary, TabInfo, etc.
│   ├── dom/
│   │   ├── service.py          # DomService - DOM extraction
│   │   ├── views.py            # EnhancedDOMTreeNode, DOMRect, etc.
│   │   ├── enhanced_snapshot.py # CDP snapshot + AX tree merge
│   │   └── serializer/         # DOM -> LLM text serialization
│   ├── tools/
│   │   ├── service.py          # Tools class, action execution
│   │   ├── views.py            # Action input Pydantic models
│   │   └── registry/           # Action registration system
│   ├── llm/
│   │   ├── base.py             # BaseChatModel interface
│   │   ├── messages.py         # Unified message types
│   │   └── {provider}/chat.py  # Per-provider implementations
│   ├── mcp/
│   │   └── client.py           # MCP server connection + tool registration
│   ├── config.py               # CONFIG singleton, env var management
│   └── skill_cli/              # CLI implementation
├── examples/                   # Use-case examples
├── tests/ci/                   # CI test suite
└── pyproject.toml              # Dependencies, build config
```
