import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PieChart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch {
      // error handled in api interceptor
    } finally {
      setLoading(false);
    }
  };

  const s = {
    page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#EEF2FF 0%,#F8FAFC 100%)', padding:'1rem' },
    card: { background:'#fff', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:420, boxShadow:'0 4px 24px rgba(79,70,229,0.08)' },
    logo: { display:'flex', alignItems:'center', gap:'0.625rem', justifyContent:'center', marginBottom:'1.75rem' },
    logoText: { fontSize:'1.5rem', fontWeight:800, color:'#1E293B' },
    title: { textAlign:'center', fontSize:'1.25rem', fontWeight:700, marginBottom:8 },
    sub: { textAlign:'center', color:'#64748B', fontSize:'0.875rem', marginBottom:'1.75rem' },
    group: { marginBottom:'1rem' },
    label: { display:'block', fontSize:'0.8125rem', fontWeight:500, color:'#334155', marginBottom:6 },
    input: { width:'100%', padding:'0.65rem 0.875rem', border:'1.5px solid #E2E8F0', borderRadius:9, fontSize:'0.875rem', outline:'none', fontFamily:'inherit', transition:'border 0.15s' },
    btn: { width:'100%', padding:'0.7rem', background:'#4F46E5', color:'#fff', border:'none', borderRadius:9, fontSize:'0.9rem', fontWeight:600, cursor:'pointer', marginTop:8, fontFamily:'inherit' },
    footer: { textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem', color:'#64748B' },
    link: { color:'#4F46E5', fontWeight:600 },
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}><PieChart size={28} color="#4F46E5" /><span style={s.logoText}>FinanceAI</span></div>
        <h1 style={s.title}>Sign in to your account</h1>
        <p style={s.sub}>Track your finances intelligently</p>
        <form onSubmit={handleSubmit}>
          <div style={s.group}>
            <label style={s.label}>Email address</label>
            <input style={s.input} type="email" required value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" />
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" required value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" />
          </div>
          <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div style={s.footer}>Don't have an account? <Link to="/register" style={s.link}>Sign up</Link></div>
      </div>
    </div>
  );
}
