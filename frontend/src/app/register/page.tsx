'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiMapPin } from 'react-icons/fi';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import AppPhoneShowcase from '@/components/AppPhoneShowcase';

interface Shop { id: string; name: string; }

const inputCls = "w-full pb-2.5 pt-1 text-sm text-[var(--text-color)] placeholder-slate-400/50 bg-transparent outline-none border-b border-slate-300/30 focus:border-cyan-400 transition-colors duration-300";

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="group">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
        <Icon className="text-slate-600 group-focus-within:text-cyan-400 transition-colors" size={11} />
        {label}
      </label>
      <div className="relative">
        {children}
        <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-cyan-400 to-blue-500 group-focus-within:w-full transition-all duration-500" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [shops, setShops]       = useState<Shop[]>([]);
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [form, setForm]         = useState({
    shop_id: '', first_name: '', middle_name: '', last_name: '',
    email: '', password: '', contact_number: '', address: ''
  });

  useEffect(() => {
    fetch('/api/public/register.php').then(r => r.json()).then(res => { if (res.success) setShops(res.data); }).catch(() => {});
  }, []);

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    setError(''); setSuccess('');
    if (!form.shop_id || !form.first_name || !form.last_name || !form.email || !form.password) {
      setError('Please fill in all required fields.'); return;
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/public/register.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        setSuccess('Registration successful! Redirecting to login…');
        setTimeout(() => window.location.href = '/login', 2000);
      } else setError(data.message || 'Registration failed.');
    } catch { setError('Connection error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen welaund-bg flex flex-col transition-colors duration-500">
      <div className="welaund-orb orb-1" /><div className="welaund-orb orb-2" /><div className="welaund-orb orb-3" />

      {/* Navbar */}
      <nav className="relative z-50 py-6 px-6 flex justify-between items-center">
        <Link href="/"><Image src="/logo.png" alt="WashWise" width={140} height={44} style={{ height:'auto' }} className="w-28 lg:w-36" priority /></Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login" className="px-5 py-2 welaund-btn text-xs">Sign In</Link>
        </div>
      </nav>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* ── Left: Description + 3D Phone (desktop) ── */}
          <div className="hidden lg:flex flex-col flex-1 items-center justify-center gap-10" style={{ minHeight:'520px' }}>
            <div className="text-center space-y-4 px-4">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-cyan-400/30 text-cyan-400 bg-cyan-400/8">
                Join WashWise Today
              </span>
              <h2 className="text-3xl font-black tracking-tight leading-tight text-[var(--text-color)]">
                Your Laundry,<br/>
                <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Tracked & Managed.</span>
              </h2>
              <p className="text-sm font-medium text-[var(--text-color)] max-w-xs mx-auto leading-relaxed">
                Create your account, choose your laundry shop, and start requesting orders in minutes. Get notified at every step.
              </p>
              <div className="flex flex-col gap-2 pt-1 text-left max-w-xs mx-auto">
                {[
                  { n:'01', t:'Register & pick your shop' },
                  { n:'02', t:'Request a laundry order' },
                  { n:'03', t:'Track progress in real time' },
                  { n:'04', t:'Pay digitally & pick up' },
                ].map(({ n, t }) => (
                  <div key={n} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                      style={{ background:'linear-gradient(135deg,#00aeef,#6366f1)', color:'#fff' }}>{n}</span>
                    <span className="text-xs font-semibold text-[var(--text-color)]">{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <AppPhoneShowcase />
          </div>

          {/* ── Mobile: Description text above card ── */}
          <div className="lg:hidden w-full text-center space-y-3 px-2">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-cyan-400/30 text-cyan-400 bg-cyan-400/8">
              Join WashWise Today
            </span>
            <h2 className="text-2xl font-black tracking-tight leading-tight text-[var(--text-color)]">
              Your Laundry,{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Tracked & Managed.</span>
            </h2>
            <p className="text-sm font-medium text-[var(--text-color)] max-w-xs mx-auto leading-relaxed">
              Create your account, choose your shop, and start requesting orders in minutes.
            </p>
            <div className="flex flex-col gap-2 pt-1 text-left max-w-xs mx-auto">
              {[
                { n:'01', t:'Register & pick your shop' },
                { n:'02', t:'Request a laundry order' },
                { n:'03', t:'Track progress in real time' },
                { n:'04', t:'Pay digitally & pick up' },
              ].map(({ n, t }) => (
                <div key={n} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                    style={{ background:'linear-gradient(135deg,#00aeef,#6366f1)', color:'#fff' }}>{n}</span>
                  <span className="text-xs font-semibold text-[var(--text-color)]">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Register Card ── */}
          <div className="w-full lg:w-[420px] shrink-0 animate-slideup">
            <div className="welaund-card p-10 pulse-bg">
              <div className="mb-8">
                <h1 className="text-2xl font-black text-[var(--text-color)] tracking-tight">Create Account</h1>
                <p className="text-[var(--text-color)]/50 text-sm mt-1">Join your laundry shop on WashWise</p>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1 custom-scroll">
                <Field label="Select Laundry Shop" icon={FiMapPin}>
                  <select value={form.shop_id} onChange={e => setF('shop_id', e.target.value)} className={`${inputCls} themed-select`}>
                    <option value="" disabled>Choose a location...</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" icon={FiUser}><input type="text" placeholder="John" value={form.first_name} onChange={e => setF('first_name', e.target.value)} className={inputCls} /></Field>
                  <Field label="Last Name"  icon={FiUser}><input type="text" placeholder="Doe"  value={form.last_name}  onChange={e => setF('last_name',  e.target.value)} className={inputCls} /></Field>
                </div>
                <Field label="Email" icon={FiMail}>
                  <input type="email" placeholder="john@email.com" value={form.email} onChange={e => setF('email', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Password" icon={FiLock}>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setF('password', e.target.value)} className={inputCls} />
                    <button onClick={() => setShowPwd(!showPwd)} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--text-color)] transition-colors">
                      {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </Field>
                {error   && <div className="text-rose-400 text-xs font-bold bg-rose-400/10 p-4 rounded-xl border border-rose-400/20">{error}</div>}
                {success && <div className="text-emerald-400 text-xs font-bold bg-emerald-400/10 p-4 rounded-xl border border-emerald-400/20">{success}</div>}
                <button onClick={handleRegister} disabled={loading} className="w-full py-4 welaund-btn text-sm disabled:opacity-60">
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </div>

              <p className="text-center text-[var(--text-color)]/40 text-xs mt-8">
                Already have an account?{' '}
                <Link href="/login" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">Sign in here</Link>
              </p>
            </div>
          </div>

          {/* ── Mobile: Phone showcase below card ── */}
          <div className="lg:hidden w-full" style={{ height:'360px' }}>
            <AppPhoneShowcase />
          </div>

        </div>
      </div>
    </div>
  );
}
