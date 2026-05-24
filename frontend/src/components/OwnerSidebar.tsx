'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiHome, FiUsers, FiUserCheck, FiSettings, FiPackage, FiCreditCard, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import MobileSidebarWrapper from './MobileSidebarWrapper';
import ThemeToggle from './ThemeToggle';


const menuItems = [
  { name: 'Dashboard', path: '/owner/dashboard',  icon: FiHome },
  { name: 'Staff',     path: '/owner/staff',       icon: FiUsers },
  { name: 'Customers', path: '/owner/customers',   icon: FiUserCheck },
  { name: 'Services',  path: '/owner/services',    icon: FiPackage },
  { name: 'Billing',   path: '/owner/subscription', icon: FiCreditCard },
  { name: 'Settings',  path: '/owner/settings',    icon: FiSettings },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <MobileSidebarWrapper>
      <div className="w-64 h-screen flex flex-col shadow-none" style={{ background: 'rgba(10,20,50,0.95)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="bg-[#0a0f2e] rounded-xl px-4 py-2 inline-flex">
            <Image src="/logo.png" alt="WashWise" width={180} height={56} className="h-auto" style={{ width: 'auto' }} priority />
          </div>
        </div>

        {/* User badge */}
        {user && (
          <div className="mx-4 mt-4 mb-2 px-4 py-3 rounded-2xl border border-white/10 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="truncate">
              <p className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-widest">Owner</p>
              <p className="font-bold text-white text-sm truncate mt-0.5">{user.first_name} {user.last_name}</p>
              <p className="text-xs text-white/40 truncate">{user.shop_name}</p>
            </div>
            <ThemeToggle />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 pt-2 space-y-0.5 overflow-y-auto">
          {menuItems.map(({ name, path, icon: Icon }) => {
            const active = pathname === path || pathname.startsWith(path + '/');
            return (
              <Link key={path} href={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  active ? 'text-white' : 'text-white/50 hover:text-white hover:bg-white/8'
                }`}
                style={active ? { background: 'linear-gradient(90deg,#00aeef,#6366f1,#8e66ff)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' } : {}}
              >
                <Icon className="text-base shrink-0" />
                <span>{name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-red-400 hover:bg-white/8 transition-all duration-150"
          >
            <FiLogOut className="text-base shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </MobileSidebarWrapper>
  );
}
