'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession } from '@/utils/session'; // <-- import helper

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        clearSession(); // <-- clear session properly
      } catch (err) {
        console.error('Logout error:', err);
      }

      router.replace('/auth/login');
    };

    logout();
  }, [router]);

  return (
    <p style={{ textAlign: 'center', marginTop: '2rem' }}>
      Logging out...
    </p>
  );
}
