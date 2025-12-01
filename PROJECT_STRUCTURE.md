# Project Structure

## Clean Source Code Only

```
project/
├── backend/                      # Backend API Server
│   ├── config/
│   │   └── db.js                # Database configuration
│   ├── controllers/             # Business logic
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── documentsController.js
│   │   ├── expenseController.js
│   │   ├── kpiController.js
│   │   ├── policyController.js
│   │   ├── riskController.js
│   │   └── tripsController.js
│   ├── routes/                  # API routes
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
│   ├── uploads/                 # File uploads directory
│   ├── .env                     # Environment variables
│   ├── clear-database.js        # Database utility
│   ├── index.js                 # Alternative entry point
│   ├── package.json             # Dependencies
│   ├── server.js                # Main server file
│   ├── setup-database.js        # Database setup
│   └── setup-risk-tables.js     # Risk tables setup
│
├── Frontend/                     # React Frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── CorporateDonut.jsx
│   │   │   ├── DocGroup.jsx
│   │   │   ├── DocItem.jsx
│   │   │   ├── DocPreview.jsx
│   │   │   ├── DocSearch.jsx
│   │   │   ├── GlobalMap.jsx
│   │   │   ├── KpiCard.jsx
│   │   │   ├── ProfileMenu.jsx
│   │   │   ├── RiskFeed.jsx
│   │   │   ├── RiskModal.jsx
│   │   │   ├── TimeSeriesChart.jsx
│   │   │   ├── TripDetailModal.jsx
│   │   │   └── WidgetManager.jsx
│   │   ├── data/
│   │   │   └── mockData.js      # Mock data for development
│   │   ├── analytics.jsx        # Analytics page
│   │   ├── auth.js              # Auth utilities
│   │   ├── dashboard.jsx        # Main dashboard
│   │   ├── documents.jsx        # Documents page
│   │   ├── expense.jsx          # Expense page
│   │   ├── index.css            # Global styles
│   │   ├── login.jsx            # Login page
│   │   ├── main.jsx             # App entry point
│   │   ├── policy.jsx           # Policy page
│   │   ├── profile.jsx          # Profile page
│   │   ├── register.jsx         # Register page
│   │   ├── reports.jsx          # Reports page
│   │   ├── risk.js              # Risk utilities
│   │   ├── risk.jsx             # Risk page
│   │   ├── risk-updated.jsx     # Updated risk page
│   │   ├── settings.jsx         # Settings page
│   │   ├── sse.js               # Server-sent events
│   │   ├── theme-toggle.jsx     # Theme toggle component
│   │   └── trips.jsx            # Trips page
│   ├── dist/                    # Build output
│   ├── .env.local               # Frontend environment
│   ├── .gitignore
│   ├── index.html               # HTML template
│   ├── package.json             # Dependencies
│   ├── postcss.config.cjs       # PostCSS config
│   ├── README.md                # Frontend docs
│   ├── server.cjs               # Development server
│   ├── styles.css               # Additional styles
│   ├── tailwind.config.cjs      # Tailwind config
│   ├── vite.config.js           # Vite config
│   └── vite.config.mjs          # Vite config (ESM)
│
├── .git/                        # Git repository
├── HOW_TO_RUN.md               # Setup instructions
├── package-lock.json
└── README.md                    # Project documentation
```

## Key Files

### Backend
- **server.js** - Main Express server
- **config/db.js** - PostgreSQL connection
- **controllers/** - Business logic for each feature
- **routes/** - API endpoint definitions

### Frontend
- **main.jsx** - React app entry point
- **dashboard.jsx** - Main dashboard with KPIs
- **components/** - Reusable React components
- **vite.config.js** - Development server config

## Removed Files

All test files, logs, and extra documentation have been removed:
- ❌ test-*.js files
- ❌ *.log files
- ❌ Test documentation
- ❌ Mock API files
- ❌ Unused folders (mva-node, data)

## Clean Structure

Only essential source code and configuration files remain.
