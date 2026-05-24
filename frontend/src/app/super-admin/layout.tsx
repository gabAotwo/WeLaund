'use client';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import SuperAdminNotifications from '@/components/SuperAdminNotifications';
import { FiHome, FiShoppingBag, FiUsers, FiCreditCard, FiShield } from 'react-icons/fi';

const mobileItems = [
  { label: 'Home',      path: '/super-admin/dashboard', icon: <FiHome /> },
  { label: 'Shops',     path: '/super-admin/shops',     icon: <FiShoppingBag /> },
  { label: 'Owners',    path: '/super-admin/owners',    icon: <FiUsers /> },
  { label: 'Billing',   path: '/super-admin/subscriptions', icon: <FiCreditCard /> },
  { label: 'Admins',    path: '/super-admin/admins',    icon: <FiShield /> },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex welaund-bg min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen pt-14 md:pt-0 pb-16 md:pb-0 relative flex flex-col">
        <SuperAdminNotifications />
        <div className="flex-1 overflow-y-auto w-full">
          {children}
        </div>
      </main>
      <MobileBottomNav items={mobileItems} />
    </div>
  );
}

