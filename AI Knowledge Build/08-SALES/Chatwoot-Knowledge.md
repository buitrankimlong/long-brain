---
tags: [knowledge, sales, support, chatwoot, omnichannel, ruby-on-rails]
moc: "[[08 Ban Hang Tu Dong]]"
source_repo: chatwoot
files_read: 62
---

# Chatwoot - Knowledge Extraction

> Open-source customer support platform. Alternative to Intercom, Zendesk, Salesforce Service Cloud.
> Ruby on Rails 7.1 backend + Vue 3 frontend. Fully self-hostable.

---

## Overview & Architecture

Chatwoot is a **multi-tenant omnichannel customer support platform** built around three core concepts:

1. **Inbox** — a configured channel connection (WhatsApp number, email address, Facebook page, website widget, etc.)
2. **Conversation** — a thread between a contact and an agent, always tied to one inbox
3. **Contact** — a customer profile that can have conversations across multiple inboxes

The architecture follows a **pub/sub event-driven pattern** using the `wisper` gem. Events like `conversation_created`, `message_created`, `conversation_status_changed` are published and consumed by listeners that trigger webhooks, notifications, automation rules, and AI actions.

**Key architectural layers:**
```
HTTP Request
  → Controller (API v1/v2)
    → Builder / Service
      → Model (ActiveRecord)
        → Callback / Concern (fires ActiveRecord callbacks)
          → Dispatcher.dispatch(event_name, ...)
            → SyncDispatcher (immediate)
            → AsyncDispatcher (via Sidekiq)
              → WebhookListener
              → AutomationRuleListener
              → NotificationListener
              → ReportingEventListener
              → ActionCableListener (realtime UI)
```

**Enterprise features** live in `enterprise/` and are loaded alongside the core app via Rails eager load paths. Features are gated with `ChatwootApp.enterprise?` checks.

---

## Tech Stack & Dependencies

### Backend
| Layer | Technology |
|---|---|
| Language | Ruby 3.4.4 |
| Framework | Rails 7.1 |
| Web server | Puma |
| Background jobs | Sidekiq + sidekiq-cron |
| Database | PostgreSQL 16 (with pgvector extension) |
| Cache / PubSub | Redis |
| Asset bundling | Vite (vite_rails) |
| Auth | devise + devise_token_auth + Pundit |
| Real-time | ActionCable (WebSockets) |

### Key Gems
```ruby
gem 'wisper', '2.0.0'           # pub/sub event bus
gem 'liquid'                     # template variables in messages
gem 'neighbor' + 'pgvector'      # vector similarity search for AI
gem 'ruby-openai'                # OpenAI API
gem 'ai-agents', '>= 0.10.0'    # agentic AI runner (Captain V2)
gem 'facebook-messenger'         # Facebook/Messenger
gem 'twilio-ruby'                # Twilio SMS/Voice
gem 'slack-ruby-client'          # Slack integration
gem 'google-cloud-dialogflow-v2' # Dialogflow bots
gem 'google-cloud-translate-v3'  # Real-time translation
gem 'searchkick' + 'opensearch-ruby' # Full-text search
gem 'stripe'                     # Billing
gem 'audited'                    # Audit logs
gem 'rack-attack'                # Rate limiting
gem 'pundit'                     # Authorization policies
```

### Frontend
- Vue 3 with Composition API (`<script setup>`)
- Tailwind CSS (no custom CSS, no scoped styles)
- Vite for bundling
- Vitest for tests

---

## Project Structure

```
chatwoot/
├── app/
│   ├── actions/          # Reusable action objects
│   ├── builders/         # Object construction (ConversationBuilder, MessageBuilder, etc.)
│   ├── channels/         # ActionCable channels (RoomChannel)
│   ├── controllers/
│   │   ├── api/v1/accounts/   # Main REST API (conversations, contacts, inboxes, etc.)
│   │   ├── api/v2/            # V2 API endpoints
│   │   ├── webhooks/          # Incoming webhook endpoints (Facebook, WhatsApp, Telegram, etc.)
│   │   ├── public/            # Unauthenticated widget API
│   │   └── platform/          # Platform API (multi-account management)
│   ├── dispatchers/      # Event dispatching (sync + async)
│   ├── jobs/             # Sidekiq background jobs
│   ├── listeners/        # Event listeners (webhook, automation, notification, etc.)
│   ├── models/
│   │   ├── channel/      # Channel-specific models (Whatsapp, Email, Telegram, etc.)
│   │   └── concerns/     # Shared model behaviors
│   └── services/         # Business logic services
│       ├── conversations/ # Assignment, filtering, message window
│       ├── automation_rules/ # Condition filtering, action execution
│       ├── auto_assignment/  # Round-robin, agent assignment
│       ├── whatsapp/     # WhatsApp send/receive
│       ├── facebook/     # Facebook/Instagram messaging
│       ├── telegram/     # Telegram messaging
│       └── llm_formatter/ # Format records for LLM context
├── enterprise/           # Enterprise-only features
│   └── app/
│       ├── models/captain/   # Captain AI assistant, document, scenario models
│       └── services/captain/ # Captain AI services (LLM, tools, copilot, assistant)
├── config/
│   ├── routes.rb         # All API routes
│   └── sidekiq.yml       # Queue configuration
├── db/migrate/           # 200+ migrations
└── swagger/              # OpenAPI spec
```

---

## Channel System (Omni-Channel Architecture)

All channels share a common pattern via the `Channelable` concern:
- Every channel has its own DB table (`channel_whatsapp`, `channel_email`, etc.)
- Every channel has a polymorphic `has_one :inbox` — agents work through the Inbox abstraction
- Channel-specific logic is encapsulated in the channel model and corresponding services

### Supported Channels

| Channel | Model | Table | Key Gem/API |
|---|---|---|---|
| Website Live Chat | `Channel::WebWidget` | `channel_web_widgets` | Custom JS widget + ActionCable |
| Email (SMTP/IMAP) | `Channel::Email` | `channel_email` | ActionMailbox + IMAP polling |
| WhatsApp (360dialog) | `Channel::Whatsapp` | `channel_whatsapp` | 360dialog REST API |
| WhatsApp Cloud | `Channel::Whatsapp` | `channel_whatsapp` | Meta Cloud API |
| Facebook Messenger | `Channel::FacebookPage` | `channel_facebook_pages` | `facebook-messenger` gem |
| Instagram | `Channel::Instagram` | `channel_instagram` | Instagram Graph API |
| Telegram | `Channel::Telegram` | `channel_telegram` | Telegram Bot API |
| SMS (Bandwidth) | `Channel::Sms` | `channel_sms` | Bandwidth API |
| Twilio SMS | `Channel::TwilioSms` | `channel_twilio_sms` | `twilio-ruby` |
| Twitter/X | `Channel::TwitterProfile` | `channel_twitter_profiles` | `twitty` gem |
| Line | `Channel::Line` | `channel_line` | `line-bot-api` |
| TikTok | `Channel::Tiktok` | `channel_tiktok` | TikTok API |
| API Channel (custom) | `Channel::Api` | `channel_api` | Webhook-based, HMAC signed |

### Channel Pattern - How Incoming Messages Work

**WhatsApp example flow:**
```
POST /webhooks/whatsapp/:phone_number
  → Webhooks::WhatsappController
    → Whatsapp::IncomingMessageService
      → ContactInboxWithContactBuilder (find or create contact)
      → ConversationBuilder (find or create conversation)
      → Messages::MessageBuilder (create message record)
        → after_create callback on Message
          → Dispatcher.dispatch(:message_created, ...)
            → WebhookListener (fires outbound webhooks)
            → AutomationRuleListener (check automation rules)
            → NotificationListener (push notifications)
            → ActionCableListener (realtime update to UI)
```

**Outbound message flow:**
```
POST /api/v1/accounts/:id/conversations/:conv_id/messages
  → Messages::MessageBuilder.perform
    → message.save!
    → SendReplyJob (async)
      → Whatsapp::SendOnWhatsappService
        → channel.send_message(contact_inbox.source_id, message)
          → WhatsappCloudService / Whatsapp360DialogService
```

### WhatsApp Provider Pattern
```ruby
# Channel::Whatsapp selects provider at runtime:
def provider_service
  if provider == 'whatsapp_cloud'
    Whatsapp::Providers::WhatsappCloudService.new(whatsapp_channel: self)
  else
    Whatsapp::Providers::Whatsapp360DialogService.new(whatsapp_channel: self)
  end
end

# All providers implement the same interface:
delegate :send_message, to: :provider_service
delegate :send_template, to: :provider_service
delegate :sync_templates, to: :provider_service
```

### API Channel (Custom Integration)
```ruby
# Channel::Api — for custom integrations via webhooks
# Supports HMAC token for verification
# Configured with a webhook_url that receives all events
# Agents reply via Chatwoot → outbound webhook to your system
class Channel::Api < ApplicationRecord
  has_secure_token :identifier
  has_secure_token :hmac_token
  include WebhookSecretable
end
```

### Web Widget
```ruby
class Channel::WebWidget < ApplicationRecord
  # Feature flags (bitmask): attachments, emoji_picker, end_conversation,
  #                           use_inbox_avatar_for_bot, allow_mobile_webview
  has_flags 1 => :attachments,
            2 => :emoji_picker,
            3 => :end_conversation,
            :column => 'feature_flags'

  # HMAC verification for identity continuity
  has_secure_token :website_token
  has_secure_token :hmac_token

  # Pre-chat form to collect user info before starting conversation
  # Supports: email, phone, name with custom fields
end
```

---

## Captain AI (AI Assistant)

Captain is the enterprise AI layer. It has two distinct modes:

### 1. Captain Assistant (Customer-facing AI)
Handles incoming customer conversations autonomously. Uses the `ai-agents` gem for multi-agent orchestration.

```ruby
# Captain::Assistant model
class Captain::Assistant < ApplicationRecord
  # config JSONB: temperature, feature_faq, feature_memory,
  #               feature_contact_attributes, product_name
  store_accessor :config, :temperature, :feature_faq, :feature_memory,
                           :feature_contact_attributes, :product_name

  has_many :documents       # Knowledge base documents (URLs, PDFs)
  has_many :scenarios       # Branching conversation scenarios
  has_many :captain_inboxes # Which inboxes this assistant is active on
  has_many :inboxes, through: :captain_inboxes
end
```

**Agent Runner (V2 - Multi-agent system):**
```ruby
class Captain::Assistant::AgentRunnerService
  def generate_response(message_history: [])
    # Builds context: conversation state, contact info, campaign info
    # Runs through Agents::Runner with max 100 turns
    # On tool call to HandoffTool → transfers to human agent
    result = runner.run(message_to_process, context: context, max_turns: 100)
    process_agent_result(result)
  end

  private

  def build_and_wire_agents
    assistant_agent = @assistant.agent
    scenario_agents = @assistant.scenarios.enabled.map(&:agent)
    # Scenarios can handoff back to main assistant
    assistant_agent.register_handoffs(*scenario_agents)
    scenario_agents.each { |a| a.register_handoffs(assistant_agent) }
    [assistant_agent] + scenario_agents
  end
end
```

### 2. Captain Copilot (Agent-facing AI)
AI assistant for support agents — helps agents craft replies, search documentation, get conversation summaries.

```ruby
class Captain::Copilot::ChatService
  def build_tools
    [
      Captain::Tools::SearchDocumentationService,       # Search knowledge base
      Captain::Tools::Copilot::GetConversationService,  # Fetch conversation details
      Captain::Tools::Copilot::SearchConversationsService,
      Captain::Tools::Copilot::GetContactService,
      Captain::Tools::Copilot::GetArticleService,
      Captain::Tools::Copilot::SearchArticlesService,
      Captain::Tools::Copilot::SearchContactsService,
      Captain::Tools::Copilot::SearchLinearIssuesService,
    ].map { |klass| klass.new(@assistant, user: @user) }.select(&:active?)
  end
end
```

### Captain LLM Services
```ruby
# Embeddings for RAG (pgvector)
class Captain::Llm::EmbeddingService
  def get_embedding(content)
    RubyLLM.embed(content, model: @embedding_model).vectors
  end
end

# AI Tasks available via API
# POST /api/v1/accounts/:id/captain/tasks/reply_suggestion
# POST /api/v1/accounts/:id/captain/tasks/summarize
# POST /api/v1/accounts/:id/captain/tasks/rewrite
# POST /api/v1/accounts/:id/captain/tasks/label_suggestion
# POST /api/v1/accounts/:id/captain/tasks/follow_up
```

### Captain Tools Pattern
```ruby
class Captain::Tools::BaseTool < RubyLLM::Tool
  # Each tool is a RubyLLM::Tool — auto-generates OpenAI function spec
  # Tools check user permissions before executing
  def active?
    true  # Override to conditionally enable tools
  end

  def user_has_permission(permission)
    account_user.administrator? || account_user.agent?
  end
end
```

### Action Classifier (Handoff Decision)
Captain uses a classifier to decide: **continue with AI** or **handoff to human**:
```
"continue": general product questions, pricing, how-to, setup
"handoff":  user explicitly asks for human, account-specific issues (orders,
            payments, refunds), repeated frustration, operational bugs
```

### Knowledge Base (RAG)
- Documents stored in `captain_documents` table with vector embeddings
- Uses pgvector + neighbor gem for cosine similarity search
- Supports URL crawling (Firecrawl integration) and PDF processing
- Auto-sync via `Captain::Documents::SyncService`

---

## Conversation Management

### Conversation Model
```ruby
class Conversation < ApplicationRecord
  # Status lifecycle
  enum status: { open: 0, resolved: 1, pending: 2, snoozed: 3 }

  # Priority levels
  enum priority: { low: 0, medium: 1, high: 2, urgent: 3 }

  # Key timestamps
  # first_reply_created_at — tracks first response time for SLA
  # last_activity_at       — used for auto-resolve logic
  # waiting_since          — tracks how long customer has been waiting
  # snoozed_until          — when to re-open snoozed conversations

  # Scopes for common queries
  scope :unassigned, -> { where(assignee_id: nil) }
  scope :unattended, -> { where(first_reply_created_at: nil).or(where.not(waiting_since: nil)) }
  scope :resolvable_not_waiting, lambda { |auto_resolve_after|
    open.where('last_activity_at < ?', Time.now.utc - auto_resolve_after.minutes)
  }
end
```

### Message Types
```ruby
enum message_type: { incoming: 0, outgoing: 1, activity: 2, template: 3 }

enum content_type: {
  text: 0,
  input_text: 1,        # Form input
  input_textarea: 2,
  input_email: 3,
  input_select: 4,
  cards: 5,             # Rich card messages
  form: 6,              # Interactive forms
  article: 7,           # Help center articles
  incoming_email: 8,
  input_csat: 9,        # CSAT survey
  integrations: 10,
  sticker: 11,
  # ... more types
}
```

### Conversation Creation Pattern
```ruby
# Always use ContactInbox as the bridge between Contact and Inbox
contact_inbox = ContactInboxWithContactBuilder.new({
  source_id: external_id,  # e.g., WhatsApp phone number
  inbox: inbox,
  contact_attributes: { name: name, phone_number: phone }
}).perform

conversation = ConversationBuilder.new(
  params: params,
  contact_inbox: contact_inbox
).perform

Messages::MessageBuilder.new(user, conversation, params).perform
```

### Auto-Resolve
```ruby
# Account-level setting: auto_resolve_after (minutes)
# Job runs periodically via sidekiq-cron
# Resolves conversations with no activity after threshold
scope :resolvable_not_waiting, lambda { |auto_resolve_after|
  open.where('last_activity_at < ? AND waiting_since IS NULL',
             Time.now.utc - auto_resolve_after.minutes)
}
```

---

## Contact & CRM Features

### Contact Model
```ruby
class Contact < ApplicationRecord
  enum contact_type: { visitor: 0, lead: 1, customer: 2 }

  # Unique per account: email, phone_number, identifier
  # custom_attributes: JSONB for arbitrary fields
  # additional_attributes: JSONB for metadata (company_name, city, etc.)

  # Full-text search index on: name, email, phone_number, identifier
  # GIN index for fast JSONB queries on additional_attributes
end
```

### CRM Features Available
- Contact profiles with name, email, phone, location, country
- Custom attributes (JSONB) — per account, per contact
- Contact notes — human-written or AI-generated
- Contact segments — filter-based groupings
- Company associations (B2B CRM)
- Import/export (CSV)
- AI-powered attribute extraction from conversations
- Contact activity history across all conversations
- CSAT responses linked to contacts

### Contact Deduplication
```ruby
# Unique constraints: (email, account_id), (identifier, account_id)
# Phone: E.164 format validation (+[1-9]\d{1,14})
# GIN index for fast lookups on non-empty fields
index_contacts_on_nonempty_fields (account_id, email, phone_number, identifier)
  WHERE email != '' OR phone_number != '' OR identifier != ''
```

---

## Automation Rules & Webhooks

### Automation Rules
Rules are `event_name` + `conditions[]` + `actions[]`:

**Trigger events:**
- `conversation_created`, `conversation_updated`, `conversation_opened`
- `conversation_resolved`, `message_created`

**Conditions (filterable attributes):**
```ruby
%w[content email country_code status message_type browser_language
   assignee_id team_id referer city company_name inbox_id
   mail_subject phone_number priority conversation_language
   labels private_note]
# + custom attribute keys
```

**Actions:**
```ruby
%w[send_message add_label remove_label send_email_to_team
   assign_team assign_agent remove_assigned_agent remove_assigned_team
   send_webhook_event mute_conversation send_attachment change_status
   resolve_conversation open_conversation pending_conversation
   snooze_conversation change_priority send_email_transcript
   add_private_note]
```

**Example rule execution:**
```ruby
class AutomationRules::ActionService < ActionService
  def perform
    @rule.actions.each do |action|
      action = action.with_indifferent_access
      send(action[:action_name], action[:action_params])
    end
  end

  def send_message(message)
    params = { content: message[0], private: false,
               content_attributes: { automation_rule_id: @rule.id } }
    Messages::MessageBuilder.new(nil, @conversation, params).perform
  end

  def send_webhook_event(webhook_url)
    payload = @conversation.webhook_data.merge(
      event: "automation_event.#{@rule.event_name}"
    )
    WebhookJob.perform_later(webhook_url[0], payload)
  end
end
```

### Webhook System
```ruby
class Webhook < ApplicationRecord
  # Types: account_type (all inboxes) or inbox_type (specific inbox)
  enum webhook_type: { account_type: 0, inbox_type: 1 }

  # Subscribable events:
  ALLOWED_WEBHOOK_EVENTS = %w[
    conversation_status_changed  conversation_updated  conversation_created
    contact_created  contact_updated
    message_created  message_updated
    webwidget_triggered
    inbox_created  inbox_updated
    conversation_typing_on  conversation_typing_off
  ].freeze

  # Each webhook has an optional HMAC secret for payload verification
  # Delivery includes X-Chatwoot-Signature header
end
```

**Webhook payload structure:**
```ruby
# All webhooks include event name + relevant data
# conversation_status_changed includes changed_attributes
payload = conversation.webhook_data.merge(
  event: 'conversation_status_changed',
  changed_attributes: { status: ['open', 'resolved'] }
)
# Delivered async via WebhookJob (Sidekiq queue: :medium)
WebhookJob.perform_later(webhook.url, payload, :account_webhook,
                         secret: webhook.secret, delivery_id: SecureRandom.uuid)
```

### Macros
One-click action sequences for agents:
```ruby
# Macros are reusable sequences of automation actions
# Executed via POST /api/v1/accounts/:id/macros/:id/execute
# Same action types as AutomationRules
```

---

## API & Integration Patterns

### REST API Structure
```
GET/POST/PATCH/DELETE /api/v1/accounts/:account_id/
  conversations/          # CRUD + filter + search + meta
  conversations/:id/messages/   # Messages in conversation
  conversations/:id/assignments/
  conversations/:id/labels/
  contacts/               # CRUD + search + filter + import/export
  contacts/:id/conversations/
  inboxes/                # CRUD
  agents/                 # CRUD
  teams/                  # CRUD
  automation_rules/       # CRUD + clone
  macros/                 # CRUD + execute
  webhooks/               # CRUD
  campaigns/              # CRUD
  canned_responses/       # CRUD
  labels/                 # CRUD
  captain/assistants/     # Captain AI management
  captain/copilot_threads/ # Copilot chat sessions
  captain/tasks/          # AI tasks: summarize, suggest reply, etc.
  captain/documents/      # Knowledge base documents

# Public widget API (unauthenticated, per website_token)
GET/POST /api/v1/widget/
  conversations/
  messages/
  contacts/
```

### Authentication
- **Agents/Admins:** `devise_token_auth` — `access-token`, `token-type`, `client`, `uid` headers
- **Widget:** `website_token` query param
- **Platform API:** Bearer token
- **API Channel / Agent Bots:** `api_access_token` query param or header
- **HMAC Verification:** Optional for widget identity continuity

### Liquid Templating in Messages
```ruby
# Messages support Liquid template variables
# Example: "Hi {{contact.name}}, your ticket #{{conversation.display_id}} is resolved."
gem 'liquid'
include Liquidable  # on Message model
# Variables: contact.name, contact.email, conversation.id, agent.name, etc.
```

### Integrations (Hooks)
```ruby
# Integrations::Hook model for third-party integrations
# Available integrations: Slack, Dialogflow, Google Translate,
#                         Linear, Shopify, Dashboard Apps
# Each hook has settings JSONB and is scoped to account or inbox
```

---

## Database & Data Patterns

### Core Tables
| Table | Purpose |
|---|---|
| `accounts` | Multi-tenant root. feature_flags (bitmask), settings (JSONB), limits (JSONB) |
| `inboxes` | Channel configurations. `channel_id` + `channel_type` (polymorphic) |
| `conversations` | All conversations. status, priority, assignee, team, contact |
| `messages` | All messages. content, content_type, message_type, attachments |
| `contacts` | Customer profiles. email, phone, identifier (all unique per account) |
| `contact_inboxes` | Join table: Contact ↔ Inbox. `source_id` = external platform ID |
| `webhooks` | Outbound webhook configs. subscriptions (JSONB array) |
| `automation_rules` | Event-condition-action rules. conditions/actions (JSONB) |
| `captain_assistants` | AI assistants. config (JSONB) |
| `captain_documents` | Knowledge base. embeddings stored with pgvector |

### Channel Tables
Each channel has a dedicated table: `channel_web_widgets`, `channel_email`, `channel_whatsapp`, `channel_facebook_pages`, `channel_instagram`, `channel_telegram`, `channel_sms`, `channel_twilio_sms`, `channel_twitter_profiles`, `channel_line`, `channel_tiktok`, `channel_api`

### Vector Search (pgvector)
```ruby
# Article embeddings for Captain knowledge base
# Uses pgvector extension + neighbor gem
gem 'neighbor'   # cosine similarity queries in ActiveRecord
gem 'pgvector'   # PostgreSQL vector type support

# Embedding model configurable via InstallationConfig
# Default: OpenAI text-embedding-ada-002 or similar
# Search: cosine similarity on stored vectors
```

### Key JSONB Usage Patterns
```ruby
# Conversations: additional_attributes (browser info, referer), custom_attributes
# Contacts: additional_attributes (company, city), custom_attributes
# Webhooks: subscriptions (array of event names)
# AutomationRules: conditions[], actions[]
# Inboxes: auto_assignment_config, csat_config
# Accounts: settings (auto_resolve, captain config), limits, internal_attributes
# Messages: content_attributes (reply-to, CC/BCC), additional_attributes (template_params)
```

### Important Indexes
```sql
-- Conversations: composite index for inbox filtering
(account_id, inbox_id, status, assignee_id)

-- Messages: full-text GIN index
(content) USING gin

-- Contacts: GIN index for multi-field search
(name, email, phone_number, identifier) USING gin

-- Messages: JSONB GIN index for campaign lookup
((additional_attributes -> 'campaign_id')) USING gin
```

### Round-Robin Assignment (Redis)
```ruby
# Agent queues stored in Redis lists, not DB
# Key format: ROUND_ROBIN_AGENTS:inbox_id:{id}
# lpush / lrem / lrange operations for queue management
# Intersection with online agents for smart assignment
class AutoAssignment::InboxRoundRobinService
  def available_agent(allowed_agent_ids: [])
    reset_queue unless validate_queue?
    user_id = queue.intersection(allowed_agent_ids).pop
    # Re-enqueue at end (circular)
    pop_push_to_queue(user_id)
  end
end
```

### Online Presence (Redis)
```ruby
# Agent online status tracked via Redis
# ActionCable RoomChannel broadcasts presence updates
OnlineStatusTracker.update_presence(account_id, 'User', user_id)
OnlineStatusTracker.get_available_users(account_id)
# Values: 'online', 'busy', 'offline'
```

---

## Configuration & Setup (Docker, Env Vars)

### Docker Compose Services
```yaml
services:
  rails:     # Rails app on port 3000
  sidekiq:   # Background job worker
  vite:      # Frontend dev server on port 3036
  postgres:  # pgvector/pgvector:pg16 (supports vector extension)
  redis:     # Redis with password auth
  mailhog:   # Email testing (dev only)
```

### Key Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...
REDIS_PASSWORD=...

# Email
SMTP_ADDRESS, SMTP_PORT, SMTP_USER_NAME, SMTP_PASSWORD
MAILER_INBOUND_EMAIL_DOMAIN=  # for inbound email routing

# Storage (Active Storage)
STORAGE_SERVICE=  # local | amazon | google | azure

# Captain AI
CAPTAIN_OPEN_AI_API_KEY=
CAPTAIN_EMBEDDING_MODEL=  # default: text-embedding-ada-002
OPENAI_API_KEY=

# Channels
FB_APP_ID, FB_APP_SECRET, FB_VERIFY_TOKEN
TWITTER_APP_ID, TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET
SLACK_CLIENT_ID, SLACK_CLIENT_SECRET

# Monitoring (optional)
SENTRY_DSN=
DD_TRACE_AGENT_URL=         # Datadog
NEW_RELIC_LICENSE_KEY=
SCOUT_KEY=

# Feature flags
CW_API_ONLY_SERVER=false    # No frontend, API only mode

# Encryption (for credentials)
ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY=
ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY=
ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT=
```

### Sidekiq Queues
```yaml
# Queues processed in priority order
queues:
  - critical
  - medium
  - low
  - mailers
```

### Enterprise Features Activation
Enterprise features loaded from `enterprise/` directory. Feature gating via:
```ruby
ChatwootApp.enterprise?           # Is enterprise build
account.feature_enabled?(:captain) # Per-account features via bitmask
InstallationConfig.find_by(name: 'CAPTAIN_EMBEDDING_MODEL')  # DB-stored config
```

---

## What We Can Reuse

### 1. Channel Abstraction Pattern
The `Channelable` concern + polymorphic `channel` on `Inbox` is clean. We can replicate this for any multi-channel system — one `Inbox` model, many channel types, each with its own table.

### 2. Event-Driven Architecture via Wisper
```ruby
# Dispatcher pattern: fire events after model saves
# Listeners handle side effects (webhooks, notifications, AI)
# SyncDispatcher (immediate) + AsyncDispatcher (Sidekiq) separation is elegant
Dispatcher.dispatch(:conversation_created, Time.current, { conversation: conv })
```

### 3. Round-Robin Assignment (Redis-backed)
Redis list for agent queues. Intersection with online agents. No DB writes per assignment check. Can be adapted for any load-balancing scenario.

### 4. Automation Rule Engine Pattern
`conditions[] + actions[]` in JSONB, validated against allowed attribute/action lists, executed by ActionService via `send(action_name, params)`. Extensible without schema changes.

### 5. Captain Tools Pattern (Function Calling)
```ruby
class MyTool < RubyLLM::Tool
  # Auto-generates OpenAI function spec
  # Tool registry pattern for dynamic tool loading
  # Permission checks before execution
end
```

### 6. LLM Formatter Pattern
```ruby
# model.to_llm_text → formatted string for LLM context
# Separate formatter class per model type
# ConversationLlmFormatter, ContactLlmFormatter, ArticleLlmFormatter
```

### 7. Liquid Templates for Messages
Configurable message templates with contact/conversation variables. No code changes needed to personalize messages.

### 8. Contact Deduplication Strategy
Multi-field unique constraints (email, phone, identifier) each unique per account. GIN index on all searchable fields. Separate `contact_inboxes` join table tracks which platform ID maps to which contact.

### 9. CSAT Survey System
Automatic survey sending after conversation resolution. Configurable per inbox. Response model linked to contact + conversation. Reporting built in.

### 10. SLA Policies (Enterprise)
```ruby
class SlaPolicy
  # first_response_time_threshold (hours)
  # next_response_time_threshold (hours)
  # resolution_time_threshold (hours)
  # only_during_business_hours (boolean)
  # Applied per conversation
end
```

---

## Lessons & Best Practices

### 1. Channel Isolation via Polymorphism
Keep channel-specific code in channel models. The `Inbox` model is channel-agnostic. This prevents the inbox from becoming a god object.

### 2. ContactInbox as Source-of-Truth Bridge
The `contact_inboxes` table + `source_id` field is the key to mapping external platform IDs (WhatsApp phone, Facebook PSID) to internal contacts. Always look up or create via this join.

### 3. Conversation Status as State Machine
`open → pending → snoozed → resolved` with clear transitions. Auto-resolve on inactivity. `waiting_since` tracks customer wait time separately from `last_activity_at`.

### 4. JSONB for Extensibility, DB Columns for Filtering
Custom attributes in JSONB. But status, assignee_id, team_id, priority are proper DB columns with indexes because they're used in WHERE clauses.

### 5. Background Jobs for Everything Slow
Webhook delivery, email sending, AI processing — all in Sidekiq. Never block the Rails request cycle. Use `perform_later` by default.

### 6. Redis for Ephemeral/High-Frequency Data
Online status and round-robin queues in Redis, not PostgreSQL. DB for persistent state, Redis for operational/ephemeral state.

### 7. Rate Limiting at Multiple Levels
- `rack-attack` for request-level limiting
- Account-level email rate limiting (`AccountEmailRateLimitable`)
- Captain AI response usage tracking per account

### 8. Encryption for Sensitive Channel Credentials
```ruby
# Rails 7.1 Active Record Encryption for channel secrets
encrypts :page_access_token   # Facebook
encrypts :bot_token           # Telegram
encrypts :imap_password       # Email
encrypts :smtp_password       # Email
```
Guard with `if Chatwoot.encryption_configured?` to allow gradual rollout.

### 9. Feature Flags via Bitmask (FlagShihTzu)
```ruby
# Single integer column stores multiple boolean flags
# No schema migrations needed for new feature flags
# Used on Account (feature flags) and Channel::WebWidget
gem 'flag_shih_tzu'
```

### 10. API Versioning (v1 + v2)
Keep `/api/v1` stable. Add `/api/v2` for breaking changes. Run both in parallel. Widget has its own public namespace with no auth.

### 11. Captain V2 Multi-Agent Design
Main assistant + scenario agents that can handoff to each other. HandoffTool signals when to escalate to human. Max 100 turns prevents infinite loops. OTEL instrumentation for cost tracking.

### 12. Liquid Templates Over Code Changes
Use Liquid templating for personalizable outbound messages. Canned responses + automation messages both support Liquid. Agents can craft templates without developer involvement.
