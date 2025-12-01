# Employee Travel Portal

A full-stack enterprise travel management system for corporate travel booking, expense tracking, and compliance.

![Dashboard](https://img.shields.io/badge/Status-Active-brightgreen) ![Node](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## ✨ Features

- 🔐 **Authentication** - User registration, login, role-based access control
- ✈️ **Trip Management** - Create, approve, track travel requests with workflow
- 💰 **Expense Tracking** - Log and categorize travel expenses by type
- 📊 **KPI Dashboard** - Real-time metrics, charts, and analytics
- 📋 **Policy Management** - Create and manage travel policies
- ⚠️ **Risk Management** - Travel advisories and safety alerts
- 📄 **Document Management** - Upload and manage travel documents
- 🗺️ **Global Map** - Interactive map showing travel destinations
- 🎨 **Theme Support** - Light and dark themes

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Leaflet |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | Token-based authentication |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Venkatareddy26/admin-portal.git
cd admin-portal/project

# 2. Setup Database
# Create PostgreSQL database named 'mva_db'

# 3. Configure Backend
cd backend
cp .env.example .env  # Edit with your DB credentials
npm install
node setup-database.js

# 4. Start Backend
npm start  # Runs on http://localhost:5000

# 5. Setup Frontend (new terminal)
cd ../Frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### Environment Variables

Create `backend/.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=mva_db
```

## 🔑 Test Credentials

| Email | Password | Role |
|-------|----------|------|
| john@example.com | admin123 | manager |
| testadmin@example.com | test123 | admin |

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | User logout |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | List all trips |
| POST | `/api/trips` | Create new trip |
| PUT | `/api/trips/:id` | Update trip |
| DELETE | `/api/trips/:id` | Delete trip |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |

### Dashboard & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kpi` | KPI metrics |
| GET | `/api/dashboard` | Dashboard summary |
| GET | `/api/analytics` | Analytics data |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/policy` | List policies |
| GET | `/api/documents` | List documents |

## ✅ API Test Results

All endpoints tested and working:

| Endpoint | Status |
|----------|--------|
| `/api/auth/login` | ✅ Working |
| `/api/trips` | ✅ Working |
| `/api/expenses` | ✅ Working |
| `/api/kpi` | ✅ Working |
| `/api/dashboard` | ✅ Working |
| `/api/analytics` | ✅ Working |
| `/api/policy` | ✅ Working |
| `/api/documents` | ✅ Working |

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| employee | Create trips, view own data |
| manager | Approve/reject trips, view team data |
| finance | Manage expenses, generate reports |
| admin | Full system access |

## 📁 Project Structure

```
project/
├── backend/
│   ├── controllers/     # API controllers
│   ├── routes/          # Express routes
│   ├── config/          # Database config
│   └── server.js        # Entry point
├── Frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── dashboard.jsx
│   │   ├── trips.jsx
│   │   └── ...
│   └── index.html
└── docs/                # Documentation
```

## 📚 Documentation

- [Developer Setup](docs/DEVELOPER_SETUP.md)
- [Backend API](docs/BACKEND_API.md)
- [Frontend Guide](docs/FRONTEND_GUIDE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)

## 📄 License

MIT
