'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiMail, FiShield, FiTool, FiChevronDown } from 'react-icons/fi';

const FAQS = [
  {
    q: 'How do I reset my password?',
    a: 'Contact your shop administrator or super admin to reset your password. Owner accounts can request a reset by emailing admin@washwise.laundry with your registered email address.',
  },
  {
    q: 'How does GCash payment verification work?',
    a: 'After a customer pays via GCash or Maya, they receive a 13-digit reference number. Staff enter this reference number into WashWise, which logs and marks the transaction as verified. The order status then updates automatically.',
  },
  {
    q: 'How do I apply to become a shop owner on WashWise?',
    a: 'Click "Avail Now as Owner" on the homepage and fill out the B2B application form. Our admin team will review your application and send your login credentials to your registered email once approved.',
  },
  {
    q: 'Can I manage multiple laundry shops under one account?',
    a: 'Each owner account is linked to one shop by default. For multi-shop management, please contact our admin team at admin@washwise.laundry to discuss enterprise options.',
  },
  {
    q: 'How do I add staff to my shop?',
    a: 'Log in to your Owner Dashboard, navigate to the Staff section, and use the "Add Staff" form. Staff will receive their credentials and can log in immediately.',
  },
  {
    q: 'Is my data secure on WashWise?',
    a: 'Yes. WashWise uses bcrypt password hashing, HTTPS encryption, HttpOnly session cookies, and role-based access control. Profile photos are stored securely via Cloudinary. See our Privacy Policy for full details.',
  },
  {
    q: 'What should I do if I find a security vulnerability?',
    a: 'Please report security vulnerabilities responsibly by emailing security@washwise.laundry. Do not publicly disclose vulnerabilities before we have had a chance to address them.',
  },
];

const CONTACTS = [
  {
    icon: FiMail,
    label: 'General Support',
    email: 'support@washwise.laundry',
    desc: 'Account issues, billing, and general platform questions.',
    color: '#00f0ff',
    bg: 'rgba(0,240,255,0.08)',
    border: 'rgba(0,240,255,0.2)',
  },
  {
    icon: FiShield,
    label: 'Administration',
    email: 'admin@washwise.laundry',
    desc: 'Owner applications, account approvals, and platform governance.',
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.08)',
    border: 'rgba(129,140,248,0.2)',
  },
  {
    icon: FiTool,
    label: 'Technical / Security',
    email: 'security@washwise.laundry',
    desc: 'Bug reports, security vulnerabilities, and technical issues.',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.2)',
  },
];

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen welaund-bg">
      <div className="welaund-orb orb-1" /><div className="welaund-orb orb-2" /><div className="welaund-orb orb-3" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-5 bg-[var(--bg-color)]/80 backdrop-blur-xl border-b border-[var(--card-border)]">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Image src="/logo.png" alt="WashWise" width={140} height={44} style={{ height: 'auto' }} className="w-28 lg:w-36" />
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-[var(--text-color)]/60 hover:text-[var(--text-color)] transition-colors">
            <FiArrowLeft size={14} /> Back
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 pt-28 pb-20 max-w-4xl space-y-16">

        {/* Header */}
        <div className="text-center space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">Help Center</span>
          <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-color)] tracking-tight">Support</h1>
          <p className="text-slate-400 text-base font-medium max-w-lg mx-auto leading-relaxed">
            Need help? Reach out to the right team or browse our frequently asked questions below.
          </p>
        </div>

        {/* Contact Hub */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Contact Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CONTACTS.map(c => (
              <a
                key={c.email}
                href={`mailto:${c.email}`}
                className="welaund-card p-6 space-y-4 block group hover:scale-[1.02] transition-transform"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}
                >
                  <c.icon size={18} style={{ color: c.color }} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest" style={{ color: c.color }}>{c.label}</p>
                  <p className="text-sm font-bold text-[var(--text-color)] group-hover:underline break-all">{c.email}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="welaund-card overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="text-sm font-bold text-[var(--text-color)]">{faq.q}</span>
                  <FiChevronDown
                    size={16}
                    className="shrink-0 text-cyan-400 transition-transform duration-300"
                    style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {open === i && (
                  <div className="px-6 pb-6">
                    <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer note */}
        <div className="welaund-card p-8 text-center space-y-3">
          <p className="text-sm font-bold text-[var(--text-color)]">Still need help?</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Our team typically responds within 24 hours on business days. For urgent issues, email us directly at{' '}
            <a href="mailto:support@washwise.laundry" className="text-cyan-400 hover:underline">support@washwise.laundry</a>.
          </p>
          <div className="flex justify-center gap-6 pt-2 text-xs text-slate-600">
            <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms"   className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
