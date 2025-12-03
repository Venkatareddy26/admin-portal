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
# Run the SQL dump to create tables and seed data:
psql -U postgres -d mva_db -f backend/db_dump.sql

# 3. Configure Backend
cd backend
cp .env.example .env  # Edit with your DB credentials
npm install

# 4. Start Backend
node server.js  # Runs on http://localhost:5000

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
PORT=5000
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
| PATCH | `/api/trips/:id` | Update trip |
| DELETE | `/api/trips/:id` | Delete trip |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### KPI & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kpi?range=30d` | KPI metrics (airfare, hotels, trips count) |
| GET | `/api/dashboard` | Dashboard summary |
| GET | `/api/analytics` | Analytics data |

### Policy
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/policy` | List policies |
| POST | `/api/policy` | Create policy |
| PUT | `/api/policy/:id` | Update policy |
| DELETE | `/api/policy/:id` | Delete policy |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List documents |
| POST | `/api/documents` | Upload document |
| PUT | `/api/documents/:id` | Update document |
| DELETE | `/api/documents/:id` | Delete document |

## ✅ API Test Results

All endpoints tested and working:

| Endpoint | Status | Sample Response |
|----------|--------|-----------------|
| `/api/trips` | ✅ Working | Returns trips with timeline, comments |
| `/api/expenses` | ✅ Working | Returns categorized expenses |
| `/api/kpi?range=30d` | ✅ Working | Returns airfare, hotels, total spend |
| `/api/policy` | ✅ Working | Returns travel, leave, expense policies |
| `/api/documents` | ✅ Working | Returns passport, visa, insurance docs |

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
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── documentsController.js
│   │   ├── expenseController.js
│   │   ├── kpiController.js
│   │   ├── policyController.js
│   │   ├── riskController.js
│   │   └── tripsController.js
│   ├── routes/
│   │   ├── analyticsRoutes.js
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── documentsRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── kpiRoutes.js
│   │   ├── policyRoutes.js
│   │   ├── riskRoutes.js
│   │   ├── tripsRoutes.js
│   │   └── userRoutes.js
│   ├── uploads/               # File uploads directory
│   ├── .env.example
│   ├── db_dump.sql            # Database schema & seed data
│   ├── package.json
│   └── server.js              # Express entry point
│
├── Frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── CorporateDonut.js
│   │   │   ├── GlobalMap.js
│   │   │   ├── KpiCard.js
│   │   │   ├── ProfileMenu.js
│   │   │   ├── RiskFeed.js
│   │   │   ├── theme-toggle.js
│   │   │   ├── TimeSeriesChart.js
│   │   │   ├── TripDetailModal.js
│   │   │   └── WidgetManager.js
│   │   ├── pages/             # Page components (routes)
│   │   │   ├── analytics.js
│   │   │   ├── dashboard.js
│   │   │   ├── documents.js
│   │   │   ├── expense.js
│   │   │   ├── login.js
│   │   │   ├── policy.js
│   │   │   ├── profile.js
│   │   │   ├── register.js
│   │   │   ├── reports.js
│   │   │   ├── risk.js
│   │   │   ├── settings.js
│   │   │   └── trips.js
│   │   ├── services/          # API & external services
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   └── sse.js
│   │   ├── styles/            # CSS stylesheets
│   │   │   ├── analytics.css
│   │   │   ├── dashboard.css
│   │   │   ├── documents.css
│   │   │   ├── expense.css
│   │   │   ├── policy.css
│   │   │   ├── risk.css
│   │   │   └── trips.css
│   │   ├── utils/             # Utility functions
│   │   │   └── config.js
│   │   ├── index.css          # Global styles
│   │   └── main.js            # React entry point
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.cjs
│   ├── tailwind.config.cjs
│   └── vite.config.js
│
├── docs/
│   ├── BACKEND_API.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEVELOPER_SETUP.md
│   └── FRONTEND_GUIDE.md
│
├── .gitignore
├── HOW_TO_RUN.md
├── PROJECT_STRUCTURE.md
└── README.md
```

## 🔄 Recent Changes

### Code Organization (Latest)
- ✅ Converted all `.jsx` files to `.js` extension
- ✅ Separated CSS styles into dedicated `styles/` folder
- ✅ Organized pages into `pages/` folder
- ✅ Moved services to `services/` folder (api.js, auth.js, sse.js)
- ✅ Moved utilities to `utils/` folder (config.js)
- ✅ Removed unused files and build artifacts
- ✅ Updated Vite config to support JSX in .js files

### Database
- ✅ Fixed policies table schema (added title, category, status columns)
- ✅ Fixed documents table schema (added name, type, expiry columns)
- ✅ All seed data loaded correctly

## 📚 Documentation

- [Developer Setup](docs/DEVELOPER_SETUP.md)
- [Backend API](docs/BACKEND_API.md)
- [Frontend Guide](docs/FRONTEND_GUIDE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)

## 🚀 Deployment

### Backend
```bash
cd backend
npm install --production
node server.js
```

### Frontend
```bash
cd Frontend
npm install
npm run build    # Creates dist/ folder
npm run preview  # Preview production build
```

## 📄 License

MIT
