'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiZap, FiBarChart2, FiCreditCard, FiSmartphone, FiShield, FiClock,
  FiTrendingUp, FiLayers, FiUsers, FiCheckCircle, FiStar, FiChevronLeft, FiChevronRight,
  FiActivity, FiFileText, FiServer, FiLock,
  FiHome, FiUser, FiLogOut, FiPlus, FiMenu, FiBox, FiDollarSign, FiSettings, FiCheckSquare, FiList
} from 'react-icons/fi';

const ACCENT_COLOR = "#0692abff"; 

export function StatsSection() {
  const stats = [
    { label: 'Orders Processed', value: '1.2M+', icon: FiZap },
    { label: 'Active Shops', value: '850+', icon: FiLayers },
    { label: 'Happy Customers', value: '250k+', icon: FiUsers },
    { label: 'Uptime', value: '99.9%', icon: FiShield },
  ];

  return (
    <div className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12">
        {stats.map((s, i) => (
          <div key={i} className="text-center animate-slideup" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="inline-flex p-4 rounded-3xl mb-6" style={{ background: 'rgba(59, 117, 151, 0.1)', border: '1px solid rgba(59, 117, 151, 0.05)' }}>
              <s.icon size={28} className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-5xl font-black text-[#3B7597] mb-2 tracking-tighter">{s.value}</div>
            <div className="text-slate-700 dark:text-white/75 font-semibold uppercase tracking-[0.2em] text-[10px]">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureMockup({ index }: { index: number }) {
  const textColor = "text-[#3B7597]";
  const subTextColor = "text-[#3B7597]/60";
  const cardBg = "bg-[#3B7597]/5 dark:bg-white/5";
  const borderColor = "border-[#3B7597]/10 dark:border-white/10";
  
  if (index === 0) { // Order Tracking
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className={`w-full max-w-[280px] sm:w-72 ${cardBg} rounded-2xl p-6 border ${borderColor} space-y-4 shadow-xl`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-[10px] font-black ${textColor} uppercase tracking-widest`}>Order #8821</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold">WASHING</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-2 rounded ${cardBg} overflow-hidden`}>
                <motion.div initial={{ width: 0 }} animate={{ width: i === 1 ? '100%' : i === 2 ? '40%' : '0%' }} transition={{ duration: 1, delay: i * 0.2 }} className="h-full bg-cyan-500" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2 items-center">
             <div className="w-9 h-9 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400"><FiClock size={16} /></div>
             <div className={`flex-1 text-[10px] ${subTextColor}`}>Estimated Pickup: <br/><span className={`${textColor} font-bold`}>Today, 5:00 PM</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (index === 1) { // Payments
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className={`w-full max-w-[260px] sm:w-64 ${cardBg} rounded-3xl p-8 border ${borderColor} flex flex-col items-center shadow-xl`}>
           <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-6"><FiCreditCard size={32} /></div>
           <div className={`text-2xl font-black ${textColor} mb-1`}>₱1,250.00</div>
           <div className={`text-[10px] font-bold ${subTextColor} uppercase tracking-widest mb-6`}>Payment Due</div>
           <div className="w-full h-11 rounded-xl bg-cyan-500 hover:bg-cyan-600 transition-colors flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Pay with GCash</div>
        </div>
      </div>
    );
  }

  if (index === 2) { // Analytics
    return (
      <div className="relative w-full h-full flex items-center justify-center gap-2 sm:gap-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`w-10 sm:w-14 ${cardBg} border ${borderColor} rounded-xl flex flex-col-reverse p-1.5 overflow-hidden shadow-lg`} style={{ height: `${40 + i * 20}%` }}>
            <motion.div initial={{ height: 0 }} animate={{ height: '70%' }} transition={{ duration: 1, delay: i * 0.1 }} className="w-full bg-gradient-to-t from-cyan-500 to-blue-600 rounded-lg" />
          </div>
        ))}
        <div className={`absolute top-12 right-4 sm:right-12 p-3 sm:p-5 rounded-2xl ${cardBg} border ${borderColor} shadow-2xl animate-float`}>
          <FiTrendingUp className="text-cyan-600 dark:text-cyan-400" size={24} />
        </div>
      </div>
    );
  }

  if (index === 3) { // Mobile
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4">
         <div className={`w-32 sm:w-36 h-56 sm:h-60 border-4 ${borderColor} rounded-[2rem] sm:rounded-[2.5rem] p-2 relative shadow-2xl`}>
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 sm:w-14 h-4 sm:h-5 ${borderColor} border bg-white/10 rounded-b-xl`} />
            <div className={`w-full h-full rounded-[1.5rem] sm:rounded-[2rem] ${cardBg} flex flex-col p-2 sm:p-3 space-y-2 sm:space-y-2.5`}>
               <div className="h-7 rounded-lg bg-cyan-500/20" />
               <div className={`h-14 rounded-lg ${cardBg} border ${borderColor}`} />
               <div className={`h-14 rounded-lg ${cardBg} border ${borderColor}`} />
               <div className="flex-1" />
               <div className="h-14 rounded-lg bg-cyan-500 shadow-md" />
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
       {/* Data Streams */}
       {[...Array(6)].map((_, i) => (
         <motion.div
           key={i}
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ 
             opacity: [0, 0.3, 0],
             scale: [0.8, 1.2],
             x: [0, (i % 2 === 0 ? 120 : -120)],
             y: [0, (i < 3 ? 120 : -120)]
           }}
           transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
           className="absolute w-1.5 h-1.5 bg-cyan-500 rounded-full blur-[1px]"
         />
       ))}

       <div className="relative flex flex-col items-center">
          <div className="w-36 h-36 rounded-full border-2 border-cyan-500/20 flex items-center justify-center relative shadow-inner">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 rounded-full border-t-2 border-cyan-500/40"
             />
             <div className={`w-28 h-28 rounded-full ${cardBg} flex items-center justify-center relative shadow-xl`}>
                <FiShield size={56} className="text-cyan-600 dark:text-cyan-400 opacity-80" />
                <motion.div 
                   animate={{ opacity: [0.3, 1, 0.3] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute"
                >
                  <FiLock size={24} className={`${textColor} mt-2`} />
                </motion.div>
             </div>
          </div>
          
          <div className="mt-10 space-y-3 text-center">
             <div className={`text-[11px] font-black ${textColor} uppercase tracking-[0.3em]`}>Encrypted Storage</div>
             <div className="flex gap-1.5 justify-center">
                {[1, 2, 3, 4].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                    className="w-2 h-2 rounded-sm bg-cyan-500 shadow-sm" 
                  />
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}

export function DetailedFeaturesSection() {
  const features = [
    {
      title: 'Live Order Tracking',
      desc: 'Real-time visibility for both staff and customers. Every stage is logged from washing to folding.',
      icon: FiClock,
      bullets: ['Stage-by-stage updates', 'Instant push notifications', 'Digital order receipts']
    },
    {
      title: 'Flexible Payments',
      desc: 'Seamless integration with GCash, Maya, and cash management. Instant validation.',
      icon: FiCreditCard,
      bullets: ['Automatic payment logs', 'QR Code generation', 'Instant payment tracking']
    },
    {
      title: 'Owner Analytics',
      desc: 'Powerful insights into revenue, staff performance, and peak hours at your fingertips.',
      icon: FiBarChart2,
      bullets: ['Daily/Weekly reports', 'Top services breakdown', 'Staff efficiency metrics']
    },
    {
      title: 'Mobile Operations',
      desc: 'Process orders directly from a tablet or phone. No bulky hardware needed.',
      icon: FiSmartphone,
      bullets: ['Fully responsive UI', 'Cloud syncing', 'Low data usage']
    },
    {
      title: 'Enterprise Security',
      desc: 'Your business data is encrypted and backed up daily on secure cloud servers.',
      icon: FiShield,
      bullets: ['Role-based access', 'Audit logs', 'Daily backups']
    }
  ];

  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % features.length);
  const prev = () => setIndex((i) => (i - 1 + features.length) % features.length);

  return (
    <div className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-16">
        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.4em] mb-4 block">Platform Features</span>
        <h2 className="text-4xl lg:text-6xl font-black text-[#3B7597] mb-6 tracking-tight">Everything You Need</h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative min-h-[900px] sm:min-h-[800px] lg:min-h-[550px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="absolute inset-0 flex flex-col lg:flex-row items-center justify-start lg:justify-center gap-8 lg:gap-20 px-2 sm:px-4"
          >
            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left pt-4 sm:pt-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-6" 
                   style={{ background: 'rgba(59, 117, 151, 0.1)', border: '1px solid rgba(59, 117, 151, 0.2)' }}>
                {(() => { const Icon = features[index].icon; return <Icon size={28} className="text-cyan-600 dark:text-cyan-400" />; })()}
              </div>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3B7597] mb-4 sm:mb-6 tracking-tight">{features[index].title}</h3>
              <p className="text-slate-700 dark:text-white/75 text-lg sm:text-xl leading-relaxed mb-6 sm:mb-10 font-medium">{features[index].desc}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                {features[index].bullets.map((b, j) => (
                  <li key={j} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-[#3B7597]/70">
                    <FiCheckCircle size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full lg:w-1/2 h-[300px] sm:h-[350px] lg:h-[450px] welaund-card overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-[#3B7597]/5 to-transparent dark:from-white/5">
               <div className="scale-90 sm:scale-100 w-full h-full flex items-center justify-center">
                 <FeatureMockup index={index} />
               </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="absolute bottom-[-80px] lg:bottom-[-40px] left-1/2 -translate-x-1/2 flex items-center gap-8 z-20">
           <button onClick={prev} className="w-12 h-12 rounded-full border border-[#3B7597]/20 flex items-center justify-center text-[#3B7597] hover:bg-[#3B7597]/10 transition-all">
             <FiChevronLeft size={24} />
           </button>
           <div className="flex gap-2">
             {features.map((_, i) => (
               <div key={i} onClick={() => setIndex(i)} className={`h-2 rounded-full transition-all cursor-pointer ${index === i ? 'w-8 bg-cyan-500' : 'w-2 bg-[#3B7597]/20'}`} />
             ))}
           </div>
           <button onClick={next} className="w-12 h-12 rounded-full border border-[#3B7597]/20 flex items-center justify-center text-[#3B7597] hover:bg-[#3B7597]/10 transition-all">
             <FiChevronRight size={24} />
           </button>
        </div>
      </div>
    </div>
  );
}

export function BentoSection() {
  return (
    <div className="py-32">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 welaund-card p-8 lg:p-12 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-3xl lg:text-4xl font-black text-[#3B7597] mb-4 tracking-tight">Ready for Scale</h3>
            <p className="text-slate-700 dark:text-white/75 max-w-md font-medium text-lg">Whether you have one shop or a nationwide chain, WashWise handles the complexity for you.</p>
          </div>
          <div className="absolute right-0 bottom-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <FiTrendingUp size={300} className="text-[#3B7597]" />
          </div>
        </div>
        <div className="lg:col-span-4 welaund-card p-8 lg:p-12 flex flex-col justify-center items-center text-center">
          <FiSmartphone size={60} className="text-cyan-600 dark:text-cyan-400 mb-8 animate-float" />
          <h3 className="text-2xl font-black text-[#3B7597] mb-2">Mobile First</h3>
          <p className="text-slate-700 dark:text-white/75 text-sm font-medium">Staff can process orders directly from a tablet or phone.</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  ROLES SECTION
// ─────────────────────────────────────────────────────────

const ROLES = [
  {
    key: 'owner',
    label: 'Owner Dashboard',
    caption: 'Manage multiple branches, track real-time earnings, and control shop parameters.',
    checks: ['Revenue tracking', 'Shop status control', 'Pending registrations', 'Analytics overview'],
    screen: OwnerScreen,
  },
  {
    key: 'staff',
    label: 'Staff Interface',
    caption: 'Streamline daily operations, log laundry weights, and update order lifecycles instantly.',
    checks: ['Active task queue', 'Weight calculator', 'Order status updates', 'Ready for pickup list'],
    screen: StaffScreen,
  },
  {
    key: 'customer',
    label: 'Customer App',
    caption: 'Book orders in seconds, choose preferences, and track laundry progress in real time.',
    checks: ['Request order form', 'Service selection', 'GCash / Cash payment', 'Live status tracking'],
    screen: CustomerScreen,
  },
];

function OwnerScreen() {
  return (
    <div className="flex flex-col h-full bg-[#0a1020] text-white overflow-hidden relative">
      <div className="flex-1 p-3 overflow-hidden flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-slate-700 overflow-hidden border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/70">
            A
          </div>
          <div>
            <div className="text-[10px] font-black flex items-center gap-1">Hello, Anthony! <span className="text-[8px]">👋</span></div>
            <div className="text-[6px] text-white/50">Business Dashboard — Shoptest</div>
          </div>
        </div>

        {/* Shop Settings Btn */}
        <div className="rounded-lg py-1.5 px-2 flex items-center justify-center gap-1 w-max" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <FiSettings size={6} className="text-white/70" />
          <span className="text-[6px] font-bold text-white/70">Shop Settings</span>
        </div>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-2 gap-1.5 flex-1">
          {[
            { label: 'DAILY INCOME', value: '₱0.00', icon: FiTrendingUp, color: '#0ea5e9' },
            { label: 'MONTHLY INCOME', value: '₱140.00', icon: FiBarChart2, color: '#8b5cf6' },
            { label: 'TOTAL STAFF', value: '1', icon: FiUsers, color: '#6366f1' },
            { label: 'CUSTOMERS', value: '6', icon: FiUsers, color: '#10b981' },
            { label: 'SERVICES', value: '2', icon: FiBox, color: '#f59e0b' },
            { label: 'YEARLY TOTAL', value: '₱140.00', icon: FiBarChart2, color: '#ef4444' },
          ].map((s, i) => (
             <div key={i} className="rounded-xl p-2 flex flex-col gap-1 justify-center relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-5 h-5 rounded-md flex items-center justify-center mb-0.5" style={{ background: `${s.color}15` }}>
                  <s.icon size={8} color={s.color} />
                </div>
                <div className="text-[10px] font-black tracking-tight">{s.value}</div>
                <div className="text-[4px] text-white/50 font-bold tracking-wider uppercase">{s.label}</div>
             </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="h-10 bg-[#0a0f1d] border-t border-white/5 flex items-center justify-around px-1 mt-auto">
        {[
          { icon: FiHome, label: 'HOME', active: true },
          { icon: FiUsers, label: 'STAFF' },
          { icon: FiBox, label: 'SERVICES' },
          { icon: FiSettings, label: 'SETTINGS' },
          { icon: FiLogOut, label: 'LOGOUT', red: true }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 relative w-8">
            {item.active && <div className="absolute -top-[11px] w-4 h-[2px] bg-cyan-400 rounded-b-sm" />}
            <item.icon size={9} className={item.active ? "text-cyan-400" : (item.red ? "text-red-400/70" : "text-white/40")} />
            <span className={`text-[4px] font-bold ${item.active ? "text-cyan-400" : (item.red ? "text-red-400/70" : "text-white/40")}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StaffScreen() {
  return (
    <div className="flex flex-col h-full bg-[#0a1020] text-white overflow-hidden relative">
      <div className="flex-1 p-3 overflow-hidden flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-slate-700 overflow-hidden border border-white/10 flex items-center justify-center">
            <FiUser size={10} className="text-white/50" />
          </div>
          <div>
            <div className="text-[10px] font-black flex items-center gap-1">Hello, Staff! <span className="text-[8px]">👋</span></div>
            <div className="text-[6px] text-white/50">Shoptest — Staff Dashboard</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="rounded-lg py-2 flex items-center justify-center gap-1 shadow-lg mb-1" style={{ background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6)' }}>
          <FiPlus size={8} />
          <span className="text-[8px] font-bold">New Order</span>
        </div>

        {/* Stats Cards */}
        {[
          { label: 'DAILY COLLECTION', value: '₱2,450', icon: FiDollarSign, color: '#10b981' },
          { label: 'ONGOING ORDERS', value: '3', icon: FiClock, color: '#0ea5e9' },
          { label: 'PENDING APPROVALS', value: '4', icon: FiUsers, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-2.5 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
              <s.icon size={12} color={s.color} />
            </div>
            <div>
              <div className="text-[5px] text-white/50 font-bold tracking-wider mb-0.5">{s.label}</div>
              <div className="text-[12px] font-black">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <div className="h-10 bg-[#0a0f1d] border-t border-white/5 flex items-center justify-around px-1 mt-auto">
        {[
          { icon: FiHome, label: 'HOME', active: true },
          { icon: FiPlus, label: 'NEW' },
          { icon: FiList, label: 'ORDERS' },
          { icon: FiCheckSquare, label: 'APPROVALS' },
          { icon: FiSettings, label: 'SETTINGS' },
          { icon: FiLogOut, label: 'LOGOUT', red: true }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 relative w-7">
            {item.active && <div className="absolute -top-[11px] w-4 h-[2px] bg-cyan-400 rounded-b-sm" />}
            <item.icon size={9} className={item.active ? "text-cyan-400" : (item.red ? "text-red-400/70" : "text-white/40")} />
            <span className={`text-[3.5px] font-bold ${item.active ? "text-cyan-400" : (item.red ? "text-red-400/70" : "text-white/40")}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerScreen() {
  return (
    <div className="flex flex-col h-full bg-[#0a1020] text-white overflow-hidden relative">
      {/* Scrollable area */}
      <div className="flex-1 p-3 overflow-hidden flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-full bg-slate-700 overflow-hidden border border-white/10 flex items-center justify-center">
            <FiUser size={10} className="text-white/50" />
          </div>
          <div>
            <div className="text-[10px] font-black flex items-center gap-1">Hello, Anton! <span className="text-[8px]">👋</span></div>
            <div className="text-[6px] text-white/50">Tracking your laundry at Shoptest</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="rounded-lg py-2 flex items-center justify-center gap-1 shadow-lg" style={{ background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6)' }}>
          <FiPlus size={8} />
          <span className="text-[8px] font-bold">Request Laundry</span>
        </div>

        {/* Ongoing */}
        <div className="rounded-xl p-2.5 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1.5 text-[8px] font-bold">
            <FiBox size={10} className="text-cyan-400" />
            Ongoing Laundry
          </div>
          <div className="border-t border-white/5 pt-3 pb-2 flex flex-col items-center gap-1">
            <FiBox size={14} className="text-white/20" />
            <div className="text-[7px] text-white/40">No active orders</div>
            <div className="text-[5px] text-white/30">Your fresh laundry is just one request away!</div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl p-2.5 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between text-[8px] font-bold">
            <span>Recent History</span>
            <span className="text-[6px] text-cyan-400">View All →</span>
          </div>
          <div className="border-t border-white/5 pt-2 flex flex-col gap-1.5">
            {[
              { id: 'REQ-680453', date: '5/18', status: 'Done', pay: 'PAID' },
              { id: 'REQ-783159', date: '5/17', status: 'Done', pay: 'PAID' },
              { id: 'REQ-128873', date: '5/17', status: 'Cancel', pay: 'UNPAID', isCancel: true }
            ].map(h => (
              <div key={h.id} className="flex items-center justify-between text-[6px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{h.id}</span>
                  <span className="text-white/40 text-[5px]">{h.date}</span>
                </div>
                <div className="flex gap-1">
                  <span className={`px-1 rounded-sm ${h.isCancel ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{h.status}</span>
                  <span className={`px-1 rounded-sm ${h.isCancel ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{h.pay}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="h-10 bg-[#0a0f1d] border-t border-white/5 flex items-center justify-around px-1 mt-auto">
        {[
          { icon: FiHome, label: 'HOME', active: true },
          { icon: FiPlus, label: 'REQUEST' },
          { icon: FiList, label: 'ORDERS' },
          { icon: FiUser, label: 'PROFILE' },
          { icon: FiLogOut, label: 'LOGOUT', red: true }
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 relative w-8">
            {item.active && <div className="absolute -top-[11px] w-4 h-[2px] bg-cyan-400 rounded-b-sm" />}
            <item.icon size={10} className={item.active ? "text-cyan-400" : (item.red ? "text-red-400/70" : "text-white/40")} />
            <span className={`text-[4px] font-bold ${item.active ? "text-cyan-400" : (item.red ? "text-red-400/70" : "text-white/40")}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RolesSection() {
  const [active, setActive] = useState(0);
  const role = ROLES[active];
  const Screen = role.screen;

  return (
    <div className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 lg:mb-24">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.4em] mb-4 block">Multi-Role Platform</span>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-800 dark:text-white">Built for Every Role</h2>
          <p className="mt-4 font-medium text-base lg:text-lg max-w-xl mx-auto text-slate-700 dark:text-white/75">One platform that orchestrates multi-role workflows — from shop owners to staff to customers.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 items-center">

          {/* Left — text */}
          <div className="lg:w-1/2 space-y-8">
            {/* Toggle buttons */}
            <div className="flex flex-wrap gap-3">
              {ROLES.map((r, i) => (
                <button
                  key={r.key}
                  onClick={() => setActive(i)}
                  style={{
                    background:  active === i ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.04)',
                    border:      active === i ? '1px solid rgba(0,240,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow:   active === i ? '0 0 20px rgba(0,240,255,0.15)' : 'none',
                  }}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-300 ${
                    active === i ? 'text-cyan-400' : 'text-slate-700 dark:text-white/70'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Caption */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <p className="text-lg font-medium leading-relaxed text-slate-700 dark:text-white/75">{role.caption}</p>
                <ul className="space-y-3">
                  {role.checks.map((c, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-white/75">
                      <FiCheckCircle size={15} className="text-cyan-400 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right — phone mockup */}
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 rounded-[3rem] blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #00f0ff, transparent 70%)' }} />

              {/* Phone frame */}
              <div className="relative w-[220px] rounded-[2.8rem] p-[3px]" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.15), rgba(255,255,255,0.04))' }}>
                <div className="w-full rounded-[2.6rem] overflow-hidden" style={{ background: '#080e1f', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* Notch */}
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-16 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  {/* Screen */}
                  <div className="mx-2 mb-3 rounded-[1.8rem] overflow-hidden" style={{ height: '380px', background: '#0a1020' }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={active}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.3 }}
                        className="h-full"
                      >
                        <Screen />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {/* Home bar */}
                  <div className="flex justify-center pb-3">
                    <div className="w-20 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export function WhySection() {
  const benefits = [
    { title: 'Zero Hardware Needed', desc: 'Runs in any modern browser. No complex setup.', icon: FiSmartphone },
    { title: 'Secure & Reliable',    desc: 'Encrypted data and 99.9% uptime for your peace of mind.', icon: FiShield },
    { title: 'Fast Implementation', desc: 'Get your shop online and ready in under 10 minutes.', icon: FiClock },
    { title: 'Modern Experience',   desc: 'Impress your customers with a professional digital workflow.', icon: FiStar },
  ];

  return (
    <div className="py-32 bg-white/5 backdrop-blur-3xl border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 lg:mb-24">
          <h2 className="text-4xl lg:text-5xl font-black text-[#3B7597] tracking-tight">Why Choose WashWise?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {benefits.map((b, i) => (
            <div key={i} className="group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-white/5 group-hover:bg-cyan-500/10 transition-colors">
                <b.icon className="text-[#3B7597]/40 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" size={24} />
              </div>
              <h4 className="text-lg font-black text-[#3B7597] mb-3 tracking-tight">{b.title}</h4>
              <p className="text-slate-700 dark:text-white/75 text-sm font-medium leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
