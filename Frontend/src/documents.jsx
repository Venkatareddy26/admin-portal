import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DocSearch from './components/DocSearch';
import DocGroup from './components/DocGroup';
import DocPreview from './components/DocPreview';

function uid(prefix='d'){ return `${prefix}_${Date.now()}_${Math.floor(Math.random()*9000+1000)}` }
function readLS(key, fallback){ try{ const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }catch{ return fallback; } }
function writeLS(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch{}
}

export default function Documents(){
  const navigate = useNavigate();
  const [collapsedPanels, setCollapsedPanels] = useState({});
  // start with no seeded/demo employees; rely on persisted store or backend
  const [employees, setEmployees] = useState(()=> readLS('td_employees', []));
  const [trips, setTrips] = useState(()=> readLS('td_trips_v2', []));
  const [docs, setDocs] = useState(()=> readLS('td_docs_v1', []));
  const [policies, setPolicies] = useState(()=> readLS('td_doc_policies', { /* destinationName: [ 'passport','vaccine' ] */ }));
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedTrip, setSelectedTrip] = useState('');
  const [reminders, setReminders] = useState(()=> readLS('td_doc_reminders', []));
  const [showSignModal, setShowSignModal] = useState(false);
  const [signTargetDoc, setSignTargetDoc] = useState(null);
  const [uploadType, setUploadType] = useState('passport');
  const [uploadExpiry, setUploadExpiry] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest | oldest | expiry
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(()=> writeLS('td_docs_v1', docs), [docs]);
  useEffect(()=> writeLS('td_doc_policies', policies), [policies]);
  useEffect(()=> writeLS('td_doc_reminders', reminders), [reminders]);

  // Upload file and store as base64 dataURL (suitable for small files)
  function handleFileUpload(file, meta){
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const d = {
        id: uid('doc'),
        employeeId: meta.employeeId,
        tripId: meta.tripId || null,
        type: meta.type || 'other',
        filename: file.name,
        dataUrl,
        uploadedAt: new Date().toISOString(),
        expiry: meta.expiry || null,
        signed: false,
        verified: false,
        notes: meta.notes || ''
      };
      setDocs(s => [d, ...s]);
    };
    reader.readAsDataURL(file);
  }

  function downloadDoc(doc){
    try{
      const arr = doc.dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8 = new Uint8Array(n);
      while(n--) u8[n] = bstr.charCodeAt(n);
      const blob = new Blob([u8], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = doc.filename || 'download'; a.click(); URL.revokeObjectURL(url);
    }catch(e){ alert('Download failed'); }
  }

  // reminders for expiring docs (within 30 days)
  useEffect(()=>{
    const now = Date.now();
    const soon = now + 1000*60*60*24*30; // 30 days
    const found = docs.filter(d => d.expiry && new Date(d.expiry).getTime() <= soon).map(d => ({ id: d.id, employeeId: d.employeeId, type: d.type, expiry: d.expiry }));
    setReminders(found);
  }, [docs]);

  // signature canvas helpers
  function startSign(e){
    const c = canvasRef.current; if(!c) return; isDrawing.current = true; const ctx = c.getContext('2d'); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath();
  }
  function endSign(){ isDrawing.current = false; }
  function signMove(e){ if(!isDrawing.current) return; const c = canvasRef.current; const rect = c.getBoundingClientRect(); const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left; const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top; const ctx=c.getContext('2d'); ctx.lineTo(x,y); ctx.stroke(); }
  function clearSign(){ const c = canvasRef.current; const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); }
  function saveSignature(){ const c = canvasRef.current; const data = c.toDataURL('image/png'); if(signTargetDoc){ setDocs(s => s.map(d => d.id === signTargetDoc ? ({ ...d, signed: true, signature: data, signedAt: new Date().toISOString() }) : d)); setShowSignModal(false); setSignTargetDoc(null); } }

  // policy validation per trip: required types per destination name
  function validateTrip(tripId){ const trip = trips.find(t=>t.id===tripId); if(!trip) return { ok:true, missing:[] }; const dest = trip.destination || trip.destName || ''; const required = policies[dest] || []; const empDocs = docs.filter(d => d.employeeId === trip.employeeId).map(d=>d.type);
    const missing = required.filter(r => !empDocs.includes(r)); return { ok: missing.length === 0, missing };
  }

  function attachDocToTrip(docId, tripId){ setDocs(s => s.map(d => d.id === docId ? ({ ...d, tripId }) : d)); }

  // add simple policy (destination -> required doc types)
  function addPolicy(dest, types){ setPolicies(p => ({ ...p, [dest]: types })); }

  // group documents by type for UI sections
  const docGroupsByType = useMemo(() => {
    if(!selectedEmployee) return {};
    const empDocs = docs.filter(d => d.employeeId === selectedEmployee);
    const groups = {};
    empDocs.forEach(d => {
      const t = d.type || 'other';
      if(!groups[t]) groups[t] = [];
      groups[t].push(d);
    });
    return groups;
  }, [docs, selectedEmployee]);

  // collapsed state per group (type)
  const [collapsedGroups, setCollapsedGroups] = useState({});
  function toggleGroup(type){ setCollapsedGroups(s => ({ ...s, [type]: !s[type] })); }

  // filtered/sorted groups for display
  const filteredGroups = useMemo(() => {
    const out = {};
    Object.entries(docGroupsByType).forEach(([type, items]) => {
      let list = items.slice();
      if(filterText){ const f = filterText.toLowerCase(); list = list.filter(d => (d.filename||'').toLowerCase().includes(f) || (d.notes||'').toLowerCase().includes(f)); }
      if(showExpiringOnly){ const now = Date.now(); const soon = now + 1000*60*60*24*30; list = list.filter(d => d.expiry && new Date(d.expiry).getTime() <= soon); }
      if(sortBy === 'newest') list.sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      else if(sortBy === 'oldest') list.sort((a,b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
      else if(sortBy === 'expiry') list.sort((a,b) => (a.expiry?new Date(a.expiry):0) - (b.expiry?new Date(b.expiry):0));
      if(list.length) out[type] = list;
    });
    return out;
  }, [docGroupsByType, filterText, sortBy, showExpiringOnly]);

  function openPreview(d){ setPreviewDoc(d); }
  function closePreview(){ setPreviewDoc(null); }

  // download all docs in a group sequentially
  async function downloadAllInGroup(type){ const items = filteredGroups[type] || []; for(const d of items){ downloadDoc(d); await new Promise(r=>setTimeout(r,120)); } }

  return (
    <div className="min-h-screen font-sans" style={{backgroundColor:'var(--bg-color)', color:'var(--text-color)'}}>
      <div className="max-w-[1200px] mx-auto p-6">
        {/* Page Header */}
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{color:'var(--text-color)'}}>Document & Compliance</h1>
            <p className="text-sm mt-1" style={{color:'var(--text-muted)'}}>Store passports, visas, vaccine certs, insurance & validate per policy</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={()=> navigate(-1)} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}>← Back</button>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Employees */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="rounded-xl p-5 sticky top-6" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{color:'var(--text-color)'}}>Employees</h3>
                <button className="text-xs px-2 py-1 rounded" style={{color:'var(--text-muted)'}} onClick={() => setCollapsedPanels(s => ({ ...s, employees: !s.employees }))}>{collapsedPanels.employees ? 'Expand' : 'Collapse'}</button>
              </div>
              
              <div className={collapsedPanels.employees ? 'hidden' : ''}>
                {employees.length === 0 ? (
                  <div className="text-sm py-4 text-center" style={{color:'var(--text-muted)'}}>No employees found</div>
                ) : (
                  <ul className="space-y-1">
                    {employees.map(e => (
                      <li key={e.id}>
                        <button 
                          type="button" 
                          className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                          style={{
                            backgroundColor: selectedEmployee===e.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                            color: selectedEmployee===e.id ? 'var(--primary-color)' : 'var(--text-color)',
                            fontWeight: selectedEmployee===e.id ? '500' : '400'
                          }}
                          onClick={()=> setSelectedEmployee(e.id)}
                        >
                          {e.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Reminders Section */}
                <div className="mt-6 pt-4" style={{borderTop:'1px solid var(--border-color)'}}>
                  <h4 className="text-sm font-medium mb-3" style={{color:'var(--text-color)'}}>Reminders</h4>
                  {reminders.length===0 ? (
                    <div className="text-xs py-2" style={{color:'var(--text-muted)'}}>No upcoming expiries</div>
                  ) : (
                    <div className="space-y-2">
                      {reminders.map(r => (
                        <div key={r.id} className="text-xs rounded-lg p-3" style={{backgroundColor:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)'}}>
                          <div className="font-medium" style={{color:'var(--text-color)'}}>{employees.find(x=>x.id===r.employeeId)?.name || '—'}</div>
                          <div style={{color:'#d97706'}}>{r.type} expires {new Date(r.expiry).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Center - Documents */}
          <section className="col-span-12 lg:col-span-6">
            <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{color:'var(--text-color)'}}>Documents</h3>
                <button className="text-xs px-2 py-1 rounded" style={{color:'var(--text-muted)'}} onClick={() => setCollapsedPanels(s => ({ ...s, documents: !s.documents }))}>{collapsedPanels.documents ? 'Expand' : 'Collapse'}</button>
              </div>
              
              <div className={collapsedPanels.documents ? 'hidden' : ''}>
                {!selectedEmployee ? (
                  <div className="text-sm py-8 text-center" style={{color:'var(--text-muted)'}}>
                    <div className="text-3xl mb-2">📄</div>
                    Select an employee to manage documents
                  </div>
                ) : (
                  <div>
                    <div className="sticky-card">
                      <DocSearch filterText={filterText} setFilterText={setFilterText} sortBy={sortBy} setSortBy={setSortBy} showExpiringOnly={showExpiringOnly} setShowExpiringOnly={setShowExpiringOnly} />
                    </div>
                    
                    {/* Document type summary */}
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      {(() => { 
                        const empDocs = docs.filter(d=> d.employeeId===selectedEmployee); 
                        const counts = empDocs.reduce((acc,d)=> { acc[d.type] = (acc[d.type]||0)+1; return acc; }, {}); 
                        return Object.entries(counts).length===0 
                          ? <div className="text-xs" style={{color:'var(--text-muted)'}}>No documents uploaded</div> 
                          : Object.entries(counts).map(([t,c]) => (
                            <span key={t} className="px-2 py-1 text-xs rounded-full font-medium" style={{backgroundColor:'rgba(99,102,241,0.1)', color:'var(--primary-color)'}}>{t}: {c}</span>
                          )); 
                      })()}
                    </div>

                    {/* Upload Section */}
                    <div className="mt-4 p-4 rounded-lg" style={{backgroundColor:'rgba(99,102,241,0.03)', border:'1px dashed var(--border-color)'}}>
                      <div className="text-xs font-medium mb-3" style={{color:'var(--text-muted)'}}>Upload New Document</div>
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="file" id="docfile" className="flex-1 text-sm rounded-lg p-2" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)'}} onChange={(e)=>{ const f = e.target.files && e.target.files[0]; if(!f) return; handleFileUpload(f, { employeeId: selectedEmployee, type: uploadType || 'other', expiry: uploadExpiry || null, notes: uploadNotes || '' }); e.target.value = null; setUploadNotes(''); setUploadExpiry(''); }} />
                          <select value={uploadType} onChange={e=> setUploadType(e.target.value)} className="text-sm rounded-lg p-2" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', minWidth:'120px'}}>
                            <option value="passport">Passport</option>
                            <option value="visa">Visa</option>
                            <option value="vaccine">Vaccine</option>
                            <option value="insurance">Insurance</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="date" placeholder="Expiry date" value={uploadExpiry} onChange={e=> setUploadExpiry(e.target.value)} className="flex-1 text-sm rounded-lg p-2" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)'}} />
                          <input placeholder="Notes (optional)" value={uploadNotes} onChange={e=> setUploadNotes(e.target.value)} className="flex-1 text-sm rounded-lg p-2" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)'}} />
                        </div>
                      </div>
                    </div>

                    {/* Document Groups */}
                    <div className="mt-4 space-y-4">
                      {Object.keys(filteredGroups).length === 0 && <div className="text-xs py-4 text-center" style={{color:'var(--text-muted)'}}>No documents uploaded or match filters</div>}
                      {Object.entries(filteredGroups).map(([type, items]) => (
                        <DocGroup key={type} type={type} items={items} collapsed={collapsedGroups[type]} onToggle={t=> toggleGroup(t)} onDownloadAll={downloadAllInGroup} onDownload={downloadDoc} onSign={(d)=> { setSignTargetDoc(d.id); setShowSignModal(true); }} onDelete={(d)=> setDocs(s => s.filter(x=>x.id!==d.id))} onPreview={openPreview} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Right Sidebar - Trips & Validation */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="rounded-xl p-5 sticky top-6" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{color:'var(--text-color)'}}>Trips & Validation</h3>
                <button className="text-xs px-2 py-1 rounded" style={{color:'var(--text-muted)'}} onClick={() => setCollapsedPanels(s => ({ ...s, tripsPanel: !s.tripsPanel }))}>{collapsedPanels.tripsPanel ? 'Expand' : 'Collapse'}</button>
              </div>
              
              <div className={collapsedPanels.tripsPanel ? 'hidden' : ''}>
                <select value={selectedTrip} onChange={e=> setSelectedTrip(e.target.value)} className="w-full text-sm rounded-lg p-2.5" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)'}}>
                  <option value="">Select trip (optional)</option>
                  {trips.map(t => <option key={t.id} value={t.id}>{t.title || t.id}</option>)}
                </select>
                
                {selectedTrip && (
                  <div className="mt-4 p-3 rounded-lg" style={{backgroundColor:'rgba(99,102,241,0.03)'}}>
                    <div className="text-sm font-medium mb-2" style={{color:'var(--text-color)'}}>Trip details</div>
                    <div className="text-xs mb-2" style={{color:'var(--text-muted)'}}>Validation status:</div>
                    <div className="mb-3">
                      {(() => { 
                        const v = validateTrip(selectedTrip); 
                        return v.ok 
                          ? <div className="text-sm font-medium px-3 py-2 rounded-lg" style={{backgroundColor:'rgba(16,185,129,0.1)', color:'#059669'}}>✓ All required docs present</div> 
                          : <div className="text-sm font-medium px-3 py-2 rounded-lg" style={{backgroundColor:'rgba(239,68,68,0.1)', color:'#dc2626'}}>✗ Missing: {v.missing.join(', ')}</div> 
                      })()}
                    </div>
                    <div className="mt-3 pt-3" style={{borderTop:'1px solid var(--border-color)'}}>
                      <div className="text-xs font-medium mb-2" style={{color:'var(--text-muted)'}}>Attach documents to trip</div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {docs.filter(d=> d.employeeId===selectedEmployee).map(d => (
                          <div key={d.id} className="flex items-center justify-between text-xs p-2 rounded" style={{backgroundColor:'var(--card-bg)'}}>
                            <div className="truncate flex-1 mr-2" style={{color:'var(--text-color)'}}>{d.type} — {d.filename}</div>
                            <button type="button" className="px-2 py-1 rounded text-xs font-medium transition-colors" style={{backgroundColor:'var(--primary-color)', color:'white'}} onClick={()=> attachDocToTrip(d.id, selectedTrip)}>Attach</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Policies Section */}
                <div className="mt-6 pt-4" style={{borderTop:'1px solid var(--border-color)'}}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium" style={{color:'var(--text-color)'}}>Policies</h4>
                    <button type="button" className="text-xs px-2 py-1 rounded-lg font-medium" style={{backgroundColor:'var(--primary-color)', color:'white'}} onClick={()=>{ const dest = prompt('Destination name to require docs for (e.g., India)'); if(!dest) return; const types = prompt('Required types (comma separated, e.g., passport,visa)'); addPolicy(dest, (types||'').split(',').map(s=>s.trim()).filter(Boolean)); }}>+ Add</button>
                  </div>
                  <div className="text-xs mb-2" style={{color:'var(--text-muted)'}}>Destination → required types</div>
                  <div className="space-y-2">
                    {Object.keys(policies).length === 0 && <div className="text-xs py-2" style={{color:'var(--text-muted)'}}>No policies defined</div>}
                    {Object.entries(policies).map(([dest, types]) => (
                      <div key={dest} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{backgroundColor:'rgba(99,102,241,0.05)'}}>
                        <div className="font-medium" style={{color:'var(--text-color)'}}>{dest}</div>
                        <div style={{color:'var(--text-muted)'}}>{types.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Sign Modal */}
        {showSignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={()=> setShowSignModal(false)} />
            <div className="relative rounded-xl p-6 w-full max-w-lg" style={{backgroundColor:'var(--card-bg)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
              <h4 className="font-semibold text-lg mb-4" style={{color:'var(--text-color)'}}>Sign Document</h4>
              <div className="rounded-lg overflow-hidden" style={{border:'1px solid var(--border-color)'}}>
                <canvas ref={canvasRef} width={480} height={160} style={{width:'100%', height:'160px', backgroundColor:'#fafafa'}} onMouseDown={(e)=>{ isDrawing.current=true; const ctx = canvasRef.current.getContext('2d'); const rect = canvasRef.current.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.clientX-rect.left, e.clientY-rect.top); }} onMouseUp={()=>{ isDrawing.current=false; }} onMouseMove={(e)=>{ if(!isDrawing.current) return; const ctx = canvasRef.current.getContext('2d'); const rect = canvasRef.current.getBoundingClientRect(); ctx.lineTo(e.clientX-rect.left, e.clientY-rect.top); ctx.stroke(); }} />
              </div>
              <p className="text-xs mt-2 mb-4" style={{color:'var(--text-muted)'}}>Draw your signature above</p>
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-4 py-2 text-sm rounded-lg font-medium" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} onClick={()=>{ const c=canvasRef.current; const ctx=c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height); }}>Clear</button>
                <button type="button" className="px-4 py-2 text-sm rounded-lg font-medium" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} onClick={()=> { setShowSignModal(false); setSignTargetDoc(null); }}>Cancel</button>
                <button type="button" className="px-4 py-2 text-sm rounded-lg font-medium text-white" style={{backgroundColor:'var(--primary-color)'}} onClick={()=>{ const c=canvasRef.current; const data=c.toDataURL('image/png'); if(signTargetDoc){ setDocs(s=> s.map(d => d.id===signTargetDoc ? ({ ...d, signed:true, signature:data, signedAt: new Date().toISOString() }) : d)); } setShowSignModal(false); setSignTargetDoc(null); }}>Save Signature</button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closePreview} />
            <div className="relative rounded-xl p-6 w-full max-w-3xl max-h-[85vh] overflow-auto" style={{backgroundColor:'var(--card-bg)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold" style={{color:'var(--text-color)'}}>{previewDoc.filename}</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm rounded-lg font-medium" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} onClick={()=> downloadDoc(previewDoc)}>Download</button>
                  <button className="px-3 py-1.5 text-sm rounded-lg font-medium" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} onClick={closePreview}>Close</button>
                </div>
              </div>
              <div className="rounded-lg overflow-hidden" style={{border:'1px solid var(--border-color)'}}>
                { (previewDoc.dataUrl || '').startsWith('data:image/') 
                  ? <img src={previewDoc.dataUrl} alt={previewDoc.filename} style={{maxWidth:'100%', display:'block'}}/> 
                  : <div className="text-sm p-8 text-center" style={{color:'var(--text-muted)'}}>Preview not available for this file type.</div> 
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
