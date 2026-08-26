'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Suspense } from 'react';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');

  const submit = async () => {
    await api.post('/auth/reset-password', { token, password });
    toast.success('Password updated');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white rounded-3xl shadow-card p-8 w-full max-w-md space-y-4">
        <h1 className="text-xl font-bold">Choose a new password</h1>
        <Input label="Reset token" value={token} onChange={(e) => setToken(e.target.value)} fullWidth />
        <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth />
        <Button fullWidth onClick={submit} disabled={!token || password.length < 8}>Update password</Button>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
