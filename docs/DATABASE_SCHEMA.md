# Database Schema

## PostgreSQL Database: `mva_db`

---

## Tables

### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',  -- employee, manager, finance, admin
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### trips
```sql
CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  destination VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',  -- pending, approved, rejected, active, completed
  requested_by VARCHAR(255),
  requester_email VARCHAR(255),
  department VARCHAR(100),
  purpose TEXT,
  cost_estimate DECIMAL(10,2),
  risk_level VARCHAR(20) DEFAULT 'Low',  -- Low, Medium, High
  created_at TIMESTAMP DEFAULT NOW()
);
```

### expenses
```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id),
  category VARCHAR(100) NOT NULL,  -- Airfare, Hotel, Meals, Transport, Other
  vendor VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE,
  receipt_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### policies
```sql
CREATE TABLE policies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  category VARCHAR(100),  -- travel, hr, finance, safety
  status VARCHAR(50) DEFAULT 'Draft',  -- Draft, Active, Archived
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### documents
```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mimetype VARCHAR(100),
  size INTEGER,
  category VARCHAR(100),
  description TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### risk_advisories
```sql
CREATE TABLE risk_advisories (
  id SERIAL PRIMARY KEY,
  location VARCHAR(255) NOT NULL,
  level VARCHAR(50),  -- Low, Medium, High, Critical
  title VARCHAR(255),
  description TEXT,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### trip_timeline
```sql
CREATE TABLE trip_timeline (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id),
  action VARCHAR(255),
  actor VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### trip_comments
```sql
CREATE TABLE trip_comments (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id),
  author VARCHAR(255),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Setup Commands

Run database setup:
```bash
cd backend
node setup-database.js      # Creates main tables
node setup-risk-tables.js   # Creates risk tables
```

Clear database:
```bash
node clear-database.js
```

---

## Connection Config

Environment variables (`.env`):
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=mva_db
DB_PASSWORD=postgres
DB_PORT=5432
```
