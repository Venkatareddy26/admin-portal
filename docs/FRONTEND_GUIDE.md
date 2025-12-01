# Frontend Development Guide

## Tech Stack
- **React 18** - UI Framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation

---

## Project Structure

```
Frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── GlobalMap.jsx
│   │   ├── RiskFeed.jsx
│   │   ├── KpiCard.jsx
│   │   ├── CorporateDonut.jsx
│   │   ├── ProfileMenu.jsx
│   │   └── WidgetManager.jsx
│   ├── data/             # Static data files
│   ├── main.jsx          # App entry & routing
│   ├── dashboard.jsx     # Main dashboard
│   ├── trips.jsx         # Trip management
│   ├── expense.jsx       # Expense tracking
│   ├── policy.jsx        # Policy builder
│   ├── risk.jsx          # Risk management
│   ├── documents.jsx     # Document management
│   ├── analytics.jsx     # Analytics & reports
│   ├── login.jsx         # Login page
│   ├── register.jsx      # Registration
│   ├── profile.jsx       # User profile
│   ├── settings.jsx      # App settings
│   ├── auth.js           # Auth utilities
│   ├── sse.js            # Server-sent events
│   ├── index.css         # Global styles & themes
│   └── theme-toggle.jsx  # Theme switcher
├── index.html
├── vite.config.js
├── tailwind.config.cjs
└── package.json
```

---

## Getting Started

```bash
cd Frontend
npm install
npm run dev      # Development server (localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Routing

Routes defined in `main.jsx`:

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/login` | LoginPage | No |
| `/register` | RegisterPage | No |
| `/dashboard` | TravelDashboard | Yes |
| `/trips` | Trips | Yes |
| `/expense` | ExpensePage | Yes |
| `/policy` | PolicyBuilder | Yes |
| `/risk` | Risk | Yes |
| `/documents` | Documents | Yes |
| `/analytics` | Analytics | Yes |
| `/profile` | ProfilePage | Yes |
| `/settings` | SettingsPage | Yes |

---

## Theming

Themes defined in `index.css` using CSS variables:

```css
:root {
  --bg: #f3f4f6;
  --card: #ffffff;
  --card-text: #1f2937;
  --muted: #6b7280;
  --primary: #6366f1;
  --accent: #6366f1;
  --danger: #EF4444;
  --success: #059669;
}
```

**Available Themes:** light, dark, purple, ocean, sunset, neon

Toggle theme: `document.documentElement.setAttribute('data-theme', 'dark')`

---

## Authentication

Auth token stored in localStorage:

```javascript
// Set token after login
localStorage.setItem('app_token', token);
localStorage.setItem('currentUser', JSON.stringify(user));
localStorage.setItem('currentRole', user.role);

// Get token for API calls
const token = localStorage.getItem('app_token');

// Logout
localStorage.removeItem('app_token');
localStorage.removeItem('currentUser');
localStorage.removeItem('currentRole');
```

---

## API Integration

API calls use relative URLs (proxied via Vite):

```javascript
const API_BASE = '';  // Uses Vite proxy

// Example API call
const response = await fetch(`${API_BASE}/api/trips`);
const data = await response.json();
```

Vite proxy config in `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

---

## Key Components

### KpiCard
Displays KPI metrics with icon and value.
```jsx
<KpiCard title="Total Spend" value="$5,000" subtitle="This month" icon="💰" />
```

### CorporateDonut
Pie/donut chart for data visualization.

### ProfileMenu
User profile dropdown with role switching.

### ThemeToggle
Theme selector component.

---

## State Management

Uses React useState/useEffect. Key patterns:

```javascript
// Fetch data on mount
useEffect(() => {
  fetchTrips();
}, []);

// Listen to storage events (cross-tab sync)
useEffect(() => {
  function onStorage(e) {
    if (e.key === 'currentUser') {
      setUser(JSON.parse(e.newValue));
    }
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, []);
```

---

## Role-Based Access

Roles: `employee`, `manager`, `finance`, `admin`

```javascript
const currentRole = localStorage.getItem('currentRole');

// Conditional rendering
{(currentRole === 'manager' || currentRole === 'admin') && (
  <button onClick={approveTrip}>Approve</button>
)}
```

---

## Adding New Pages

1. Create component in `src/`:
```jsx
// src/newpage.jsx
export default function NewPage() {
  return <div>New Page Content</div>;
}
```

2. Add route in `main.jsx`:
```jsx
import NewPage from './newpage.jsx';

<Route path="/newpage" element={isAuthed ? <NewPage /> : <Navigate to="/login" />} />
```

3. Add navigation in sidebar (dashboard.jsx):
```jsx
<button onClick={() => navigate('/newpage')}>New Page</button>
```

---

## Styling Guidelines

- Use Tailwind classes for layout
- Use CSS variables for colors (theme support)
- Inline styles for dynamic values

```jsx
<div 
  className="p-4 rounded-xl shadow-sm"
  style={{ background: 'var(--card)', color: 'var(--card-text)' }}
>
```
