require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
// serverless-http moved to index.js

const { initializeDatabase } = require('./db/init');
const { seedDatabase } = require('./db/seed');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');


// Route imports
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const qrCodeRoutes = require('./routes/qrCodes');
const reviewIntentRoutes = require('./routes/reviewIntents');
const referralProgramRoutes = require('./routes/referralPrograms');
const referralLinkRoutes = require('./routes/referralLinks');
const referralEventRoutes = require('./routes/referralEvents');
const walletRoutes = require('./routes/wallets');
const payoutRoutes = require('./routes/payouts');
const fraudQueueRoutes = require('./routes/fraudQueue');
const auditLogRoutes = require('./routes/auditLogs');
const dashboardRoutes = require('./routes/dashboard');
const publicRoutes = require('./routes/public');
const chatRoutes = require('./routes/chat');
const voiceThanksRoutes = require('./routes/voiceThanks');
const incentivesRoutes = require('./routes/incentives');
const settingsRoutes = require('./routes/settings');
const aiEngineRoutes = require('./routes/aiEngine');

// ═══════════════════════════════════════════════
// Initialize Express
// ═══════════════════════════════════════════════
const app = express();
// const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════
app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-Key'],
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ═══════════════════════════════════════════════
// Root & Health Check
// ═══════════════════════════════════════════════
app.get('/', (req, res) => {
  res.status(200).send('ITL AutoPilot™ Backend running');
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ITL AutoPilot™ Backend is running',
    version: '2.0.0',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ════════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/qr-codes', qrCodeRoutes);
app.use('/api/review-intents', reviewIntentRoutes);
app.use('/api/referral-programs', referralProgramRoutes);
app.use('/api/referral-links', referralLinkRoutes);
app.use('/api/referral-events', referralEventRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/fraud-queue', fraudQueueRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/voice-thanks', voiceThanksRoutes);
app.use('/api/incentives', incentivesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai-engine', aiEngineRoutes);

// ═══════════════════════════════════════════════
// Error Handling
// ═══════════════════════════════════════════════
app.use(notFoundHandler);
app.use(errorHandler);

// ═══════════════════════════════════════════════
// Start Server / Base Initializatio
// ═══════════════════════════════════════════════
let isInitialized = false;

async function ensureInitialized() {
  if (isInitialized) return;
  try {
    // Initialize database (create tables)
    await initializeDatabase();
    console.log('📦 Database ready (PostgreSQL)');

    // Seed with sample data (in production, usually handled by separate script, 
    // but keeping it here as per current logic)
    await seedDatabase();
    isInitialized = true;
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
    // Don't throw, let future requests try again or let them fail gracefully
  }
}

// Export for Lambda Entry Point and local usage
module.exports = { app, ensureInitialized };

// ═══════════════════════════════════════════════
// Server Start (AWS EB & Local)
// ═══════════════════════════════════════════════
if (require.main === module) {
  const PORT = process.env.PORT || 8080;

  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   🚀 ITL AutoPilot™ Backend v2.0             ║');
    console.log(`║   📡 Server running on port ${PORT}          ║`);
    console.log(`║   🌐 API: http://localhost:${PORT}/api       ║`);
    console.log('║   🗄️  Database: PostgreSQL                    ║');
    console.log('║   📋 Health: /api/health                     ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
  });

  // Trigger async initialization without blocking server bind.
  ensureInitialized().catch(err => {
    console.error('SERVER_START_ERROR:', err);
  });
}
