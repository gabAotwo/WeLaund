'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiSend, FiCheckCircle } from 'react-icons/fi';

export default function RequestShopPage() {
  const [form, setForm] = useState({
    owner_name: '', email: '', phone: '', shop_name: '', shop_description: '',
  });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.owner_name || !form.email || !form.phone || !form.shop_name) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/public/submit_request.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) setSuccess(true);
      else setError(data.message || 'Submission failed. Please try again.');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen welaund-bg transition-colors duration-500">
      <div className="welaund-orb orb-1" /><div className="welaund-orb orb-2" /><div className="welaund-orb orb-3" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-5 bg-[var(--bg-color)]/80 backdrop-blur-xl border-b border-[var(--card-border)]">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Image src="/logo.png" alt="WashWise" width={140} height={44} style={{ width: 'auto', height: 'auto' }} className="w-28 lg:w-36" />
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-[var(--text-color)]/60 hover:text-[var(--text-color)] transition-colors">
            <FiArrowLeft size={14} /> Back to Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 pt-32 pb-20 max-w-lg">

        {success ? (
          <div className="welaund-card p-10 text-center space-y-6 animate-slideup">
            <div className="w-16 h-16 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto">
              <FiCheckCircle size={28} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-black text-[var(--text-color)]">Application Submitted!</h2>
            <p className="text-[var(--text-color)]/60 text-sm leading-relaxed">
              Our team will review your application and send your login credentials to <span className="text-cyan-400 font-bold">{form.email}</span> once approved.
            </p>
            <Link href="/" className="w-full py-4 welaund-btn text-sm text-center block">
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="animate-slideup space-y-8">
            <div className="text-center space-y-3">
              <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">B2B Partnership</span>
              <h1 className="text-4xl font-black text-[var(--text-color)] tracking-tight">Avail Now as <span className="text-cyan-400">Owner</span></h1>
              <p className="text-[var(--text-color)]/60 text-sm leading-relaxed">
                Fill out the form below. Our team will review your application and send your login credentials once approved.
              </p>
            </div>

            <div className="welaund-card p-8 space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {[
                  { name: 'owner_name',  label: 'Full Name',          type: 'text',  placeholder: 'e.g. Juan dela Cruz',        required: true },
                  { name: 'email',       label: 'Email Address',      type: 'email', placeholder: 'you@example.com',            required: true },
                  { name: 'phone',       label: 'Phone Number',       type: 'tel',   placeholder: 'e.g. 09171234567',           required: true },
                  { name: 'shop_name',   label: 'Laundry Shop Name',  type: 'text',  placeholder: 'e.g. Sunshine Laundry Hub',  required: true },
                ].map(f => (
                  <div key={f.name} className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-color)]/50">
                      {f.label} {f.required && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type={f.type}
                      name={f.name}
                      value={form[f.name as keyof typeof form]}
                      onChange={handleChange}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-color)] placeholder-[var(--text-color)]/25 outline-none transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  </div>
                ))}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-color)]/50">Shop Description</label>
                  <textarea
                    name="shop_description"
                    value={form.shop_description}
                    onChange={handleChange}
                    placeholder="Brief overview of your business (optional)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium text-[var(--text-color)] placeholder-[var(--text-color)]/25 outline-none transition-all resize-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 welaund-btn text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><FiSend size={14} /> Submit Application</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
