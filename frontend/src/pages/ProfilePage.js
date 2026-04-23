import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name||'', currency: user?.currency||'USD' });
  const [pwForm, setPwForm] = useState({ oldPassword:'', newPassword:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const inputStyle = { width:'100%', padding:'0.65rem 0.875rem', border:'1.5px solid #E2E8F0', borderRadius:9, fontSize:'0.875rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:'0.8125rem', fontWeight:500, color:'#334155', marginBottom:5 };

  const handleProfile = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const r = await api.put('/auth/profile', form);
      setUser(u => ({...u, ...r.data}));
      toast.success('Profile updated!');
    } catch {} finally { setLoading(false); }
  };

  const CURRENCIES = ['USD','EUR','GBP','INR','JPY','CAD','AUD','CHF'];

  return (
    <div>
      <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1.5rem' }}>Profile Settings</h1>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:'1.25rem' }}>

        {/* Avatar card */}
        <div style={{ background:'#fff', borderRadius:12, padding:'2rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', display:'flex', flexDirection:'column', alignItems:'center' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'#4F46E5', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:700, marginBottom:'1rem' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ fontWeight:700, fontSize:'1.125rem' }}>{user?.name}</div>
          <div style={{ color:'#64748B', fontSize:'0.875rem', marginTop:4 }}>{user?.email}</div>
          <div style={{ marginTop:8, padding:'4px 14px', background:'#EEF2FF', color:'#4F46E5', borderRadius:99, fontSize:'0.8rem', fontWeight:600, textTransform:'capitalize' }}>{user?.role}</div>
        </div>

        {/* Edit profile */}
        <div style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight:700, marginBottom:'1.25rem', fontSize:'1rem' }}>Edit Profile</h2>
          <form onSubmit={handleProfile}>
            <div style={{ marginBottom:'1rem' }}>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} required />
            </div>
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={labelStyle}>Preferred Currency</label>
              <select style={inputStyle} value={form.currency} onChange={e => setForm(f => ({...f,currency:e.target.value}))}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading} style={{ display:'flex', alignItems:'center', gap:6, padding:'0.65rem 1.25rem', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'0.875rem' }}>
              <Save size={15}/>{loading?'Saving...':'Save Changes'}
            </button>
          </form>
        </div>

        {/* Account info */}
        <div style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontWeight:700, marginBottom:'1.25rem', fontSize:'1rem' }}>Account Information</h2>
          {[['Email', user?.email],['Role', user?.role],['Member Since', new Date(user?.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})]].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'0.75rem 0', borderBottom:'1px solid #F1F5F9' }}>
              <span style={{ fontSize:'0.875rem', color:'#64748B' }}>{k}</span>
              <span style={{ fontSize:'0.875rem', fontWeight:500, color:'#1E293B', textTransform:'capitalize' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
