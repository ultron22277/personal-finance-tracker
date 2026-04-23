import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Trash2, CheckCheck } from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const typeColor = { budget_alert:'#FEF3C7', anomaly_warning:'#FEE2E2', goal_milestone:'#D1FAE5', goal_complete:'#DBEAFE', info:'#F1F5F9' };
const typeBorder = { budget_alert:'#F59E0B', anomaly_warning:'#EF4444', goal_milestone:'#10B981', goal_complete:'#3B82F6', info:'#94A3B8' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = () => api.get('/notifications').then(r => { setNotifications(r.data.notifications); setUnread(r.data.unreadCount); }).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(() => { fetch(); }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(p => p.map(n => n._id===id?{...n,isRead:true}:n));
    setUnread(u => Math.max(u-1,0));
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(p => p.map(n => ({...n,isRead:true})));
    setUnread(0);
    toast.success('All marked as read');
  };

  const del = async (id) => {
    await api.delete(`/notifications/${id}`);
    setNotifications(p => p.filter(n => n._id!==id));
    toast.success('Deleted');
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <div><h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>Notifications</h1>
          {unread>0 && <p style={{ fontSize:'0.875rem', color:'#64748B', marginTop:2 }}>{unread} unread</p>}
        </div>
        {unread>0 && <button onClick={markAll} style={{ display:'flex', alignItems:'center', gap:6, padding:'0.55rem 1rem', border:'1.5px solid #E2E8F0', borderRadius:8, cursor:'pointer', fontSize:'0.875rem', fontWeight:500, background:'#fff', fontFamily:'inherit' }}><CheckCheck size={15}/> Mark all read</button>}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'3rem', color:'#64748B' }}>Loading...</div>
       : notifications.length===0 ? (
        <div style={{ textAlign:'center', padding:'4rem', background:'#fff', borderRadius:12, color:'#94A3B8' }}>
          <BellOff size={48} style={{ margin:'0 auto 1rem', display:'block', opacity:0.35 }}/>
          <p>No notifications yet</p>
        </div>
       ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
          {notifications.map(n => (
            <div key={n._id} style={{ background: n.isRead?'#fff':typeColor[n.type]||'#F8FAFC', borderRadius:12, padding:'1rem 1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', borderLeft:`4px solid ${n.isRead?'#E2E8F0':typeBorder[n.type]||'#94A3B8'}`, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem' }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:4 }}>
                  {!n.isRead && <div style={{ width:8, height:8, borderRadius:'50%', background:typeBorder[n.type]||'#4F46E5', flexShrink:0 }}/>}
                  <div style={{ fontWeight: n.isRead?500:700, fontSize:'0.9rem', color:'#1E293B' }}>{n.title}</div>
                </div>
                <div style={{ fontSize:'0.8375rem', color:'#475569', marginBottom:4 }}>{n.message}</div>
                <div style={{ fontSize:'0.75rem', color:'#94A3B8' }}>{formatDate(n.createdAt)}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {!n.isRead && <button onClick={() => markRead(n._id)} title="Mark read" style={{ background:'none', border:'none', cursor:'pointer', color:'#4F46E5', padding:4 }}><Bell size={15}/></button>}
                <button onClick={() => del(n._id)} title="Delete" style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:4 }}><Trash2 size={15}/></button>
              </div>
            </div>
          ))}
        </div>
       )}
    </div>
  );
}
