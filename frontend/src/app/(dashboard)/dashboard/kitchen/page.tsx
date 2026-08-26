'use client';
import { useCallback, useEffect, useState } from 'react';
import { orderApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { formatETB, timeAgo } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const KITCHEN: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(() => {
    orderApi.getAll({ limit: 40 }).then((res) => {
      const list = (res.data.data || []) as Order[];
      setOrders(list.filter((o) => KITCHEN.includes(o.status)));
    }).catch(() => {});
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  const bump = async (order: Order, status: OrderStatus) => {
    await orderApi.updateStatus(order.id, status);
    load();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Kitchen display</h1>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-card p-5 border-t-4 border-primary-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xl font-bold">{order.orderNumber}</p>
                <p className="text-sm text-gray-500">{order.orderType.replace('_', ' ')} · {timeAgo(order.createdAt)}</p>
              </div>
              <span className="text-xs font-semibold bg-orange-50 text-orange-700 px-2 py-1 rounded-full">{order.status}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {order.items?.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}× {item.menuItemName}</span>
                  <span className="text-gray-400">{formatETB(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
            {order.notes && <p className="mt-3 text-xs bg-amber-50 text-amber-800 rounded-lg p-2">{order.notes}</p>}
            <div className="mt-4 flex gap-2">
              {order.status === 'PENDING' && <Button fullWidth onClick={() => bump(order, 'CONFIRMED')}>Confirm</Button>}
              {order.status === 'CONFIRMED' && <Button fullWidth onClick={() => bump(order, 'PREPARING')}>Start prep</Button>}
              {order.status === 'PREPARING' && <Button fullWidth onClick={() => bump(order, 'READY')}>Mark ready</Button>}
            </div>
          </div>
        ))}
      </div>
      {orders.length === 0 && <p className="text-gray-500">Kitchen is clear.</p>}
    </div>
  );
}
