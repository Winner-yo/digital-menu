'use client';
import { useEffect, useState } from 'react';
import { restaurantApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [form, setForm] = useState({
    name: '', nameAmharic: '', description: '', phone: '', address: '',
    taxRate: '15', serviceCharge: '10', minimumOrderAmount: '150',
  });
  const [tableNumber, setTableNumber] = useState('');

  useEffect(() => {
    restaurantApi.getProfile().then((r) => {
      const rest = r.data.data;
      setForm({
        name: rest.name || '',
        nameAmharic: rest.nameAmharic || '',
        description: rest.description || '',
        phone: rest.phone || '',
        address: rest.address || '',
        taxRate: String(rest.taxRate ?? 15),
        serviceCharge: String(rest.serviceCharge ?? 10),
        minimumOrderAmount: String(rest.minimumOrderAmount ?? 0),
      });
    }).catch(() => {});
  }, []);

  const save = async () => {
    await restaurantApi.updateProfile({
      ...form,
      taxRate: Number(form.taxRate),
      serviceCharge: Number(form.serviceCharge),
      minimumOrderAmount: Number(form.minimumOrderAmount),
    });
    toast.success('Profile updated');
  };

  return (
    <div className="space-y-5 max-w-xl">
      <h1 className="text-2xl font-bold">Restaurant settings</h1>
      <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
        <Input label="Amharic name" value={form.nameAmharic} onChange={(e) => setForm({ ...form, nameAmharic: e.target.value })} fullWidth />
        <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth />
        <Input label="Tax rate %" type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} fullWidth />
        <Input label="Service charge %" type="number" value={form.serviceCharge} onChange={(e) => setForm({ ...form, serviceCharge: e.target.value })} fullWidth />
        <Input label="Minimum order (ETB)" type="number" value={form.minimumOrderAmount} onChange={(e) => setForm({ ...form, minimumOrderAmount: e.target.value })} fullWidth />
        <Button onClick={save}>Save profile</Button>
      </div>
      <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
        <h2 className="font-semibold">Add table</h2>
        <Input label="Table number" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} fullWidth />
        <Button variant="outline" onClick={async () => {
          await restaurantApi.createTable({ tableNumber, capacity: 4 });
          toast.success('Table added');
          setTableNumber('');
        }}>Create table</Button>
      </div>
    </div>
  );
}
