const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getSql } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// ─────────────────────────────────────────────────────────
// AI Engine — Natural Language Campaign Generator
// POST /api/ai-engine/generate
// Accepts a natural language prompt and auto-creates everything
// ─────────────────────────────────────────────────────────

/**
 * Parse user intent from the prompt.
 * Uses keyword matching + smart defaults to determine:
 *   - businessType  (restaurant, salon, clinic, store, etc.)
 *   - goal          (review, referral, incentive, engagement)
 *   - platform      (google, facebook, yelp, etc.)
 *   - features      (voice, qr, reminder, incentive, referral)
 */
function parseIntent(prompt) {
  const lower = prompt.toLowerCase();

  // ── Business Type ──
  const businessTypes = {
    restaurant: ['restaurant', 'cafe', 'food', 'dining', 'diner', 'pizza', 'bar', 'eatery', 'bistro', 'grill'],
    salon: ['salon', 'spa', 'beauty', 'hair', 'barber', 'nails', 'makeup'],
    clinic: ['clinic', 'hospital', 'doctor', 'medical', 'dental', 'dentist', 'health', 'therapy', 'physio'],
    hotel: ['hotel', 'resort', 'lodge', 'motel', 'inn', 'airbnb', 'stay', 'hospitality'],
    gym: ['gym', 'fitness', 'yoga', 'workout', 'training', 'crossfit'],
    store: ['store', 'shop', 'retail', 'boutique', 'ecommerce', 'market'],
    auto: ['auto', 'car', 'mechanic', 'garage', 'dealership', 'wash'],
    realestate: ['real estate', 'property', 'housing', 'agent', 'broker', 'apartment'],
    education: ['school', 'tutor', 'education', 'academy', 'college', 'course', 'coaching'],
    general: [],
  };

  let businessType = 'general';
  for (const [type, keywords] of Object.entries(businessTypes)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      businessType = type;
      break;
    }
  }

  // ── Goal ──
  const isReferral = /referral|refer|refrrral|refrerral|refrel|refere|refral/i.test(lower);
  const isReview = /review|rating|feedback|google|yelp/i.test(lower);
  const isIncentive = /incentive|reward|discount|cashback|coupon/i.test(lower);
  
  let campaignType = 'general';
  if (isReferral) campaignType = 'referral';
  else if (isReview) campaignType = 'review';
  else if (isIncentive) campaignType = 'incentive';

  // ── Platform ──
  let platform = null; 
  if (lower.includes('google')) platform = 'google';
  else if (lower.includes('facebook') || lower.includes('fb')) platform = 'facebook';
  else if (lower.includes('yelp')) platform = 'yelp';
  else if (lower.includes('instagram') || lower.includes('insta')) platform = 'instagram';
  else if (lower.includes('tripadvisor')) platform = 'tripadvisor';
  else if (lower.includes('trustpilot')) platform = 'trustpilot';

  // ── Features to enable (Strictly based on prompt) ──
  const features = {
    voiceThankYou: /voice|call|phone|talk|thank/i.test(lower),
    qrCode: /qr|scan|code/i.test(lower) || true, // QR is default for AutoRefer
    reminder: /reminder|remind|follow/i.test(lower),
    incentive: isIncentive,
    referral: isReferral,
    influencer: /influencer|social|instagram|handle/i.test(lower),
  };

  // ── Extract business name (heuristic fallback) ──
  let businessName = '';
  
  // Pattern 1: "create my [Name] [campaign]"
  const pattern1 = prompt.match(/(?:create|generate|genrate|make|build|setup)\s+(?:my\s+|a\s+|the\s+)?(.*?)\s+(?:campaign|campaing|program|promo|drive|wave)/i);
  if (pattern1 && pattern1[1]) {
    businessName = pattern1[1].trim();
  } 
  
  // Pattern 2: "for [Name]"
  if (!businessName) {
    const pattern2 = prompt.match(/for\s+(?:my\s+|the\s+|our\s+)?(.*?)(?:\s+to\s|\s+campaign|\s+campaing|\s+that|\s*$)/i);
    if (pattern2 && pattern2[1]) {
      businessName = pattern2[1].trim();
    }
  }

  // Final Cleanup: remove non-name words if they accidentally got caught
  if (businessName) {
    businessName = businessName.replace(/^(please|can you|would you|just)\s+/i, '');
    businessName = businessName.split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // ── Extract URLs ──
  const urlMatch = prompt.match(/(https?:\/\/[^\s]+)/i);
  const detectedUrl = urlMatch ? urlMatch[1] : null;

  return { businessType, campaignType, platform, features, businessName, detectedUrl };
}

/**
 * AI-Powered Intent Parsing & Configuration Generation.
 * This function uses OpenAI if available to understand context and generate a full configuration.
 */
async function generateCampaignConfigWithAI(prompt, user) {
  if (!process.env.OPENAI_API_KEY) {
    return null; // Fallback to manual generation
  }

  try {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are an AI Campaign Architect for AutoRefer. Your goal is to deeply analyze a natural language prompt and output a complete, hyper-personalized campaign configuration in JSON.

UNDERSTAND CONTEXT:
- If the user mentions a specific business name (e.g., "The Coffee Bean"), use it.
- If they mention a specific platform (e.g., "Trustpilot"), set that platform.
- If they specify a discount value (e.g., "20% off"), use that in the incentives.
- If they request specific features (e.g., "capture instagram"), enable those features.
- If they describe specific timing or rush hours, translate them into the rushHours object.

The platform provides:
1. QR Code reviews (Scan -> Form -> Review Link)
2. AI Voice Thank-you calls (After review)
3. Automated SMS Incentives (Coupons/Rewards)
4. Referral Programs (Cash/Credit rewards for inviting friends)
5. Influencer Capture (Collecting social handles)

Extract/Generate the following fields based on the user's prompt:
- businessName: Exact name of the business.
- businessType: One of (restaurant, salon, clinic, hotel, gym, store, auto, realestate, education, general)
- campaignType: One of (review, referral, incentive)
- platform: One of (google, facebook, yelp, instagram, tripadvisor, trustpilot)
- features: { voiceThankYou (bool), qrCode (bool), reminder (bool), incentive (bool), referral (bool), influencer (bool) }
- detectedUrl: Any URL mentioned (usually a Google Review URL)
- incentives: { enabled (bool), type ('percent', 'fixed', 'freebie'), value (string), label (description, e.g. '10% off next visit'), expiresInDays (int) }
- rushHours: A JSON object where keys are time-slot labels (e.g., 'Lunch Time') and values are [StartTime, EndTime] in 'HH:MM' format.
- automationFlows: Array of 3-4 flows with { trigger, action, description, config: { ... } }. Create personalized message templates based on the business type.
- formFields: Array of { name, label, type, required (bool), enabled (bool) }.

Your response must be ONLY a valid JSON object. No markdown, no commentary.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    const config = JSON.parse(response.choices[0].message.content.trim());
    
    // Ensure essential structure is present
    if (!config.businessName) config.businessName = 'New Business';
    if (!config.features) config.features = { qrCode: true };
    
    return config;
  } catch (err) {
    console.error('AI Configuration generation failed:', err);
    return null;
  }
}


/**
 * Generate a smart campaign name based on intent.
 */
function generateCampaignName(intent) {
  const typeLabels = {
    review: 'Review Boost',
    referral: 'Referral Drive',
    incentive: 'Incentive Wave',
  };
  const platformLabels = {
    google: 'Google',
    facebook: 'Facebook',
    yelp: 'Yelp',
    tripadvisor: 'TripAdvisor',
    trustpilot: 'Trustpilot',
    instagram: 'Instagram',
  };
  const bizTypeLabels = {
    restaurant: '🍽️',
    salon: '💇',
    clinic: '🏥',
    hotel: '🏨',
    gym: '💪',
    store: '🛒',
    auto: '🚗',
    realestate: '🏠',
    education: '📚',
    general: '🚀',
  };

  const emoji = bizTypeLabels[intent.businessType] || '🚀';
  const typeLabel = typeLabels[intent.campaignType] || 'Campaign';
  const platLabel = intent.platform ? (platformLabels[intent.platform] || '') : '';

  let name = '';
  if (intent.businessName) {
    name = `${emoji} ${intent.businessName}`;
    if (platLabel || typeLabel !== 'Campaign') {
      name += ` — ${platLabel} ${typeLabel}`.replace(/\s+/g, ' ').trim();
    }
  } else {
    name = `${emoji} ${platLabel} ${typeLabel}`.replace(/\s+/g, ' ').trim();
  }

  return name || `${emoji} New Campaign`;
}

/**
 * Generate default automation flows based on features.
 */
function generateAutomationFlows(intent) {
  const flows = [];

  if (intent.features.voiceThankYou) {
    flows.push({
      id: uuidv4(),
      trigger: 'review_submitted',
      action: 'ai_voice_thank_you',
      description: 'When customer submits a review, trigger AI voice thank-you call',
      config: {
        rushHourScript: 'Thank you for your recent review! We really appreciate it.',
        standardScript: 'Hi! We noticed you recently left us a review—thank you so much, it means a lot to us.',
        maxPlays: 1,
        windowHours: 24,
      },
      enabled: true,
    });
  }

  if (intent.features.reminder) {
    flows.push({
      id: uuidv4(),
      trigger: 'no_review_24h',
      action: 'send_reminder_sms',
      description: 'If no review within 24 hours of QR scan, send a gentle reminder via SMS',
      config: {
        delayHours: 24,
        message: "Hi! Thanks for visiting. We'd love to hear your feedback — it only takes 30 seconds!",
        maxReminders: 1,
      },
      enabled: true,
    });
  }

  if (intent.features.qrCode) {
    flows.push({
      id: uuidv4(),
      trigger: 'qr_scan',
      action: 'capture_customer_info',
      description: 'When customer scans QR, capture their info and redirect to review page',
      config: {
        redirectUrl: intent.platform === 'google' ? 'google_review_url' : `${intent.platform}_review_url`,
        captureFields: ['name', 'phone', 'email'],
      },
      enabled: true,
    });
  }

  // Always add a basic analytics flow
  flows.push({
    id: uuidv4(),
    trigger: 'any_event',
    action: 'track_analytics',
    description: 'Track all events for campaign dashboard metrics',
    config: {
      metrics: ['scans', 'reviews', 'calls', 'incentives_sent', 'referrals'],
    },
    enabled: true,
  });

  return flows;
}

/**
 * Generate default incentive config.
 */
function generateIncentives(intent) {
  if (!intent.features.incentive) {
    return { enabled: false };
  }

  const defaults = {
    restaurant: { type: 'percent', value: '10', label: '10% off on your next visit' },
    salon: { type: 'percent', value: '15', label: '15% off your next appointment' },
    clinic: { type: 'fixed', value: '500', label: '₹500 off your next consultation' },
    hotel: { type: 'percent', value: '10', label: '10% off your next stay' },
    gym: { type: 'freebie', value: '1 week free', label: 'Free 1-week trial pass' },
    store: { type: 'percent', value: '10', label: '10% discount on next purchase' },
    auto: { type: 'fixed', value: '200', label: '₹200 off your next service' },
    general: { type: 'percent', value: '10', label: '10% off on your next visit' },
  };

  const def = defaults[intent.businessType] || defaults.general;

  return {
    enabled: true,
    type: def.type,
    value: def.value,
    label: def.label,
    deliveryMethod: 'auto',
    requiresApproval: false,
    expiresInDays: 30,
  };
}

/**
 * Generate context-aware rush hours based on business type.
 */
function generateRushHours(intent) {
  const type = intent.businessType;
  
  if (type === 'salon' || type === 'spa' || type === 'beauty') {
    return {
      'Morning Slots': ['10:00', '13:00'],
      'Evening Slots': ['16:00', '19:00']
    };
  }
  
  if (type === 'clinic' || type === 'doctor') {
    return {
      'Morning OPD': ['09:00', '13:00'],
      'Evening OPD': ['16:00', '20:00']
    };
  }

  if (type === 'gym' || type === 'fitness') {
    return {
      'Morning Peak': ['06:00', '09:00'],
      'Evening Peak': ['17:00', '21:00']
    };
  }

  if (type === 'hotel' || type === 'inn') {
    return {
      'Check-in Rush': ['11:00', '14:00'],
      'Checkout Rush': ['08:00', '11:00']
    };
  }

  // Default to Restaurant
  return {
    'Lunch Time': ['11:30', '14:30'],
    'Dinner Time': ['18:30', '22:30']
  };
}

/**
 * Generate form fields based on features.
 */
function generateFormFields(intent) {
  const fields = [
    { name: 'name', label: 'Full Name', type: 'text', required: true, enabled: true },
    { name: 'phone', label: 'Phone Number', type: 'tel', required: true, enabled: true },
    { name: 'email', label: 'Email Address', type: 'email', required: false, enabled: true },
  ];

  if (intent.features.influencer) {
    fields.push({ name: 'social_handle', label: 'Instagram / Social Handle', type: 'text', required: false, enabled: true });
  } else {
    fields.push({ name: 'social_handle', label: 'Instagram Handle', type: 'text', required: false, enabled: false });
  }

  fields.push({
    name: 'consent',
    label: 'I agree to receive follow-up messages',
    type: 'checkbox',
    required: true,
    enabled: true,
  });

  return fields;
}

/**
 * Generate initial dashboard/tracking metrics skeleton.
 */
function generateTrackingMetrics() {
  return {
    totalScans: 0,
    totalReviews: 0,
    totalCalls: 0,
    totalIncentivesSent: 0,
    totalReferrals: 0,
    conversionRate: '0%',
    avgRating: 0,
    activeCustomers: 0,
  };
}


// ─────────────────────────────────────────────────────────
// POST /api/ai-engine/generate
// ─────────────────────────────────────────────────────────
router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a prompt describing what you want to create.',
      });
    }

    // ── Step 1: Generate Configuration (AI or Manual) ──
    let config = await generateCampaignConfigWithAI(prompt, req.user);
    let intent;

    if (config) {
      // AI successfully generated the config
      intent = {
        businessName: config.businessName,
        businessType: config.businessType || 'general',
        campaignType: config.campaignType || 'review',
        platform: config.platform || 'google',
        features: config.features || { qrCode: true },
        detectedUrl: config.detectedUrl,
      };
    } else {
      // Fallback: Use basic regex parsing
      intent = parseIntent(prompt);
      config = {
        businessName: intent.businessName,
        campaignName: generateCampaignName(intent),
        formFields: generateFormFields(intent),
        automationFlows: generateAutomationFlows(intent),
        incentives: generateIncentives(intent),
        rushHours: generateRushHours(intent),
        trackingMetrics: generateTrackingMetrics(),
      };
    }

    // Finalize campaign name if not provided by AI
    const finalCampaignName = config.campaignName || generateCampaignName(intent);
    const finalFormFields = config.formFields || generateFormFields(intent);
    const finalAutomationFlows = config.automationFlows || generateAutomationFlows(intent);
    const finalIncentives = config.incentives || generateIncentives(intent);
    const finalRushHours = config.rushHours || generateRushHours(intent);
    const finalTrackingMetrics = config.trackingMetrics || generateTrackingMetrics();

    // ── Step 2: Actually create the campaign in the database ──
    const sql = getSql();
    const campaignId = uuidv4();
    const businessId = 'bus_' + (intent.businessName || 'ai_gen').toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
    const locationId = 'loc_main';

    let referralDetails = null;

    await sql.begin(async (sql) => {
      // Create campaign
      await sql`
        INSERT INTO campaigns (
          campaign_id, tenant_id, business_id, location_id, name,
          google_review_url, rush_hours, thank_window_hours,
          enable_voice_linkage, enable_influencer_capture, enable_incentives, enable_referrals,
          capture_name, capture_phone, capture_email, capture_social, require_consent
        )
        VALUES (
          ${campaignId}, ${req.user.tenant_id}, ${businessId}, ${locationId}, ${finalCampaignName},
          ${intent.detectedUrl || null},
          ${JSON.stringify(finalRushHours)},
          ${24},
          ${intent.features.voiceThankYou}, ${intent.features.influencer},
          ${intent.features.incentive}, ${intent.features.referral},
          ${true}, ${true},
          ${finalFormFields.find(f => f.name === 'email')?.enabled || false},
          ${finalFormFields.find(f => f.name === 'social_handle')?.enabled || false},
          ${true}
        )
      `;

      // Auto-generate QR code
      const qrId = uuidv4();
      const shortCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const shortUrl = (process.env.APP_BASE_URL || 'http://localhost:5174') + '/r/' + shortCode;
      await sql`
        INSERT INTO qr_codes (qr_code_id, campaign_id, short_code, short_url, active)
        VALUES (${qrId}, ${campaignId}, ${shortCode}, ${shortUrl}, true)
      `;

      // Initialize referral wallet if missing
      const [existingWallet] = await sql`
        SELECT wallet_id FROM referral_wallets WHERE tenant_id = ${req.user.tenant_id} AND owner_id = ${req.user.id}
      `;
      if (!existingWallet) {
        await sql`
          INSERT INTO referral_wallets (wallet_id, tenant_id, owner_id, owner_name)
          VALUES (${uuidv4()}, ${req.user.tenant_id}, ${req.user.id}, ${req.user.name || 'Owner'})
        `;
      }

      // If referral enabled, create a referral program and a link
      if (intent.features.referral) {
        const programId = uuidv4();
        await sql`
          INSERT INTO referral_programs (
            referral_program_id, tenant_id, name, reward_type, reward_value, active
          )
          VALUES (
            ${programId}, ${req.user.tenant_id}, ${intent.businessName ? (intent.businessName + ' Program') : 'AI Referral Program'}, 'cash', 10, true
          )
        `;

        const referralLinkId = uuidv4();
        const refCode = 'REF-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        const refLink = (process.env.APP_BASE_URL || 'http://localhost:5174') + '/ref/' + refCode;
        await sql`
          INSERT INTO referral_links (
            referral_id, tenant_id, referral_program_id, referrer_type, referrer_user_id, code, share_url, status
          )
          VALUES (
            ${referralLinkId}, ${req.user.tenant_id}, ${programId}, 'business', ${req.user.id}, ${refCode}, ${refLink}, 'active'
          )
        `;

        referralDetails = {
          programId,
          referralLinkId,
          code: refCode,
          shareUrl: refLink
        };
      }

      // If incentives enabled, create a template incentive entry
      if (intent.features.incentive) {
        await sql`
          INSERT INTO incentives (
            incentive_id, tenant_id, campaign_id, customer_name,
            incentive_type, incentive_value, send_method, status
          )
          VALUES (
            ${uuidv4()}, ${req.user.tenant_id}, ${campaignId}, 'Template — AI Generated',
            ${finalIncentives.type}, ${finalIncentives.value}, ${finalIncentives.deliveryMethod || 'auto'}, 'pending'
          )
        `;
      }
    });

    // Fetch generated short URL
    const [qr] = await sql`SELECT short_code, short_url FROM qr_codes WHERE campaign_id = ${campaignId} LIMIT 1`;

    logAudit(req.user.email, 'ai_engine.campaign_generated', campaignId, `AI Engine auto-created campaign "${finalCampaignName}" from prompt.`);

    // ── Step 3: Build Structured JSON Output ──
    const result = {
      campaignId,
      campaignName: finalCampaignName,
      campaignType: intent.campaignType,
      businessType: intent.businessType,
      platform: intent.platform,
      googleReviewUrl: intent.detectedUrl || '',
      qrCodeLink: qr?.short_url || '',
      qrShortCode: qr?.short_code || '',
      formFields: finalFormFields,
      automationFlows: finalAutomationFlows,
      rushHours: finalRushHours,
      incentives: finalIncentives,
      trackingMetrics: finalTrackingMetrics,
      referral: referralDetails,
      parsedIntent: intent,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: result,
      message: `Campaign "${finalCampaignName}" created successfully via AI Engine!`,
    });
  } catch (err) {
    console.error('Campaign generation failed:', err);
    next(err);
  }
});


// ─────────────────────────────────────────────────────────
// GET /api/ai-engine/suggestions
// Returns smart prompt suggestions for the UI
// ─────────────────────────────────────────────────────────
router.get('/suggestions', authenticate, async (req, res) => {
  const suggestions = [
    {
      category: 'Restaurant',
      icon: '🍽️',
      prompts: [
        'Create a campaign for my restaurant to collect Google reviews with QR code and send thank-you voice message',
        'Set up a referral program for my cafe with 10% discount incentive',
        'Launch a review campaign for my pizza place with QR codes and reminders',
      ],
    },
    {
      category: 'Salon & Spa',
      icon: '💇',
      prompts: [
        'Create a Google review campaign for my beauty salon with QR and voice thank-you',
        'Set up a referral system for my spa with cashback rewards',
        'Launch a review drive for my barber shop with incentive discounts',
      ],
    },
    {
      category: 'Healthcare',
      icon: '🏥',
      prompts: [
        'Create a review campaign for my dental clinic with QR code',
        'Set up a patient referral program for my hospital',
        'Launch a feedback collection campaign for my therapy practice',
      ],
    },
    {
      category: 'Fitness',
      icon: '💪',
      prompts: [
        'Create a review campaign for my gym with QR codes and incentives',
        'Set up a referral program for my yoga studio with free trial rewards',
        'Launch a Google review drive for my CrossFit box',
      ],
    },
    {
      category: 'Retail & E-commerce',
      icon: '🛒',
      prompts: [
        'Create a review campaign for my store with QR and discount incentives',
        'Set up an influencer referral program for my boutique',
        'Launch a Google review campaign for my shop with voice thank-you',
      ],
    },
    {
      category: 'Hospitality',
      icon: '🏨',
      prompts: [
        'Create a TripAdvisor review campaign for my hotel with QR code',
        'Set up a guest referral program for my resort with cashback',
        'Launch a review drive for my Airbnb with incentive rewards',
      ],
    },
  ];

  res.json({ success: true, data: suggestions });
});


// ─────────────────────────────────────────────────────────
// POST /api/ai-engine/enhance
// Uses Gemini AI to enhance/validate a prompt and return
// detailed structured configuration suggestions
// ─────────────────────────────────────────────────────────
router.post('/enhance', authenticate, async (req, res, next) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt is required.' });
    }

    // If OpenAI is not configured, return basic parsed intent
    if (!process.env.OPENAI_API_KEY) {
      const intent = parseIntent(prompt);
      return res.json({
        success: true,
        data: {
          enhancedPrompt: prompt,
          intent,
          suggestions: [
            `Consider adding voice thank-you calls to boost engagement`,
            `QR codes increase review rates by up to 40%`,
            `Add incentives to increase conversion by 25%`,
          ],
        },
      });
    }

    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        {
          role: 'system',
          content: `You are an AI marketing strategist for AutoRefer. Analyze this campaign prompt and return a JSON response with:
1. "enhancedPrompt": An improved/clearer version of the user's request
2. "businessType": The detected business type
3. "campaignType": review, referral, or incentive
4. "platform": google, facebook, yelp, etc.
5. "suggestions": Array of 3-5 actionable recommendations
6. "estimatedImpact": A brief description of expected results

Return ONLY valid JSON (no markdown formatting).`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
    });

    let parsed;
    try {
      const text = response.choices[0].message.content.trim();
      parsed = JSON.parse(text);
    } catch {
      // Fallback to basic parsing if Gemini returns non-JSON
      const intent = parseIntent(prompt);
      parsed = {
        enhancedPrompt: prompt,
        intent,
        suggestions: ['Enable voice thank-you for better engagement', 'Use QR codes for easy access', 'Add incentives to boost conversions'],
      };
    }

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI Enhance error:', err);
    // Fallback gracefully
    const intent = parseIntent(req.body.prompt || '');
    res.json({
      success: true,
      data: {
        enhancedPrompt: req.body.prompt,
        intent,
        suggestions: ['Enable voice thank-you', 'Use QR codes', 'Add incentives'],
      },
    });
  }
});

module.exports = router;
