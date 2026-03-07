const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

function generateRefCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { referral_program_id, status } = req.query;

    const links = await sql`
      SELECT * FROM referral_links 
      WHERE tenant_id = ${req.user.tenant_id}
      ${referral_program_id ? sql`AND referral_program_id = ${referral_program_id}` : sql``}
      ${status ? sql`AND status = ${status}` : sql``}
      ORDER BY created_at DESC
    `;

    const parsed = links.map(l => ({
      referralId: l.referral_id, tenantId: l.tenant_id, referralProgramId: l.referral_program_id,
      referrerType: l.referrer_type, referrerUserId: l.referrer_user_id, code: l.code,
      shareUrl: l.share_url, status: l.status, maxUses: l.max_uses,
      usageCount: l.usage_count, expiresAt: l.expires_at, createdAt: l.created_at,
    }));
    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) { next(err); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { referralProgramId, referrerType, referrerUserId, code, maxUses, expiresAt } = req.body;
    if (!referralProgramId || !referrerType) {
      return res.status(400).json({ success: false, error: 'referralProgramId and referrerType are required.' });
    }
    const sql = getSql();
    const programs = await sql`SELECT * FROM referral_programs WHERE referral_program_id = ${referralProgramId} AND tenant_id = ${req.user.tenant_id}`;
    if (!programs.length) return res.status(404).json({ success: false, error: 'Program not found.' });
    const referralId = uuidv4();
    const refCode = code || generateRefCode();
    const shareUrl = `https://itl.ink/ref/${refCode}`;
    await sql`INSERT INTO referral_links (referral_id, tenant_id, referral_program_id, referrer_type, referrer_user_id, code, share_url, max_uses, expires_at) VALUES (${referralId}, ${req.user.tenant_id}, ${referralProgramId}, ${referrerType}, ${referrerUserId || req.user.id}, ${refCode}, ${shareUrl}, ${maxUses || 0}, ${expiresAt || null})`;
    logAudit(req.user.email, 'referral_link.created', referralId, `Link "${refCode}" created`);
    res.status(201).json({ success: true, data: { referralId, code: refCode, shareUrl, status: 'active', createdAt: new Date().toISOString() } });
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const existing = await sql`SELECT * FROM referral_links WHERE referral_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;
    if (!existing.length) return res.status(404).json({ success: false, error: 'Not found.' });
    const { status, maxUses, expiresAt } = req.body;
    await sql`UPDATE referral_links SET status = COALESCE(${status || null}, status), max_uses = COALESCE(${maxUses !== undefined ? maxUses : null}, max_uses), expires_at = COALESCE(${expiresAt || null}, expires_at) WHERE referral_id = ${req.params.id}`;
    logAudit(req.user.email, 'referral_link.updated', req.params.id, 'Link updated');
    const updated = await sql`SELECT * FROM referral_links WHERE referral_id = ${req.params.id}`;
    res.json({ success: true, data: { referralId: updated[0].referral_id, status: updated[0].status } });
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const existing = await sql`SELECT * FROM referral_links WHERE referral_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;
    if (!existing.length) return res.status(404).json({ success: false, error: 'Not found.' });
    await sql`DELETE FROM referral_links WHERE referral_id = ${req.params.id}`;
    logAudit(req.user.email, 'referral_link.deleted', req.params.id, `Deleted "${existing[0].code}"`);
    res.json({ success: true, message: 'Deleted.' });
  } catch (err) { next(err); }
});

router.get('/:id/events', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const events = await sql`SELECT * FROM referral_events WHERE referral_id = ${req.params.id} ORDER BY event_ts DESC`;
    const parsed = events.map(e => ({ eventId: e.event_id, referralId: e.referral_id, referredBusinessId: e.referred_business_id, status: e.status, eventTs: e.event_ts, amount: e.amount, fraudScore: e.fraud_score }));
    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) { next(err); }
});

module.exports = router;
