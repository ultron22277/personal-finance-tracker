import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Upload, Trash2, Edit2, X, Filter } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, formatDate, CATEGORIES } from '../utils/formatters';
import toast from 'react-hot-toast';

const PAYMENT_MODES = ['cash','card','bank_transfer','upi','other'];

function TransactionModal({ tx, onClose, onSave }) {
  const [form, setForm] = useState(tx || { type:'expense', amount:'', category:'Food & Dining', description:'', date: new Date().toISOString().split('T')[0], paymentMode:'card', notes:'' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tx?._id) { const r = await api.put(`/transactions/${tx._id}`, form); onSave(r.data, 'update'); }
      else { const r = await api.post('/transactions', form); onSave(r.data, 'create'); }
      toast.success(tx?._id ? 'Transaction updated' : 'Transaction added');
      onClose();
    } catch {} finally { setLoading(false); }
  };

  const inputStyle = { width:'100%', padding:'0.6rem 0.85rem', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.875rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box' };
  const labelStyle = { display:'block', fontSize:'0.8125rem', fontWeight:500, color:'#334155', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'1rem' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'2rem', width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <h2 style={{ fontSize:'1.125rem', fontWeight:700 }}>{tx?._id ? 'Edit' : 'Add'} Transaction</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Amount</label>
              <input style={inputStyle} type="number" step="0.01" min="0.01" required value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div style={{ marginBottom:'1rem' }}>
            <label style={labelStyle}>Category</label>
            <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'1rem' }}>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input style={inputStyle} type="date" required value={form.date?.split('T')[0]} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Payment Mode</label>
              <select style={inputStyle} value={form.paymentMode} onChange={e => set('paymentMode', e.target.value)}>
                {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.replace('_',' ')}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, resize:'vertical', minHeight:70 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
          </div>
          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding:'0.6rem 1.25rem', border:'1.5px solid #E2E8F0', borderRadius:8, cursor:'pointer', background:'none', fontFamily:'inherit', fontSize:'0.875rem' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding:'0.6rem 1.25rem', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontFamily:'inherit', fontSize:'0.875rem' }}>{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [filters, setFilters] = useState({ type:'', category:'', page:1 });

  const fetchTx = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit:15, sort:'-date', ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) });
      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch {} finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTx(); }, [fetchTx]);

  const handleSave = (saved, op) => {
    if (op === 'create') setTransactions(p => [saved, ...p]);
    else setTransactions(p => p.map(t => t._id === saved._id ? saved : t));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    await api.delete(`/transactions/${id}`);
    setTransactions(p => p.filter(t => t._id !== id));
    toast.success('Deleted');
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await api.post('/transactions/import-csv', fd, { headers: { 'Content-Type':'multipart/form-data' } });
      toast.success(`Imported ${res.data.imported} transactions`);
      fetchTx();
    } catch {} finally { e.target.value = ''; }
  };

  const thStyle = { padding:'0.625rem 1rem', textAlign:'left', fontSize:'0.75rem', color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #F1F5F9', whiteSpace:'nowrap' };
  const tdStyle = { padding:'0.75rem 1rem', fontSize:'0.875rem', color:'#334155', borderBottom:'1px solid #F8FAFC' };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Transactions</h1>
        <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap' }}>
          <label style={{ display:'flex', alignItems:'center', gap:6, padding:'0.55rem 1rem', border:'1.5px solid #E2E8F0', borderRadius:8, cursor:'pointer', fontSize:'0.875rem', fontWeight:500, background:'#fff' }}>
            <Upload size={15} /> Import CSV
            <input type="file" accept=".csv" onChange={handleCSV} style={{ display:'none' }} />
          </label>
          <button onClick={() => { setEditTx(null); setShowModal(true); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'0.55rem 1rem', background:'#4F46E5', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.875rem', fontWeight:600, fontFamily:'inherit' }}>
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background:'#fff', borderRadius:12, padding:'1rem', marginBottom:'1rem', display:'flex', gap:'0.75rem', flexWrap:'wrap', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <select value={filters.type} onChange={e => setFilters(f => ({...f, type:e.target.value, page:1}))} style={{ padding:'0.5rem 0.75rem', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.875rem', fontFamily:'inherit', outline:'none' }}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filters.category} onChange={e => setFilters(f => ({...f, category:e.target.value, page:1}))} style={{ padding:'0.5rem 0.75rem', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.875rem', fontFamily:'inherit', outline:'none' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        {(filters.type || filters.category) && (
          <button onClick={() => setFilters({ type:'', category:'', page:1 })} style={{ display:'flex', alignItems:'center', gap:4, padding:'0.5rem 0.75rem', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:'0.875rem', cursor:'pointer', background:'none', fontFamily:'inherit', color:'#64748B' }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' }}>
        {loading ? <div style={{ textAlign:'center', padding:'3rem', color:'#64748B' }}>Loading...</div> : transactions.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'#94A3B8' }}>No transactions found.</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr><th style={thStyle}>Description</th><th style={thStyle}>Category</th><th style={thStyle}>Type</th><th style={thStyle}>Date</th><th style={thStyle}>Amount</th><th style={thStyle}>Mode</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id} style={{ transition:'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background='#fff'}>
                    <td style={tdStyle}>{tx.description || '—'}</td>
                    <td style={tdStyle}><span style={{ background:'#EEF2FF', color:'#4F46E5', padding:'2px 10px', borderRadius:99, fontSize:'0.75rem', fontWeight:500 }}>{tx.category}</span></td>
                    <td style={tdStyle}><span style={{ background: tx.type==='income'?'#D1FAE5':'#FEE2E2', color:tx.type==='income'?'#065F46':'#991B1B', padding:'2px 10px', borderRadius:99, fontSize:'0.75rem', fontWeight:500 }}>{tx.type}</span></td>
                    <td style={{ ...tdStyle, color:'#64748B' }}>{formatDate(tx.date)}</td>
                    <td style={{ ...tdStyle, fontWeight:700, color:tx.type==='income'?'#10B981':'#EF4444' }}>{tx.type==='income'?'+':'-'}{formatCurrency(tx.amount)}</td>
                    <td style={{ ...tdStyle, color:'#64748B', fontSize:'0.8125rem' }}>{tx.paymentMode?.replace('_',' ')}</td>
                    <td style={tdStyle}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => { setEditTx(tx); setShowModal(true); }} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748B', padding:4 }}><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(tx._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:4 }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.pages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem', padding:'1rem', borderTop:'1px solid #F1F5F9' }}>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setFilters(f => ({...f, page:p}))} style={{ width:34, height:34, borderRadius:8, border: p===filters.page ? 'none' : '1.5px solid #E2E8F0', background: p===filters.page ? '#4F46E5' : '#fff', color: p===filters.page ? '#fff' : '#334155', cursor:'pointer', fontSize:'0.875rem', fontFamily:'inherit', fontWeight: p===filters.page?600:400 }}>{p}</button>
            ))}
          </div>
        )}
      </div>

      {showModal && <TransactionModal tx={editTx} onClose={() => { setShowModal(false); setEditTx(null); }} onSave={handleSave} />}
    </div>
  );
}
