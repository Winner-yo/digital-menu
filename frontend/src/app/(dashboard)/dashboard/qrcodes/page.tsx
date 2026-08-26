'use client';
import { useEffect, useState } from 'react';
import { qrApi, restaurantApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { Table } from '@/types';

interface QrRow {
  id: string;
  label?: string;
  url: string;
  scanCount: number;
  qrImage?: string;
  table?: { tableNumber: string };
}

export default function QrPage() {
  const [codes, setCodes] = useState<QrRow[]>([]);
  const [tables, setTables] = useState<Table[]>([]);

  const load = () => {
    qrApi.getAll().then((r) => setCodes(r.data.data || [])).catch(() => {});
    restaurantApi.getTables().then((r) => setTables(r.data.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">QR codes</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => qrApi.generate('Restaurant menu').then(load)}>Restaurant QR</Button>
          <Button onClick={() => qrApi.generateAll().then(load)}>All table QRs</Button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {tables.map((table) => (
          <Button key={table.id} size="sm" variant="outline" onClick={() => qrApi.generateTable(table.id).then(load)}>
            Table {table.tableNumber}
          </Button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {codes.map((code) => (
          <div key={code.id} className="bg-white rounded-2xl shadow-card p-5 text-center">
            <p className="font-semibold">{code.label || 'QR'}</p>
            <p className="text-xs text-gray-500 break-all mt-1">{code.url}</p>
            <p className="text-xs text-gray-400 mt-2">{code.scanCount} scans</p>
            <a href={code.url} target="_blank" rel="noreferrer" className="block mt-3 text-sm text-primary-600 font-medium">Open menu</a>
            <Button size="xs" variant="danger" className="mt-3" onClick={() => qrApi.deactivate(code.id).then(load)}>Deactivate</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
