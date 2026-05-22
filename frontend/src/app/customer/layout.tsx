'use client';
import CustomerSidebar from '@/components/CustomerSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import Messenger from '@/components/Messenger';
import { FiHome, FiSend, FiList, FiUser } from 'react-icons/fi';

const mobileItems = [
  { label: 'Home',    path: '/customer/dashboard', icon: <FiHome /> },
  { label: 'Request', path: '/customer/request',   icon: <FiSend /> },
  { label: 'Orders',  path: '/customer/orders',    icon: <FiList /> },
  { label: 'Profile', path: '/customer/profile',   icon: <FiUser /> },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex welaund-bg min-h-screen">
      <CustomerSidebar />
      <main className="flex-1 md:ml-64 min-h-screen pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </main>
      <Messenger />
      <MobileBottomNav items={mobileItems} />
    </div>
  );
}

