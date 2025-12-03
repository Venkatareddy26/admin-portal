import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage(){
  const navigate = useNavigate();
  const [role, setRole] = useState(() => localStorage.getItem('currentRole') || 'employee');
  const [users, setUsers] = useState(() => { try{ return JSON.parse(localStorage.getItem('local_users')||'[]') }catch(e){ return [] } });
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');

  useEffect(()=>{
    try{ setUsers(JSON.parse(localStorage.getItem('local_users')||'[]')) }catch(e){}
  }, []);

  function doLogout(){
    try{
      localStorage.removeItem('app_token');
      // optionally keep currentUser but clear role
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentRole');
      window.dispatchEvent(new Event('logout'));
    }catch(e){}
    navigate('/login', { replace: true });
  }

  function changeRole(){
    try{ localStorage.setItem('currentRole', role); window.dispatchEvent(new StorageEvent('storage', { key: 'currentRole', newValue: role })); }catch(e){}
    alert('Role updated to ' + role);
  }

  function doSignInLocal(u){
    // sign in by setting app_token and currentUser (dev helper)
    try{
      const token = 'local-' + (u.email || 'user');
      localStorage.setItem('app_token', token);
      localStorage.setItem('currentUser', JSON.stringify({ name: u.name, email: u.email, avatar: u.avatar }));
      localStorage.setItem('currentRole', role);
      navigate('/dashboard');
    }catch(e){ console.error('signin failed', e); }
  }

  function createAccount(){
    if(!createEmail || !createPassword) return alert('Enter name, email and password');
    const newUser = { id: Date.now(), name: createName || createEmail.split('@')[0], email: createEmail, password: createPassword };
    const next = (users || []).concat([newUser]);
    try{ localStorage.setItem('local_users', JSON.stringify(next)); setUsers(next); setCreating(false); setCreateName(''); setCreateEmail(''); setCreatePassword(''); alert('Account created — you can sign in from this page'); }catch(e){ console.error(e); alert('Failed to create account'); }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>

      <section className="mb-6">
        <h3 className="font-medium mb-2">Session</h3>
        <div className="flex items-center gap-3">
          <button className="btn btn-danger" onClick={doLogout}>Logout</button>
          <button className="btn" onClick={() => navigate('/login')}>Sign in (go to login)</button>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-medium mb-2">Local accounts (dev)</h3>
        <div className="space-y-2">
          {(users || []).length ? (users || []).map(u => (
            <div key={u.id} className="flex items-center justify-between p-2 elevated">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-muted">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost" onClick={()=>doSignInLocal(u)}>Sign in as</button>
              </div>
            </div>
          )) : <div className="text-sm text-muted">No local accounts created.</div>}

          {creating ? (
            <div className="p-3 elevated">
              <div className="mb-2"><input placeholder="Name" value={createName} onChange={e=>setCreateName(e.target.value)} className="border px-2 py-1 w-full" /></div>
              <div className="mb-2"><input placeholder="Email" value={createEmail} onChange={e=>setCreateEmail(e.target.value)} className="border px-2 py-1 w-full" /></div>
              <div className="mb-2"><input placeholder="Password" type="password" value={createPassword} onChange={e=>setCreatePassword(e.target.value)} className="border px-2 py-1 w-full" /></div>
              <div className="flex items-center gap-2">
                <button className="btn btn-primary" onClick={createAccount}>Create</button>
                <button className="btn btn-ghost" onClick={()=>setCreating(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn" onClick={()=>setCreating(true)}>Create new account</button>
          )}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-medium mb-2">Role</h3>
        <div className="flex items-center gap-3">
          <select value={role} onChange={e=>setRole(e.target.value)} className="border px-2 py-1 rounded">
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="finance">Finance</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn" onClick={changeRole}>Save role</button>
        </div>
        <div className="text-xs text-muted mt-2">Changing role here updates the local role for development and demo purposes.</div>
      </section>
    </div>
  );
}
