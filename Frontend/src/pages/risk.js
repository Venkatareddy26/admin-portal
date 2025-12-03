import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/risk.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Risk() {
  const navigate = useNavigate();
  const [advisories, setAdvisories] = useState([]);
  const [travelers, setTravelers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdvForm, setShowAdvForm] = useState(false);
  const [advForm, setAdvForm] = useState({
    destination: '',
    type: 'political',
    severity: 'medium',
    title: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [advisoriesRes, travelersRes] = await Promise.all([
        fetch(`${API_BASE}/api/risk/advisories`),
        fetch(`${API_BASE}/api/risk/travelers`)
      ]);

      if (advisoriesRes.ok) {
        const data = await advisoriesRes.json();
        if (data.success) setAdvisories(data.advisories || []);
      }

      if (travelersRes.ok) {
        const data = await travelersRes.json();
        if (data.success) setTravelers(data.travelers || []);
      }
    } catch (err) {
      console.warn('fetchData failed', err);
    } finally {
      setLoading(false);
    }
  }

  async function createAdvisory() {
    if (!advForm.title || !advForm.destination) {
      alert('Please fill in title and destination');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/risk/advisories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(advForm)
      });

      if (res.ok) {
        await fetchData();
        setShowAdvForm(false);
        setAdvForm({ destination: '', type: 'political', severity: 'medium', title: '', description: '' });
      }
    } catch (err) {
      console.error('createAdvisory failed', err);
    }
  }

  async function handleCheckIn(travelerId) {
    try {
      await fetch(`${API_BASE}/api/risk/travelers/${travelerId}/checkin`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('checkIn failed', err);
    }
  }

  async function handleSOS(travelerId) {
    if (!window.confirm('Trigger SOS alert? This will notify the emergency team.')) return;
    try {
      await fetch(`${API_BASE}/api/risk/travelers/${travelerId}/sos`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('SOS failed', err);
    }
  }

  async function toggleOptIn(travelerId) {
    try {
      await fetch(`${API_BASE}/api/risk/travelers/${travelerId}/toggle-optin`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('toggleOptIn failed', err);
    }
  }

  const severityStyles = {
    high: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626' },
    medium: { bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
    low: { bg: 'rgba(16,185,129,0.1)', color: '#059669' }
  };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f8fafc' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Risk & Safety</h1>
              <p className="text-gray-500 mt-1">Travel advisories and traveler safety tracking</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdvForm(true)}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <span>+</span> New Advisory
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
              >
                ← Back
              </button>
            </div>
          </div>
        </header>


        {/* New Advisory Modal */}
        {showAdvForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowAdvForm(false)}></div>
            <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Create New Advisory</h3>
                    <p className="text-sm text-gray-500 mt-1">Add a travel advisory for a destination</p>
                  </div>
                  <button onClick={() => setShowAdvForm(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={advForm.title}
                    onChange={(e) => setAdvForm({ ...advForm, title: e.target.value })}
                    placeholder="e.g., Weather Alert - Typhoon Warning"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination *</label>
                  <input
                    type="text"
                    value={advForm.destination}
                    onChange={(e) => setAdvForm({ ...advForm, destination: e.target.value })}
                    placeholder="e.g., Tokyo, Japan"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={advForm.type}
                      onChange={(e) => setAdvForm({ ...advForm, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="political">🏛️ Political</option>
                      <option value="weather">🌪️ Weather</option>
                      <option value="health">🏥 Health</option>
                      <option value="security">🔒 Security</option>
                      <option value="other">📋 Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                    <div className="flex gap-2">
                      {['low', 'medium', 'high'].map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setAdvForm({ ...advForm, severity: sev })}
                          className="flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all"
                          style={{
                            background: advForm.severity === sev ? severityStyles[sev].bg : 'white',
                            color: advForm.severity === sev ? severityStyles[sev].color : '#6b7280',
                            borderColor: advForm.severity === sev ? severityStyles[sev].color : '#e5e7eb'
                          }}
                        >
                          {sev.charAt(0).toUpperCase() + sev.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={advForm.description}
                    onChange={(e) => setAdvForm({ ...advForm, description: e.target.value })}
                    placeholder="Provide details about the advisory..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowAdvForm(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createAdvisory}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                >
                  Create Advisory
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Travel Advisories */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>⚠️</div>
              <div>
                <h3 className="font-semibold text-slate-800">Travel Advisories</h3>
                <p className="text-xs text-gray-500">{advisories.length} active advisories</p>
              </div>
            </div>

            <div className="p-5 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p>Loading advisories...</p>
                </div>
              ) : advisories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📋</div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-2">No advisories yet</h4>
                  <p className="text-gray-500 mb-4">Create your first travel advisory</p>
                  <button
                    onClick={() => setShowAdvForm(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    + Add Advisory
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {advisories.map((adv) => (
                    <div key={adv.id} className="p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow" style={{ backgroundColor: severityStyles[adv.severity]?.bg || '#f9fafb' }}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{adv.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">📍 {adv.destination}</p>
                        </div>
                        <div className="flex gap-2">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: severityStyles[adv.severity]?.bg, color: severityStyles[adv.severity]?.color }}
                          >
                            {adv.severity?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {adv.description && <p className="text-sm text-gray-600 mt-2">{adv.description}</p>}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/50">
                        <span className="text-xs text-gray-500">
                          {adv.type?.charAt(0).toUpperCase() + adv.type?.slice(1)} • {new Date(adv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Traveler Safety */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>👥</div>
              <div>
                <h3 className="font-semibold text-slate-800">Traveler Safety</h3>
                <p className="text-xs text-gray-500">{travelers.length} travelers tracked</p>
              </div>
            </div>

            <div className="p-5 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                  <p>Loading travelers...</p>
                </div>
              ) : travelers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">👤</div>
                  <h4 className="text-lg font-semibold text-slate-700 mb-2">No travelers tracked yet</h4>
                  <p className="text-gray-500">Travelers will appear here when they opt-in to tracking</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {travelers.map((traveler) => (
                    <div key={traveler.id} className="p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {traveler.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{traveler.name}</h4>
                            <p className="text-sm text-gray-500">{traveler.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {traveler.sosActive && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 animate-pulse">
                              🚨 SOS
                            </span>
                          )}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${traveler.optIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {traveler.optIn ? '📍 Sharing' : '🔒 Private'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Last check-in: {traveler.lastCheckIn ? new Date(traveler.lastCheckIn).toLocaleString() : 'Never'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCheckIn(traveler.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        >
                          ✓ Check-in
                        </button>
                        <button
                          onClick={() => handleSOS(traveler.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          🚨 SOS
                        </button>
                        <button
                          onClick={() => toggleOptIn(traveler.id)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          {traveler.optIn ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
