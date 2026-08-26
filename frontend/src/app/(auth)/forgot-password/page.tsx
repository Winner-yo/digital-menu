'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, UtensilsCrossed } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If that email exists, a reset link was sent');
    } catch {
      toast.error('Could not send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-card-hover p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand mx-auto flex items-center justify-center mb-3">
            <UtensilsCrossed className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold">Reset password</h1>
        </div>
        {sent ? (
          <p className="text-sm text-gray-600 text-center">Check your inbox (and server logs in development) for the reset token.</p>
        ) : (
          <div className="space-y-4">
            <Input label="Email" type="email" leftIcon={<Mail className="w-4 h-4" />} value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <Button fullWidth loading={loading} onClick={submit}>Send reset link</Button>
          </div>
        )}
        <Link href="/login" className="block text-center text-sm text-primary-600 mt-6">Back to login</Link>
      </div>
    </div>
  );
}
