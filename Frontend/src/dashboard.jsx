import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './theme-toggle';
import GlobalMap from './components/GlobalMap';
import RiskFeed from './components/RiskFeed';
import WidgetManager from './components/WidgetManager';
import CorporateDonut from './components/CorporateDonut';
import sse from './sse';
import ProfileMenu from './components/ProfileMenu';
import KpiCard from './components/KpiCard';

const API_BASE = '';

const INITIAL_SUMMARY = {
  airfare: 0, hotels: 0, cars: 0, total: 0,
  trips: 0, travelers: 0, destinations: 0,
  avgPlanBook: 'N/A', avgApproval: 'N/A',
  flightsCount: 0, hotelsCount: 0, carsCount: 0,
  hotelNights: 0, carDays: 0,
};

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#4ade80'];

export default function TravelDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    try { const raw = localStorage.getItem('dashboard_widgets'); if(raw) return JSON.parse(raw); } catch {}
    return ['tripFrequency','topDestinations','riskFeed'];
  });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')) || { name: 'Admin', email: 'admin@example.com' } } catch { return { name: 'Admin', email: 'admin@example.com' } }
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const profileMenuRef = useRef(null);
  const profileToggleRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});
  const [menuAlign, setMenuAlign] = useState('right');
  const [roleLocal, setRoleLocal] = useState(() => localStorage.getItem('currentRole') || 'employee');
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [trips, setTrips] = useState([]);
  const [tripFrequencyData, setTripFrequencyData] = useState([]);
  const [topDestinationsData, setTopDestinationsData] = useState([]);
  const [reasonsData, setReasonsData] = useState([]);

  // Fetch metrics
  useEffect(() => {
    let mounted = true;
    async function fetchMetrics() {
      try {
        const kpiRes = await fetch(`${API_BASE}/api/kpi?range=30d`);
        if (kpiRes?.ok) {
          const kjson = await kpiRes.json();
          if (kjson?.success && kjson.kpis) {
            const k = kjson.kpis;
            if (mounted) setSummary({
              airfare: Number(k.total_airfare) || 0,
              hotels: Number(k.total_hotels) || 0,
              cars: Number(k.total_cars) || 0,
              total: Number(k.total_spend) || 0,
              trips: Number(k.trips_count) || 0,
              travelers: Number(k.distinct_travelers) || 0,
              destinations: Number(k.destinations_count) || 0,
              avgPlanBook: k.avg_booking_lead_days ? `${Math.round(k.avg_booking_lead_days * 10) / 10} days` : 'N/A',
              avgApproval: 'N/A',
              flightsCount: Number(k.flights_count) || 0,
              hotelsCount: Number(k.hotels_count) || 0,
              carsCount: Number(k.cars_count) || 0,
              hotelNights: Number(k.hotel_nights) || 0,
              carDays: Number(k.car_days) || 0
            });
          }
        }
      } catch (err) { console.warn('fetchMetrics failed', err); }
    }
    fetchMetrics();
    const tid = setInterval(fetchMetrics, 15000);
    return () => { mounted = false; clearInterval(tid); };
  }, []);

  // Fetch trips data
  useEffect(() => {
    async function fetchTrips() {
      try {
        const res = await fetch(`${API_BASE}/api/trips`);
        if (res?.ok) {
          const data = await res.json();
          if (data.success && data.trips) {
            setTrips(data.trips);
            
            // Trip frequency (last 6 months)
            const monthCounts = {};
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
              const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
              monthCounts[d.toISOString().slice(0, 7)] = 0;
            }
            data.trips.forEach(trip => {
              if (trip.start) {
                const key = trip.start.slice(0, 7);
                if (monthCounts.hasOwnProperty(key)) monthCounts[key]++;
              }
            });
            setTripFrequencyData(Object.entries(monthCounts).map(([month, count]) => ({
              month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
              count
            })));
            
            // Top destinations
            const destCounts = {};
            data.trips.forEach(trip => {
              if (trip.destination) destCounts[trip.destination] = (destCounts[trip.destination] || 0) + 1;
            });
            setTopDestinationsData(Object.entries(destCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value })));
            
            // Reasons
            const reasonCounts = {};
            data.trips.forEach(trip => {
              const purpose = trip.purpose || 'Other';
              let category = 'Other';
              if (/meeting|client/i.test(purpose)) category = 'Client Meetings';
              else if (/conference/i.test(purpose)) category = 'Conferences';
              else if (/training/i.test(purpose)) category = 'Training';
              else if (/site|visit/i.test(purpose)) category = 'Site Visits';
              else if (/sales/i.test(purpose)) category = 'Sales';
              reasonCounts[category] = (reasonCounts[category] || 0) + 1;
            });
            setReasonsData(Object.entries(reasonCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));
          }
        }
      } catch (err) { console.warn('fetchTrips failed', err); }
    }
    fetchTrips();
    const tid = setInterval(fetchTrips, 30000);
    return () => clearInterval(tid);
  }, []);

  // SSE for realtime updates
  useEffect(() => {
    function onTrip(e) {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        setSummary(prev => ({
          ...prev,
          trips: (Number(prev.trips) || 0) + 1,
          travelers: (Number(prev.travelers) || 0) + 1,
          destinations: (Number(prev.destinations) || 0) + 1,
          total: (Number(prev.total) || 0) + (parseFloat(data.costEstimate || 0) || 0)
        }));
      } catch (err) { console.warn('sse parse error', err); }
    }
    sse.on('trip-created', onTrip);
    return () => sse.off('trip-created', onTrip);
  }, []);

  // Profile menu handlers
  useEffect(() => {
    function onClick(e) { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    function positionMenu() {
      const btn = profileToggleRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const menuTop = Math.min(Math.max(rect.bottom + 8, 12), window.innerHeight - 40);
      setMenuStyle({ top: `${menuTop}px`, right: '12px' });
    }
    positionMenu();
    window.addEventListener('resize', positionMenu);
    return () => window.removeEventListener('resize', positionMenu);
  }, [profileOpen]);

  function updateRole(r) {
    localStorage.setItem('currentRole', r);
    setRoleLocal(r);
    window.dispatchEvent(new CustomEvent('role-updated', { detail: r }));
  }

  function onPickAvatar(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...user, avatar: reader.result };
      setUser(updated);
      localStorage.setItem('currentUser', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    const updated = { ...user };
    delete updated.avatar;
    setUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));
  }

  async function doLogout() {
    try {
      const token = localStorage.getItem('app_token');
      if (token) await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }).catch(() => {});
    } catch {}
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('app_token');
    setUser({ name: 'Guest', email: '' });
    setRoleLocal('employee');
    navigate('/login', { replace: true });
  }

  const isActive = (path) => location?.pathname === path;
  const go = (path, opts) => opts ? navigate(path, opts) : navigate(path);
  const toggleExpand = (id) => setExpandedCard(s => s === id ? null : id);

  return (
    <div className="min-h-screen app-root font-sans text-gray-800">
      <div className="flex">
        {/* Sidebar */}
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <span className="sidebar-logo-icon">✈</span>
            <span className="sidebar-logo">Employee Travel Portal</span>
          </div>

          <div className="sidebar-user" ref={profileRef}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="sidebar-user-avatar object-cover" />
            ) : (
              <div className="sidebar-user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
            )}
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-email">{user?.email || ''}</div>
            </div>
            <button ref={profileToggleRef} type="button" className={`toggle-btn ${profileOpen ? 'profile-open' : ''}`} onClick={() => setProfileOpen(s => !s)} style={{color:'rgba(255,255,255,0.7)'}}>▼</button>

            {profileOpen && createPortal(
              <>
                <div className={`profile-backdrop ${profileOpen ? 'open' : ''}`} onClick={() => setProfileOpen(false)} />
                <FocusTrap active={profileOpen} focusTrapOptions={{ clickOutsideDeactivates: true, fallbackFocus: () => profileToggleRef.current || document.body }}>
                  <div ref={profileMenuRef} style={menuStyle} data-align={menuAlign} className={`profile-menu ${profileOpen ? 'open' : ''}`} role="menu">
                    <ProfileMenu user={user} role={roleLocal} onPickAvatar={onPickAvatar} onSaveName={(name) => { const u = {...user, name}; setUser(u); localStorage.setItem('currentUser', JSON.stringify(u)); }} onRemoveAvatar={removeAvatar} onNavigate={go} onLogout={doLogout} updateRole={updateRole} closeMenu={() => setProfileOpen(false)} />
                  </div>
                </FocusTrap>
              </>, document.body
            )}
          </div>

          <nav className="sidebar-nav">
            {[
              { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
              { path: '/analytics', icon: '📊', label: 'Analytics' },
              { path: '/documents', icon: '📄', label: 'Documents' },
              { path: '/expense', icon: '💳', label: 'Expense' },
              { path: '/policy', icon: '📋', label: 'Policy' },
              { path: '/risk', icon: '⚠️', label: 'Risk' },
              { path: '/trips', icon: '🗓️', label: 'Trips' },
              { path: '/admin/trips', icon: '⚙️', label: 'Admin' },
            ].map(item => (
              <button key={item.path} title={item.label} className={`nav-button ${isActive(item.path) ? 'nav-active' : ''}`} onClick={() => go(item.path)} type="button">
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content flex-1">
          <div className="p-8">
            {/* Header */}
            <header className="mb-8 flex items-center justify-between pb-6 border-b border-gray-200">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Travel Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name || 'Admin'}</p>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </header>

            {/* KPI Summary Cards */}
            <section className="grid grid-cols-4 gap-6 mb-8">
              <KpiCard title="Airfare" value={`$${(summary.airfare || 0).toLocaleString()}`} subtitle="Total airfare spend" icon="✈️" />
              <KpiCard title="Hotels" value={`$${(summary.hotels || 0).toLocaleString()}`} subtitle="Total hotel spend" icon="🏨" />
              <KpiCard title="Cars" value={`$${(summary.cars || 0).toLocaleString()}`} subtitle="Total car rentals" icon="🚗" />
              <KpiCard title="Total Spend" value={`$${(summary.total || 0).toLocaleString()}`} subtitle="Combined expenses" icon="💰" />
            </section>

            {/* Stats Row */}
            <section className="grid grid-cols-5 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>📋</div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{summary.trips || 0}</div>
                  <div className="text-xs text-gray-500">Total Trips</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: 'white' }}>👥</div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{summary.travelers || 0}</div>
                  <div className="text-xs text-gray-500">Travelers</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>📍</div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{summary.destinations || 0}</div>
                  <div className="text-xs text-gray-500">Destinations</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>⏱️</div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{summary.avgPlanBook}</div>
                  <div className="text-xs text-gray-500">Avg. Booking Lead</div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)', color: 'white' }}>✈️</div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">{summary.flightsCount || 0}</div>
                  <div className="text-xs text-gray-500">Flights Booked</div>
                </div>
              </div>
            </section>

            {/* Charts Section */}
            <section className="grid grid-cols-12 gap-6 mb-8">
              {/* Travel Reasons Chart */}
              <div className="col-span-7 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-lg text-slate-800 mb-4">Travel Reasons</h3>
                {reasonsData.length > 0 ? (
                  <div className="flex items-center gap-8">
                    <div style={{ width: 200, height: 200 }}>
                      <CorporateDonut data={reasonsData} colors={COLORS} size={200} />
                    </div>
                    <div className="flex-1">
                      <ul className="space-y-3">
                        {reasonsData.map((reason, i) => (
                          <li key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                              <span className="text-sm text-gray-700">{reason.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-800">{reason.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm py-8 text-center">No travel data available</div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="col-span-5 space-y-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-90">Flights</div>
                      <div className="text-3xl font-bold">{summary.flightsCount || 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">${(summary.airfare || 0).toLocaleString()}</div>
                      <div className="text-sm opacity-80">Total spend</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Hotels</div>
                      <div className="text-2xl font-bold text-slate-800">{summary.hotelsCount || 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{summary.hotelNights || 0} Nights</div>
                      <div className="flex mt-1">{'⭐'.repeat(4)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-500">Car Rentals</div>
                      <div className="text-2xl font-bold text-slate-800">{summary.carsCount || 0}</div>
                    </div>
                    <div className="text-sm text-gray-600">{summary.carDays || 0} Days</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Trip Frequency & Destinations */}
            <section className="grid grid-cols-12 gap-6 mb-8">
              <div className="col-span-7 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-lg text-slate-800 mb-4">Trip Frequency (Last 6 Months)</h3>
                {tripFrequencyData.length > 0 ? (
                  <div className="flex items-end gap-4 h-40">
                    {tripFrequencyData.map((d, i) => {
                      const max = Math.max(...tripFrequencyData.map(x => x.count || 1));
                      const height = max > 0 ? (d.count / max) * 100 : 0;
                      return (
                        <div key={d.month} className="flex-1 flex flex-col items-center">
                          <div className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-indigo-400 to-indigo-300 transition-all" style={{ height: `${Math.max(height, 8)}%` }}></div>
                          <div className="text-xs text-gray-500 mt-2">{d.month}</div>
                          <div className="text-sm font-semibold text-slate-700">{d.count}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm py-8 text-center">No trip data available</div>
                )}
              </div>

              <div className="col-span-5 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-lg text-slate-800 mb-4">Top Destinations</h3>
                {topDestinationsData.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <div style={{ width: 140, height: 140 }}>
                      <CorporateDonut data={topDestinationsData.map(d => ({ name: d.label, value: d.value }))} colors={COLORS} size={140} />
                    </div>
                    <div className="flex-1">
                      <ul className="space-y-2">
                        {topDestinationsData.map((d, i) => {
                          const total = topDestinationsData.reduce((s, x) => s + x.value, 0) || 1;
                          return (
                            <li key={d.label} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                <span className="text-gray-700">{d.label}</span>
                              </div>
                              <span className="font-medium text-slate-800">{Math.round((d.value / total) * 100)}%</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm py-8 text-center">No destination data</div>
                )}
              </div>
            </section>

            {/* Map & Widgets */}
            <section className="grid grid-cols-12 gap-6">
              <div className="col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <GlobalMap locations={trips.map(t => ({ name: t.destination, lat: 0, lng: 0, status: t.status }))} />
              </div>

              <div className="col-span-4 space-y-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <WidgetManager initial={visibleWidgets} onChange={setVisibleWidgets} />
                </div>
                
                {visibleWidgets.includes('riskFeed') && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <RiskFeed />
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
