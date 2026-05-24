'use client';
import { useState, useEffect } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { FiCheck, FiX, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { fetchJson, readJson } from '@/lib/api';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  status: 'Pending' | 'Approved' | 'Disapproved' | 'Inactive';
  photo_url: string | null;
}

const CARD = {
  background: 'rgba(10,20,50,0.72)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '1.25rem',
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  Pending:     { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
  Approved:    { bg: 'rgba(16,185,129,0.15)',  color: '#34d399' },
  Disapproved: { bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
  Inactive:    { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' },
};

export default function StaffCustomersPage() {
  const { user, loading: authLoading } = useRequireRole('staff');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchJson('/api/staff/customers.php');
      if (data.success) setCustomers(data.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchCustomers(); }, [user]);

  const handleAction = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/staff/customers.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await readJson(res);
      if (data.success) fetchCustomers();
    } catch { alert('Action failed'); }
  };

  if (authLoading) return null;

  const pending    = customers.filter(c => c.status === 'Pending');
  const approved   = customers.filter(c => c.status === 'Approved');
  const others     = customers.filter(c => c.status === 'Disapproved' || c.status === 'Inactive');

  const CustomerCard = ({ c }: { c: Customer }) => {
    const st = statusStyle[c.status] ?? statusStyle.Inactive;
    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 border-b border-white/5 last:border-0 gap-3">
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            {c.photo_url
              ? <img src={c.photo_url} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center font-black text-sm text-white/40">
                  {c.first_name?.[0]?.toUpperCase()}
                </div>
            }
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-white text-sm">{c.first_name} {c.last_name}</p>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
                style={{ background: st.bg, color: st.color }}>
                {c.status.toUpperCase()}
              </span>
            </div>
            <p className="text-white/40 text-xs truncate mt-0.5">{c.email}</p>
            <p className="text-white/30 text-xs truncate">{c.contact_number || 'No contact'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto sm:shrink-0">
          {c.status === 'Pending' && (
            <>
              <button onClick={() => handleAction(c.id, 'Approved')}
                className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 min-w-0"
                style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
                <FiCheck size={12} /> Approve
              </button>
              <button onClick={() => handleAction(c.id, 'Disapproved')}
                className="flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 min-w-0"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                <FiX size={12} /> Reject
              </button>
            </>
          )}
          {c.status === 'Approved' && (
            <button onClick={() => handleAction(c.id, 'Inactive')}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 min-w-0"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
              <FiX size={12} /> Deactivate
            </button>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ title, rows, emptyMsg }: { title: string; rows: Customer[]; emptyMsg: string }) => (
    <div style={CARD} className="overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3">
        <h3 className="font-black text-white/60 text-[11px] sm:text-xs uppercase tracking-widest truncate">{title}</h3>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white/40"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          {rows.length}
        </span>
      </div>
      {rows.length === 0
        ? <p className="text-center text-white/25 py-8 text-sm">{emptyMsg}</p>
        : rows.map(c => <CustomerCard key={c.id} c={c} />)
      }
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 px-3 py-4 sm:px-4 md:p-8 overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-white">Customer Approvals</h1>
          <p className="text-white/40 text-sm mt-0.5 truncate">{user?.shop_name}</p>
        </div>
        <button onClick={fetchCustomers}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-colors w-full min-[420px]:w-auto"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl px-4 sm:px-5 py-4 border border-amber-500/20"
          style={{ background: 'rgba(245,158,11,0.10)' }}>
          <FiUsers className="text-amber-400 shrink-0" size={18} />
          <p className="text-amber-300 font-bold text-sm">
            <span className="text-amber-400">{pending.length}</span> customer(s) waiting for approval
          </p>
        </div>
      )}

      <Section title="⏳ Pending Approval" rows={pending}  emptyMsg="No pending registrations." />
      <Section title="✅ Approved"         rows={approved} emptyMsg="No approved customers." />
      {others.length > 0 && (
        <Section title="🚫 Rejected / Inactive" rows={others} emptyMsg="" />
      )}
    </div>
  );
}
