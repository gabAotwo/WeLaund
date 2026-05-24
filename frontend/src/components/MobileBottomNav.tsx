'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiLogOut } from 'react-icons/fi';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface Props {
  items: NavItem[];
}

export default function MobileBottomNav({ items }: Props) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav
      className="fixed bottom-0 left-0 w-full z-50 md:hidden flex justify-around items-center px-2"
      style={{
        height: '65px',
        background: 'rgba(10,20,50,0.82)',
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
        borderTop: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '20px 20px 0 0',
      }}
    >
      {items.map(({ label, path, icon }) => {
        const active = pathname === path || pathname.startsWith(path + '/');
        return (
          <Link key={path} href={path} className="flex flex-col items-center gap-1 flex-1 min-w-0 py-1 relative">
            {active && (
              <span
                className="absolute -top-0.5 w-6 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(90deg,#00aeef,#8e66ff)' }}
              />
            )}
            <span
              className="text-xl transition-all duration-200"
              style={active ? {
                filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.8))',
                background: 'linear-gradient(90deg,#00aeef,#8e66ff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transform: 'scale(1.15)',
                display: 'inline-block',
              } : { color: 'rgba(255,255,255,0.4)' }}
            >
              {icon}
            </span>
            <span
              className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wide transition-colors duration-200 truncate max-w-full px-0.5"
              style={{ color: active ? '#00aeef' : 'rgba(255,255,255,0.3)' }}
            >
              {label}
            </span>
          </Link>
        );
      })}

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="flex flex-col items-center gap-1 flex-1 min-w-0 py-1"
      >
        <span className="text-xl" style={{ color: 'rgba(248,113,113,0.7)' }}>
          <FiLogOut />
        </span>
        <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wide truncate max-w-full px-0.5" style={{ color: 'rgba(248,113,113,0.6)' }}>
          Logout
        </span>
      </button>
    </nav>
  );
}
