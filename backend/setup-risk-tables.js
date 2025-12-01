import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

async function setupRiskTables() {
  const dbClient = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'mva_db',
    password: process.env.DB_PASSWORD || 'admin',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    await dbClient.connect();
    console.log('✅ Connected to mva_db');

    // Create risk_advisories table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS risk_advisories (
        id SERIAL PRIMARY KEY,
        destination VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'other',
        severity VARCHAR(50) DEFAULT 'medium',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table risk_advisories created');

    // Create traveler_safety table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS traveler_safety (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        location JSONB,
        opt_in BOOLEAN DEFAULT false,
        last_check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sos_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table traveler_safety created');

    console.log('\n🎉 Risk & Safety tables created successfully!');
    console.log('\n📝 Tables created:');
    console.log('- risk_advisories (for travel advisories)');
    console.log('- traveler_safety (for traveler tracking)');

    await dbClient.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up risk tables:', err);
    process.exit(1);
  }
}

setupRiskTables();
