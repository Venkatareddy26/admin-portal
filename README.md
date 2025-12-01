# Employee Travel Portal

A full-stack enterprise travel management system for corporate travel booking, expense tracking, and compliance.

## Features

- 🔐 **Authentication** - User registration, login, role-based access
- ✈️ **Trip Management** - Create, approve, track travel requests
- 💰 **Expense Tracking** - Log and categorize travel expenses
- 📊 **KPI Dashboard** - Real-time metrics and analytics
- 📋 **Policy Management** - Create and manage travel policies
- ⚠️ **Risk Management** - Travel advisories and safety alerts
- 📄 **Document Management** - Upload and manage travel documents
- 🎨 **Multiple Themes** - Light, dark, and custom themes

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | Token-based (Base64) |

## Quick Start

```bash
# 1. Setup Database
psql -U postgres -c "CREATE DATABASE mva_db;"

# 2. Install & Run Backend
cd backend
npm install
node setup-database.js
npm start

# 3. Install & Run Frontend
cd Frontend
npm install
npm run dev
```

**Access:** http://localhost:5173

**Test Login:** `john@example.com` / `admin123`

## Documentation

- [Developer Setup](docs/DEVELOPER_SETUP.md)
- [Backend API](docs/BACKEND_API.md)
- [Frontend Guide](docs/FRONTEND_GUIDE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| POST /api/auth/login | User authentication |
| GET /api/trips | List all trips |
| GET /api/expenses | List expenses |
| GET /api/kpi | Dashboard KPIs |
| GET /api/policy | List policies |
| GET /api/documents | List documents |
| GET /api/risk/advisories | Travel advisories |

## User Roles

| Role | Permissions |
|------|-------------|
| employee | Create trips, view own data |
| manager | Approve/reject trips |
| finance | Manage expenses, reports |
| admin | Full system access |

## License

MIT
