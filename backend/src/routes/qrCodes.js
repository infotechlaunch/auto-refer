const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─────────────────────────────────────────────────
// GET /api/qr-codes — List all QR codes
// ─────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { campaign_id, active } = req.query;

    const codes = await sql`
      SELECT q.*, c.name as campaign_name, c.tenant_id
      FROM qr_codes q
      JOIN campaigns c ON q.campaign_id = c.campaign_id
      WHERE c.tenant_id = ${req.user.tenant_id}
      ${campaign_id ? sql`AND q.campaign_id = ${campaign_id}` : sql``}
      ${active !== undefined ? sql`AND q.active = ${active === 'true'}` : sql``}
      ORDER BY q.created_at DESC
    `;

    const parsed = codes.map(q => ({
      qrCodeId: q.qr_code_id,
      campaignId: q.campaign_id,
      campaignName: q.campaign_name,
      shortCode: q.short_code,
      shortUrl: q.short_url,
      active: !!q.active,
      scanCount: q.scan_count,
      createdAt: q.created_at,
    }));

    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// POST /api/qr-codes — Generate QR code for campaign
// ─────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ success: false, error: 'campaignId is required.' });
    }

    const sql = getSql();
    const campaigns = await sql`SELECT * FROM campaigns WHERE campaign_id = ${campaignId} AND tenant_id = ${req.user.tenant_id}`;

    if (!campaigns.length) {
      return res.status(404).json({ success: false, error: 'Campaign not found.' });
    }

    const qrCodeId = uuidv4();
    const shortCode = generateShortCode();
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5174';
    const shortUrl = `${baseUrl}/r/${shortCode}`;

    await sql`
      INSERT INTO qr_codes (qr_code_id, campaign_id, short_code, short_url, active)
      VALUES (${qrCodeId}, ${campaignId}, ${shortCode}, ${shortUrl}, true)
    `;

    await sql`UPDATE dashboard_stats SET active_qr_codes = active_qr_codes + 1, updated_at = NOW() WHERE id = 1`;

    logAudit(req.user.email, 'qr_code.generated', qrCodeId, `QR code "${shortCode}" for campaign ${campaignId}`);

    res.status(201).json({
      success: true,
      data: {
        qrCodeId,
        campaignId,
        shortCode,
        shortUrl,
        active: true,
        scanCount: 0,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// PUT /api/qr-codes/:id/toggle — Toggle active state
// ─────────────────────────────────────────────────
router.put('/:id/toggle', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`
      SELECT q.*, c.tenant_id FROM qr_codes q
      JOIN campaigns c ON q.campaign_id = c.campaign_id
      WHERE q.qr_code_id = ${req.params.id} AND c.tenant_id = ${req.user.tenant_id}
    `;

    if (!results.length) {
      return res.status(404).json({ success: false, error: 'QR code not found.' });
    }

    const qr = results[0];
    const newActive = !qr.active;
    await sql`UPDATE qr_codes SET active = ${newActive} WHERE qr_code_id = ${req.params.id}`;

    // Update stats
    const delta = newActive ? 1 : -1;
    await sql`UPDATE dashboard_stats SET active_qr_codes = GREATEST(0, active_qr_codes + ${delta}), updated_at = NOW() WHERE id = 1`;

    logAudit(req.user.email, 'qr_code.toggled', req.params.id, `QR code ${newActive ? 'activated' : 'deactivated'}`);

    res.json({
      success: true,
      data: { qrCodeId: req.params.id, active: newActive },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// DELETE /api/qr-codes/:id — Delete QR code
// ─────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`
      SELECT q.*, c.tenant_id FROM qr_codes q
      JOIN campaigns c ON q.campaign_id = c.campaign_id
      WHERE q.qr_code_id = ${req.params.id} AND c.tenant_id = ${req.user.tenant_id}
    `;

    if (!results.length) {
      return res.status(404).json({ success: false, error: 'QR code not found.' });
    }

    const qr = results[0];
    await sql`DELETE FROM qr_codes WHERE qr_code_id = ${req.params.id}`;

    if (qr.active) {
      await sql`UPDATE dashboard_stats SET active_qr_codes = GREATEST(0, active_qr_codes - 1), updated_at = NOW() WHERE id = 1`;
    }

    logAudit(req.user.email, 'qr_code.deleted', req.params.id, `QR code "${qr.short_code}" deleted`);

    res.json({ success: true, message: 'QR code deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
