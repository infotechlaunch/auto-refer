const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');
const router = express.Router();

// GET /api/referral-events
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { referral_id, status, limit } = req.query;

    const events = await sql`
      SELECT * FROM referral_events 
      WHERE 1=1
      ${referral_id ? sql`AND referral_id = ${referral_id}` : sql``}
      ${status ? sql`AND status = ${status}` : sql``}
      ORDER BY event_ts DESC
      ${limit ? sql`LIMIT ${parseInt(limit)}` : sql``}
    `;

    const parsed = events.map(e => ({
      eventId: e.event_id, referralId: e.referral_id,
      referredBusinessId: e.referred_business_id, status: e.status,
      eventTs: e.event_ts, amount: e.amount, fraudScore: e.fraud_score,
      holdUntil: e.hold_until, notes: e.notes,
    }));
    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) { next(err); }
});

// POST /api/referral-events
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { referralId, referredBusinessId, status, amount, fraudScore } = req.body;
    if (!referralId || !referredBusinessId || !status) {
      return res.status(400).json({ success: false, error: 'referralId, referredBusinessId, and status are required.' });
    }
    const sql = getSql();

    // Verify referral link exists and belongs to this tenant
    const links = await sql`
      SELECT rl.*, rp.hold_days, rp.reward_value, rp.reward_type
      FROM referral_links rl
      JOIN referral_programs rp ON rl.referral_program_id = rp.referral_program_id
      WHERE rl.referral_id = ${referralId} AND rl.tenant_id = ${req.user.tenant_id}
    `;
    if (!links.length) return res.status(404).json({ success: false, error: 'Referral link not found.' });

    const link = links[0];
    const eventId = uuidv4();

    // Calculate hold_until for 'paid' events
    let holdUntil = null;
    if (status === 'paid') {
      const holdDays = link.hold_days || 14;
      holdUntil = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);
    }

    await sql`
      INSERT INTO referral_events
        (event_id, referral_id, referred_business_id, status, amount, fraud_score, hold_until)
      VALUES
        (${eventId}, ${referralId}, ${referredBusinessId}, ${status},
         ${amount || 0}, ${fraudScore || 0}, ${holdUntil})
    `;

    // Update referral link usage count
    if (status === 'clicked' || status === 'signed_up') {
      await sql`UPDATE referral_links SET usage_count = usage_count + 1 WHERE referral_id = ${referralId}`;
    }

    // Update dashboard stats
    if (status === 'clicked')          await sql`UPDATE dashboard_stats SET total_referral_clicks = total_referral_clicks + 1, updated_at = NOW() WHERE id = 1`;
    if (status === 'signed_up')        await sql`UPDATE dashboard_stats SET total_signups = total_signups + 1, updated_at = NOW() WHERE id = 1`;
    if (status === 'paid')             await sql`UPDATE dashboard_stats SET total_paid = total_paid + 1, updated_at = NOW() WHERE id = 1`;
    if (status === 'reward_released')  await sql`UPDATE dashboard_stats SET total_reward_released = total_reward_released + 1, updated_at = NOW() WHERE id = 1`;
    if (status === 'fraud_flagged')    await sql`UPDATE dashboard_stats SET total_fraud_flagged = total_fraud_flagged + 1, updated_at = NOW() WHERE id = 1`;

    // Create reward record for 'paid' events (Step 8 — pending reward)
    if (status === 'paid') {
      const rewardId  = uuidv4();
      const rewardAmt = amount || link.reward_value || 0;
      await sql`
        INSERT INTO referral_rewards
          (reward_id, tenant_id, referral_id, referral_event_id,
           referrer_user_id, referred_business_id, amount, status, hold_until)
        VALUES
          (${rewardId}, ${req.user.tenant_id}, ${referralId}, ${eventId},
           ${link.referrer_user_id}, ${referredBusinessId}, ${rewardAmt}, 'pending', ${holdUntil})
        ON CONFLICT (referral_event_id) DO NOTHING
      `;
      // Add to wallet pending balance
      await sql`
        UPDATE referral_wallets
        SET balance_pending = balance_pending + ${rewardAmt}, last_adjusted_at = NOW()
        WHERE owner_id = ${link.referrer_user_id} AND tenant_id = ${req.user.tenant_id}
      `;
    }

    logAudit(req.user.email, `referral_event.${status}`, eventId, `Event for referral ${referralId}`);
    res.status(201).json({ success: true, data: { eventId, referralId, status, amount: amount || 0, holdUntil } });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/referral-events/process-reward
//
// STEP 8 — Viral Growth Engine: Reward Release Logic
//   Hard Rules:
//     1. Referral must be in 'paid' status
//     2. Refund/hold window must have passed (hold_until < NOW())
//     3. No 'reversed' event exists for this referred_business_id
//     4. Idempotent — calling twice is safe
// ─────────────────────────────────────────────────────────────────
router.post('/process-reward', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ success: false, error: 'eventId is required.' });

    const sql = getSql();

    // Load the event
    const events = await sql`
      SELECT re.*, rl.referrer_user_id, rl.referral_program_id,
             rp.hold_days, rp.reward_value, rp.reward_type
      FROM   referral_events re
      JOIN   referral_links rl   ON re.referral_id = rl.referral_id
      JOIN   referral_programs rp ON rl.referral_program_id = rp.referral_program_id
      WHERE  re.event_id = ${eventId}
    `;

    if (!events.length) return res.status(404).json({ success: false, error: 'Event not found.' });
    const event = events[0];

    // Rule 1: Must be 'paid'
    if (event.status !== 'paid') {
      return res.status(409).json({
        success: false,
        error: `Cannot process reward: event status is "${event.status}". Must be "paid".`,
      });
    }

    // Rule 2: Hold window must have passed
    if (event.hold_until && new Date(event.hold_until) > new Date()) {
      return res.status(409).json({
        success: false,
        error: `Reward still in hold period. Eligible after ${event.hold_until}.`,
        holdUntil: event.hold_until,
      });
    }

    // Rule 3: No reversal event for this referred business
    const reversals = await sql`
      SELECT event_id FROM referral_events
      WHERE referral_id          = ${event.referral_id}
        AND referred_business_id = ${event.referred_business_id}
        AND status               = 'reversed'
    `;
    if (reversals.length) {
      // Mark reward as reversed and abort
      await sql`
        UPDATE referral_events SET status = 'reversed' WHERE event_id = ${eventId}
      `;
      await sql`
        UPDATE referral_rewards SET status = 'reversed', updated_at = NOW()
        WHERE referral_event_id = ${eventId}
      `;
      logAudit(req.user.email, 'referral_reward.reversed', eventId, 'Reversed due to cancellation.');
      return res.status(409).json({ success: false, error: 'Referral was reversed/cancelled. No reward released.' });
    }

    // Rule 4: Idempotency — check if reward already released
    const rewards = await sql`
      SELECT * FROM referral_rewards WHERE referral_event_id = ${eventId}
    `;
    if (rewards.length && rewards[0].status === 'released') {
      return res.json({ success: true, message: 'Reward already released (idempotent).', data: { rewardId: rewards[0].reward_id } });
    }

    const rewardAmt  = rewards.length ? rewards[0].amount : (event.amount || event.reward_value || 0);
    const referrerUserId = event.referrer_user_id;

    // ── Release reward ──────────────────────────────────────────
    // Update event status
    await sql`
      UPDATE referral_events
      SET status = 'reward_released'
      WHERE event_id = ${eventId}
    `;

    // Update reward record
    if (rewards.length) {
      await sql`
        UPDATE referral_rewards
        SET status = 'released', released_at = NOW(), cleared_at = COALESCE(cleared_at, NOW()), updated_at = NOW()
        WHERE referral_event_id = ${eventId}
      `;
    } else {
      // Create reward record if it doesn't exist yet
      const rewardId = uuidv4();
      await sql`
        INSERT INTO referral_rewards
          (reward_id, tenant_id, referral_id, referral_event_id,
           referrer_user_id, referred_business_id, amount, status, released_at, cleared_at)
        VALUES
          (${rewardId}, ${req.user.tenant_id}, ${event.referral_id}, ${eventId},
           ${referrerUserId}, ${event.referred_business_id}, ${rewardAmt},
           'released', NOW(), NOW())
      `;
    }

    // Move wallet balance: pending → available
    await sql`
      UPDATE referral_wallets
      SET balance_pending   = GREATEST(0, balance_pending - ${rewardAmt}),
          balance_available = balance_available + ${rewardAmt},
          last_adjusted_at  = NOW()
      WHERE owner_id  = ${referrerUserId}
        AND tenant_id = ${req.user.tenant_id}
    `;

    // Update dashboard stats
    await sql`
      UPDATE dashboard_stats
      SET total_reward_released = total_reward_released + 1, updated_at = NOW()
      WHERE id = 1
    `;

    logAudit(
      req.user.email,
      'referral_reward.released',
      eventId,
      `Reward $${rewardAmt} released to ${referrerUserId} for referral ${event.referral_id}`
    );

    res.json({
      success: true,
      data: {
        eventId,
        referrerId: referrerUserId,
        amountReleased: rewardAmt,
        newStatus: 'reward_released',
      },
    });
  } catch (err) { next(err); }
});

// GET /api/referral-events/rewards — List all reward records
router.get('/rewards', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { status, referral_id } = req.query;

    const rewards = await sql`
      SELECT rr.*, rl.code AS referral_code, u.name AS referrer_name
      FROM   referral_rewards rr
      JOIN   referral_links rl ON rr.referral_id = rl.referral_id
      LEFT JOIN users u ON rr.referrer_user_id = u.id
      WHERE  rr.tenant_id = ${req.user.tenant_id}
      ${status ? sql`AND rr.status = ${status}` : sql``}
      ${referral_id ? sql`AND rr.referral_id = ${referral_id}` : sql``}
      ORDER BY rr.created_at DESC
    `;

    const parsed = rewards.map(r => ({
      rewardId:          r.reward_id,
      referralId:        r.referral_id,
      referralCode:      r.referral_code,
      referralEventId:   r.referral_event_id,
      referrerUserId:    r.referrer_user_id,
      referrerName:      r.referrer_name,
      referredBusinessId: r.referred_business_id,
      amount:            r.amount,
      status:            r.status,
      holdUntil:         r.hold_until,
      clearedAt:         r.cleared_at,
      releasedAt:        r.released_at,
      paidAt:            r.paid_at,
      notes:             r.notes,
      createdAt:         r.created_at,
    }));

    res.json({ success: true, data: parsed, count: parsed.length });
  } catch (err) { next(err); }
});

module.exports = router;

