import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Use environment variable or Vite proxy
const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Risk(){
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

  // Fetch advisories and travelers from API
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
        alert('Advisory created successfully!');
      }
    } catch (err) {
      console.error('createAdvisory failed', err);
      alert('Failed to create advisory');
    }
  }

  async function handleCheckIn(travelerId) {
    try {
      const res = await fetch(`${API_BASE}/api/risk/travelers/${travelerId}/checkin`, {
        method: 'POST'
      });

      if (res.ok) {
        await fetchData();
        alert('Check-in recorded!');
      }
    } catch (err) {
      console.error('checkIn failed', err);
    }
  }

  async function handleSOS(travelerId) {
    try {
      const res = await fetch(`${API_BASE}/api/risk/travelers/${travelerId}/sos`, {
        method: 'POST'
      });

      if (res.ok) {
        await fetchData();
        alert('SOS triggered! Emergency team notified.');
      }
    } catch (err) {
      console.error('SOS failed', err);
    }
  }

  async function toggleOptIn(travelerId) {
    try {
      const res = await fetch(`${API_BASE}/api/risk/travelers/${travelerId}/toggle-optin`, {
        method: 'POST'
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('toggleOptIn failed', err);
    }
  }

  function getSeverityColor(severity) {
    if (severity === 'high') return 'bg-red-100 text-red-700';
    if (severity === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Risk & Safety</h1>
            <div className="text-sm text-gray-500">Travel advisories and traveler safety tracking</div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate(-1)} className="px-2 py-1 elevated">← Back</button>
            <button type="button" onClick={() => setShowAdvForm(true)} className="px-3 py-2 bg-purple-700 text-white rounded">New Advisory</button>
          </div>
        </header>

        {showAdvForm && (
          <div className="elevated p-4 mb-6">
            <h3 className="font-semibold mb-3">Create Advisory</h3>
            <div className="grid grid-cols-2 gap-3">
              <input 
                placeholder="Destination (e.g., London, Paris)" 
                className="border p-2 rounded" 
                value={advForm.destination} 
                onChange={(e) => setAdvForm({...advForm, destination: e.target.value})} 
              />
              <select 
                className="border p-2 rounded" 
                value={advForm.type} 
                onChange={(e) => setAdvForm({...advForm, type: e.target.value})}
              >
                <option value="political">Political</option>
                <option value="weather">Weather</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
              <select 
                className="border p-2 rounded" 
                value={advForm.severity} 
                onChange={(e) => setAdvForm({...advForm, severity: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input 
                placeholder="Title" 
                className="border p-2 rounded" 
                value={advForm.title} 
                onChange={(e) => setAdvForm({...advForm, title: e.target.value})} 
              />
              <textarea 
                placeholder="Description" 
                className="border p-2 rounded col-span-2" 
                rows="3"
                value={advForm.description} 
                onChange={(e) => setAdvForm({...advForm, description: e.target.value})} 
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={createAdvisory} className="px-3 py-2 bg-purple-700 text-white rounded">Create</button>
              <button type="button" onClick={() => setShowAdvForm(false)} className="px-3 py-2 elevated">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {/* Advisories */}
          <div className="elevated p-4">
            <h3 className="font-semibold mb-3">Travel Advisories</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : advisories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No advisories yet</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {advisories.map(adv => (
                  <div key={adv.id} className="p-3 elevated">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{adv.title}</div>
                        <div className="text-sm text-gray-500 mt-1">{adv.destination}</div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(adv.severity)}`}>
                          {adv.severity}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-gray-100">
                          {adv.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">{adv.description}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(adv.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Traveler Safety */}
          <div className="elevated p-4">
            <h3 className="font-semibold mb-3">Traveler Safety</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : travelers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No travelers tracked yet</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {travelers.map(traveler => (
                  <div key={traveler.id} className="p-3 elevated">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{traveler.name}</div>
                        <div className="text-sm text-gray-500">{traveler.email}</div>
                      </div>
                      <div className="flex gap-2">
                        {traveler.sosActive && (
                          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                            SOS ACTIVE
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-xs ${traveler.optIn ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                          {traveler.optIn ? 'Sharing' : 'Not sharing'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Last check-in: {new Date(traveler.lastCheckIn).toLocaleString()}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button 
                        type="button" 
                        onClick={() => toggleOptIn(traveler.id)} 
                        className="px-2 py-1 elevated text-xs"
                      >
                        {traveler.optIn ? 'Disable' : 'Enable'} Sharing
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleCheckIn(traveler.id)} 
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                      >
                        Check-in
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleSOS(traveler.id)} 
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
                      >
                        Trigger SOS
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
  );
}
