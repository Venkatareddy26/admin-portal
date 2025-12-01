import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

async function setupDatabase() {
  // First connect to default postgres database to create mva_db
  const adminClient = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create database if it doesn't exist
    const dbCheckResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = 'mva_db'`
    );

    if (dbCheckResult.rows.length === 0) {
      await adminClient.query('CREATE DATABASE mva_db');
      console.log('✅ Database mva_db created');
    } else {
      console.log('✅ Database mva_db already exists');
    }

    await adminClient.end();

    // Now connect to mva_db to create tables
    const dbClient = new Client({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'mva_db',
      password: process.env.DB_PASSWORD || 'admin',
      port: parseInt(process.env.DB_PORT || '5432'),
    });

    await dbClient.connect();
    console.log('✅ Connected to mva_db');

    // Create tables
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        avatar TEXT,
        role VARCHAR(50) DEFAULT 'employee',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table users created');

    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        destination VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'pending',
        requested_by VARCHAR(255),
        requester_email VARCHAR(255),
        department VARCHAR(100),
        purpose TEXT,
        cost_estimate DECIMAL(10, 2),
        risk_level VARCHAR(50) DEFAULT 'Low',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table trips created');

    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER REFERENCES trips(id),
        category VARCHAR(100),
        vendor VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        expense_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table expenses created');

    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        trip_id INTEGER REFERENCES trips(id),
        title VARCHAR(255) NOT NULL,
        file_path TEXT,
        file_type VARCHAR(50),
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table documents created');

    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        rules JSONB,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table policies created');

    // Insert sample data
    const userCheck = await dbClient.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      await dbClient.query(`
        INSERT INTO users (name, email, password, role) VALUES
        ('Admin User', 'admin@example.com', 'admin123', 'manager'),
        ('John Doe', 'john@example.com', 'password', 'employee'),
        ('Jane Smith', 'jane@example.com', 'password', 'finance')
      `);
      console.log('✅ Sample users inserted');
    }

    const tripCheck = await dbClient.query('SELECT COUNT(*) FROM trips');
    if (parseInt(tripCheck.rows[0].count) === 0) {
      await dbClient.query(`
        INSERT INTO trips (destination, start_date, end_date, status, requested_by, requester_email, department, purpose, cost_estimate, risk_level) VALUES
        ('New York', '2025-11-15', '2025-11-20', 'approved', 'John Doe', 'john@example.com', 'Sales', 'Client meeting', 2500.00, 'Low'),
        ('London', '2025-12-01', '2025-12-05', 'pending', 'Jane Smith', 'jane@example.com', 'Marketing', 'Conference', 3500.00, 'Medium'),
        ('Tokyo', '2025-11-25', '2025-11-30', 'approved', 'John Doe', 'john@example.com', 'Engineering', 'Tech summit', 4500.00, 'Low')
      `);
      console.log('✅ Sample trips inserted');
    }

    const expenseCheck = await dbClient.query('SELECT COUNT(*) FROM expenses');
    if (parseInt(expenseCheck.rows[0].count) === 0) {
      await dbClient.query(`
        INSERT INTO expenses (trip_id, category, vendor, amount, description, expense_date) VALUES
        (1, 'Airfare', 'Delta Airlines', 800.00, 'Round trip flight', '2025-11-15'),
        (1, 'Hotel', 'Marriott', 1200.00, '5 nights accommodation', '2025-11-15'),
        (1, 'Car Rental', 'Enterprise', 300.00, 'Car rental for 5 days', '2025-11-15'),
        (2, 'Airfare', 'British Airways', 1500.00, 'Round trip flight', '2025-12-01'),
        (2, 'Hotel', 'Hilton', 1800.00, '4 nights accommodation', '2025-12-01')
      `);
      console.log('✅ Sample expenses inserted');
    }

    await dbClient.end();
    console.log('\n🎉 Database setup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database setup error:', err);
    process.exit(1);
  }
}

setupDatabase();
