# Developer Setup Guide

## Prerequisites

- **Node.js** v18+ 
- **PostgreSQL** v14+
- **npm** or **yarn**

---

## Quick Start

### 1. Clone & Install

```bash
# Install backend dependencies
cd project/backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE mva_db;
\q

# Run migrations
cd backend
node setup-database.js
node setup-risk-tables.js
```

### 3. Environment Configuration

Create `backend/.env`:
```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=mva_db
DB_PASSWORD=your_password
DB_PORT=5432
```

### 4. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd Frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## Default Test Credentials

| Email | Password | Role |
|-------|----------|------|
| john@example.com | admin123 | manager |
| testadmin@example.com | test123 | admin |

---

## Project Scripts

### Backend
```bash
npm start          # Start server
npm run dev        # Start with nodemon (if configured)
node setup-database.js    # Initialize tables
node clear-database.js    # Clear all data
```

### Frontend
```bash
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview build
```

---

## Code Structure

```
project/
├── backend/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/           # Route handlers
│   │   ├── authController.js
│   │   ├── tripsController.js
│   │   ├── expenseController.js
│   │   ├── kpiController.js
│   │   ├── policyController.js
│   │   ├── riskController.js
│   │   ├── documentsController.js
│   │   ├── analyticsController.js
│   │   └── dashboardController.js
│   ├── routes/                # API routes
│   ├── uploads/               # File uploads
│   ├── server.js              # Express app
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── *.jsx              # Page components
│   │   ├── index.css          # Global styles
│   │   └── main.jsx           # App entry
│   ├── dist/                  # Production build
│   └── package.json
│
└── docs/                      # Documentation
```

---

## Adding New Features

### New API Endpoint

1. Create controller in `backend/controllers/`:
```javascript
// newController.js
export const getData = async (req, res) => {
  res.json({ success: true, data: [] });
};
```

2. Create route in `backend/routes/`:
```javascript
// newRoutes.js
import express from 'express';
import { getData } from '../controllers/newController.js';
const router = express.Router();
router.get('/', getData);
export default router;
```

3. Register in `server.js`:
```javascript
import newRoutes from './routes/newRoutes.js';
app.use('/api/new', newRoutes);
```

### New Frontend Page

1. Create component in `Frontend/src/`
2. Add route in `main.jsx`
3. Add navigation link in sidebar

---

## Deployment

### Production Build

```bash
# Build frontend
cd Frontend
npm run build

# The dist/ folder contains static files
# Serve with any static file server or CDN
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_PORT=5432
```

---

## Troubleshooting

**Database connection failed:**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

**Frontend can't reach API:**
- Check backend is running on port 5000
- Verify Vite proxy config

**Login fails:**
- Run `node setup-database.js` to create tables
- Check user exists in database
