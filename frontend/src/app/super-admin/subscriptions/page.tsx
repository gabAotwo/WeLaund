'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { fetchJson, readJson } from '@/lib/api';
import { FiAlertTriangle, FiCheck, FiClock, FiCreditCard, FiRefreshCw, FiSave, FiX } from 'react-icons/fi';

const CARD = { background:'rgba(10,20,50,0.72)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'1.25rem' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function SuperAdminSubscriptionsPage() {
  const { user, loading: authLoading } = useRequireRole('super_admin');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [savingBilling, setSavingBilling] = useState<string | null>(null);
  const [billingDrafts, setBillingDrafts] = useState<Record<string, any>>({});

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
  const shops = data?.shops || [];
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

  const draftFor = (shop: any) => billingDrafts[shop.shop_id] || {
    subscription_monthly_fee: shop.subscription_monthly_fee,
    subscription_due_date: shop.subscription_due_date || '',
    subscription_status: shop.subscription_status || 'active',
    note: shop.subscription_note || '',
  };

  const setDraft = (shop: any, patch: Record<string, any>) => {
    setBillingDrafts(prev => ({ ...prev, [shop.shop_id]: { ...draftFor(shop), ...patch } }));
  };

  const saveBilling = async (shop: any) => {
    const draft = draftFor(shop);
    setSavingBilling(shop.shop_id);
    try {
      const response = await fetch('/api/super_admin/subscriptions.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_billing',
          shop_id: shop.shop_id,
          subscription_monthly_fee: Number(draft.subscription_monthly_fee),
          subscription_due_date: draft.subscription_due_date,
          subscription_status: draft.subscription_status,
          note: draft.note,
        }),
      });
      const res = await readJson(response);
      if (res.success) {
        setBillingDrafts(prev => {
          const next = { ...prev };
          delete next[shop.shop_id];
          return next;
        });
        load();
      } else alert(res.message || 'Billing update failed.');
    } catch {
      alert('Billing update failed.');
    } finally {
      setSavingBilling(null);
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
        <div className="mb-4">
          <h3 className="font-black text-white text-sm">Shop Billing Settings</h3>
          <p className="text-xs text-white/35 mt-1">Set each owner's monthly fee, due date, and billing state.</p>
        </div>
        <div className="space-y-3">
          {shops.length === 0 ? <p className="text-center text-white/30 py-10 text-sm">No shops found.</p> : shops.map((shop: any) => {
            const draft = draftFor(shop);
            return (
              <div key={shop.shop_id} className="rounded-2xl p-4 space-y-4" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-white text-sm">{shop.shop_name}</p>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background:shop.subscription_status==='overdue'?'rgba(239,68,68,0.15)':shop.subscription_status==='pending_review'?'rgba(245,158,11,0.15)':'rgba(16,185,129,0.15)', color:shop.subscription_status==='overdue'?'#f87171':shop.subscription_status==='pending_review'?'#fbbf24':'#34d399' }}>{shop.subscription_status || 'active'}</span>
                    </div>
                    <p className="text-xs text-white/40 truncate">{shop.first_name} {shop.last_name} - {shop.email}</p>
                    <p className="text-xs text-white/25">Last paid: {shop.subscription_last_paid_at ? new Date(shop.subscription_last_paid_at).toLocaleDateString() : 'Never'}</p>
                  </div>
                  <button disabled={savingBilling===shop.shop_id} onClick={() => saveBilling(shop)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50 lg:shrink-0" style={{ background:'linear-gradient(90deg,#00aeef,#6366f1,#8e66ff)' }}>
                    <FiSave size={13}/> {savingBilling===shop.shop_id ? 'Saving...' : 'Save Billing'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="space-y-1.5">
                    <span className="text-[10px] text-white/35 font-black uppercase tracking-wide">Monthly Fee</span>
                    <input type="number" min="1" step="0.01" value={draft.subscription_monthly_fee} onChange={e => setDraft(shop, { subscription_monthly_fee: e.target.value })} className="w-full rounded-xl px-3 py-2.5 bg-white/10 text-white placeholder:text-white/30 text-sm outline-none" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] text-white/35 font-black uppercase tracking-wide">Due Date</span>
                    <input type="date" value={draft.subscription_due_date || ''} onChange={e => setDraft(shop, { subscription_due_date: e.target.value })} className="w-full rounded-xl px-3 py-2.5 bg-white/10 text-white text-sm outline-none" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] text-white/35 font-black uppercase tracking-wide">Billing Status</span>
                    <select value={draft.subscription_status} onChange={e => setDraft(shop, { subscription_status: e.target.value })} className="w-full rounded-xl px-3 py-2.5 bg-white/10 text-white text-sm outline-none">
                      <option className="text-black" value="active">Active</option>
                      <option className="text-black" value="pending_review">Pending Review</option>
                      <option className="text-black" value="overdue">Overdue</option>
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] text-white/35 font-black uppercase tracking-wide">Admin Note</span>
                    <input value={draft.note || ''} onChange={e => setDraft(shop, { note: e.target.value })} placeholder="Optional note" className="w-full rounded-xl px-3 py-2.5 bg-white/10 text-white placeholder:text-white/30 text-sm outline-none" />
                  </label>
                </div>
              </div>
            );
          })}
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
