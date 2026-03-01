'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from '../auth.module.css'
import { setSession } from '@/utils/session'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  const pushToast = (message: string, type: 'success' | 'error' = 'error') => {
    const toast = document.createElement('div')
    toast.className = `${styles.toast} ${styles[type]}`
    toast.innerHTML = `<p>${message}</p>`
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 5500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      pushToast('Please fill all required fields.', 'error')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result?.message || 'Login failed')
      }

      if (result.session) {
        setSession(result.session)
      }

      pushToast('Login successful.', 'success')

      // ✅ single source of truth
      const target =
        next ||
        sessionStorage.getItem('auth:returnTo') ||
        '/basic/homePage'

      sessionStorage.removeItem('auth:returnTo')

      router.replace(target)
    } catch (err: any) {
      pushToast(err.message || 'Login failed.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.authPage}>
      <h2>Login</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
      <p>
        Don&apos;t have an account? <a href="/plans"><em>Choose a plan</em></a>
      </p>
    </section>
  )
}