import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(() => localStorage.getItem('currentRole') || 'employee');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Use environment variable or Vite proxy
  const API_BASE = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    try{
      const t = localStorage.getItem('app_token');
      if(t) navigate('/dashboard');
    }catch(e){}
  }, []);

  async function submit(e){
    e.preventDefault();
    if(!email || !password){ setError('Please enter email and password'); return; }
    try{
      const res = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if(!res.ok){
        // try to parse JSON error, otherwise read text
        let bodyErr = null;
        try{ const j = await res.json(); bodyErr = j.error || j.message || JSON.stringify(j); }catch(e){ try{ bodyErr = await res.text(); }catch(e2){ bodyErr = res.statusText || 'Login failed'; } }
        setError(bodyErr || 'Login failed');
        return;
      }
      const body = await res.json().catch(()=>({}));
      const token = body.token || body.tokenId || body.accessToken;
      if(token){
        try{ localStorage.setItem('app_token', token); }catch(e){}
        try{
          // prefer server user object if returned
          const serverUser = body.user || body.userInfo || body.profile;
          const userObj = serverUser ? serverUser : { name: email.split('@')[0] || email, email };
          localStorage.setItem('currentUser', JSON.stringify(userObj));
        }catch(e){}
        try{ localStorage.setItem('currentRole', serverUser?.role || role); }catch(e){}
        navigate('/dashboard');
      } else {
        setError('Login succeeded but no token returned');
      }
    }catch(err){
      console.error('login error', err, 'API_BASE=', API_BASE);
      setError(`Login failed (network) — unable to reach ${API_BASE}`);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', padding: '20px' }}>
      <div className="container elevated rounded" style={{ padding: '24px', boxSizing: 'border-box' }}>
        <h2 className="text-2xl font-semibold mb-4 text-center">Sign in</h2>
        <form onSubmit={submit} className="space-y-3 w-full">
          <div>
            <label className="text-sm">Email</label>
            <input className="border p-2 rounded w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm">Password</label>
            <input className="border p-2 rounded w-full" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" />
          </div>
          <div>
            <label className="text-sm">Role</label>
            <select className="border p-2 rounded w-full" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="employee">HR</option>
              <option value="manager">Manager</option>
              <option value="finance">Finance</option>
            </select>
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div className="flex items-center justify-between">
            <button className="btn btn-primary" type="submit">Sign in</button>
          </div>
          <div className="text-xs text-muted mt-2">
            Don't have an account? <button type="button" className="text-sm text-blue-600 underline" onClick={() => navigate('/register')}>Create one</button>
          </div>
        </form>
      </div>
    </div>
  );
}
