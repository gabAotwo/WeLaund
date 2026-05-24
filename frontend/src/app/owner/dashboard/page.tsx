'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { FiTrendingUp, FiUsers, FiSettings, FiPackage, FiBarChart2, FiArrowRight, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';

interface OwnerStats {
  daily: number;
  monthly: any[];
  yearly: any[];
  stats: { total_staff: number; total_services: number; total_customers?: number; pending_customers?: number; };
}

const CARD = {
  background: 'rgba(10,20,50,0.72)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '1.25rem',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useRequireRole('owner');
  const [data, setData]     = useState<OwnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1); // 1-12
  const [calData,  setCalData]  = useState<Record<number, number>>({});
  const [calLoading, setCalLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetch('/api/owner/stats.php')
        .then(r => r.json())
        .then(res => { if (res.success) setData(res.data); setLoading(false); })
        .catch(() => setLoading(false));
      fetch('/api/owner/profile.php')
        .then(r => r.json())
        .then(res => { if (res.success) setPhotoUrl(res.data?.photo_url || null); })
        .catch(() => {});
    }
  }, [user]);

  const fetchCalendar = useCallback(async (y: number, m: number) => {
    setCalLoading(true);
    setSelectedDay(null);
    try {
      const res  = await fetch(`/api/owner/calendar.php?year=${y}&month=${m}`);
      const json = await res.json();
      if (json.success) {
        const map: Record<number, number> = {};
        json.data.forEach((d: any) => { map[d.day] = parseFloat(d.total); });
        setCalData(map);
      }
    } catch { } finally { setCalLoading(false); }
  }, []);

  useEffect(() => { if (user) fetchCalendar(calYear, calMonth); }, [user, calYear, calMonth, fetchCalendar]);

  const prevMonth = () => {
    if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); }
    else setCalMonth(m => m + 1);
  };

  if (authLoading || !user) return null;

  const currentMonthData = data?.monthly?.find(
    (m: any) => m.month === now.getMonth() + 1 && m.year === now.getFullYear()
  );
  const monthlyTotal = parseFloat(currentMonthData?.total || 0);
  const yearlyTotal  = parseFloat(data?.yearly?.[0]?.total || 0);
  const dailyTotal   = Number(data?.daily ?? 0);

  const statCards = [
    { label: 'Daily Income',   value: `₱${dailyTotal.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}`,   icon: FiTrendingUp, accent: '#00aeef' },
    { label: 'Monthly Income', value: `₱${monthlyTotal.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}`, icon: FiCalendar,   accent: '#8e66ff', sub: now.toLocaleString('default',{month:'long',year:'numeric'}) },
    { label: 'Total Staff',    value: data?.stats?.total_staff    || 0, icon: FiUsers,    accent: '#6366f1' },
    { label: 'Customers',      value: data?.stats?.total_customers || 0, icon: FiUsers,   accent: '#10b981', sub: `${data?.stats?.pending_customers||0} pending` },
    { label: 'Services',       value: data?.stats?.total_services  || 0, icon: FiPackage, accent: '#f59e0b' },
    { label: 'Yearly Total',   value: `₱${yearlyTotal.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}`,  icon: FiBarChart2,  accent: '#f43f5e' },
  ];

  // Build calendar grid
  const firstDay   = new Date(calYear, calMonth - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const maxIncome  = Math.max(...Object.values(calData), 1);
  const calMonthTotal = Object.values(calData).reduce((a, b) => a + b, 0);
  const selectedYear = now.getFullYear();
  const monthColors = ['#00aeef', '#6366f1', '#8e66ff', '#ec4899', '#f43f5e', '#f59e0b', '#22c55e', '#10b981', '#14b8a6', '#38bdf8', '#a78bfa', '#f97316'];
  const monthlySeries = MONTHS.map((name, index) => {
    const match = data?.monthly?.find((m: any) => Number(m.month) === index + 1 && Number(m.year) === selectedYear);
    return {
      month: name,
      short: name.slice(0, 3),
      total: parseFloat(match?.total || 0),
      color: monthColors[index],
    };
  });
  const monthlyYearTotal = monthlySeries.reduce((sum, m) => sum + m.total, 0);
  let segmentStart = 0;
  const monthlyGradient = monthlyYearTotal > 0
    ? monthlySeries.map(m => {
        const share = (m.total / monthlyYearTotal) * 100;
        const segment = `${m.color} ${segmentStart}% ${segmentStart + share}%`;
        segmentStart += share;
        return segment;
      }).join(', ')
    : 'rgba(255,255,255,0.12) 0% 100%';

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/20 shrink-0 bg-white/10">
            {photoUrl
              ? <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-white/40 font-black text-sm">
                  {user.first_name?.[0]?.toUpperCase()}
                </div>
            }
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white">Hello, {user.first_name}! 👋</h1>
            <p className="text-white/40 text-sm mt-0.5">Business Dashboard — {user.shop_name}</p>
          </div>
        </div>
        <Link href="/owner/settings">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <FiSettings size={14} /> Shop Settings
          </button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, icon: Icon, accent, sub }: any) => (
          <div key={label} className="p-4 hover:-translate-y-0.5 transition-transform" style={CARD}>
            <div className="p-2.5 rounded-xl inline-flex mb-3" style={{ background: `${accent}22`, color: accent }}>
              <Icon size={16} />
            </div>
            {loading
              ? <div className="h-6 w-16 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
              : <p className="text-lg font-black text-white leading-tight">{value}</p>
            }
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide mt-1">{label}</p>
            {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Calendar + Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Income Calendar ── */}
        <div className="lg:col-span-2 p-5" style={CARD}>

          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-white text-sm">Income Calendar</h3>
              <p className="text-[10px] text-white/30 mt-0.5">Daily income for each day</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
                <FiChevronLeft size={16} />
              </button>
              <span className="text-sm font-black text-white min-w-[120px] text-center">
                {MONTHS[calMonth - 1]} {calYear}
              </span>
              <button onClick={nextMonth}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Month total */}
          <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs font-bold text-white/40">Total for {MONTHS[calMonth-1]}</span>
            <span className="font-black text-white">
              ₱{calMonthTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-black text-white/25 uppercase py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          {calLoading ? (
            <div className="h-48 flex items-center justify-center text-white/30 text-sm">Loading...</div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day     = i + 1;
                const income  = calData[day] || 0;
                const hasIncome = income > 0;
                const intensity = hasIncome ? Math.max(0.15, income / maxIncome) : 0;
                const isToday = day === now.getDate() && calMonth === now.getMonth() + 1 && calYear === now.getFullYear();
                const isSelected = selectedDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className="relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all hover:scale-105"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg,#00aeef,#8e66ff)'
                        : hasIncome
                          ? `rgba(0,174,239,${intensity * 0.35})`
                          : 'rgba(255,255,255,0.03)',
                      border: isToday
                        ? '1px solid rgba(0,174,239,0.6)'
                        : '1px solid rgba(255,255,255,0.04)',
                      minHeight: '44px',
                    }}
                  >
                    <span className={`text-xs font-black ${isSelected ? 'text-white' : isToday ? 'text-cyan-400' : 'text-white/70'}`}>
                      {day}
                    </span>
                    {hasIncome && (
                      <span className={`text-[8px] font-bold leading-none mt-0.5 ${isSelected ? 'text-white/80' : 'text-cyan-400'}`}>
                        ₱{income >= 1000 ? `${(income/1000).toFixed(1)}k` : income.toFixed(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected day detail */}
          {selectedDay && (
            <div className="mt-4 px-4 py-3 rounded-xl flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,rgba(0,174,239,0.15),rgba(142,102,255,0.15))', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {MONTHS[calMonth-1]} {selectedDay}, {calYear}
                </p>
                <p className="font-black text-white text-lg mt-0.5">
                  ₱{(calData[selectedDay] || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <span className="text-[10px] font-black px-3 py-1 rounded-full"
                style={{ background: calData[selectedDay] ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', color: calData[selectedDay] ? '#34d399' : 'rgba(255,255,255,0.3)' }}>
                {calData[selectedDay] ? 'HAS INCOME' : 'NO INCOME'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Bar chart + Quick links */}
        <div className="space-y-5">

          {/* Monthly overview */}
          <div className="p-5" style={CARD}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-black text-white text-sm">Monthly Overview</h3>
                <p className="text-[10px] text-white/30 mt-0.5">All months in {selectedYear}</p>
              </div>
              <span className="text-[10px] font-black px-2 py-1 rounded-full text-cyan-200"
                style={{ background: 'rgba(0,174,239,0.14)' }}>
                {monthlySeries.filter(m => m.total > 0).length}/12 active
              </span>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative w-40 h-40 rounded-full shrink-0"
                style={{ background: `conic-gradient(${monthlyGradient})` }}>
                <div className="absolute inset-5 rounded-full flex flex-col items-center justify-center text-center"
                  style={{ background: 'rgba(10,20,50,0.96)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-[10px] font-bold text-white/35 uppercase">Year Total</span>
                  <span className="text-lg font-black text-white leading-tight">
                    â‚±{monthlyYearTotal.toLocaleString('en-PH', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2 w-full">
                {monthlySeries.map(m => (
                  <div key={m.month} className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} />
                        <span className="text-[10px] font-black text-white/55 uppercase truncate">{m.short}</span>
                      </div>
                      <span className="text-[10px] font-bold text-white/40 shrink-0">
                        â‚±{m.total >= 1000 ? `${(m.total / 1000).toFixed(1)}k` : m.total.toFixed(0)}
                      </span>
                    </div>
                    <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${monthlyYearTotal ? Math.max((m.total / monthlyYearTotal) * 100, m.total > 0 ? 3 : 0) : 0}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legacy monthly bars retained for reference but hidden */}
          <div className="hidden" style={CARD}>
            <h3 className="font-black text-white text-sm mb-4">Monthly Overview</h3>
            <div className="h-36 flex items-end gap-1 overflow-x-auto pb-2">
              {data?.monthly?.length ? (
                [...data.monthly].slice(0, 12).reverse().map((m: any, i: number) => {
                  const max = Math.max(...data.monthly.map((x: any) => parseFloat(x.total)), 1);
                  const h   = Math.max((parseFloat(m.total) / max) * 100, 4);
                  const cur = m.month === now.getMonth() + 1 && m.year === now.getFullYear();
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-[20px] group">
                      <div className="relative w-full">
                        <div className="w-full rounded-t-md transition-all"
                          style={{ height: `${(h/100)*144}px`, background: cur ? 'linear-gradient(180deg,#00aeef,#8e66ff)' : 'rgba(255,255,255,0.12)' }}>
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none"
                            style={{ background: 'rgba(10,20,50,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            ₱{parseFloat(m.total).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className="text-[8px] font-bold text-white/25 uppercase">
                        {new Date(2000, m.month-1).toLocaleString('default',{month:'short'})}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex items-center justify-center text-white/20 text-xs italic">No data yet.</div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="p-5" style={CARD}>
            <h3 className="font-black text-white text-sm mb-3">Quick Links</h3>
            <div className="space-y-2">
              {[
                { label: 'Manage Staff',    href: '/owner/staff' },
                { label: 'View Customers',  href: '/owner/customers' },
                { label: 'Manage Services', href: '/owner/services' },
                { label: 'Pay Subscription', href: '/owner/subscription' },
                { label: 'Shop Settings',   href: '/owner/settings' },
              ].map(({ label, href }) => (
                <Link key={href} href={href}>
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/8 transition-all cursor-pointer"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="text-sm font-semibold text-white/70">{label}</span>
                    <FiArrowRight size={14} className="text-white/30" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
