# 🚀 How to Run the Application

## Quick Start Guide

### Prerequisites
- Node.js installed (v16 or higher)
- PostgreSQL installed and running
- Two terminal windows

---

## Step 1: Start Backend Server

### Option A: Using Terminal

1. Open a terminal/command prompt
2. Navigate to backend folder:
```bash
cd project/backend
```

3. Start the server:
```bash
node server.js
```

You should see:
```
🚀 Server running on port 5000
✅ Connected to PostgreSQL
```

**Backend is now running at:** http://localhost:5000

---

## Step 2: Start Frontend Server

### Option A: Using Terminal

1. Open a **NEW** terminal/command prompt (keep backend running)
2. Navigate to frontend folder:
```bash
cd project/Frontend
```

3. Start the development server:
```bash
npm run dev
```

You should see:
```
VITE v5.4.21  ready in 2845 ms
➜  Local:   http://localhost:5173/
```

**Frontend is now running at:** http://localhost:5173

---

## Step 3: Access the Application

Open your browser and go to:
```
http://localhost:5173
```

### Login Credentials

**Manager Account:**
- Email: `john@example.com`
- Password: `john@11`

**Employee Account:**
- Email: `test@example.com`
- Password: `test123`

---

## Alternative: Run Both Servers Simultaneously

### Windows (PowerShell)

Open PowerShell and run:
```powershell
# Start backend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd project/backend; node server.js"

# Wait 2 seconds
Start-Sleep -Seconds 2

# Start frontend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd project/Frontend; npm run dev"
```

### Using the Background Process Tool

The servers are already running in the background! Check with:
```bash
# They should already be running from the tests
# Backend: http://localhost:5000
# Frontend: http://localhost:5173
```

---

## Verify Everything is Working

### Check Backend
Open browser to: http://localhost:5000
You should see: "✅ Backend is running successfully!"

### Check Frontend
Open browser to: http://localhost:5173
You should see the login page

### Check API
Open browser to: http://localhost:5000/api/kpi
You should see JSON with KPI data

---

## Troubleshooting

### Backend Won't Start

**Problem:** Port 5000 already in use
```bash
# Find and kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Then restart:
cd project/backend
node server.js
```

**Problem:** Database connection failed
```bash
# Check PostgreSQL is running
# Verify credentials in project/backend/.env:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=mva_db
```

### Frontend Won't Start

**Problem:** Port 5173 already in use
```bash
# Kill the process and restart
# Or change port in vite.config.js
```

**Problem:** Cannot connect to backend
```bash
# Check project/Frontend/.env.local:
VITE_API_BASE=http://localhost:5000

# Make sure backend is running first
```

---

## Stop the Servers

### If running in terminals:
Press `Ctrl + C` in each terminal window

### If running in background:
Close the PowerShell windows or use Task Manager

---

## Development Workflow

### Typical Development Session

1. **Start Backend:**
```bash
cd project/backend
node server.js
```

2. **Start Frontend (new terminal):**
```bash
cd project/Frontend
npm run dev
```

3. **Make changes to code** - both servers auto-reload

4. **Test your changes** at http://localhost:5173

5. **Stop servers** with Ctrl+C when done

---

## Running Tests

After starting both servers, run tests:

```bash
# Run all tests
cd project
node run-all-tests.js

# Or individual tests
node test-all-apis.js
node test-frontend-pages.js
node test-integration.js
```

---

## Production Build

### Build Frontend for Production

```bash
cd project/Frontend
npm run build
```

This creates optimized files in `dist/` folder

### Preview Production Build

```bash
npm run preview
```

---

## Environment Configuration

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=mva_db
PORT=5000
```

### Frontend (.env.local)
```env
VITE_API_BASE=http://localhost:5000
```

---

## Quick Reference

| Service | URL | Command |
|---------|-----|---------|
| Backend | http://localhost:5000 | `cd project/backend && node server.js` |
| Frontend | http://localhost:5173 | `cd project/Frontend && npm run dev` |
| API Docs | http://localhost:5000/api | - |
| Tests | - | `node run-all-tests.js` |

---

## Need Help?

1. Check both servers are running
2. Verify database is connected
3. Check browser console for errors
4. Review logs in `backend/server.log`
5. Run tests to verify system health

---

**That's it! You're ready to go! 🎉**
