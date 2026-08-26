'use client';
import { useCallback, useEffect, useState } from 'react';
import { orderApi } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatETB, formatTime, getOrderStatusColor, getOrderStatusLabel } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>('');

  const load = useCallback(() => {
    orderApi.getAll({ status: status || undefined, limit: 50 }).then((res) => {
      setOrders(res.data.data || []);
    }).catch(() => {});
  }, [status]);

  useEffect(() => { load(); const t = setInterval(load, 12000); return () => clearInterval(t); }, [load]);

  const advance = async (order: Order) => {
    const next = order.orderType === 'DELIVERY' && order.status === 'READY' ? 'OUT_FOR_DELIVERY' : NEXT[order.status];
    if (!next) return;
    await orderApi.updateStatus(order.id, next);
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-gray-500">Update status as tickets move through the kitchen</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setStatus('')} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${!status ? 'bg-primary-500 text-white' : 'bg-white border'}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${status === s ? 'bg-primary-500 text-white' : 'bg-white border'}`}>
            {getOrderStatusLabel(s)}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pay</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-gray-50">
                <td className="px-4 py-3">
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{formatTime(order.createdAt)}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{order.customerName}</p>
                  <p className="text-xs text-gray-400">{order.customerPhone}</p>
                </td>
                <td className="px-4 py-3">{order.orderType.replace('_', ' ')}</td>
                <td className="px-4 py-3 font-semibold">{formatETB(order.total)}</td>
                <td className="px-4 py-3 text-xs">{order.payment?.status || 'UNPAID'}</td>
                <td className="px-4 py-3"><Badge className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</Badge></td>
                <td className="px-4 py-3">
                  {NEXT[order.status] && (
                    <Button size="xs" onClick={() => advance(order)}>
                      {order.orderType === 'DELIVERY' && order.status === 'READY' ? 'Out for delivery' : getOrderStatusLabel(NEXT[order.status]!)}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-8 text-center text-gray-500 text-sm">No orders in this filter.</p>}
      </div>
    </div>
  );
}
