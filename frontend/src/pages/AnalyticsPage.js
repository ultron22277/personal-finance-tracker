import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import api from '../utils/api';
import { formatCurrency, CATEGORY_COLORS } from '../utils/formatters';

export default function AnalyticsPage() {
  const [trends, setTrends] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/monthly-trends?months=6'),
      api.get('/analytics/category-breakdown'),
      api.get('/analytics/anomalies'),
      api.get('/analytics/saving-tips'),
    ]).then(([t,b,a,s]) => {
      setTrends(t.data);
      setBreakdown(b.data.breakdown || []);
      setAnomalies(a.data.anomalies || []);
      setTips(s.data.tips || []);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'3rem', color:'#64748B' }}>Loading analytics...</div>;

  const card = { background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', marginBottom:'1.25rem' };

  return (
    <div>
      <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'1.5rem' }}>Analytics & Insights</h1>

      {/* Monthly Trend */}
      <div style={card}>
        <h2 style={{ fontSize:'1rem', fontWeight:600, marginBottom:'1rem' }}>Income vs Expenses (6 Months)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize:11 }} />
            <YAxis tick={{ fontSize:11 }} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="income" fill="#10B981" name="Income" radius={[4,4,0,0]} />
            <Bar dataKey="expense" fill="#EF4444" name="Expenses" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.25rem' }}>
        {/* Category Breakdown Pie */}
        <div style={{ ...card, marginBottom:0 }}>
          <h2 style={{ fontSize:'1rem', fontWeight:600, marginBottom:'1rem' }}>Category Breakdown</h2>
          {breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={breakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                  {breakdown.map((e,i) => <Cell key={i} fill={CATEGORY_COLORS[e.category]||'#94A3B8'} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign:'center', color:'#94A3B8', padding:'2rem' }}>No data</div>}
        </div>

        {/* Savings Trend */}
        <div style={{ ...card, marginBottom:0 }}>
          <h2 style={{ fontSize:'1rem', fontWeight:600, marginBottom:'1rem' }}>Savings Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize:11 }} />
              <YAxis tick={{ fontSize:11 }} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Line type="monotone" dataKey="savings" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill:'#4F46E5', r:4 }} name="Savings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div style={card}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'1rem' }}>
            <AlertTriangle size={18} color="#F59E0B" />
            <h2 style={{ fontSize:'1rem', fontWeight:600 }}>Anomalous Transactions</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
            {anomalies.slice(0,5).map((a,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem 1rem', background:'#FFFBEB', borderRadius:8, border:'1px solid #FEF3C7' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{a.description||a.category}</div>
                  <div style={{ fontSize:'0.8rem', color:'#92400E' }}>Z-score: {a.zScore} | Avg: {formatCurrency(a.mean)}</div>
                </div>
                <div style={{ fontWeight:700, color:'#EF4444' }}>{formatCurrency(a.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saving Tips */}
      {tips.length > 0 && (
        <div style={card}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'1rem' }}>
            <Lightbulb size={18} color="#4F46E5" />
            <h2 style={{ fontSize:'1rem', fontWeight:600 }}>AI Saving Recommendations</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {tips.map((tip,i) => (
              <div key={i} style={{ padding:'1rem', background:'#EEF2FF', borderRadius:8, borderLeft:'4px solid #4F46E5' }}>
                <div style={{ fontWeight:600, fontSize:'0.875rem', color:'#1E293B', marginBottom:4 }}>{tip.category}</div>
                <div style={{ fontSize:'0.8375rem', color:'#475569', marginBottom:4 }}>{tip.suggestion}</div>
                <div style={{ fontSize:'0.8rem', color:'#4F46E5', fontWeight:600 }}>Potential saving: {formatCurrency(tip.potentialSaving)}/3 months</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
