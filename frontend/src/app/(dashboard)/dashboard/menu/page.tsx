'use client';
import { useEffect, useState } from 'react';
import { menuApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { formatETB } from '@/lib/utils';
import type { MenuCategory, MenuItem } from '@/types';

export default function MenuAdminPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [form, setForm] = useState({ name: '', nameAmharic: '', description: '', price: '', categoryId: '', preparationTime: '15', image: '' });
  const [catName, setCatName] = useState('');

  const load = () => {
    menuApi.getDashboardCategories().then((r) => setCategories(r.data.data || [])).catch(() => {});
    menuApi.getDashboardItems({ limit: 100 }).then((r) => setItems(r.data.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const saveItem = async () => {
    await menuApi.createItem({
      name: form.name,
      nameAmharic: form.nameAmharic || undefined,
      description: form.description,
      price: Number(form.price),
      categoryId: form.categoryId,
      preparationTime: Number(form.preparationTime) || 15,
      image: form.image || undefined,
    });
    setOpen(false);
    setForm({ name: '', nameAmharic: '', description: '', price: '', categoryId: '', preparationTime: '15', image: '' });
    load();
  };

  const saveCategory = async () => {
    await menuApi.createCategory({ name: catName });
    setCatOpen(false);
    setCatName('');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatOpen(true)}>Add category</Button>
          <Button onClick={() => setOpen(true)}>Add item</Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((c) => (
          <Badge key={c.id} variant="primary">{c.name}{c.nameAmharic ? ` · ${c.nameAmharic}` : ''}</Badge>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-gray-500">{item.category?.name}</p>
              </div>
              <p className="font-bold text-primary-600">{formatETB(item.price)}</p>
            </div>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
            <div className="mt-3 flex justify-between items-center">
              <Badge variant={item.isAvailable ? 'success' : 'danger'}>{item.isAvailable ? 'Available' : 'Unavailable'}</Badge>
              <Button size="xs" variant="outline" onClick={() => menuApi.toggleAvailability(item.id).then(load)}>
                Toggle
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="New menu item">
        <div className="p-5 space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <Input label="Amharic name" value={form.nameAmharic} onChange={(e) => setForm({ ...form, nameAmharic: e.target.value })} fullWidth />
          <TextArea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
          <Input label="Price (ETB)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} fullWidth />
          <Input label="Prep time (min)" type="number" value={form.preparationTime} onChange={(e) => setForm({ ...form, preparationTime: e.target.value })} fullWidth />
          <Input label="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} fullWidth />
          <label className="text-sm font-medium text-gray-700">Category</label>
          <select className="w-full border rounded-xl px-3 py-2.5 text-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
            <option value="">Select</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button fullWidth onClick={saveItem} disabled={!form.name || !form.price || !form.categoryId}>Save</Button>
        </div>
      </Modal>

      <Modal isOpen={catOpen} onClose={() => setCatOpen(false)} title="New category">
        <div className="p-5 space-y-3">
          <Input label="Category name" value={catName} onChange={(e) => setCatName(e.target.value)} fullWidth />
          <Button fullWidth onClick={saveCategory} disabled={!catName}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
