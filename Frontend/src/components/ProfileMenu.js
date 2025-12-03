import React, { useState, useRef, useEffect } from 'react';

// Use relative URL to leverage Vite proxy
const API_BASE = '';

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
    console.log('📸 Photo change triggered', e.target.files);
    const file = e.target.files && e.target.files[0];
    if(!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('✅ File selected:', file.name, file.type, file.size);
    const formData = new FormData();
    formData.append('photo', file);

    const token = localStorage.getItem('app_token');
    console.log('🔑 Token:', token ? 'Found' : 'Not found');

    try{
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/user/photo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json().catch(()=>({}));
      console.log('📥 Photo upload response:', data);
      
      if(data?.success && data?.user){
        const photoUrl = data?.photoUrl || data?.avatarUrl || data?.user?.avatar;
        console.log('🖼️ Photo URL:', photoUrl);
        if(photoUrl){
          setPhoto(photoUrl);
          // Update with user data from server
          try{
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(data.user) }));
          }catch(e){ console.warn('persist avatar failed', e); }
          alert('Photo updated successfully!');
        }
      } else {
        alert('Failed to upload photo');
      }
    }catch(err){
      console.error('Photo upload failed:', err);
      alert('Network error - failed to upload photo');
    }finally{ 
      setLoading(false); 
      if(e.target) e.target.value = ''; 
    }
  }

  async function handleNameSave(){
    console.log('💾 Saving name:', nameLocal);
    const token = localStorage.getItem('app_token');
    console.log('🔑 Token:', token ? 'Found' : 'Not found');
    try{
      setLoading(true);
      console.log('📡 Sending request to:', `${API_BASE}/api/user/name`);
      const res = await fetch(`${API_BASE}/api/user/name`, {
        method: 'PATCH',
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: `Bearer ${token}` } : {}),
        body: JSON.stringify({ name: nameLocal })
      });
      const data = await res.json().catch(()=>({}));
      console.log('📥 Name update response:', data);
      if(data?.success && data?.user){
        // Update with user data from server
        try{
          localStorage.setItem('currentUser', JSON.stringify(data.user));
          window.dispatchEvent(new StorageEvent('storage', { key: 'currentUser', newValue: JSON.stringify(data.user) }));
        }catch(e){ console.warn('persist name failed', e); }
        setShowEditName(false);
        alert('Name updated successfully!');
      } else {
        alert('Failed to update name');
      }
    }catch(err){
      console.error('Name update failed:', err);
      alert('Network error - failed to update name');
    }finally{ setLoading(false); }
  }

  function triggerPick(){ 
    console.log('🖱️ Change photo button clicked');
    console.log('📎 File input ref:', fileRef.current);
    setTimeout(()=> {
      if(fileRef.current) {
        console.log('✅ Triggering file input click');
        fileRef.current.click();
      } else {
        console.log('❌ File input ref not found');
      }
    }, 0); 
  }

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
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button 
                  type="button" 
                  className="btn btn-ghost text-sm whitespace-nowrap" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); triggerPick(); }} 
                  disabled={loading}
                  style={{ cursor: 'pointer', zIndex: 10001 }}
                >
                  {loading ? 'Uploading...' : 'Change photo'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-ghost text-sm whitespace-nowrap" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEditName(true); setTimeout(()=>{ const el = document.getElementById('profile-name-input'); if(el) el.focus(); }, 50); }}
                  style={{ cursor: 'pointer', zIndex: 10001 }}
                >
                  Edit name
                </button>
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
