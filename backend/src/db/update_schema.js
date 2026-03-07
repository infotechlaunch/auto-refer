const pg = require('postgres');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sql = pg(process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/ai_review_mgnt-01');

async function migrate() {
  console.log('Running schema update...');
  try {
    // Add columns to campaigns if they don't exist
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS capture_name BOOLEAN DEFAULT true`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS capture_phone BOOLEAN DEFAULT true`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS capture_email BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS capture_social BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS require_consent BOOLEAN DEFAULT true`;
    
    // Add columns to referral_events if missing (from previous sessions)
    await sql`ALTER TABLE referral_events ADD COLUMN IF NOT EXISTS amount REAL DEFAULT 0`;
    await sql`ALTER TABLE referral_events ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0`;
    await sql`ALTER TABLE referral_events ADD COLUMN IF NOT EXISTS hold_until TIMESTAMPTZ`;
    await sql`ALTER TABLE referral_events ADD COLUMN IF NOT EXISTS notes TEXT`;

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
