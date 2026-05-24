'use client';
import { useEffect, useState } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { FiAlertTriangle, FiBriefcase, FiClock, FiCreditCard, FiDollarSign, FiShoppingBag, FiUsers } from 'react-icons/fi';
import Link from 'next/link';

const CARD = { background:'rgba(10,20,50,0.72)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'1.25rem' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function SuperAdminDashboard() {
  const { user, loading: authLoading } = useRequireRole('super_admin');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch('/api/super_admin/stats.php', { credentials: 'include' })
        .then(r => r.json())
        .then(res => { if (res.success) setStats(res.data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) return null;

  const cards = [
    { label:'Order Revenue',       value:`₱${(stats?.total_revenue||0).toLocaleString('en-PH',{minimumFractionDigits:2})}`, icon:FiDollarSign, accent:'#10b981' },
    { label:'Subscription Income', value:`₱${(stats?.subscription_revenue||0).toLocaleString('en-PH',{minimumFractionDigits:2})}`, icon:FiCreditCard, accent:'#00aeef' },
    { label:'Total Shops',         value:stats?.total_shops||0, icon:FiShoppingBag, accent:'#38bdf8' },
    { label:'Active Owners',       value:stats?.total_owners||0, icon:FiUsers, accent:'#11c735' },
    { label:'Pending Subs',        value:stats?.subscription_pending_count||0, icon:FiClock, accent:'#f59e0b' },
    { label:'Overdue Shops',       value:stats?.subscription_overdue_shops||0, icon:FiAlertTriangle, accent:'#f43f5e' },
    { label:'Total Staff',         value:stats?.total_staff||0, icon:FiBriefcase, accent:'#8e66ff' },
    { label:'Total Customers',     value:stats?.total_customers||0, icon:FiUsers, accent:'#6366f1' },
  ];

  const year = new Date().getFullYear();
  const monthly = MONTHS.map((label, index) => {
    const row = (stats?.subscription_monthly || []).find((m: any) => Number(m.year) === year && Number(m.month) === index + 1);
    return { label, total: Number(row?.total || 0) };
  });
  const maxMonthly = Math.max(...monthly.map(m => m.total), 1);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white">Platform Overview</h1>
        <p className="text-white/40 text-sm mt-0.5">Welcome back, {user.user_name}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {cards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="p-4 hover:-translate-y-0.5 transition-transform" style={CARD}>
            <div className="p-2.5 rounded-xl inline-flex mb-3" style={{ background:`${accent}22`, color:accent }}><Icon size={16} /></div>
            {loading ? <div className="h-6 w-16 rounded animate-pulse" style={{ background:'rgba(255,255,255,0.08)' }} />
              : <p className="text-lg font-black text-white">{value}</p>}
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-5" style={CARD}>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-black text-white text-sm">Monthly Subscription Income</h3>
              <p className="text-[10px] text-white/30 mt-0.5">Owner payments approved by super admin · {year}</p>
            </div>
            <Link href="/super-admin/subscriptions" className="text-xs font-black text-cyan-300 hover:text-white">Review</Link>
          </div>
          <div className="h-44 flex items-end gap-2">
            {monthly.map(m => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                <div className="w-full rounded-t-lg transition-all" style={{ height:`${Math.max((m.total/maxMonthly)*150, m.total > 0 ? 8 : 3)}px`, background:m.total ? 'linear-gradient(180deg,#00aeef,#8e66ff)' : 'rgba(255,255,255,0.08)' }} />
                <span className="text-[10px] font-black text-white/40 uppercase">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5" style={CARD}>
          <h3 className="font-black text-white text-sm mb-4">Subscription Controls</h3>
          <div className="space-y-3">
            <div className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-bold text-white/35 uppercase">Pending Amount</p>
              <p className="text-xl font-black text-white mt-1">₱{(stats?.subscription_pending||0).toLocaleString('en-PH',{minimumFractionDigits:2})}</p>
            </div>
            <Link href="/super-admin/subscriptions">
              <div className="rounded-2xl p-4 text-center font-black text-sm text-white cursor-pointer" style={{ background:'linear-gradient(90deg,#00aeef,#6366f1,#8e66ff)' }}>
                Open Payment Reviews
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          { label:'Manage Shops', href:'/super-admin/shops', accent:'#000000' },
          { label:'Manage Owners', href:'/super-admin/owners', accent:'#020008' },
          { label:'Subscriptions', href:'/super-admin/subscriptions', accent:'#030712' },
          { label:'Manage Admins', href:'/super-admin/admins', accent:'#000000' },
        ].map(({ label, href, accent }) => (
          <Link key={href} href={href}>
            <div className="p-4 rounded-2xl text-center font-black text-sm cursor-pointer hover:scale-[1.02] transition-all"
              style={{ background:`${accent}18`, border:`1px solid ${accent}33`, color:accent }}>
              {label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
