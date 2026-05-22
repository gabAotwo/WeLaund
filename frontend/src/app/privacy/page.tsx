'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft } from 'react-icons/fi';

const SECTIONS = [
  { id: 'overview',    title: 'Overview' },
  { id: 'collection',  title: 'Data We Collect' },
  { id: 'usage',       title: 'How We Use It' },
  { id: 'sharing',     title: 'Data Sharing' },
  { id: 'security',    title: 'Security' },
  { id: 'cookies',     title: 'Cookies' },
  { id: 'rights',      title: 'Your Rights' },
  { id: 'contact',     title: 'Contact Us' },
];

export default function PrivacyPage() {
  const [active, setActive] = useState('overview');
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.current?.observe(el);
    });
    return () => observer.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

      <div className="container mx-auto px-6 pt-28 pb-20 max-w-6xl">
        <div className="flex gap-10 items-start">

          {/* Floating Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0 sticky top-28">
            <div className="welaund-card p-5 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-4">Contents</p>
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active === s.id ? 'rgba(0,240,255,0.1)' : 'transparent',
                    color:      active === s.id ? '#00f0ff'              : 'rgba(148,163,184,0.8)',
                    borderLeft: active === s.id ? '2px solid #00f0ff'   : '2px solid transparent',
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0 space-y-12">
            <div className="space-y-3">
              <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em]">Legal</span>
              <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-color)] tracking-tight">Privacy Policy</h1>
              <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</p>
            </div>

            {[
              {
                id: 'overview', title: 'Overview',
                content: `WashWise ("we", "our", or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our SaaS laundry management platform. By using WashWise, you agree to the practices described in this policy.`,
              },
              {
                id: 'collection', title: 'Data We Collect',
                items: [
                  'Account information: name, email address, phone number, and password (stored as a bcrypt hash).',
                  'Business information: laundry shop name, address, operating hours, and GCash/Maya payment details.',
                  'Order data: laundry orders, item weights, service types, and transaction references.',
                  'Usage data: login timestamps, IP addresses, and browser/device information for security purposes.',
                  'Profile photos uploaded voluntarily via Cloudinary.',
                ],
              },
              {
                id: 'usage', title: 'How We Use It',
                items: [
                  'To provide and operate the WashWise platform and its features.',
                  'To process laundry orders and facilitate GCash/Maya payment verification.',
                  'To send account credentials and important platform notifications via email.',
                  'To generate analytics and reports for shop owners and super admins.',
                  'To improve platform security, detect fraud, and prevent unauthorized access.',
                ],
              },
              {
                id: 'sharing', title: 'Data Sharing',
                content: `We do not sell, rent, or trade your personal information to third parties. Data may be shared with:`,
                items: [
                  'Cloudinary — for secure profile photo storage and delivery.',
                  'PostgreSQL hosting providers — for encrypted database storage.',
                  'Law enforcement — only when required by applicable law or court order.',
                ],
              },
              {
                id: 'security', title: 'Security',
                content: `We implement industry-standard security measures including bcrypt password hashing, HTTPS encryption, session-based authentication with HttpOnly cookies, and role-based access control (RBAC). While we strive to protect your data, no system is 100% secure. We encourage you to use a strong, unique password and report any suspicious activity immediately.`,
              },
              {
                id: 'cookies', title: 'Cookies',
                content: `WashWise uses session cookies (WELAUND_SESSION) to maintain your authenticated session. These cookies are HttpOnly and Secure in production environments. We do not use third-party advertising or tracking cookies. You may disable cookies in your browser settings, but this will prevent you from logging in to the platform.`,
              },
              {
                id: 'rights', title: 'Your Rights',
                items: [
                  'Access: Request a copy of the personal data we hold about you.',
                  'Correction: Update inaccurate or incomplete information via your profile settings.',
                  'Deletion: Request deletion of your account and associated data.',
                  'Portability: Request your data in a machine-readable format.',
                  'Objection: Object to certain types of data processing.',
                ],
              },
              {
                id: 'contact', title: 'Contact Us',
                content: `For privacy-related inquiries, data requests, or concerns, please contact our administration team at:`,
                contact: true,
              },
            ].map(s => (
              <section key={s.id} id={s.id} className="welaund-card p-8 space-y-4 scroll-mt-28">
                <h2 className="text-xl font-black tracking-tight" style={{ color: '#00f0ff' }}>{s.title}</h2>
                {s.content && <p className="text-slate-400 text-sm leading-relaxed">{s.content}</p>}
                {s.items && (
                  <ul className="space-y-2">
                    {s.items.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-400">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {s.contact && (
                  <a href="mailto:admin@washwise.laundry" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-cyan-400 transition-all" style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)' }}>
                    admin@washwise.laundry
                  </a>
                )}
              </section>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
}
