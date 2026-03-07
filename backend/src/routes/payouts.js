const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const router = express.Router();

// GET /api/payouts
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { status } = req.query;
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

    const payouts = await sql`
      SELECT * FROM payout_requests
      WHERE 1=1
      ${isAdmin ? sql`` : sql` AND owner_id = ${req.user.id}`}
      ${status ? sql` AND status = ${status}` : sql``}
      ORDER BY created_at DESC
    `;

    const parsed = payouts.map(p => ({
      payoutRequestId: p.payout_request_id, ownerId: p.owner_id, ownerName: p.owner_name,
      amount: p.amount, method: p.method, status: p.status,
      notes: p.notes, createdAt: p.created_at, processedAt: p.processed_at,
    }));
    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) { next(err); }
});

// POST /api/payouts — Request payout
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { amount, method, notes } = req.body;
    if (!amount || !method) return res.status(400).json({ success: false, error: 'Amount and method are required.' });
    if (amount <= 0) return res.status(400).json({ success: false, error: 'Invalid payout amount.' });

    const sql = getSql();

    // 1. Check if user has a wallet with enough available balance
    const wallets = await sql`
      SELECT * FROM referral_wallets 
      WHERE owner_id = ${req.user.id} AND tenant_id = ${req.user.tenant_id}
    `;

    if (!wallets.length) {
      return res.status(404).json({ success: false, error: 'Referral wallet not found.' });
    }

    const w = wallets[0];
    if (w.frozen) {
      return res.status(403).json({ success: false, error: 'Your wallet is currently frozen. Please contact support.' });
    }

    if (w.balance_available < amount) {
      return res.status(400).json({ success: false, error: `Insufficient balance. Available: $${w.balance_available.toFixed(2)}` });
    }

    // 2. Start Transaction: Update wallet and create payout request
    await sql.begin(async (tx) => {
      // Deduct from available, add to paid (effectively "out of wallet")
      await tx`
        UPDATE referral_wallets 
        SET 
          balance_available = balance_available - ${amount},
          last_adjusted_at = NOW()
        WHERE wallet_id = ${w.wallet_id}
      `;

      const payoutId = uuidv4();
      await tx`
        INSERT INTO payout_requests (
          payout_request_id, owner_id, owner_name, 
          amount, method, status, notes
        ) 
        VALUES (
          ${payoutId}, ${req.user.id}, ${req.user.name}, 
          ${amount}, ${method}, 'requested', ${notes || null}
        )
      `;

      logAudit(req.user.email, 'payout.requested', payoutId, `Payout $${amount} via ${method}`);
    });

    res.status(201).json({ 
      success: true, 
      message: 'Payout requested successfully. Funds have been deducted from your available balance.' 
    });
  } catch (err) { next(err); }
});

// PUT /api/payouts/:id/approve
router.put('/:id/approve', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`SELECT * FROM payout_requests WHERE payout_request_id = ${req.params.id}`;
    if (!results.length) return res.status(404).json({ success: false, error: 'Not found.' });
    const p = results[0];
    if (p.status !== 'requested') return res.status(409).json({ success: false, error: `Cannot approve a ${p.status} payout.` });
    await sql`UPDATE payout_requests SET status = 'approved', processed_at = NOW() WHERE payout_request_id = ${req.params.id}`;
    logAudit(req.user.email, 'payout.approved', req.params.id, `Approved $${p.amount}`);
    res.json({ success: true, message: 'Payout approved.' });
  } catch (err) { next(err); }
});

// PUT /api/payouts/:id/reject
router.put('/:id/reject', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`SELECT * FROM payout_requests WHERE payout_request_id = ${req.params.id}`;
    if (!results.length) return res.status(404).json({ success: false, error: 'Not found.' });
    const p = results[0];
    if (p.status !== 'requested') return res.status(409).json({ success: false, error: `Cannot reject a ${p.status} payout.` });
    await sql`UPDATE payout_requests SET status = 'rejected', processed_at = NOW(), notes = ${req.body.reason || null} WHERE payout_request_id = ${req.params.id}`;
    logAudit(req.user.email, 'payout.rejected', req.params.id, `Rejected $${p.amount}`);
    res.json({ success: true, message: 'Payout rejected.' });
  } catch (err) { next(err); }
});

// PUT /api/payouts/:id/mark-paid
router.put('/:id/mark-paid', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`SELECT * FROM payout_requests WHERE payout_request_id = ${req.params.id}`;
    if (!results.length) return res.status(404).json({ success: false, error: 'Not found.' });
    const p = results[0];
    await sql`UPDATE payout_requests SET status = 'paid', processed_at = NOW() WHERE payout_request_id = ${req.params.id}`;
    logAudit(req.user.email, 'payout.paid', req.params.id, `Marked paid $${p.amount}`);
    res.json({ success: true, message: 'Payout marked as paid.' });
  } catch (err) { next(err); }
});

module.exports = router;
