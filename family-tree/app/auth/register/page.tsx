/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../auth.module.css'

type ToastType = 'success' | 'error'

export default function Register() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  /* ================= TOAST ================= */
  const pushToast = (message: string, type: ToastType = 'error') => {
    const toast = document.createElement('div')
    toast.className = `${styles.toast} ${styles[type]}`
    toast.innerHTML = `<p>${message}</p>`
    document.body.appendChild(toast)

    setTimeout(() => toast.remove(), 3500)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    /* Required fields (toast only) */
    if (!name.trim() || !email.trim() || !password.trim()) {
      pushToast('Please fill all required fields.', 'error')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const result = await res.json().catch(() => ({}))
      setLoading(false)

      if (!res.ok) {
        throw new Error(result?.message || 'Registration failed')
      }

      const { session } = result

      if (session) {
        localStorage.setItem('supabase_session', JSON.stringify(session))
      }

      localStorage.setItem('ft_logged_in', '1')
      localStorage.setItem('ft_last_changed', String(Date.now()))
      window.dispatchEvent(new Event('authChange'))

      pushToast('Account created successfully.', 'success')
      router.push('/dashboard')
    } catch (err: any) {
      pushToast(err.message || 'Registration failed', 'error')
      setLoading(false)
    }
  }

  return (
    <section className={styles.authPage}>
      <h2>Create Your Account</h2>

      <div className={styles.Container}>
        <form className={styles.form} onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />

          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>

        <p>
          Already have an account? <a href="/auth/login">Login</a>
        </p>
      </div>
    </section>
  )
}
