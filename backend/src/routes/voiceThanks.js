/**
 * STEP 6 — AI Voice Thank-You System
 *
 * Core Logic:
 *  1. Customer calls the business after leaving a review.
 *  2. Caller ID (phone number) is passed to POST /call.
 *  3. System identifies the customer, checks:
 *       – Was QR scanned?
 *       – Was phone captured?
 *       – Did they leave a review (thank_status = 'pending')?
 *       – Is the call within the thank_window_hours (default 24h)?
 *       – Has the voice thank-you been played already?
 *  4. If all OK → return the appropriate script (rush_hour or standard).
 *  5. Idempotent: a thank-you is marked played ONCE. Subsequent calls get skipped.
 */

'use strict';

const express  = require('express');
const crypto   = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getSql }     = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { logAudit }   = require('../utils/auditLogger');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** One-way hash for phone numbers (no PII stored in plain text) */
function hashPhone(phone) {
  // Normalize: strip spaces, dashes, parens, leading +
  const normalized = String(phone).replace(/[\s\-().+]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Check whether NOW (in the campaign's timezone) falls inside any rush-hour window.
 * rush_hours DB format (JSON):
 *   { "monday": [{"start":"11:00","end":"14:00"},{"start":"17:00","end":"20:00"}], ... }
 * Day key is lowercase weekday name.
 */
function isRushHour(rushHoursJson, timezone = 'America/New_York') {
  try {
    const rushHours = typeof rushHoursJson === 'string'
      ? JSON.parse(rushHoursJson)
      : (rushHoursJson || {});

    // Get local time in the campaign timezone
    const now = new Date();
    const localStr = now.toLocaleString('en-US', { timeZone: timezone, hour12: false });
    // localStr example: "3/5/2026, 14:35:22"
    const [, timeStr] = localStr.split(', ');
    const [h, m] = timeStr.split(':').map(Number);
    const currentMinutes = h * 60 + m;

    /**
     * The app supports two formats:
     * 1. Day-based (future proof): { "monday": [{start, end}], ... }
     * 2. Period-based (current): { "Lunch Time": ["11:30", "14:30"], ... }
     */

    // Check if it's the period-based format (values are arrays or have start/end)
    const periods = Object.values(rushHours);
    
    for (const slot of periods) {
      let startH, startM, endH, endM;

      if (Array.isArray(slot)) {
        // Format: ["11:30", "14:30"]
        [startH, startM] = slot[0].split(':').map(Number);
        [endH, endM]     = slot[1].split(':').map(Number);
      } else if (slot.start && slot.end) {
        // Format: { start: "11:30", end: "14:30" }
        [startH, startM] = slot.start.split(':').map(Number);
        [endH, endM]     = slot.end.split(':').map(Number);
      } else {
        continue;
      }

      const startMin = startH * 60 + startM;
      const endMin   = endH   * 60 + endM;

      if (currentMinutes >= startMin && currentMinutes <= endMin) {
        return true;
      }
    }

    // Also check for day-based format if still not found
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const dayIndex = new Date(now.toLocaleDateString('en-US', { timeZone: timezone })).getDay();
    const dayKey = days[dayIndex];
    const daySlots = rushHours[dayKey] || [];
    
    return daySlots.some(slot => {
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      return currentMinutes >= (sh * 60 + sm) && currentMinutes <= (eh * 60 + em);
    });
  } catch (err) {
    console.error('isRushHour error:', err);
    return false;
  }
}

const SCRIPTS = {
  rush_hour: "Thank you for your recent review! We really appreciate it.",
  standard:  "Hi! We noticed you recently left us a review — thank you so much, it means a lot to us.",
};

// ─────────────────────────────────────────────────────────────────
// POST /api/voice-thanks/call
// Body: { phoneNumber, campaignId? }
// Called by the telephony provider (or simulation) when a call comes in.
// Returns: { playThankYou, script?, variant?, reason? }
// ─────────────────────────────────────────────────────────────────
router.post('/call', authenticate, async (req, res, next) => {
  try {
    const { phoneNumber, campaignId } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'phoneNumber is required.' });
    }

    const sql      = getSql();
    const phone_hash = hashPhone(phoneNumber);
    const eventId  = uuidv4();

    // ── 1. Find customer identity ──────────────────────────────
    const identities = await sql`
      SELECT identity_id, identity_ref FROM customer_identities
      WHERE phone_hash = ${phone_hash}
      LIMIT 1
    `;

    if (!identities.length) {
      await sql`
        INSERT INTO voice_thank_events (event_id, tenant_id, phone_hash, campaign_id, played, skip_reason)
        VALUES (${eventId}, ${req.user.tenant_id}, ${phone_hash}, ${campaignId || null}, false, 'no_match')
      `;
      return res.json({ success: true, playThankYou: false, reason: 'no_match' });
    }

    const identityRef = identities[0].identity_ref;

    // ── 2. Find the most recent relevant review_intent ─────────
    const intentQuery = campaignId
      ? await sql`
          SELECT ri.*, c.rush_hours, c.timezone, c.thank_window_hours, c.enable_voice_linkage
          FROM review_intents ri
          JOIN campaigns c ON ri.campaign_id = c.campaign_id
          WHERE ri.tenant_id        = ${req.user.tenant_id}
            AND ri.customer_identity_ref = ${identityRef}
            AND ri.campaign_id      = ${campaignId}
            AND ri.thank_status     = 'pending'
            AND ri.thank_channel    = 'none'
            AND ri.scan_ts          > NOW() - INTERVAL '1 hour' * c.thank_window_hours
          ORDER BY ri.scan_ts DESC
          LIMIT 1
        `
      : await sql`
          SELECT ri.*, c.rush_hours, c.timezone, c.thank_window_hours, c.enable_voice_linkage
          FROM review_intents ri
          JOIN campaigns c ON ri.campaign_id = c.campaign_id
          WHERE ri.tenant_id        = ${req.user.tenant_id}
            AND ri.customer_identity_ref = ${identityRef}
            AND ri.thank_status     = 'pending'
            AND ri.thank_channel    = 'none'
            AND ri.scan_ts          > NOW() - INTERVAL '1 hour' * c.thank_window_hours
          ORDER BY ri.scan_ts DESC
          LIMIT 1
        `;

    if (!intentQuery.length) {
      // No pending intent found (no review, or outside window)
      const skipReason = 'no_review';
      await sql`
        INSERT INTO voice_thank_events (event_id, tenant_id, phone_hash, campaign_id, played, skip_reason)
        VALUES (${eventId}, ${req.user.tenant_id}, ${phone_hash}, ${campaignId || null}, false, ${skipReason})
      `;
      return res.json({ success: true, playThankYou: false, reason: skipReason });
    }

    const intent   = intentQuery[0];
    const intentId = intent.review_intent_id;
    const effectiveCampaignId = intent.campaign_id;

    // ── 3. Idempotency — check if already played for this intent ─
    const alreadyPlayed = await sql`
      SELECT event_id FROM voice_thank_events
      WHERE review_intent_id = ${intentId} AND played = true
      LIMIT 1
    `;

    if (alreadyPlayed.length) {
      await sql`
        INSERT INTO voice_thank_events
          (event_id, tenant_id, phone_hash, campaign_id, review_intent_id, played, skip_reason)
        VALUES
          (${eventId}, ${req.user.tenant_id}, ${phone_hash}, ${effectiveCampaignId}, ${intentId}, false, 'already_played')
      `;
      return res.json({ success: true, playThankYou: false, reason: 'already_played' });
    }

    // ── 4. Determine rush-hour variant ────────────────────────────
    const rushHours = intent.rush_hours;
    const timezone  = intent.timezone || 'America/New_York';
    const variant   = isRushHour(rushHours, timezone) ? 'rush_hour' : 'standard';
    const script    = SCRIPTS[variant];

    // ── 5. Mark intent as thanked (voice_inbound) — ATOMIC ──────
    await sql`
      UPDATE review_intents
      SET thank_status = 'completed', thank_channel = 'voice_inbound'
      WHERE review_intent_id = ${intentId}
        AND thank_status = 'pending'   -- guard against race condition
    `;

    // ── 6. Record the event ────────────────────────────────────────
    await sql`
      INSERT INTO voice_thank_events
        (event_id, tenant_id, phone_hash, campaign_id, review_intent_id, played, script_variant)
      VALUES
        (${eventId}, ${req.user.tenant_id}, ${phone_hash}, ${effectiveCampaignId}, ${intentId}, true, ${variant})
    `;

    // ── 7. Update dashboard stats ──────────────────────────────────
    await sql`
      UPDATE dashboard_stats
      SET completed_thank_yous = completed_thank_yous + 1, updated_at = NOW()
      WHERE id = 1
    `;

    logAudit(
      req.user.email,
      'voice_thank.played',
      eventId,
      `Voice thank-you played (${variant}) for intent ${intentId}`
    );

    return res.json({
      success: true,
      playThankYou: true,
      variant,
      script,
      intentId,
      campaignId: effectiveCampaignId,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/voice-thanks — List all voice thank events
// ─────────────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { campaign_id, played, limit = '50', offset = '0' } = req.query;

    const events = await sql`
      SELECT vt.*,
             c.name AS campaign_name
      FROM   voice_thank_events vt
      LEFT JOIN campaigns c ON vt.campaign_id = c.campaign_id
      WHERE  vt.tenant_id = ${req.user.tenant_id}
      ${campaign_id ? sql`AND vt.campaign_id = ${campaign_id}` : sql``}
      ${played !== undefined ? sql`AND vt.played = ${played === 'true'}` : sql``}
      ORDER BY vt.call_ts DESC
      LIMIT  ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    const parsed = events.map(e => ({
      eventId:        e.event_id,
      tenantId:       e.tenant_id,
      campaignId:     e.campaign_id,
      campaignName:   e.campaign_name,
      reviewIntentId: e.review_intent_id,
      phoneHash:      e.phone_hash,
      callTs:         e.call_ts,
      played:         !!e.played,
      skipReason:     e.skip_reason,
      scriptVariant:  e.script_variant,
      durationSeconds: e.duration_seconds,
    }));

    // totals
    const totals = await sql`
      SELECT
        COUNT(*)                                    AS total,
        COUNT(*) FILTER (WHERE played = true)       AS total_played,
        COUNT(*) FILTER (WHERE played = false)      AS total_skipped
      FROM voice_thank_events
      WHERE tenant_id = ${req.user.tenant_id}
    `;

    res.json({
      success: true,
      data: parsed,
      count: parsed.length,
      stats: {
        total:        Number(totals[0].total),
        totalPlayed:  Number(totals[0].total_played),
        totalSkipped: Number(totals[0].total_skipped),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/voice-thanks/scripts — Return the configured voice scripts
// ─────────────────────────────────────────────────────────────────
router.get('/scripts', authenticate, (_req, res) => {
  res.json({ success: true, data: SCRIPTS });
});

module.exports = router;
