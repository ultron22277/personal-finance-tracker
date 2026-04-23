import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ArrowLeftRight, Target, PieChart, Bell,
  User, LogOut, Menu, X, TrendingUp, Wallet
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budgets', icon: Wallet, label: 'Budgets' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/analytics', icon: TrendingUp, label: 'Analytics' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const styles = {
  layout: { display:'flex', height:'100vh', overflow:'hidden', background:'#F8FAFC' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 },
  sidebar: { width:240, background:'#fff', borderRight:'1px solid #E2E8F0', display:'flex', flexDirection:'column', flexShrink:0, zIndex:50, transition:'transform 0.2s' },
  sidebarHeader: { padding:'1.25rem 1rem', borderBottom:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo: { display:'flex', alignItems:'center', gap:'0.5rem', fontWeight:700, fontSize:'1.125rem', color:'#1E293B' },
  nav: { flex:1, padding:'0.75rem', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' },
  navItem: { display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.5rem 0.75rem', borderRadius:8, fontSize:'0.875rem', fontWeight:500, color:'#64748B', textDecoration:'none', transition:'all 0.15s' },
  navItemActive: { background:'#EEF2FF', color:'#4F46E5' },
  footer: { padding:'1rem', borderTop:'1px solid #E2E8F0' },
  userCard: { display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.5rem', borderRadius:8, marginBottom:'0.5rem' },
  avatar: { width:36, height:36, borderRadius:'50%', background:'#4F46E5', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.875rem', flexShrink:0 },
  userName: { fontWeight:600, fontSize:'0.875rem', color:'#1E293B' },
  userEmail: { fontSize:'0.75rem', color:'#94A3B8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130 },
  logoutBtn: { width:'100%', display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.75rem', borderRadius:8, fontSize:'0.875rem', color:'#EF4444', cursor:'pointer', background:'none', border:'none', fontFamily:'inherit', fontWeight:500 },
  mainWrapper: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar: { background:'#fff', borderBottom:'1px solid #E2E8F0', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  menuBtn: { background:'none', border:'none', cursor:'pointer', display:'none', padding:4 },
  mainContent: { flex:1, overflowY:'auto', padding:'1.5rem' },
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div style={styles.layout}>
      {sidebarOpen && <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      <aside style={{ ...styles.sidebar, ...(window.innerWidth < 768 && !sidebarOpen ? { position:'fixed', top:0, left:0, height:'100%', transform:'translateX(-100%)' } : window.innerWidth < 768 ? { position:'fixed', top:0, left:0, height:'100%' } : {}) }}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}><PieChart size={22} color="#4F46E5" /><span>FinanceAI</span></div>
          <button onClick={() => setSidebarOpen(false)} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={18} /></button>
        </div>

        <nav style={styles.nav}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) })}>
              <Icon size={17} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.footer}>
          <div style={styles.userCard}>
            <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
            <div><div style={styles.userName}>{user?.name}</div><div style={styles.userEmail}>{user?.email}</div></div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}><LogOut size={15} /><span>Logout</span></button>
        </div>
      </aside>

      <div style={styles.mainWrapper}>
        <header style={styles.topbar}>
          <button style={{ background:'none', border:'none', cursor:'pointer', padding:4 }} onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
          <span style={{ fontSize:'0.875rem', color:'#64748B' }}>Welcome back, <strong>{user?.name?.split(' ')[0]}</strong></span>
        </header>
        <main style={styles.mainContent}><Outlet /></main>
      </div>
    </div>
  );
}
