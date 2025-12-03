import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';
const STATUSES = ['pending', 'approved', 'rejected', 'active', 'completed'];

export default function Trips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRole] = useState(() => {
    try { return localStorage.getItem('currentRole') || 'employee'; } catch { return 'employee'; }
  });
  const [currentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')) || { name: 'User', email: '' }; } catch { return { name: 'User', email: '' }; }
  });
  const [filter, setFilter] = useState({ status: 'all', search: '' });
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ requester: '', requesterEmail: '', department: '', destination: '', start: '', end: '', purpose: '', costEstimate: '', riskLevel: 'Low' });

  async function fetchTrips() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/trips`);
      if (res?.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.trips)) setTrips(data.trips);
      }
    } catch (e) { console.warn('fetchTrips failed', e); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchTrips(); }, []);
  useEffect(() => { 
    if (showForm) setForm({ requester: currentUser?.name || '', requesterEmail: currentUser?.email || '', department: '', destination: '', start: '', end: '', purpose: '', costEstimate: '', riskLevel: 'Low' }); 
  }, [showForm, currentUser]);

  const visible = trips.filter(t => {
    if (filter.status !== 'all' && t.status !== filter.status) return false;
    if (filter.search) {
      const s = filter.search.toLowerCase();
      if (!t.destination?.toLowerCase().includes(s) && !t.requester?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const stats = { total: trips.length, pending: trips.filter(t => t.status === 'pending').length, approved: trips.filter(t => t.status === 'approved').length, active: trips.filter(t => t.status === 'active').length };

  async function addTrip() {
    if (!form.destination || !form.start || !form.end) { alert('Please fill destination and dates'); return; }
    try {
      const res = await fetch(`${API_BASE}/api/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, costEstimate: Number(form.costEstimate) || 0 }) });
      if (res.ok) { await fetchTrips(); setShowForm(false); }
    } catch (e) { console.error(e); }
  }

  async function updateStatus(id, status) {
    try { 
      const res = await fetch(`${API_BASE}/api/trips/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); 
      if (res.ok) await fetchTrips(); 
    } catch (e) { console.error(e); }
  }

  async function deleteTrip(id) {
    if (!confirm('Delete this trip?')) return;
    try { 
      const res = await fetch(`${API_BASE}/api/trips/${id}`, { method: 'DELETE' }); 
      if (res.ok) { await fetchTrips(); setSelected(null); } 
    } catch (e) { console.error(e); }
  }

  const statusColors = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', active: '#6366f1', completed: '#64748b' };
  const riskColors = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--card-text)' }}>Trip Management</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>View, approve, and monitor employee travel requests</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-lg font-semibold text-white" style={{ background: 'var(--primary, #6366f1)' }}>+ New Trip</button>
            <button onClick={fetchTrips} className="px-4 py-2.5 rounded-lg font-medium border" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }}>↻ Refresh</button>
            <button onClick={() => navigate(-1)} className="px-4 py-2.5 rounded-lg font-medium border" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }}>← Back</button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Trips', value: stats.total, icon: '📋', color: '#6366f1' },
            { label: 'Pending', value: stats.pending, icon: '⏳', color: '#f59e0b' },
            { label: 'Approved', value: stats.approved, icon: '✓', color: '#10b981' },
            { label: 'Active', value: stats.active, icon: '✈️', color: '#6366f1' }
          ].map((s, i) => (
            <div key={i} className="p-5 rounded-xl shadow-sm" style={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="p-4 rounded-xl mb-6 flex flex-wrap gap-3 items-center" style={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <select 
            value={filter.status} 
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} 
            className="px-4 py-2.5 rounded-lg text-sm border"
            style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }}
          >
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <input 
            type="text" 
            placeholder="🔍 Search destination or requester..." 
            value={filter.search} 
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} 
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg text-sm border"
            style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }}
          />
          <span className="ml-auto text-sm" style={{ color: 'var(--muted)' }}>{visible.length} of {trips.length} trips</span>
        </div>

        {/* Trip List */}
        <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)' }}>
          {loading ? (
            <div className="p-12 text-center" style={{ color: 'var(--muted)' }}>
              <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p>Loading trips...</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">✈️</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--card-text)' }}>No trips found</h3>
              <p className="mb-4" style={{ color: 'var(--muted)' }}>Create a new trip request to get started</p>
              <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-lg font-semibold text-white" style={{ background: 'var(--primary, #6366f1)' }}>+ Create Trip</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Traveler</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Risk</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Cost</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(t => {
                    const sc = statusColors[t.status] || '#64748b';
                    const rc = riskColors[t.riskLevel] || '#10b981';
                    return (
                      <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer hover:bg-indigo-50/50 transition-colors" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                              {t.requester?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold" style={{ color: 'var(--card-text)' }}>{t.requester || 'Unknown'}</div>
                              <div className="text-xs" style={{ color: 'var(--muted)' }}>{t.department || 'No dept'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium" style={{ color: 'var(--card-text)' }}>{t.destination}</td>
                        <td className="px-4 py-4 text-sm" style={{ color: 'var(--muted)' }}>{t.start} → {t.end}</td>
                        <td className="px-4 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${sc}15`, color: sc }}>{t.status}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: `${rc}15`, color: rc }}>{t.riskLevel || 'Low'}</span>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold" style={{ color: 'var(--card-text)' }}>${t.costEstimate?.toLocaleString() || '0'}</td>
                        <td className="px-4 py-4">
                          <button onClick={e => { e.stopPropagation(); setSelected(t); }} className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>View</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Trip Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-auto rounded-2xl shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="p-5 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--card-text)' }}>New Trip Request</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Fill in the travel details</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-2xl p-1 hover:bg-gray-100 rounded" style={{ color: 'var(--muted)' }}>×</button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-text)' }}>Requester</label>
                  <input type="text" value={form.requester} onChange={e => setForm({ ...form, requester: e.target.value })} placeholder="John Doe" className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-text)' }}>Email</label>
                  <input type="email" value={form.requesterEmail} onChange={e => setForm({ ...form, requesterEmail: e.target.value })} placeholder="john@company.com" className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-text)' }}>Department</label>
                  <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }}>
                    <option value="">Select</option>
                    <option>Engineering</option>
                    <option>Sales</option>
                    <option>Marketing</option>
                    <option>Finance</option>
                    <option>HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-text)' }}>Destination *</label>
                  <input type="text" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="New York, USA" className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-text)' }}>Start Date *</label>
                  <input type="date" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-text)' }}>End Date *</label>
                  <input type="date" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-text)' }}>Risk Level</label>
                  <div className="flex gap-2">
                    {['Low', 'Medium', 'High'].map(l => (
                      <button key={l} type="button" onClick={() => setForm({ ...form, riskLevel: l })} className="flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all" style={{ background: form.riskLevel === l ? `${riskColors[l]}15` : 'var(--card)', color: form.riskLevel === l ? riskColors[l] : 'var(--muted)', borderColor: form.riskLevel === l ? riskColors[l] : 'rgba(0,0,0,0.1)' }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-text)' }}>Cost ($)</label>
                  <input type="number" value={form.costEstimate} onChange={e => setForm({ ...form, costEstimate: e.target.value })} placeholder="2500" className="w-full px-3 py-2.5 rounded-lg border text-sm" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }} />
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--card-text)' }}>Purpose</label>
                <textarea value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} rows={3} placeholder="Describe the purpose..." className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }} />
              </div>
              <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-lg font-medium border" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }}>Cancel</button>
                <button onClick={addTrip} className="flex-1 py-3 rounded-lg font-semibold text-white" style={{ background: 'var(--primary, #6366f1)' }}>Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Details Modal */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="p-5 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {selected.requester?.charAt(0).toUpperCase() || 'T'}
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--card-text)' }}>{selected.destination}</h2>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{selected.requester} • {selected.department || 'No department'}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-2xl p-1 hover:bg-gray-100 rounded" style={{ color: 'var(--muted)' }}>×</button>
            </div>
            <div className="p-5">
              <div className="flex gap-3 mb-5">
                <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: `${statusColors[selected.status] || '#64748b'}15`, color: statusColors[selected.status] || '#64748b' }}>
                  {selected.status?.charAt(0).toUpperCase() + selected.status?.slice(1)}
                </span>
                <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: `${riskColors[selected.riskLevel] || '#10b981'}15`, color: riskColors[selected.riskLevel] || '#10b981' }}>
                  {selected.riskLevel || 'Low'} Risk
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--muted)' }}>Travel Dates</div>
                  <div className="text-base font-semibold" style={{ color: 'var(--card-text)' }}>📅 {selected.start} → {selected.end}</div>
                </div>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.02)' }}>
                  <div className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--muted)' }}>Estimated Cost</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--card-text)' }}>${selected.costEstimate?.toLocaleString() || '0'}</div>
                </div>
              </div>
              <div className="p-4 rounded-xl mb-5" style={{ background: 'rgba(0,0,0,0.02)' }}>
                <div className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--muted)' }}>Purpose</div>
                <div style={{ color: 'var(--card-text)', lineHeight: 1.6 }}>{selected.purpose || 'No purpose specified'}</div>
              </div>
              <div className="flex flex-wrap gap-3 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                {selected.status === 'pending' && (currentRole === 'manager' || currentRole === 'finance' || currentRole === 'admin') && (
                  <>
                    <button onClick={() => { updateStatus(selected.id, 'approved'); setSelected(null); }} className="px-5 py-2.5 rounded-lg font-semibold text-white" style={{ background: '#10b981' }}>✓ Approve</button>
                    <button onClick={() => { updateStatus(selected.id, 'rejected'); setSelected(null); }} className="px-5 py-2.5 rounded-lg font-semibold border" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderColor: '#ef4444' }}>✕ Reject</button>
                  </>
                )}
                {selected.status === 'approved' && (
                  <button onClick={() => { updateStatus(selected.id, 'active'); setSelected(null); }} className="px-5 py-2.5 rounded-lg font-semibold text-white" style={{ background: '#6366f1' }}>▶ Start Trip</button>
                )}
                {selected.status === 'active' && (
                  <button onClick={() => { updateStatus(selected.id, 'completed'); setSelected(null); }} className="px-5 py-2.5 rounded-lg font-semibold text-white" style={{ background: '#64748b' }}>✔ Complete</button>
                )}
                <button onClick={() => setSelected(null)} className="px-5 py-2.5 rounded-lg font-medium border" style={{ background: 'var(--card)', color: 'var(--card-text)', borderColor: 'rgba(0,0,0,0.1)' }}>Close</button>
                <button onClick={() => deleteTrip(selected.id)} className="px-5 py-2.5 rounded-lg font-medium ml-auto" style={{ color: '#ef4444' }}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
