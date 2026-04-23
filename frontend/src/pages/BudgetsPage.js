import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, CATEGORIES } from '../utils/formatters';
import toast from 'react-hot-toast';

function BudgetModal({ onClose, onSave }) {
  const now = new Date();
  const [form, setForm] = useState({ category:'Food & Dining', limit:'', month: now.getMonth()+1, year: now.getFullYear(), alertThreshold:80 });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f => ({...f, [k]:v}));
  const inputStyle = { width:'100%', padding:'0.6rem 0.85rem', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.875rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:'0.8125rem', fontWeight:500, color:'#334155', marginBottom:5 };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const r = await api.post('/budgets', form); onSave(r.data); toast.success('Budget created!'); onClose(); }
    catch {} finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'2rem', width:'100%', maxWidth:440 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1.125rem', fontWeight:700 }}>New Budget</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:'1rem' }}><label style={labelStyle}>Category</label>
            <select style={inputStyle} value={form.category} onChange={e => set('category',e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'1rem' }}><label style={labelStyle}>Monthly Limit ($)</label>
            <input style={inputStyle} type="number" step="0.01" min="1" required value={form.limit} onChange={e => set('limit',e.target.value)} placeholder="500.00" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            <div><label style={labelStyle}>Month</label>
              <select style={inputStyle} value={form.month} onChange={e => set('month', parseInt(e.target.value))}>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Year</label>
              <input style={inputStyle} type="number" value={form.year} onChange={e => set('year', parseInt(e.target.value))} /></div>
          </div>
          <div style={{ marginBottom:'1.5rem' }}><label style={labelStyle}>Alert at (% of limit)</label>
            <input style={inputStyle} type="number" min="1" max="100" value={form.alertThreshold} onChange={e => set('alertThreshold', parseInt(e.target.value))} />
          </div>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding:'0.6rem 1.25rem', border:'1.5px solid #E2E8F0', borderRadius:8, cursor:'pointer', background:'none', fontFamily:'inherit', fontSize:'0.875rem' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding:'0.6rem 1.25rem', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'0.875rem' }}>{loading?'Saving...':'Create Budget'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  const now = new Date();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get(`/budgets?month=${month}&year=${year}`); setBudgets(r.data); }
    catch {} finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete budget?')) return;
    await api.delete(`/budgets/${id}`);
    setBudgets(p => p.filter(b => b._id !== id));
    toast.success('Deleted');
  };

  const getColor = (pct) => pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#10B981';

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Budgets</h1>
        <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap', alignItems:'center' }}>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding:'0.5rem 0.75rem', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.875rem', fontFamily:'inherit', outline:'none' }}>
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ padding:'0.5rem 0.75rem', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.875rem', fontFamily:'inherit', outline:'none', width:80 }} />
          <button onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'0.55rem 1rem', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.875rem', fontWeight:600, fontFamily:'inherit' }}>
            <Plus size={16} /> Add Budget
          </button>
        </div>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'3rem', color:'#64748B' }}>Loading...</div> : budgets.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem', background:'#fff', borderRadius:12, color:'#94A3B8' }}>
          <p style={{ marginBottom:'1rem' }}>No budgets set for this period.</p>
          <button onClick={() => setShowModal(true)} style={{ padding:'0.625rem 1.25rem', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Create First Budget</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
          {budgets.map(b => {
            const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
            const color = getColor(pct);
            return (
              <div key={b._id} style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.875rem' }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'0.9375rem', color:'#1E293B' }}>{b.category}</div>
                    <div style={{ fontSize:'0.8rem', color:'#94A3B8', marginTop:2 }}>Limit: {formatCurrency(b.limit)}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ background: pct>=100?'#FEE2E2':pct>=80?'#FEF3C7':'#D1FAE5', color: pct>=100?'#991B1B':pct>=80?'#92400E':'#065F46', padding:'3px 10px', borderRadius:99, fontSize:'0.75rem', fontWeight:600 }}>{pct}%</span>
                    <button onClick={() => handleDelete(b._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:2 }}><Trash2 size={15} /></button>
                  </div>
                </div>
                <div style={{ height:8, background:'#F1F5F9', borderRadius:99, overflow:'hidden', marginBottom:'0.75rem' }}>
                  <div style={{ height:'100%', width:`${Math.min(pct,100)}%`, background:color, borderRadius:99, transition:'width 0.4s ease' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'#64748B' }}>
                  <span>Spent: <strong style={{ color:'#1E293B' }}>{formatCurrency(b.spent)}</strong></span>
                  <span>Remaining: <strong style={{ color: pct>=100?'#EF4444':'#10B981' }}>{formatCurrency(Math.max(b.limit - b.spent, 0))}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showModal && <BudgetModal onClose={() => setShowModal(false)} onSave={b => setBudgets(p => [...p, b])} />}
    </div>
  );
}
