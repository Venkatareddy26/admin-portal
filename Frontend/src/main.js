import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Page imports
import Reports from './reports.js';
import LoginPage from './login.js';
import RegisterPage from './register.js';
import TravelDashboard from './dashboard.js';
import Analytics from './analytics.js';
import PolicyBuilder from './policy.js';
import Trips from './trips.js';
import Risk from './risk.js';
import ExpensePage from './expense.js';
import Documents from './documents.js';
import ProfilePage from './profile.js';
import SettingsPage from './settings.js';

function AppRoutes() {
  const isAuthed = (() => {
    try {
      return !!localStorage.getItem('app_token');
    } catch (e) {
      return false;
    }
  })();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={isAuthed ? <TravelDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/policy" element={isAuthed ? <PolicyBuilder /> : <Navigate to="/login" replace />} />
      <Route path="/profile" element={isAuthed ? <ProfilePage /> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={isAuthed ? <SettingsPage /> : <Navigate to="/login" replace />} />
      <Route path="/trips" element={isAuthed ? <Trips /> : <Navigate to="/login" replace />} />
      <Route path="/reports" element={isAuthed ? <Reports /> : <Navigate to="/login" replace />} />
      <Route path="/risk" element={isAuthed ? <Risk /> : <Navigate to="/login" replace />} />
      <Route path="/expense" element={isAuthed ? <ExpensePage /> : <Navigate to="/login" replace />} />
      <Route path="/documents" element={isAuthed ? <Documents /> : <Navigate to="/login" replace />} />
      <Route path="/analytics" element={isAuthed ? <Analytics /> : <Navigate to="/login" replace />} />
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
