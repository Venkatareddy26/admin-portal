import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CorporateDonut from './components/CorporateDonut';
import TimeSeriesChart from './components/TimeSeriesChart';
import TripDetailModal from './components/TripDetailModal';
// Use relative URL to leverage Vite proxy
const API_BASE = '';

// Utilities
function csvDownload(filename, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}
function jsonDownload(filename, obj){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

// mock data moved to ./data/mockData.js

const COLORS = ['#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

function fmtMoney(n){ return `$${Number(n||0).toLocaleString()}` }

export default function Analytics(){
  const navigate = useNavigate();
  const [collapsedSections, setCollapsedSections] = useState({});
  const [announce, setAnnounce] = useState('');
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  useEffect(()=>{
    async function fetchData(){
      try{
        setLoading(true);
        const [tripsRes, expensesRes] = await Promise.all([
          fetch(`${API_BASE}/api/trips`),
          fetch(`${API_BASE}/api/expenses`)
        ]);

        if(tripsRes.ok){
          const data = await tripsRes.json();
          if(data.success && data.trips){
            const transformed = data.trips.map(t => ({
              id: t.id,
              employee: t.requester || 'Unknown',
              dept: t.department || 'N/A',
              region: 'N/A',
              destination: t.destination,
              spend: Number(t.costEstimate) || 0,
              date: t.start || new Date().toISOString().split('T')[0],
              status: t.status || 'pending'
            }));
            setTrips(transformed);
          }
        }

        if(expensesRes.ok){
          const data = await expensesRes.json();
          if(data.success && data.expenses){
            setExpenses(data.expenses);
          }
        }
      }catch(e){
        console.warn('fetchData failed', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // UI state
  const [deptFilter, setDeptFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [q, setQ] = useState('');
  const [startDate, setStartDate] = useState('2025-07-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const departments = useMemo(()=>['All', ...Array.from(new Set(trips.map(t=>t.dept)))], [trips]);
  const regions = useMemo(()=>['All', ...Array.from(new Set(trips.map(t=>t.region)))], [trips]);

  const filteredTrips = useMemo(()=> trips.filter(t => {
    if(deptFilter !== 'All' && t.dept !== deptFilter) return false;
    if(regionFilter !== 'All' && t.region !== regionFilter) return false;
    if(q && !(t.employee.toLowerCase().includes(q.toLowerCase()) || t.destination.toLowerCase().includes(q.toLowerCase()))) return false;
    if(startDate && t.date < startDate) return false;
    if(endDate && t.date > endDate) return false;
    if(selectedSlice && t.destination !== selectedSlice) return false;
    return true;
  }), [trips, deptFilter, regionFilter, q, startDate, endDate, selectedSlice]);

  // Frequency by employee
  const freqByEmployee = useMemo(()=>{
    const map = {};
    filteredTrips.forEach(t => map[t.employee] = (map[t.employee]||0)+1);
    return Object.entries(map).map(([k,v])=>({ name:k, trips:v }));
  }, [filteredTrips]);

  // Spend by category
  const spendByCategory = useMemo(()=>{
    const map = {};
    (expenses||[]).forEach(e => { const cat = e.category || 'Other'; map[cat] = (map[cat]||0) + (Number(e.amount)||0); });
    return Object.entries(map).map(([k,v])=>({ name:k, value:v }));
  }, [expenses]);

  // KPI quick cards for Airfare, Hotel, Car
  const kpiAir = useMemo(()=> (expenses||[]).filter(e=>/air|flight|airline/i.test(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0), [expenses]);
  const kpiHotel = useMemo(()=> (expenses||[]).filter(e=>/hotel/i.test(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0), [expenses]);
  const kpiCar = useMemo(()=> (expenses||[]).filter(e=>/car|taxi|uber|rent/i.test(e.category)).reduce((s,e)=>s+(Number(e.amount)||0),0), [expenses]);

  const compliance = useMemo(()=>{
    const approved = trips.filter(t=>t.status==='Approved').length;
    const pending = trips.filter(t=>t.status==='Pending').length;
    const completed = trips.filter(t=>t.status==='Completed').length;
    return [ { name:'Approved', value:approved }, { name:'Pending', value:pending }, { name:'Completed', value:completed } ];
  }, [trips]);

  const co2ByDestination = useMemo(()=>{
    const map = {};
    trips.forEach(t => map[t.destination] = (map[t.destination]||0) + Math.round(t.spend/100));
    return Object.entries(map).map(([k,v])=>({ name:k, value:v }));
  }, [trips]);

  // Table data + sort
  const tableData = useMemo(()=>{
    const arr = filteredTrips.map(t=>({ id:t.id, date:t.date, employee:t.employee, dept:t.dept, dest:t.destination, spend:t.spend, status:t.status }));
    arr.sort((a,b)=>{
      const mul = sortDir === 'asc' ? 1 : -1;
      if(sortKey === 'spend') return (a.spend - b.spend) * mul;
      if(sortKey === 'employee') return a.employee.localeCompare(b.employee) * mul;
      return (a.date.localeCompare(b.date)) * mul;
    });
    return arr;
  }, [filteredTrips, sortKey, sortDir]);

  const [activeTrip, setActiveTrip] = useState(null);

  function toggleSort(k){ if(sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc'); } }

  function downloadTripsCSV(){
    const rows = [['id','employee','dept','region','destination','spend','date','status'], ...filteredTrips.map(t=>[t.id,t.employee,t.dept,t.region,t.destination,t.spend,t.date,t.status])];
    csvDownload('trips-filtered.csv', rows);
  }
  function downloadExpensesCSV(){
    const rows = [['id','tripId','category','vendor','amount'], ...expenses.map(e=>[e.id,e.tripId,e.category,e.vendor,e.amount])];
    csvDownload('expenses.csv', rows);
  }
  function exportSnapshot(){ jsonDownload('analytics_snapshot.json', { trips, expenses, incidents, generatedAt: new Date().toISOString() }); }

  return (
    <div className="min-h-screen font-sans" style={{backgroundColor:'#f3f4f6', color:'#1f2937'}}>
      <div className="max-w-[1200px] mx-auto p-6">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{color:'#1f2937'}}>Analytics</h1>
            <p className="text-sm mt-1" style={{color:'#6b7280'}}>Operational insights — trips, spend, compliance and risk incidents.</p>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" aria-label="Export filtered trips as CSV" onClick={downloadTripsCSV} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors" style={{border:'1px solid #e5e7eb', backgroundColor:'#ffffff', color:'#374151'}}>Export trips</button>
            <button type="button" aria-label="Export all expenses as CSV" onClick={downloadExpensesCSV} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors" style={{border:'1px solid #e5e7eb', backgroundColor:'#ffffff', color:'#374151'}}>Export expenses</button>
            <button type="button" aria-label="Save analytics snapshot as JSON" onClick={exportSnapshot} className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors" style={{backgroundColor:'#6366f1'}}>Snapshot</button>
            <button type="button" onClick={()=> navigate(-1)} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors" style={{border:'1px solid #e5e7eb', backgroundColor:'#ffffff', color:'#374151'}}>← Back</button>
          </div>
        </header>

        {/* Active filters chips + live region for screen readers */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap text-sm" style={{color:'#6b7280'}}>
            <span>Date: {startDate} → {endDate}</span>
            { (q || deptFilter !== 'All' || regionFilter !== 'All' || selectedSlice) && (
              <>
                {q && <button type="button" onClick={() => { setQ(''); setAnnounce('Search cleared'); }} className="px-2 py-1 rounded-full text-xs" style={{backgroundColor:'#e5e7eb', color:'#374151'}}>Search: {q} ✕</button>}
                {deptFilter !== 'All' && <button type="button" onClick={() => { setDeptFilter('All'); setAnnounce('Department filter cleared'); }} className="px-2 py-1 rounded-full text-xs" style={{backgroundColor:'#e5e7eb', color:'#374151'}}>Dept: {deptFilter} ✕</button>}
                {regionFilter !== 'All' && <button type="button" onClick={() => { setRegionFilter('All'); setAnnounce('Region filter cleared'); }} className="px-2 py-1 rounded-full text-xs" style={{backgroundColor:'#e5e7eb', color:'#374151'}}>Region: {regionFilter} ✕</button>}
                {selectedSlice && <button type="button" onClick={() => { setSelectedSlice(null); setAnnounce('Donut selection cleared'); }} className="px-2 py-1 rounded-full text-xs" style={{backgroundColor:'#e5e7eb', color:'#374151'}}>Filter: {selectedSlice} ✕</button>}
              </>
            )}
            <button type="button" onClick={() => { setDeptFilter('All'); setRegionFilter('All'); setQ(''); setSelectedSlice(null); setStartDate('2025-07-01'); setEndDate('2025-12-31'); setAnnounce('All filters cleared'); }} className="px-2 py-1 rounded text-xs font-medium" style={{color:'#dc2626'}}>Clear all</button>
          </div>
          <div aria-live="polite" className="sr-only">{announce}</div>
        </div>

        <section className="grid grid-cols-12 gap-6 mb-6">
          <aside className="col-span-3 p-5 space-y-5 sticky top-6 self-start rounded-xl" style={{backgroundColor:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
            <div>
              <label className="text-xs font-medium block mb-2" style={{color:'#374151'}}>Search (employee or destination)</label>
              <input value={q} onChange={e=>setQ(e.target.value)} className="w-full p-2.5 text-sm rounded-lg outline-none transition-all" style={{border:'1px solid #e5e7eb', backgroundColor:'#ffffff'}} placeholder="Search..." />
            </div>

            <div>
              <label className="text-xs font-medium block mb-2" style={{color:'#374151'}}>Department</label>
              <select value={deptFilter} onChange={e=> setDeptFilter(e.target.value)} className="w-full p-2.5 rounded-lg text-sm outline-none" style={{border:'1px solid #e5e7eb', backgroundColor:'#ffffff'}}>
                {departments.map(d=> <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium block mb-2" style={{color:'#374151'}}>Region</label>
              <select value={regionFilter} onChange={e=> setRegionFilter(e.target.value)} className="w-full p-2.5 rounded-lg text-sm outline-none" style={{border:'1px solid #e5e7eb', backgroundColor:'#ffffff'}}>
                {regions.map(r=> <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium block mb-2" style={{color:'#374151'}}>Date range</label>
              <div className="flex flex-col gap-2">
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full p-2.5 rounded-lg text-sm outline-none" style={{border:'1px solid #e5e7eb'}} />
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full p-2.5 rounded-lg text-sm outline-none" style={{border:'1px solid #e5e7eb'}} />
              </div>
            </div>

            <div>
              <button type="button" onClick={() => { setDeptFilter('All'); setRegionFilter('All'); setQ(''); setSelectedSlice(null); }} className="px-4 py-2.5 w-full rounded-lg text-sm font-medium transition-colors" style={{border:'1px solid #e5e7eb', backgroundColor:'#ffffff', color:'#374151'}}>Clear filters</button>
            </div>
          </aside>

          <main className="col-span-9">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="rounded-xl p-5" style={{backgroundColor:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{color:'#374151'}}>Total Trips</span>
                  <button className="text-xs px-2 py-1 rounded" style={{color:'#6b7280'}} onClick={() => setCollapsedSections(s => ({ ...s, tripsKpi: !s.tripsKpi }))}>{collapsedSections.tripsKpi ? 'Expand' : 'Collapse'}</button>
                </div>
                <div className={collapsedSections.tripsKpi ? 'hidden' : ''}>
                  <div className="text-3xl font-bold" style={{color:'#1f2937'}}>{filteredTrips.length}</div>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{backgroundColor:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{color:'#374151'}}>Total Spend (filtered)</span>
                  <button className="text-xs px-2 py-1 rounded" style={{color:'#6b7280'}} onClick={() => setCollapsedSections(s => ({ ...s, spendKpi: !s.spendKpi }))}>{collapsedSections.spendKpi ? 'Expand' : 'Collapse'}</button>
                </div>
                <div className={collapsedSections.spendKpi ? 'hidden' : ''}>
                  <div className="text-3xl font-bold" style={{color:'#1f2937'}}>${fmtMoney(filteredTrips.reduce((s,t)=>s+t.spend,0))}</div>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{backgroundColor:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{color:'#374151'}}>Incidents</span>
                  <button className="text-xs px-2 py-1 rounded" style={{color:'#6b7280'}} onClick={() => setCollapsedSections(s => ({ ...s, incidentsKpi: !s.incidentsKpi }))}>{collapsedSections.incidentsKpi ? 'Expand' : 'Collapse'}</button>
                </div>
                <div className={collapsedSections.incidentsKpi ? 'hidden' : ''}>
                  <div className="text-3xl font-bold" style={{color:'#1f2937'}}>{incidents.length}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{backgroundColor:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                <h4 className="font-semibold mb-4" style={{color:'#1f2937'}}>Travel frequency by employee</h4>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={freqByEmployee} margin={{ left: -20 }}>
                      <XAxis dataKey="name" tick={{fontSize:12}} />
                      <YAxis allowDecimals={false} tick={{fontSize:12}} />
                      <Tooltip />
                      <Bar dataKey="trips" fill="#6366f1" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl p-5" style={{backgroundColor:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                <h4 className="font-semibold mb-4" style={{color:'#1f2937'}}>Spend breakdown</h4>
                <div className="flex items-center justify-center" style={{height:260}}>
                  <CorporateDonut data={spendByCategory} colors={['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b']} size={180} onSliceClick={(it)=>{ setSelectedSlice(it.name); }} />
                </div>
              </div>
            </div>

            {/* Time series spend chart */}
            <div className="mt-4 rounded-xl p-5" style={{backgroundColor:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <h4 className="font-semibold mb-4" style={{color:'#1f2937'}}>Spend over time</h4>
              <TimeSeriesChart data={useMemo(()=>{
                // aggregate spend by month YYYY-MM
                const map = {};
                trips.forEach(t => {
                  const key = t.date.slice(0,7);
                  map[key] = (map[key]||0) + (t.spend||0);
                });
                return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>({ x:k, y:v }));
              }, [trips])} height={200} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="rounded-xl p-5" style={{backgroundColor:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                <h4 className="font-semibold mb-4" style={{color:'#1f2937'}}>Policy compliance</h4>
                <div className="flex items-center justify-center" style={{height:180}}>
                  <CorporateDonut data={compliance} colors={['#10b981','#f59e0b','#6366f1']} size={150} />
                </div>
              </div>

              <div className="rounded-xl p-5" style={{backgroundColor:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                <h4 className="font-semibold mb-4" style={{color:'#1f2937'}}>ESG / CO₂ (estimate)</h4>
                <div className="flex items-center justify-center" style={{height:180}}>
                  <CorporateDonut data={co2ByDestination} colors={['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b']} size={150} onSliceClick={(it)=> setSelectedSlice(it.name)} />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl overflow-hidden" style={{backgroundColor:'#ffffff', border:'1px solid #e5e7eb', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
              <div className="p-5 flex items-center justify-between" style={{borderBottom:'1px solid #e5e7eb'}}>
                <h4 className="font-semibold" style={{color:'#1f2937'}}>Trips (table)</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{color:'#6b7280'}}>Sort:</span>
                  <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{border:'1px solid #e5e7eb', backgroundColor:sortKey==='date'?'#f3f4f6':'#ffffff', color:'#374151'}} onClick={()=>toggleSort('date')}>Date</button>
                  <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{border:'1px solid #e5e7eb', backgroundColor:sortKey==='employee'?'#f3f4f6':'#ffffff', color:'#374151'}} onClick={()=>toggleSort('employee')}>Employee</button>
                  <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{border:'1px solid #e5e7eb', backgroundColor:sortKey==='spend'?'#f3f4f6':'#ffffff', color:'#374151'}} onClick={()=>toggleSort('spend')}>Spend</button>
                  <button className="px-3 py-1.5 rounded-lg text-xs" style={{color:'#6b7280'}} onClick={() => setCollapsedSections(s => ({ ...s, tripsTable: !s.tripsTable }))}>{collapsedSections.tripsTable ? 'Expand' : 'Collapse'}</button>
                </div>
              </div>

              <div className={collapsedSections.tripsTable ? 'hidden' : 'overflow-x-auto'}>
                <table className="w-full text-sm">
                  <thead style={{backgroundColor:'#f9fafb'}}>
                    <tr className="text-left text-xs" style={{color:'#6b7280'}}>
                      <th className="px-5 py-3 font-medium">ID</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium">Employee</th>
                      <th className="px-5 py-3 font-medium">Dept</th>
                      <th className="px-5 py-3 font-medium">Destination</th>
                      <th className="px-5 py-3 font-medium">Spend</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map(r => (
                      <tr
                        key={r.id}
                        className="cursor-pointer transition-colors"
                        style={{borderTop:'1px solid #e5e7eb'}}
                        onClick={() => setActiveTrip(trips.find(t => t.id === r.id))}
                        onMouseOver={(e)=>e.currentTarget.style.backgroundColor='#f9fafb'}
                        onMouseOut={(e)=>e.currentTarget.style.backgroundColor='transparent'}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setActiveTrip(trips.find(t => t.id === r.id));
                            e.preventDefault();
                          }
                        }}
                      >
                        <td className="px-5 py-3" style={{color:'#374151'}}>{r.id}</td>
                        <td className="px-5 py-3" style={{color:'#374151'}}>{r.date}</td>
                        <td className="px-5 py-3" style={{color:'#374151'}}>{r.employee}</td>
                        <td className="px-5 py-3" style={{color:'#374151'}}>{r.dept}</td>
                        <td className="px-5 py-3" style={{color:'#374151'}}>{r.dest}</td>
                        <td className="px-5 py-3 font-semibold" style={{color:'#1f2937'}}>${fmtMoney(r.spend)}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                            backgroundColor: r.status === 'Approved' ? '#d1fae5' : r.status === 'Pending' ? '#fef3c7' : '#e0e7ff',
                            color: r.status === 'Approved' ? '#059669' : r.status === 'Pending' ? '#d97706' : '#4f46e5'
                          }}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </section>
        {/* Trip detail modal (drilldown) */}
        <TripDetailModal trip={activeTrip} expenses={expenses} onClose={() => setActiveTrip(null)} />
      </div>
    </div>
  );
}
