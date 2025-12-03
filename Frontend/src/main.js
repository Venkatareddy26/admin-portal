import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Eager load login (first page users see)
import LoginPage from './pages/login.js';
import RegisterPage from './pages/register.js';

// Lazy load all other pages for faster initial load
const TravelDashboard = lazy(() => import('./pages/dashboard.js'));
const Analytics = lazy(() => import('./pages/analytics.js'));
const PolicyBuilder = lazy(() => import('./pages/policy.js'));
const Trips = lazy(() => import('./pages/trips.js'));
const Risk = lazy(() => import('./pages/risk.js'));
const ExpensePage = lazy(() => import('./pages/expense.js'));
const Documents = lazy(() => import('./pages/documents.js'));
const ProfilePage = lazy(() => import('./pages/profile.js'));
const SettingsPage = lazy(() => import('./pages/settings.js'));
const Reports = lazy(() => import('./pages/reports.js'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg, #f3f4f6)' }}>
    <div className="text-center">
      <div className="inline-block w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
      <p className="text-sm" style={{ color: 'var(--muted, #6b7280)' }}>Loading...</p>
    </div>
  </div>
);

// Auth check helper
function isAuthenticated() {
  try {
    return !!localStorage.getItem('app_token');
  } catch (e) {
    return false;
  }
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes with lazy loading */}
      <Route path="/dashboard" element={<ProtectedRoute><TravelDashboard /></ProtectedRoute>} />
      <Route path="/policy" element={<ProtectedRoute><PolicyBuilder /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/risk" element={<ProtectedRoute><Risk /></ProtectedRoute>} />
      <Route path="/expense" element={<ProtectedRoute><ExpensePage /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      
      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

const el = document.getElementById('root');
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </React.StrictMode>
  );
}
