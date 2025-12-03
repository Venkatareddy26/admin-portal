import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Use environment variable or Vite proxy
const API_BASE = import.meta.env.VITE_API_URL || '';

export default function RegisterPage(){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e){
    e.preventDefault();
    setError('');

    // Validation
    if(!name || !email || !password){
      setError('Please fill in all fields');
      return;
    }

    if(password !== confirmPassword){
      setError('Passwords do not match');
      return;
    }

    if(password.length < 6){
      setError('Password must be at least 6 characters');
      return;
    }

    try{
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if(!res.ok){
        setError(data.error || 'Registration failed');
        return;
      }

      if(data.success && data.token){
        // Save token and user info
        localStorage.setItem('app_token', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        localStorage.setItem('currentRole', data.user.role);
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setError('Registration succeeded but no token returned');
      }
    }catch(err){
      console.error('Registration error:', err);
      setError('Network error - unable to reach server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)', padding: '20px' }}>
      <div className="container elevated rounded" style={{ padding: '24px', boxSizing: 'border-box' }}>
        <h2 className="text-2xl font-semibold mb-4 text-center">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="space-y-3 w-full">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input 
              className="border p-2 rounded w-full mt-1" 
              value={name} 
              onChange={e=>setName(e.target.value)} 
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input 
              className="border p-2 rounded w-full mt-1" 
              type="email"
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input 
              className="border p-2 rounded w-full mt-1" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              placeholder="At least 6 characters"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <input 
              className="border p-2 rounded w-full mt-1" 
              type="password" 
              value={confirmPassword} 
              onChange={e=>setConfirmPassword(e.target.value)} 
              placeholder="Re-enter password"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Role</label>
            <select 
              className="border p-2 rounded w-full mt-1" 
              value={role} 
              onChange={e=>setRole(e.target.value)}
              disabled={loading}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="finance">Finance</option>
            </select>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button 
              className="btn btn-primary w-full" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div className="text-xs text-muted text-center mt-3">
            Already have an account?{' '}
            <button 
              type="button" 
              className="text-sm text-blue-600 underline" 
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
