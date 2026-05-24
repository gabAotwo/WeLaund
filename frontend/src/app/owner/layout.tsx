'use client';
import OwnerSidebar from '@/components/OwnerSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Messenger from '@/components/Messenger';
import { FiHome, FiUsers, FiUserCheck, FiPackage, FiCreditCard, FiSettings } from 'react-icons/fi';

const mobileItems = [
  { label: 'Home',     path: '/owner/dashboard', icon: <FiHome /> },
  { label: 'Staff',    path: '/owner/staff',      icon: <FiUsers /> },
  { label: 'Customers', path: '/owner/customers',  icon: <FiUserCheck /> },
  { label: 'Services', path: '/owner/services',   icon: <FiPackage /> },
  { label: 'Billing',  path: '/owner/subscription', icon: <FiCreditCard /> },
  { label: 'Settings', path: '/owner/settings',   icon: <FiSettings /> },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex welaund-bg min-h-screen">
      <OwnerSidebar />
      <main className="flex-1 md:ml-64 min-h-screen pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </main>
      <Messenger />
      <MobileBottomNav items={mobileItems} />
    </div>
  );
}

