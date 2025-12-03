import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG, formatCurrency, formatDate, getCategoryConfig } from '../utils/config';
import '../styles/expense.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Expense() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [filter, setFilter] = useState({ category: 'all', status: 'all', search: '' });
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [form, setForm] = useState({
    tripId: '',
    category: 'airfare',
    amount: '',
    vendor: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receipt: null
  });

  // Fetch data
  async function fetchData() {
    try {
      setLoading(true);
      const [expRes, tripRes] = await Promise.all([
        fetch(`${API_BASE}/api/expenses`),
        fetch(`${API_BASE}/api/trips`)
      ]);
      
      if (expRes.ok) {
        const data = await expRes.json();
        if (data.success) setExpenses(data.expenses || []);
      }
      if (tripRes.ok) {
        const data = await tripRes.json();
        if (data.success) setTrips(data.trips || []);
      }
    } catch (e) {
      console.warn('Failed to fetch data', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  // Create expense
  async function handleCreate() {
    if (!form.amount || !form.category) {
      alert('Please fill required fields');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: form.tripId || null,
          category: form.category,
          amount: Number(form.amount),
          vendor: form.vendor,
          description: form.description,
          date: form.date
        })
      });
      
      if (res.ok) {
        await fetchData();
        closeModal();
      }
    } catch (e) {
      console.error('Create expense failed', e);
    }
  }

  // Update expense
  async function handleUpdate() {
    if (!editExpense) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/expenses/${editExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          amount: Number(form.amount),
          vendor: form.vendor,
          description: form.description,
          date: form.date
        })
      });
      
      if (res.ok) {
        await fetchData();
        closeModal();
      }
    } catch (e) {
      console.error('Update expense failed', e);
    }
  }

  // Delete expense
  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return;
    
    try {
      await fetch(`${API_BASE}/api/expenses/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (e) {
      console.error('Delete expense failed', e);
    }
  }

  function openAddModal() {
    setEditExpense(null);
    setForm({
      tripId: '',
      category: 'airfare',
      amount: '',
      vendor: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      receipt: null
    });
    setShowModal(true);
  }

  function openEditModal(exp) {
    setEditExpense(exp);
    setForm({
      tripId: exp.tripId || exp.trip_id || '',
      category: exp.category?.toLowerCase() || 'other',
      amount: exp.amount || '',
      vendor: exp.vendor || '',
      description: exp.description || '',
      date: exp.date ? exp.date.split('T')[0] : exp.expense_date?.split('T')[0] || '',
      receipt: null
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditExpense(null);
  }

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    let result = [...expenses];
    
    if (filter.category !== 'all') {
      result = result.filter(e => e.category?.toLowerCase() === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(e => 
        e.description?.toLowerCase().includes(q) ||
        e.vendor?.toLowerCase().includes(q) ||
        e.category?.toLowerCase().includes(q)
      );
    }
    
    result.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'amount') return (Number(a.amount) - Number(b.amount)) * mul;
      if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '') * mul;
      return ((a.date || a.expense_date || '').localeCompare(b.date || b.expense_date || '')) * mul;
    });
    
    return result;
  }, [expenses, filter, sortBy, sortDir]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const byCategory = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount || 0);
    });
    const pending = expenses.filter(e => e.status === 'pending').length;
    const approved = expenses.filter(e => e.status === 'approved').length;
    
    return { total, byCategory, pending, approved, count: expenses.length };
  }, [expenses]);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f8fafc' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Expense Management</h1>
              <p className="text-gray-500 mt-1">Track, categorize, and manage travel expenses</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={openAddModal} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <span>+</span> Add Expense
              </button>
              <button onClick={() => navigate(-1)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">← Back</button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>💰</div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{formatCurrency(stats.total)}</div>
                <div className="text-sm text-gray-500">Total Expenses</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>📊</div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stats.count}</div>
                <div className="text-sm text-gray-500">Total Records</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>⏳</div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stats.pending}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: 'white' }}>✓</div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stats.approved}</div>
                <div className="text-sm text-gray-500">Approved</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search expenses..."
                value={filter.search}
                onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select 
              value={filter.category} 
              onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {APP_CONFIG.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="category">Sort by Category</option>
            </select>
            <button 
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </section>

        {/* Expense Table */}
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading expenses...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">💳</div>
              <div className="text-gray-500 mb-4">No expenses found</div>
              <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add your first expense</button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Vendor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredExpenses.map(exp => {
                  const catConfig = getCategoryConfig(exp.category);
                  return (
                    <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${catConfig.color}20`, color: catConfig.color }}>
                            {catConfig.icon}
                          </div>
                          <span className="font-medium text-slate-700">{catConfig.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{exp.description || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{exp.vendor || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(exp.date || exp.expense_date)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-800">{formatCurrency(exp.amount)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditModal(exp)} className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg">Edit</button>
                          <button onClick={() => handleDelete(exp.id)} className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeModal}></div>
            <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">{editExpense ? 'Edit Expense' : 'Add Expense'}</h3>
                  <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {APP_CONFIG.expenseCategories.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, category: c.id }))}
                        className={`p-3 rounded-xl border-2 transition-all ${form.category === c.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className="text-2xl mb-1">{c.icon}</div>
                        <div className="text-xs font-medium text-gray-700">{c.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Vendor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                    placeholder="e.g., Delta Airlines, Marriott"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Add details..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Trip Link */}
                {trips.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Link to Trip (Optional)</label>
                    <select
                      value={form.tripId}
                      onChange={e => setForm(f => ({ ...f, tripId: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">No trip linked</option>
                      {trips.map(t => <option key={t.id} value={t.id}>{t.destination} - {formatDate(t.start)}</option>)}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button onClick={closeModal} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium">Cancel</button>
                <button onClick={editExpense ? handleUpdate : handleCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium">
                  {editExpense ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
