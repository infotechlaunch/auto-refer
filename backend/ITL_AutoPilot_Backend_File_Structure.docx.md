**ITL AutoPilot™**

**Backend File Structure — Master Reference**

v2.0 · Node · Microservices · Production Grade

QR Review Engine \+ AutoRefer \+ AI Voice \+ Identity Vault

**1\. Monorepo Root Overview**

The project uses a monorepo with independent deployable services, shared libraries, and infrastructure-as-code. Each service is a standalone Node/TypeScript Express app with its own package.json, Dockerfile, and database migrations.

**📁 itl-autopilot/ \[MONOREPO ROOT\]**

| 📁  | services/          | All microservices (each independently deployable)          |
| :-: | :----------------- | :--------------------------------------------------------- |
| 📁  | **shared/**        | Shared types, events, utilities across all services        |
| 📁  | **infra/**         | , Postgres /Compose configs                                |
| 📁  | **scripts/**       | Dev tooling, seed scripts, test helpers                    |
| 📄  | .env.example       | Environment variable template for local dev                |
| 📄  | docker-compose.yml | Full local stack: Postgres \+ all services \+ Adminer      |
| 📄  | package.json       | Monorepo workspace config (npm workspaces or turbo)        |
| 📄  | turbo.json         | Turborepo build pipeline config (optional but recommended) |
| 📄  | tsconfig.base.json | Shared TypeScript config (all services extend this)        |
| 📄  | README.md          | Developer onboarding \+ architecture overview              |

**2\. Service A — Portal & Campaign Service**

Owns: Campaign creation, QR code generation, QR landing page, Review Intent lifecycle, incentives/referrals toggle, expiry job. Port: 3001

**📁 services/portal-campaign/**

| 📄  | package.json  | Dependencies: express, pg-promise, axios, zod, cors, dotenv |
| :-: | :------------ | :---------------------------------------------------------- |
| 📄  | tsconfig.json | Extends ../../tsconfig.base.json                            |
| 📄  | Dockerfile    | Node 20 Alpine, multi-stage build                           |
| 📄  | .env.example  | DATABASE_URL, IDENTITY_URL, REDIS_URL, SERVICE_KEY, PORT    |
| 📁  | **src/**      | All TypeScript source code                                  |

**📁 services/portal-campaign/src/**

| 📄  | app.js          | Express app factory — registers middleware, routes, error handler |
| :-: | :-------------- | :---------------------------------------------------------------- |
| 📄  | server.js       | Entry point — binds port, starts cron jobs                        |
| 📄  | db.js           | pg-promise singleton connection pool                              |
| 📄  | routes.js       | Route registration — mounts all handler routers                   |
| 📁  | **handlers/**   | Request handlers (controllers) — one file per domain              |
| 📁  | **jobs/**       | Cron/background jobs                                              |
| 📁  | **util/**       | Shared utilities within this service                              |
| 📁  | **middleware/** | Auth, rate-limit, validation middleware                           |
| 📁  | **types/**      | TypeScript interfaces and Zod schemas                             |

**📁 services/portal-campaign/src/handlers/**

| 📄  | campaigns.js       | POST /v1/campaigns, GET /v1/campaigns — CRUD for campaigns                        |
| :-: | :----------------- | :-------------------------------------------------------------------------------- |
| 📄  | qr.js              | POST /v1/campaigns/:id/qr — generate short code \+ QR URL                         |
| 📄  | landing.js         | GET /r/:shortCode — serve QR landing HTML page                                    |
| 📄  | intents.js         | POST /v1/r/:shortCode/intent — create ReviewIntent \+ identity upsert \+ redirect |
| 📄  | intentsInternal.js | GET /internal/v1/intents/eligible — service-to-service lookup                     |
| 📄  | intentsComplete.js | POST /internal/v1/intents/:id/complete — atomic one-time thank-you lock           |
| 📄  | socialProfiles.js  | PUT /v1/campaigns/:id/social-profiles — upsert business social handles            |

**📁 services/portal-campaign/src/jobs/**

| 📄  | expireIntents.js | Hourly cron — sets thank_status=expired where expires_at \< now() |
| :-: | :--------------- | :---------------------------------------------------------------- |
| 📄  | scheduler.js     | node-cron setup — registers all jobs with schedules               |

**📁 services/portal-campaign/src/util/**

| 📄  | shortCode.js      | nanoid-based 8-char short code generator               |
| :-: | :---------------- | :----------------------------------------------------- | ------- |
| 📄  | hash.js           | SHA-256 hash helper for ip/ua/device fingerprints      |
| 📄  | rushHours.js      | Rush-hour timezone calculation — returns rush          | nonrush |
| 📄  | qrImage.js        | qrcode library wrapper — returns PNG buffer or SVG     |
| 📄  | identityClient.js | HTTP client to Identity Vault service (upsert/resolve) |
| 📄  | eventEmitter.js   | Re-exports shared emitEvent() bound to this service    |

**📁 services/portal-campaign/src/middleware/**

| 📄  | auth.js      | Bearer JWT validation (business users) \+ SERVICE_KEY for internal routes |
| :-: | :----------- | :------------------------------------------------------------------------ |
| 📄  | rateLimit.js | express-rate-limit — per-IP limits for landing \+ intent endpoints        |
| 📄  | validate.js  | Zod request body/query validator factory                                  |
| 📄  | tenant.js    | Extracts \+ attaches tenantId to req context                              |

**📁 services/portal-campaign/src/types/**

| 📄  | campaign.types.js | Campaign, QrCode, BusinessSocialProfile interfaces \+ Zod schemas |
| :-: | :---------------- | :---------------------------------------------------------------- |
| 📄  | intent.types.js   | ReviewIntent, IntentCreateRequest, IntentCompleteResponse         |
| 📄  | enums.js          | ThankStatus, ThankChannel, ConfidenceLevel, SocialPlatform enums  |

**3\. Service B — Identity & Consent Vault (PII)**

Owns: Encrypted storage of phone/email/name, consent flags, token issuance. Other services NEVER store raw PII — only the customer_identity_ref token. Port: 3002

**📁 services/identity-vault/**

| 📄  | package.json | Extra deps: node-forge or AWS KMS SDK for encryption |
| :-: | :----------- | :--------------------------------------------------- |
| 📄  | Dockerfile   | Node 20 Alpine                                       |
| 📄  | .env.example | DATABASE_URL, VAULT_KMS_KEY, PORT, SERVICE_KEY       |
| 📁  | **src/**     | All source code                                      |

**📁 services/identity-vault/src/**

| 📄  | app.js        | Express app — internal-only routes (no public exposure recommended) |
| :-: | :------------ | :------------------------------------------------------------------ |
| 📄  | server.js     | Entry point                                                         |
| 📄  | db.js         | pg-promise pool                                                     |
| 📄  | routes.js     | Mounts identity handlers                                            |
| 📁  | **handlers/** | Identity handlers                                                   |
| 📁  | **crypto/**   | Encryption / decryption utilities                                   |
| 📁  | **jobs/**     | PII retention cleanup job                                           |
| 📁  | **types/**    | IdentityUpsertRequest, IdentityResolveResponse                      |

**📁 services/identity-vault/src/handlers/**

| 📄  | upsert.js  | POST /v1/identities/upsert — create or update identity \+ issue token |
| :-: | :--------- | :-------------------------------------------------------------------- |
| 📄  | resolve.js | POST /v1/identities/resolve — lookup phone/email → token              |

**📁 services/identity-vault/src/crypto/**

| 📄  | encrypt.js | AES-256-GCM encrypt/decrypt using VAULT_KMS_KEY  |
| :-: | :--------- | :----------------------------------------------- |
| 📄  | token.js   | nanoid token generator for customer_identity_ref |
| 📄  | hash.js    | HMAC-SHA256 deterministic hash for lookup index  |

**📁 services/identity-vault/src/jobs/**

| 📄  | retentionCleanup.js | Daily cron — deletes identities where expires_at \< now() |
| :-: | :------------------ | :-------------------------------------------------------- |

**4\. Service C — Voice Context Service**

Owns: Called by AI voice platform at call start. Resolves caller phone → identity → eligible ReviewIntent. Returns rush/nonrush variant \+ message. Marks completion atomically. Port: 3003

**📁 services/voice-context/**

| 📄  | package.json | deps: express, axios, pg-promise, date-fns-tz, zod        |
| :-: | :----------- | :-------------------------------------------------------- |
| 📄  | Dockerfile   | Node 20 Alpine                                            |
| 📄  | .env.example | DATABASE_URL, IDENTITY_URL, PORTAL_URL, SERVICE_KEY, PORT |
| 📁  | **src/**     | Source                                                    |

**📁 services/voice-context/src/**

| 📄  | app.js        | Express app                                            |
| :-: | :------------ | :----------------------------------------------------- |
| 📄  | server.js     | Entry point                                            |
| 📄  | db.js         | pg-promise (read-only queries against campaign config) |
| 📄  | routes.js     | Registers /v1/voice/\* routes                          |
| 📁  | **handlers/** | Voice handlers                                         |
| 📁  | **util/**     | Rush hours, message templates                          |
| 📁  | **clients/**  | HTTP clients to other services                         |
| 📁  | **types/**    | VoiceContextResponse, VoiceCompleteRequest             |

**📁 services/voice-context/src/handlers/**

| 📄  | context.js  | GET /v1/voice/context — full resolution pipeline: phone→identity→intent→variant |
| :-: | :---------- | :------------------------------------------------------------------------------ |
| 📄  | complete.js | POST /v1/voice/complete — delegates atomic lock to Portal internal endpoint     |

**📁 services/voice-context/src/util/**

| 📄  | rushHours.js | Determines rush                                             | nonrush given campaign timezone \+ rush_hours config |
| :-: | :----------- | :---------------------------------------------------------- | ---------------------------------------------------- |
| 📄  | messages.js  | Message template generator (rush vs non-rush text variants) |

**📁 services/voice-context/src/clients/**

| 📄  | identityClient.js | POST /v1/identities/resolve → returns customer_identity_ref |
| :-: | :---------------- | :---------------------------------------------------------- |
| 📄  | portalClient.js   | GET /internal/v1/intents/eligible \+ POST .../complete      |

**5\. Service D — AutoRefer Service**

Owns: Referral programs, referral links, click tracking, attribution, Stripe webhook processing, fraud scoring, hold jobs, wallet management, payout requests. Port: 3004

**📁 services/autorefer/**

| 📄  | package.json | deps: express, stripe, pg-promise, redis, zod, node-cron                                                     |
| :-: | :----------- | :----------------------------------------------------------------------------------------------------------- |
| 📄  | Dockerfile   | Node 20 Alpine                                                                                               |
| 📄  | .env.example | DATABASE_URL, REDIS_URL, STRIPE_SECRET, STRIPE_WEBHOOK_SECRET, ATTRIBUTION_TTL_DAYS, HOLD_DAYS_DEFAULT, PORT |
| 📁  | **src/**     | Source                                                                                                       |

**📁 services/autorefer/src/**

| 📄  | app.js        | Express app — note: Stripe webhook route needs raw body |
| :-: | :------------ | :------------------------------------------------------ |
| 📄  | server.js     | Entry point                                             |
| 📄  | db.js         | pg-promise pool                                         |
| 📄  | redis.js      | ioredis client for idempotency keys \+ click dedup      |
| 📄  | routes.js     | Registers all autorefer routes                          |
| 📁  | **handlers/** | All API handlers                                        |
| 📁  | **fraud/**    | Fraud scoring \+ persistence                            |
| 📁  | **jobs/**     | Background jobs                                         |
| 📁  | **util/**     | Utilities                                               |
| 📁  | **types/**    | Referral types \+ Zod schemas                           |

**📁 services/autorefer/src/handlers/**

| 📄  | programs.js      | POST/GET /v1/referral/programs — Super Admin program CRUD                              |
| :-: | :--------------- | :------------------------------------------------------------------------------------- |
| 📄  | links.js         | POST /v1/referral/links — create referral link with code \+ share_url                  |
| 📄  | refClick.js      | GET /ref/:code — click track → attribution cookie → redirect to signup                 |
| 📄  | bindSignup.js    | POST /v1/referral/bind-signup — map attribution → referred business \+ fraud score     |
| 📄  | wallet.js        | GET /v1/referral/wallet — return pending/available/paid balances                       |
| 📄  | payout.js        | POST /v1/referral/payout/request — request payout (moves available → payout_requested) |
| 📄  | stripeWebhook.js | POST /v1/webhooks/stripe — Stripe event handler (invoice.paid, refunds, disputes)      |
| 📄  | adminFraud.js    | GET /v1/admin/fraud/queue — Super Admin fraud dashboard                                |
| 📄  | adminWallet.js   | POST /v1/admin/wallet/freeze — Super Admin wallet controls                             |

**📁 services/autorefer/src/fraud/**

| 📄  | score.js   | scoreReferralFraud() — deterministic rules engine, returns score \+ flags \+ decision |
| :-: | :--------- | :------------------------------------------------------------------------------------ | ----------- | ---------------------------- |
| 📄  | persist.js | persistFraudSignals() — writes risk signals to referral_risk_signals table            |
| 📄  | rules.js   | Rule definitions \+ weight constants (self_referral=80, device_match=50, etc.)        |
| 📄  | gate.js    | fraudGate() — allow                                                                   | hold_review | block_freeze decision helper |

**📁 services/autorefer/src/jobs/**

| 📄  | evaluateHolds.js  | Daily — paid events past hold_days \+ no fraud → mark cleared → release reward |
| :-: | :---------------- | :----------------------------------------------------------------------------- |
| 📄  | reverseRefunds.js | Event-driven \+ daily reconcile — refund/chargeback → claw back wallet         |
| 📄  | fraudSweeper.js   | Daily — re-score flagged events, escalate or clear                             |
| 📄  | scheduler.js      | node-cron setup for all jobs                                                   |

**📁 services/autorefer/src/util/**

| 📄  | hash.js        | SHA-256 for ip/device/email/phone fingerprinting             |
| :-: | :------------- | :----------------------------------------------------------- |
| 📄  | idempotency.js | Redis-backed idempotency key check for Stripe webhooks       |
| 📄  | attribution.js | 30-day cookie attribution key generation \+ validation       |
| 📄  | shareUrl.js    | Build full share URL from code (WhatsApp/SMS/Email variants) |

**6\. Shared Library**

Shared code used by all services. Published as a local workspace package — no NPM publish needed in monorepo. Strict: no service-specific logic here.

**📁 shared/**

| 📄  | package.json  | name: @itl/shared — referenced by all services as a workspace dep |
| :-: | :------------ | :---------------------------------------------------------------- |
| 📄  | tsconfig.json | Strict TypeScript config                                          |
| 📁  | **events/**   | Event schemas \+ emitter                                          |
| 📁  | **security/** | Fraud module shared across services                               |
| 📁  | **types/**    | Canonical IDs \+ shared interfaces                                |
| 📁  | **util/**     | Date, timezone, validation helpers                                |

**📁 shared/events/**

| 📄  | emitter.js    | emitEvent(name, payload) — HTTP fanout or Kafka/NATS pub                    |
| :-: | :------------ | :-------------------------------------------------------------------------- |
| 📄  | schemas.js    | Typed event payload interfaces for all system events                        |
| 📄  | eventNames.js | Event name constants: review_intent.created, referral.reward_released, etc. |

**📁 shared/security/**

| 📄  | fraud.js       | scoreReferralFraud() type \+ logic (imported by autorefer)               |
| :-: | :------------- | :----------------------------------------------------------------------- |
| 📄  | rateLimit.js   | Shared rate-limit config presets                                         |
| 📄  | idempotency.js | Redis idempotency interface (service instantiates with own Redis client) |

**📁 shared/types/**

| 📄  | canonical.js | CanonicalIds interface: tenantId, businessId, locationId, campaignId, etc. |
| :-: | :----------- | :------------------------------------------------------------------------- |
| 📄  | events.js    | All event payload types (ReviewIntentCreated, ReferralRewarded, etc.)      |
| 📄  | enums.js     | All system-wide enums (ThankStatus, ReferralEventStatus, etc.)             |

**📁 shared/util/**

| 📄  | timezone.js  | convertToTimezone(ts, tz) — date-fns-tz wrapper                  |
| :-: | :----------- | :--------------------------------------------------------------- |
| 📄  | rushHours.js | Canonical rush-hour check — used by both portal \+ voice context |
| 📄  | validate.js  | Zod schema helpers                                               |

**7\. Infrastructure**

**📁 infra/**

| 📁  | migrations/             | Postgres SQL migration files (run in order)               |
| :-: | :---------------------- | :-------------------------------------------------------- |
| 📁  | **redis/**              | Redis config \+ seed                                      |
| 📁  | **k8s/**                | Kubernetes manifests (production)                         |
| 📄  | docker-compose.yml      | Local dev: postgres \+ redis \+ adminer \+ all 4 services |
| 📄  | docker-compose.prod.yml | Production overrides (env secrets, replicas)              |

**📁 infra/migrations/**

| 📄  | 001_enums.sql             | All ENUM type creation (thank_status, referral_event_status, etc.)                                            |
| :-: | :------------------------ | :------------------------------------------------------------------------------------------------------------ |
| 📄  | 002_campaigns.sql         | campaigns, qr_codes, business_social_profiles tables                                                          |
| 📄  | 003_review_intents.sql    | review_intents table \+ all indexes                                                                           |
| 📄  | 004_identity.sql          | customer_identities \+ identity_tokens tables                                                                 |
| 📄  | 005_autorefer_core.sql    | referral_programs, referral_links, referral_events, referral_wallets, payout_requests                         |
| 📄  | 006_autorefer_mapping.sql | referral_clicks, referral_attributions, referred_business_map, stripe_subscription_map, referral_risk_signals |

**8\. Scripts & Dev Tooling**

**📁 scripts/**

| 📄  | seed.js         | Seed local DB with sample tenant, campaign, QR code for dev     |
| :-: | :-------------- | :-------------------------------------------------------------- |
| 📄  | migrate.js      | Run migrations in order against DATABASE_URL                    |
| 📄  | testQrFlow.js   | E2E test: simulate QR scan → intent → voice context → complete  |
| 📄  | testReferral.js | E2E test: click → signup → invoice.paid → hold → reward release |
| 📄  | testFraud.js    | Fraud test: self-referral \+ device match → block_freeze        |

**9\. Complete File Tree (Quick Reference)**

itl-autopilot/

├── services/

│ ├── portal-campaign/

│ │ ├── src/

│ │ │ ├── app.js

│ │ │ ├── server.js

│ │ │ ├── db.js

│ │ │ ├── routes.js

│ │ │ ├── handlers/

│ │ │ │ ├── campaigns.js

│ │ │ │ ├── qr.js

│ │ │ │ ├── landing.js

│ │ │ │ ├── intents.js

│ │ │ │ ├── intentsInternal.js

│ │ │ │ ├── intentsComplete.js

│ │ │ │ └── socialProfiles.js

│ │ │ ├── jobs/

│ │ │ │ ├── expireIntents.js

│ │ │ │ └── scheduler.js

│ │ │ ├── util/

│ │ │ │ ├── shortCode.js

│ │ │ │ ├── hash.js

│ │ │ │ ├── rushHours.js

│ │ │ │ ├── qrImage.js

│ │ │ │ ├── identityClient.js

│ │ │ │ └── eventEmitter.js

│ │ │ ├── middleware/

│ │ │ │ ├── auth.js

│ │ │ │ ├── rateLimit.js

│ │ │ │ ├── validate.js

│ │ │ │ └── tenant.js

│ │ │ └── types/

│ │ │ ├── campaign.types.js

│ │ │ ├── intent.types.js

│ │ │ └── enums.js

│ │ ├── package.json

│ │ ├── tsconfig.json

│ │ └── Dockerfile

│ │

│ ├── identity-vault/

│ │ └── src/

│ │ ├── app.js server.js db.js routes.js

│ │ ├── handlers/ upsert.js resolve.js

│ │ ├── crypto/ encrypt.js token.js hash.js

│ │ ├── jobs/ retentionCleanup.js

│ │ └── types/ identity.types.js

│ │

│ ├── voice-context/

│ │ └── src/

│ │ ├── app.js server.js db.js routes.js

│ │ ├── handlers/ context.js complete.js

│ │ ├── clients/ identityClient.js portalClient.js

│ │ └── util/ rushHours.js messages.js

│ │

│ └── autorefer/

│ └── src/

│ ├── app.js server.js db.js redis.js routes.js

│ ├── handlers/

│ │ ├── programs.js links.js refClick.js

│ │ ├── bindSignup.js wallet.js payout.js

│ │ ├── stripeWebhook.js

│ │ ├── adminFraud.js adminWallet.js

│ ├── fraud/

│ │ ├── score.js persist.js rules.js gate.js

│ ├── jobs/

│ │ ├── evaluateHolds.js reverseRefunds.js

│ │ ├── fraudSweeper.js scheduler.js

│ └── util/

│ ├── hash.js idempotency.js

│ ├── attribution.js shareUrl.js

│

├── shared/ (@itl/shared)

│ ├── events/ emitter.js schemas.js eventNames.js

│ ├── security/ fraud.js rateLimit.js idempotency.js

│ ├── types/ canonical.js events.js enums.js

│ └── util/ timezone.js rushHours.js validate.js

│

├── infra/

│ ├── migrations/ 001_enums.sql → 006_autorefer_mapping.sql

│ ├── docker-compose.yml

│ └── k8s/ (production manifests)

│

├── scripts/

│ ├── seed.js migrate.js

│ ├── testQrFlow.js testReferral.js testFraud.js

│

├── docker-compose.yml

├── package.json (workspaces)

├── tsconfig.base.json

└── README.md

**10\. Service Port Map & Key Environment Variables**

| Service         | Port | Key ENV Vars             | Calls                           |
| :-------------- | :--- | :----------------------- | :------------------------------ |
| portal-campaign | 3001 | IDENTITY_URL, REDIS_URL  | identity-vault, events          |
| identity-vault  | 3002 | VAULT_KMS_KEY            | (none — inbound only)           |
| voice-context   | 3003 | PORTAL_URL, IDENTITY_URL | portal-campaign, identity-vault |
| autorefer       | 3004 | STRIPE_SECRET, REDIS_URL | portal-campaign, events         |

ITL AutoPilot™ — Backend Architecture v2.0 · infotechlaunch.com
