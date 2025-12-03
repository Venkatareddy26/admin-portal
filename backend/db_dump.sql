-- Employee Travel Portal Database Dump
-- Run this file to create all tables and seed data
-- Usage: psql -U postgres -d mva_db -f db_dump.sql

-- =============================================
-- CREATE DATABASE (run separately if needed)
-- =============================================
-- CREATE DATABASE mva_db;

-- =============================================
-- DROP EXISTING TABLES (if any)
-- =============================================
DROP TABLE IF EXISTS trip_comments CASCADE;
DROP TABLE IF EXISTS trip_timeline CASCADE;
DROP TABLE IF EXISTS trip_attachments CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS risk_advisories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- CREATE TABLES
-- =============================================

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar TEXT,
    role VARCHAR(50) DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trips Table
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    destination VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    requested_by VARCHAR(255),
    requester_email VARCHAR(255),
    department VARCHAR(100),
    purpose TEXT,
    cost_estimate DECIMAL(10,2),
    risk_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    vendor VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    expense_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policies Table
CREATE TABLE policies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Draft',
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents Table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'other',
    expiry DATE,
    notes TEXT,
    size INTEGER,
    path TEXT,
    trip_id INTEGER REFERENCES trips(id) ON DELETE SET NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Documents
INSERT INTO documents (name, type, expiry, notes) VALUES
('US Passport', 'passport', '2028-06-15', 'Valid for international travel'),
('Schengen Visa', 'visa', '2025-03-20', 'Multiple entry visa'),
('COVID Vaccine Certificate', 'vaccine', '2026-01-01', 'Pfizer - 3 doses'),
('Travel Insurance Policy', 'insurance', '2025-12-31', 'Covers medical and trip cancellation');

-- Risk Advisories Table
CREATE TABLE risk_advisories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(50) DEFAULT 'low',
    region VARCHAR(100),
    country VARCHAR(100),
    source VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Trip Timeline Table
CREATE TABLE trip_timeline (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    actor VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);

-- Trip Comments Table
CREATE TABLE trip_comments (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trip Attachments Table
CREATE TABLE trip_attachments (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path TEXT,
    type VARCHAR(100),
    size INTEGER,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- CREATE INDEXES
-- =============================================
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_destination ON trips(destination);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_users_email ON users(email);

-- =============================================
-- SEED DATA - Users
-- =============================================
INSERT INTO users (name, email, password, role) VALUES
('john', 'john@example.com', 'admin123', 'manager'),
('Test Admin', 'testadmin@example.com', 'test123', 'admin'),
('Jane Smith', 'jane@example.com', 'password123', 'employee'),
('Finance User', 'finance@example.com', 'finance123', 'finance');

-- =============================================
-- SEED DATA - Trips
-- =============================================
INSERT INTO trips (destination, start_date, end_date, status, requested_by, requester_email, department, purpose, cost_estimate, risk_level) VALUES
('Tokyo', '2025-12-01', '2025-12-05', 'pending', 'Test User', 'test@example.com', 'Engineering', 'Client meeting', 3500.00, 'Medium'),
('London', '2025-12-10', '2025-12-15', 'approved', 'John Doe', 'john@example.com', 'Sales', 'Conference', 2500.00, 'Low'),
('New York', '2025-12-20', '2025-12-25', 'pending', 'Jane Smith', 'jane@example.com', 'Marketing', 'Training', 4000.00, 'Low');

-- =============================================
-- SEED DATA - Expenses
-- =============================================
INSERT INTO expenses (trip_id, category, vendor, amount, description, expense_date) VALUES
(NULL, 'Airfare', 'Delta Airlines', 450.00, 'Flight to NYC', '2025-11-24'),
(NULL, 'Airfare', 'United Airlines', 450.00, 'Return flight from NYC', '2025-11-24'),
(NULL, 'Hotel', 'Marriott', 350.00, 'Hotel in London', '2025-12-10'),
(1, 'Airfare', 'ANA Airlines', 1200.00, 'Flight to Tokyo', '2025-12-01'),
(2, 'Hotel', 'Hilton London', 800.00, '5 nights accommodation', '2025-12-10');

-- =============================================
-- SEED DATA - Policies
-- =============================================
INSERT INTO policies (title, name, description, category, status, content) VALUES
('Travel Policy', 'Travel Policy', 'Corporate travel guidelines and procedures', 'travel', 'Active', 'All business travel must be pre-approved by department manager. Economy class for flights under 6 hours.'),
('Leave Policy', 'Leave Policy', 'Employee leave and time-off policy', 'hr', 'Active', 'Employees are entitled to 20 days annual leave. Leave requests must be submitted 2 weeks in advance.'),
('Expense Policy', 'Expense Policy', 'Expense reimbursement guidelines', 'finance', 'Draft', 'All expenses must be submitted within 30 days with valid receipts.');

-- =============================================
-- SEED DATA - Risk Advisories
-- =============================================
INSERT INTO risk_advisories (title, description, severity, region, country, source, active) VALUES
('COVID-19 Travel Advisory', 'Check local requirements before travel', 'moderate', 'Global', NULL, 'WHO', true),
('Weather Alert', 'Typhoon season in Southeast Asia', 'high', 'Asia', 'Philippines', 'Weather Service', true),
('Political Unrest', 'Avoid non-essential travel', 'high', 'Europe', 'France', 'State Department', true);

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 'Database setup complete!' AS status;
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Trips: ' || COUNT(*) FROM trips;
SELECT 'Expenses: ' || COUNT(*) FROM expenses;
SELECT 'Policies: ' || COUNT(*) FROM policies;
