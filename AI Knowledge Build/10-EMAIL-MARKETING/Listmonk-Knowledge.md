---
tags: [knowledge, email, newsletter, listmonk, golang]
source_repo: listmonk
files_read: 22
---

# Listmonk - Knowledge Extraction

## Overview & Architecture

Listmonk is a self-hosted, standalone newsletter and mailing list manager. It is a single binary backed by PostgreSQL. Key characteristics:

- Single Go binary - no external dependencies beyond PostgreSQL
- Self-contained web server (Echo framework) serving both admin SPA and public subscriber pages
- Campaign manager runs as goroutines within the same process
- License: AGPLv3
- Author: Zerodha Tech (knadh)
- Default port: 9000

### Architectural Layers

```
HTTP Layer (Echo)
    -> cmd/ handlers (campaigns.go, subscribers.go, templates.go, etc.)
    -> internal/core/  (CRUD operations, returns echo.HTTPError directly)
    -> models/queries.go (prepared SQL statements via sqlx + goyesql)
    -> PostgreSQL

Campaign Manager (goroutine)
    -> internal/manager/manager.go  (scanCampaigns, worker pool)
    -> internal/manager/pipe.go     (per-campaign state machine)
    -> internal/messenger/email/    (SMTP pool)
    -> internal/messenger/postback/ (HTTP webhook messenger)
```

The `App` struct in `cmd/main.go` is the central DI container holding all shared components.

---

## Tech Stack & Dependencies (Go, PostgreSQL)

### Core Go Libraries

| Library | Purpose |
|---|---|
| `github.com/labstack/echo/v4` | HTTP web framework |
| `github.com/jmoiron/sqlx` | SQL query execution with struct scanning |
| `github.com/knadh/goyesql/v2` | Load named SQL queries from `.sql` files |
| `github.com/knadh/koanf/v2` | Config management (TOML + ENV) |
| `github.com/knadh/smtppool/v2` | SMTP connection pooling |
| `github.com/knadh/stuffbin` | Embed static files into binary |
| `github.com/Masterminds/sprig/v3` | Extra template functions (date, string, math, etc.) |
| `github.com/yuin/goldmark` | Markdown to HTML conversion |
| `github.com/lib/pq` | PostgreSQL driver |
| `github.com/coreos/go-oidc/v3` | OIDC/OAuth2 SSO |
| `github.com/pquerna/otp` | TOTP 2FA |
| `github.com/rhnvrm/simples3` | S3 media uploads |
| `github.com/paulbellamy/ratecounter` | Per-campaign send rate tracking |
| `github.com/knadh/paginator` | Pagination helper |
| `github.com/gdgvda/cron` | Cron job scheduling |
| `github.com/altcha-org/altcha-lib-go` | CAPTCHA (Altcha/hCaptcha) |

### Frontend
- Vue.js with Buefy UI components
- Source in `frontend/src/`
- Built into `frontend/dist/` and embedded in binary via stuffbin

---

## Project Structure

```
listmonk/
├── cmd/                    # Main application code (all package main)
│   ├── main.go             # App struct, init(), main() - DI container & startup
│   ├── init.go             # All initXxx() functions (DB, config, manager, HTTP server)
│   ├── handlers.go         # Route registration (initHTTPHandlers), middleware
│   ├── campaigns.go        # Campaign CRUD + status + analytics HTTP handlers
│   ├── subscribers.go      # Subscriber CRUD HTTP handlers
│   ├── lists.go            # List management HTTP handlers
│   ├── templates.go        # Template CRUD HTTP handlers
│   ├── tx.go               # Transactional email sending endpoint
│   ├── public.go           # Public subscriber pages (optin, unsubscribe, archive)
│   ├── bounce.go           # Bounce webhook handlers
│   ├── auth.go             # Login, logout, OIDC, 2FA handlers
│   ├── media.go            # Media upload/delete handlers
│   ├── users.go            # User management handlers
│   ├── roles.go            # RBAC role management handlers
│   ├── settings.go         # App settings handlers
│   ├── import.go           # Bulk subscriber import handlers
│   └── ...
├── internal/
│   ├── core/               # DB CRUD layer (returns echo.HTTPError)
│   │   ├── core.go         # Core struct, mat view refresh, helpers
│   │   ├── campaigns.go    # Campaign DB operations
│   │   ├── subscribers.go  # Subscriber DB operations
│   │   ├── lists.go        # List DB operations
│   │   ├── templates.go    # Template DB operations
│   │   ├── bounces.go      # Bounce DB operations
│   │   └── ...
│   ├── manager/            # Campaign scheduling + sending engine
│   │   ├── manager.go      # Manager struct, Run(), worker(), scanCampaigns()
│   │   ├── pipe.go         # Per-campaign pipe/state machine
│   │   └── message.go      # CampaignMessage rendering
│   ├── messenger/
│   │   ├── email/          # SMTP messenger (smtppool-based)
│   │   └── postback/       # HTTP webhook messenger
│   ├── auth/               # Session + OIDC + 2FA auth
│   ├── bounce/             # Bounce processing (POP3 + webhooks)
│   ├── subimporter/        # CSV/JSON bulk subscriber import
│   ├── media/              # Media store interface
│   │   └── providers/
│   │       ├── filesystem/ # Local disk storage
│   │       └── s3/         # AWS S3 storage
│   ├── captcha/            # CAPTCHA (Altcha + hCaptcha)
│   ├── i18n/               # Internationalization
│   ├── notifs/             # Admin email notifications
│   ├── events/             # Server-sent events stream
│   ├── buflog/             # Buffered log for UI display
│   └── migrations/         # DB migration SQL files
├── models/                 # Go model structs + SQL query registry
│   ├── campaigns.go        # Campaign, CampaignMeta structs + CompileTemplate()
│   ├── subscribers.go      # Subscriber struct + LoadLists()
│   ├── lists.go            # List struct
│   ├── templates.go        # Template struct
│   ├── queries.go          # Queries struct (all *sqlx.Stmt fields)
│   ├── messages.go         # Message, TxMessage, Attachment structs
│   ├── common.go           # Base, JSON, Headers types
│   ├── bounces.go          # Bounce struct
│   └── settings.go         # Settings struct
├── queries/                # Named SQL query files (loaded by goyesql)
├── schema.sql              # Full PostgreSQL schema + seed settings
├── frontend/               # Vue.js admin SPA
├── static/                 # Public static assets
├── i18n/                   # Language JSON files
├── docker-compose.yml      # Docker Compose setup
├── Dockerfile
├── config.toml.sample      # Config file template
└── go.mod
```

---

## Campaign System

### Campaign Statuses
```
draft -> scheduled -> running -> finished
                   -> paused  -> running (resume)
                   -> cancelled
```
Only campaigns in `draft`, `paused`, or `scheduled` state can be edited.

### Campaign Types
- `regular` - Standard newsletter campaign
- `optin` - Double opt-in confirmation email campaign

### Content Types
- `richtext` - Rich text editor (default)
- `html` - Raw HTML
- `markdown` - Markdown (auto-converted to HTML)
- `plain` - Plain text
- `visual` - Visual drag-and-drop builder

### Campaign Manager Flow (`internal/manager/`)

1. `Manager.Run()` starts as a goroutine
2. `scanCampaigns()` polls DB at `ScanInterval` for campaigns with status=`running`
3. For each campaign found, creates a `pipe` (state machine for that campaign)
4. `pipe.NextSubscribers()` fetches batches of subscribers (configurable `BatchSize`, default 1000)
5. For each subscriber, `NewCampaignMessage()` renders the template and pushes to `campMsgQ` channel
6. N worker goroutines consume from `campMsgQ` and call `messenger.Push(message)`
7. Rate limiting: `MessageRate` (messages/sec per worker), sliding window option
8. On completion/error, pipe calls `cleanup()` which updates campaign status in DB

### Key Config Parameters (from settings DB)
```
app.concurrency              - Number of worker goroutines (default: 10)
app.message_rate             - Messages per second per worker (default: 10)
app.batch_size               - Subscribers fetched per DB batch (default: 1000)
app.max_send_errors          - Max errors before campaign stops (default: 1000)
app.message_sliding_window   - Enable sliding window rate limiting
app.message_sliding_window_duration - Window duration (e.g., "1h")
app.message_sliding_window_rate     - Max messages per window
```

### Multi-Instance Support
The `Manager.Config.ScanCampaigns` flag allows running multiple listmonk instances where only one scans and dispatches campaigns (for traffic separation).

---

## Subscriber & List Management

### Subscriber Statuses
- `enabled` - Active subscriber
- `disabled` - Soft disabled (can be re-enabled)
- `blocklisted` - Hard blocked (cannot receive emails)

### Subscription Statuses (subscriber_lists junction)
- `unconfirmed` - Subscribed but not confirmed (double opt-in)
- `confirmed` - Active confirmed subscription
- `unsubscribed` - Explicitly unsubscribed

### List Types
- `public` - Visible on public subscription page
- `private` - Hidden from public, admin-only
- `temporary` - Temporary lists

### List Opt-in Modes
- `single` - Subscriber added directly
- `double` - Sends confirmation email; subscription only confirmed after click

### Subscriber Custom Attributes
The `attribs` column is a PostgreSQL JSONB field. This allows storing arbitrary key-value data per subscriber. These attributes are accessible in templates as `{{ .Subscriber.Attribs.city }}`.

### Arbitrary SQL Query System
Listmonk supports filtering subscribers using raw SQL expressions (sanitized). This enables advanced segmentation. Endpoints:
- `POST /api/subscribers/query/delete`
- `PUT /api/subscribers/query/blocklist`
- `PUT /api/subscribers/query/lists`

### Bulk Import (`internal/subimporter/`)
Supports CSV and JSON import. Runs as background goroutine. Tracks progress. Can upsert or skip existing subscribers.

### Subscriber Self-Service
Public endpoints (no auth):
- `/subscription/form` - Public subscription form
- `/subscription/:campUUID/:subUUID` - Manage preferences / unsubscribe
- `/subscription/optin/:subUUID` - Double opt-in confirmation
- `/subscription/export/:subUUID` - GDPR data export
- `/subscription/wipe/:subUUID` - GDPR data wipe

---

## Email Templating

### Template System
Templates are stored in the DB (`templates` table). Each campaign references a template.

Template types:
- `campaign` - Used for regular campaign emails
- `campaign_visual` - Visual builder output
- `tx` - Transactional email templates

### Template Rendering Flow
1. Campaign body + template body are compiled together using Go's `html/template`
2. Template body must contain `{{ template "content" . }}` as placeholder for campaign body
3. `Campaign.CompileTemplate(funcMap)` compiles both and stores result in `Campaign.Tpl`
4. Subject line also supports Go template expressions
5. Alt body (plain text) supports template expressions
6. Custom email headers support template expressions

### Built-in Template Functions

Available in all campaign/template contexts:
```
{{ TrackLink "https://..." . }}    - Wraps URL with click tracking
{{ TrackView . }}                  - Inserts 1x1 tracking pixel
{{ UnsubscribeURL . }}             - Generates unsubscribe link
{{ ManageURL . }}                  - Generates subscription management link
{{ OptinURL . }}                   - Generates opt-in confirmation link
{{ MessageURL . }}                 - Generates web view link
{{ ArchiveURL }}                   - Returns public archive URL
{{ RootURL }}                      - Returns site root URL
{{ Date "2006-01-02" }}            - Current date with Go layout
{{ Safe "<html>" }}                - Mark string as safe HTML
{{ L }}                            - i18n helper
```

Plus all Sprig functions (100+ helpers: string manipulation, math, date, crypto, etc.) excluding `env`, `expandenv`, `getHostByName` for security.

### Subscriber Data in Templates
```
{{ .Subscriber.Email }}
{{ .Subscriber.Name }}
{{ .Subscriber.FirstName }}
{{ .Subscriber.LastName }}
{{ .Subscriber.UUID }}
{{ .Subscriber.Attribs.custom_field }}
```

### Markdown Support
Campaign body in Markdown is auto-converted to HTML via goldmark before template compilation.

---

## API Endpoints

### Authentication
All `/api/*` endpoints require authentication (session cookie or API token).
Permission middleware: `pm(handler, "perm:action")`

### Subscriber Endpoints
```
GET    /api/subscribers              - List/query subscribers (paginated)
GET    /api/subscribers/:id          - Get single subscriber
GET    /api/subscribers/:id/activity - Get subscriber campaign activity
GET    /api/subscribers/:id/export   - Export subscriber data
GET    /api/subscribers/export       - Bulk export (gzipped)
POST   /api/subscribers              - Create subscriber
PUT    /api/subscribers/:id          - Update subscriber
PATCH  /api/subscribers/:id          - Partial update
POST   /api/subscribers/:id/optin    - Send opt-in email
PUT    /api/subscribers/blocklist    - Bulk blocklist
DELETE /api/subscribers/:id          - Delete subscriber
DELETE /api/subscribers              - Bulk delete
POST   /api/subscribers/query/delete    - Delete by SQL query
PUT    /api/subscribers/query/blocklist - Blocklist by SQL query
PUT    /api/subscribers/query/lists     - Manage lists by SQL query
```

### Campaign Endpoints
```
GET    /api/campaigns                   - List campaigns
GET    /api/campaigns/:id               - Get campaign
GET    /api/campaigns/:id/preview       - Preview rendered HTML
POST   /api/campaigns/:id/test          - Send test to subscriber emails
POST   /api/campaigns/:id/content       - Convert content format
GET    /api/campaigns/analytics/:type   - View/click analytics
GET    /api/campaigns/running/stats     - Running campaign stats
POST   /api/campaigns                   - Create campaign
PUT    /api/campaigns/:id               - Update campaign
PUT    /api/campaigns/:id/status        - Change status (start/pause/cancel)
PUT    /api/campaigns/:id/archive       - Toggle public archive
DELETE /api/campaigns/:id               - Delete campaign
```

### List Endpoints
```
GET    /api/lists                - List all lists
GET    /api/lists/:id            - Get list
POST   /api/lists                - Create list
PUT    /api/lists/:id            - Update list
DELETE /api/lists/:id            - Delete list
```

### Template Endpoints
```
GET    /api/templates            - List templates
GET    /api/templates/:id        - Get template
GET    /api/templates/:id/preview - Preview template
POST   /api/templates            - Create template
PUT    /api/templates/:id        - Update template
PUT    /api/templates/:id/default - Set as default
DELETE /api/templates/:id        - Delete template
```

### Transactional Email
```
POST   /api/tx                   - Send transactional message (supports file attachments via multipart)
```

### Media
```
GET    /api/media                - List media
POST   /api/media                - Upload media
DELETE /api/media/:id            - Delete media
```

### Public Endpoints (no auth)
```
GET    /api/public/lists         - List public lists
POST   /api/public/subscription  - Subscribe
GET    /api/public/archive       - Get archived campaigns
GET    /archive                  - Public archive page
GET    /archive.xml              - RSS feed
GET    /link/:linkUUID/:campUUID/:subUUID - Link click tracking redirect
GET    /campaign/:campUUID/:subUUID      - View campaign in browser
GET    /campaign/:campUUID/:subUUID/px.png - View tracking pixel
POST   /webhooks/bounce          - Bounce webhook (SES, Sendgrid, Postmark, etc.)
POST   /webhooks/service/:service - Public bounce webhook
GET    /health                   - Health check
```

### RBAC Permissions
Permission strings used with `pm()` middleware:
- `subscribers:get`, `subscribers:get_all`, `subscribers:manage`, `subscribers:import`
- `campaigns:get`, `campaigns:get_all`, `campaigns:manage`, `campaigns:manage_all`, `campaigns:send`, `campaigns:get_analytics`
- `lists:manage_all`
- `templates:get`, `templates:manage`
- `media:get`, `media:manage`
- `settings:get`, `settings:manage`, `settings:maintain`
- `bounces:get`, `bounces:manage`
- `users:get`, `users:manage`
- `roles:get`, `roles:manage`
- `tx:send`
- `webhooks:post_bounce`

---

## Database Schema

### Core Tables

**subscribers** - Email subscribers
```sql
id, uuid, email (UNIQUE, case-insensitive index), name,
attribs JSONB,        -- arbitrary custom fields
status (enabled|disabled|blocklisted),
created_at, updated_at
```

**lists** - Mailing lists
```sql
id, uuid, name, type (public|private|temporary),
optin (single|double), status (active|archived),
tags VARCHAR(100)[], description,
created_at, updated_at
```

**subscriber_lists** - Junction table (many-to-many)
```sql
subscriber_id, list_id,
meta JSONB,
status (unconfirmed|confirmed|unsubscribed),
created_at, updated_at
PRIMARY KEY (subscriber_id, list_id)
```

**campaigns** - Email campaigns
```sql
id, uuid, name, subject, from_email, body, body_source,
altbody,              -- plain text alternative
content_type (richtext|html|plain|markdown|visual),
send_at,              -- scheduled send time
headers JSONB,        -- custom email headers
attribs JSONB,
status (draft|running|scheduled|paused|cancelled|finished),
type (regular|optin),
messenger,            -- "email" or custom postback name
template_id,
to_send, sent,        -- progress tracking
max_subscriber_id, last_subscriber_id,
archive, archive_slug, archive_template_id, archive_meta,
started_at, created_at, updated_at
```

**campaign_lists** - Campaigns to lists mapping
```sql
id, campaign_id, list_id (nullable), list_name (kept after list deletion)
```

**campaign_views** - Open tracking
```sql
id, campaign_id, subscriber_id (nullable), created_at
```

**templates** - Email templates
```sql
id, name, type (campaign|campaign_visual|tx),
subject, body, body_source,
is_default BOOLEAN,
created_at, updated_at
```
Constraint: only one template can have `is_default = true`.

**links** - Tracked links
```sql
id, uuid, url (UNIQUE), created_at
```

**link_clicks** - Click tracking
```sql
id, campaign_id, link_id, subscriber_id (nullable), created_at
```

**media** - Uploaded media/attachments
```sql
id, uuid, provider, filename, content_type, thumb, meta JSONB, created_at
```

**campaign_media** - Campaign attachment mapping
```sql
campaign_id, media_id (nullable), filename
```

**settings** - App settings (key-value JSONB store)
```sql
key TEXT UNIQUE, value JSONB, updated_at
```

**bounces** - Email bounce records
```sql
id, subscriber_id, campaign_id (nullable),
type (soft|hard|complaint),
source, meta JSONB, created_at
```

**roles** - RBAC roles
```sql
id, type (user|list), parent_id, list_id, permissions TEXT[], name, created_at, updated_at
```

**users** - Admin users
```sql
id, username, password_login, password, email, name, avatar,
type (user|api),
user_role_id, list_role_id,
status (enabled|disabled),
twofa_type (none|totp), twofa_key,
loggedin_at, created_at, updated_at
```

**sessions** - User session storage (Postgres-backed)
```sql
id TEXT, data JSONB, created_at
```

### Materialized Views (Performance)
```sql
mat_dashboard_counts      -- Subscriber totals, list counts, campaign counts, message sent totals
mat_dashboard_charts      -- 30-day link click and view chart data
mat_list_subscriber_stats -- Per-list subscriber counts by status
```
These are refreshed concurrently via `core.RefreshMatViews()`. Can be scheduled via cron or triggered on-demand.

---

## Configuration & Setup (Docker)

### Docker Compose (minimal)
```yaml
services:
  app:
    image: listmonk/listmonk:latest
    ports:
      - "9000:9000"
    command: [sh, -c, "./listmonk --install --idempotent --yes --config '' && ./listmonk --upgrade --yes --config '' && ./listmonk --config ''"]
    environment:
      LISTMONK_app__address: 0.0.0.0:9000
      LISTMONK_db__host: db
      LISTMONK_db__user: listmonk
      LISTMONK_db__password: listmonk
      LISTMONK_db__database: listmonk
      LISTMONK_ADMIN_USER: admin        # auto-creates super admin on first run
      LISTMONK_ADMIN_PASSWORD: password

  db:
    image: postgres:17-alpine
```

### Environment Variable Pattern
`LISTMONK_foo__bar` maps to `foo.bar` config key (double underscore = dot for nested keys).
`LISTMONK_*_FILE` pattern supported for Docker secrets.

### config.toml (minimal)
```toml
[app]
address = "localhost:9000"

[db]
host = "localhost"
port = 5432
user = "listmonk"
password = "listmonk"
database = "listmonk"
ssl_mode = "disable"
max_open = 25
max_idle = 25
max_lifetime = "300s"
```

### First-time Setup
```bash
./listmonk --new-config        # Generate config.toml
./listmonk --install           # Create DB schema
./listmonk                     # Run app
./listmonk --upgrade           # Run DB migrations (idempotent)
```

### SMTP Configuration
Configured via admin UI (stored in `settings` table), not config file. Supports multiple SMTP servers as a round-robin pool. Each server config:
```json
{
  "enabled": true,
  "host": "smtp.example.com",
  "port": 587,
  "auth_protocol": "login",   // plain, login, cram, none
  "username": "...",
  "password": "...",
  "max_conns": 10,
  "tls_type": "STARTTLS",     // TLS, STARTTLS, none
  "max_msg_retries": 2
}
```

### Media Storage
- `filesystem` (default) - Local disk at configurable path
- `s3` - AWS S3 or compatible

### Bounce Processing
Supports:
- SES webhooks (SNS)
- Sendgrid webhooks
- Postmark webhooks
- ForwardEmail webhooks
- Lettermint webhooks
- POP3 mailbox scanning

---

## What We Can Reuse

### 1. SQL Query File Pattern (goyesql)
Listmonk loads all SQL queries from named `.sql` files using `goyesql`. Queries are named with `-- name: query-name` comments, loaded at startup, and prepared as `*sqlx.Stmt`. This is a clean pattern for large apps with many SQL queries.

### 2. SMTP Pool Design
`internal/messenger/email/email.go` wraps `smtppool` - a round-robin pool of SMTP connections. Multiple SMTP servers can be defined (e.g., different providers as fallbacks). Pattern: `Messenger` interface with `Name()`, `Push()`, `Flush()`, `Close()` - easily extensible to SMS, Zalo OA, etc.

### 3. Messenger Interface Pattern
```go
type Messenger interface {
    Name() string
    Push(models.Message) error
    Flush() error
    Close() error
}
```
This abstraction allows dropping in any delivery channel. For Vietnam market, could implement Zalo OA or ESMS as a Messenger.

### 4. Campaign Pipeline Pattern
The `pipe` concept: one goroutine-based state machine per running campaign, fetching subscribers in configurable batches, with built-in pause/cancel/resume support. Reusable for any bulk async messaging system.

### 5. Materialized View Cache Pattern
Dashboard stats and per-list subscriber counts use PostgreSQL materialized views refreshed concurrently. Avoids expensive COUNT queries on every page load. Can be refreshed on a cron schedule or on-demand.

### 6. Subscriber Attribute System (JSONB)
The `attribs JSONB` column on subscribers is a powerful pattern. Store arbitrary custom fields without schema changes. Expose in templates. Can be used for segmentation, personalization, CRM data.

### 7. Tracking System
- Click tracking: All links replaced with `/link/:linkUUID/:campUUID/:subUUID` redirects
- View tracking: 1x1 transparent PNG at `/campaign/:campUUID/:subUUID/px.png`
- Links cached in-memory after first DB registration to avoid per-message DB writes
- Individual tracking optional (uses real subscriber UUID vs. dummy UUID for privacy)

### 8. Template Function Architecture
The `TemplateFuncs()` pattern: inject campaign-aware functions (TrackLink, UnsubscribeURL, etc.) into Go's `html/template` FuncMap. Combined with Sprig for 100+ utility functions. Clean extension point.

### 9. Double Opt-in Flow
Complete implementation: subscribe -> send optin campaign -> subscriber clicks -> confirm subscription. The `optin` campaign type auto-generates the message body.

### 10. Privacy Controls
Built-in GDPR features: export subscriber data, wipe subscriber data, disable tracking, unsubscribe header (RFC 2369 `List-Unsubscribe`), domain blocklist/allowlist for subscriptions.

---

## Lessons & Best Practices

### Architecture
- **Single binary wins for self-hosted tools**: Everything embedded (static assets, templates, SQL) via stuffbin. Zero external dependencies beyond Postgres. Reduces operational complexity.
- **Core package pattern**: Separate `internal/core/` as the DB layer that returns `echo.HTTPError` directly. HTTP handlers just call core and return. Clean separation, no error translation needed.
- **Named SQL files over ORM**: `queries/*.sql` files with goyesql. All queries are visible, optimizable, and reviewable. No magic. Prepared statements = performance.

### Campaign Sending
- **Batch size matters**: Default 1000 subscribers per batch from DB. Too small = too many queries. Too large = memory pressure. Make it configurable.
- **Channel buffering**: `campMsgQ` is buffered at `Concurrency * MessageRate * 2`. Prevents producer blocking while workers are busy.
- **Sliding window for shared SMTP**: If using a shared SMTP with hourly limits, the sliding window prevents exceeding provider limits.
- **Separate scan from send**: `ScanCampaigns` flag allows running multiple app instances where only one processes campaigns. Good for scaling.

### Database
- **UUID for public identifiers**: All subscriber and campaign public URLs use UUID, not integer IDs. Prevents enumeration attacks.
- **Nullable foreign keys for historical data**: `campaign_lists.list_id` is nullable with a `list_name` copy. Deleted lists don't break campaign history.
- **JSONB for settings**: The entire app settings is a key-value JSONB store in DB. No config file reload needed for settings changes - just UPDATE + reload signal.
- **Materialized views for analytics**: Expensive aggregate queries run as materialized views refreshed on a schedule. Dashboard loads instantly.
- **Case-insensitive email index**: `CREATE UNIQUE INDEX ON subscribers(LOWER(email))` - prevents duplicate subscriptions from case variations.

### Security
- **RBAC with list-level permissions**: Users can be restricted to specific lists. Campaign access is filtered by list permissions. Fine-grained access control.
- **OIDC + TOTP 2FA**: Built-in SSO and two-factor auth. Important for multi-user setups.
- **SQL injection prevention**: Arbitrary subscriber queries from admin UI are sanitized (strip semicolons, whitespace trim). Still uses parameterized queries for values.
- **CAPTCHA on public subscription form**: Altcha (free, privacy-friendly) and hCaptcha supported.

### Tracking
- **Opt-out tracking by default**: `privacy.disable_tracking` disables all tracking. `privacy.individual_tracking` is separate from tracking existence - can track aggregate without individual attribution.
- **Link UUID caching**: After a link URL is registered in DB, its UUID is cached in-memory. No DB hit per email sent for the same link.

### Deployment
- **`--install --idempotent` pattern**: Schema installation is idempotent. Safe to run on every container start. DB migration (`--upgrade`) also idempotent.
- **Environment variable override**: Every config.toml key overridable via `LISTMONK_` env vars. Standard 12-factor app pattern.
- **SIGHUP for hot reload**: Send SIGHUP to reload config without full restart.

### For Vietnam Market Adaptation
- Can add Zalo OA as a custom `Messenger` implementation (same interface as email)
- Can add VNPay/MoMo webhook as a bounce-like processor for payment notifications
- JSONB attribs can store Vietnam-specific fields (phone, province, zalo_id)
- Arbitrary SQL query system supports complex Vietnamese market segmentation
