const express = require('express');
const { getSql } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const router = express.Router();

// GET /api/fraud-queue
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const sql = getSql();
    const { resolved, decision } = req.query;

    const signals = await sql`
      SELECT * FROM fraud_signals 
      WHERE tenant_id = ${req.user.tenant_id}
      ${resolved !== undefined ? sql`AND resolved = ${resolved === 'true'}` : sql``}
      ${decision ? sql`AND decision = ${decision}` : sql``}
      ORDER BY created_at DESC
    `;

    const parsed = signals.map(s => ({
      signalId: s.signal_id, tenantId: s.tenant_id,
      referredBusinessId: s.referred_business_id, referralId: s.referral_id,
      referrerName: s.referrer_name, referredName: s.referred_name,
      totalScore: s.total_score, flags: JSON.parse(s.flags || '[]'),
      decision: s.decision, resolved: !!s.resolved,
      resolvedBy: s.resolved_by, resolvedAt: s.resolved_at,
      notes: s.notes, createdAt: s.created_at,
    }));
    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) { next(err); }
});

// PUT /api/fraud-queue/:id/resolve
router.put('/:id/resolve', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`SELECT * FROM fraud_signals WHERE signal_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;
    if (!results.length) return res.status(404).json({ success: false, error: 'Signal not found.' });
    const signal = results[0];
    const { decision, notes } = req.body;
    await sql`UPDATE fraud_signals SET resolved = true, resolved_by = ${req.user.email}, resolved_at = NOW(), decision = COALESCE(${decision || null}, decision), notes = ${notes || null} WHERE signal_id = ${req.params.id}`;
    logAudit(req.user.email, 'fraud.resolved', req.params.id, `Resolved: ${decision || signal.decision} — ${notes || 'No notes'}`);
    res.json({ success: true, message: 'Fraud signal resolved.' });
  } catch (err) { next(err); }
});

module.exports = router;
