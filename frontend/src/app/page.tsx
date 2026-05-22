'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  FiCheckCircle, FiBarChart2, FiCreditCard, FiArrowRight
} from 'react-icons/fi';
import { StatsSection, DetailedFeaturesSection, BentoSection, WhySection, RolesSection } from '@/components/landing/LandingExtras';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import AppPhoneShowcase from '@/components/AppPhoneShowcase';

const STEPS = [
  { n: '01', title: 'Create Account',   desc: 'Register in seconds and link your laundry shop.' },
  { n: '02', title: 'Drop Off Laundry', desc: 'Walk in, drop your items and get a digital receipt.' },
  { n: '03', title: 'Track Progress',   desc: 'Monitor wash, dry, fold stages in real time.' },
  { n: '04', title: 'Pay & Pickup',     desc: 'Pay via GCash or cash, then pick up fresh laundry.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen welaund-bg transition-colors duration-500">
      <div className="welaund-orb orb-1" /><div className="welaund-orb orb-2" /><div className="welaund-orb orb-3" />

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4 bg-[var(--bg-color)]/80 backdrop-blur-xl border-b border-[var(--card-border)]' : 'py-8 bg-transparent'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <Image src="/logo.png" alt="WashWise" width={160} height={50} style={{ height:'auto' }} className="w-32 lg:w-40" priority />
          <div className="flex items-center gap-4 lg:gap-10">
            <div className="hidden lg:flex items-center gap-10">
              {['Features', 'How It Works'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-bold text-[var(--text-color)] hover:opacity-100 transition-opacity tracking-wide uppercase">{l}</a>
              ))}
              <Link href="/support" className="text-sm font-bold text-[var(--text-color)] hover:opacity-100 transition-opacity tracking-wide uppercase">Support</Link>
            </div>
            <ThemeToggle />
            <Link href="/login" className="px-5 py-2 sm:px-6 sm:py-2.5 welaund-btn text-[10px] sm:text-xs">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="get-started" className="pt-32 sm:pt-40 lg:pt-56 pb-20 lg:pb-32">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-[55%] animate-slideup relative z-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Next-Gen Laundry Platform</span>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-8 leading-[0.95] tracking-tighter text-[var(--text-color)] drop-shadow-sm">
                Smart Laundry <br/><span className="opacity-70">Management.</span>
              </h1>
              <p className="text-xl text-[var(--text-color)] max-w-lg mb-12 font-medium leading-relaxed">
                Experience the first fully automated SaaS platform for laundry shop growth. Real-time orders, digital payments, and powerful analytics.
              </p>
              <div className="flex gap-4 mb-12">
                <Link href="/login"    className="px-8 py-4 welaund-btn text-sm">Join the Beta</Link>
                <Link href="/register" className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all text-[var(--text-color)]">View Demo</Link>
              </div>
            </div>

            <div className="lg:w-[45%] w-full max-w-md relative ml-auto lg:ml-16">
              {/* Mobile phone */}
              <div className="lg:hidden mb-12 -mt-4">
                <div className="mx-auto scale-90" style={{ maxWidth:'340px' }}>
                  <AppPhoneShowcase />
                </div>
              </div>

              {/* Desktop phone */}
              <div className="hidden lg:block absolute -left-[420px] top-1/2 -translate-y-1/2 z-10 pointer-events-none" style={{ width:'400px' }}>
                <AppPhoneShowcase />
              </div>

              {/* CTA card replacing auth card */}
              <div className="relative z-20 animate-slideup">
                <div className="welaund-card p-10 pulse-bg text-center space-y-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Start Today</p>
                  <h2 className="text-2xl font-black text-[var(--text-color)] leading-tight">Manage your laundry shop smarter</h2>
                  <p className="text-[var(--text-color)] text-sm">Real-time orders, digital payments, and powerful analytics — all in one place.</p>
                  <div className="flex flex-col gap-3">
                    <Link href="/login"    className="w-full py-4 welaund-btn text-sm text-center block">Sign In to Dashboard</Link>
                    <Link href="/register" className="w-full py-3.5 rounded-2xl text-sm font-bold text-slate-800 hover:text-slate-900 transition-all text-center block" style={{ background:'rgba(255,255,255,0.85)', border:'1px solid rgba(255,255,255,0.9)' }}>Create an Account</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTIONS ── */}
      <div className="space-y-32">
        <StatsSection />
        <div id="features"><DetailedFeaturesSection /></div>
        <BentoSection />
        <RolesSection />
        <WhySection />

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-32">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 lg:mb-24">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.4em] mb-4 block">Our Workflow</span>
              <h2 className="text-4xl lg:text-5xl font-black text-[var(--text-color)] tracking-tight">How WashWise Works</h2>
              <p className="text-[var(--text-color)]/70 mt-4 font-medium text-base lg:text-lg">Four simple steps from drop-off to fresh pickup.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
              {STEPS.map(({ n, title, desc }) => (
                <div key={n} className="group animate-slideup">
                  <div className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center text-2xl font-black text-[var(--text-color)] bg-white/5 border border-white/5 group-hover:border-cyan-400/30 group-hover:bg-cyan-400/10 transition-all duration-500">{n}</div>
                  <h3 className="text-xl font-black text-[var(--text-color)] mb-3 tracking-tight">{title}</h3>
                  <p className="text-[var(--text-color)]/70 text-sm font-medium leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-40 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center welaund-card p-10 lg:p-20 border-cyan-400/20">
            <h2 className="text-4xl lg:text-5xl font-black text-[var(--text-color)] mb-6 tracking-tight">Ready to Modernize?</h2>
            <p className="text-[var(--text-color)]/70 mb-10 text-lg font-medium">Join hundreds of laundry shops already using WashWise to scale.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/login" className="px-12 py-5 welaund-btn text-base inline-flex items-center gap-3">
                Get Started for Free <FiArrowRight />
              </Link>
              <Link href="/request-shop" className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all text-[var(--text-color)] inline-flex items-center gap-3">
                Avail Now as Owner <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-20 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-20 mb-20">
              <div className="space-y-6">
                <Image src="/logo.png" alt="WashWise" width={140} height={44} style={{ height:'auto' }} className="opacity-80" />
                <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs">Leading SaaS platform for modern laundry shop management.</p>
              </div>
              <div className="space-y-6">
                <h4 className="text-[var(--text-color)] font-black text-sm uppercase tracking-widest">Platform</h4>
                <div className="flex flex-col gap-4 text-slate-400 text-sm font-medium">
                  <a href="#features"    className="hover:text-cyan-400 transition-colors">Features</a>
                  <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
                  <Link href="/login"    className="hover:text-cyan-400 transition-colors">Sign In</Link>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[var(--text-color)] font-black text-sm uppercase tracking-widest">Company</h4>
                <div className="flex flex-col gap-4 text-slate-400 text-sm font-medium">
                  <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
                  <Link href="/terms"   className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
                  <Link href="/support" className="hover:text-cyan-400 transition-colors">Support</Link>
                </div>
              </div>
            </div>
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">© {new Date().getFullYear()} WashWise Platform.</p>
              <div className="flex gap-3">
                {['GCash', 'Maya', 'Cash'].map(p => (
                  <span key={p} className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
