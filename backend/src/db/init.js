const postgres = require('postgres');

let sql;

function getSql() {
  if (sql) return sql;
  sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
  return sql;
}

async function initializeDatabase() {
  const sql = getSql();

  // ═══════════════════════════════════════════════
  // USERS TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin', 'super_admin')),
      tenant_id TEXT DEFAULT 't_itl_001',
      business_id TEXT,
      avatar_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // ═══════════════════════════════════════════════
  // CAMPAIGNS TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
      campaign_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      business_id TEXT NOT NULL,
      location_id TEXT NOT NULL,
      name TEXT NOT NULL,
      place_id TEXT,
      google_review_url TEXT,
      timezone TEXT DEFAULT 'America/New_York',
      rush_hours TEXT DEFAULT '{}',
      thank_window_hours INTEGER DEFAULT 24,
      enable_voice_linkage BOOLEAN DEFAULT false,
      enable_influencer_capture BOOLEAN DEFAULT false,
      enable_incentives BOOLEAN DEFAULT false,
      enable_referrals BOOLEAN DEFAULT false,
      capture_name BOOLEAN DEFAULT true,
      capture_phone BOOLEAN DEFAULT true,
      capture_email BOOLEAN DEFAULT false,
      capture_social BOOLEAN DEFAULT false,
      require_consent BOOLEAN DEFAULT true,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // ═══════════════════════════════════════════════
  // QR CODES TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS qr_codes (
      qr_code_id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
      short_code TEXT NOT NULL UNIQUE,
      short_url TEXT NOT NULL,
      active BOOLEAN DEFAULT true,
      scan_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // ═══════════════════════════════════════════════
  // REVIEW INTENTS TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS review_intents (
      review_intent_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      business_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
      customer_identity_ref TEXT,
      scan_ts TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      thank_status TEXT DEFAULT 'pending' CHECK(thank_status IN ('pending', 'completed', 'expired', 'cancelled')),
      thank_channel TEXT DEFAULT 'none' CHECK(thank_channel IN ('none', 'voice_inbound', 'voice_outbound', 'sms', 'email', 'in_app')),
      confidence TEXT DEFAULT 'none' CHECK(confidence IN ('none', 'implicit', 'explicit')),
      instagram_handle TEXT,
      incentive_type TEXT CHECK(incentive_type IN ('percent', 'fixed', 'freebie')),
      incentive_value TEXT,
      incentive_status TEXT CHECK(incentive_status IN ('pending', 'delivered', 'expired')),
      ip_hash TEXT,
      ua_hash TEXT,
      device_fingerprint TEXT
    );
  `;

  // ═══════════════════════════════════════════════
  // BUSINESS SOCIAL PROFILES TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS business_social_profiles (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      handle TEXT NOT NULL,
      url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // ═══════════════════════════════════════════════
  // REFERRAL PROGRAMS TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS referral_programs (
      referral_program_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      reward_type TEXT NOT NULL CHECK(reward_type IN ('cash', 'percent', 'credit')),
      reward_value REAL NOT NULL DEFAULT 0,
      referred_discount_percent REAL DEFAULT 0,
      min_subscription_months INTEGER DEFAULT 1,
      hold_days INTEGER DEFAULT 14,
      active BOOLEAN DEFAULT true,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // ═══════════════════════════════════════════════
  // REFERRAL LINKS TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS referral_links (
      referral_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      referral_program_id TEXT NOT NULL REFERENCES referral_programs(referral_program_id) ON DELETE CASCADE,
      referrer_type TEXT NOT NULL CHECK(referrer_type IN ('business', 'agency', 'influencer', 'individual')),
      referrer_user_id TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      share_url TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled', 'expired')),
      max_uses INTEGER DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // ═══════════════════════════════════════════════
  // REFERRAL EVENTS TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS referral_events (
      event_id TEXT PRIMARY KEY,
      referral_id TEXT NOT NULL REFERENCES referral_links(referral_id) ON DELETE CASCADE,
      referred_business_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('clicked', 'signed_up', 'paid', 'cleared', 'reward_released', 'fraud_flagged', 'reversed', 'hold')),
      event_ts TIMESTAMPTZ DEFAULT NOW(),
      amount REAL DEFAULT 0,
      fraud_score INTEGER DEFAULT 0,
      hold_until TIMESTAMPTZ,
      stripe_invoice_id TEXT,
      notes TEXT
    );
  `;

  // ═══════════════════════════════════════════════
  // REFERRAL WALLETS TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS referral_wallets (
      wallet_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      balance_pending REAL DEFAULT 0,
      balance_available REAL DEFAULT 0,
      balance_paid REAL DEFAULT 0,
      frozen BOOLEAN DEFAULT false,
      last_adjusted_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // ═══════════════════════════════════════════════
  // PAYOUT REQUESTS TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS payout_requests (
      payout_request_id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('stripe_connect', 'ach', 'manual', 'paypal')),
      status TEXT DEFAULT 'requested' CHECK(status IN ('requested', 'approved', 'paid', 'rejected')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      processed_at TIMESTAMPTZ
    );
  `;

  // ═══════════════════════════════════════════════
  // FRAUD QUEUE / RISK SIGNALS TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS fraud_signals (
      signal_id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      referred_business_id TEXT NOT NULL,
      referral_id TEXT NOT NULL,
      referrer_name TEXT NOT NULL,
      referred_name TEXT NOT NULL,
      total_score INTEGER DEFAULT 0,
      flags TEXT DEFAULT '[]',
      decision TEXT DEFAULT 'allow' CHECK(decision IN ('allow', 'hold_review', 'block_freeze')),
      resolved BOOLEAN DEFAULT false,
      resolved_by TEXT,
      resolved_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // ═══════════════════════════════════════════════
  // AUDIT LOGS TABLE
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      detail TEXT,
      ip_address TEXT,
      ts TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // ═══════════════════════════════════════════════
  // CUSTOMER IDENTITIES TABLE (Identity Vault)
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS customer_identities (
      identity_id TEXT PRIMARY KEY,
      identity_ref TEXT NOT NULL UNIQUE,
      phone_hash TEXT,
      email_hash TEXT,
      phone_encrypted TEXT,
      email_encrypted TEXT,
      name_encrypted TEXT,
      consent_sms BOOLEAN DEFAULT false,
      consent_email BOOLEAN DEFAULT false,
      consent_voice BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ
    );
  `;

  // ═══════════════════════════════════════════════
  // DASHBOARD STATS TABLE (aggregated cache)
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS dashboard_stats (
      id INTEGER PRIMARY KEY DEFAULT 1,
      total_campaigns INTEGER DEFAULT 0,
      active_qr_codes INTEGER DEFAULT 0,
      total_scans INTEGER DEFAULT 0,
      total_review_intents INTEGER DEFAULT 0,
      completed_thank_yous INTEGER DEFAULT 0,
      pending_intents INTEGER DEFAULT 0,
      total_referral_clicks INTEGER DEFAULT 0,
      total_signups INTEGER DEFAULT 0,
      total_paid INTEGER DEFAULT 0,
      total_reward_released INTEGER DEFAULT 0,
      total_fraud_flagged INTEGER DEFAULT 0,
      wallet_total_pending REAL DEFAULT 0,
      wallet_total_available REAL DEFAULT 0,
      wallet_total_paid REAL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // ═══════════════════════════════════════════════
  // CHART DATA TABLES
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS scan_chart_data (
      id SERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 't_itl_001',
      date TEXT NOT NULL,
      scans INTEGER DEFAULT 0,
      intents INTEGER DEFAULT 0,
      thanked INTEGER DEFAULT 0
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS referral_chart_data (
      id SERIAL PRIMARY KEY,
      tenant_id TEXT NOT NULL DEFAULT 't_itl_001',
      date TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      signups INTEGER DEFAULT 0,
      paid INTEGER DEFAULT 0,
      released INTEGER DEFAULT 0
    );
  `;

  // ═══════════════════════════════════════════════
  // VOICE THANK EVENTS TABLE (Step 6)
  // Tracks every incoming call and whether a thank-you was played.
  // Idempotent: played can only be true once per identity+campaign.
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS voice_thank_events (
      event_id        TEXT PRIMARY KEY,
      tenant_id       TEXT NOT NULL,
      campaign_id     TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
      review_intent_id TEXT REFERENCES review_intents(review_intent_id) ON DELETE SET NULL,
      phone_hash      TEXT NOT NULL,
      call_ts         TIMESTAMPTZ DEFAULT NOW(),
      played          BOOLEAN DEFAULT false,
      skip_reason     TEXT CHECK(skip_reason IN ('already_played','no_review','outside_window','no_match','no_consent')),
      script_variant  TEXT CHECK(script_variant IN ('rush_hour','standard')),
      duration_seconds INTEGER DEFAULT 0
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_voice_thank_phone ON voice_thank_events(phone_hash);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_voice_thank_campaign ON voice_thank_events(campaign_id);`;

  // ═══════════════════════════════════════════════
  // INCENTIVES TABLE (Step 7)
  // Client-controlled per-customer incentive assignments.
  // enable_incentives must be true on the campaign.
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS incentives (
      incentive_id      TEXT PRIMARY KEY,
      tenant_id         TEXT NOT NULL,
      campaign_id       TEXT REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
      review_intent_id  TEXT REFERENCES review_intents(review_intent_id) ON DELETE SET NULL,
      customer_name     TEXT,
      customer_phone    TEXT,
      customer_email    TEXT,
      incentive_type    TEXT NOT NULL CHECK(incentive_type IN ('percent','fixed','freebie')),
      incentive_value   TEXT NOT NULL,
      send_method       TEXT DEFAULT 'manual' CHECK(send_method IN ('sms','email','manual','auto')),
      status            TEXT DEFAULT 'pending' CHECK(status IN ('pending','sent','redeemed','expired')),
      sent_at           TIMESTAMPTZ,
      notes             TEXT,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_incentives_tenant ON incentives(tenant_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_incentives_status ON incentives(status);`;

  // ═══════════════════════════════════════════════
  // REFERRAL REWARDS TABLE (Step 8)
  // Separate ledger entry, one per referral event promotion.
  // status lifecycle: pending → cleared → released → paid
  // Hard rule: reward only granted when referral is paid + hold passed + no cancellation.
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS referral_rewards (
      reward_id         TEXT PRIMARY KEY,
      tenant_id         TEXT NOT NULL,
      referral_id       TEXT NOT NULL REFERENCES referral_links(referral_id) ON DELETE CASCADE,
      referral_event_id TEXT UNIQUE REFERENCES referral_events(event_id) ON DELETE CASCADE,
      referrer_user_id  TEXT NOT NULL,
      referred_business_id TEXT NOT NULL,
      amount            REAL NOT NULL DEFAULT 0,
      status            TEXT DEFAULT 'pending' CHECK(status IN ('pending','cleared','released','paid','reversed')),
      hold_until        TIMESTAMPTZ,
      cleared_at        TIMESTAMPTZ,
      released_at       TIMESTAMPTZ,
      paid_at           TIMESTAMPTZ,
      notes             TEXT,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral ON referral_rewards(referral_id);`;

  // ═══════════════════════════════════════════════
  // SYSTEM SETTINGS TABLE
  // One row per tenant — all toggles and config values.
  // ═══════════════════════════════════════════════
  await sql`
    CREATE TABLE IF NOT EXISTS system_settings (
      tenant_id                            TEXT PRIMARY KEY,
      system_enabled                       BOOLEAN DEFAULT true,
      autoreferrer_engine_enabled          BOOLEAN DEFAULT true,
      voice_linkage_enabled                BOOLEAN DEFAULT true,
      incentive_delivery_enabled           BOOLEAN DEFAULT true,
      device_fingerprinting_enabled        BOOLEAN DEFAULT true,
      ip_velocity_detection_enabled        BOOLEAN DEFAULT true,
      self_referral_blocking_enabled       BOOLEAN DEFAULT true,
      disposable_email_detection_enabled   BOOLEAN DEFAULT true,
      auto_block_threshold                 INTEGER DEFAULT 90,
      hold_review_threshold                INTEGER DEFAULT 50,
      fraud_alert_emails_enabled           BOOLEAN DEFAULT true,
      payout_request_notifications_enabled BOOLEAN DEFAULT true,
      daily_summary_digest_enabled         BOOLEAN DEFAULT false,
      stripe_webhook_secret                TEXT DEFAULT '',
      zapier_webhook_url                   TEXT DEFAULT '',
      google_places_api_key                TEXT DEFAULT '',
      updated_at                           TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(referrer_user_id);`;

  // Create indexes (PostgreSQL uses CREATE INDEX IF NOT EXISTS)
  await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_business ON campaigns(business_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_qr_codes_campaign ON qr_codes(campaign_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_qr_codes_short_code ON qr_codes(short_code);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_review_intents_campaign ON review_intents(campaign_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_review_intents_status ON review_intents(thank_status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_referral_links_program ON referral_links(referral_program_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(code);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_referral_events_referral ON referral_events(referral_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_referral_events_status ON referral_events(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_fraud_signals_resolved ON fraud_signals(resolved);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`;

  console.log('✅ Database initialized successfully');
}

module.exports = { getSql, initializeDatabase };
