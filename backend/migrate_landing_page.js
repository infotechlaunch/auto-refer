const postgres = require('postgres');
require('dotenv').config();

async function migrate() {
  const sql = postgres(process.env.DATABASE_URL);
  
  console.log('🚀 Running Landing Page Migrations...');
  
  try {
    await sql`
      ALTER TABLE campaigns 
      ADD COLUMN IF NOT EXISTS capture_name BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS capture_phone BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS capture_email BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS capture_social BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS require_consent BOOLEAN DEFAULT true
    `;
    console.log('✅ Added Landing Page Settings to campaigns table');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
