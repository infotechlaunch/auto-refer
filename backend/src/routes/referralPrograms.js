const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// ─────────────────────────────────────────────────
// GET /api/referral-programs — List all programs
// ─────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { active } = req.query;

    const programs = await sql`
      SELECT * FROM referral_programs 
      WHERE tenant_id = ${req.user.tenant_id}
      ${active !== undefined ? sql`AND active = ${active === 'true'}` : sql``}
      ORDER BY created_at DESC
    `;

    const parsed = programs.map(p => ({
      referralProgramId: p.referral_program_id,
      tenantId: p.tenant_id,
      name: p.name,
      rewardType: p.reward_type,
      rewardValue: p.reward_value,
      referredDiscountPercent: p.referred_discount_percent,
      minSubscriptionMonths: p.min_subscription_months,
      holdDays: p.hold_days,
      active: !!p.active,
      expiresAt: p.expires_at,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// GET /api/referral-programs/:id — Get single program
// ─────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`SELECT * FROM referral_programs WHERE referral_program_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;

    if (!results.length) {
      return res.status(404).json({ success: false, error: 'Referral program not found.' });
    }

    const p = results[0];
    res.json({
      success: true,
      data: {
        referralProgramId: p.referral_program_id,
        tenantId: p.tenant_id,
        name: p.name,
        rewardType: p.reward_type,
        rewardValue: p.reward_value,
        referredDiscountPercent: p.referred_discount_percent,
        minSubscriptionMonths: p.min_subscription_months,
        holdDays: p.hold_days,
        active: !!p.active,
        expiresAt: p.expires_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// POST /api/referral-programs — Create program
// ─────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      name, rewardType, rewardValue, referredDiscountPercent,
      minSubscriptionMonths, holdDays, expiresAt,
    } = req.body;

    if (!name || !rewardType || rewardValue === undefined) {
      return res.status(400).json({
        success: false,
        error: 'name, rewardType, and rewardValue are required.',
      });
    }

    const sql = getSql();
    const programId = uuidv4();

    await sql`
      INSERT INTO referral_programs (referral_program_id, tenant_id, name, reward_type, reward_value, referred_discount_percent, min_subscription_months, hold_days, expires_at)
      VALUES (${programId}, ${req.user.tenant_id}, ${name}, ${rewardType}, ${rewardValue}, ${referredDiscountPercent || 0}, ${minSubscriptionMonths || 1}, ${holdDays || 14}, ${expiresAt || null})
    `;

    logAudit(req.user.email, 'referral_program.created', programId, `Program "${name}" created`);

    const program = await sql`SELECT * FROM referral_programs WHERE referral_program_id = ${programId}`;
    const p = program[0];

    res.status(201).json({
      success: true,
      data: {
        referralProgramId: p.referral_program_id,
        tenantId: p.tenant_id,
        name: p.name,
        rewardType: p.reward_type,
        rewardValue: p.reward_value,
        referredDiscountPercent: p.referred_discount_percent,
        minSubscriptionMonths: p.min_subscription_months,
        holdDays: p.hold_days,
        active: !!p.active,
        expiresAt: p.expires_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// PUT /api/referral-programs/:id — Update program
// ─────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const existing = await sql`SELECT * FROM referral_programs WHERE referral_program_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;

    if (!existing.length) {
      return res.status(404).json({ success: false, error: 'Referral program not found.' });
    }

    const {
      name, rewardType, rewardValue, referredDiscountPercent,
      minSubscriptionMonths, holdDays, active, expiresAt,
    } = req.body;

    await sql`
      UPDATE referral_programs SET
        name = COALESCE(${name || null}, name),
        reward_type = COALESCE(${rewardType || null}, reward_type),
        reward_value = COALESCE(${rewardValue !== undefined ? rewardValue : null}, reward_value),
        referred_discount_percent = COALESCE(${referredDiscountPercent !== undefined ? referredDiscountPercent : null}, referred_discount_percent),
        min_subscription_months = COALESCE(${minSubscriptionMonths || null}, min_subscription_months),
        hold_days = COALESCE(${holdDays || null}, hold_days),
        active = COALESCE(${active !== undefined ? !!active : null}, active),
        expires_at = COALESCE(${expiresAt || null}, expires_at),
        updated_at = NOW()
      WHERE referral_program_id = ${req.params.id}
    `;

    logAudit(req.user.email, 'referral_program.updated', req.params.id, `Program updated`);

    const updated = await sql`SELECT * FROM referral_programs WHERE referral_program_id = ${req.params.id}`;
    const p = updated[0];

    res.json({
      success: true,
      data: {
        referralProgramId: p.referral_program_id,
        tenantId: p.tenant_id,
        name: p.name,
        rewardType: p.reward_type,
        rewardValue: p.reward_value,
        referredDiscountPercent: p.referred_discount_percent,
        minSubscriptionMonths: p.min_subscription_months,
        holdDays: p.hold_days,
        active: !!p.active,
        expiresAt: p.expires_at,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// DELETE /api/referral-programs/:id — Delete program
// ─────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const existing = await sql`SELECT * FROM referral_programs WHERE referral_program_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;

    if (!existing.length) {
      return res.status(404).json({ success: false, error: 'Program not found.' });
    }

    await sql`DELETE FROM referral_programs WHERE referral_program_id = ${req.params.id}`;

    logAudit(req.user.email, 'referral_program.deleted', req.params.id, `Program "${existing[0].name}" deleted`);

    res.json({ success: true, message: 'Referral program deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
