'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
        localStorage.removeItem('ft_logged_in')
        localStorage.removeItem('supabase_session')
        localStorage.setItem('ft_last_changed', String(Date.now()))
        window.dispatchEvent(new Event('authChange'))
        router.push('/auth/login')
      } catch (e) {
        console.error('Logout failed', e)
      }
    }
    logout()
  }, [router])

  return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Logging out...</p>
}
