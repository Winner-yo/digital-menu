'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('Verifying payment…');
  const orderNumber = params.get('orderNumber');
  const referenceId = params.get('referenceId') || params.get('tx_ref');

  useEffect(() => {
    const run = async () => {
      if (referenceId) {
        try {
          const res = await paymentApi.verify(referenceId);
          setMessage(res.data.data?.paid ? 'Payment confirmed' : 'Payment is still pending');
        } catch {
          setMessage('Could not verify payment yet');
        }
      } else {
        setMessage('Payment callback received');
      }
    };
    run();
  }, [referenceId]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-card p-8 max-w-sm w-full text-center space-y-4">
        <h1 className="text-xl font-bold">{message}</h1>
        {orderNumber && (
          <Button fullWidth onClick={() => router.push(`/order-tracking/${orderNumber}`)}>Track order</Button>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
