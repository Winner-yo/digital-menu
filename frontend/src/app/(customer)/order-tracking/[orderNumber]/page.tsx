'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { orderApi, reviewApi } from '@/lib/api';
import { formatETB, getOrderStatusLabel } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import type { Order, OrderStatus } from '@/types';
import toast from 'react-hot-toast';

const STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED'];

export default function TrackOrderPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!orderNumber) return;
    const load = () => orderApi.track(orderNumber).then((r) => setOrder(r.data.data)).catch(() => {});
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [orderNumber]);

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Looking up order…</div>;
  }

  const idx = STEPS.indexOf(order.status === 'CANCELLED' ? 'PENDING' : order.status);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Track order</h1>
      <p className="text-sm text-gray-500 mt-1">{order.orderNumber} · {order.restaurant?.name}</p>
      <div className="bg-white rounded-2xl shadow-card p-5 mt-5">
        <p className="font-semibold mb-4">{getOrderStatusLabel(order.status)}</p>
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={step} className={`flex items-center gap-3 text-sm ${i <= idx && order.status !== 'CANCELLED' ? 'text-primary-700 font-semibold' : 'text-gray-400'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${i <= idx && order.status !== 'CANCELLED' ? 'bg-primary-500' : 'bg-gray-200'}`} />
              {getOrderStatusLabel(step)}
            </li>
          ))}
        </ol>
        {order.status === 'CANCELLED' && <p className="text-red-600 text-sm mt-3">This order was cancelled.</p>}
      </div>
      <div className="bg-white rounded-2xl shadow-card p-5 mt-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1">
            <span>{item.quantity}× {item.menuItemName}</span>
            <span>{formatETB(item.totalPrice)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold mt-3 pt-3 border-t">
          <span>Total</span>
          <span>{formatETB(order.total)}</span>
        </div>
      </div>
      {order.status === 'COMPLETED' && (
        <div className="bg-white rounded-2xl shadow-card p-5 mt-4 space-y-3">
          <h2 className="font-semibold">Rate your experience</h2>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className={n <= rating ? 'text-amber-500' : 'text-gray-300'}>★</button>
            ))}
          </div>
          <TextArea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the food?" fullWidth />
          <Button onClick={async () => {
            await reviewApi.submit({
              restaurantId: order.restaurantId,
              orderId: order.id,
              target: 'RESTAURANT',
              rating,
              comment,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
            });
            toast.success('Thanks for the review');
          }}>Submit review</Button>
        </div>
      )}
      <Link href="/" className="block text-center text-sm text-primary-600 mt-6">Back home</Link>
    </div>
  );
}
