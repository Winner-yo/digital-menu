'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, ChefHat, UtensilsCrossed, QrCode,
  BarChart3, Star, Percent, Settings, LogOut, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { cn, generateInitials } from '@/lib/utils';
import { AuthGuard } from './AuthGuard';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/dashboard/kitchen', label: 'Kitchen', icon: ChefHat },
  { href: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/dashboard/qrcodes', label: 'QR Codes', icon: QrCode },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/reviews', label: 'Reviews', icon: Star },
  { href: '/dashboard/discounts', label: 'Promotions', icon: Percent },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const name = user ? `${user.firstName} ${user.lastName}` : 'Owner';

  const onLogout = () => {
    logout();
    router.push('/login');
  };

  const NavLinks = () => (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-100 py-6">
          <div className="px-5 mb-8">
            <p className="font-display font-bold text-lg text-gray-900">Ethiopian Menu</p>
            <p className="text-xs text-gray-500">Restaurant dashboard</p>
          </div>
          <NavLinks />
          <div className="px-3 mt-auto">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50">
              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                {generateInitials(name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
            <p className="font-bold">Dashboard</p>
            <button onClick={() => setOpen((v) => !v)} className="p-2 rounded-lg hover:bg-gray-100">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </header>
          {open && (
            <div className="lg:hidden fixed inset-0 z-40 bg-white pt-16">
              <NavLinks />
              <div className="px-3 mt-6">
                <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}
          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
