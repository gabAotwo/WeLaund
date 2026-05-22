'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft } from 'react-icons/fi';

const SECTIONS = [
  { id: 'acceptance',   title: 'Acceptance' },
  { id: 'description',  title: 'Service Description' },
  { id: 'accounts',     title: 'Accounts & Access' },
  { id: 'conduct',      title: 'Acceptable Use' },
  { id: 'payments',     title: 'Payments' },
  { id: 'ip',           title: 'Intellectual Property' },
  { id: 'termination',  title: 'Termination' },
  { id: 'liability',    title: 'Limitation of Liability' },
  { id: 'changes',      title: 'Changes to Terms' },
  { id: 'contact',      title: 'Contact' },
];

export default function TermsPage() {
  const [active, setActive] = useState('acceptance');
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
              <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-color)] tracking-tight">Terms of Service</h1>
              <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</p>
            </div>

            {[
              {
                id: 'acceptance', title: 'Acceptance of Terms',
                content: `By accessing or using the WashWise platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform. These terms apply to all users including customers, staff, shop owners, and super administrators.`,
              },
              {
                id: 'description', title: 'Service Description',
                content: `WashWise is a multi-tenant SaaS laundry management platform that provides tools for laundry shop owners to manage orders, staff, customers, and payments. The platform includes role-based dashboards for super admins, shop owners, staff, and customers.`,
              },
              {
                id: 'accounts', title: 'Accounts & Access',
                items: [
                  'You are responsible for maintaining the confidentiality of your login credentials.',
                  'You must immediately notify us of any unauthorized use of your account.',
                  'Each user account is personal and may not be shared or transferred.',
                  'Owner accounts are provisioned by WashWise administrators upon approval of a B2B application.',
                  'We reserve the right to suspend or terminate accounts that violate these terms.',
                ],
              },
              {
                id: 'conduct', title: 'Acceptable Use',
                content: `You agree not to:`,
                items: [
                  'Use the platform for any unlawful purpose or in violation of any regulations.',
                  'Attempt to gain unauthorized access to any part of the platform or its infrastructure.',
                  'Upload malicious files, scripts, or content of any kind.',
                  'Misrepresent your identity or business information.',
                  'Interfere with or disrupt the integrity or performance of the platform.',
                  'Scrape, crawl, or extract data from the platform without written permission.',
                ],
              },
              {
                id: 'payments', title: 'Payments',
                content: `WashWise facilitates payment verification for GCash transactions. We do not process or hold funds directly. All payment references are logged for verification purposes. Users are responsible for ensuring the accuracy of payment reference numbers submitted through the platform.`,
              },
              {
                id: 'ip', title: 'Intellectual Property',
                content: `All content, branding, code, and design elements of the WashWise platform are the intellectual property of WashWise and its developers. You may not copy, reproduce, distribute, or create derivative works without explicit written permission. Your shop data and customer data remain your property.`,
              },
              {
                id: 'termination', title: 'Termination',
                content: `We reserve the right to suspend or terminate your access to WashWise at any time, with or without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties. Upon termination, your right to use the platform ceases immediately.`,
              },
              {
                id: 'liability', title: 'Limitation of Liability',
                content: `WashWise is provided "as is" without warranties of any kind. To the maximum extent permitted by law, WashWise and its developers shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform, including but not limited to loss of data, revenue, or business opportunities.`,
              },
              {
                id: 'changes', title: 'Changes to Terms',
                content: `We may update these Terms of Service from time to time. We will notify registered users of significant changes via email. Continued use of the platform after changes constitutes acceptance of the updated terms. We encourage you to review this page periodically.`,
              },
              {
                id: 'contact', title: 'Contact',
                content: `For questions or concerns regarding these Terms of Service, please contact us at:`,
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
