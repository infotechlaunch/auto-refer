const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// ─────────────────────────────────────────────────
// GET /api/review-intents — List review intents
// ─────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { campaign_id, thank_status, business_id, limit, offset } = req.query;

    const intents = await sql`
      SELECT * FROM review_intents 
      WHERE tenant_id = ${req.user.tenant_id}
      ${campaign_id ? sql`AND campaign_id = ${campaign_id}` : sql``}
      ${thank_status ? sql`AND thank_status = ${thank_status}` : sql``}
      ${business_id ? sql`AND business_id = ${business_id}` : sql``}
      ORDER BY scan_ts DESC
      ${limit ? sql`LIMIT ${parseInt(limit)}` : sql``}
      ${offset ? sql`OFFSET ${parseInt(offset)}` : sql``}
    `;

    const parsed = intents.map(i => ({
      reviewIntentId: i.review_intent_id,
      tenantId: i.tenant_id,
      businessId: i.business_id,
      campaignId: i.campaign_id,
      customerIdentityRef: i.customer_identity_ref,
      scanTs: i.scan_ts,
      expiresAt: i.expires_at,
      thankStatus: i.thank_status,
      thankChannel: i.thank_channel,
      confidence: i.confidence,
      instagramHandle: i.instagram_handle,
      incentiveType: i.incentive_type,
      incentiveValue: i.incentive_value,
      incentiveStatus: i.incentive_status,
    }));

    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// GET /api/review-intents/:id — Get single intent
// ─────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`SELECT * FROM review_intents WHERE review_intent_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;

    if (!results.length) {
      return res.status(404).json({ success: false, error: 'Review intent not found.' });
    }

    const i = results[0];
    res.json({
      success: true,
      data: {
        reviewIntentId: i.review_intent_id,
        tenantId: i.tenant_id,
        businessId: i.business_id,
        campaignId: i.campaign_id,
        customerIdentityRef: i.customer_identity_ref,
        scanTs: i.scan_ts,
        expiresAt: i.expires_at,
        thankStatus: i.thank_status,
        thankChannel: i.thank_channel,
        confidence: i.confidence,
        instagramHandle: i.instagram_handle,
        incentiveType: i.incentive_type,
        incentiveValue: i.incentive_value,
        incentiveStatus: i.incentive_status,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// POST /api/review-intents — Create review intent (from QR scan)
// ─────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      campaignId, customerIdentityRef, thankWindowHoursOverride,
      instagramHandle, incentiveType, incentiveValue,
    } = req.body;

    if (!campaignId) {
      return res.status(400).json({ success: false, error: 'campaignId is required.' });
    }

    const sql = getSql();
    const campaigns = await sql`SELECT * FROM campaigns WHERE campaign_id = ${campaignId} AND tenant_id = ${req.user.tenant_id}`;

    if (!campaigns.length) {
      return res.status(404).json({ success: false, error: 'Campaign not found.' });
    }

    const campaign = campaigns[0];
    const intentId = uuidv4();
    const now = new Date();
    const windowHours = thankWindowHoursOverride || campaign.thank_window_hours;
    const expiresAt = new Date(now.getTime() + windowHours * 3600000).toISOString();

    await sql`
      INSERT INTO review_intents (review_intent_id, tenant_id, business_id, campaign_id, customer_identity_ref, scan_ts, expires_at, thank_status, thank_channel, confidence, instagram_handle, incentive_type, incentive_value, incentive_status)
      VALUES (${intentId}, ${req.user.tenant_id}, ${campaign.business_id}, ${campaignId}, ${customerIdentityRef || null}, ${now.toISOString()}, ${expiresAt}, 'pending', 'none', 'explicit', ${instagramHandle || null}, ${incentiveType || null}, ${incentiveValue || null}, ${incentiveType ? 'pending' : null})
    `;

    // Update dashboard stats
    await sql`UPDATE dashboard_stats SET total_review_intents = total_review_intents + 1, pending_intents = pending_intents + 1, total_scans = total_scans + 1, updated_at = NOW() WHERE id = 1`;

    logAudit(req.user.email, 'review_intent.created', intentId, `Intent for campaign ${campaignId}`);

    res.status(201).json({
      success: true,
      data: {
        reviewIntentId: intentId,
        tenantId: req.user.tenant_id,
        businessId: campaign.business_id,
        campaignId,
        customerIdentityRef: customerIdentityRef || null,
        scanTs: now.toISOString(),
        expiresAt,
        thankStatus: 'pending',
        thankChannel: 'none',
        confidence: 'explicit',
        instagramHandle: instagramHandle || null,
        incentiveType: incentiveType || null,
        incentiveValue: incentiveValue || null,
        incentiveStatus: incentiveType ? 'pending' : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// PUT /api/review-intents/:id/complete — Complete a review intent
// ─────────────────────────────────────────────────
router.put('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`SELECT * FROM review_intents WHERE review_intent_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;

    if (!results.length) {
      return res.status(404).json({ success: false, error: 'Review intent not found.' });
    }

    const intent = results[0];

    if (intent.thank_status === 'completed') {
      return res.status(409).json({ success: false, error: 'Intent already completed.' });
    }

    if (intent.thank_status === 'expired') {
      return res.status(409).json({ success: false, error: 'Intent has expired.' });
    }

    const { thankChannel, confidence } = req.body;

    await sql`
      UPDATE review_intents SET
        thank_status = 'completed',
        thank_channel = COALESCE(${thankChannel || 'in_app'}, thank_channel),
        confidence = COALESCE(${confidence || 'explicit'}, confidence),
        incentive_status = CASE WHEN incentive_type IS NOT NULL THEN 'delivered' ELSE incentive_status END
      WHERE review_intent_id = ${req.params.id}
    `;

    // Update dashboard stats
    await sql`UPDATE dashboard_stats SET completed_thank_yous = completed_thank_yous + 1, pending_intents = GREATEST(0, pending_intents - 1), updated_at = NOW() WHERE id = 1`;

    logAudit(req.user.email, 'review_intent.completed', req.params.id, `Intent completed via ${thankChannel || 'in_app'}`);

    res.json({
      success: true,
      message: 'Review intent marked as completed.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
