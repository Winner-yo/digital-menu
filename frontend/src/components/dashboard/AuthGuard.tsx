'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);
    if (useAuthStore.persist.hasHydrated()) finish();
    const unsub = useAuthStore.persist.onFinishHydration(finish);
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated && !accessToken) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, accessToken, router]);

  if (!hydrated || (!isAuthenticated && !accessToken)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
}

