'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        // Call your API route
        await fetch('/api/auth/logout', { method: 'POST' });

        // Clear client-side storage
        localStorage.removeItem('ft_logged_in');
        localStorage.removeItem('supabase_session');
        localStorage.setItem('ft_last_changed', String(Date.now()));
        window.dispatchEvent(new Event('authChange'));
      } catch (err) {
        console.error('Logout error:', err);
      }

      // Redirect to login
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
