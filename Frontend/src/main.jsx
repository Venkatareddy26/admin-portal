import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Reports from './reports.jsx';
import LoginPage from './login.jsx';
import RegisterPage from './register.jsx';
import './index.css';
import TravelDashboard from './dashboard.jsx';
import Analytics from './analytics.jsx';
import PolicyBuilder from './policy.jsx';
import Trips from './trips.jsx';
import Risk from './risk.jsx';
import ExpensePage from './expense.jsx';
import Documents from './documents.jsx';
import ProfilePage from './profile.jsx';
import SettingsPage from './settings.jsx';
import { useNavigate, Navigate } from 'react-router-dom';

// Removed inline Reports function

function AppRoutes(){
	const isAuthed = (() => { try{ return !!localStorage.getItem('app_token'); }catch(e){ return false; }})();
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
