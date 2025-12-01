import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function uid() { return Math.random().toString(36).slice(2,9); }
function readLS(key, fallback){ try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch{ return fallback; } }
function writeLS(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch{} }

const LS_KEY = 'td_policies_v1';

const samplePolicy = () => ({
  id: uid(),
  meta: { name: 'Default Travel Policy', department: 'Global', region: 'All', groups: ['All Employees'], costCenters: [] },
  rules: {
    booking: { airfareClass: 'economy', advanceDays: 14, preferDirect: true },
    accommodation: { nightlyLimit: 150, preferredTypes: ['Hotel'] },
    transport: { taxiAllowed: true, ridesharePreferred: true, carClass: 'standard' },
    insurance: { required: true, provider: '' },
    riskApproval: { type: 'manual', autoThreshold: 0 }
  },
  versions: [ { id: uid(), ts: Date.now(), note: 'Initial', snapshot: null } ],
  createdAt: Date.now(),
});

export default function PolicyBuilder(){
  const navigate = useNavigate();
  const [uiCollapsed, setUiCollapsed] = useState({});
  const [policies, setPolicies] = useState(() => readLS(LS_KEY, [ samplePolicy() ]));
  const [selectedId, setSelectedId] = useState(policies[0]?.id || null);
  const [editing, setEditing] = useState(null);
  const [versionNote, setVersionNote] = useState('');
  const fileRef = useRef();
  const mainRef = useRef(null);

  useEffect(()=>{ writeLS(LS_KEY, policies); }, [policies]);
  useEffect(()=>{ if(!selectedId && policies.length) setSelectedId(policies[0].id); }, [policies, selectedId]);

  function selectPolicy(id){
    setSelectedId(id);
    setTimeout(() => {
      if(mainRef.current){
        mainRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }

  function createNew(){
    const p = {
      id: uid(),
      meta: { name: 'New Policy', department: '', region: '', groups: [], costCenters: [] },
      rules: { booking: { airfareClass: 'economy', advanceDays: 14, preferDirect: true }, accommodation: { nightlyLimit: 150, preferredTypes: ['Hotel'] }, transport: { taxiAllowed: true, ridesharePreferred: true, carClass: 'standard' }, insurance: { required: false, provider: '' }, riskApproval: { type: 'manual', autoThreshold: 0 } },
      versions: [],
      createdAt: Date.now()
    };
    setPolicies(s => [p, ...s]);
    setSelectedId(p.id);
    setEditing(p);
  }

  function savePolicy(edit){
    setPolicies(prev => prev.map(p => {
      if(p.id !== edit.id) return p;
      const snapshot = { id: uid(), ts: Date.now(), note: versionNote || 'Saved', snapshot: { meta: edit.meta, rules: edit.rules } };
      return { ...p, meta: edit.meta, rules: edit.rules, versions: [snapshot, ...(p.versions||[]) ] };
    }));
    setEditing(null);
    setVersionNote('');
  }

  function discardEdit(){ setEditing(null); setVersionNote(''); }

  function deletePolicy(id){
    if(!confirm('Delete this policy?')) return;
    setPolicies(s => s.filter(x => x.id !== id));
    if(selectedId === id) setSelectedId(policies[0]?.id || null);
  }

  function duplicatePolicy(id){
    const src = policies.find(p=>p.id===id);
    if(!src) return;
    const copy = { ...src, id: uid(), meta: { ...src.meta, name: src.meta.name + ' (Copy)' }, createdAt: Date.now(), versions: [] };
    setPolicies(s => [copy, ...s]);
    setSelectedId(copy.id);
  }

  function exportPolicy(policy){
    const data = JSON.stringify(policy, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${policy.meta?.name || 'policy'}.json`; a.click(); URL.revokeObjectURL(url);
  }

  function exportAll(){
    const data = JSON.stringify(policies, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `policies-all.json`; a.click(); URL.revokeObjectURL(url);
  }

  function handleFileImport(e){
    const f = e.target.files && e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const parsed = JSON.parse(reader.result);
        if(Array.isArray(parsed)){
          const copies = parsed.map(p => ({ ...p, id: uid(), createdAt: Date.now(), versions: p.versions || [] }));
          setPolicies(s => [...copies, ...s]);
        } else if(parsed && parsed.meta){
          const p = { ...parsed, id: uid(), createdAt: Date.now(), versions: parsed.versions || [] };
          setPolicies(s => [p, ...s]);
        }
      }catch(err){ alert('Invalid JSON'); }
      fileRef.current.value = null;
    };
    reader.readAsText(f);
  }

  function restoreVersion(policyId, version){
    if(!confirm('Restore this version?')) return;
    const p = policies.find(x=>x.id===policyId);
    if(!p) return;
    const snapshot = { id: uid(), ts: Date.now(), note: 'Restored', snapshot: version.snapshot };
    setPolicies(prev => prev.map(x => x.id === policyId ? { ...x, meta: version.snapshot?.meta || x.meta, rules: version.snapshot?.rules || x.rules, versions: [snapshot, ...(x.versions||[])] } : x));
  }

  const selected = policies.find(p => p.id === selectedId) || null;

  return (
    <div className="min-h-screen font-sans" style={{backgroundColor:'var(--bg-color)', color:'var(--text-color)'}}>
      <div className="max-w-[1200px] mx-auto p-6">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{color:'var(--text-color)'}}>Travel Policy Builder</h1>
            <p className="text-sm mt-1" style={{color:'var(--text-muted)'}}>Create and manage travel policies for your organization</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={createNew} className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{backgroundColor:'var(--primary-color)'}}>+ New Policy</button>
            <button type="button" onClick={exportAll} className="px-4 py-2 text-sm font-medium rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}>Export All</button>
            <label className="px-4 py-2 text-sm font-medium rounded-lg cursor-pointer" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}>
              Import
              <input ref={fileRef} type="file" accept="application/json" onChange={handleFileImport} className="hidden" />
            </label>
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm font-medium rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}>← Back</button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Policy List */}
          <aside className="col-span-12 lg:col-span-4">
            <div className="rounded-xl p-5 sticky top-6" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{color:'var(--text-color)'}}>Policies ({policies.length})</h3>
              </div>
              
              <div className="space-y-3 max-h-[65vh] overflow-auto pr-1">
                {policies.map(p => (
                  <div 
                    key={p.id} 
                    className="p-4 rounded-lg cursor-pointer transition-all"
                    style={{
                      backgroundColor: p.id === selectedId ? 'rgba(99,102,241,0.08)' : 'transparent',
                      border: p.id === selectedId ? '2px solid var(--primary-color)' : '1px solid var(--border-color)'
                    }}
                    onClick={() => selectPolicy(p.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate" style={{color:'var(--text-color)'}}>{p.meta?.name}</div>
                        <div className="text-xs mt-1" style={{color:'var(--text-muted)'}}>
                          {p.meta?.department || 'No department'} • {p.meta?.region || 'No region'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button type="button" className="px-2.5 py-1 text-xs font-medium rounded" style={{backgroundColor:'rgba(99,102,241,0.1)', color:'var(--primary-color)'}} onClick={(e) => { e.stopPropagation(); setEditing(JSON.parse(JSON.stringify(p))); selectPolicy(p.id); }}>Edit</button>
                      <button type="button" className="px-2.5 py-1 text-xs font-medium rounded" style={{backgroundColor:'rgba(107,114,128,0.1)', color:'var(--text-muted)'}} onClick={(e) => { e.stopPropagation(); duplicatePolicy(p.id); }}>Duplicate</button>
                    </div>
                  </div>
                ))}
                {policies.length === 0 && (
                  <div className="text-center py-8" style={{color:'var(--text-muted)'}}>
                    <div className="text-3xl mb-2">📋</div>
                    No policies yet
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content - Policy Details */}
          <main className="col-span-12 lg:col-span-8" ref={mainRef} tabIndex={-1}>
            {!selected ? (
              <div className="rounded-xl p-8 text-center" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="text-4xl mb-3">📄</div>
                <div style={{color:'var(--text-muted)'}}>Select a policy to view details</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Policy Header Card */}
                <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold" style={{color:'var(--text-color)'}}>{selected.meta.name}</h2>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full" style={{backgroundColor:'rgba(99,102,241,0.1)', color:'var(--primary-color)'}}>{selected.meta.department || 'No department'}</span>
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full" style={{backgroundColor:'rgba(16,185,129,0.1)', color:'#059669'}}>{selected.meta.region || 'No region'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setEditing(JSON.parse(JSON.stringify(selected)))} className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{backgroundColor:'var(--primary-color)'}}>Edit</button>
                      <button type="button" onClick={() => exportPolicy(selected)} className="px-4 py-2 text-sm font-medium rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}>Export</button>
                      <button type="button" onClick={() => deletePolicy(selected.id)} className="px-4 py-2 text-sm font-medium rounded-lg" style={{border:'1px solid #fecaca', backgroundColor:'rgba(239,68,68,0.05)', color:'#dc2626'}}>Delete</button>
                    </div>
                  </div>
                </div>

                {/* Rules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Booking */}
                  <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">✈️</span>
                      <h4 className="font-semibold" style={{color:'var(--text-color)'}}>Booking Rules</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{color:'var(--text-muted)'}}>Airfare Class</span>
                        <span className="text-sm font-medium px-2.5 py-1 rounded" style={{backgroundColor:'rgba(99,102,241,0.1)', color:'var(--primary-color)'}}>{selected.rules.booking.airfareClass}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{color:'var(--text-muted)'}}>Advance Booking</span>
                        <span className="text-sm font-medium" style={{color:'var(--text-color)'}}>{selected.rules.booking.advanceDays} days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{color:'var(--text-muted)'}}>Direct Flights</span>
                        <span className={`text-sm font-medium px-2.5 py-1 rounded ${selected.rules.booking.preferDirect ? '' : ''}`} style={{backgroundColor: selected.rules.booking.preferDirect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: selected.rules.booking.preferDirect ? '#059669' : '#dc2626'}}>{selected.rules.booking.preferDirect ? 'Preferred' : 'Not required'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Accommodation */}
                  <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🏨</span>
                      <h4 className="font-semibold" style={{color:'var(--text-color)'}}>Accommodation</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{color:'var(--text-muted)'}}>Nightly Limit</span>
                        <span className="text-sm font-bold" style={{color:'var(--text-color)'}}>${selected.rules.accommodation.nightlyLimit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{color:'var(--text-muted)'}}>Preferred Types</span>
                        <span className="text-sm font-medium" style={{color:'var(--text-color)'}}>{(selected.rules.accommodation.preferredTypes||[]).join(', ') || 'Any'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transportation */}
                  <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🚗</span>
                      <h4 className="font-semibold" style={{color:'var(--text-color)'}}>Transportation</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{color:'var(--text-muted)'}}>Taxi</span>
                        <span className={`text-sm font-medium px-2.5 py-1 rounded`} style={{backgroundColor: selected.rules.transport.taxiAllowed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: selected.rules.transport.taxiAllowed ? '#059669' : '#dc2626'}}>{selected.rules.transport.taxiAllowed ? 'Allowed' : 'Not allowed'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{color:'var(--text-muted)'}}>Rideshare</span>
                        <span className={`text-sm font-medium px-2.5 py-1 rounded`} style={{backgroundColor: selected.rules.transport.ridesharePreferred ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: selected.rules.transport.ridesharePreferred ? '#059669' : 'var(--text-muted)'}}>{selected.rules.transport.ridesharePreferred ? 'Preferred' : 'Optional'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Insurance & Risk */}
                  <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🛡️</span>
                      <h4 className="font-semibold" style={{color:'var(--text-color)'}}>Insurance & Risk</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{color:'var(--text-muted)'}}>Insurance</span>
                        <span className={`text-sm font-medium px-2.5 py-1 rounded`} style={{backgroundColor: selected.rules.insurance.required ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: selected.rules.insurance.required ? '#059669' : '#d97706'}}>{selected.rules.insurance.required ? 'Required' : 'Optional'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{color:'var(--text-muted)'}}>Risk Approval</span>
                        <span className="text-sm font-medium px-2.5 py-1 rounded" style={{backgroundColor:'rgba(99,102,241,0.1)', color:'var(--primary-color)'}}>{selected.rules.riskApproval.type === 'auto' ? `Auto (up to $${selected.rules.riskApproval.autoThreshold})` : 'Manual'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Groups & Cost Centers */}
                <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                  <h4 className="font-semibold mb-4" style={{color:'var(--text-color)'}}>Assigned Groups & Cost Centers</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(selected.meta.groups||[]).map((g,i) => (
                      <span key={i} className="px-3 py-1.5 text-xs font-medium rounded-full" style={{backgroundColor:'rgba(99,102,241,0.1)', color:'var(--primary-color)'}}>{g}</span>
                    ))}
                    {(selected.meta.costCenters||[]).map((c,i) => (
                      <span key={i} className="px-3 py-1.5 text-xs font-medium rounded-full" style={{backgroundColor:'rgba(245,158,11,0.1)', color:'#d97706'}}>{c}</span>
                    ))}
                    {!(selected.meta.groups||[]).length && !(selected.meta.costCenters||[]).length && (
                      <span className="text-sm" style={{color:'var(--text-muted)'}}>No groups or cost centers assigned</span>
                    )}
                  </div>
                </div>

                {/* Version History */}
                <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                  <h4 className="font-semibold mb-4" style={{color:'var(--text-color)'}}>Version History</h4>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {(selected.versions||[]).map(v => (
                      <div key={v.id} className="flex items-center justify-between p-3 rounded-lg" style={{backgroundColor:'rgba(0,0,0,0.02)'}}>
                        <div>
                          <div className="text-sm font-medium" style={{color:'var(--text-color)'}}>{new Date(v.ts).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                          <div className="text-xs" style={{color:'var(--text-muted)'}}>{v.note}</div>
                        </div>
                        <button type="button" className="px-3 py-1.5 text-xs font-medium rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} onClick={() => restoreVersion(selected.id, v)}>Restore</button>
                      </div>
                    ))}
                    {!(selected.versions||[]).length && (
                      <div className="text-sm py-4 text-center" style={{color:'var(--text-muted)'}}>No saved versions yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Edit Modal */}
        {editing && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto">
            <div className="fixed inset-0 bg-black/50" onClick={discardEdit}></div>
            <div className="relative rounded-xl w-full max-w-3xl my-8" style={{backgroundColor:'var(--card-bg)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
              {/* Modal Header */}
              <div className="p-5 flex items-center justify-between" style={{borderBottom:'1px solid var(--border-color)'}}>
                <h3 className="text-lg font-semibold" style={{color:'var(--text-color)'}}>Edit Policy</h3>
                <button type="button" onClick={discardEdit} className="p-2 rounded-lg hover:bg-gray-100" style={{color:'var(--text-muted)'}}>✕</button>
              </div>
              
              {/* Modal Body */}
              <div className="p-5 max-h-[70vh] overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Meta */}
                  <div className="space-y-4">
                    <h4 className="font-semibold" style={{color:'var(--text-color)'}}>Policy Details</h4>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Policy Name</label>
                      <input className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={editing.meta.name} onChange={e=> setEditing(ed => ({ ...ed, meta: { ...ed.meta, name: e.target.value } }))} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Department</label>
                      <input className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={editing.meta.department} onChange={e=> setEditing(ed => ({ ...ed, meta: { ...ed.meta, department: e.target.value } }))} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Region</label>
                      <input className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={editing.meta.region} onChange={e=> setEditing(ed => ({ ...ed, meta: { ...ed.meta, region: e.target.value } }))} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Groups (comma separated)</label>
                      <input className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={(editing.meta.groups||[]).join(', ')} onChange={e=> setEditing(ed => ({ ...ed, meta: { ...ed.meta, groups: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) } }))} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Cost Centers (comma separated)</label>
                      <input className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={(editing.meta.costCenters||[]).join(', ')} onChange={e=> setEditing(ed => ({ ...ed, meta: { ...ed.meta, costCenters: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) } }))} />
                    </div>
                  </div>

                  {/* Right Column - Rules */}
                  <div className="space-y-4">
                    <h4 className="font-semibold" style={{color:'var(--text-color)'}}>Booking Rules</h4>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Airfare Class</label>
                      <select className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={editing.rules.booking.airfareClass} onChange={e => setEditing(ed => ({ ...ed, rules: { ...ed.rules, booking: { ...ed.rules.booking, airfareClass: e.target.value } } }))}>
                        <option value="economy">Economy</option>
                        <option value="premium-economy">Premium Economy</option>
                        <option value="business">Business</option>
                        <option value="first">First Class</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Advance Booking (days)</label>
                      <input type="number" className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={editing.rules.booking.advanceDays} onChange={e => setEditing(ed => ({ ...ed, rules: { ...ed.rules, booking: { ...ed.rules.booking, advanceDays: Number(e.target.value) } } }))} />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" checked={editing.rules.booking.preferDirect} onChange={e=> setEditing(ed=> ({ ...ed, rules: { ...ed.rules, booking: { ...ed.rules.booking, preferDirect: e.target.checked } } }))} />
                      <span className="text-sm" style={{color:'var(--text-color)'}}>Prefer direct flights</span>
                    </label>

                    <h4 className="font-semibold pt-2" style={{color:'var(--text-color)'}}>Accommodation</h4>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Nightly Limit (USD)</label>
                      <input type="number" className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={editing.rules.accommodation.nightlyLimit} onChange={e => setEditing(ed => ({ ...ed, rules: { ...ed.rules, accommodation: { ...ed.rules.accommodation, nightlyLimit: Number(e.target.value) } } }))} />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Preferred Types (comma separated)</label>
                      <input className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={(editing.rules.accommodation.preferredTypes||[]).join(', ')} onChange={e => setEditing(ed => ({ ...ed, rules: { ...ed.rules, accommodation: { ...ed.rules.accommodation, preferredTypes: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) } } }))} />
                    </div>

                    <h4 className="font-semibold pt-2" style={{color:'var(--text-color)'}}>Transportation</h4>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" checked={editing.rules.transport.taxiAllowed} onChange={e=> setEditing(ed=> ({ ...ed, rules: { ...ed.rules, transport: { ...ed.rules.transport, taxiAllowed: e.target.checked } } }))} />
                      <span className="text-sm" style={{color:'var(--text-color)'}}>Taxi allowed</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" checked={editing.rules.transport.ridesharePreferred} onChange={e=> setEditing(ed=> ({ ...ed, rules: { ...ed.rules, transport: { ...ed.rules.transport, ridesharePreferred: e.target.checked } } }))} />
                      <span className="text-sm" style={{color:'var(--text-color)'}}>Rideshare preferred</span>
                    </label>

                    <h4 className="font-semibold pt-2" style={{color:'var(--text-color)'}}>Insurance & Risk</h4>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded" checked={editing.rules.insurance.required} onChange={e=> setEditing(ed=> ({ ...ed, rules: { ...ed.rules, insurance: { ...ed.rules.insurance, required: e.target.checked } } }))} />
                      <span className="text-sm" style={{color:'var(--text-color)'}}>Insurance required</span>
                    </label>

                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Risk Approval</label>
                      <select className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={editing.rules.riskApproval.type} onChange={e=> setEditing(ed=> ({ ...ed, rules: { ...ed.rules, riskApproval: { ...ed.rules.riskApproval, type: e.target.value } } }))}>
                        <option value="manual">Manual Approval</option>
                        <option value="auto">Auto Approval</option>
                      </select>
                    </div>

                    {editing.rules.riskApproval.type === 'auto' && (
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Auto-approve up to (USD)</label>
                        <input type="number" className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={editing.rules.riskApproval.autoThreshold} onChange={e=> setEditing(ed=> ({ ...ed, rules: { ...ed.rules, riskApproval: { ...ed.rules.riskApproval, autoThreshold: Number(e.target.value) } } }))} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-5 flex items-center justify-between gap-4" style={{borderTop:'1px solid var(--border-color)'}}>
                <input 
                  placeholder="Version note (e.g., Updated nightly limit)" 
                  value={versionNote} 
                  onChange={e=>setVersionNote(e.target.value)} 
                  className="flex-1 p-2.5 text-sm rounded-lg" 
                  style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} 
                />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={discardEdit} className="px-4 py-2 text-sm font-medium rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}>Cancel</button>
                  <button type="button" onClick={() => savePolicy(editing)} className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{backgroundColor:'var(--primary-color)'}}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
