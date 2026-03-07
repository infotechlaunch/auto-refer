const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');
const router = express.Router();

// ─────────────────────────────────────────────────
// GET /api/public/qr/:shortCode — Resolve QR settings
// ─────────────────────────────────────────────────
router.get('/qr/:shortCode', async (req, res, next) => {
  try {
    const sql = getSql();
    const { shortCode } = req.params;

    const results = await sql`
      SELECT q.qr_code_id, q.short_url, c.* 
      FROM qr_codes q
      JOIN campaigns c ON q.campaign_id = c.campaign_id
      WHERE q.short_code = ${shortCode} AND q.active = true AND c.is_active = true
    `;

    if (!results.length) {
      return res.status(404).json({ success: false, error: 'Link expired or invalid.' });
    }

    const c = results[0];
    
    // Return only public settings
    res.json({
      success: true,
      data: {
        campaignId: c.campaign_id,
        restaurantName: c.name,
        captureName: !!c.capture_name,
        capturePhone: !!c.capture_phone,
        captureEmail: !!c.capture_email,
        captureSocial: !!c.capture_social,
        requireConsent: !!c.require_consent,
        googleReviewUrl: c.google_review_url,
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// POST /api/public/capture — Save intent & get redirect
// ─────────────────────────────────────────────────
router.post('/capture', async (req, res, next) => {
  try {
    const { 
      campaignId, name, phone, email, 
      instagramHandle, consentGiven 
    } = req.body;

    if (!campaignId) {
      return res.status(400).json({ success: false, error: 'Missing campaign source.' });
    }

    const sql = getSql();
    const campaigns = await sql`SELECT * FROM campaigns WHERE campaign_id = ${campaignId}`;
    
    if (!campaigns.length) {
      return res.status(404).json({ success: false, error: 'Campaign not found.' });
    }

    const c = campaigns[0];

    // Create Review Intent
    const intentId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (c.thank_window_hours || 24));

    await sql`
      INSERT INTO review_intents (
        review_intent_id, tenant_id, business_id, campaign_id,
        customer_identity_ref, expires_at, thank_status, 
        instagram_handle, confidence, ip_hash
      )
      VALUES (
        ${intentId}, ${c.tenant_id}, ${c.business_id}, ${c.campaign_id},
        ${phone || email || 'anonymous'}, ${expiresAt}, 'pending',
        ${instagramHandle || null}, ${phone ? 'explicit' : 'implicit'},
        ${req.ip}
      )
    `;

    // Increment scan count on the QR code (simplification: find first active QR for this campaign)
    await sql`UPDATE qr_codes SET scan_count = scan_count + 1 WHERE campaign_id = ${c.campaign_id} AND active = true`;

    res.json({
      success: true,
      data: {
        redirectUrl: c.google_review_url,
        intentId
      }
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────
// POST /api/public/voice/check-caller — Check if phone needs thank-you
// ─────────────────────────────────────────────────
const { DateTime } = require('luxon');

router.post('/voice/check-caller', async (req, res, next) => {
  try {
    const { fromPhone } = req.body; // e.g., +1234567890
    if (!fromPhone) return res.status(400).json({ success: false, error: 'fromPhone is required' });

    const sql = getSql();

    // 1. Find the latest pending intent for this phone
    const intents = await sql`
      SELECT ri.*, c.name as restaurant_name, c.rush_hours, c.timezone
      FROM review_intents ri
      JOIN campaigns c ON ri.campaign_id = c.campaign_id
      WHERE ri.customer_identity_ref = ${fromPhone}
        AND ri.thank_status = 'pending'
        AND ri.expires_at > NOW()
      ORDER BY ri.created_at DESC
      LIMIT 1
    `;

    if (!intents.length) {
      return res.json({ 
        success: true, 
        action: 'None', 
        reason: 'No pending review intent found for this number.' 
      });
    }

    const intent = intents[0];

    // 2. Determine if it's currently rush hour
    const now = DateTime.now().setZone(intent.timezone || 'UTC');
    const currentTimeStr = now.toFormat('HH:mm');
    
    let isRush = false;
    const rush = typeof intent.rush_hours === 'string' ? JSON.parse(intent.rush_hours) : (intent.rush_hours || {});
    
    // Check lunch/dinner slots
    for (const [key, range] of Object.entries(rush)) {
      if (Array.isArray(range) && range.length === 2) {
        if (currentTimeStr >= range[0] && currentTimeStr <= range[1]) {
          isRush = true;
          break;
        }
      }
    }

    // 3. Select script based on rush status
    const message = isRush 
      ? `Thank you for your recent review at ${intent.restaurant_name}! We really appreciate it.`
      : `Hi! We noticed you recently left us a review at ${intent.restaurant_name}—thank you so much, it means a lot to us.`;

    // 4. Update status to "thanked" immediately (Prevent double thank-you)
    await sql`
      UPDATE review_intents 
      SET thank_status = 'thanked', thanked_at = NOW() 
      WHERE review_intent_id = ${intent.review_intent_id}
    `;

    res.json({
      success: true,
      action: 'ThankYou',
      data: {
        message,
        restaurantName: intent.restaurant_name,
        isRush
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
