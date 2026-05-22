'use client';
import { useState, useEffect, useRef } from 'react';
import { FiBell } from 'react-icons/fi';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SuperAdminNotifications() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Fetch pending applications on mount
    fetch('/api/super_admin/owner_requests.php?status=pending')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequests(data.data || []);
        }
      })
      .catch(console.error);

    // Close on outside click
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="fixed top-3 right-3 z-50 md:top-6 md:right-8" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg"
        style={{ background: 'rgba(10,20,50,0.82)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
        aria-label="Notifications"
      >
        <FiBell size={18} className="text-white/80" />
        {requests.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a1020] text-[9px] font-black text-white flex items-center justify-center animate-pulse">
            {requests.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl overflow-hidden animate-slideup" 
             style={{ background: 'rgba(10,20,50,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Notifications</h3>
            <span className="text-[10px] font-black uppercase text-white/50">{requests.length} pending</span>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {requests.length === 0 ? (
              <div className="p-8 text-center text-sm font-medium text-white/40">No new notifications</div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                  <p className="text-xs text-white/70 leading-relaxed">
                    <span className="font-bold text-white">{req.owner_name}</span> submitted a B2B partnership request for <span className="text-cyan-400 font-medium">{req.shop_name}</span>.
                  </p>
                  <div className="mt-3 text-right">
                    <Link href="/super-admin/applications" className="text-[10px] font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300">
                      Review Application &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
          {requests.length > 0 && (
             <Link href="/super-admin/applications" className="block w-full p-3 text-center text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-colors">
               View All Applications
             </Link>
          )}
        </div>
      )}
    </div>
  );
}
