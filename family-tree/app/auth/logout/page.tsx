// 'use client'
// import { useEffect } from 'react'
// import { useRouter } from 'next/navigation'

// export default function Logout() {
//   const router = useRouter()

//   useEffect(() => {
//     const logout = async () => {
//       try {
//         await fetch('/api/auth/logout', { method: 'POST' })

//         // Clear session
//         localStorage.removeItem('ft_logged_in')
//         localStorage.removeItem('supabase_session')
//         localStorage.setItem('ft_last_changed', String(Date.now()))
//         window.dispatchEvent(new Event('authChange'))

//         // --- Force redirect and wipe history ---
//         router.replace('/auth/login')
//         window.location.replace('/auth/login')

//         // Clear browser history stack
//         history.pushState(null, '', '/auth/login')
//         history.replaceState(null, '', '/auth/login')

//         // Listen for back button to redirect to login
//         window.addEventListener('popstate', () => {
//           router.replace('/auth/login')
//         })
//       } catch (e) {
//         console.error('Logout failed', e)
//       }
//     }

//     logout()
//   }, [router])

//   return (
//     <p style={{ textAlign: 'center', marginTop: '2rem' }}>
//       Logging out...
//     </p>
//   )
// }


// /app/auth/logout/page.tsx
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
