import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Use environment variable or Vite proxy
const API_BASE = import.meta.env.VITE_API_URL || '';

// Format date nicely
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

// Category colors
const categoryColors = {
  'airfare': { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
  'hotel': { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  'meals': { bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
  'transport': { bg: 'rgba(6,182,212,0.1)', color: '#0891b2' },
  'other': { bg: 'rgba(107,114,128,0.1)', color: '#6b7280' }
};

function getCategoryStyle(category) {
  const key = (category || '').toLowerCase();
  for (const [k, v] of Object.entries(categoryColors)) {
    if (key.includes(k)) return v;
  }
  return categoryColors.other;
}

export default function ExpensePage(){
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', status: 'all' });
  const [newExpense, setNewExpense] = useState({ 
    tripId: '', 
    category: '', 
    vendor: '', 
    amount: '', 
    description: '', 
    date: new Date().toISOString().split('T')[0] 
  });
  const [showForm, setShowForm] = useState(false);

  // Fetch expenses and trips from API
  useEffect(()=>{
    async function fetchData(){
      try{
        setLoading(true);
        const [expensesRes, tripsRes] = await Promise.all([
          fetch(`${API_BASE}/api/expenses`),
          fetch(`${API_BASE}/api/trips`)
        ]);

        if(expensesRes.ok){
          const data = await expensesRes.json();
          if(data.success && data.expenses){
            setExpenses(data.expenses);
          }
        }

        if(tripsRes.ok){
          const data = await tripsRes.json();
          if(data.success && data.trips){
            setTrips(data.trips);
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

  async function addExpense(){
    if (!newExpense.category || !newExpense.amount) {
      alert('Please fill in category and amount');
      return;
    }
    try{
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: newExpense.tripId || null,
          category: newExpense.category,
          vendor: newExpense.vendor,
          amount: Number(newExpense.amount),
          description: newExpense.description,
          date: newExpense.date
        })
      });

      if(res.ok){
        const data = await res.json();
        if(data.success){
          const expensesRes = await fetch(`${API_BASE}/api/expenses`);
          if(expensesRes.ok){
            const expData = await expensesRes.json();
            if(expData.success) setExpenses(expData.expenses);
          }
          setNewExpense({ tripId: '', category: '', vendor: '', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
          setShowForm(false);
        }
      }
    }catch(e){
      console.error('addExpense failed', e);
      alert('Failed to add expense');
    }
  }

  function exportCSV(){
    const rows = [ ['ID','Trip ID','Category','Vendor','Amount','Date','Description'] ];
    for(const r of expenses){
      rows.push([r.id, r.tripId || '', r.category, r.vendor, r.amount, r.date, r.description || '']);
    }
    const csv = rows.map(r=>r.map(c=>`"${(''+c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'expenses.csv'; a.click(); URL.revokeObjectURL(url);
  }

  const visible = expenses.filter(x => {
    if(filter.category && !x.category.toLowerCase().includes(filter.category.toLowerCase())) return false;
    return true;
  });

  const totalExpense = visible.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  return (
    <div className="min-h-screen font-sans" style={{backgroundColor:'var(--bg-color)', color:'var(--text-color)'}}>
      <div className="max-w-[1200px] mx-auto p-6">
        {/* Page Header */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{color:'var(--text-color)'}}>Expense Management</h1>
            <p className="text-sm mt-1" style={{color:'var(--text-muted)'}}>Track and manage travel expenses</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              type="button" 
              onClick={()=> setShowForm(s => !s)} 
              className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
              style={{backgroundColor:'var(--primary-color)'}}
            >
              + New Expense
            </button>
            <button 
              type="button" 
              onClick={exportCSV} 
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}
            >
              Export CSV
            </button>
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}
            >
              ← Back
            </button>
          </div>
        </header>

        {/* New Expense Form */}
        {showForm && (
          <div className="mb-6 rounded-xl p-6" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
            <h3 className="font-semibold mb-4" style={{color:'var(--text-color)'}}>Add New Expense</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Trip (optional)</label>
                <select 
                  className="w-full p-2.5 text-sm rounded-lg"
                  style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}
                  value={newExpense.tripId} 
                  onChange={(e)=> setNewExpense({...newExpense, tripId: e.target.value})}
                >
                  <option value="">Select Trip</option>
                  {trips.map(t => <option key={t.id} value={t.id}>{t.destination} - {formatDate(t.start)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Category *</label>
                <select 
                  className="w-full p-2.5 text-sm rounded-lg"
                  style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}
                  value={newExpense.category} 
                  onChange={(e)=> setNewExpense({...newExpense, category: e.target.value})}
                >
                  <option value="">Select Category</option>
                  <option value="Airfare">Airfare</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Meals">Meals</option>
                  <option value="Transport">Transport</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Vendor</label>
                <input 
                  placeholder="e.g., Delta Airlines" 
                  className="w-full p-2.5 text-sm rounded-lg"
                  style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}
                  value={newExpense.vendor} 
                  onChange={(e)=> setNewExpense({...newExpense, vendor: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Amount *</label>
                <input 
                  placeholder="0.00" 
                  type="number" 
                  className="w-full p-2.5 text-sm rounded-lg"
                  style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}
                  value={newExpense.amount} 
                  onChange={(e)=> setNewExpense({...newExpense, amount: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Date</label>
                <input 
                  type="date" 
                  className="w-full p-2.5 text-sm rounded-lg"
                  style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}
                  value={newExpense.date} 
                  onChange={(e)=> setNewExpense({...newExpense, date: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{color:'var(--text-muted)'}}>Description</label>
                <input 
                  placeholder="Brief description" 
                  className="w-full p-2.5 text-sm rounded-lg"
                  style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}
                  value={newExpense.description} 
                  onChange={(e)=> setNewExpense({...newExpense, description: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-4" style={{borderTop:'1px solid var(--border-color)'}}>
              <button 
                type="button" 
                onClick={addExpense} 
                className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors"
                style={{backgroundColor:'var(--primary-color)'}}
              >
                Add Expense
              </button>
              <button 
                type="button" 
                onClick={()=> setShowForm(false)} 
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="text-sm font-medium mb-1" style={{color:'var(--text-muted)'}}>Total Expenses</div>
            <div className="text-2xl font-bold" style={{color:'var(--text-color)'}}>${totalExpense.toLocaleString()}</div>
          </div>
          <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="text-sm font-medium mb-1" style={{color:'var(--text-muted)'}}>Number of Expenses</div>
            <div className="text-2xl font-bold" style={{color:'var(--text-color)'}}>{visible.length}</div>
          </div>
          <div className="rounded-xl p-5" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
            <div className="text-sm font-medium mb-1" style={{color:'var(--text-muted)'}}>Average per Expense</div>
            <div className="text-2xl font-bold" style={{color:'var(--text-color)'}}>${visible.length > 0 ? Math.round(totalExpense / visible.length).toLocaleString() : 0}</div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="rounded-xl overflow-hidden" style={{backgroundColor:'var(--card-bg)', border:'1px solid var(--border-color)', boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
          {/* Filter Bar */}
          <div className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between" style={{borderBottom:'1px solid var(--border-color)'}}>
            <div className="flex items-center gap-2">
              <input 
                placeholder="Search by category..." 
                className="p-2.5 text-sm rounded-lg w-64"
                style={{border:'1px solid var(--border-color)', backgroundColor:'var(--card-bg)', color:'var(--text-color)'}}
                value={filter.category} 
                onChange={(e)=> setFilter(f=>({...f, category: e.target.value}))} 
              />
            </div>
            <div className="text-sm" style={{color:'var(--text-muted)'}}>
              Showing {visible.length} expense{visible.length !== 1 ? 's' : ''}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12" style={{color:'var(--text-muted)'}}>
              <div className="text-3xl mb-2">⏳</div>
              Loading expenses...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{backgroundColor:'rgba(0,0,0,0.02)'}}>
                    <th className="text-left px-5 py-3 font-medium text-xs" style={{color:'var(--text-muted)'}}>Date</th>
                    <th className="text-left px-5 py-3 font-medium text-xs" style={{color:'var(--text-muted)'}}>Category</th>
                    <th className="text-left px-5 py-3 font-medium text-xs" style={{color:'var(--text-muted)'}}>Vendor</th>
                    <th className="text-left px-5 py-3 font-medium text-xs" style={{color:'var(--text-muted)'}}>Amount</th>
                    <th className="text-left px-5 py-3 font-medium text-xs" style={{color:'var(--text-muted)'}}>Description</th>
                    <th className="text-left px-5 py-3 font-medium text-xs" style={{color:'var(--text-muted)'}}>Trip</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(e => {
                    const catStyle = getCategoryStyle(e.category);
                    const trip = trips.find(t => t.id === e.tripId);
                    return (
                      <tr 
                        key={e.id} 
                        className="transition-colors"
                        style={{borderTop:'1px solid var(--border-color)'}}
                        onMouseOver={(ev)=>ev.currentTarget.style.backgroundColor='rgba(0,0,0,0.02)'}
                        onMouseOut={(ev)=>ev.currentTarget.style.backgroundColor='transparent'}
                      >
                        <td className="px-5 py-4" style={{color:'var(--text-color)'}}>{formatDate(e.date)}</td>
                        <td className="px-5 py-4">
                          <span 
                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{backgroundColor: catStyle.bg, color: catStyle.color}}
                          >
                            {e.category || 'Other'}
                          </span>
                        </td>
                        <td className="px-5 py-4" style={{color:'var(--text-color)'}}>{e.vendor || '-'}</td>
                        <td className="px-5 py-4 font-semibold" style={{color:'var(--text-color)'}}>${Number(e.amount).toLocaleString()}</td>
                        <td className="px-5 py-4 max-w-xs truncate" style={{color:'var(--text-muted)'}}>{e.description || '-'}</td>
                        <td className="px-5 py-4 text-xs" style={{color:'var(--text-muted)'}}>
                          {trip ? trip.destination : (e.tripId ? `#${e.tripId}` : '-')}
                        </td>
                      </tr>
                    );
                  })}
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center" style={{color:'var(--text-muted)'}}>
                        <div className="text-3xl mb-2">📋</div>
                        No expenses found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
