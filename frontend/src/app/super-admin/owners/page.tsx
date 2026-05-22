'use client';
import { useEffect, useState } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { FiRefreshCw, FiCopy, FiCheck, FiX, FiMail, FiShield } from 'react-icons/fi';

interface Owner { id:string; first_name:string; last_name:string; email:string; status:string; shop_name:string; }

const CARD = { background:'rgba(10,20,50,0.72)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:'1.25rem' };

export default function OwnersManagement() {
  const { user, loading: authLoading } = useRequireRole('super_admin');
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string|null>(null);

  // Password view & reset states
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [resetting, setResetting] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ temp_password: string; email: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const fetchOwners = async () => { setLoading(true); try { const res=await fetch('/api/super_admin/owners.php'); const d=await res.json(); if(d.success) setOwners(d.data); } catch{} finally{setLoading(false);} };
  useEffect(() => { if(user) fetchOwners(); }, [user]);

  const toggleStatus = async (id:string, current:string) => {
    setUpdating(id);
    const next=current==='active'?'inactive':'active';
    try { const res=await fetch('/api/super_admin/owners.php',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:next})}); const d=await res.json(); if(d.success) fetchOwners(); else alert(d.message); } catch{alert('Update failed');} finally{setUpdating(null);}
  };

  const handleResetPassword = async (id: string) => {
    if (!confirm("Are you sure you want to reset this owner's password to a new complex 8-character password?")) return;
    setResetting(true);
    try {
      const res = await fetch('/api/super_admin/owners.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reset_password' }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCredentials({
          email: data.email,
          temp_password: data.temp_password
        });
      } else {
        alert(data.message || 'Failed to reset password.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setResetting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">Shop Owners</h1>
          <p className="text-white/40 text-sm mt-0.5">All business owners on the platform</p>
        </div>
        <button onClick={fetchOwners} className="p-2.5 rounded-xl text-white/50 hover:text-white transition-colors" style={{background:'rgba(255,255,255,0.08)'}}><FiRefreshCw size={14} className={loading?'animate-spin':''}/></button>
      </div>

      <div style={CARD} className="overflow-hidden">
        {loading ? <p className="text-center text-white/30 py-10 text-sm">Loading...</p>
        : owners.length===0 ? <p className="text-center text-white/25 py-10 text-sm">No owners found.</p>
        : <div className="divide-y divide-white/5">
            {owners.map(o => (
              <div key={o.id} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/5 transition-all">
                <div onClick={() => setSelectedOwner(o)} className="min-w-0 flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm hover:underline">{o.first_name} {o.last_name}</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0" style={{background:o.status==='active'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)',color:o.status==='active'?'#34d399':'#f87171'}}>{o.status.toUpperCase()}</span>
                  </div>
                  <p className="text-white/40 text-xs truncate mt-0.5">{o.email}</p>
                  <p className="text-cyan-400/60 text-xs font-semibold mt-0.5">{o.shop_name||'No Shop'}</p>
                </div>
                <button onClick={()=>toggleStatus(o.id,o.status)} disabled={updating===o.id} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 disabled:opacity-50" style={{background:o.status==='active'?'rgba(239,68,68,0.15)':'rgba(16,185,129,0.15)',color:o.status==='active'?'#f87171':'#34d399'}}>
                  {updating===o.id?'...':(o.status==='active'?'Suspend':'Activate')}
                </button>
              </div>
            ))}
          </div>}
      </div>

      {/* Owner Detail & Password View Modal */}
      {selectedOwner && (
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
                setSelectedOwner(null);
                setNewCredentials(null);
                setCopiedPass(false);
              }}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <FiX size={20} />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <FiShield size={24} />
              </div>
              <h2 className="text-xl font-black tracking-wide text-white">Owner Password Manager</h2>
              <p className="text-white/40 text-xs">
                Account: <span className="text-white/80 font-bold">{selectedOwner.first_name} {selectedOwner.last_name}</span>
              </p>
            </div>

            {newCredentials ? (
              // Display New Password after Reset
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-center space-y-1">
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-wider">New Password Generated!</p>
                  <p className="text-[11px] text-white/60">
                    The password has been updated in the database. Please copy and manually send it to the owner.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-cyan-400">New Password <span className="text-white/40">(8 chars with Uppercase, Lowercase, Number & Special Char)</span></label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-sm font-mono tracking-wider select-all flex-1 text-white/95 font-bold">
                      {newCredentials.temp_password}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newCredentials.temp_password);
                        setCopiedPass(true);
                        setTimeout(() => setCopiedPass(false), 2000);
                      }}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all text-xs font-black flex items-center gap-1 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                    >
                      <FiCopy size={14} />
                      {copiedPass ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setNewCredentials(null);
                      setCopiedPass(false);
                    }}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black tracking-wider uppercase transition-all"
                  >
                    Go Back
                  </button>
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(newCredentials.email)}&su=${encodeURIComponent('WashWise Owner Account - Password Updated')}&body=${encodeURIComponent(
                      `Dear Owner,\n\nYour WashWise account password has been updated by the network administration.\n\nHere are your new temporary credentials:\n\n  Registered Email:   ${newCredentials.email}\n  New Password:       ${newCredentials.temp_password}\n\nSECURITY NOTICE: Please log in using these new credentials and update your password immediately inside your Account Settings.\n\nBest regards,\nThe WashWise Administration Team`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-xs font-black tracking-wider uppercase text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    Send Gmail
                  </a>
                </div>
              </div>
            ) : (
              // Display Default Password Info
              <div className="space-y-4">
                <div className="space-y-1 bg-white/5 border border-white/10 rounded-xl p-3 text-xs space-y-2">
                  <p className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-white/40">Email:</span>
                    <span className="text-white/90 font-mono font-medium">{selectedOwner.email}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-white/40">Shop Branch:</span>
                    <span className="text-cyan-400 font-bold">{selectedOwner.shop_name || 'No Shop'}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Default Seed Password</label>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                    <span className="text-sm font-mono tracking-wider select-all flex-1 text-white/80 font-bold">
                      Admin@123
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('Admin@123');
                        setCopiedPass(true);
                        setTimeout(() => setCopiedPass(false), 2000);
                      }}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all text-xs font-black flex items-center gap-1 hover:bg-cyan-500/10 hover:border-cyan-500/30"
                    >
                      <FiCopy size={14} />
                      {copiedPass ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => handleResetPassword(selectedOwner.id)}
                    disabled={resetting}
                    className="w-full py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-black tracking-wider uppercase transition-all"
                  >
                    {resetting ? 'Resetting...' : 'Reset to a New Complex Password'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOwner(null);
                      setCopiedPass(false);
                    }}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black tracking-wider uppercase transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
