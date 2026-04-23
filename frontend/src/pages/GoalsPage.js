import React, { useEffect, useState } from 'react';
import { Plus, X, Target, PlusCircle } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const GOAL_CATEGORIES = ['emergency_fund','vacation','education','home','car','retirement','other'];

function GoalModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', targetAmount:'', currentAmount:'0', deadline:'', category:'other' });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const inputStyle = { width:'100%', padding:'0.6rem 0.85rem', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.875rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:'0.8125rem', fontWeight:500, color:'#334155', marginBottom:5 };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const r = await api.post('/goals', form); onSave(r.data); toast.success('Goal created!'); onClose(); }
    catch {} finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'2rem', width:'100%', maxWidth:440 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1.125rem', fontWeight:700 }}>New Financial Goal</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          {[['name','Goal Name','text','e.g. Emergency Fund'],['targetAmount','Target Amount ($)','number','10000'],['currentAmount','Current Amount ($)','number','0']].map(([k,l,t,p]) => (
            <div style={{ marginBottom:'1rem' }} key={k}><label style={labelStyle}>{l}</label>
              <input style={inputStyle} type={t} step="0.01" min={t==='number'?'0':undefined} required={k!=='currentAmount'} value={form[k]} onChange={e => set(k,e.target.value)} placeholder={p} /></div>
          ))}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
            <div><label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category} onChange={e => set('category',e.target.value)}>
                {GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select></div>
            <div><label style={labelStyle}>Deadline (optional)</label>
              <input style={inputStyle} type="date" value={form.deadline} onChange={e => set('deadline',e.target.value)} /></div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding:'0.6rem 1.25rem', border:'1.5px solid #E2E8F0', borderRadius:8, cursor:'pointer', background:'none', fontFamily:'inherit', fontSize:'0.875rem' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding:'0.6rem 1.25rem', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'0.875rem' }}>{loading?'Saving...':'Create Goal'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContributeModal({ goal, onClose, onUpdate }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const r = await api.post(`/goals/${goal._id}/contribute`, { amount: parseFloat(amount) }); onUpdate(r.data); toast.success('Contribution added!'); onClose(); }
    catch {} finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'2rem', width:'100%', maxWidth:360 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h2 style={{ fontSize:'1.125rem', fontWeight:700 }}>Add Contribution</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={20}/></button>
        </div>
        <p style={{ fontSize:'0.875rem', color:'#64748B', marginBottom:'1rem' }}>Goal: <strong>{goal.name}</strong></p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={{ display:'block', fontSize:'0.8125rem', fontWeight:500, color:'#334155', marginBottom:5 }}>Amount ($)</label>
            <input autoFocus type="number" step="0.01" min="0.01" required value={amount} onChange={e => setAmount(e.target.value)}
              style={{ width:'100%', padding:'0.6rem 0.85rem', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.875rem', outline:'none', fontFamily:'inherit' }} placeholder="100.00" />
          </div>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding:'0.6rem 1.25rem', border:'1.5px solid #E2E8F0', borderRadius:8, cursor:'pointer', background:'none', fontFamily:'inherit', fontSize:'0.875rem' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding:'0.6rem 1.25rem', background:'#10B981', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'0.875rem' }}>{loading?'Adding...':'Contribute'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState(null);

  useEffect(() => {
    api.get('/goals').then(r => setGoals(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const categoryEmoji = { emergency_fund:'🛡️', vacation:'✈️', education:'🎓', home:'🏠', car:'🚗', retirement:'👴', other:'🎯' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Goals & Savings</h1>
        <button onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'0.55rem 1rem', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.875rem', fontWeight:600, fontFamily:'inherit' }}>
          <Plus size={16}/> Add Goal
        </button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'3rem', color:'#64748B' }}>Loading...</div> : goals.length===0 ? (
        <div style={{ textAlign:'center', padding:'4rem', background:'#fff', borderRadius:12, color:'#94A3B8' }}>
          <Target size={48} style={{ margin:'0 auto 1rem', display:'block', opacity:0.4 }}/>
          <p style={{ marginBottom:'1rem' }}>No goals yet. Set your first financial goal!</p>
          <button onClick={() => setShowModal(true)} style={{ padding:'0.625rem 1.25rem', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Create Goal</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
          {goals.map(g => {
            const pct = g.progressPercent || 0;
            return (
              <div key={g._id} style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.875rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                    <span style={{ fontSize:'1.5rem' }}>{categoryEmoji[g.category]||'🎯'}</span>
                    <div>
                      <div style={{ fontWeight:700, fontSize:'0.9375rem' }}>{g.name}</div>
                      <div style={{ fontSize:'0.75rem', color:'#94A3B8', textTransform:'capitalize' }}>{g.category.replace('_',' ')}</div>
                    </div>
                  </div>
                  <span style={{ background: g.status==='completed'?'#D1FAE5':'#EEF2FF', color:g.status==='completed'?'#065F46':'#4F46E5', padding:'3px 10px', borderRadius:99, fontSize:'0.75rem', fontWeight:600, textTransform:'capitalize' }}>{g.status}</span>
                </div>
                <div style={{ marginBottom:'0.75rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8125rem', color:'#64748B', marginBottom:6 }}>
                    <span>{formatCurrency(g.currentAmount)} saved</span><span>{pct}%</span>
                  </div>
                  <div style={{ height:10, background:'#F1F5F9', borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: g.status==='completed'?'#10B981':'#4F46E5', borderRadius:99, transition:'width 0.4s' }}/>
                  </div>
                </div>
                <div style={{ fontSize:'0.8125rem', color:'#64748B', marginBottom:'1rem' }}>
                  <div>Target: <strong style={{ color:'#1E293B' }}>{formatCurrency(g.targetAmount)}</strong></div>
                  {g.deadline && <div>Deadline: <strong style={{ color:'#1E293B' }}>{formatDate(g.deadline)}</strong></div>}
                  {g.suggestedMonthlyContribution > 0 && <div>Suggested/month: <strong style={{ color:'#4F46E5' }}>{formatCurrency(g.suggestedMonthlyContribution)}</strong></div>}
                </div>
                {g.status !== 'completed' && (
                  <button onClick={() => setContributeGoal(g)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'0.6rem', background:'#EEF2FF', color:'#4F46E5', border:'none', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'0.875rem' }}>
                    <PlusCircle size={15}/> Add Contribution
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && <GoalModal onClose={() => setShowModal(false)} onSave={g => setGoals(p => [g,...p])} />}
      {contributeGoal && <ContributeModal goal={contributeGoal} onClose={() => setContributeGoal(null)} onUpdate={updated => setGoals(p => p.map(g => g._id===updated._id?updated:g))} />}
    </div>
  );
}
