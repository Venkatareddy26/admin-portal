import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage(){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(() => localStorage.getItem('currentRole') || 'employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Use environment variable or Vite proxy
  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Check auth on mount - redirect if already logged in
  useEffect(() => {
    try{
      const t = localStorage.getItem('app_token');
      if(t) navigate('/dashboard', { replace: true });
    }catch(e){}
  }, [navigate]);

  const submit = useCallback(async (e) => {
    e.preventDefault();
    if(!email || !password){ setError('Please enter email and password'); return; }
    if(loading) return; // Prevent double submit
    
    setLoading(true);
    setError('');
    
    try{
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const res = await fetch(`${API_BASE}/api/auth/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if(!res.ok){
        let bodyErr = null;
        try{ const j = await res.json(); bodyErr = j.error || j.message || JSON.stringify(j); }catch(e){ try{ bodyErr = await res.text(); }catch(e2){ bodyErr = res.statusText || 'Login failed'; } }
        setError(bodyErr || 'Login failed');
        return;
      }
      
      const body = await res.json().catch(()=>({}));
      const token = body.token || body.tokenId || body.accessToken;
      
      if(token){
        // Store auth data
        localStorage.setItem('app_token', token);
        const serverUser = body.user || body.userInfo || body.profile;
        const userObj = serverUser ? serverUser : { name: email.split('@')[0] || email, email };
        localStorage.setItem('currentUser', JSON.stringify(userObj));
        localStorage.setItem('currentRole', serverUser?.role || role);
        
        // Navigate immediately
        navigate('/dashboard', { replace: true });
      } else {
        setError('Login succeeded but no token returned');
      }
    }catch(err){
      if(err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        console.error('login error', err);
        setError(`Login failed — unable to reach server`);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, role, loading, navigate, API_BASE]);
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
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </div>
          <div className="text-xs text-muted mt-2">
            Don't have an account? <button type="button" className="text-sm text-blue-600 underline" onClick={() => navigate('/register')}>Create one</button>
          </div>
        </form>
      </div>
    </div>
  );
}
