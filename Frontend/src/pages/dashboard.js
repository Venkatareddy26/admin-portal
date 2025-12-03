import { useState, useEffect, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from '../components/theme-toggle';
import sse from '../services/sse';
import ProfileMenu from '../components/ProfileMenu';
import KpiCard from '../components/KpiCard';
import '../styles/dashboard.css';

// Lazy load heavy components for faster initial render
const GlobalMap = lazy(() => import('../components/GlobalMap'));
const RiskFeed = lazy(() => import('../components/RiskFeed'));
const WidgetManager = lazy(() => import('../components/WidgetManager'));
const CorporateDonut = lazy(() => import('../components/CorporateDonut'));

const API_BASE = import.meta.env.VITE_API_URL || '';

const INITIAL_SUMMARY = {
  airfare: 0, hotels: 0, cars: 0, total: 0,
  trips: 0, travelers: 0, destinations: 0,
  avgPlanBook: 'N/A', avgApproval: 'N/A',
  flightsCount: 0, hotelsCount: 0, carsCount: 0,
  hotelNights: 0, carDays: 0,
};

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#4ade80'];

// Loading spinner for lazy components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
  </div>
);

export default function TravelDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
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
  const [roleLocal, setRoleLocal] = useState(() => localStorage.getItem('currentRole') || 'employee');
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [trips, setTrips] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Combined data fetch - single API call pattern for better performance
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function fetchAllData() {
      try {
        // Parallel fetch for KPI and trips
        const [kpiRes, tripsRes] = await Promise.all([
          fetch(`${API_BASE}/api/kpi?range=30d`, { signal: controller.signal }),
          fetch(`${API_BASE}/api/trips`, { signal: controller.signal })
        ]);

        if (!mounted) return;

        // Process KPI data
        if (kpiRes?.ok) {
          const kjson = await kpiRes.json();
          if (kjson?.success && kjson.kpis) {
            const k = kjson.kpis;
            setSummary({
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

        // Process trips data
        if (tripsRes?.ok) {
          const data = await tripsRes.json();
          if (data.success && data.trips) {
            setTrips(data.trips);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('fetchAllData failed', err);
      }
    }

    fetchAllData();
    // Single interval for all data refresh (30s instead of multiple 15s intervals)
    const tid = setInterval(fetchAllData, 30000);
    return () => { mounted = false; controller.abort(); clearInterval(tid); };
  }, []);

  // Memoized computed data - prevents recalculation on every render
  const { tripFrequencyData, topDestinationsData, reasonsData } = useMemo(() => {
    if (!trips.length) return { tripFrequencyData: [], topDestinationsData: [], reasonsData: [] };

    // Trip frequency (last 6 months)
    const monthCounts = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthCounts[d.toISOString().slice(0, 7)] = 0;
    }
    trips.forEach(trip => {
      if (trip.start) {
        const key = trip.start.slice(0, 7);
        if (key in monthCounts) monthCounts[key]++;
      }
    });
    const tripFrequencyData = Object.entries(monthCounts).map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      count
    }));

    // Top destinations
    const destCounts = {};
    trips.forEach(trip => {
      if (trip.destination) destCounts[trip.destination] = (destCounts[trip.destination] || 0) + 1;
    });
    const topDestinationsData = Object.entries(destCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));

    // Reasons
    const reasonCounts = {};
    trips.forEach(trip => {
      const purpose = trip.purpose || 'Other';
      let category = 'Other';
      if (/meeting|client/i.test(purpose)) category = 'Client Meetings';
      else if (/conference/i.test(purpose)) category = 'Conferences';
      else if (/training/i.test(purpose)) category = 'Training';
      else if (/site|visit/i.test(purpose)) category = 'Site Visits';
      else if (/sales/i.test(purpose)) category = 'Sales';
      reasonCounts[category] = (reasonCounts[category] || 0) + 1;
    });
    const reasonsData = Object.entries(reasonCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { tripFrequencyData, topDestinationsData, reasonsData };
  }, [trips]);

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

  // Profile menu click outside handler
  useEffect(() => {
    function onClick(e) { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Profile menu positioning
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

  // Memoized callbacks to prevent unnecessary re-renders
  const updateRole = useCallback((r) => {
    localStorage.setItem('currentRole', r);
    setRoleLocal(r);
    window.dispatchEvent(new CustomEvent('role-updated', { detail: r }));
  }, []);

  const onPickAvatar = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...user, avatar: reader.result };
      setUser(updated);
      localStorage.setItem('currentUser', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  }, [user]);

  const removeAvatar = useCallback(() => {
    const updated = { ...user };
    delete updated.avatar;
    setUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));
  }, [user]);

  const doLogout = useCallback(async () => {
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
  }, [navigate]);

  const isActive = useCallback((path) => location?.pathname === path, [location?.pathname]);
  const go = useCallback((path, opts) => opts ? navigate(path, opts) : navigate(path), [navigate]);

  // Memoized map locations to prevent recalculation
  const mapLocations = useMemo(() => 
    trips.map(t => ({ name: t.destination, lat: 0, lng: 0, status: t.status })),
  [trips]);

  return (
    <div className="min-h-screen app-root font-sans text-gray-800">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="flex">
        {/* Mobile menu toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Sidebar */}
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
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
                  <div ref={profileMenuRef} style={menuStyle} className={`profile-menu ${profileOpen ? 'open' : ''}`} role="menu">
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
              <button key={item.path} title={item.label} className={`nav-button ${isActive(item.path) ? 'nav-active' : ''}`} onClick={() => { go(item.path); setMobileMenuOpen(false); }} type="button">
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content flex-1">
          <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header-section">
              <div>
                <h1 className="dashboard-title">Travel Dashboard</h1>
                <p className="dashboard-subtitle">Welcome back, {user?.name || 'Admin'}</p>
              </div>
              <div className="header-actions">
                <ThemeToggle />
              </div>
            </header>

            {/* KPI Summary Cards */}
            <section className="kpi-grid-section">
              <KpiCard title="Airfare" value={`${(summary.airfare || 0).toLocaleString()}`} subtitle="Total airfare spend" icon="✈️" />
              <KpiCard title="Hotels" value={`${(summary.hotels || 0).toLocaleString()}`} subtitle="Total hotel spend" icon="🏨" />
              <KpiCard title="Cars" value={`${(summary.cars || 0).toLocaleString()}`} subtitle="Total car rentals" icon="🚗" />
              <KpiCard title="Total Spend" value={`${(summary.total || 0).toLocaleString()}`} subtitle="Combined expenses" icon="💰" />
            </section>

            {/* Stats Row */}
            <section className="stats-grid-section">
              <div className="stat-card-item">
                <div className="stat-icon-box purple">📋</div>
                <div>
                  <div className="stat-value-text">{summary.trips || 0}</div>
                  <div className="stat-label-text">Total Trips</div>
                </div>
              </div>
              <div className="stat-card-item">
                <div className="stat-icon-box cyan">👥</div>
                <div>
                  <div className="stat-value-text">{summary.travelers || 0}</div>
                  <div className="stat-label-text">Travelers</div>
                </div>
              </div>
              <div className="stat-card-item">
                <div className="stat-icon-box amber">📍</div>
                <div>
                  <div className="stat-value-text">{summary.destinations || 0}</div>
                  <div className="stat-label-text">Destinations</div>
                </div>
              </div>
              <div className="stat-card-item">
                <div className="stat-icon-box green">⏱️</div>
                <div>
                  <div className="stat-value-text">{summary.avgPlanBook}</div>
                  <div className="stat-label-text">Avg. Booking Lead</div>
                </div>
              </div>
              <div className="stat-card-item">
                <div className="stat-icon-box pink">✈️</div>
                <div>
                  <div className="stat-value-text">{summary.flightsCount || 0}</div>
                  <div className="stat-label-text">Flights Booked</div>
                </div>
              </div>
            </section>

            {/* Charts Section */}
            <section className="charts-section">
              {/* Travel Reasons Chart */}
              <div className="chart-card-large">
                <h3 className="chart-title">Travel Reasons</h3>
                {reasonsData.length > 0 ? (
                  <div className="chart-content-flex">
                    <div className="donut-container">
                      <Suspense fallback={<LoadingSpinner />}>
                        <CorporateDonut data={reasonsData} colors={COLORS} size={200} />
                      </Suspense>
                    </div>
                    <div className="chart-legend">
                      <ul className="legend-list">
                        {reasonsData.map((reason, i) => (
                          <li key={i} className="legend-item">
                            <div className="legend-label">
                              <span className="legend-dot" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                              <span className="legend-text">{reason.name}</span>
                            </div>
                            <span className="legend-value">{reason.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">No travel data available</div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="quick-stats-column">
                <div className="gradient-card-purple">
                  <div className="gradient-card-content">
                    <div>
                      <div className="gradient-card-label">Flights</div>
                      <div className="gradient-card-value">{summary.flightsCount || 0}</div>
                    </div>
                    <div className="gradient-card-right">
                      <div className="gradient-card-amount">${(summary.airfare || 0).toLocaleString()}</div>
                      <div className="gradient-card-sublabel">Total spend</div>
                    </div>
                  </div>
                </div>
                
                <div className="white-stat-card">
                  <div className="white-stat-content">
                    <div>
                      <div className="white-stat-label">Hotels</div>
                      <div className="white-stat-value">{summary.hotelsCount || 0}</div>
                    </div>
                    <div className="white-stat-right">
                      <div className="white-stat-detail">{summary.hotelNights || 0} Nights</div>
                      <div className="star-rating">{'⭐'.repeat(4)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="white-stat-card">
                  <div className="white-stat-content">
                    <div>
                      <div className="white-stat-label">Car Rentals</div>
                      <div className="white-stat-value">{summary.carsCount || 0}</div>
                    </div>
                    <div className="white-stat-detail">{summary.carDays || 0} Days</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Trip Frequency & Destinations */}
            <section className="charts-section">
              <div className="chart-card-large">
                <h3 className="chart-title">Trip Frequency (Last 6 Months)</h3>
                {tripFrequencyData.length > 0 ? (
                  <div className="bar-chart-container">
                    {tripFrequencyData.map((d) => {
                      const max = Math.max(...tripFrequencyData.map(x => x.count || 1));
                      const height = max > 0 ? (d.count / max) * 100 : 0;
                      return (
                        <div key={d.month} className="bar-column">
                          <div className="bar-fill" style={{ height: `${Math.max(height, 8)}%` }}></div>
                          <div className="bar-month">{d.month}</div>
                          <div className="bar-count">{d.count}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state">No trip data available</div>
                )}
              </div>

              <div className="chart-card-small">
                <h3 className="chart-title">Top Destinations</h3>
                {topDestinationsData.length > 0 ? (
                  <div className="chart-content-flex">
                    <div className="donut-container-small">
                      <Suspense fallback={<LoadingSpinner />}>
                        <CorporateDonut data={topDestinationsData.map(d => ({ name: d.label, value: d.value }))} colors={COLORS} size={140} />
                      </Suspense>
                    </div>
                    <div className="chart-legend">
                      <ul className="legend-list-compact">
                        {topDestinationsData.map((d, i) => {
                          const total = topDestinationsData.reduce((s, x) => s + x.value, 0) || 1;
                          return (
                            <li key={d.label} className="legend-item-compact">
                              <div className="legend-label">
                                <span className="legend-dot-small" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                <span className="legend-text-small">{d.label}</span>
                              </div>
                              <span className="legend-percent">{Math.round((d.value / total) * 100)}%</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">No destination data</div>
                )}
              </div>
            </section>

            {/* Map & Widgets */}
            <section className="map-widgets-section">
              {/* Map Card */}
              <div className="map-card-container">
                <div className="card-header">
                  <div className="card-header-icon purple">🌍</div>
                  <div>
                    <h3 className="card-header-title">Global Travel Map</h3>
                    <p className="card-header-subtitle">Interactive destination overview</p>
                  </div>
                </div>
                <div className="map-container">
                  <Suspense fallback={<LoadingSpinner />}>
                    <GlobalMap locations={mapLocations} />
                  </Suspense>
                </div>
              </div>

              {/* Widgets Column */}
              <div className="widgets-column">
                {/* Widget Configuration */}
                <div className="widget-card-container">
                  <div className="card-header">
                    <div className="card-header-icon green">⚙️</div>
                    <div>
                      <h3 className="card-header-title">Widget Settings</h3>
                      <p className="card-header-subtitle">Customize your dashboard</p>
                    </div>
                  </div>
                  <div className="widget-content">
                    <Suspense fallback={<LoadingSpinner />}>
                      <WidgetManager initial={visibleWidgets} onChange={setVisibleWidgets} />
                    </Suspense>
                  </div>
                </div>
                
                {/* Risk Feed */}
                {visibleWidgets.includes('riskFeed') && (
                  <div className="widget-card-container">
                    <div className="card-header">
                      <div className="card-header-icon red">⚠️</div>
                      <div>
                        <h3 className="card-header-title">Risk Alerts</h3>
                        <p className="card-header-subtitle">Real-time travel advisories</p>
                      </div>
                    </div>
                    <div className="risk-feed-container">
                      <Suspense fallback={<LoadingSpinner />}>
                        <RiskFeed />
                      </Suspense>
                    </div>
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
