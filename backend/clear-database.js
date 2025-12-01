import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

async function clearDatabase() {
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

    // Clear all data from tables (but keep the structure)
    console.log('\n🗑️  Clearing all data...');
    
    // Delete in correct order (respecting foreign keys)
    await dbClient.query('DELETE FROM documents');
    console.log('✅ Cleared documents table');
    
    await dbClient.query('DELETE FROM expenses');
    console.log('✅ Cleared expenses table');
    
    await dbClient.query('DELETE FROM trips');
    console.log('✅ Cleared trips table');
    
    await dbClient.query('DELETE FROM policies');
    console.log('✅ Cleared policies table');
    
    await dbClient.query('DELETE FROM users');
    console.log('✅ Cleared users table');

    // Reset sequences (auto-increment counters)
    await dbClient.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await dbClient.query('ALTER SEQUENCE trips_id_seq RESTART WITH 1');
    await dbClient.query('ALTER SEQUENCE expenses_id_seq RESTART WITH 1');
    await dbClient.query('ALTER SEQUENCE documents_id_seq RESTART WITH 1');
    await dbClient.query('ALTER SEQUENCE policies_id_seq RESTART WITH 1');
    console.log('✅ Reset all ID sequences');

    console.log('\n🎉 Database cleared successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Create your first user at: http://localhost:5173/register');
    console.log('2. Login and start adding trips and expenses');
    console.log('3. All data will be stored in the database');

    await dbClient.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing database:', err);
    process.exit(1);
  }
}

clearDatabase();
