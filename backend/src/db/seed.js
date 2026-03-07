const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getSql } = require('./init');

async function seedDatabase() {
  const sql = getSql();

  // Check if we already have seed data
  const userCountResult = await sql`SELECT COUNT(*) as count FROM users`;
  if (parseInt(userCountResult[0].count) > 0) {
    console.log('ℹ️  Database already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding database...');

  // ═══════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════
  const hashedPassword = bcrypt.hashSync('password123', 10);

  await sql`INSERT INTO users (id, name, email, password, role, tenant_id, business_id) VALUES (${uuidv4()}, 'Admin User', 'admin@itl.com', ${hashedPassword}, 'admin', 't_itl_001', NULL)`;
  await sql`INSERT INTO users (id, name, email, password, role, tenant_id, business_id) VALUES (${uuidv4()}, 'Demo User', 'user@demo.com', ${hashedPassword}, 'user', 't_itl_001', 'b_marios')`;
  await sql`INSERT INTO users (id, name, email, password, role, tenant_id, business_id) VALUES (${uuidv4()}, 'Mario Owner', 'mario@kitchen.com', ${hashedPassword}, 'user', 't_itl_001', 'b_marios')`;
  await sql`INSERT INTO users (id, name, email, password, role, tenant_id, business_id) VALUES (${uuidv4()}, 'Super Admin', 'super@itl.com', ${hashedPassword}, 'super_admin', 't_itl_001', NULL)`;

  // ═══════════════════════════════════════════════
  // CAMPAIGNS
  // ═══════════════════════════════════════════════
  const rushHours1 = JSON.stringify({ lunch: ['11:30', '14:30'], dinner: ['17:30', '21:00'] });
  const rushHours2 = JSON.stringify({ dinner: ['18:00', '22:00'] });
  const rushHours3 = JSON.stringify({ lunch: ['11:00', '14:00'] });

  await sql`INSERT INTO campaigns (campaign_id, tenant_id, business_id, location_id, name, place_id, google_review_url, timezone, rush_hours, thank_window_hours, enable_voice_linkage, enable_influencer_capture, enable_incentives, enable_referrals, created_at, updated_at) VALUES ('c1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c', 't_itl_001', 'b_marios', 'loc_main', ${"Mario's Italian Kitchen — Main St"}, 'ChIJa1b2c3d4e5f6', 'https://g.page/r/marios-kitchen/review', 'America/New_York', ${rushHours1}, 24, true, true, true, true, '2026-01-15T10:00:00Z', '2026-02-10T14:30:00Z')`;

  await sql`INSERT INTO campaigns (campaign_id, tenant_id, business_id, location_id, name, place_id, google_review_url, timezone, rush_hours, thank_window_hours, enable_voice_linkage, enable_influencer_capture, enable_incentives, enable_referrals, created_at, updated_at) VALUES ('d2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d', 't_itl_001', 'b_sakura', 'loc_downtown', 'Sakura Sushi Bar — Downtown', 'ChIJx9y8z7w6v5u4', 'https://g.page/r/sakura-sushi/review', 'America/Los_Angeles', ${rushHours2}, 48, true, false, false, true, '2026-01-20T08:00:00Z', '2026-02-12T09:00:00Z')`;

  await sql`INSERT INTO campaigns (campaign_id, tenant_id, business_id, location_id, name, place_id, google_review_url, timezone, rush_hours, thank_window_hours, enable_voice_linkage, enable_influencer_capture, enable_incentives, enable_referrals, created_at, updated_at) VALUES ('e3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e', 't_itl_001', 'b_burgertown', 'loc_mall', 'BurgerTown Express — Mall Location', 'ChIJ12345abcde', 'https://g.page/r/burgertown/review', 'America/Chicago', ${rushHours3}, 24, true, false, true, false, '2026-02-01T12:00:00Z', '2026-02-14T16:00:00Z')`;

  // ═══════════════════════════════════════════════
  // QR CODES
  // ═══════════════════════════════════════════════
  await sql`INSERT INTO qr_codes (qr_code_id, campaign_id, short_code, short_url, active, scan_count, created_at) VALUES ('q1-uuid', 'c1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c', 'MaR10s', 'https://itl.ink/r/MaR10s', true, 423, '2026-01-15T10:05:00Z')`;
  await sql`INSERT INTO qr_codes (qr_code_id, campaign_id, short_code, short_url, active, scan_count, created_at) VALUES ('q2-uuid', 'd2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d', 'SaKuRa', 'https://itl.ink/r/SaKuRa', true, 289, '2026-01-20T08:10:00Z')`;
  await sql`INSERT INTO qr_codes (qr_code_id, campaign_id, short_code, short_url, active, scan_count, created_at) VALUES ('q3-uuid', 'e3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e', 'BuRgR1', 'https://itl.ink/r/BuRgR1', false, 135, '2026-02-01T12:05:00Z')`;

  // ═══════════════════════════════════════════════
  // REVIEW INTENTS
  // ═══════════════════════════════════════════════
  await sql`INSERT INTO review_intents (review_intent_id, tenant_id, business_id, campaign_id, customer_identity_ref, scan_ts, expires_at, thank_status, thank_channel, confidence, instagram_handle, incentive_type, incentive_value, incentive_status) VALUES ('ri-001', 't_itl_001', 'b_marios', 'c1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c', 'tok_abc123', '2026-02-16T12:30:00Z', '2026-02-17T12:30:00Z', 'completed', 'voice_inbound', 'explicit', '@foodie_maria', 'percent', '10', 'delivered')`;
  await sql`INSERT INTO review_intents (review_intent_id, tenant_id, business_id, campaign_id, customer_identity_ref, scan_ts, expires_at, thank_status, thank_channel, confidence, instagram_handle) VALUES ('ri-002', 't_itl_001', 'b_marios', 'c1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c', 'tok_def456', '2026-02-16T18:45:00Z', '2026-02-17T18:45:00Z', 'pending', 'none', 'explicit', NULL)`;
  await sql`INSERT INTO review_intents (review_intent_id, tenant_id, business_id, campaign_id, scan_ts, expires_at, thank_status, thank_channel, confidence) VALUES ('ri-003', 't_itl_001', 'b_sakura', 'd2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d', '2026-02-15T20:00:00Z', '2026-02-17T20:00:00Z', 'expired', 'none', 'none')`;

  // ═══════════════════════════════════════════════
  // REFERRAL PROGRAMS
  // ═══════════════════════════════════════════════
  await sql`INSERT INTO referral_programs (referral_program_id, tenant_id, name, reward_type, reward_value, referred_discount_percent, min_subscription_months, hold_days, active, expires_at, created_at) VALUES ('rp-001', 't_itl_001', 'Restaurant Growth Program', 'cash', 50.0, 20.0, 1, 14, true, NULL, '2026-01-01T00:00:00Z')`;
  await sql`INSERT INTO referral_programs (referral_program_id, tenant_id, name, reward_type, reward_value, referred_discount_percent, min_subscription_months, hold_days, active, expires_at, created_at) VALUES ('rp-002', 't_itl_001', 'Agency Partner Program', 'percent', 15.0, 10.0, 3, 30, true, '2026-12-31T23:59:59Z', '2026-01-10T00:00:00Z')`;
  await sql`INSERT INTO referral_programs (referral_program_id, tenant_id, name, reward_type, reward_value, referred_discount_percent, min_subscription_months, hold_days, active, expires_at, created_at) VALUES ('rp-003', 't_itl_001', 'Summer Blitz Referral', 'credit', 100.0, 25.0, 1, 7, false, '2026-08-31T23:59:59Z', '2026-05-01T00:00:00Z')`;

  // ═══════════════════════════════════════════════
  // REFERRAL LINKS
  // ═══════════════════════════════════════════════
  await sql`INSERT INTO referral_links (referral_id, tenant_id, referral_program_id, referrer_type, referrer_user_id, code, share_url, status, max_uses, usage_count, expires_at, created_at) VALUES ('rl-001', 't_itl_001', 'rp-001', 'business', 'u_marios_owner', 'MARIO50', 'https://itl.ink/ref/MARIO50', 'active', 0, 12, NULL, '2026-01-20T00:00:00Z')`;
  await sql`INSERT INTO referral_links (referral_id, tenant_id, referral_program_id, referrer_type, referrer_user_id, code, share_url, status, max_uses, usage_count, expires_at, created_at) VALUES ('rl-002', 't_itl_001', 'rp-002', 'agency', 'u_digitalagency', 'DIGI15', 'https://itl.ink/ref/DIGI15', 'active', 100, 34, '2026-12-31T23:59:59Z', '2026-01-25T00:00:00Z')`;
  await sql`INSERT INTO referral_links (referral_id, tenant_id, referral_program_id, referrer_type, referrer_user_id, code, share_url, status, max_uses, usage_count, expires_at, created_at) VALUES ('rl-003', 't_itl_001', 'rp-001', 'influencer', 'u_foodie_ig', 'FOODIE', 'https://itl.ink/ref/FOODIE', 'disabled', 50, 48, NULL, '2026-02-01T00:00:00Z')`;

  // ═══════════════════════════════════════════════
  // REFERRAL EVENTS
  // ═══════════════════════════════════════════════
  await sql`INSERT INTO referral_events (event_id, referral_id, referred_business_id, status, event_ts, amount, fraud_score) VALUES ('re-001', 'rl-001', 'b_newpizza', 'reward_released', '2026-02-14T10:00:00Z', 50.00, 0)`;
  await sql`INSERT INTO referral_events (event_id, referral_id, referred_business_id, status, event_ts, amount, fraud_score) VALUES ('re-002', 'rl-001', 'b_tacoking', 'cleared', '2026-02-12T08:00:00Z', 50.00, 5)`;
  await sql`INSERT INTO referral_events (event_id, referral_id, referred_business_id, status, event_ts, amount, fraud_score) VALUES ('re-003', 'rl-001', 'b_wokstar', 'paid', '2026-02-15T14:00:00Z', 50.00, 0)`;
  await sql`INSERT INTO referral_events (event_id, referral_id, referred_business_id, status, event_ts, amount, fraud_score) VALUES ('re-004', 'rl-002', 'b_coffeelab', 'signed_up', '2026-02-16T09:00:00Z', 0, 0)`;
  await sql`INSERT INTO referral_events (event_id, referral_id, referred_business_id, status, event_ts, amount, fraud_score) VALUES ('re-005', 'rl-001', 'b_suspicious', 'fraud_flagged', '2026-02-13T11:00:00Z', 50.00, 92)`;
  await sql`INSERT INTO referral_events (event_id, referral_id, referred_business_id, status, event_ts, amount, fraud_score) VALUES ('re-006', 'rl-002', 'b_refunded', 'reversed', '2026-02-11T16:00:00Z', 75.00, 0)`;
  await sql`INSERT INTO referral_events (event_id, referral_id, referred_business_id, status, event_ts, amount, fraud_score) VALUES ('re-007', 'rl-001', 'b_deli', 'clicked', '2026-02-16T17:30:00Z', 0, 0)`;

  // ═══════════════════════════════════════════════
  // REFERRAL WALLETS
  // ═══════════════════════════════════════════════
  await sql`INSERT INTO referral_wallets (wallet_id, tenant_id, owner_id, owner_name, balance_pending, balance_available, balance_paid, frozen, last_adjusted_at) VALUES ('w-001', 't_itl_001', 'u_marios_owner', ${"Mario's Italian Kitchen"}, 100.00, 250.00, 450.00, false, '2026-02-14T10:00:00Z')`;
  await sql`INSERT INTO referral_wallets (wallet_id, tenant_id, owner_id, owner_name, balance_pending, balance_available, balance_paid, frozen, last_adjusted_at) VALUES ('w-002', 't_itl_001', 'u_digitalagency', 'Digital Growth Agency', 300.00, 150.00, 1200.00, false, '2026-02-15T08:00:00Z')`;
  await sql`INSERT INTO referral_wallets (wallet_id, tenant_id, owner_id, owner_name, balance_pending, balance_available, balance_paid, frozen, last_adjusted_at) VALUES ('w-003', 't_itl_001', 'u_foodie_ig', '@FoodieInfluencer', 0, 0, 200.00, true, '2026-02-10T12:00:00Z')`;

  // ═══════════════════════════════════════════════
  // PAYOUT REQUESTS
  // ═══════════════════════════════════════════════
  await sql`INSERT INTO payout_requests (payout_request_id, owner_id, owner_name, amount, method, status, created_at) VALUES ('pr-001', 'u_marios_owner', ${"Mario's Kitchen"}, 200.00, 'stripe_connect', 'approved', '2026-02-13T10:00:00Z')`;
  await sql`INSERT INTO payout_requests (payout_request_id, owner_id, owner_name, amount, method, status, created_at) VALUES ('pr-002', 'u_digitalagency', 'Digital Agency', 150.00, 'ach', 'requested', '2026-02-15T14:00:00Z')`;
  await sql`INSERT INTO payout_requests (payout_request_id, owner_id, owner_name, amount, method, status, created_at) VALUES ('pr-003', 'u_marios_owner', ${"Mario's Kitchen"}, 100.00, 'manual', 'paid', '2026-02-10T09:00:00Z')`;
  await sql`INSERT INTO payout_requests (payout_request_id, owner_id, owner_name, amount, method, status, created_at) VALUES ('pr-004', 'u_foodie_ig', '@FoodieIG', 50.00, 'stripe_connect', 'rejected', '2026-02-12T11:00:00Z')`;

  // ═══════════════════════════════════════════════
  // FRAUD SIGNALS
  // ═══════════════════════════════════════════════
  const fraudFlags1 = JSON.stringify([
    { type: 'self_referral', weight: 80, detail: 'Same owner email hash' },
    { type: 'ip_match', weight: 30, detail: 'Click and signup from same IP' },
  ]);
  const fraudFlags2 = JSON.stringify([
    { type: 'velocity_ip_24h', weight: 40, detail: 'count=6' },
    { type: 'disposable_email', weight: 20, detail: 'mailinator.com' },
  ]);
  const fraudFlags3 = JSON.stringify([
    { type: 'ip_match', weight: 15, detail: 'Adjacent IP range' },
  ]);

  await sql`INSERT INTO fraud_signals (signal_id, tenant_id, referred_business_id, referral_id, referrer_name, referred_name, total_score, flags, decision, resolved, created_at) VALUES ('fs-001', 't_itl_001', 'b_suspicious', 'rl-001', ${"Mario's Kitchen"}, 'Suspicious Pizza Co.', 92, ${fraudFlags1}, 'block_freeze', false, '2026-02-13T11:00:00Z')`;
  await sql`INSERT INTO fraud_signals (signal_id, tenant_id, referred_business_id, referral_id, referrer_name, referred_name, total_score, flags, decision, resolved, created_at) VALUES ('fs-002', 't_itl_001', 'b_maybe_ok', 'rl-002', 'Digital Agency', 'Maybe OK Cafe', 55, ${fraudFlags2}, 'hold_review', false, '2026-02-14T15:00:00Z')`;
  await sql`INSERT INTO fraud_signals (signal_id, tenant_id, referred_business_id, referral_id, referrer_name, referred_name, total_score, flags, decision, resolved, created_at) VALUES ('fs-003', 't_itl_001', 'b_cleared', 'rl-001', ${"Mario's Kitchen"}, 'All Good BBQ', 15, ${fraudFlags3}, 'allow', true, '2026-02-12T08:00:00Z')`;

  // ═══════════════════════════════════════════════
  // AUDIT LOGS
  // ═══════════════════════════════════════════════
  await sql`INSERT INTO audit_logs (id, actor, action, target, detail, ts) VALUES ('al-001', 'admin@itl.com', 'referral_program.updated', 'rp-001', 'Changed reward_value from 25 to 50', '2026-02-15T10:30:00Z')`;
  await sql`INSERT INTO audit_logs (id, actor, action, target, detail, ts) VALUES ('al-002', 'admin@itl.com', 'wallet.frozen', 'w-003', 'Frozen due to fraud investigation', '2026-02-14T09:00:00Z')`;
  await sql`INSERT INTO audit_logs (id, actor, action, target, detail, ts) VALUES ('al-003', 'admin@itl.com', 'payout.approved', 'pr-001', 'Manual payout approval for $200', '2026-02-13T11:00:00Z')`;
  await sql`INSERT INTO audit_logs (id, actor, action, target, detail, ts) VALUES ('al-004', 'system', 'referral.reward_released', 're-001', 'Auto-released after hold period', '2026-02-14T10:00:00Z')`;
  await sql`INSERT INTO audit_logs (id, actor, action, target, detail, ts) VALUES ('al-005', 'system', 'fraud.detected', 'fs-001', 'Score 92 — auto-frozen', '2026-02-13T11:00:00Z')`;
  await sql`INSERT INTO audit_logs (id, actor, action, target, detail, ts) VALUES ('al-006', 'admin@itl.com', 'campaign.created', 'c1a2b3c4', ${"Mario's Italian Kitchen campaign"}, '2026-01-15T10:00:00Z')`;

  // ═══════════════════════════════════════════════
  // DASHBOARD STATS
  // ═══════════════════════════════════════════════
  await sql`INSERT INTO dashboard_stats (id, total_campaigns, active_qr_codes, total_scans, total_review_intents, completed_thank_yous, pending_intents, total_referral_clicks, total_signups, total_paid, total_reward_released, total_fraud_flagged, wallet_total_pending, wallet_total_available, wallet_total_paid) VALUES (1, 3, 2, 847, 312, 189, 42, 1240, 87, 52, 38, 4, 400.00, 400.00, 1850.00)`;

  // ═══════════════════════════════════════════════
  // CHART DATA
  // ═══════════════════════════════════════════════
  const scanData = [
    ['Feb 10', 45, 28, 18], ['Feb 11', 52, 34, 22], ['Feb 12', 38, 25, 15],
    ['Feb 13', 67, 42, 28], ['Feb 14', 89, 58, 40], ['Feb 15', 73, 48, 32],
    ['Feb 16', 95, 62, 34],
  ];
  for (const d of scanData) {
    await sql`INSERT INTO scan_chart_data (tenant_id, date, scans, intents, thanked) VALUES ('t_itl_001', ${d[0]}, ${d[1]}, ${d[2]}, ${d[3]})`;
  }

  const refData = [
    ['Feb 10', 120, 8, 4, 2], ['Feb 11', 145, 12, 6, 4], ['Feb 12', 98, 7, 5, 3],
    ['Feb 13', 167, 14, 8, 5], ['Feb 14', 203, 18, 10, 7], ['Feb 15', 178, 15, 9, 6],
    ['Feb 16', 220, 13, 10, 11],
  ];
  for (const d of refData) {
    await sql`INSERT INTO referral_chart_data (tenant_id, date, clicks, signups, paid, released) VALUES ('t_itl_001', ${d[0]}, ${d[1]}, ${d[2]}, ${d[3]}, ${d[4]})`;
  }

  console.log('✅ Database seeded with sample data');
}

module.exports = { seedDatabase };
