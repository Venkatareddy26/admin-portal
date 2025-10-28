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


// API base - prefers runtime override, then Vite env, then default to local mock server
const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4001';

// TravelDashboard.jsx - cleaned and fixed structure

const INITIAL_SUMMARY = {
  airfare: 0,
  hotels: 0,
  cars: 0,
  total: 0,
  trips: 0,
  travelers: 0,
  destinations: 0,
  avgPlanBook: 'N/A',
  avgApproval: 'N/A',
  flightsCount: 0,
  hotelsCount: 0,
  carsCount: 0,
  hotelNights: 0,
  carDays: 0,
};

// reasonsData removed (sample/demo data). Charts will render from real data or remain empty until data arrives.

const COLORS = ['#2d0636', '#5a2d64', '#8a417f', '#b46ca6', '#c79ac1', '#e1cbe0', '#f3e9f4', '#efe6f0', '#efe9f7'];

export default function TravelDashboard() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [chartCard, setChartCard] = useState(null);
  const [collapsedCards, setCollapsedCards] = useState({});
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    try{ const raw = localStorage.getItem('dashboard_widgets'); if(raw) return JSON.parse(raw); }catch{};
    return ['tripFrequency','topDestinations','riskFeed'];
  });
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')) || { name: 'Admin Name', email: 'admin@example.com' } } catch { return { name: 'Admin Name', email: 'admin@example.com' } }
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const profileMenuRef = useRef(null);
  const profileToggleRef = useRef(null);
  const avatarInputRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});
  const [menuAlign, setMenuAlign] = useState('right');
  const [roleLocal, setRoleLocal] = useState(() => localStorage.getItem('currentRole') || 'employee');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const location = useLocation();

  // Fetch metrics from API endpoints and aggregate into summary
  useEffect(() => {
    let mounted = true;

    function categorizeExpense(e){
      const txt = ((e.category || e.type || e.description || '') + '').toLowerCase();
      if(/air|flight|ticket|airfare/.test(txt)) return 'airfare';
      if(/hotel|night|room|accommodation/.test(txt)) return 'hotels';
      if(/car|rental|uber|taxi|lyft/.test(txt)) return 'cars';
      return 'other';
    }

    async function fetchMetrics(){
      const fetchMetrics = async () => {
  const res = await fetch('/api/kpi?range=30d');
  const data = await res.json();
  setMetrics(data);
};

      try{
        const [tripsRes, expensesRes, docsRes] = await Promise.all([
          fetch(`${API_BASE}/api/trips`),
          fetch(`${API_BASE}/api/expenses`),
          fetch(`${API_BASE}/api/documents`)
        ].map(p => p.catch(e => ({ ok:false }))));

        const trips = tripsRes && tripsRes.ok ? await tripsRes.json() : [];
        const expenses = expensesRes && expensesRes.ok ? await expensesRes.json() : [];
        const docs = docsRes && docsRes.ok ? await docsRes.json() : [];

        // aggregate expenses
        let airfare = 0, hotels = 0, cars = 0, total = 0;
        let flightsCount = 0, hotelsCount = 0, carsCount = 0, hotelNights = 0, carDays = 0;

        for(const e of (expenses || [])){
          const amt = parseFloat(e.amount || e.value || e.total || 0) || 0;
          total += amt;
          const cat = categorizeExpense(e);
          if(cat === 'airfare'){ airfare += amt; flightsCount += 1; }
          else if(cat === 'hotels'){ hotels += amt; hotelsCount += 1; hotelNights += parseInt(e.nights || e.quantity || 0) || 0; }
          else if(cat === 'cars'){ cars += amt; carsCount += 1; carDays += parseInt(e.days || e.quantity || 0) || 0; }
        }

        // trips metrics
        const tripsCount = (trips || []).length;
        const travelerSet = new Set();
        const destSet = new Set();
        const planBookDiffs = [];
        const approvalDiffs = [];

        for(const t of (trips || [])){
          if(t.requester?.email) travelerSet.add(t.requester.email);
          if(t.requester_email) travelerSet.add(t.requester_email);
          if(t.requester) travelerSet.add(typeof t.requester === 'string' ? t.requester : (t.requester.email || t.requester.name || ''));
          if(t.destination) destSet.add(t.destination);

          // avg plan-book: difference between createdAt and start
          try{
            const created = t.createdAt ? new Date(t.createdAt) : (t.requestedAt ? new Date(t.requestedAt) : null);
            const start = t.start ? new Date(t.start) : null;
            if(created && start && !isNaN(created) && !isNaN(start)){
              const days = Math.max(0, Math.round((start - created) / (1000*60*60*24)));
              planBookDiffs.push(days);
            }
          }catch(e){}

          // avg approval: find first timeline entry with status 'approved'
          if(Array.isArray(t.timeline)){
            const created = t.createdAt ? new Date(t.createdAt) : null;
            const ap = t.timeline.find(x => (x.status||'').toLowerCase() === 'approved');
            if(created && ap && ap.ts){
              try{ const approvedAt = new Date(ap.ts); if(!isNaN(approvedAt)) approvalDiffs.push(Math.max(0, Math.round((approvedAt - created)/(1000*60*60*24)))); }catch(e){}
            }
          }
        }

        const avgPlanBook = planBookDiffs.length ? (Math.round((planBookDiffs.reduce((a,b)=>a+b,0)/planBookDiffs.length) * 10)/10) + ' days' : 'N/A';
        const avgApproval = approvalDiffs.length ? (Math.round((approvalDiffs.reduce((a,b)=>a+b,0)/approvalDiffs.length) * 10)/10) + ' days' : 'N/A';

        const newSummary = {
          airfare, hotels, cars, total,
          trips: tripsCount,
          travelers: travelerSet.size,
          destinations: destSet.size,
          avgPlanBook,
          avgApproval,
          flightsCount, hotelsCount, carsCount, hotelNights, carDays
        };

        // Try server-side KPI endpoint to get authoritative aggregates (fallback to local aggregation above)
        try{
          const token = localStorage.getItem('app_token');
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const kpiRes = await fetch(`${API_BASE}/api/kpi?range=30d`, { headers });
          if(kpiRes && kpiRes.ok){
            const kjson = await kpiRes.json().catch(()=>null);
            if(kjson && kjson.success && kjson.kpis){
              const k = kjson.kpis;
              // prefer server values when available
              newSummary.airfare = Number(k.total_airfare ?? k.total_spend ?? newSummary.airfare);
              newSummary.hotels = Number(k.total_hotels ?? newSummary.hotels);
              newSummary.cars = Number(k.total_cars ?? newSummary.cars);
              newSummary.total = Number(k.total_spend ?? newSummary.total);
              newSummary.trips = Number(k.trips_count ?? newSummary.trips);
              newSummary.travelers = Number(k.distinct_travelers ?? newSummary.travelers);
              newSummary.avgPlanBook = (k.avg_booking_lead_days ? (Math.round(k.avg_booking_lead_days*10)/10) + ' days' : newSummary.avgPlanBook);
              newSummary.avgApproval = (k.avg_approval_hours ? (Math.round(k.avg_approval_hours*10)/10) + ' hours' : newSummary.avgApproval);
            }
          }
        }catch(err){ console.warn('Failed to fetch /api/kpi', err); }

        if(mounted) setSummary(s => Object.assign({}, s, newSummary));
      }catch(err){ console.warn('fetchMetrics failed', err); }
    }

    fetchMetrics();
    const tid = setInterval(fetchMetrics, 15000);
    return () => { mounted = false; clearInterval(tid); };
  }, []);

  // Listen to trip-created events to update summary in realtime
  useEffect(() => {
    function onTrip(e){
      try{
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // update counts optimistically
        setSummary(prev => {
          const next = Object.assign({}, prev || {});
          next.trips = (Number(prev.trips) || 0) + 1;
          // travelers: if we can extract an email or name
          try{
            const tEmail = data.requester?.email || data.requester_email || null;
            const tName = data.requester?.name || data.requester_name || null;
            // use a simple heuristic: increment traveler count if new
            // We don't have a persisted set here; approximate by +1
            next.travelers = (Number(prev.travelers) || 0) + 1;
          }catch(e){}
          // destinations
          next.destinations = (Number(prev.destinations) || 0) + 1;
          // cost estimate
          const add = parseFloat(data.costEstimate || data.cost_estimate || 0) || 0;
          next.airfare = next.airfare; next.hotels = next.hotels; next.cars = next.cars;
          next.total = (Number(prev.total) || 0) + add;
          return next;
        });
      }catch(err){ console.warn('sse parse trip-created', err); }
    }
    sse.on('trip-created', onTrip);
    return () => { sse.off('trip-created', onTrip); };
  }, []);

  useEffect(()=>{
    function onStorage(e){
      if(e.key === 'currentUser'){
        try{ setUser(JSON.parse(e.newValue)) }catch{ }
      }
      if(e.key === 'currentRole'){
        try{ setRoleLocal(e.newValue || 'employee') }catch{}
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    function onClick(e){
      if(profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Keyboard handling: Escape closes the menu and returns focus to the toggle.
  useEffect(() => {
    function onKeyDown(e){
      if(!profileOpen) return;
      if(e.key === 'Escape'){
        setProfileOpen(false);
        profileToggleRef.current?.focus();
      }
    }

    if(profileOpen){
      document.addEventListener('keydown', onKeyDown);
      // small timeout to ensure DOM updated then move focus to first item
      setTimeout(() => {
        try{ firstMenuItemRef.current?.focus(); }catch{}
      }, 0);
    }

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [profileOpen]);

  // compute menu position based on toggle button to avoid clipping/alignment issues
  useEffect(() => {
    if(!profileOpen) return;

    function positionMenu(){
      const btn = profileToggleRef.current;
      if(!btn) return;
      const rect = btn.getBoundingClientRect();
      const menuWidth = 320; // matches css max-width
      const viewportW = window.innerWidth;
      const spaceRight = viewportW - rect.right - 12; // margin
      const spaceLeft = rect.left - 12;
      const menuTop = Math.min(Math.max(rect.bottom + 8, 12), window.innerHeight - 40);

      let style = { top: `${menuTop}px` };
      let align = 'right';
      let caretX = 0;

      if(spaceRight >= menuWidth){
        // put menu left aligned to toggle.left
        const left = Math.max(12, rect.left - 8);
        style.left = `${left}px`;
        align = 'left';
        caretX = rect.left + rect.width/2 - left;
      } else if(spaceLeft >= menuWidth){
        // place menu to the left of the toggle (align right)
        const right = Math.max(12, viewportW - rect.right - 8);
        style.right = `${right}px`;
        align = 'right';
        const menuLeft = viewportW - right - menuWidth;
        caretX = rect.left + rect.width/2 - menuLeft;
      } else {
        // fallback: prefer right side with available space
        const right = Math.max(12, viewportW - rect.right - 8);
        style.right = `${right}px`;
        align = 'right';
        const menuLeft = Math.max(12, rect.left - 8);
        caretX = rect.left + rect.width/2 - menuLeft;
      }

      // clamp caretX within menuWidth
      caretX = Math.max(12, Math.min(caretX, menuWidth - 12));

      // expose caret position via CSS variable
      style['--caret-left'] = `${Math.round(caretX)}px`;
      setMenuAlign(align);
      setMenuStyle(style);
    }

    positionMenu();
    window.addEventListener('resize', positionMenu);
    window.addEventListener('scroll', positionMenu, { passive: true });
    return () => {
      window.removeEventListener('resize', positionMenu);
      window.removeEventListener('scroll', positionMenu);
    };
  }, [profileOpen]);

  function updateRole(r){
    localStorage.setItem('currentRole', r);
    setRoleLocal(r);
    // notify other components in the same window
    window.dispatchEvent(new CustomEvent('role-updated', { detail: r }));
    // announce role change to screen readers
    const live = document.getElementById('role-change-live');
    if(live) live.textContent = `Role changed to ${r}`;
  }

  // Avatar upload handlers: store a data URL on currentUser.avatar in localStorage
  function onPickAvatar(file){
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const dataUrl = reader.result;
        const updated = Object.assign({}, user || {}, { avatar: dataUrl });
        setUser(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
        // notify other windows
        window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(updated) }));
      }catch(e){ console.warn('avatar save failed', e); }
    };
    reader.readAsDataURL(file);
  }

  function onAvatarInputChange(e){
    const f = e.target.files && e.target.files[0];
    if(f) onPickAvatar(f);
    // reset input so same file can be selected again if needed
    e.target.value = '';
  }

  function removeAvatar(){
    const updated = Object.assign({}, user || {});
    delete updated.avatar;
    setUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(updated) }));
  }

  // Edit name handlers
  function startEditName(){
    setNameDraft(user?.name || '');
    setEditingName(true);
    setTimeout(()=>{ const el = document.getElementById('profile-name-input'); if(el) el.focus(); }, 0);
  }

  function cancelEditName(){ setEditingName(false); setNameDraft(''); }

  function saveName(){
    const updated = Object.assign({}, user || {}, { name: nameDraft || 'User' });
    setUser(updated);
    localStorage.setItem('currentUser', JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(updated) }));
    setEditingName(false);
  }

  function doLogout(){
    // clear local auth and profile state
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentUser');
    // remove the demo/app token so protected routes require login
    localStorage.removeItem('app_token');
    setUser({ name: 'Guest', email: '' });
    setRoleLocal('employee');
    window.dispatchEvent(new Event('logout'));
    // navigate directly to login page
    try{ navigate('/login', { replace: true }); }catch(e){ window.location.href = '/login'; }
  }

  function isActive(path) {
    return location && location.pathname === path;
  }

  function go(path, opts) {
    if (opts) navigate(path, opts);
    else navigate(path);
  }

  function toggleExpand(id){
    setExpandedCard((s) => s === id ? null : id);
  }

  function openChartCard({ title = 'Details', item = {}, index = 0, dataset = [], colors = [] } = {}){
    const total = (dataset || []).reduce((s, it) => s + (it.value || 0), 0) || 1;
    const pct = Math.round(((item.value || 0) / total) * 100);
    setChartCard({ title, name: item.name || item.label || 'Item', value: item.value || 0, pct, color: colors[index % colors.length] || 'var(--accent)' });
  }

  function closeChartCard(){ setChartCard(null); }

  useEffect(() => {
    function onKey(e){ if(e.key === 'Escape') closeChartCard(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen app-root p-8 font-sans text-gray-800">
      {chartCard && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/40" onClick={closeChartCard} />
          <div className="elevated p-6 shadow-xl z-50 w-[min(720px,95%)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{chartCard.title}</h3>
                <div className="text-sm text-muted mt-1">{chartCard.name}</div>
              </div>
              <div>
                <button type="button" className="px-3 py-1 border rounded" onClick={closeChartCard} aria-label="Close">Close</button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div style={{width:64, height:64, borderRadius:8, background:chartCard.color}} />
              <div>
                <div className="text-2xl font-bold">{chartCard.value}</div>
                <div className="text-sm text-muted">{chartCard.pct}% of total</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6 max-w-[1400px] mx-auto">
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''} sticky top-8 self-start`}>
          <div className={`admin-profile p-3 flex items-center justify-between ${profileOpen ? 'menu-open' : ''}`} ref={profileRef}>
            <div className="flex items-center gap-3">
              <div className="rounded-full avatar-primary text-white w-10 h-10 flex items-center justify-center">{(user && user.name) ? user.name.charAt(0).toUpperCase() : 'A'}</div>
              <div className="admin-info">
                <div className="admin-name font-semibold" data-fullname={user?.name || 'Admin Name'}>{user?.name || 'Admin Name'}</div>
                <div className="admin-role text-xs muted-text">Administrator</div>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <button ref={profileToggleRef} type="button" className={`toggle-btn ${profileOpen ? 'profile-open' : ''}`} aria-haspopup="true" aria-expanded={profileOpen} onClick={() => setProfileOpen((s) => !s)} aria-label="Open profile menu" title="Profile">⋯</button>

              {/* render backdrop and menu into a portal to avoid clipping when sidebar is collapsed */}
              {profileOpen && typeof document !== 'undefined' && createPortal(
                <>
                 <div className={`profile-backdrop ${profileOpen ? 'open' : ''}`} 
     aria-hidden={!profileOpen} 
     onClick={() => setProfileOpen(false)} 
/>

<FocusTrap 
  active={profileOpen} 
  focusTrapOptions={{ 
    clickOutsideDeactivates: true, 
    fallbackFocus: () => profileToggleRef.current || document.body 
  }}
>
  <div 
    ref={profileMenuRef} 
    style={menuStyle} 
    data-align={menuAlign} 
    className={`profile-menu ${profileOpen ? 'open' : ''}`} 
    role="menu" 
    aria-label="Profile menu"
  >
    <div className="profile-caret" aria-hidden="true" />

    <ProfileMenu
      user={user}
      role={roleLocal}
      onPickAvatar={(file) => onPickAvatar(file)}
      onSaveName={(newName) => {
        const updated = { ...user, name: newName };
        setUser(updated);
        setEditingName(false);
        setNameDraft('');
        localStorage.setItem('currentUser', JSON.stringify(updated));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'currentUser',
          newValue: JSON.stringify(updated),
        }));
      }}
      onRemoveAvatar={removeAvatar}
      onNavigate={(p) => go(p)}
      onLogout={() => doLogout()}
      updateRole={(r) => updateRole(r)}
      closeMenu={() => setProfileOpen(false)}
    />
  </div>
</FocusTrap>
                </>, document.body
              )}

              {/* aria-live region for role change announcements */}
              <div id="role-change-live" aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }} />
            </div>
          </div>

          <div className="sidebar-top p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt={(user && user.name) ? user.name : 'Travel'} className="rounded-full w-8 h-8 object-cover" />
              ) : (
                <div className="rounded-full bg-gray-900 text-white w-8 h-8 flex items-center justify-center">TD</div>
              )}
              <div className="-label">Travel</div>
            </div>
            <button type="button" className="toggle-btn" onClick={() => setCollapsed((s) => !s)} aria-label="Toggle sidebar">☰</button>
          </div>

          <nav className="nav p-3">
            <button title="Analytics" aria-current={isActive('/analytics') ? 'page' : undefined} className={`nav-button ${isActive('/analytics') ? 'nav-active' : ''}`} onClick={() => go('/analytics')} type="button">
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 14V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 14v-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 14v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="nav-label">Analytics</span>
            </button>

            <button title="Dashboard" aria-current={isActive('/dashboard') ? 'page' : undefined} className={`nav-button ${isActive('/dashboard') ? 'nav-active' : ''}`} onClick={() => go('/dashboard')} type="button">
              <span className="nav-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 21V12h14v9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="nav-label">Dashboard</span>
            </button>

            <button title="Documents" aria-current={isActive('/documents') ? 'page' : undefined} className={`nav-button ${isActive('/documents') ? 'nav-active' : ''}`} onClick={() => go('/documents')} type="button">
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 3h10v4H7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="nav-label">Documents</span>
            </button>

            <button title="Expense" aria-current={isActive('/expense') ? 'page' : undefined} className={`nav-button ${isActive('/expense') ? 'nav-active' : ''}`} onClick={() => go('/expense')} type="button">
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="nav-label">Expense</span>
            </button>

            <button title="Policy" aria-current={isActive('/policy') ? 'page' : undefined} className={`nav-button ${isActive('/policy') ? 'nav-active' : ''}`} onClick={() => go('/policy', { state: { fromDashboard: true } }) } type="button">
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 7h10v10H7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="nav-label">Policy</span>
            </button>

            <button title="Risk" aria-current={isActive('/risk') ? 'page' : undefined} className={`nav-button ${isActive('/risk') ? 'nav-active' : ''}`} onClick={() => go('/risk')} type="button">
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 22h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 12l5-7 5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="nav-label">Risk</span>
            </button>

            <button title="Trips" aria-current={isActive('/trips') ? 'page' : undefined} className={`nav-button ${isActive('/trips') ? 'nav-active' : ''}`} onClick={() => go('/trips')} type="button">
              <span className="nav-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7h18v10H3z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 3v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 3v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="nav-label">Trips</span>
            </button>

            <button title="Admin" aria-current={isActive('/admin/trips') ? 'page' : undefined} className={`nav-button ${isActive('/admin/trips') ? 'nav-active' : ''}`} onClick={() => go('/admin/trips')} type="button">
              <span className="nav-icon" aria-hidden="true">⚙</span>
              <span className="nav-label">Admin</span>
            </button>
          </nav>
        </aside>

          <main className="flex-1">
          <div className="max-w-[1160px] mx-auto elevated p-6 shadow-lg">
            <header className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-serif text-slate-800">Travel dashboard </h1>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted">Theme</label>
                <ThemeToggle />
                <div className="ml-4">
                  <input placeholder="Admin email" id="adminEmail" className="border px-2 py-1 text-sm" style={{width:140}} />
                  <input placeholder="Password" id="adminPassword" type="password" className="border px-2 py-1 text-sm ml-2" style={{width:120}} />
                  <button className="px-2 py-1 ml-2 elevated text-sm" onClick={async () => {
                    const v = document.getElementById('adminEmail').value;
                    const p = document.getElementById('adminPassword').value;
                    if(!v) return alert('enter email');
                    if(!p) return alert('enter password');
                    try{
                      const res = await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body: JSON.stringify({ email: v, password: p })});
                      if(!res.ok){ const e = await res.json().catch(()=>({ error: res.statusText })); return alert('login failed: ' + (e.error || 'unknown')); }
                      const b = await res.json();
                      if(b.token){
                        try{ const { setToken } = await import('./auth.js'); setToken(b.token); }catch(e){ localStorage.setItem('app_token', b.token); }
                        alert('Logged in as admin');
                        // reload so app routes pick up the token
                        window.location.reload();
                      }
                    }catch(e){ alert('login failed'); }
                  }}>Admin login</button>
                </div>
              </div>
            </header>

            {/* Top summary row (airfare + hotels + cars = total) - now using KpiCard for consistency */}
            <section className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <KpiCard title="Airfare" value={`$${(Number(summary.airfare) || 0).toLocaleString()}`} subtitle="Total airfare" icon="✈" onClick={() => toggleExpand('airfare')} />
              </div>
              <div className="text-2xl text-slate-600 font-semibold">+</div>
              <div className="flex-1">
                <KpiCard title="Hotels" value={`$${(Number(summary.hotels) || 0).toLocaleString()}`} subtitle="Total hotels" icon="🏨" onClick={() => toggleExpand('hotels')} />
              </div>
              <div className="text-2xl text-slate-600 font-semibold">+</div>
              <div className="flex-1">
                <KpiCard title="Cars" value={`$${(Number(summary.cars) || 0).toLocaleString()}`} subtitle="Total cars" icon="🚗" onClick={() => toggleExpand('cars')} />
              </div>
              <div className="text-2xl text-slate-600 font-semibold">=</div>
              <div className="flex-1">
                <KpiCard title="Total spend" value={`$${(Number(summary.total) || 0).toLocaleString()}`} subtitle="Total spend" icon="💰" onClick={() => toggleExpand('totalSpend')} />
              </div>
            </section>

            {/* KPI row rendered with reusable KpiCard */}
            <section className="grid grid-cols-5 gap-4 mb-6">
              <div className="col-span-1"><KpiCard small title="Trips" value={summary.trips ?? 0} subtitle="" icon="🧾" /></div>
              <div className="col-span-1"><KpiCard small title="Travelers" value={summary.travelers ?? 0} subtitle="" icon="👥" /></div>
              <div className="col-span-1"><KpiCard small title="Destinations" value={summary.destinations ?? 0} subtitle="" icon="📍" /></div>
              <div className="col-span-1"><KpiCard small title="Avg. plan - book" value={summary.avgPlanBook || 'N/A'} subtitle="" icon="⏱" /></div>
              <div className="col-span-1"><KpiCard small title="Avg. approval" value={summary.avgApproval || 'N/A'} subtitle="" icon="✅" /></div>
            </section>

            {/* Main content */}
            <section className="grid grid-cols-12 gap-6">
              <div className="col-span-7 elevated p-6">
                <h3 className="font-semibold text-lg mb-4 inline-block elevated px-3 py-1 rounded-full">Corporate reasons for travelling</h3>
                <div className="charts-section flex items-center gap-6">
                  <div className="chart-card" style={{ width: 320, height: 320 }}>
                    <h4 className="sr-only">Corporate Reasons</h4>
                    <DynamicPieChart data={[]} colors={COLORS} onSliceClick={(item, i) => { setSelectedReason(item.name); openChartCard({ title: 'Reason details', item, index: i, dataset: [], colors: COLORS }); }} />
                    {selectedReason && (
                      <div className="mt-2 text-sm text-slate-600">
                        Filter: <strong>{selectedReason}</strong> <button type="button" className="px-2 py-0.5 ml-3 rounded border text-xs" onClick={() => setSelectedReason(null)}>Clear</button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-2 text-sm text-slate-600">
                      {/* no sample list - this will render once data is available */}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="col-span-5 elevated p-6">
                <div className="space-y-6">
                  <div
                    className="bg-gradient-to-r from-purple-700 to-purple-600 text-white rounded-lg p-4 flex items-center justify-between kpi-card-clickable elevated"
                    onClick={() => toggleExpand('flights') }
                    role="button"
                    tabIndex={0}
                  >
                    <div>
                      <div className="text-xs uppercase opacity-90">Flights</div>
                      <div className="text-2xl font-bold">{summary.flightsCount ?? 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{(summary.airfare || 0).toLocaleString()}</div>
                      <div className="text-xs mt-1"><span className="text-amber-300">{Math.round(((summary.flightsCount || 0) > 0 ? ((summary.flightsCount || 0) / Math.max(1, summary.trips || 1)) * 100 : 0))}% Business</span></div>
                    </div>
                  </div>
                  {expandedCard === 'flights' && (
                    <div className="p-3 elevated text-sm text-slate-700">Flight details: 21 trips this month — click KPI to collapse.</div>
                  )}

                  <div className="elevated p-4 flex items-center justify-between kpi-card-clickable" onClick={() => toggleExpand('hotels')} role="button" tabIndex={0}>
                    <div>
                      <div className="text-xs uppercase text-slate-600">Hotels</div>
                      <div className="text-2xl font-bold">{summary.hotelsCount ?? 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{summary.hotelNights ?? 0} Nights</div>
                      <div className="text-xs text-slate-500 mt-1">Average rating:</div>
                      <div className="mt-1">⭐ ⭐ ⭐ ⭐</div>
                    </div>
                  </div>
                  {expandedCard === 'hotels' && (
                    <div className="p-3 elevated text-sm text-slate-700">Hotel breakdown and nightly rates.</div>
                  )}

                  <div className="elevated p-4 flex items-center justify-between kpi-card-clickable" onClick={() => toggleExpand('cars')} role="button" tabIndex={0}>
                    <div>
                      <div className="text-xs uppercase text-slate-500">Cars</div>
                      <div className="text-2xl font-bold">{summary.carsCount ?? 0}</div>
                    </div>
                    <div className="text-right text-slate-500">{summary.carDays ?? 0} Days</div>
                  </div>
                  {expandedCard === 'cars' && (
                    <div className="p-3 elevated text-sm text-slate-700">Car rentals summary and vendors.</div>
                  )}
                </div>
              </div>
            </section>

            {/* Faux 3D bar chart removed */}

          {/*}  <footer className="mt-6 text-center text-xs text-gray-400">This graph/chart is linked to excel, and changes automatically based on data. Just left click on it and select "Edit Data".</footer>

            {/* Reporting & Analytics Section */}
            <section className="mt-12 max-w-[1160px] mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Reporting & Analytics</h2>
              <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-7 elevated p-6">
                    {visibleWidgets.includes('tripFrequency') && (
                          <>
                            <h3 className="font-semibold text-lg mb-2">Trip Frequency (last 6 months)</h3>
                            <TripFrequencyBarChart data={[]} />
                          </>
                        )}
                  </div>

                  <div className="col-span-5 elevated p-6">
                    {visibleWidgets.includes('topDestinations') && (
                      <>
                        <h3 className="font-semibold text-lg mb-2">Top Destinations</h3>
                        <TopDestinationsChart data={[]} />
                      </>
                    )}
                  </div>
              </div>
            </section>

            {/* Extra row: map and risk feed + widget manager */}
            <section className="mt-8 grid grid-cols-12 gap-6">
              <div className="col-span-8">
                <div className="elevated p-6">
                  <GlobalMap locations={[]} />
                </div>
              </div>

              <div className="col-span-4 space-y-4">
                <div className="elevated p-4">
                  <WidgetManager initial={visibleWidgets} onChange={(w) => setVisibleWidgets(w)} />
                </div>

                <div className="elevated p-4">
                  {visibleWidgets.includes('riskFeed') && <RiskFeed />}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// Trip Frequency Bar Chart Component
function TripFrequencyBarChart({ data = [] }) {
  if(!data || !data.length) return <div className="text-sm text-gray-500">No data available</div>;
  const max = Math.max(...data.map(d => d.count || 0));
  return (
          <div className="flex items-end gap-3 h-32 w-full">
      {data.map((d) => (
        <div key={d.month} className="flex flex-col items-center flex-1">
          <div className="w-7 rounded-t bg-purple-400" style={{ height: `${(d.count / max) * 100}%`, minHeight: 12 }}>
            <div className="sr-only">{d.count} trips</div>
          </div>
          <div className="text-xs text-gray-500 mt-1">{d.month}</div>
          <div className="text-xs font-semibold text-slate-700">{d.count}</div>
        </div>
      ))}
    </div>
  );
}

// DynamicPieChart and Faux3DBarChart helpers
function DynamicPieChart(props){
  // Keep the previous API but delegate rendering to the shared CorporateDonut for consistent look
  const { data, colors, size, onSliceClick } = props;
  return <CorporateDonut data={data} colors={colors} size={size} onSliceClick={onSliceClick} />;
}

function Faux3DBarChart({ data }){
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="faux-3d-chart" role="list" aria-label="Carbon by destination">
      {data.map((d, i) => {
            const height = `${(d.value / max) * 220}px`;
            return (
              <div key={d.label} className="f3d-bar-wrap" role="listitem" data-showtooltip={false}>
                <div
                  className="f3d-bar"
                  role="button"
                  tabIndex={0}
                  aria-label={`${d.label}: ${d.value} metric tons`}
                  style={{height}}
                >
                  <div className="f3d-bar-top" />
                  <div className="f3d-bar-front">{d.value}</div>
                </div>
                <div className="f3d-tooltip" role="status" aria-live="polite">{d.label}: {d.value}</div>
                <div className="f3d-label">{d.label}</div>
              </div>
            )
          })}
    </div>
  )
}

// Top Destinations horizontal bar chart (simple, accessible, static SVG)
function TopDestinationsChart({ data = [] }){
  // reuse DynamicPieChart for consistent look & interactions
  const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#c084fc', '#60a5fa'];
  const formatted = (data || []).map(d => ({ name: d.label, value: d.value }));

  return (
    <div className="flex items-start gap-4">
      <div className="flex-none">
        <DynamicPieChart data={formatted} colors={colors} size={160} />
      </div>
      <div className="flex-1 min-w-0">
        {(formatted || []).map((a, i) => {
          const total = formatted.reduce((s, it) => s + (it.value || 0), 0) || 1;
          const pct = Math.round(((a.value || 0) / total) * 100);
          return (
            <div key={a.name} className="flex items-center justify-between text-sm mb-3">
              <button type="button" onClick={() => openChartCard({ title: 'Destination details', item: a, index: i, dataset: formatted, colors })} className="flex items-center space-x-3 min-w-0 text-left" style={{background:'transparent', border:'none', padding:0}}>
                <span className="inline-block rounded-sm flex-shrink-0" style={{width:14, height:14, background: colors[i % colors.length]}} />
                <span className="truncate text-sm" style={{color:'var(--muted)'}}>{a.name}</span>
              </button>
              <div className="text-sm font-semibold ml-3" style={{color:'var(--card-text)'}}>{pct}%</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}