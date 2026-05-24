'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { fetchJson, readJson } from '@/lib/api';
import { FiCheck, FiRefreshCw, FiSearch, FiSlash, FiUserCheck, FiUsers, FiX } from 'react-icons/fi';

interface Customer {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  contact_number: string;
  address?: string;
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

const statusStyle: Record<Customer['status'], { bg: string; color: string }> = {
  Pending: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  Approved: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  Disapproved: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  Inactive: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.42)' },
};

const tabs = ['all', 'Pending', 'Approved', 'Inactive'] as const;

export default function OwnerCustomersPage() {
  const { user, loading: authLoading } = useRequireRole('owner');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<(typeof tabs)[number]>('all');
  const [acting, setActing] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetchJson('/api/owner/customers.php');
      if (res.success) setCustomers(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchCustomers(); }, [user]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter(c => {
      const inTab = tab === 'all' || c.status === tab;
      const haystack = `${c.first_name} ${c.middle_name || ''} ${c.last_name} ${c.email} ${c.contact_number || ''}`.toLowerCase();
      return inTab && (!needle || haystack.includes(needle));
    });
  }, [customers, query, tab]);

  const counts = useMemo(() => ({
    all: customers.length,
    Pending: customers.filter(c => c.status === 'Pending').length,
    Approved: customers.filter(c => c.status === 'Approved').length,
    Inactive: customers.filter(c => c.status === 'Inactive').length,
  }), [customers]);

  const updateStatus = async (id: string, status: Customer['status']) => {
    setActing(id);
    try {
      const response = await fetch('/api/owner/customers.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await readJson(response);
      if (data.success) fetchCustomers();
      else alert(data.message || 'Update failed');
    } catch {
      alert('Action failed');
    } finally {
      setActing(null);
    }
  };

  if (authLoading) return null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 px-3 py-4 sm:px-4 md:p-8 overflow-x-hidden">
      <div className="flex flex-col min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-white">Customers</h1>
          <p className="text-white/40 text-sm mt-0.5 truncate">{user?.shop_name}</p>
        </div>
        <button onClick={fetchCustomers}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white transition-colors w-full min-[520px]:w-auto"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'All Customers', value: counts.all, icon: FiUsers, accent: '#00aeef' },
          { label: 'Pending', value: counts.Pending, icon: FiUserCheck, accent: '#f59e0b' },
          { label: 'Approved', value: counts.Approved, icon: FiCheck, accent: '#10b981' },
          { label: 'Inactive', value: counts.Inactive, icon: FiSlash, accent: '#f87171' },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="p-4" style={CARD}>
            <div className="p-2 rounded-xl inline-flex mb-3" style={{ background: `${accent}22`, color: accent }}>
              <Icon size={15} />
            </div>
            <p className="text-xl font-black text-white">{value}</p>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div style={CARD} className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl flex-1"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <FiSearch size={15} className="text-white/35 shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search customers"
              className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 w-full"
            />
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-xl p-1 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-2 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase transition-all"
                style={tab === t ? { background: 'linear-gradient(90deg,#00aeef,#8e66ff)', color: '#fff' } : { color: 'rgba(255,255,255,0.42)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <p className="text-center text-white/30 py-10 text-sm">Loading customers...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-white/30 py-10 text-sm">No customers found.</p>
          ) : filtered.map(c => {
            const st = statusStyle[c.status];
            return (
              <div key={c.id} className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/10 bg-white/8">
                    {c.photo_url
                      ? <img src={c.photo_url} alt="avatar" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/45 font-black">{c.first_name?.[0]?.toUpperCase()}</div>}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-sm text-white truncate">{c.first_name} {c.last_name}</p>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">{c.email}</p>
                    <p className="text-xs text-white/28 truncate">{c.contact_number || 'No contact'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex gap-2 lg:shrink-0">
                  {c.status === 'Pending' && (
                    <>
                      <button disabled={acting === c.id} onClick={() => updateStatus(c.id, 'Approved')}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-black disabled:opacity-50"
                        style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
                        <FiCheck size={12} /> Approve
                      </button>
                      <button disabled={acting === c.id} onClick={() => updateStatus(c.id, 'Disapproved')}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-black disabled:opacity-50"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                        <FiX size={12} /> Reject
                      </button>
                    </>
                  )}
                  {c.status === 'Approved' && (
                    <button disabled={acting === c.id} onClick={() => updateStatus(c.id, 'Inactive')}
                      className="col-span-2 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-black disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                      <FiSlash size={12} /> Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
