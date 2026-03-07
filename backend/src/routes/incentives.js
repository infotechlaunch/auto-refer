/**
 * STEP 7 — Incentive System
 *
 * Hard Rules:
 *  - Incentives work ONLY if the campaign has enable_incentives = true.
 *  - System NEVER sends an incentive automatically unless the client allows.
 *  - Client chooses the send method: sms | email | manual | auto.
 *  - Admin can create, assign, send, expire incentives.
 */

'use strict';

const express  = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSql }     = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit }   = require('../utils/auditLogger');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────
// GET /api/incentives — List all incentives for this tenant
// ─────────────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { campaign_id, status, limit = '50', offset = '0' } = req.query;

    const rows = await sql`
      SELECT i.*, c.name AS campaign_name, c.enable_incentives
      FROM   incentives i
      LEFT JOIN campaigns c ON i.campaign_id = c.campaign_id
      WHERE  i.tenant_id = ${req.user.tenant_id}
      ${campaign_id ? sql`AND i.campaign_id = ${campaign_id}` : sql``}
      ${status ? sql`AND i.status = ${status}` : sql``}
      ORDER BY i.created_at DESC
      LIMIT  ${parseInt(limit)}
      OFFSET ${parseInt(offset)}
    `;

    const parsed = rows.map(row => ({
      incentiveId:     row.incentive_id,
      tenantId:        row.tenant_id,
      campaignId:      row.campaign_id,
      campaignName:    row.campaign_name,
      enableIncentives: !!row.enable_incentives,
      reviewIntentId:  row.review_intent_id,
      customerName:    row.customer_name,
      incentiveType:   row.incentive_type,
      incentiveValue:  row.incentive_value,
      sendMethod:      row.send_method,
      status:          row.status,
      sentAt:          row.sent_at,
      notes:           row.notes,
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
    }));

    // Aggregate stats
    const stats = await sql`
      SELECT
        COUNT(*)                                            AS total,
        COUNT(*) FILTER (WHERE status = 'pending')          AS pending,
        COUNT(*) FILTER (WHERE status = 'sent')             AS sent,
        COUNT(*) FILTER (WHERE status = 'redeemed')         AS redeemed,
        COUNT(*) FILTER (WHERE status = 'expired')          AS expired
      FROM incentives
      WHERE tenant_id = ${req.user.tenant_id}
    `;

    res.json({
      success: true,
      data: parsed,
      count: parsed.length,
      stats: {
        total:    Number(stats[0].total),
        pending:  Number(stats[0].pending),
        sent:     Number(stats[0].sent),
        redeemed: Number(stats[0].redeemed),
        expired:  Number(stats[0].expired),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/incentives — Create a new incentive assignment
// ─────────────────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      campaignId,
      reviewIntentId,
      customerName,
      incentiveType,
      incentiveValue,
      sendMethod = 'manual',
      notes,
    } = req.body;

    if (!incentiveType || !incentiveValue) {
      return res.status(400).json({
        success: false,
        error: 'incentiveType and incentiveValue are required.',
      });
    }

    const sql = getSql();

    // ── Guard: check campaign has enable_incentives = true ──────
    if (campaignId) {
      const campaigns = await sql`
        SELECT enable_incentives FROM campaigns
        WHERE campaign_id = ${campaignId} AND tenant_id = ${req.user.tenant_id}
      `;
      if (!campaigns.length) {
        return res.status(404).json({ success: false, error: 'Campaign not found.' });
      }
      if (!campaigns[0].enable_incentives) {
        return res.status(403).json({
          success: false,
          error: 'Incentives are disabled for this campaign. Enable them in campaign settings first.',
        });
      }
    }

    const incentiveId = uuidv4();

    await sql`
      INSERT INTO incentives
        (incentive_id, tenant_id, campaign_id, review_intent_id, customer_name,
         incentive_type, incentive_value, send_method, notes)
      VALUES
        (${incentiveId}, ${req.user.tenant_id}, ${campaignId || null},
         ${reviewIntentId || null}, ${customerName || null},
         ${incentiveType}, ${incentiveValue}, ${sendMethod}, ${notes || null})
    `;

    // If linked to a review intent, update it
    if (reviewIntentId) {
      await sql`
        UPDATE review_intents
        SET incentive_type   = ${incentiveType},
            incentive_value  = ${incentiveValue},
            incentive_status = 'pending'
        WHERE review_intent_id = ${reviewIntentId}
          AND tenant_id        = ${req.user.tenant_id}
      `;
    }

    logAudit(req.user.email, 'incentive.created', incentiveId,
      `${incentiveType}:${incentiveValue} for ${customerName || 'unknown'} via ${sendMethod}`);

    res.status(201).json({
      success: true,
      data: { incentiveId, incentiveType, incentiveValue, sendMethod, status: 'pending' },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/incentives/:id/send — Mark incentive as sent
// Client explicitly triggers this (no auto-send without permission).
// ─────────────────────────────────────────────────────────────────
router.put('/:id/send', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();

    const existing = await sql`
      SELECT i.*, c.enable_incentives
      FROM   incentives i
      LEFT JOIN campaigns c ON i.campaign_id = c.campaign_id
      WHERE  i.incentive_id = ${req.params.id}
        AND  i.tenant_id    = ${req.user.tenant_id}
    `;

    if (!existing.length) {
      return res.status(404).json({ success: false, error: 'Incentive not found.' });
    }

    const inc = existing[0];

    if (inc.enable_incentives === false) {
      return res.status(403).json({
        success: false,
        error: 'Incentives are disabled for this campaign.',
      });
    }

    if (inc.status !== 'pending') {
      return res.status(409).json({
        success: false,
        error: `Cannot send: incentive is already "${inc.status}".`,
      });
    }

    const { sendMethod } = req.body;
    const method = sendMethod || inc.send_method;

    await sql`
      UPDATE incentives
      SET status = 'sent', sent_at = NOW(), send_method = ${method}, updated_at = NOW()
      WHERE incentive_id = ${req.params.id}
    `;

    // Sync back to review_intent
    if (inc.review_intent_id) {
      await sql`
        UPDATE review_intents
        SET incentive_status = 'delivered'
        WHERE review_intent_id = ${inc.review_intent_id}
      `;
    }

    logAudit(req.user.email, 'incentive.sent', req.params.id,
      `Sent via ${method} to ${inc.customer_name || 'unknown'}`);

    res.json({ success: true, data: { incentiveId: req.params.id, status: 'sent', sentAt: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/incentives/:id/redeem — Mark as redeemed
// ─────────────────────────────────────────────────────────────────
router.put('/:id/redeem', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const existing = await sql`
      SELECT * FROM incentives
      WHERE incentive_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}
    `;
    if (!existing.length) return res.status(404).json({ success: false, error: 'Not found.' });
    if (existing[0].status !== 'sent') {
      return res.status(409).json({ success: false, error: `Cannot redeem: status is "${existing[0].status}".` });
    }

    await sql`
      UPDATE incentives SET status = 'redeemed', updated_at = NOW()
      WHERE incentive_id = ${req.params.id}
    `;
    if (existing[0].review_intent_id) {
      await sql`
        UPDATE review_intents SET incentive_status = 'delivered'
        WHERE review_intent_id = ${existing[0].review_intent_id}
      `;
    }
    logAudit(req.user.email, 'incentive.redeemed', req.params.id, 'Incentive redeemed.');
    res.json({ success: true, data: { incentiveId: req.params.id, status: 'redeemed' } });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/incentives/:id/expire — Mark as expired
// ─────────────────────────────────────────────────────────────────
router.put('/:id/expire', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const sql = getSql();
    const existing = await sql`
      SELECT * FROM incentives
      WHERE incentive_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}
    `;
    if (!existing.length) return res.status(404).json({ success: false, error: 'Not found.' });

    await sql`
      UPDATE incentives SET status = 'expired', updated_at = NOW()
      WHERE incentive_id = ${req.params.id}
    `;
    if (existing[0].review_intent_id) {
      await sql`
        UPDATE review_intents SET incentive_status = 'expired'
        WHERE review_intent_id = ${existing[0].review_intent_id}
      `;
    }
    logAudit(req.user.email, 'incentive.expired', req.params.id, 'Incentive expired.');
    res.json({ success: true, data: { incentiveId: req.params.id, status: 'expired' } });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// DELETE /api/incentives/:id
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const sql = getSql();
    const existing = await sql`
      SELECT * FROM incentives
      WHERE incentive_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}
    `;
    if (!existing.length) return res.status(404).json({ success: false, error: 'Not found.' });
    await sql`DELETE FROM incentives WHERE incentive_id = ${req.params.id}`;
    logAudit(req.user.email, 'incentive.deleted', req.params.id, 'Incentive deleted.');
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
