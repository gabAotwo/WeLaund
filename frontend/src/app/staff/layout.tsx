'use client';
import StaffSidebar from '@/components/StaffSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Messenger from '@/components/Messenger';
import { FiHome, FiPlusCircle, FiList, FiCheckCircle, FiSettings } from 'react-icons/fi';

const mobileItems = [
  { label: 'Home',      path: '/staff/dashboard',  icon: <FiHome /> },
  { label: 'New',       path: '/staff/orders/new', icon: <FiPlusCircle /> },
  { label: 'Orders',    path: '/staff/orders',     icon: <FiList /> },
  { label: 'Approvals', path: '/staff/customers',  icon: <FiCheckCircle /> },
  { label: 'Settings',  path: '/staff/settings',   icon: <FiSettings /> },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex welaund-bg min-h-screen">
      <StaffSidebar />
      <main className="flex-1 md:ml-64 min-h-screen pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </main>
      <Messenger />
      <MobileBottomNav items={mobileItems} />
    </div>
  );
}

