# How to Run on a New System

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v15 or higher) - [Download](https://www.postgresql.org/download/)

## Step 1: Clone the Repository

```bash
git clone https://github.com/Venkatareddy26/admin-portal.git
cd admin-portal/project
```

## Step 2: Setup PostgreSQL Database

### Option A: Using pgAdmin (GUI)
1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database"
3. Name it: `mva_db`
4. Click "Save"

### Option B: Using Command Line
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mva_db;

# Exit
\q
```

## Step 3: Configure Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your PostgreSQL credentials
```

### Edit `.env` file:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_NAME=mva_db
```

**Important:** Replace `YOUR_POSTGRES_PASSWORD` with your actual PostgreSQL password.

## Step 4: Install Backend Dependencies & Setup Database

```bash
# Install packages
npm install

# Create database tables and seed data
node setup-database.js

# Start backend server
npm start
```

You should see:
```
🚀 Server running on port 5000
✅ Connected to PostgreSQL
```

## Step 5: Setup Frontend

Open a new terminal:

```bash
cd Frontend

# Install packages
npm install

# Start development server
npm run dev
```

You should see:
```
VITE ready at http://localhost:5173/
```

## Step 6: Access the Application

Open browser: **http://localhost:5173**

### Login Credentials

| Email | Password | Role |
|-------|----------|------|
| john@example.com | admin123 | manager |
| testadmin@example.com | test123 | admin |

---

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check `.env` credentials match your PostgreSQL setup
- Ensure database `mva_db` exists

### Port Already in Use
- Backend: Change port in `server.js` (default: 5000)
- Frontend: Vite auto-selects next available port

### Module Not Found
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

---

## Database Details

| Property | Value |
|----------|-------|
| Host | localhost |
| Port | 5432 |
| Database | mva_db |
| User | postgres |
| Password | (your PostgreSQL password) |

## API Endpoints

Backend runs on: `http://localhost:5000`

| Endpoint | Description |
|----------|-------------|
| POST /api/auth/login | Login |
| GET /api/trips | List trips |
| GET /api/expenses | List expenses |
| GET /api/kpi | Dashboard KPIs |
| GET /api/policy | List policies |
