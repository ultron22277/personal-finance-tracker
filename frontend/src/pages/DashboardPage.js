import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../utils/api';
import { formatCurrency, formatDate, CATEGORY_COLORS } from '../utils/formatters';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/monthly-trends?months=6'),
      api.get('/analytics/category-breakdown'),
      api.get('/transactions?limit=5&sort=-date'),
    ]).then(([s, t, b, tx]) => {
      setSummary(s.data);
      setTrends(t.data);
      setBreakdown(b.data.breakdown?.slice(0, 6) || []);
      setRecentTx(tx.data.transactions || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'3rem', color:'#64748B' }}>Loading dashboard...</div>;

  const stats = [
    { label:'Monthly Income', value: formatCurrency(summary?.income), icon: TrendingUp, color:'#10B981', bg:'#D1FAE5' },
    { label:'Monthly Expenses', value: formatCurrency(summary?.expenses), icon: TrendingDown, color:'#EF4444', bg:'#FEE2E2' },
    { label:'Net Savings', value: formatCurrency(summary?.savings), icon: PiggyBank, color:'#4F46E5', bg:'#EEF2FF' },
    { label:'Transactions', value: recentTx.length + '+', icon: DollarSign, color:'#F59E0B', bg:'#FEF3C7' },
  ];

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:700, color:'#0F172A' }}>Dashboard</h1>
        <p style={{ color:'#64748B', fontSize:'0.875rem', marginTop:4 }}>Your financial overview for this month</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:'1rem' }}>
            <div style={{ width:48, height:48, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ fontSize:'1.375rem', fontWeight:700, color:'#0F172A' }}>{value}</div>
              <div style={{ fontSize:'0.8rem', color:'#64748B' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.25rem' }}>
        {/* Trend Chart */}
        <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize:'1rem', fontWeight:600, marginBottom:'1rem' }}>6-Month Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} dot={false} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} dot={false} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize:'1rem', fontWeight:600, marginBottom:'1rem' }}>Spending by Category</h2>
          {breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={breakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {breakdown.map((entry, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[entry.category] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign:'center', color:'#94A3B8', paddingTop:'3rem' }}>No expense data yet</div>}
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h2 style={{ fontSize:'1rem', fontWeight:600 }}>Recent Transactions</h2>
          <Link to="/transactions" style={{ fontSize:'0.8rem', color:'#4F46E5', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}>View all <ArrowRight size={13} /></Link>
        </div>
        {recentTx.length === 0 ? (
          <div style={{ textAlign:'center', color:'#94A3B8', padding:'2rem' }}>No transactions yet. <Link to="/transactions" style={{ color:'#4F46E5' }}>Add one</Link></div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Description','Category','Date','Amount'].map(h => <th key={h} style={{ padding:'0.5rem 0.75rem', textAlign:'left', fontSize:'0.75rem', color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:'1px solid #F1F5F9' }}>{h}</th>)}</tr></thead>
            <tbody>
              {recentTx.map(tx => (
                <tr key={tx._id}>
                  <td style={{ padding:'0.625rem 0.75rem', fontSize:'0.875rem', color:'#334155' }}>{tx.description || tx.category}</td>
                  <td style={{ padding:'0.625rem 0.75rem' }}><span style={{ background:'#EEF2FF', color:'#4F46E5', padding:'2px 10px', borderRadius:99, fontSize:'0.75rem', fontWeight:500 }}>{tx.category}</span></td>
                  <td style={{ padding:'0.625rem 0.75rem', fontSize:'0.8125rem', color:'#64748B' }}>{formatDate(tx.date)}</td>
                  <td style={{ padding:'0.625rem 0.75rem', fontWeight:600, color: tx.type === 'income' ? '#10B981' : '#EF4444', fontSize:'0.9rem' }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
