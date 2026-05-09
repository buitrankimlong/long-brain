---
tags: [knowledge, lark, openai, chatbot, feishu]
source_repo: Lark-OpenAI
---

# Lark-OpenAI - Knowledge Extraction

## Overview & Architecture

Lark-OpenAI (also known as Feishu-OpenAI) is a Go-based chatbot that bridges the Lark/Feishu enterprise messaging platform with OpenAI APIs (GPT-4, DALL-E, Whisper). Built by ConnectAI-E, it exposes two webhook endpoints that Lark calls on message and card interaction events, and it routes those events through a responsibility-chain pattern to the appropriate handler.

High-level flow:
1. Lark platform sends a POST to `/webhook/event` (messages) or `/webhook/card` (button/menu interactions)
2. Gin router receives the request, validates the signature/token, and dispatches to a registered handler
3. The event handler runs through an ordered action chain (dedup check, mention check, audio, empty, clear, pic, AI mode, role, help, balance, message)
4. The relevant action calls the ChatGPT service, which load-balances across multiple API keys with retry logic
5. The result is sent back to Lark as a plain text reply or a rich interactive card

The project is structured as a modular Go application:
```
code/
  main.go                   # Entry point: wires all components
  config.example.yaml       # All config keys with defaults
  go.mod                    # Dependencies
  initialization/           # Config loading, Lark client, server startup, role list
  handlers/                 # Event and card handlers, action chain, message sending
  services/                 # Session cache, msg dedup cache, load balancer
    openai/                 # ChatGPT client: completions, image, audio, billing
    loadbalancer/           # Multi-key round-robin load balancer
  utils/                    # i18n, string helpers
  locales/                  # Translation files (zh, en, ja, vi, zh-hk)
  role_list.yaml            # Built-in role/persona prompts (Chinese labels)
  role_list_en.yaml         # Built-in role/persona prompts (English labels)
```

## Tech Stack & Dependencies

| Component | Library | Version |
|-----------|---------|---------|
| Language | Go | 1.18 |
| Web framework | gin-gonic/gin | v1.8.2 |
| Lark SDK | larksuite/oapi-sdk-go/v3 | v3.0.14 |
| Lark-Gin adapter | larksuite/oapi-sdk-gin | v1.0.0 |
| OpenAI client | sashabaranov/go-openai | v1.10.0 |
| In-memory cache | patrickmn/go-cache | v2.1.0 |
| Token counter | pandodao/tokenizer-go | v0.2.0 |
| Config | spf13/viper + spf13/pflag | v1.14 / v1.0.5 |
| Audio convert | pion/opus | v0.0.0-20230123 |
| i18n | golang.org/x/text | v0.8.0 |
| Utilities | duke-git/lancet/v2 | v2.1.17 |
| UUID | google/uuid | v1.3.0 |

Azure OpenAI is supported as an alternative platform — toggled by `AZURE_ON=true`.

## Bot Setup & Configuration

All configuration is via a YAML file (`config.yaml`) or environment variables. Viper supports both, with env vars taking precedence. This makes Docker/Railway/Serverless deployment straightforward.

Key config fields (`config.example.yaml`):
```yaml
APP_LANG: en                  # Supported: en, zh, ja, vi, zh-hk
APP_ID: cli_axxx              # Lark App ID
APP_SECRET: xxx               # Lark App Secret
APP_ENCRYPT_KEY: xxx          # Lark event encryption key
APP_VERIFICATION_TOKEN: xxx   # Lark verification token
BOT_NAME: chatGpt             # Must match the bot name in Lark console
OPENAI_KEY: sk-xxx,sk-xxx     # Comma-separated for load balancing
OPENAI_MODEL: gpt-3.5-turbo   # or gpt-4, gpt-3.5-turbo-16k, etc.
OPENAI_MAX_TOKENS: 2000
HTTP_PORT: 9000
API_URL: https://api.openai.com
HTTP_PROXY: ""                # Optional: http://127.0.0.1:7890
AZURE_ON: false               # Switch to Azure OpenAI
```

Config struct (`initialization/config.go`) is loaded by Viper and supports `getViperStringArray` which splits comma-separated `OPENAI_KEY` into a `[]string` slice — keys are validated to start with `sk-` or `fk` prefixes.

Lark bot setup checklist:
1. Create app at open.larksuite.com, get APP_ID and APP_SECRET
2. Enable Bot feature in the app
3. Register event subscription URL: `https://YOUR_HOST/webhook/event`
4. Register card callback URL: `https://YOUR_HOST/webhook/card`
5. Subscribe to events: `im:message`, `im:message.group_at_msg`, `im:message.p2p_msg`, `im:resource`
6. Grant permissions: `im:message:send_as_bot`, `im:chat:readonly`, `im:chat`
7. Publish and wait for enterprise admin approval

## Event Handling Patterns

### Responsibility Chain Pattern

The core dispatch mechanism is a chain-of-responsibility. `handler.go` defines a `chain()` function that runs each `Action` in sequence; if any action returns `false`, the chain stops.

```go
// chain runs actions in order, stopping on false
func chain(data *ActionInfo, actions ...Action) bool {
    for _, v := range actions {
        if !v.Execute(data) {
            return false
        }
    }
    return true
}
```

Actions in order:
1. `ProcessedUniqueAction` — dedup: skips if `msgId` already processed (30-min TTL cache)
2. `ProcessMentionAction` — group chat: only proceed if the bot is @mentioned
3. `AudioAction` — private chat only: download OGG, convert to MP3, send to Whisper
4. `EmptyAction` — reject blank messages
5. `ClearAction` — `/clear` or "清除" triggers context wipe confirmation card
6. `PicAction` — `/picture` or "图片创作" enters DALL-E mode; handles both text-to-image and image variation
7. `AIModeAction` — `/ai_mode` presents temperature selection card
8. `RoleListAction` — `/roles` presents built-in persona list
9. `HelpAction` — `/help` sends feature overview card
10. `BalanceAction` — `/balance` queries OpenAI billing API
11. `MessageAction` — fallthrough: appends user message to session, calls GPT completions, replies

### Message Type Detection

The handler inspects `event.Event.Message.MessageType` and routes on `"text"`, `"image"`, `"audio"`, or `"post"` (rich text). Unrecognized types are ignored silently.

Chat type (p2p vs group) is detected from `event.Event.Message.ChatType`:
```go
func judgeChatType(event *larkim.P2MessageReceiveV1) HandlerType {
    chatType := event.Event.Message.ChatType
    if *chatType == "group" { return GroupHandler }
    if *chatType == "p2p"   { return UserHandler }
    return "otherChat"
}
```

### Session ID Strategy

Session continuity is tracked by `RootId` (the top-level message in a thread). If there is no root (new message, not a reply), `MessageId` is used as the session ID. This allows multi-turn conversations within a Lark thread to share context.

```go
sessionId := rootId
if sessionId == nil || *sessionId == "" {
    sessionId = msgId
}
```

## GPT-4 Integration

### ChatGPT Client

`services/openai/common.go` defines the `ChatGPT` struct:
```go
type ChatGPT struct {
    Lb          *loadbalancer.LoadBalancer
    ApiKey      []string
    ApiUrl      string
    HttpProxy   string
    Platform    PlatForm  // "openai" or "azure"
    AzureConfig AzureConfig
    Model       string
    MaxTokens   int
}
```

URL construction adapts for platform:
- OpenAI: `{API_URL}/v1/{suffix}`
- Azure: `https://{ResourceName}.openai.azure.com/openai/deployments/{DeploymentName}/{suffix}?api-version={version}`

### Completions Call

`gpt3.go` sends chat completions with the configured model and temperature (AI Mode):
```go
func (gpt *ChatGPT) Completions(msg []Messages, aiMode AIMode) (resp Messages, err error) {
    requestBody := ChatGPTRequestBody{
        Model:       gpt.Model,
        Messages:    msg,
        MaxTokens:   gpt.MaxTokens,
        Temperature: aiMode,   // float64: 0.1 / 0.4 / 0.7 / 1.0
        TopP:        1,
    }
    // ...
}
```

### AI Modes (Temperature Presets)

Four named modes map to `temperature` values:
```go
const (
    Fresh      AIMode = 0.1   // "清新" - precise, deterministic
    Warmth     AIMode = 0.4   // "温暖" - slightly creative
    Balance    AIMode = 0.7   // "平衡" - default balanced
    Creativity AIMode = 1.0   // "创意" - maximum creativity
)
```

### Context/Session Management

`services/sessionCache.go` uses `go-cache` (in-memory, 12-hour TTL) to store per-session state:
- `Msg []openai.Messages` — the full conversation history
- `Mode SessionMode` — current mode (GPT, PicCreate, PicVary)
- `AIMode` — selected temperature
- `PicSetting.resolution` — image size (256/512/1024)

Context window is auto-trimmed: when total token count exceeds 4096, oldest non-system messages are dropped:
```go
for getStrPoolTotalLength(msg) > maxLength {
    msg = append(msg[:1], msg[2:]...)  // Keep system prompt, drop oldest user/assistant pair
}
```

System prompt injected on every new conversation:
```
"You are ChatGPT, a large language model trained by OpenAI.
Answer in user's language as concisely as possible.
Knowledge cutoff: 20230601 Current date YYYYMMDD"
```

## DALL-E Image Generation

### Modes

Two DALL-E workflows are supported:
1. **Text-to-image**: user sends a text prompt in picture mode → `GenerateOneImage(prompt, resolution)`
2. **Image variation**: user sends an image in picture mode → `GenerateOneImageVariation(imagePath, resolution)`

Both return base64-encoded PNG, which is then uploaded to Lark's image resource API and sent as an interactive card.

### Image Pipeline

```go
// Text-to-image
func (gpt *ChatGPT) GenerateImage(prompt string, size string, n int) ([]string, error) {
    requestBody := ImageGenerationRequestBody{
        Prompt:         prompt,
        N:              n,
        Size:           size,
        ResponseFormat: "b64_json",  // Always base64, never URL
    }
    // POST /v1/images/generations
}

// Image variation
func (gpt *ChatGPT) GenerateImageVariation(images string, size string, n int) ([]string, error) {
    // POST /v1/images/variations (multipart form with PNG file)
}
```

### Image Validation

Before sending to DALL-E variations endpoint, images are validated:
- Max file size: 4MB
- Must be square (width == height)
- Must be valid PNG
- Auto-converted: JPEG → PNG, any format → RGBA PNG

Supported resolutions: `256x256`, `512x512`, `1024x1024` — user selects via dropdown card.

### Interactive Card Flow for Images

```
User: /picture
Bot: [Card] "Entered image creation mode" + resolution dropdown

User selects resolution, then sends text prompt
Bot: [Card] image + "Generate another" button

User clicks "Generate another"
Bot: generates again with same prompt
```

## Key Code Patterns (with snippets)

### 1. Action Interface Pattern

Every behavior in the message pipeline implements the same interface, making it easy to add/remove/reorder behaviors:

```go
type Action interface {
    Execute(a *ActionInfo) bool  // return false to stop chain
}

type ClearAction struct{}
func (*ClearAction) Execute(a *ActionInfo) bool {
    if _, foundClear := utils.EitherTrimEqual(a.info.qParsed, "/clear", "清除"); foundClear {
        sendClearCacheCheckCard(*a.ctx, a.info.sessionId, a.info.msgId)
        return false
    }
    return true
}
```

### 2. Load Balancer for Multi-Key Management

Round-robin load balancer with availability tracking and automatic revival:
```go
func (lb *LoadBalancer) GetAPI() *API {
    // pick the available API with fewest calls
    // if all unavailable, randomly revive one
    selectedAPI := availableAPIs[0]
    for _, api := range availableAPIs {
        if api.Times < minTimes {
            selectedAPI = api
        }
    }
    selectedAPI.Times++
    return selectedAPI
}
```

Failed requests mark an API key as unavailable. On the next request, it is skipped. If all keys are down, one is randomly revived (circuit breaker behavior).

### 3. Request Retry with Exponential Backoff

```go
for retry = 0; retry <= maxRetries; retry++ {
    response, err = client.Do(req)
    if err != nil || response.StatusCode < 200 || response.StatusCode >= 300 {
        gpt.Lb.SetAvailability(api.Key, false)
        if retry == maxRetries { break }
        time.Sleep(time.Duration(retry+1) * time.Second)  // 1s, 2s, 3s
    } else { break }
}
```

### 4. Rich Card Building (Builder Pattern)

Lark cards are built using a fluent API:
```go
newCard, _ := newSendCard(
    withHeader("🖼️ Image Creation Mode", larkcard.TemplateBlue),
    withPicResolutionBtn(sessionId),
    withNote("Reply with text or image to generate AI art."),
)
replyCard(ctx, msgId, newCard)
```

Card kinds tracked as typed constants:
```go
var (
    ClearCardKind      = CardKind("clear")
    PicModeChangeKind  = CardKind("pic_mode_change")
    PicResolutionKind  = CardKind("pic_resolution")
    PicTextMoreKind    = CardKind("pic_text_more")
    PicVarMoreKind     = CardKind("pic_var_more")
    RoleTagsChooseKind = CardKind("role_tags_choose")
    RoleChooseKind     = CardKind("role_choose")
    AIModeChooseKind   = CardKind("ai_mode_choose")
)
```

### 5. Deduplication Cache

Prevents double-processing of the same event (Lark may retry):
```go
type ProcessedUniqueAction struct{}
func (*ProcessedUniqueAction) Execute(a *ActionInfo) bool {
    if a.handler.msgCache.IfProcessed(*a.info.msgId) {
        return false  // already seen, stop chain
    }
    a.handler.msgCache.TagProcessed(*a.info.msgId)  // 30-min TTL
    return true
}
```

### 6. Role Play / Persona Injection

Users can set a custom system prompt:
```go
// Command: /system You are a Python expert...
if system, found := utils.EitherCutPrefix(a.info.qParsed, "/system ", "角色扮演"); found {
    a.handler.sessionCache.Clear(*a.info.sessionId)
    systemMsg := []openai.Messages{{Role: "system", Content: system}}
    a.handler.sessionCache.SetMsg(*a.info.sessionId, systemMsg)
}
```

Built-in roles are loaded from `role_list_en.yaml` at startup:
```go
type Role struct {
    Title   string   `yaml:"title"`
    Content string   `yaml:"content"`
    Tags    []string `yaml:"tags"`
}
```

### 7. Audio (Whisper) Flow

Voice messages in private chat only:
1. Download `.ogg` audio file via Lark API using `fileKey`
2. Convert OGG → MP3 using `pion/opus`
3. POST MP3 to `/v1/audio/transcriptions` with `model: whisper-1`
4. Set transcribed text as `a.info.qParsed` and continue the action chain
5. The message action then sends the transcription to GPT

### 8. i18n Pattern

All user-facing strings go through a global i18n instance:
```go
utils.I18n.Sprintf("🤖️：消息机器人摆烂了，请稍后再试～\n错误信息: %v", err)
```
Language is set once during init from `APP_LANG` config. Supported: `zh`, `en`, `ja`, `vi`, `zh-hk`.

## Deployment

### Local
```bash
cd code
cp config.example.yaml config.yaml
# edit config.yaml
go run ./
# expose via reverse proxy (cpolar, natapp, ngrok)
cpolar http 9000
```

### Docker
```bash
docker build -t lark-openai:latest .
docker run -d -p 9000:9000 \
  --env APP_ID=xxx --env APP_SECRET=xxx \
  --env OPENAI_KEY=sk-xxx,sk-xxx \
  --env BOT_NAME=chatGpt \
  lark-openai:latest
```

Multi-stage Dockerfile: builds in `golang:1.18`, runs in `alpine:latest` with the binary + role YAML. Final image is very small (no Go runtime).

### Docker Compose
```bash
docker compose up -d
# Exposes: http://IP:9000/webhook/event and /webhook/card
```

### Serverless (Alibaba Cloud via Serverless Devs)
- Config in `s.yaml`: set region, access key alias
- `s deploy` for one-click deploy
- Windows users must set `GOOS=linux GOARCH=amd64` before building

### Railway (PaaS, one-click)
- Click Railway button → auto-forks repo
- Set env vars in Railway dashboard
- Get public domain → register as Lark webhook URL
- Health check: `GET /ping` returns `{"message":"pong"}`

### Replit
- Set secrets in Replit Secrets tab (JSON format)
- Automatically exposed at `https://YOUR_ADDRESS.repl.co/webhook/event`

## What We Can Reuse

### Directly Applicable

1. **Responsibility Chain for Bot Commands** — clean, extensible pattern for handling multiple command types. Each new feature is a new Action struct. Order matters for priority.

2. **Multi-API Key Load Balancer** — `services/loadbalancer/loadbalancer.go` is a standalone, thread-safe, min-usage load balancer. Can be extracted for any service needing API key rotation. Handles availability marking and random revival.

3. **Session Context Cache Pattern** — `services/sessionCache.go` shows how to manage per-user conversation state with TTL using `go-cache`. The 4096-token trim logic is production-ready.

4. **Deduplication Middleware** — `msgCache.go` pattern for idempotency on webhook events. Essential for Lark (and other platforms that retry on timeout).

5. **Interactive Card Templates** — The card builder functions (`withHeader`, `withMainMd`, `withNote`, `withSplitLine`, `withOneBtn`, `newMenu`) are reusable wrappers over the Lark SDK. Extremely useful for building rich bot UIs.

6. **Azure OpenAI Toggle** — Config-level platform switching (OpenAI vs Azure) with URL construction logic. Copy this pattern for any project needing both options.

7. **Role/Persona System** — YAML-based role list with tags and content. Simple, file-based, loaded at startup. Works well for < 500 roles. Easy to extend to DB-backed.

8. **Image Processing Pipeline** — The JPEG-to-PNG conversion + RGBA normalization + square validation before DALL-E variations is a reliable preprocessing sequence.

### Patterns to Adapt for Vietnam Market

- Replace Lark with **Zalo OA** (similar webhook event model)
- The session cache and action chain work unchanged for any messaging platform
- Load balancer is platform-agnostic — reuse for any AI API key pool
- Whisper integration pattern applicable to Vietnamese voice input (Whisper supports Vietnamese)

## Lessons & Best Practices

### Architecture

- **Chain of Responsibility > Nested if-else**: The action chain pattern makes the handler logic flat, testable, and easy to extend. Adding a new command = add one struct implementing `Execute`. No touching existing code.

- **Separate concerns**: Config loading, Lark client, server startup, and role list are each in separate files under `initialization/`. This avoids the god-file antipattern.

- **Interface-driven caching**: Both `SessionServiceCacheInterface` and `MsgCacheInterface` are defined as interfaces, making them mockable in tests and swappable (e.g., Redis-backed cache in production).

### Reliability

- **Always deduplicate webhook events**: Lark (and most webhook platforms) retry on timeout. A 30-minute dedup cache per message ID prevents double responses.

- **Retry with backoff + key rotation**: The 3-retry loop with 1s/2s/3s sleep, combined with marking a key unavailable on failure, is the right pattern for OpenAI rate limits.

- **Context window trimming is mandatory**: GPT-4 8K/32K context limits mean accumulating messages will eventually fail. The strategy of keeping the system prompt and dropping oldest messages is correct but note it drops from index 1 (preserving system at index 0).

- **110-second HTTP timeout**: OpenAI can be slow. A 2-minute timeout on the HTTP client prevents goroutine leaks.

### Configuration

- **Viper + env vars**: `viper.AutomaticEnv()` means the same app runs in local (config.yaml) and Docker (env vars) without code changes.

- **Comma-separated API keys**: Parsing `sk-xxx1,sk-xxx2` from a single env var is a clean pattern for multi-key config in Docker/PaaS environments where you can't easily pass arrays.

- **Filter keys by prefix**: Only accepting `sk-` or `fk` prefixed strings prevents accidental inclusion of empty strings or placeholder values in the key pool.

### UX

- **Confirmation cards for destructive actions**: Clearing context shows a confirm/cancel card instead of acting immediately. Critical for production bots.

- **New topic cards**: When a conversation starts fresh, a visual card signals this to the user, reducing confusion about context loss.

- **AI mode as temperature**: Exposing "Creative / Balanced / Warm / Fresh" instead of raw temperature values is excellent UX for non-technical users.

- **Voice-only in private chat**: Audio handling is restricted to p2p (UserHandler). Group audio handling would be noisy and confusing — good boundary to enforce.

### Known Limitations / TODOs in Repo

- History reload (`/reload`) marked as WIP (`🚧`)
- Document/PPT interaction marked as WIP
- Admin mode marked as WIP
- Table analysis marked as WIP
- Balance query uses deprecated OpenAI billing API endpoints (may break)
- Context window trim removes oldest messages but not the assistant responses — can result in orphaned messages in context (user without reply or vice versa)
- In-memory cache means sessions are lost on restart; swap to Redis for production

### Performance Notes

- `go-cache` is in-process memory — fine for single instance, not for horizontal scaling
- No streaming responses — bot sends full reply at once (no token streaming to Lark cards)
- Image generation is synchronous and blocks the handler goroutine for several seconds — no queuing
- Token counting uses `pandodao/tokenizer-go` (JS tokenizer via Goja) — this has overhead; for high volume, consider server-side token estimation
