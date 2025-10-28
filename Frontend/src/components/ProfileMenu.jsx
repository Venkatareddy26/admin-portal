import React, { useState, useRef, useEffect } from 'react';

// resolve API base same as other files
const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:4001';

export default function ProfileMenu({
  user = {},
  role = 'employee',
  onNavigate = () => {},
  onLogout = () => {},
  updateRole = () => {},
  closeMenu = () => {}
}){
  const [showEditName, setShowEditName] = useState(false);
  const [photo, setPhoto] = useState(user?.avatar || '/default-avatar.png');
  const [nameLocal, setNameLocal] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setPhoto(user?.avatar || '/default-avatar.png');
    setNameLocal(user?.name || '');
  }, [user]);

  async function handlePhotoChange(e){
    const file = e.target.files && e.target.files[0];
    if(!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    const token = localStorage.getItem('app_token');

    try{
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/user/photo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });
      const data = await res.json().catch(()=>({}));
      const photoUrl = data?.photoUrl || data?.url || data?.avatarUrl;
      if(photoUrl){
        setPhoto(photoUrl);
        // persist into localStorage so other components update
        try{
          const cur = JSON.parse(localStorage.getItem('currentUser') || '{}');
          const updated = Object.assign({}, cur || {}, { avatar: photoUrl });
          localStorage.setItem('currentUser', JSON.stringify(updated));
          window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(updated) }));
        }catch(e){ console.warn('persist avatar failed', e); }
      }
    }catch(err){
      console.error('Photo upload failed:', err);
    }finally{ setLoading(false); e.target.value = ''; }
  }

  async function handleNameSave(){
    const token = localStorage.getItem('app_token');
    try{
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/user/name`, {
        method: 'PATCH',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
        body: JSON.stringify({ name: nameLocal })
      });
      const data = await res.json().catch(()=>({}));
      if(data?.success || res.ok){
        // persist name locally
        try{
          const cur = JSON.parse(localStorage.getItem('currentUser') || '{}');
          const updated = Object.assign({}, cur || {}, { name: nameLocal });
          localStorage.setItem('currentUser', JSON.stringify(updated));
          window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(updated) }));
        }catch(e){ console.warn('persist name failed', e); }
        setShowEditName(false);
      }
    }catch(err){
      console.error('Name update failed:', err);
    }finally{ setLoading(false); }
  }

  function triggerPick(){ setTimeout(()=> fileRef.current?.click(), 0); }

  function removeAvatar(){
    try{
      const cur = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const updated = Object.assign({}, cur || {});
      delete updated.avatar;
      localStorage.setItem('currentUser', JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(updated) }));
      setPhoto('/default-avatar.png');
    }catch(e){ console.warn('remove avatar failed', e); }
  }

  return (
    <div className="p-3">
      <div className="profile-menu-header" style={{ padding: 12 }}>
        {photo ? (
          <img src={photo} alt={nameLocal || 'User avatar'} className="profile-avatar" />
        ) : (
          <div className="profile-avatar initials">{(nameLocal || 'D').charAt(0).toUpperCase()}</div>
        )}
        <div style={{ marginLeft: 10, flex: 1 }}>
          {showEditName ? (
            <div>
              <input id="profile-name-input" value={nameLocal} onChange={e => setNameLocal(e.target.value)} className="border px-2 py-1 rounded" />
              <div className="mt-2 flex items-center gap-2">
                <button type="button" className="btn btn-primary" onClick={handleNameSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditName(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="font-semibold" style={{color:'var(--card-text)'}}>{nameLocal}</div>
              <div className="text-xs text-muted">{user?.email || ''}</div>
              <div className="mt-2 flex items-center gap-2">
                <button type="button" className="btn btn-ghost" onClick={triggerPick} disabled={loading}>{loading ? 'Uploading...' : 'Change photo'}</button>
                {photo && photo !== '/default-avatar.png' && <button type="button" className="btn" onClick={removeAvatar}>Remove</button>}
                <button type="button" className="btn btn-ghost" onClick={() => { setShowEditName(true); setTimeout(()=>{ const el = document.getElementById('profile-name-input'); if(el) el.focus(); }, 50); }}>Edit name</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={fileRef} id="photoInput" type="file" accept="image/*" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} onChange={handlePhotoChange} />

  <div className="profile-menu-divider" />

  {/* Profile should go to /profile (not /policy/admin). Settings remains reports for now */}
  <button type="button" className="profile-menu-item" onClick={() => { closeMenu(); onNavigate('/profile'); }}>Profile</button>
  <button type="button" className="profile-menu-item" onClick={() => { closeMenu(); onNavigate('/settings'); }}>Settings</button>

      {/* role switching removed - app manages role elsewhere */}
      <div className="profile-menu-divider" />
      <button type="button" className="profile-menu-item profile-logout" onClick={() => { closeMenu(); onLogout(); }}>Logout</button>
    </div>
  );
}
