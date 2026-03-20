const express = require('express');
const { getSql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/dashboard — Get dashboard stats + chart data
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { tenant_id } = req.user;

    // Run all data fetching in parallel
    const [
      [campaignStats],
      [reviewStats],
      [scanStats],
      [intentStats],
      [fraudAlertsCount],
      [voiceStats],
      [incentiveStats],
      [earningStats],
      [rewardStats],
      scanChartData,
      referralChartData,
      recentEvents,
      recentVoiceEvents,
      pendingRewards,
      fraudAlerts
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM campaigns WHERE tenant_id = ${tenant_id}`,
      sql`SELECT COUNT(*)::int AS count FROM review_intents WHERE tenant_id = ${tenant_id} AND thank_status = 'completed'`,
      sql`SELECT COALESCE(SUM(scan_count), 0)::int AS scans FROM qr_codes q JOIN campaigns c ON q.campaign_id = c.campaign_id WHERE c.tenant_id = ${tenant_id}`,
      sql`SELECT COUNT(*)::int AS intents FROM review_intents WHERE tenant_id = ${tenant_id}`,
      sql`SELECT COUNT(*)::int AS count FROM fraud_signals WHERE tenant_id = ${tenant_id} AND resolved = false`,
      sql`
        SELECT
          COUNT(*)                                  AS total_calls,
          COUNT(*) FILTER (WHERE played = true)     AS played,
          COUNT(*) FILTER (WHERE played = false)    AS skipped
        FROM voice_thank_events
        WHERE tenant_id = ${tenant_id}
      `,
      sql`
        SELECT
          COUNT(*)                                              AS total,
          COUNT(*) FILTER (WHERE status = 'pending')            AS pending,
          COUNT(*) FILTER (WHERE status = 'sent')               AS sent,
          COUNT(*) FILTER (WHERE status = 'redeemed')           AS redeemed
        FROM incentives
        WHERE tenant_id = ${tenant_id}
      `,
      sql`
        SELECT
          COALESCE(SUM(balance_pending),   0)::float AS pending,
          COALESCE(SUM(balance_available), 0)::float AS available,
          COALESCE(SUM(balance_paid),      0)::float AS paid
        FROM referral_wallets WHERE tenant_id = ${tenant_id}
      `,
      sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
          COUNT(*) FILTER (WHERE status = 'released') AS released,
          COUNT(*) FILTER (WHERE status = 'reversed') AS reversed
        FROM referral_rewards WHERE tenant_id = ${tenant_id}
      `,
      sql`
        SELECT date, scans, intents, thanked FROM scan_chart_data 
        WHERE tenant_id = ${tenant_id}
        ORDER BY id DESC LIMIT 7
      `,
      sql`
        SELECT date, clicks, signups, paid, released FROM referral_chart_data
        WHERE tenant_id = ${tenant_id}
        ORDER BY id DESC LIMIT 7
      `,
      sql`
        SELECT re.event_id, re.referral_id, re.referred_business_id, re.status, re.event_ts, re.amount 
        FROM referral_events re
        WHERE re.referral_id IN (
          SELECT rl.referral_id FROM referral_links rl WHERE rl.tenant_id = ${tenant_id}
        )
        ORDER BY re.event_ts DESC LIMIT 5
      `,
      sql`
        SELECT vt.event_id, vt.played, vt.skip_reason, vt.script_variant, vt.call_ts,
               c.name AS campaign_name
        FROM   voice_thank_events vt
        LEFT JOIN campaigns c ON vt.campaign_id = c.campaign_id
        WHERE  vt.tenant_id = ${tenant_id}
        ORDER BY vt.call_ts DESC LIMIT 5
      `,
      sql`
        SELECT rr.reward_id, rr.amount, rr.hold_until, rr.created_at,
               rl.code AS referral_code, u.name AS referrer_name
        FROM   referral_rewards rr
        JOIN   referral_links rl ON rr.referral_id = rl.referral_id
        LEFT JOIN users u ON rr.referrer_user_id = u.id
        WHERE  rr.tenant_id = ${tenant_id} AND rr.status = 'pending'
        ORDER BY rr.hold_until ASC NULLS FIRST
        LIMIT 5
      `,
      sql`
        SELECT signal_id, referred_business_id, referral_id, referrer_name, referred_name,
               total_score, flags, decision, resolved, created_at
        FROM fraud_signals 
        WHERE tenant_id = ${tenant_id} AND resolved = false 
        ORDER BY total_score DESC LIMIT 5
      `
    ]);

    const dashStats = {
      totalCampaigns:    campaignStats.count,
      totalScans:        scanStats.scans,
      totalReviewIntents: intentStats.intents,
      completedThankYous: reviewStats.count,
      // Step 6
      totalCallEvents:   Number(voiceStats.total_calls),
      voiceThankYous:    Number(voiceStats.played),
      voiceSkipped:      Number(voiceStats.skipped),
      // Step 7
      incentivesTotal:   Number(incentiveStats.total),
      incentivesPending: Number(incentiveStats.pending),
      incentivesSent:    Number(incentiveStats.sent),
      incentivesRedeemed: Number(incentiveStats.redeemed),
      // Step 8
      walletPending:     earningStats.pending,
      walletAvailable:   earningStats.available,
      walletPaid:        earningStats.paid,
      referralEarnings:  earningStats.available + earningStats.paid,
      rewardsPending:    Number(rewardStats.pending),
      rewardsReleased:   Number(rewardStats.released),
      // Existing
      totalFraudFlagged: fraudAlertsCount.count,
    };
    
    res.json({
      success: true,
      data: {
        stats: dashStats,
        scanChartData: scanChartData.reverse(),
        referralChartData: referralChartData.reverse(),
        recentEvents: recentEvents.map(e => ({
          eventId: e.event_id, referralId: e.referral_id,
          referredBusinessId: e.referred_business_id, status: e.status,
          eventTs: e.event_ts, amount: e.amount,
        })),
        recentVoiceEvents: recentVoiceEvents.map(v => ({
          eventId:      v.event_id,
          played:       !!v.played,
          skipReason:   v.skip_reason,
          scriptVariant: v.script_variant,
          callTs:       v.call_ts,
          campaignName: v.campaign_name,
        })),
        pendingRewards: pendingRewards.map(r => ({
          rewardId:    r.reward_id,
          amount:      r.amount,
          holdUntil:   r.hold_until,
          createdAt:   r.created_at,
          referralCode: r.referral_code,
          referrerName: r.referrer_name,
        })),
        fraudAlerts: fraudAlerts.map(s => ({
          signalId: s.signal_id, referredBusinessId: s.referred_business_id,
          referralId: s.referral_id, referrerName: s.referrer_name,
          referredName: s.referred_name, totalScore: s.total_score,
          flags: JSON.parse(s.flags || '[]'), decision: s.decision,
          resolved: !!s.resolved, createdAt: s.created_at,
        })),
      },
    });
  } catch (err) { next(err); }
});

module.exports = router;
