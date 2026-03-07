/**
 * Mock data for development — matches the master spec data models exactly.
 * All IDs use UUID-like format for realism.
 */

// ─── Campaigns ───
export const mockCampaigns = [
  {
    campaignId: 'c1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
    tenantId: 't_itl_001',
    businessId: 'b_marios',
    locationId: 'loc_main',
    name: "Mario's Italian Kitchen — Main St",
    placeId: 'ChIJa1b2c3d4e5f6',
    googleReviewUrl: 'https://g.page/r/marios-kitchen/review',
    timezone: 'America/New_York',
    rushHours: { lunch: ['11:30', '14:30'], dinner: ['17:30', '21:00'] },
    thankWindowHours: 24,
    enableVoiceLinkage: true,
    enableInfluencerCapture: true,
    enableIncentives: true,
    enableReferrals: true,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-02-10T14:30:00Z',
  },
  {
    campaignId: 'd2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
    tenantId: 't_itl_001',
    businessId: 'b_sakura',
    locationId: 'loc_downtown',
    name: 'Sakura Sushi Bar — Downtown',
    placeId: 'ChIJx9y8z7w6v5u4',
    googleReviewUrl: 'https://g.page/r/sakura-sushi/review',
    timezone: 'America/Los_Angeles',
    rushHours: { dinner: ['18:00', '22:00'] },
    thankWindowHours: 48,
    enableVoiceLinkage: true,
    enableInfluencerCapture: false,
    enableIncentives: false,
    enableReferrals: true,
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-02-12T09:00:00Z',
  },
  {
    campaignId: 'e3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e',
    tenantId: 't_itl_001',
    businessId: 'b_burgertown',
    locationId: 'loc_mall',
    name: 'BurgerTown Express — Mall Location',
    placeId: 'ChIJ12345abcde',
    googleReviewUrl: 'https://g.page/r/burgertown/review',
    timezone: 'America/Chicago',
    rushHours: { lunch: ['11:00', '14:00'] },
    thankWindowHours: 24,
    enableVoiceLinkage: true,
    enableInfluencerCapture: false,
    enableIncentives: true,
    enableReferrals: false,
    createdAt: '2026-02-01T12:00:00Z',
    updatedAt: '2026-02-14T16:00:00Z',
  },
];

// ─── QR Codes ───
export const mockQrCodes = [
  {
    qrCodeId: 'q1-uuid',
    campaignId: 'c1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
    shortCode: 'MaR10s',
    shortUrl: 'https://itl.ink/r/MaR10s',
    active: true,
    createdAt: '2026-01-15T10:05:00Z',
  },
  {
    qrCodeId: 'q2-uuid',
    campaignId: 'd2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
    shortCode: 'SaKuRa',
    shortUrl: 'https://itl.ink/r/SaKuRa',
    active: true,
    createdAt: '2026-01-20T08:10:00Z',
  },
  {
    qrCodeId: 'q3-uuid',
    campaignId: 'e3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e',
    shortCode: 'BuRgR1',
    shortUrl: 'https://itl.ink/r/BuRgR1',
    active: false,
    createdAt: '2026-02-01T12:05:00Z',
  },
];

// ─── Review Intents ───
export const mockReviewIntents = [
  {
    reviewIntentId: 'ri-001',
    tenantId: 't_itl_001',
    businessId: 'b_marios',
    campaignId: 'c1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
    customerIdentityRef: 'tok_abc123',
    scanTs: '2026-02-16T12:30:00Z',
    expiresAt: '2026-02-17T12:30:00Z',
    thankStatus: 'completed',
    thankChannel: 'voice_inbound',
    confidence: 'explicit',
    instagramHandle: '@foodie_maria',
    incentiveType: 'percent',
    incentiveValue: '10',
    incentiveStatus: 'delivered',
  },
  {
    reviewIntentId: 'ri-002',
    tenantId: 't_itl_001',
    businessId: 'b_marios',
    campaignId: 'c1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
    customerIdentityRef: 'tok_def456',
    scanTs: '2026-02-16T18:45:00Z',
    expiresAt: '2026-02-17T18:45:00Z',
    thankStatus: 'pending',
    thankChannel: 'none',
    confidence: 'explicit',
    instagramHandle: null,
    incentiveType: null,
    incentiveValue: null,
    incentiveStatus: null,
  },
  {
    reviewIntentId: 'ri-003',
    tenantId: 't_itl_001',
    businessId: 'b_sakura',
    campaignId: 'd2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
    customerIdentityRef: null,
    scanTs: '2026-02-15T20:00:00Z',
    expiresAt: '2026-02-17T20:00:00Z',
    thankStatus: 'expired',
    thankChannel: 'none',
    confidence: 'none',
    instagramHandle: null,
    incentiveType: null,
    incentiveValue: null,
    incentiveStatus: null,
  },
];

// ─── Referral Programs ───
export const mockReferralPrograms = [
  {
    referralProgramId: 'rp-001',
    tenantId: 't_itl_001',
    name: 'Restaurant Growth Program',
    rewardType: 'cash',
    rewardValue: 50.0,
    referredDiscountPercent: 20.0,
    minSubscriptionMonths: 1,
    holdDays: 14,
    active: true,
    expiresAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    referralProgramId: 'rp-002',
    tenantId: 't_itl_001',
    name: 'Agency Partner Program',
    rewardType: 'percent',
    rewardValue: 15.0,
    referredDiscountPercent: 10.0,
    minSubscriptionMonths: 3,
    holdDays: 30,
    active: true,
    expiresAt: '2026-12-31T23:59:59Z',
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    referralProgramId: 'rp-003',
    tenantId: 't_itl_001',
    name: 'Summer Blitz Referral',
    rewardType: 'credit',
    rewardValue: 100.0,
    referredDiscountPercent: 25.0,
    minSubscriptionMonths: 1,
    holdDays: 7,
    active: false,
    expiresAt: '2026-08-31T23:59:59Z',
    createdAt: '2026-05-01T00:00:00Z',
  },
];

// ─── Referral Links ───
export const mockReferralLinks = [
  {
    referralId: 'rl-001',
    tenantId: 't_itl_001',
    referralProgramId: 'rp-001',
    referrerType: 'business',
    referrerUserId: 'u_marios_owner',
    code: 'MARIO50',
    shareUrl: 'https://itl.ink/ref/MARIO50',
    status: 'active',
    maxUses: 0,
    usageCount: 12,
    expiresAt: null,
    createdAt: '2026-01-20T00:00:00Z',
  },
  {
    referralId: 'rl-002',
    tenantId: 't_itl_001',
    referralProgramId: 'rp-002',
    referrerType: 'agency',
    referrerUserId: 'u_digitalagency',
    code: 'DIGI15',
    shareUrl: 'https://itl.ink/ref/DIGI15',
    status: 'active',
    maxUses: 100,
    usageCount: 34,
    expiresAt: '2026-12-31T23:59:59Z',
    createdAt: '2026-01-25T00:00:00Z',
  },
  {
    referralId: 'rl-003',
    tenantId: 't_itl_001',
    referralProgramId: 'rp-001',
    referrerType: 'influencer',
    referrerUserId: 'u_foodie_ig',
    code: 'FOODIE',
    shareUrl: 'https://itl.ink/ref/FOODIE',
    status: 'disabled',
    maxUses: 50,
    usageCount: 48,
    expiresAt: null,
    createdAt: '2026-02-01T00:00:00Z',
  },
];

// ─── Referral Events (timeline) ───
export const mockReferralEvents = [
  { eventId: 're-001', referralId: 'rl-001', referredBusinessId: 'b_newpizza', status: 'reward_released', eventTs: '2026-02-14T10:00:00Z', amount: 50.00, fraudScore: 0 },
  { eventId: 're-002', referralId: 'rl-001', referredBusinessId: 'b_tacoking', status: 'cleared', eventTs: '2026-02-12T08:00:00Z', amount: 50.00, fraudScore: 5 },
  { eventId: 're-003', referralId: 'rl-001', referredBusinessId: 'b_wokstar', status: 'paid', eventTs: '2026-02-15T14:00:00Z', amount: 50.00, fraudScore: 0 },
  { eventId: 're-004', referralId: 'rl-002', referredBusinessId: 'b_coffeelab', status: 'signed_up', eventTs: '2026-02-16T09:00:00Z', amount: 0, fraudScore: 0 },
  { eventId: 're-005', referralId: 'rl-001', referredBusinessId: 'b_suspicious', status: 'fraud_flagged', eventTs: '2026-02-13T11:00:00Z', amount: 50.00, fraudScore: 92 },
  { eventId: 're-006', referralId: 'rl-002', referredBusinessId: 'b_refunded', status: 'reversed', eventTs: '2026-02-11T16:00:00Z', amount: 75.00, fraudScore: 0 },
  { eventId: 're-007', referralId: 'rl-001', referredBusinessId: 'b_deli', status: 'clicked', eventTs: '2026-02-16T17:30:00Z', amount: 0, fraudScore: 0 },
];

// ─── Referral Wallets ───
export const mockWallets = [
  {
    walletId: 'w-001',
    tenantId: 't_itl_001',
    ownerId: 'u_marios_owner',
    ownerName: "Mario's Italian Kitchen",
    balancePending: 100.00,
    balanceAvailable: 250.00,
    balancePaid: 450.00,
    frozen: false,
    lastAdjustedAt: '2026-02-14T10:00:00Z',
  },
  {
    walletId: 'w-002',
    tenantId: 't_itl_001',
    ownerId: 'u_digitalagency',
    ownerName: 'Digital Growth Agency',
    balancePending: 300.00,
    balanceAvailable: 150.00,
    balancePaid: 1200.00,
    frozen: false,
    lastAdjustedAt: '2026-02-15T08:00:00Z',
  },
  {
    walletId: 'w-003',
    tenantId: 't_itl_001',
    ownerId: 'u_foodie_ig',
    ownerName: '@FoodieInfluencer',
    balancePending: 0,
    balanceAvailable: 0,
    balancePaid: 200.00,
    frozen: true,
    lastAdjustedAt: '2026-02-10T12:00:00Z',
  },
];

// ─── Payout Requests ───
export const mockPayoutRequests = [
  { payoutRequestId: 'pr-001', ownerId: 'u_marios_owner', ownerName: "Mario's Kitchen", amount: 200.00, method: 'stripe_connect', status: 'approved', createdAt: '2026-02-13T10:00:00Z' },
  { payoutRequestId: 'pr-002', ownerId: 'u_digitalagency', ownerName: 'Digital Agency', amount: 150.00, method: 'ach', status: 'requested', createdAt: '2026-02-15T14:00:00Z' },
  { payoutRequestId: 'pr-003', ownerId: 'u_marios_owner', ownerName: "Mario's Kitchen", amount: 100.00, method: 'manual', status: 'paid', createdAt: '2026-02-10T09:00:00Z' },
  { payoutRequestId: 'pr-004', ownerId: 'u_foodie_ig', ownerName: '@FoodieIG', amount: 50.00, method: 'stripe_connect', status: 'rejected', createdAt: '2026-02-12T11:00:00Z' },
];

// ─── Fraud Queue ───
export const mockFraudQueue = [
  {
    signalId: 'fs-001',
    tenantId: 't_itl_001',
    referredBusinessId: 'b_suspicious',
    referralId: 'rl-001',
    referrerName: "Mario's Kitchen",
    referredName: 'Suspicious Pizza Co.',
    totalScore: 92,
    flags: [
      { type: 'self_referral', weight: 80, detail: 'Same owner email hash' },
      { type: 'ip_match', weight: 30, detail: 'Click and signup from same IP' },
    ],
    decision: 'block_freeze',
    createdAt: '2026-02-13T11:00:00Z',
    resolved: false,
  },
  {
    signalId: 'fs-002',
    tenantId: 't_itl_001',
    referredBusinessId: 'b_maybe_ok',
    referralId: 'rl-002',
    referrerName: 'Digital Agency',
    referredName: 'Maybe OK Cafe',
    totalScore: 55,
    flags: [
      { type: 'velocity_ip_24h', weight: 40, detail: 'count=6' },
      { type: 'disposable_email', weight: 20, detail: 'mailinator.com' },
    ],
    decision: 'hold_review',
    createdAt: '2026-02-14T15:00:00Z',
    resolved: false,
  },
  {
    signalId: 'fs-003',
    tenantId: 't_itl_001',
    referredBusinessId: 'b_cleared',
    referralId: 'rl-001',
    referrerName: "Mario's Kitchen",
    referredName: 'All Good BBQ',
    totalScore: 15,
    flags: [
      { type: 'ip_match', weight: 15, detail: 'Adjacent IP range' },
    ],
    decision: 'allow',
    createdAt: '2026-02-12T08:00:00Z',
    resolved: true,
  },
];

// ─── Audit Logs ───
export const mockAuditLogs = [
  { id: 'al-001', actor: 'admin@itl.com', action: 'referral_program.updated', target: 'rp-001', detail: 'Changed reward_value from 25 to 50', ts: '2026-02-15T10:30:00Z' },
  { id: 'al-002', actor: 'admin@itl.com', action: 'wallet.frozen', target: 'w-003', detail: 'Frozen due to fraud investigation', ts: '2026-02-14T09:00:00Z' },
  { id: 'al-003', actor: 'admin@itl.com', action: 'payout.approved', target: 'pr-001', detail: 'Manual payout approval for $200', ts: '2026-02-13T11:00:00Z' },
  { id: 'al-004', actor: 'system', action: 'referral.reward_released', target: 're-001', detail: 'Auto-released after hold period', ts: '2026-02-14T10:00:00Z' },
  { id: 'al-005', actor: 'system', action: 'fraud.detected', target: 'fs-001', detail: 'Score 92 — auto-frozen', ts: '2026-02-13T11:00:00Z' },
  { id: 'al-006', actor: 'admin@itl.com', action: 'campaign.created', target: 'c1a2b3c4', detail: "Mario's Italian Kitchen campaign", ts: '2026-01-15T10:00:00Z' },
];

// ─── Dashboard Stats (aggregated) ───
export const mockDashboardStats = {
  totalCampaigns: 3,
  activeQrCodes: 2,
  totalScans: 847,
  totalReviewIntents: 312,
  completedThankYous: 189,
  pendingIntents: 42,
  totalReferralClicks: 1240,
  totalSignups: 87,
  totalPaid: 52,
  totalRewardReleased: 38,
  totalFraudFlagged: 4,
  walletTotalPending: 400.00,
  walletTotalAvailable: 400.00,
  walletTotalPaid: 1850.00,
};

// ─── Chart Data ───
export const mockScanChartData = [
  { date: 'Feb 10', scans: 45, intents: 28, thanked: 18 },
  { date: 'Feb 11', scans: 52, intents: 34, thanked: 22 },
  { date: 'Feb 12', scans: 38, intents: 25, thanked: 15 },
  { date: 'Feb 13', scans: 67, intents: 42, thanked: 28 },
  { date: 'Feb 14', scans: 89, intents: 58, thanked: 40 },
  { date: 'Feb 15', scans: 73, intents: 48, thanked: 32 },
  { date: 'Feb 16', scans: 95, intents: 62, thanked: 34 },
];

export const mockReferralChartData = [
  { date: 'Feb 10', clicks: 120, signups: 8, paid: 4, released: 2 },
  { date: 'Feb 11', clicks: 145, signups: 12, paid: 6, released: 4 },
  { date: 'Feb 12', clicks: 98, signups: 7, paid: 5, released: 3 },
  { date: 'Feb 13', clicks: 167, signups: 14, paid: 8, released: 5 },
  { date: 'Feb 14', clicks: 203, signups: 18, paid: 10, released: 7 },
  { date: 'Feb 15', clicks: 178, signups: 15, paid: 9, released: 6 },
  { date: 'Feb 16', clicks: 220, signups: 13, paid: 10, released: 11 },
];
