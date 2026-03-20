const express = require('express');
const { getSql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const router = express.Router();

// ── Default system settings ────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  // System Controls
  system_enabled: true,
  autoreferrer_engine_enabled: true,
  voice_linkage_enabled: true,
  incentive_delivery_enabled: true,

  // Fraud Prevention
  device_fingerprinting_enabled: true,
  ip_velocity_detection_enabled: true,
  self_referral_blocking_enabled: true,
  disposable_email_detection_enabled: true,
  auto_block_threshold: 90,
  hold_review_threshold: 50,

  // Notifications
  fraud_alert_emails_enabled: true,
  payout_request_notifications_enabled: true,
  daily_summary_digest_enabled: false,

  // API & Integrations
  stripe_webhook_secret: '',
  zapier_webhook_url: '',
  google_places_api_key: '',
};

// ── GET /api/settings ──────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM system_settings WHERE tenant_id = ${req.user.tenant_id}`;

    if (!rows.length) {
      // Return defaults — row will be created on first PUT
      return res.json({ success: true, data: { ...DEFAULT_SETTINGS, tenant_id: req.user.tenant_id } });
    }

    const row = rows[0];
    // Map snake_case DB columns → camelCase for frontend + keep originals for convenience
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
});

// ── PUT /api/settings ──────────────────────────────────────────────────────
router.put('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const tenantId = req.user.tenant_id;

    const {
      system_enabled,
      autoreferrer_engine_enabled,
      voice_linkage_enabled,
      incentive_delivery_enabled,
      device_fingerprinting_enabled,
      ip_velocity_detection_enabled,
      self_referral_blocking_enabled,
      disposable_email_detection_enabled,
      auto_block_threshold,
      hold_review_threshold,
      fraud_alert_emails_enabled,
      payout_request_notifications_enabled,
      daily_summary_digest_enabled,
      stripe_webhook_secret,
      zapier_webhook_url,
      google_places_api_key,
    } = req.body;

    // Upsert system settings
    await sql`
      INSERT INTO system_settings (
        tenant_id,
        system_enabled,
        autoreferrer_engine_enabled,
        voice_linkage_enabled,
        incentive_delivery_enabled,
        device_fingerprinting_enabled,
        ip_velocity_detection_enabled,
        self_referral_blocking_enabled,
        disposable_email_detection_enabled,
        auto_block_threshold,
        hold_review_threshold,
        fraud_alert_emails_enabled,
        payout_request_notifications_enabled,
        daily_summary_digest_enabled,
        stripe_webhook_secret,
        zapier_webhook_url,
        google_places_api_key,
        updated_at
      ) VALUES (
        ${tenantId},
        ${system_enabled ?? true},
        ${autoreferrer_engine_enabled ?? true},
        ${voice_linkage_enabled ?? true},
        ${incentive_delivery_enabled ?? true},
        ${device_fingerprinting_enabled ?? true},
        ${ip_velocity_detection_enabled ?? true},
        ${self_referral_blocking_enabled ?? true},
        ${disposable_email_detection_enabled ?? true},
        ${auto_block_threshold ?? 90},
        ${hold_review_threshold ?? 50},
        ${fraud_alert_emails_enabled ?? true},
        ${payout_request_notifications_enabled ?? true},
        ${daily_summary_digest_enabled ?? false},
        ${stripe_webhook_secret ?? ''},
        ${zapier_webhook_url ?? ''},
        ${google_places_api_key ?? ''},
        NOW()
      )
      ON CONFLICT (tenant_id) DO UPDATE SET
        system_enabled = EXCLUDED.system_enabled,
        autoreferrer_engine_enabled = EXCLUDED.autoreferrer_engine_enabled,
        voice_linkage_enabled = EXCLUDED.voice_linkage_enabled,
        incentive_delivery_enabled = EXCLUDED.incentive_delivery_enabled,
        device_fingerprinting_enabled = EXCLUDED.device_fingerprinting_enabled,
        ip_velocity_detection_enabled = EXCLUDED.ip_velocity_detection_enabled,
        self_referral_blocking_enabled = EXCLUDED.self_referral_blocking_enabled,
        disposable_email_detection_enabled = EXCLUDED.disposable_email_detection_enabled,
        auto_block_threshold = EXCLUDED.auto_block_threshold,
        hold_review_threshold = EXCLUDED.hold_review_threshold,
        fraud_alert_emails_enabled = EXCLUDED.fraud_alert_emails_enabled,
        payout_request_notifications_enabled = EXCLUDED.payout_request_notifications_enabled,
        daily_summary_digest_enabled = EXCLUDED.daily_summary_digest_enabled,
        stripe_webhook_secret = EXCLUDED.stripe_webhook_secret,
        zapier_webhook_url = EXCLUDED.zapier_webhook_url,
        google_places_api_key = EXCLUDED.google_places_api_key,
        updated_at = NOW()
    `;

    logAudit(req.user.email, 'settings.updated', tenantId, 'System settings updated');

    const updated = await sql`SELECT * FROM system_settings WHERE tenant_id = ${tenantId}`;
    res.json({ success: true, data: updated[0], message: 'Settings saved successfully.' });
  } catch (err) { next(err); }
});

// ── POST /api/settings/freeze-wallets ─────────────────────────────────────
router.post('/freeze-wallets', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { count } = await sql`
      UPDATE referral_wallets SET frozen = true, last_adjusted_at = NOW()
      WHERE tenant_id = ${req.user.tenant_id} AND frozen = false
    `.then(r => ({ count: r.count }));

    logAudit(req.user.email, 'settings.freeze_all_wallets', req.user.tenant_id, `Froze all wallets (${count} affected)`);
    res.json({ success: true, message: `All wallets frozen. ${count} wallet(s) affected.`, count });
  } catch (err) { next(err); }
});

// ── POST /api/settings/purge-expired-intents ──────────────────────────────
router.post('/purge-expired-intents', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const result = await sql`
      DELETE FROM review_intents
      WHERE thank_status = 'expired'
        AND tenant_id = ${req.user.tenant_id}
    `;

    const deleted = result.count ?? 0;
    logAudit(req.user.email, 'settings.purge_expired_intents', req.user.tenant_id, `Purged ${deleted} expired review intent(s)`);
    res.json({ success: true, message: `Purged ${deleted} expired intent(s).`, count: deleted });
  } catch (err) { next(err); }
});

module.exports = router;
