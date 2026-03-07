const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// ─────────────────────────────────────────────────
// GET /api/campaigns — List all campaigns
// ─────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const { search, business_id, active } = req.query;

    // Build query with conditionals
    const campaigns = await sql`
      SELECT * FROM campaigns 
      WHERE tenant_id = ${req.user.tenant_id}
      ${search ? sql`AND name ILIKE ${'%' + search + '%'}` : sql``}
      ${business_id ? sql`AND business_id = ${business_id}` : sql``}
      ${active !== undefined ? sql`AND is_active = ${active === 'true'}` : sql``}
      ORDER BY created_at DESC
    `;

    // Parse JSON fields
    const parsed = campaigns.map(c => ({
      campaignId: c.campaign_id,
      tenantId: c.tenant_id,
      businessId: c.business_id,
      locationId: c.location_id,
      name: c.name,
      placeId: c.place_id,
      googleReviewUrl: c.google_review_url,
      timezone: c.timezone,
      rushHours: JSON.parse(c.rush_hours || '{}'),
      thankWindowHours: c.thank_window_hours,
      enableVoiceLinkage: !!c.enable_voice_linkage,
      enableInfluencerCapture: !!c.enable_influencer_capture,
      enableIncentives: !!c.enable_incentives,
      enableReferrals: !!c.enable_referrals,
      captureName: !!c.capture_name,
      capturePhone: !!c.capture_phone,
      captureEmail: !!c.capture_email,
      captureSocial: !!c.capture_social,
      requireConsent: !!c.require_consent,
      isActive: !!c.is_active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    res.json({
      success: true,
      data: parsed,
      count: parsed.length,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// GET /api/campaigns/:id — Get single campaign
// ─────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const results = await sql`SELECT * FROM campaigns WHERE campaign_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;

    if (!results.length) {
      return res.status(404).json({ success: false, error: 'Campaign not found.' });
    }

    const c = results[0];
    res.json({
      success: true,
      data: {
        campaignId: c.campaign_id,
        tenantId: c.tenant_id,
        businessId: c.business_id,
        locationId: c.location_id,
        name: c.name,
        placeId: c.place_id,
        googleReviewUrl: c.google_review_url,
        timezone: c.timezone,
        rushHours: JSON.parse(c.rush_hours || '{}'),
        thankWindowHours: c.thank_window_hours,
        enableVoiceLinkage: !!c.enable_voice_linkage,
        enableInfluencerCapture: !!c.enable_influencer_capture,
        enableIncentives: !!c.enable_incentives,
        enableReferrals: !!c.enable_referrals,
        captureName: !!c.capture_name,
        capturePhone: !!c.capture_phone,
        captureEmail: !!c.capture_email,
        captureSocial: !!c.capture_social,
        requireConsent: !!c.require_consent,
        isActive: !!c.is_active,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// POST /api/campaigns — Create campaign
// ─────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
  try {
    let {
      name, businessId, locationId, placeId, googleReviewUrl,
      timezone, rushHours, thankWindowHours,
      enableVoiceLinkage, enableInfluencerCapture, enableIncentives, enableReferrals,
      captureName, capturePhone, captureEmail, captureSocial, requireConsent,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Restaurant Name is required.',
      });
    }

    // Auto-generate IDs if missing
    if (!businessId) {
      businessId = 'bus_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
    }
    if (!locationId) {
      locationId = 'loc_main';
    }

    const sql = getSql();
    const campaignId = uuidv4();

    await sql.begin(async sql => {
      await sql`
        INSERT INTO campaigns (
          campaign_id, tenant_id, business_id, location_id, name, 
          place_id, google_review_url, timezone, rush_hours, thank_window_hours, 
          enable_voice_linkage, enable_influencer_capture, enable_incentives, enable_referrals,
          capture_name, capture_phone, capture_email, capture_social, require_consent
        )
        VALUES (
          ${campaignId}, ${req.user.tenant_id}, ${businessId}, ${locationId}, ${name}, 
          ${placeId || null}, ${googleReviewUrl || null}, ${timezone || 'Asia/Kolkata'}, 
          ${JSON.stringify(rushHours || {})}, ${thankWindowHours || 24}, 
          ${!!enableVoiceLinkage}, ${!!enableInfluencerCapture}, ${!!enableIncentives}, ${!!enableReferrals},
          ${captureName !== undefined ? !!captureName : true}, ${capturePhone !== undefined ? !!capturePhone : true}, 
          ${captureEmail !== undefined ? !!captureEmail : false}, ${captureSocial !== undefined ? !!captureSocial : false}, 
          ${requireConsent !== undefined ? !!requireConsent : true}
        )
      `;

      // Auto-create first QR code
      const qrId = uuidv4();
      const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await sql`
        INSERT INTO qr_codes (qr_code_id, campaign_id, short_code, short_url, active)
        VALUES (${qrId}, ${campaignId}, ${shortCode}, ${(process.env.APP_BASE_URL || 'http://localhost:5174') + '/r/' + shortCode}, true)
      `;

      // Initialize referral wallet if needed
      const [existingWallet] = await sql`SELECT wallet_id FROM referral_wallets WHERE tenant_id = ${req.user.tenant_id} AND owner_id = ${req.user.id}`;
      if (!existingWallet) {
        await sql`
          INSERT INTO referral_wallets (wallet_id, tenant_id, owner_id, owner_name)
          VALUES (${uuidv4()}, ${req.user.tenant_id}, ${req.user.id}, ${name})
        `;
      }
    });

    logAudit(req.user.email, 'campaign.created', campaignId, `Campaign "${name}" created with auto-QR`);

    const campaign = await sql`SELECT * FROM campaigns WHERE campaign_id = ${campaignId}`;
    const c = campaign[0];

    res.status(201).json({
      success: true,
      data: {
        campaignId: c.campaign_id,
        tenantId: c.tenant_id,
        businessId: c.business_id,
        locationId: c.location_id,
        name: c.name,
        placeId: c.place_id,
        googleReviewUrl: c.google_review_url,
        timezone: c.timezone,
        rushHours: JSON.parse(c.rush_hours || '{}'),
        thankWindowHours: c.thank_window_hours,
        enableVoiceLinkage: !!c.enable_voice_linkage,
        enableInfluencerCapture: !!c.enable_influencer_capture,
        enableIncentives: !!c.enable_incentives,
        enableReferrals: !!c.enable_referrals,
        captureName: !!c.capture_name,
        capturePhone: !!c.capture_phone,
        captureEmail: !!c.capture_email,
        captureSocial: !!c.capture_social,
        requireConsent: !!c.require_consent,
        isActive: !!c.is_active,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// PUT /api/campaigns/:id — Update campaign
// ─────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const sql = getSql();
    const existing = await sql`SELECT * FROM campaigns WHERE campaign_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;

    if (!existing.length) {
      return res.status(404).json({ success: false, error: 'Campaign not found.' });
    }

    const {
      name, businessId, locationId, placeId, googleReviewUrl,
      timezone, rushHours, thankWindowHours,
      enableVoiceLinkage, enableInfluencerCapture, enableIncentives, enableReferrals,
      captureName, capturePhone, captureEmail, captureSocial, requireConsent,
    } = req.body;

    await sql`
      UPDATE campaigns SET
        name = COALESCE(${name || null}, name),
        business_id = COALESCE(${businessId || null}, business_id),
        location_id = COALESCE(${locationId || null}, location_id),
        place_id = COALESCE(${placeId || null}, place_id),
        google_review_url = COALESCE(${googleReviewUrl || null}, google_review_url),
        timezone = COALESCE(${timezone || null}, timezone),
        rush_hours = COALESCE(${rushHours ? JSON.stringify(rushHours) : null}, rush_hours),
        thank_window_hours = COALESCE(${thankWindowHours || null}, thank_window_hours),
        enable_voice_linkage = COALESCE(${enableVoiceLinkage !== undefined ? !!enableVoiceLinkage : null}, enable_voice_linkage),
        enable_influencer_capture = COALESCE(${enableInfluencerCapture !== undefined ? !!enableInfluencerCapture : null}, enable_influencer_capture),
        enable_incentives = COALESCE(${enableIncentives !== undefined ? !!enableIncentives : null}, enable_incentives),
        enable_referrals = COALESCE(${enableReferrals !== undefined ? !!enableReferrals : null}, enable_referrals),
        capture_name = COALESCE(${captureName !== undefined ? !!captureName : null}, capture_name),
        capture_phone = COALESCE(${capturePhone !== undefined ? !!capturePhone : null}, capture_phone),
        capture_email = COALESCE(${captureEmail !== undefined ? !!captureEmail : null}, capture_email),
        capture_social = COALESCE(${captureSocial !== undefined ? !!captureSocial : null}, capture_social),
        require_consent = COALESCE(${requireConsent !== undefined ? !!requireConsent : null}, require_consent),
        updated_at = NOW()
      WHERE campaign_id = ${req.params.id}
    `;

    logAudit(req.user.email, 'campaign.updated', req.params.id, `Campaign updated`);

    const updated = await sql`SELECT * FROM campaigns WHERE campaign_id = ${req.params.id}`;
    const c = updated[0];

    res.json({
      success: true,
      data: {
        campaignId: c.campaign_id,
        tenantId: c.tenant_id,
        businessId: c.business_id,
        locationId: c.location_id,
        name: c.name,
        placeId: c.place_id,
        googleReviewUrl: c.google_review_url,
        timezone: c.timezone,
        rushHours: JSON.parse(c.rush_hours || '{}'),
        thankWindowHours: c.thank_window_hours,
        enableVoiceLinkage: !!c.enable_voice_linkage,
        enableInfluencerCapture: !!c.enable_influencer_capture,
        enableIncentives: !!c.enable_incentives,
        enableReferrals: !!c.enable_referrals,
        captureName: !!c.capture_name,
        capturePhone: !!c.capture_phone,
        captureEmail: !!c.capture_email,
        captureSocial: !!c.capture_social,
        requireConsent: !!c.require_consent,
        isActive: !!c.is_active,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// DELETE /api/campaigns/:id — Delete campaign
// ─────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), async (req, res, next) => {
  try {
    const sql = getSql();
    const existing = await sql`SELECT * FROM campaigns WHERE campaign_id = ${req.params.id} AND tenant_id = ${req.user.tenant_id}`;

    if (!existing.length) {
      return res.status(404).json({ success: false, error: 'Campaign not found.' });
    }

    await sql`DELETE FROM campaigns WHERE campaign_id = ${req.params.id}`;
    await sql`UPDATE dashboard_stats SET total_campaigns = GREATEST(0, total_campaigns - 1), updated_at = NOW() WHERE id = 1`;

    logAudit(req.user.email, 'campaign.deleted', req.params.id, `Campaign "${existing[0].name}" deleted`);

    res.json({
      success: true,
      message: 'Campaign deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
