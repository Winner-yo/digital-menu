'use client';
import { useEffect, useState } from 'react';
import { analyticsApi } from '@/lib/api';
import { formatETB } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import type { SalesData } from '@/types';

const COLORS = ['#ef7010', '#16a34a', '#2563eb', '#eab308', '#6b7280'];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('week');
  const [sales, setSales] = useState<SalesData[]>([]);
  const [payments, setPayments] = useState<Array<{ method: string; count: number; total: number }>>([]);
  const [top, setTop] = useState<Array<{ menuItemName: string; _sum: { quantity: number; totalPrice: number } }>>([]);

  useEffect(() => {
    analyticsApi.getSales(period).then((r) => setSales(r.data.data || [])).catch(() => {});
  }, [period]);

  useEffect(() => {
    analyticsApi.getPayments().then((r) => setPayments(r.data.data || [])).catch(() => {});
    analyticsApi.getTopItems(8).then((r) => setTop(r.data.data || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${period === p ? 'bg-primary-500 text-white' : 'bg-white border'}`}>{p}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-card p-5 h-80">
        <h2 className="font-semibold mb-3">Revenue trend</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip formatter={(v: number) => formatETB(v)} />
            <Bar dataKey="revenue" fill="#ef7010" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-5 h-72">
          <h2 className="font-semibold mb-3">Payment mix</h2>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={payments} dataKey="total" nameKey="method" outerRadius={80} label>
                {payments.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatETB(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="font-semibold mb-3">Top items</h2>
          <div className="space-y-2">
            {top.map((item) => (
              <div key={item.menuItemName} className="flex justify-between text-sm">
                <span>{item.menuItemName}</span>
                <span className="font-semibold">{item._sum?.quantity || 0} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
