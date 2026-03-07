const express = require('express');
const { getSql } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const router = express.Router();

// GET /api/wallets
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const wallets = await sql`SELECT * FROM referral_wallets WHERE tenant_id = ${req.user.tenant_id} ORDER BY last_adjusted_at DESC`;
    const parsed = wallets.map(w => ({
      walletId: w.wallet_id, tenantId: w.tenant_id, ownerId: w.owner_id,
      ownerName: w.owner_name, balancePending: w.balance_pending,
      balanceAvailable: w.balance_available, balancePaid: w.balance_paid,
      frozen: !!w.frozen, lastAdjustedAt: w.last_adjusted_at,
    }));
    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) { next(err); }
});

// GET /api/wallets/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`SELECT * FROM referral_wallets WHERE wallet_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;
    if (!results.length) return res.status(404).json({ success: false, error: 'Wallet not found.' });
    const w = results[0];
    res.json({ success: true, data: {
      walletId: w.wallet_id, tenantId: w.tenant_id, ownerId: w.owner_id,
      ownerName: w.owner_name, balancePending: w.balance_pending,
      balanceAvailable: w.balance_available, balancePaid: w.balance_paid,
      frozen: !!w.frozen, lastAdjustedAt: w.last_adjusted_at,
    }});
  } catch (err) { next(err); }
});

// POST /api/wallets/:id/freeze — Toggle freeze
router.post('/:id/freeze', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`SELECT * FROM referral_wallets WHERE wallet_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;
    if (!results.length) return res.status(404).json({ success: false, error: 'Wallet not found.' });
    const w = results[0];
    const newFrozen = !w.frozen;
    await sql`UPDATE referral_wallets SET frozen = ${newFrozen}, last_adjusted_at = NOW() WHERE wallet_id = ${req.params.id}`;
    logAudit(req.user.email, newFrozen ? 'wallet.frozen' : 'wallet.unfrozen', req.params.id, `Wallet ${newFrozen ? 'frozen' : 'unfrozen'} for ${w.owner_name}`);
    res.json({ success: true, data: { walletId: req.params.id, frozen: newFrozen } });
  } catch (err) { next(err); }
});

module.exports = router;
