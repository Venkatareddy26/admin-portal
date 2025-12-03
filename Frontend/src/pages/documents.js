import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/documents.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const DOC_TYPES = [
  { id: 'passport', label: 'Passport', icon: '🛂', color: '#6366f1' },
  { id: 'visa', label: 'Visa', icon: '📋', color: '#8b5cf6' },
  { id: 'vaccine', label: 'Vaccine Certificate', icon: '💉', color: '#10b981' },
  { id: 'insurance', label: 'Travel Insurance', icon: '🛡️', color: '#f59e0b' },
  { id: 'id_card', label: 'ID Card', icon: '🪪', color: '#06b6d4' },
  { id: 'other', label: 'Other', icon: '📄', color: '#64748b' },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isExpiringSoon(expiry) {
  if (!expiry) return false;
  const days = (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24);
  return days > 0 && days <= 30;
}

function isExpired(expiry) {
  if (!expiry) return false;
  return new Date(expiry) < new Date();
}

export default function Documents() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    type: 'passport',
    name: '',
    expiry: '',
    notes: '',
    file: null
  });

  // Fetch documents
  async function fetchDocs() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/documents`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setDocs(data.documents || []);
      }
    } catch (e) {
      console.warn('Failed to fetch documents', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDocs(); }, []);

  // Upload document
  async function handleUpload() {
    if (!form.name) { alert('Please enter document name'); return; }
    
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('type', form.type);
      formData.append('expiry', form.expiry || '');
      formData.append('notes', form.notes || '');
      if (form.file) formData.append('file', form.file);

      const res = await fetch(`${API_BASE}/api/documents`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await fetchDocs();
          closeModal();
          alert('Document uploaded successfully!');
        }
      } else {
        // Fallback: save to local state if backend fails
        const newDoc = {
          id: Date.now(),
          name: form.name,
          type: form.type,
          expiry: form.expiry,
          notes: form.notes,
          createdAt: new Date().toISOString(),
          status: 'active'
        };
        setDocs(prev => [newDoc, ...prev]);
        closeModal();
        alert('Document saved locally');
      }
    } catch (e) {
      // Fallback: save to local state
      const newDoc = {
        id: Date.now(),
        name: form.name,
        type: form.type,
        expiry: form.expiry,
        notes: form.notes,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      setDocs(prev => [newDoc, ...prev]);
      closeModal();
    }
  }

  // Update document
  async function handleUpdate() {
    if (!editDoc) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/documents/${editDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          expiry: form.expiry,
          notes: form.notes
        })
      });

      if (res.ok) {
        await fetchDocs();
      } else {
        // Fallback: update local state
        setDocs(prev => prev.map(d => d.id === editDoc.id ? { ...d, ...form } : d));
      }
      closeModal();
    } catch (e) {
      setDocs(prev => prev.map(d => d.id === editDoc.id ? { ...d, ...form } : d));
      closeModal();
    }
  }

  // Delete document
  async function handleDelete(id) {
    if (!window.confirm('Delete this document?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDocs();
      } else {
        setDocs(prev => prev.filter(d => d.id !== id));
      }
    } catch (e) {
      setDocs(prev => prev.filter(d => d.id !== id));
    }
  }

  function openAddModal() {
    setEditDoc(null);
    setForm({ type: 'passport', name: '', expiry: '', notes: '', file: null });
    setShowModal(true);
  }

  function openEditModal(doc) {
    setEditDoc(doc);
    setForm({
      type: doc.type || 'passport',
      name: doc.name || '',
      expiry: doc.expiry ? doc.expiry.split('T')[0] : '',
      notes: doc.notes || '',
      file: null
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditDoc(null);
    setForm({ type: 'passport', name: '', expiry: '', notes: '', file: null });
  }

  // Filter documents
  const filteredDocs = docs.filter(d => {
    if (filter !== 'all' && d.type !== filter) return false;
    if (search && !d.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: docs.length,
    expiring: docs.filter(d => isExpiringSoon(d.expiry)).length,
    expired: docs.filter(d => isExpired(d.expiry)).length,
    valid: docs.filter(d => d.expiry && !isExpired(d.expiry) && !isExpiringSoon(d.expiry)).length
  };

  const getDocType = (type) => DOC_TYPES.find(t => t.id === type) || DOC_TYPES[5];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: '#f8fafc' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Documents & Compliance</h1>
              <p className="text-gray-500 mt-1">Store passports, visas, vaccine certs, insurance & validate per policy</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={openAddModal} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <span>+</span> Upload Document
              </button>
              <button onClick={() => navigate(-1)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">← Back</button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>📁</div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Documents</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>✓</div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stats.valid}</div>
                <div className="text-sm text-gray-500">Valid</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>⚠</div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stats.expiring}</div>
                <div className="text-sm text-gray-500">Expiring Soon</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}>✕</div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stats.expired}</div>
                <div className="text-sm text-gray-500">Expired</div>
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
                placeholder="Search documents..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filter:</span>
              <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Types</option>
                {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Document Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-400">Loading documents...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-12 border border-gray-100 text-center">
              <div className="text-5xl mb-4">📄</div>
              <div className="text-gray-500 mb-4">No documents found</div>
              <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Upload your first document</button>
            </div>
          ) : (
            filteredDocs.map(doc => {
              const docType = getDocType(doc.type);
              const expired = isExpired(doc.expiry);
              const expiring = isExpiringSoon(doc.expiry);
              
              return (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-50" style={{ backgroundColor: `${docType.color}10` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: docType.color, color: 'white' }}>
                          {docType.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{doc.name}</div>
                          <div className="text-xs text-gray-500">{docType.label}</div>
                        </div>
                      </div>
                      {expired && <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Expired</span>}
                      {expiring && !expired && <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Expiring Soon</span>}
                      {!expired && !expiring && doc.expiry && <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Valid</span>}
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Expiry Date</span>
                        <span className={`font-medium ${expired ? 'text-red-600' : expiring ? 'text-amber-600' : 'text-slate-700'}`}>
                          {formatDate(doc.expiry)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Uploaded</span>
                        <span className="text-slate-700">{formatDate(doc.createdAt || doc.created_at)}</span>
                      </div>
                      {doc.notes && (
                        <div className="pt-2 border-t border-gray-50">
                          <span className="text-gray-500 text-xs">{doc.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Actions */}
                  <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                    <button onClick={() => openEditModal(doc)} className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(doc.id)} className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Upload/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeModal}></div>
            <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">
                    {editDoc ? 'Edit Document' : 'Upload Document'}
                  </h3>
                  <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Document Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {DOC_TYPES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, type: t.id }))}
                        className={`p-3 rounded-xl border-2 transition-all ${form.type === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className="text-2xl mb-1">{t.icon}</div>
                        <div className="text-xs font-medium text-gray-700">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g., US Passport, Schengen Visa"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiry}
                    onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* File Upload (only for new documents) */}
                {!editDoc && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                    <div 
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                    >
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))}
                        className="hidden"
                      />
                      {form.file ? (
                        <div className="text-indigo-600 font-medium">{form.file.name}</div>
                      ) : (
                        <>
                          <div className="text-3xl mb-2">📤</div>
                          <div className="text-gray-500">Click to upload or drag and drop</div>
                          <div className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC (max 10MB)</div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button onClick={closeModal} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium">
                  Cancel
                </button>
                <button 
                  onClick={editDoc ? handleUpdate : handleUpload}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
                >
                  {editDoc ? 'Save Changes' : 'Upload Document'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
