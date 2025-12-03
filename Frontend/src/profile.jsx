import React, { useState, useEffect, useRef } from 'react';

// Use environment variable or Vite proxy
const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ProfilePage(){
  const [user, setUser] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('currentUser')||'{}'); }catch(e){ return {}; }
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(()=>{
    setName(user?.name || '');
  }, [user]);

  function triggerPick(){ fileRef.current?.click(); }

  async function uploadPhoto(e){
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('photo', file);
    try{
      const token = localStorage.getItem('app_token');
      const res = await fetch(`${API_BASE}/api/user/photo`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: formData });
      const data = await res.json().catch(()=>({}));
      const photoUrl = data?.photoUrl || data?.url || data?.avatarUrl;
      if(photoUrl){
        const updated = Object.assign({}, user || {}, { avatar: photoUrl });
        localStorage.setItem('currentUser', JSON.stringify(updated));
        setUser(updated);
        window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(updated) }));
      }
    }catch(err){ console.error('upload photo failed', err); }
    setLoading(false);
    e.target.value = '';
  }

  async function saveName(){
    try{
      setLoading(true);
      const token = localStorage.getItem('app_token');
      const res = await fetch(`${API_BASE}/api/user/name`, { method: 'PATCH', headers: Object.assign({ 'Content-Type':'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}), body: JSON.stringify({ name }) });
      if(res.ok){
        const updated = Object.assign({}, user || {}, { name });
        localStorage.setItem('currentUser', JSON.stringify(updated));
        setUser(updated);
        window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(updated) }));
        setEditing(false);
      }
    }catch(err){ console.error('save name failed', err); }
    setLoading(false);
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Profile</h2>
      <div className="flex items-start gap-6">
        <div>
          {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full"/> : <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">{(user?.name||'U').charAt(0).toUpperCase()}</div>}
          <div className="mt-3">
            <button className="btn btn-ghost mr-2" onClick={triggerPick} disabled={loading}>{loading ? 'Uploading...' : 'Change photo'}</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ position: 'absolute', left: -9999 }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="mb-4">
            <div className="text-sm text-muted">Email</div>
            <div className="font-medium">{user?.email || '—'}</div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-muted">Name</div>
            {editing ? (
              <div className="flex items-center gap-2">
                <input value={name} onChange={e=>setName(e.target.value)} className="border px-2 py-1 rounded" />
                <button className="btn btn-primary" onClick={saveName} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                <button className="btn btn-ghost" onClick={()=>setEditing(false)}>Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="font-medium">{user?.name || '—'}</div>
                <button className="btn btn-ghost" onClick={()=>setEditing(true)}>Edit</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
