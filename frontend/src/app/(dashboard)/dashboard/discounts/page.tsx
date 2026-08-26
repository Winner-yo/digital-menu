'use client';
import { useEffect, useState } from 'react';
import { discountApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatETB } from '@/lib/utils';

interface Promo {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minimumOrder: number;
  isActive: boolean;
}

export default function DiscountsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', discountValue: '10', minimumOrder: '200' });

  const load = () => discountApi.getPromoCodes().then((r) => setPromos(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    await discountApi.createPromoCode({
      code: form.code,
      discountType: 'PERCENTAGE',
      discountValue: Number(form.discountValue),
      minimumOrder: Number(form.minimumOrder),
    });
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <Button onClick={() => setOpen(true)}>New promo code</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {promos.map((promo) => (
          <div key={promo.id} className="bg-white rounded-2xl shadow-card p-5">
            <p className="text-xl font-bold tracking-wider">{promo.code}</p>
            <p className="text-sm text-gray-500 mt-1">
              {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}% off` : formatETB(promo.discountValue)}
              {promo.minimumOrder ? ` · min ${formatETB(promo.minimumOrder)}` : ''}
            </p>
            <p className="text-xs mt-2">{promo.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        ))}
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create promo code">
        <div className="p-5 space-y-3">
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} fullWidth />
          <Input label="Percent off" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} fullWidth />
          <Input label="Minimum order (ETB)" type="number" value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })} fullWidth />
          <Button fullWidth onClick={save} disabled={!form.code}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
