'use client';
import { useEffect, useState } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { fetchJson, readJson } from '@/lib/api';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiCreditCard, FiRefreshCw, FiSend } from 'react-icons/fi';

const CARD = { background:'rgba(10,20,50,0.72)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'1.25rem' };

export default function OwnerSubscriptionPage() {
  const { user, loading: authLoading } = useRequireRole('owner');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ payment_method: 'GCash', reference_number: '', proof_url: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchJson('/api/owner/subscription.php');
      if (res.success) setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const subscription = data?.subscription || {};
  const payments = data?.payments || [];
  const amount = Number(subscription.subscription_monthly_fee || 999);
  const dueDate = subscription.subscription_due_date ? new Date(subscription.subscription_due_date) : null;
  const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / 86400000) : 0;
  const overdue = subscription.subscription_status === 'overdue' || daysLeft < 0;
  const pending = subscription.subscription_status === 'pending_review';

  const submit = async () => {
    if (!form.reference_number.trim()) return alert('Reference number is required.');
    setSaving(true);
    try {
      const response = await fetch('/api/owner/subscription.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount }),
      });
      const res = await readJson(response);
      if (res.success) {
        setForm({ payment_method: 'GCash', reference_number: '', proof_url: '' });
        await load();
        alert('Payment submitted for super admin review.');
      } else alert(res.message || 'Submission failed.');
    } catch {
      alert('Submission failed.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-3 py-4 sm:px-4 md:p-8 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">Monthly Subscription</h1>
          <p className="text-white/40 text-sm mt-0.5">{user?.shop_name}</p>
        </div>
        <button onClick={load} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white w-full sm:w-auto" style={{ background:'rgba(255,255,255,0.08)' }}>
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 md:col-span-2" style={CARD}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-white/35 uppercase tracking-widest">Current Status</p>
              <h2 className="text-2xl font-black text-white mt-1 capitalize">{subscription.subscription_status || 'active'}</h2>
              <p className="text-sm text-white/40 mt-1">
                Due date: <span className="text-white/70 font-bold">{subscription.subscription_due_date || 'Not set'}</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl" style={{ background: overdue ? 'rgba(239,68,68,0.15)' : pending ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: overdue ? '#f87171' : pending ? '#fbbf24' : '#34d399' }}>
              {overdue ? <FiAlertTriangle size={24} /> : pending ? <FiClock size={24} /> : <FiCheckCircle size={24} />}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-white/35 font-bold uppercase">Monthly Fee</p>
              <p className="font-black text-white text-xl mt-1">₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-white/35 font-bold uppercase">Days Left</p>
              <p className={`font-black text-xl mt-1 ${overdue ? 'text-red-300' : 'text-white'}`}>{overdue ? `${Math.abs(daysLeft)} overdue` : daysLeft}</p>
            </div>
          </div>
        </div>

        <div className="p-5" style={CARD}>
          <h3 className="font-black text-white text-sm mb-4 flex items-center gap-2"><FiCreditCard /> Submit Payment</h3>
          <div className="space-y-3">
            <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className="w-full rounded-xl px-3 py-2.5 bg-white/10 text-white text-sm outline-none">
              <option className="text-black">GCash</option>
              <option className="text-black">Maya</option>
              <option className="text-black">Bank Transfer</option>
              <option className="text-black">Cash</option>
            </select>
            <input value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} placeholder="Reference number" className="w-full rounded-xl px-3 py-2.5 bg-white/10 text-white placeholder:text-white/30 text-sm outline-none" />
            <input value={form.proof_url} onChange={e => setForm(f => ({ ...f, proof_url: e.target.value }))} placeholder="Proof URL (optional)" className="w-full rounded-xl px-3 py-2.5 bg-white/10 text-white placeholder:text-white/30 text-sm outline-none" />
            <button onClick={submit} disabled={saving} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-black text-sm text-white disabled:opacity-50" style={{ background:'linear-gradient(90deg,#00aeef,#6366f1,#8e66ff)' }}>
              <FiSend size={14} /> {saving ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-5" style={CARD}>
        <h3 className="font-black text-white text-sm mb-4">Payment History</h3>
        <div className="space-y-2">
          {payments.length === 0 ? <p className="text-white/30 text-sm text-center py-8">No subscription payments yet.</p> : payments.map((p: any) => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl p-3" style={{ background:'rgba(255,255,255,0.05)' }}>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm">₱{Number(p.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })} · {p.payment_method}</p>
                <p className="text-xs text-white/35 truncate">Ref: {p.reference_number} · {new Date(p.submitted_at).toLocaleString()}</p>
              </div>
              <span className="text-[10px] font-black px-2 py-1 rounded-full self-start sm:self-auto" style={{ background: p.status === 'Approved' ? 'rgba(16,185,129,0.15)' : p.status === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: p.status === 'Approved' ? '#34d399' : p.status === 'Rejected' ? '#f87171' : '#fbbf24' }}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
