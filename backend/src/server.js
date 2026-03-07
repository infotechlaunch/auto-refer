require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

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

// ═══════════════════════════════════════════════
// Initialize Express
// ═══════════════════════════════════════════════
const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════
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
// Health Check
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
// Error Handling
// ═══════════════════════════════════════════════
app.use(notFoundHandler);
app.use(errorHandler);

// ═══════════════════════════════════════════════
// Start Server
// ═══════════════════════════════════════════════
async function startServer() {
  try {
    // Initialize database (create tables)
    await initializeDatabase();
    console.log('📦 Database ready (PostgreSQL)');

    // Seed with sample data
    await seedDatabase();

    // Start Express
    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║   🚀 ITL AutoPilot™ Backend v2.0            ║');
      console.log(`║   📡 Server running on port ${PORT}             ║`);
      console.log(`║   🌐 API: http://localhost:${PORT}/api          ║`);
      console.log('║   🗄️  Database: PostgreSQL                    ║');
      console.log('║   📋 Health: /api/health                     ║');
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');
      console.log('📌 Available API Routes:');
      console.log('   POST   /api/auth/register');
      console.log('   POST   /api/auth/login');
      console.log('   GET    /api/auth/me');
      console.log('   GET    /api/dashboard');
      console.log('   GET    /api/campaigns');
      console.log('   POST   /api/campaigns');
      console.log('   GET    /api/qr-codes');
      console.log('   POST   /api/qr-codes');
      console.log('   GET    /api/review-intents');
      console.log('   GET    /api/referral-programs');
      console.log('   GET    /api/referral-links');
      console.log('   GET    /api/referral-events');
      console.log('   GET    /api/wallets');
      console.log('   GET    /api/payouts');
      console.log('   GET    /api/fraud-queue');
      console.log('   GET    /api/audit-logs');
      console.log('   GET    /api/voice-thanks');
      console.log('   POST   /api/voice-thanks/call');
      console.log('   GET    /api/incentives');
      console.log('   POST   /api/incentives');
      console.log('   POST   /api/referral-events/process-reward');
      console.log('');
      console.log('🔑 Default Credentials:');
      console.log('   Admin:  admin@itl.com / password123');
      console.log('   User:   user@demo.com / password123');
      console.log('');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;

// Trigger nodemon restart
