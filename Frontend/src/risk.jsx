import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ADVISORIES_KEY = 'td_advisories_v1';
const TRAVELER_STATE_KEY = 'td_travelers_v1';
const NOTIF_KEY = 'td_notifications';

const SAMPLE_DESTINATIONS = [
  { id: 'lon', name: 'London', lat: 51.5074, lng: -0.1278, risk: 'Low' },
  { id: 'ny', name: 'New York', lat: 40.7128, lng: -74.0060, risk: 'Low' },
  { id: 'tok', name: 'Tokyo', lat: 35.6762, lng: 139.6503, risk: 'Medium' },
  { id: 'par', name: 'Paris', lat: 48.8566, lng: 2.3522, risk: 'Low' },
  { id: 'del', name: 'Delhi', lat: 28.7041, lng: 77.1025, risk: 'High' },
];

function generateId(prefix='id'){ return `${prefix}_${Date.now()}_${Math.floor(Math.random()*9000+1000)}`; }

function riskColor(r){
  if(r === 'High') return '#ef4444';
  if(r === 'Medium') return '#f59e0b';
  return '#10b981';
}

function riskBg(r){
  if(r === 'High') return 'rgba(239,68,68,0.1)';
  if(r === 'Medium') return 'rgba(245,158,11,0.1)';
  return 'rgba(16,185,129,0.1)';
}

export default function Risk(){
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState(()=>{
    try{ const raw = localStorage.getItem('td_destinations'); if(raw) return JSON.parse(raw); }catch{}; return SAMPLE_DESTINATIONS;
  });

  const [advisories, setAdvisories] = useState(()=>{
    try{ const r = localStorage.getItem(ADVISORIES_KEY); if(r) return JSON.parse(r); }catch{}; return [];
  });
  const [showAdvForm, setShowAdvForm] = useState(false);
  const [advForm, setAdvForm] = useState({ destId: destinations[0]?.id || '', type: 'political', severity: 'medium', title: '', description: '' });

  const [travelers, setTravelers] = useState(()=>{
    try{ const r = localStorage.getItem(TRAVELER_STATE_KEY); if(r) return JSON.parse(r); }catch{}; return [
      { id: 't_alice', name: 'Alice Johnson', email: 'alice.johnson@example.com', location: { lat:51.5, lng:-0.12 }, optIn: true, lastCheckIn: new Date().toISOString(), sos: false },
      { id: 't_bob', name: 'Bob Smith', email: 'bob.smith@example.com', location: { lat:40.7, lng:-74.0 }, optIn: true, lastCheckIn: new Date().toISOString(), sos: false },
    ]; }
  );

  const [notifications, setNotifications] = useState(()=>{
    try{ const r = localStorage.getItem(NOTIF_KEY); if(r) return JSON.parse(r); }catch{}; return [];
  });

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  useEffect(()=>{ try{ localStorage.setItem('td_destinations', JSON.stringify(destinations)); }catch{} }, [destinations]);
  useEffect(()=>{ try{ localStorage.setItem(ADVISORIES_KEY, JSON.stringify(advisories)); }catch{} }, [advisories]);
  useEffect(()=>{ try{ localStorage.setItem(TRAVELER_STATE_KEY, JSON.stringify(travelers)); }catch{} }, [travelers]);
  useEffect(()=>{ try{ localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications)); }catch{} }, [notifications]);

  function processAdvisory(adv){
    const d = destinations.find(x => x.id === adv.destId);
    if(d){
      const sev = (adv.severity || 'medium').toLowerCase();
      const newRisk = sev === 'high' ? 'High' : sev === 'medium' ? 'Medium' : 'Low';
      const ranks = { 'Low': 1, 'Medium': 2, 'High': 3 };
      if(ranks[newRisk] > (ranks[d.risk] || 1)){
        setDestinations(ds => ds.map(x => x.id === d.id ? ({ ...x, risk: newRisk }) : x));
      }
    }
    setAdvisories(a => [adv, ...a].slice(0,50));
    const notif = { id: generateId('notif'), to: 'ops@example.com', subject: `Advisory: ${adv.title}`, body: adv.description, ts: new Date().toISOString() };
    setNotifications(n => [notif, ...n].slice(0,100));
  }

  function sendNotification(to, subject, body){
    const n = { id: generateId('notif'), to, subject, body, ts: new Date().toISOString() };
    setNotifications(s => [n, ...s].slice(0,100));
    return n;
  }

  function toggleOptIn(travelerId){ setTravelers(t=> t.map(x=> x.id===travelerId ? ({...x, optIn: !x.optIn}) : x)); }
  function triggerSOS(travelerId){
    setTravelers(t=> t.map(x=> x.id===travelerId ? ({...x, sos: true}) : x));
    const tr = travelers.find(x=> x.id===travelerId);
    if(tr) sendNotification('ops@example.com', `SOS: ${tr.name}`, `${tr.name} triggered SOS`);
  }
  function checkIn(travelerId){ setTravelers(t=> t.map(x=> x.id===travelerId ? ({...x, lastCheckIn: new Date().toISOString(), sos: false}) : x)); }
  function escalateForTraveler(travelerId){
    const tr = travelers.find(x=> x.id===travelerId);
    if(!tr) return;
    sendNotification('hr@example.com', `Escalation: ${tr.name}`, `Escalation for ${tr.name}`);
    sendNotification('security@example.com', `Escalation: ${tr.name}`, `Escalation for ${tr.name}`);
    alert('Escalation sent to HR and Security');
  }
  function setRisk(destId, risk){ setDestinations(d => d.map(x=> x.id===destId?({...x, risk}):x)); }

  function addEmergencyContact(name, phone, notes){
    const ec = { id: generateId('ec'), name, phone, notes };
    try{ const raw = JSON.parse(localStorage.getItem('td_emergency_contacts') || '[]'); raw.unshift(ec); localStorage.setItem('td_emergency_contacts', JSON.stringify(raw)); }catch{}
  }
  function getEmergencyContacts(){ try{ return JSON.parse(localStorage.getItem('td_emergency_contacts') || '[]'); }catch{return []} }

  return (
    <div className="min-h-screen font-sans" style={{backgroundColor:'var(--bg-color)', color:'var(--text-color)'}}>
      <div className="max-w-[1400px] mx-auto p-6">
        {/* Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{color:'var(--text-color)'}}>Risk & Safety</h1>
            <p className="text-sm mt-1" style={{color:'var(--text-muted)'}}>Global risk map, traveler safety, advisories and emergency workflows</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={()=> setShowAdvForm(true)} className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{backgroundColor:'var(--primary-color)'}}>+ New Advisory</button>
            <button type="button" onClick={()=> setShowEmergencyModal(true)} className="px-4 py-2 text-sm font-medium rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}>Emergency Contacts</button>
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm font-medium rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}>← Back</button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Map & Destinations */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Risk Map */}
            <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <h3 className="font-semibold mb-2" style={{color:'var(--text-color)'}}>Risk Map</h3>
              <p className="text-sm mb-4" style={{color:'var(--text-muted)'}}>Color-coded destinations by risk level</p>
              
              <div style={{height: 380}} className="rounded-lg overflow-hidden" >
                <MapContainer center={[20,0]} zoom={2} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {destinations.map(d => (
                    <CircleMarker key={d.id} center={[d.lat, d.lng]} radius={10} pathOptions={{ color: riskColor(d.risk), fillColor: riskColor(d.risk), fillOpacity: 0.8, weight: 2 }}>
                      <Popup><div className="font-semibold">{d.name}</div><div style={{color: riskColor(d.risk)}}>{d.risk} Risk</div></Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background: riskColor('Low')}} /><span style={{color:'var(--text-muted)'}}>Low</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background: riskColor('Medium')}} /><span style={{color:'var(--text-muted)'}}>Medium</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background: riskColor('High')}} /><span style={{color:'var(--text-muted)'}}>High</span></div>
              </div>
            </div>

            {/* Destination Cards */}
            <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <h3 className="font-semibold mb-4" style={{color:'var(--text-color)'}}>Destinations</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {destinations.map(d => (
                  <div key={d.id} className="p-4 rounded-lg" style={{backgroundColor:'rgba(0,0,0,0.02)', border:'1px solid var(--border-color)'}}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm" style={{color:'var(--text-color)'}}>{d.name}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{backgroundColor: riskBg(d.risk), color: riskColor(d.risk)}}>{d.risk}</span>
                    </div>
                    <div className="flex gap-1">
                      {['Low','Medium','High'].map(r => (
                        <button key={r} type="button" onClick={()=> setRisk(d.id, r)} className="flex-1 py-1.5 text-xs font-medium rounded transition-all" style={{backgroundColor: d.risk === r ? riskColor(r) : riskBg(r), color: d.risk === r ? 'white' : riskColor(r)}}>{r[0]}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Advisories & Travelers */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Advisories */}
            <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold" style={{color:'var(--text-color)'}}>Advisories</h3>
                  <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>{advisories.length} active</p>
                </div>
                <button type="button" onClick={()=> setShowAdvForm(true)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white" style={{backgroundColor:'var(--primary-color)'}}>+ Add</button>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-auto pr-1">
                {advisories.length === 0 && (
                  <div className="text-center py-6" style={{color:'var(--text-muted)'}}>
                    <div className="text-2xl mb-2">📋</div>
                    <div className="text-sm">No advisories yet</div>
                  </div>
                )}
                {advisories.map(a => (
                  <div key={a.id} className="p-4 rounded-lg" style={{backgroundColor:'rgba(0,0,0,0.02)', border:'1px solid var(--border-color)'}}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-medium text-sm" style={{color:'var(--text-color)'}}>{a.title}</div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0" style={{backgroundColor: a.severity==='high' ? 'rgba(239,68,68,0.1)' : a.severity==='medium' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: a.severity==='high' ? '#ef4444' : a.severity==='medium' ? '#f59e0b' : '#10b981'}}>{a.severity}</span>
                    </div>
                    <div className="text-xs mb-2" style={{color:'var(--text-muted)'}}>{new Date(a.ts).toLocaleDateString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                    <div className="text-xs mb-3" style={{color:'var(--text-muted)'}}>{a.description}</div>
                    <div className="flex gap-2">
                      <button type="button" onClick={()=> alert('Acknowledged')} className="px-2.5 py-1 text-xs font-medium rounded" style={{backgroundColor:'rgba(99,102,241,0.1)', color:'var(--primary-color)'}}>Acknowledge</button>
                      <button type="button" onClick={()=> navigator.clipboard?.writeText(a.description)} className="px-2.5 py-1 text-xs font-medium rounded" style={{backgroundColor:'rgba(107,114,128,0.1)', color:'var(--text-muted)'}}>Copy</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traveler Safety */}
            <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <h3 className="font-semibold mb-1" style={{color:'var(--text-color)'}}>Traveler Safety</h3>
              <p className="text-xs mb-4" style={{color:'var(--text-muted)'}}>Live locations, SOS, check-ins</p>
              
              <div className="space-y-3">
                {travelers.map(t => (
                  <div key={t.id} className="p-4 rounded-lg" style={{backgroundColor:'rgba(0,0,0,0.02)', border:'1px solid var(--border-color)'}}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm" style={{color:'var(--text-color)'}}>{t.name}</div>
                        <div className="text-xs" style={{color:'var(--text-muted)'}}>{t.email}</div>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{backgroundColor: t.optIn ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', color: t.optIn ? '#10b981' : 'var(--text-muted)'}}>{t.optIn ? 'Sharing' : 'Private'}</span>
                    </div>
                    <div className="text-xs mb-3" style={{color:'var(--text-muted)'}}>Last check-in: {new Date(t.lastCheckIn).toLocaleDateString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={()=> checkIn(t.id)} className="px-2.5 py-1.5 text-xs font-medium rounded" style={{backgroundColor:'rgba(16,185,129,0.1)', color:'#10b981'}}>Check-in</button>
                      <button type="button" onClick={()=> triggerSOS(t.id)} className="px-2.5 py-1.5 text-xs font-medium rounded" style={{backgroundColor:'rgba(239,68,68,0.1)', color:'#ef4444'}}>SOS</button>
                      <button type="button" onClick={()=> escalateForTraveler(t.id)} className="px-2.5 py-1.5 text-xs font-medium rounded" style={{backgroundColor:'rgba(245,158,11,0.1)', color:'#f59e0b'}}>Escalate</button>
                      <button type="button" onClick={()=> toggleOptIn(t.id)} className="px-2.5 py-1.5 text-xs font-medium rounded" style={{backgroundColor:'rgba(107,114,128,0.1)', color:'var(--text-muted)'}}>{t.optIn ? 'Disable' : 'Enable'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Response */}
            <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <h3 className="font-semibold mb-1" style={{color:'var(--text-color)'}}>Emergency Response</h3>
              <p className="text-xs mb-4" style={{color:'var(--text-muted)'}}>24/7 helpline & contacts</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{backgroundColor:'rgba(239,68,68,0.05)'}}>
                  <span className="text-xl">📞</span>
                  <div>
                    <div className="text-sm font-medium" style={{color:'var(--text-color)'}}>Emergency Hotline</div>
                    <a className="text-sm font-bold" href="tel:+18001234567" style={{color:'#ef4444'}}>+1 800 123 4567</a>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{backgroundColor:'rgba(99,102,241,0.05)'}}>
                  <span className="text-xl">✉️</span>
                  <div>
                    <div className="text-sm font-medium" style={{color:'var(--text-color)'}}>Security Team</div>
                    <a className="text-sm" href="mailto:security@example.com" style={{color:'var(--primary-color)'}}>security@example.com</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <h3 className="font-semibold mb-1" style={{color:'var(--text-color)'}}>Recent Notifications</h3>
              <p className="text-xs mb-4" style={{color:'var(--text-muted)'}}>{notifications.length} sent</p>
              
              <div className="space-y-2 max-h-40 overflow-auto">
                {notifications.length === 0 && <div className="text-xs text-center py-4" style={{color:'var(--text-muted)'}}>No notifications</div>}
                {notifications.slice(0,5).map(n => (
                  <div key={n.id} className="p-3 rounded-lg" style={{backgroundColor:'rgba(0,0,0,0.02)'}}>
                    <div className="text-sm font-medium truncate" style={{color:'var(--text-color)'}}>{n.subject}</div>
                    <div className="text-xs" style={{color:'var(--text-muted)'}}>to {n.to} • {new Date(n.ts).toLocaleDateString('en-US', {month:'short', day:'numeric'})}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* New Advisory Modal */}
        {showAdvForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={()=> setShowAdvForm(false)}></div>
            <div className="relative rounded-xl w-full max-w-md" style={{backgroundColor:'var(--card-bg)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
              <div className="p-5" style={{borderBottom:'1px solid var(--border-color)'}}>
                <h3 className="text-lg font-semibold" style={{color:'var(--text-color)'}}>Create Advisory</h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Destination</label>
                  <select className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={advForm.destId} onChange={(e)=> setAdvForm({...advForm, destId: e.target.value})}>
                    {destinations.map(d=> (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Type</label>
                    <select className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={advForm.type} onChange={(e)=> setAdvForm({...advForm, type: e.target.value})}>
                      <option value="political">Political</option>
                      <option value="weather">Weather</option>
                      <option value="health">Health</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Severity</label>
                    <select className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} value={advForm.severity} onChange={(e)=> setAdvForm({...advForm, severity: e.target.value})}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Title</label>
                  <input className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} placeholder="Advisory title" value={advForm.title} onChange={(e)=> setAdvForm({...advForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Description</label>
                  <textarea className="w-full p-2.5 text-sm rounded-lg resize-none" rows={3} style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} placeholder="Details about the advisory" value={advForm.description} onChange={(e)=> setAdvForm({...advForm, description: e.target.value})} />
                </div>
              </div>
              <div className="p-5 flex justify-end gap-2" style={{borderTop:'1px solid var(--border-color)'}}>
                <button type="button" onClick={()=> setShowAdvForm(false)} className="px-4 py-2 text-sm font-medium rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}>Cancel</button>
                <button type="button" onClick={()=> { const adv = { id: generateId('adv'), destId: advForm.destId, title: advForm.title || 'New Advisory', type: advForm.type, severity: advForm.severity, description: advForm.description, ts: new Date().toISOString() }; processAdvisory(adv); setShowAdvForm(false); setAdvForm({...advForm, title:'', description:''}); }} className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{backgroundColor:'var(--primary-color)'}}>Create Advisory</button>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contacts Modal */}
        {showEmergencyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={()=> setShowEmergencyModal(false)}></div>
            <div className="relative rounded-xl w-full max-w-md" style={{backgroundColor:'var(--card-bg)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
              <div className="p-5" style={{borderBottom:'1px solid var(--border-color)'}}>
                <h3 className="text-lg font-semibold" style={{color:'var(--text-color)'}}>Emergency Contacts</h3>
              </div>
              <div className="p-5">
                <div className="space-y-3 mb-4 max-h-48 overflow-auto">
                  {getEmergencyContacts().length === 0 && <div className="text-sm text-center py-4" style={{color:'var(--text-muted)'}}>No contacts saved</div>}
                  {getEmergencyContacts().map(ec => (
                    <div key={ec.id} className="p-3 rounded-lg" style={{backgroundColor:'rgba(0,0,0,0.02)', border:'1px solid var(--border-color)'}}>
                      <div className="font-medium text-sm" style={{color:'var(--text-color)'}}>{ec.name}</div>
                      <div className="text-sm" style={{color:'var(--primary-color)'}}>{ec.phone}</div>
                      {ec.notes && <div className="text-xs mt-1" style={{color:'var(--text-muted)'}}>{ec.notes}</div>}
                    </div>
                  ))}
                </div>
                <div className="pt-4" style={{borderTop:'1px solid var(--border-color)'}}>
                  <div className="text-sm font-medium mb-3" style={{color:'var(--text-color)'}}>Add New Contact</div>
                  <div className="space-y-2">
                    <input id="ec-name" placeholder="Name" className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} />
                    <input id="ec-phone" placeholder="Phone" className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} />
                    <input id="ec-notes" placeholder="Notes (optional)" className="w-full p-2.5 text-sm rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}} />
                  </div>
                </div>
              </div>
              <div className="p-5 flex justify-end gap-2" style={{borderTop:'1px solid var(--border-color)'}}>
                <button type="button" onClick={()=> setShowEmergencyModal(false)} className="px-4 py-2 text-sm font-medium rounded-lg" style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}>Close</button>
                <button type="button" onClick={()=> { const n = document.getElementById('ec-name'); const p = document.getElementById('ec-phone'); const notes = document.getElementById('ec-notes'); if(n?.value && p?.value) { addEmergencyContact(n.value, p.value, notes?.value || ''); n.value=''; p.value=''; if(notes) notes.value=''; setShowEmergencyModal(false); setShowEmergencyModal(true); } }} className="px-4 py-2 text-sm font-medium rounded-lg text-white" style={{backgroundColor:'var(--primary-color)'}}>Save Contact</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
