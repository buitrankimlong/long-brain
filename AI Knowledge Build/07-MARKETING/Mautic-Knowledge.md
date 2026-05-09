---
tags: [knowledge, marketing, automation, mautic, php, symfony]
source_repo: mautic
files_read: 62
---

# Mautic - Knowledge Extraction

## Overview & Architecture

Mautic is the world's largest open-source marketing automation platform. Built on **Symfony** (currently targeting Symfony 7.4 / PHP 8.2+), it delivers full campaign automation, email marketing, contact management, lead scoring, and multi-channel outreach in a self-hosted package.

**Current Version**: 7.x (repo at `mautic/core-lib ^7.0`)
**License**: GPL-3.0
**Architecture Style**: Symfony bundle-based monolith — each feature domain is a Bundle registered in `AppKernel`.

Key architectural traits:
- Symfony HttpKernel with a custom `AppKernel` that detects install state and bootstraps bundles dynamically
- Doctrine ORM + Doctrine Migrations for all persistence
- API Platform for REST API (replaces legacy custom REST layer)
- Symfony Messenger for async queue processing (replaces old SwiftMailer spooling)
- Plugin system: third-party plugins are auto-discovered from `plugins/` directory as Symfony Bundles
- All entities inherit from `FormEntity extends CommonEntity`, giving consistent `isPublished`, `dateAdded`, `dateModified`, `createdBy` fields across the entire system

---

## Tech Stack & Dependencies

| Layer | Technology |
|---|---|
| Language | PHP 8.2+ |
| Framework | Symfony 7.4 |
| ORM | Doctrine ORM + DBAL |
| Migrations | Doctrine Migrations Bundle |
| REST API | API Platform (OpenAPI/Swagger auto-generated) |
| Auth / OAuth | FOSOAuthServerBundle (fork: klapaudius/oauth-server-bundle) |
| Email Send | Symfony Mailer (replaced SwiftMailer in v5) |
| Async Queue | Symfony Messenger (AMQP / Doctrine transport) |
| SAML SSO | LightSaml SpBundle |
| Serializer | JMS Serializer + Symfony Serializer Groups |
| Frontend | Twig + GrapesJS Builder (email/page drag-and-drop) |
| Asset Build | Webpack + Grunt + npm |
| Caching | Symfony Cache (configurable backend) |
| Testing | PHPUnit 10 + Codeception (acceptance/E2E) |
| Static Analysis | PHPStan 2.x + Rector |
| Search | Doctrine DBAL raw queries (no Elasticsearch) |

**composer.json key insight**: The `app/` directory is itself a Composer package (`mautic/core-lib`). Top-level `composer.json` points to it as a path repository. Plugins (`type: mautic-plugin`) install to `plugins/{name}/`, themes to `themes/{name}/`.

---

## Project Structure

```
mautic/
├── app/                        # Core library (mautic/core-lib package)
│   ├── AppKernel.php           # Symfony Kernel - registers all bundles
│   ├── bundles/                # 29 core Mautic bundles
│   │   ├── ApiBundle/
│   │   ├── CampaignBundle/
│   │   ├── ChannelBundle/
│   │   ├── CoreBundle/
│   │   ├── DynamicContentBundle/
│   │   ├── EmailBundle/
│   │   ├── FormBundle/
│   │   ├── IntegrationsBundle/
│   │   ├── LeadBundle/         # Contacts + Segments (LeadBundle = Contact domain)
│   │   ├── MessengerBundle/
│   │   ├── NotificationBundle/
│   │   ├── PageBundle/
│   │   ├── PluginBundle/
│   │   ├── PointBundle/        # Lead scoring
│   │   ├── ReportBundle/
│   │   ├── SmsBundle/
│   │   ├── StageBundle/
│   │   ├── UserBundle/
│   │   ├── WebhookBundle/
│   │   └── ...
│   ├── config/                 # config.php, security.php, routing.php, services.php
│   └── migrations/             # Doctrine schema migrations
├── plugins/                    # Third-party / community plugins (MauticPlugin namespace)
│   ├── MauticCrmBundle/        # Salesforce, HubSpot, Dynamics CRM integrations
│   ├── MauticSocialBundle/
│   ├── GrapesJsBuilderBundle/
│   ├── MauticZapierBundle/
│   └── ...
├── themes/                     # Email/page Twig themes
├── translations/               # i18n INI files
├── var/                        # Cache, logs
└── config/                     # Local config (config_local.php, parameters.yml)
```

Each Bundle follows a consistent internal layout:
```
BundleName/
├── Config/config.php       # Routes, services, menus, permissions declared here
├── Controller/             # Symfony controllers (web + API)
├── Entity/                 # Doctrine entities + repositories
├── Model/                  # Business logic layer (extends FormModel)
├── EventListener/          # Symfony event subscribers
├── Form/                   # Symfony Form Types
├── Command/                # Symfony Console commands
├── DependencyInjection/    # Compiler passes, extension
└── Tests/
```

---

## Campaign System (How Campaigns Work)

Campaigns are at the core of Mautic's automation. A Campaign contains a graph of Events, and Contacts flow through that graph.

### Core Entities
- **Campaign** (`campaign_campaigns` table): Has `name`, `publishUp/Down`, `isPublished`, linked to Segments (LeadList) and Forms as entry sources
- **Event** (`campaign_events` table): A node in the campaign graph. Three types:
  - `TYPE_DECISION` — waits for a contact to do something (e.g., opens email, visits page)
  - `TYPE_ACTION` — does something to a contact (e.g., send email, add tag, adjust points)
  - `TYPE_CONDITION` — evaluates contact data and routes to yes/no paths
- **Lead (Campaign)** (`campaign_leads`): join table recording which contacts are in which campaigns
- **LeadEventLog** (`campaign_lead_event_log`): records every event execution per contact with timestamps and pass/fail status

### Event Trigger Modes
Events can fire in four modes:
- `TRIGGER_MODE_IMMEDIATE` — fires right away
- `TRIGGER_MODE_INTERVAL` — fires N hours/days after the previous event
- `TRIGGER_MODE_DATE` — fires on a specific date
- `TRIGGER_MODE_OPTIMIZED` — Mautic picks best time (send-time optimization)

### Event Paths
Events link with a `path` property:
- `PATH_ACTION` (yes path) — taken when event passes
- `PATH_INACTION` (no path) — taken when condition fails or action is inaction-based

### Campaign Execution Engine (Executioner pattern)
Located in `CampaignBundle/Executioner/`. Multiple specialized executioners:

| Class | Role |
|---|---|
| `KickoffExecutioner` | Processes new contacts entering campaign (root events) |
| `ScheduledExecutioner` | Processes events whose scheduled time has arrived |
| `RealTimeExecutioner` | Processes events triggered by real-time contact actions |
| `InactiveExecutioner` | Processes inaction paths (contact did NOT do something) |
| `EventExecutioner` | Core engine: routes to Action/Condition/DecisionExecutioner |

The `EventExecutioner` dispatches to three sub-executioners:
- `ActionExecutioner` — runs actions on contacts
- `ConditionExecutioner` — evaluates conditions, routes yes/no
- `DecisionExecutioner` — handles decision nodes (waiting for contact behavior)

### Campaign CLI Commands
```bash
bin/console mautic:campaigns:trigger         # Process scheduled events
bin/console mautic:campaigns:update          # Add/remove contacts from campaigns based on segments
bin/console mautic:campaigns:execute --event-id=X  # Force execute specific event
```

### Campaign Membership
`MembershipBuilder` handles adding/removing contacts from campaigns when segments change.

---

## Contact Management

The "Lead" in code is a "Contact" in the UI. `LeadBundle` owns all contact functionality.

### Contact Entity (Lead.php)
Key fields on every contact:
- Identity: `firstname`, `lastname`, `email`, `company`, `title`, `position`
- Tracking: `lastActive`, `dateAdded`, `dateModified`
- Scoring: `points` (total), linked to `PointBundle`
- Stage: linked to `StageBundle`
- IP: `ipAddresses` collection
- Social: `availableSocialFields` (Twitter, Facebook, LinkedIn, etc.)
- UTM: `UtmTag` entity for campaign attribution
- Device tracking: `LeadDevice` entity

Contact fields are **dynamic** — admins define custom fields via `LeadField` entity. Custom values are stored as columns directly on the `leads` table (no EAV pattern — actual DB columns per field).

### Contact Deduplication
`Deduplicate/` folder contains:
- `ContactDeduper` — finds duplicate contacts by unique identifier fields
- `ContactMerger` — merges duplicate contacts, preserving history

### Contact Tracking
`Tracker/ContactTracker.php` — tracks the currently identified contact across requests. Uses cookies + IP matching.
`Tracker/DeviceTracker.php` — tracks devices (browser fingerprinting + cookies).

### Do Not Contact (DNC)
`DoNotContact` entity with reason codes: `unsubscribed`, `bounced`, `manual`. Stored per channel (email, sms, etc.).

### Companies
`Company` entity is separate from contacts. `CompanyLead` is the M:N join. `IdentifyCompanyHelper` auto-associates contacts to companies based on email domain.

### Contact Timeline
`LeadEventLog` entities provide a full activity timeline per contact — every event is recorded.

---

## Email System

### Email Entity
`EmailBundle/Entity/Email.php` — key fields:
- `emailType`: `template` (1:1 transactional) or `list` (broadcast to segments)
- `subject`, `customHtml`, `plainText`, `content` (slot-based content map)
- `fromAddress`, `fromName`, `replyToAddress`, `bccAddress`
- `preheaderText` — preview text for inbox
- `utmTags` — UTM attribution array
- Supports: `TranslationEntityTrait` (A/B language variants), `VariantEntityTrait` (A/B content variants), `DynamicContentEntityTrait`

### Email Types
- **Template emails**: triggered per-contact (campaign actions, API calls)
- **List/broadcast emails**: sent to an entire segment on demand

### Sending Architecture (v5+ — Symfony Mailer)
- `MauticMessage extends Symfony\Component\Mime\Email` — Mautic's custom email message object
- `MailHelper` — the core service for building and sending emails, handles token replacement
- Transport via DSN: SMTP, Amazon SES, Mailgun, Postmark, SendGrid (any Symfony Mailer transport)
- `TransportFactory` — resolves DSN to transport
- `TokenTransportInterface` — for transports that support token-based personalization (batch sending)
- `BounceProcessorInterface` / `UnsubscriptionProcessorInterface` — transport-specific webhook handling

### Async Email Queue (Symfony Messenger)
```bash
bin/console messenger:consume email   # Start email consumer
```
Routes: `EMAIL`, `FAILED`, `SYNC`, `HIT` transports. Default is synchronous unless configured with AMQP/Doctrine.

Supported DSN in `MAUTIC_MESSENGER_TRANSPORT_DSN` env var for external queue (RabbitMQ, etc.).

### Email Stats
- `Stat` entity: records each send (contact, email, date, open/read tracking)
- `StatDevice` entity: device-level stat tracking
- Open tracking: pixel embed → `PageBundle` hit tracking
- Click tracking: all links are replaced with `Trackable`/`Redirect` entities in `PageBundle`

### Email CLI
```bash
bin/console mautic:emails:fetch      # Fetch monitored mailbox replies/bounces
```

### Key Email Model Methods (EmailModel)
- `sendEmail()` — send to a list/segment
- `sendEmailToContact()` — send transactional to one contact
- Extends `FormModel` + implements `VariantModelTrait`, `TranslationModelTrait`, `BuilderModelTrait`

---

## Segments & Lists

Segments (called LeadList in code) are dynamic or static contact groups used as campaign entry sources and email recipient lists.

### Segment Entity (LeadList.php)
- `name`, `publicName`, `alias`
- `filters` — JSON array of filter criteria (the segment definition)
- `isGlobal` — visible to all users vs. private

### Segment Query Builder
`LeadBundle/Segment/Query/ContactSegmentQueryBuilder.php`:
- Builds Doctrine DBAL `QueryBuilder` queries from filter definitions
- Supports: contact fields, custom fields, tags, points, stage, campaign membership, email stats, form submissions, page visits, company fields
- Uses read replica connection when available for performance
- Dispatches `LeadListFilteringEvent` so plugins can add custom filter types

### Segment Filters Architecture
```
ContactSegmentFilter          # Represents one filter condition
ContactSegmentFilterCrate     # DTO holding raw filter data
ContactSegmentFilterFactory   # Creates ContactSegmentFilter from raw data
ContactSegmentFilterOperator  # Operators: equals, contains, gt, lt, between, etc.
FilterDecoratorInterface      # Decorators: applies table/column logic per field type
```

Filter decorators translate abstract filter definitions to concrete SQL fragments. Different decorators handle: contact fields, company fields, campaign membership, email engagement, tags, custom fields.

### Segment Update CLI
```bash
bin/console mautic:segments:update      # Rebuilds segment membership (contact <-> list_lead join)
bin/console mautic:campaigns:update     # Syncs campaign membership from segment changes
```

### Segment Service
`ContactSegmentService` — orchestrates the full segment rebuild: queries contacts matching filters, adds new members, removes contacts who no longer match.

---

## API & Integration Patterns

### REST API (API Platform)
Mautic 6/7 migrated to API Platform. Every major entity is decorated with `#[ApiResource]` attributes:
- Campaigns: `/api/campaigns`
- Contacts: `/api/contacts`
- Segments: `/api/segments`
- Emails: `/api/emails`
- Webhooks: `/api/webhooks`
- And more...

Security is enforced via `security` attribute on each operation using Symfony's `is_granted()` with Mautic's permission system.

Serialization uses Symfony Serializer `#[Groups]` attributes for fine-grained field control per operation.

### OAuth 2.0
`FOSOAuthServerBundle` (klapaudius fork) — provides OAuth2 client credential and authorization code flows. API clients register in the UI.

### Webhook System
`WebhookBundle` — outbound webhooks:
- Webhook entity: `webhookUrl`, `secret`, subscribed to event types
- When Mautic events fire, `WebhookQueue` entries are created
- Background process sends queued payloads to external URLs
- Supports HMAC signature verification via `secret`

Common webhook events: contact create/update/delete, campaign events, form submission, page hit, email open, email bounce, email unsubscribe.

### IntegrationsBundle (CRM Sync)
`IntegrationsBundle/` — a sophisticated 2-way sync framework:
- `SyncServiceInterface` — main entry point
- `SyncProcess` — orchestrates pull/push cycles
- `SyncJudge` — resolves conflicts (which side wins when both changed)
- `SyncDataExchange` — abstracts Mautic's data model for sync
- `DAO/` — Data Access Objects for sync state tracking

Usage:
```bash
bin/console mautic:integrations:sync Salesforce --first-time-sync --start-datetime="2024-01-01T00:00:00"
bin/console mautic:integrations:sync Salesforce   # incremental
```

### Plugin CRM Integrations (MauticCrmBundle)
`plugins/MauticCrmBundle/Integration/` — contains:
- Salesforce
- HubSpot
- Dynamics CRM / MS Dynamics 365
- Pipedrive (now external)
- SugarCRM, Vtiger, Zoho

Each integration extends `AbstractIntegration` from `PluginBundle`.

### Zapier Integration
`plugins/MauticZapierBundle/` — webhook triggers and actions for Zapier automation.

---

## Database & Data Patterns

### Schema
All tables have a configurable prefix via `MAUTIC_TABLE_PREFIX` env var or `db_table_prefix` config. Defined at boot time as a PHP constant.

Key tables:
| Table | Purpose |
|---|---|
| `leads` | Contacts (with dynamic custom field columns) |
| `lead_lists` | Segments |
| `list_leads` | Contact-Segment membership |
| `campaigns` | Campaign definitions |
| `campaign_events` | Campaign event graph nodes |
| `campaign_leads` | Contact-Campaign membership |
| `campaign_lead_event_log` | Per-contact event execution history |
| `emails` | Email entity |
| `email_stats` | Per-send tracking record |
| `pages` | Landing pages |
| `page_hits` | Page visit tracking |
| `forms` | Form definitions |
| `form_submissions` | Form submission data |
| `lead_fields` | Custom field definitions |
| `points` | Point action definitions |
| `lead_points_change_log` | Points history per contact |
| `stages` | Stage definitions |
| `webhooks` | Webhook definitions |
| `webhook_queue` | Pending outbound webhook payloads |

### Entity Patterns
- All entities extend `FormEntity extends CommonEntity`
- `FormEntity` provides: `isPublished`, `dateAdded`, `dateModified`, `createdBy`, `modifiedBy`, `checkedOut` (edit locking)
- `UuidTrait` — adds UUID field for external references
- `OptimisticLockTrait` — Doctrine optimistic locking (version column) to prevent concurrent edit conflicts
- `VariantEntityTrait` — A/B test variant parent/child relationships
- `TranslationEntityTrait` — Multi-language parent/child relationships

### Read Replica Support
Segment query builder uses `PrimaryReadReplicaConnection::ensureConnectedToReplica()` for heavy read queries — clean separation built in.

### Migrations
Located in `app/migrations/`. Standard Doctrine Migrations. Run via:
```bash
bin/console doctrine:migrations:migrate
```

---

## Plugin/Extension System

### Creating a Plugin
1. Create directory: `plugins/MauticMyPlugin/`
2. Create Bundle class: `MauticMyPlugin.php` extending `Symfony\Component\HttpKernel\Bundle\Bundle`
3. Optional: define `MINIMUM_MAUTIC_VERSION` constant to control compatibility
4. `AppKernel` auto-discovers all bundles matching `plugins/**/*Bundle.php`

### Plugin Registration
Plugins declare everything in `Config/config.php` (same as core bundles):
- Routes (web + API)
- Services (DI container)
- Menu items
- Form extensions
- Permissions

### Integration Plugin Pattern
For CRM/third-party integrations, extend `AbstractIntegration` from `PluginBundle/Integration/`:
- `getAuthenticationType()` — OAuth1, OAuth2, key-based, etc.
- `getRequiredKeyFields()` — fields for credential storage
- `pushContact()` / `pullContact()` — sync methods

For the full 2-way sync framework, implement `IntegrationsBundle` interfaces:
- `BasicInterface` — basic integration
- `ConfigFormSyncInterface` — sync configuration
- `SyncInterface` — bidirectional sync

### Plugin Events (lifecycle)
Listen to `PluginEvents::ON_PLUGIN_INSTALL` and `PluginEvents::ON_PLUGIN_UPDATE` for install/update hooks.

---

## Lead Scoring & Stages

### Points System
`PointBundle` — defines rules that add/subtract/multiply/divide/set points when contacts take actions.
- `Point` entity: `type` (action type like `page.hit`, `email.open`), `delta` (amount), `repeatable` (fire once or every time)
- `Trigger` entity: fire an action when contact reaches N points
- `TriggerEvent` entity: the action to fire (change stage, send email, add to campaign, etc.)
- Point arithmetic: ADD, SUBTRACT, MULTIPLY, DIVIDE, SET

### Stage System
`StageBundle` — contacts move through sales stages.
- `Stage` entity: `name`, `weight` (used for scoring/reporting)
- Stage changes are logged in `StagesChangeLog` for history

### Point Groups
`PointBundle/Entity/Group.php` — allows grouping points by category (e.g., "Email Engagement", "Web Activity") with `GroupContactScore` tracking per-group totals.

---

## Configuration & Setup

### Environment Variables (v5+ convention)
```bash
APP_ENV=prod
APP_DEBUG=0
MAUTIC_TABLE_PREFIX=         # optional table prefix
MAUTIC_MESSENGER_TRANSPORT_DSN=amqp://...   # async queue DSN
```

### Local Config (`config/config_local.php`)
Auto-generated on install. Key parameters:
```php
$parameters = [
    'db_driver'       => 'pdo_mysql',
    'db_host'         => 'localhost',
    'db_port'         => 3306,
    'db_name'         => 'mautic',
    'db_user'         => 'mautic',
    'db_password'     => '...',
    'db_table_prefix' => '',
    'site_url'        => 'https://mautic.example.com',
    'mailer_dsn'      => 'smtp://user:pass@smtp.host:587',
    'cache_path'      => '%kernel.project_dir%/var/cache',
    'log_path'        => '%kernel.project_dir%/var/logs',
];
```

### DDEV Development
`.ddev/` config included — `ddev start` auto-installs dependencies and configures for local dev.

### Asset Generation
```bash
bin/console mautic:assets:generate   # Combine/minify JS/CSS
bin/console assets:install --symlink --relative ./
```

### Cron Jobs Required
```bash
# Every 5 minutes
*/5 * * * * php /path/to/bin/console mautic:segments:update
*/5 * * * * php /path/to/bin/console mautic:campaigns:trigger
*/5 * * * * php /path/to/bin/console mautic:campaigns:update
# Or use Symfony Messenger consumer instead of cron for email
sudo -u www-data bin/console messenger:consume email --time-limit=3600
```

---

## What We Can Reuse

### Architectural Patterns Worth Adopting

1. **Bundle-based feature isolation**: Each domain (Email, Campaign, Lead, etc.) is a self-contained bundle with its own routes, services, entities. Clean separation. We can apply this to our AI agency system.

2. **Executioner pattern for automation**: The `KickoffExecutioner` → `EventExecutioner` → `ActionExecutioner/ConditionExecutioner/DecisionExecutioner` hierarchy is clean for any workflow automation engine. Separate the concerns: finding contacts, scheduling, executing, logging.

3. **Event-driven architecture within monolith**: Symfony EventDispatcher is used heavily. When a contact is identified, `LeadEvents::NEW_LEAD` fires. Email opens fire `EmailEvents::EMAIL_ON_OPEN`. This lets bundles extend each other without tight coupling — perfect for plugin extensibility.

4. **Segment Query Builder**: The decorator pattern for translating abstract filter definitions to SQL is elegant. For building "audience segments" in our system, this approach (filter crates → decorators → query builder) is reusable.

5. **FormEntity base class**: Having `isPublished`, `dateAdded`, `dateModified`, `createdBy` on every entity via inheritance is a best practice to adopt from day one.

6. **Contact Timeline via EventLog**: Every action is logged as a timeline entry. For our AI system, logging every AI action per contact (email sent, lead score changed, campaign triggered) in a timeline table is essential for debugging and reporting.

7. **DoNotContact per channel**: Tracking unsubscribes/bounces per channel (email, sms, push) separately is the right approach. Do not contact list as a first-class entity.

8. **Read Replica usage in heavy queries**: Segment builder explicitly uses replica for large queries. Smart pattern for reporting/analytics vs. write operations.

9. **Symfony Messenger for async**: Moving email sending, hit processing, and segment updates to async queue (AMQP/Doctrine) improves scalability dramatically. Use `messenger:consume` workers instead of cron-based batch jobs.

### Direct Code We Can Use
- Segment filter logic as inspiration for "audience builder" UI
- Campaign event graph model (nodes with yes/no paths) for our workflow builder
- Integration sync framework from `IntegrationsBundle` for CRM connectors
- Webhook system for outbound event notifications
- Point scoring system for lead scoring in our AI agency platform

---

## Lessons & Best Practices

### What Mautic Does Well
- **Clean domain separation**: 29 bundles, each ownable by a different team
- **Backward-compatible upgrades**: `UPGRADE-X.md` files document every BC break — excellent practice
- **Optimistic locking**: Prevents concurrent edits corrupting data (`OptimisticLockTrait`)
- **UUID on entities**: External integrations never depend on auto-increment IDs
- **Permission system**: Granular `viewown/viewother/editown/editother/create/delete` per entity per bundle

### What to Watch Out For
- **"Lead" vs "Contact" naming confusion**: Internally `Lead` = Contact. `LeadBundle` = Contact domain. Confusing for new developers — plan better naming from the start
- **Custom field columns on leads table**: Mautic adds actual DB columns for each custom contact field — flexible but creates wide tables and migration complexity. Alternative: JSONB in PostgreSQL
- **Cron dependency**: Heavy reliance on cron for segment updates and campaign processing. Symfony Messenger is the modern solution but requires infrastructure (RabbitMQ or Doctrine queue)
- **Legacy SwiftMailer → Symfony Mailer migration**: Major breaking change in v5. Any fork/plugin needs to handle this fully
- **Database prefix**: `MAUTIC_TABLE_PREFIX` constant is set at PHP boot time — must be defined before any Doctrine usage. Design decision that complicates multi-tenant hosting

### PHP/Symfony Best Practices Observed
- Constructor injection (no setter injection in modern code)
- Interface-driven services (`ExecutionerInterface`, `TokenTransportInterface`, etc.)
- Generic typed models: `FormModel<T>`, `CampaignModel extends CommonFormModel<Campaign>`
- Event Subscriber pattern (not the old Listener pattern) throughout
- Attributes-based config (PHP 8 attributes for ORM, API Platform, Serializer Groups) replacing YAML/XML
- PHPStan level 2+ enforcement + Rector for automated modernization

### Scaling Considerations
- Segment rebuilds are the biggest bottleneck at scale (millions of contacts)
- Read replica for all segment/report queries
- Campaign event execution parallelization via CLI `--batch-limit` flags
- MessageQueue model in ChannelBundle for controlled send-rate limiting
- `FrequencyRule` entity limits how often contacts receive messages per channel

### Database Indexing Patterns
All repositories use Doctrine's `ClassMetadataBuilder` with explicit index definitions. Key indexes:
- `leads` table: `email`, `last_active`, `date_added`, compound indexes on key fields
- `campaign_lead_event_log`: indexes on `lead_id`, `event_id`, `is_scheduled`, `trigger_date`
- `email_stats`: indexes on `email_id`, `lead_id`, `date_sent`
