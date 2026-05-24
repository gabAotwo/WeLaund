'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { fetchJson, readJson } from '@/lib/api';
import { FiAlertTriangle, FiCheck, FiClock, FiCreditCard, FiRefreshCw, FiX } from 'react-icons/fi';

const CARD = { background:'rgba(10,20,50,0.72)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'1.25rem' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function SuperAdminSubscriptionsPage() {
  const { user, loading: authLoading } = useRequireRole('super_admin');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchJson('/api/super_admin/subscriptions.php');
      if (res.success) setData(res.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (user) load(); }, [user]);

  const summary = data?.summary || {};
  const payments = data?.payments || [];
  const currentYear = new Date().getFullYear();
  const series = useMemo(() => MONTHS.map((label, i) => {
    const row = (data?.monthly || []).find((m: any) => Number(m.year) === currentYear && Number(m.month) === i + 1);
    return { label, total: Number(row?.total || 0) };
  }), [data, currentYear]);
  const max = Math.max(...series.map(m => m.total), 1);

  const review = async (id: string, status: 'Approved' | 'Rejected') => {
    const note = status === 'Rejected' ? prompt('Reason for rejection?', 'Invalid or unverifiable payment.') || '' : '';
    setActing(id);
    try {
      const response = await fetch('/api/super_admin/subscriptions.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, note }),
      });
      const res = await readJson(response);
      if (res.success) load();
      else alert(res.message || 'Review failed.');
    } catch {
      alert('Review failed.');
    } finally {
      setActing(null);
    }
  };

  if (authLoading) return null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-3 py-4 sm:px-4 md:p-8 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">Owner Subscriptions</h1>
          <p className="text-white/40 text-sm mt-0.5">Review monthly platform payments and overdue shops</p>
        </div>
        <button onClick={load} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white w-full sm:w-auto" style={{ background:'rgba(255,255,255,0.08)' }}>
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Approved Income', value:`₱${Number(summary.approved_total||0).toLocaleString('en-PH',{minimumFractionDigits:2})}`, icon:FiCreditCard, accent:'#10b981' },
          { label:'Pending Amount', value:`₱${Number(summary.pending_total||0).toLocaleString('en-PH',{minimumFractionDigits:2})}`, icon:FiClock, accent:'#f59e0b' },
          { label:'Pending Reviews', value:summary.pending_count||0, icon:FiCheck, accent:'#00aeef' },
          { label:'Overdue Shops', value:summary.overdue_shops||0, icon:FiAlertTriangle, accent:'#f43f5e' },
        ].map(({label,value,icon:Icon,accent}) => (
          <div key={label} className="p-4" style={CARD}>
            <div className="p-2.5 rounded-xl inline-flex mb-3" style={{ background:`${accent}22`, color:accent }}><Icon size={16}/></div>
            <p className="text-lg font-black text-white">{value}</p>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="p-5" style={CARD}>
        <h3 className="font-black text-white text-sm mb-4">Monthly Subscription Income · {currentYear}</h3>
        <div className="h-44 flex items-end gap-2">
          {series.map(m => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
              <div className="w-full rounded-t-lg" style={{ height:`${Math.max((m.total/max)*150, m.total > 0 ? 8 : 3)}px`, background:m.total ? 'linear-gradient(180deg,#00aeef,#8e66ff)' : 'rgba(255,255,255,0.08)' }} />
              <span className="text-[10px] font-black text-white/40 uppercase">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5" style={CARD}>
        <h3 className="font-black text-white text-sm mb-4">Payment Reviews</h3>
        <div className="space-y-3">
          {payments.length === 0 ? <p className="text-center text-white/30 py-10 text-sm">No subscription payments yet.</p> : payments.map((p: any) => (
            <div key={p.id} className="rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-white text-sm">{p.shop_name}</p>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background:p.status==='Approved'?'rgba(16,185,129,0.15)':p.status==='Rejected'?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)', color:p.status==='Approved'?'#34d399':p.status==='Rejected'?'#f87171':'#fbbf24' }}>{p.status}</span>
                </div>
                <p className="text-xs text-white/40 truncate">{p.first_name} {p.last_name} · {p.email}</p>
                <p className="text-xs text-white/30 truncate">₱{Number(p.amount).toLocaleString('en-PH',{minimumFractionDigits:2})} · {p.payment_method} · Ref: {p.reference_number}</p>
                <p className="text-xs text-white/25">Submitted {new Date(p.submitted_at).toLocaleString()}</p>
              </div>
              {p.status === 'Pending' && (
                <div className="grid grid-cols-2 gap-2 lg:shrink-0">
                  <button disabled={acting===p.id} onClick={() => review(p.id, 'Approved')} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-black disabled:opacity-50" style={{ background:'rgba(16,185,129,0.2)', color:'#34d399' }}><FiCheck size={12}/> Approve</button>
                  <button disabled={acting===p.id} onClick={() => review(p.id, 'Rejected')} className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-black disabled:opacity-50" style={{ background:'rgba(239,68,68,0.15)', color:'#f87171' }}><FiX size={12}/> Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
