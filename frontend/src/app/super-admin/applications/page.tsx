'use client';
import { useEffect, useState } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { FiRefreshCw, FiCheck, FiX, FiClock, FiMail, FiPhone, FiCalendar, FiCopy } from 'react-icons/fi';

interface OwnerRequest {
  id: number;
  owner_name: string;
  email: string;
  phone: string;
  shop_name: string;
  shop_description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const CARD = {
  background: 'rgba(10,20,50,0.72)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '1.25rem',
};

const STATUS_TABS = ['pending', 'approved', 'rejected', 'all'] as const;

export default function OwnerApplicationsPage() {
  const { user, loading: authLoading } = useRequireRole('super_admin');
  const [requests, setRequests] = useState<OwnerRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState<number | null>(null);
  const [tab, setTab]           = useState<typeof STATUS_TABS[number]>('pending');
  
  // Approved credentials modal states
  const [approvedCreds, setApprovedCreds] = useState<{ email: string; temp_password: string } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const fetchRequests = async (status = tab) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/super_admin/owner_requests.php?status=${status}`);
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchRequests(tab); }, [user, tab]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    if (!confirm(action === 'approve' ? 'Approve this request and generate credentials?' : 'Reject this request?')) return;
    setActing(id);
    try {
      const res  = await fetch('/api/super_admin/owner_requests.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === 'approve' && data.temp_password) {
          setApprovedCreds({
            email: data.email,
            temp_password: data.temp_password
          });
        }
        fetchRequests(tab);
      } else {
        alert(data.message || 'Action failed.');
      }
    } catch { alert('Network error.'); }
    finally { setActing(null); }
  };

  if (authLoading || !user) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">Owner Applications</h1>
          <p className="text-white/40 text-sm mt-0.5">Review and approve incoming B2B partnership requests</p>
        </div>
        <button
          onClick={() => fetchRequests(tab)}
          className="p-2.5 rounded-xl text-white/50 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-xs font-black capitalize transition-all"
            style={{
              background: tab === t ? 'rgba(14,165,233,0.2)'       : 'rgba(255,255,255,0.06)',
              color:      tab === t ? '#38bdf8'                     : 'rgba(255,255,255,0.4)',
              border:     tab === t ? '1px solid rgba(14,165,233,0.4)' : '1px solid transparent',
            }}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-white/30 py-16 text-sm">Loading...</p>
      ) : requests.length === 0 ? (
        <div style={CARD} className="py-16 text-center">
          <FiClock size={32} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/25 text-sm">No {tab === 'all' ? '' : tab} applications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} style={CARD} className="p-5">
              <div className="flex flex-wrap justify-between items-start gap-4">

                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-white text-base">{r.owner_name}</p>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 capitalize"
                      style={{
                        background: r.status === 'approved' ? 'rgba(16,185,129,0.15)' : r.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                        color:      r.status === 'approved' ? '#34d399'               : r.status === 'rejected' ? '#f87171'               : '#fbbf24',
                      }}
                    >
                      {r.status}
                    </span>
                  </div>

                  <p className="text-cyan-400 font-bold text-sm">{r.shop_name}</p>

                  {r.shop_description && (
                    <p className="text-white/40 text-xs leading-relaxed">{r.shop_description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 pt-1">
                    <span className="flex items-center gap-1.5 text-white/40 text-xs"><FiMail size={11} />{r.email}</span>
                    <span className="flex items-center gap-1.5 text-white/40 text-xs"><FiPhone size={11} />{r.phone}</span>
                    <span className="flex items-center gap-1.5 text-white/40 text-xs"><FiCalendar size={11} />{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {r.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAction(r.id, 'approve')}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-105 disabled:opacity-50"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
                    >
                      <FiCheck size={12} />{acting === r.id ? '...' : 'Approve & Send'}
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'reject')}
                      disabled={acting === r.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all hover:scale-105 disabled:opacity-50"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      <FiX size={12} />Reject
                    </button>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approved Credentials Modal */}
      {approvedCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            style={{
              background: 'rgba(10, 20, 50, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              borderRadius: '1.5rem',
            }}
            className="w-full max-w-md p-6 relative shadow-2xl text-white space-y-6 animate-scaleUp"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setApprovedCreds(null);
                setCopiedEmail(false);
                setCopiedPassword(false);
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <FiX size={20} />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FiCheck size={24} />
              </div>
              <h2 className="text-xl font-black tracking-wide text-white">Application Approved!</h2>
              <p className="text-white/50 text-xs">
                Since local email delivery may be offline, please copy and manually email these credentials to the owner.
              </p>
            </div>

            {/* Credentials Fields */}
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Registered Email</label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-sm font-medium select-all break-all flex-1 text-white/90">
                    {approvedCreds.email}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(approvedCreds.email);
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    }}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all text-xs font-black flex items-center gap-1 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                  >
                    <FiCopy size={14} />
                    {copiedEmail ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  Temporary Password <span className="text-white/40">(8 characters)</span>
                </label>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-sm font-mono tracking-wider select-all flex-1 text-white/95 font-bold">
                    {approvedCreds.temp_password}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(approvedCreds.temp_password);
                      setCopiedPassword(true);
                      setTimeout(() => setCopiedPassword(false), 2000);
                    }}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all text-xs font-black flex items-center gap-1 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                  >
                    <FiCopy size={14} />
                    {copiedPassword ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setApprovedCreds(null);
                  setCopiedEmail(false);
                  setCopiedPassword(false);
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black tracking-wider uppercase transition-all"
              >
                Close Window
              </button>
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(approvedCreds.email)}&su=${encodeURIComponent('Welcome to WashWise! Your Owner Account is Approved')}&body=${encodeURIComponent(
                  `Dear Owner,\n\nFantastic news! Your application to partner with WashWise has been approved.\n\nYour centralized shop management dashboard is now ready. Log in using the credentials below to begin:\n\n  Portal Link:        http://localhost:3000/login\n  Registered Email:   ${approvedCreds.email}\n  Temporary Password: ${approvedCreds.temp_password}\n\nSECURITY NOTICE: Please update this temporary password immediately within your Account Settings upon your very first login.\n\nBest regards,\nThe WashWise Administration Team`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-black tracking-wider uppercase text-center transition-all flex items-center justify-center gap-1.5"
              >
                Open Gmail
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
