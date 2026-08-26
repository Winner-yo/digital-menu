'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { analyticsApi, orderApi } from '@/lib/api';
import { formatETB, timeAgo, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { DashboardStats, Order } from '@/types';
import { ClipboardList, Banknote, Clock, ChefHat } from 'lucide-react';

export default function DashboardHomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Order[]>([]);

  useEffect(() => {
    analyticsApi.getOverview().then((res) => setStats(res.data.data)).catch(() => {});
    orderApi.getStats().then((res) => setRecent(res.data.data.recentOrders || [])).catch(() => {});
  }, []);

  const cards = [
    { label: "Today's orders", value: stats?.today.orders ?? 0, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
    { label: "Today's revenue", value: formatETB(stats?.today.revenue ?? 0), icon: Banknote, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Pending', value: stats?.pendingOrders ?? 0, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'In kitchen', value: stats?.preparingOrders ?? 0, icon: ChefHat, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">Live snapshot of today&apos;s restaurant performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-card">
            <div className={cnIcon(card.color)}>
              <card.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 mt-3">{card.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Recent orders</h2>
            <Link href="/dashboard/orders" className="text-sm text-primary-600 font-medium">View all</Link>
          </div>
          <div className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
            {recent.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 border-b border-gray-50 pb-3">
                <div>
                  <p className="font-semibold text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{order.customerName} · {timeAgo(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatETB(order.total)}</p>
                  <Badge className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-bold mb-4">Popular this month</h2>
          <div className="space-y-3">
            {(stats?.popularItems || []).map((item) => (
              <div key={item.menuItemId} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-semibold">{item.orderCount}</span>
              </div>
            ))}
            {!stats?.popularItems?.length && <p className="text-sm text-gray-500">Orders will appear here.</p>}
          </div>
          {typeof stats?.unavailableItems === 'number' && stats.unavailableItems > 0 && (
            <p className="text-xs text-amber-700 mt-4">{stats.unavailableItems} items currently unavailable</p>
          )}
        </div>
      </div>
    </div>
  );
}

function cnIcon(color: string) {
  return `w-9 h-9 rounded-xl flex items-center justify-center ${color}`;
}
