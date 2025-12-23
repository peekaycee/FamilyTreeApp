/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../auth.module.css'

export default function Register() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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

      // ✅ Extract user/session from backend response
      const { user, session } = result

      // Save session in localStorage if it exists
      if (session) {
        localStorage.setItem('supabase_session', JSON.stringify(session))
      }

      localStorage.setItem('ft_logged_in', '1')
      localStorage.setItem('ft_last_changed', String(Date.now()))
      window.dispatchEvent(new Event('authChange'))

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <section className={styles.authPage}>
      <div className={styles.Container}>
        <h2>Create Your FamilyTree Account</h2>
        <form className={styles.form} onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
          {error && <p className={styles.errorMessage}>{error}</p>}
        </form>
        <p>
          Already have an account? <a href="/auth/login">Login</a>
        </p>
      </div>
    </section>
  )
}
