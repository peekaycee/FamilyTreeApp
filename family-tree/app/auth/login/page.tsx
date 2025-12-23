/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../auth.module.css'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await res.json().catch(() => ({}))
      setLoading(false)

      if (!res.ok) {
        throw new Error(result?.message || 'Login failed')
      }

      const { session } = result

      // ✅ Store Supabase session if available
      if (session) {
        localStorage.setItem('supabase_session', JSON.stringify(session)) // <-- save session
        localStorage.setItem('ft_logged_in', '1')
        localStorage.setItem('ft_last_changed', String(Date.now()))
        window.dispatchEvent(new Event('authChange')) // <-- notify FamilyBuilder
      }


      localStorage.setItem('ft_logged_in', '1')
      localStorage.setItem('ft_last_changed', String(Date.now()))
      window.dispatchEvent(new Event('authChange'))

      router.push('/basic/homePage')
      
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        type="email"
        placeholder="Email"
        required
        autoFocus
      />
      <input
        value={password}
        onChange={e => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in…' : 'Login'}
      </button>
      {error && <p className={styles.errorMessage}>{error}</p>}
    </form>
  )
}

export default function Login() {
  return (
    <section className={styles.authPage}>
      <div className={styles.Container}>
        <h2>Login to Your FamilyTree Account</h2>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginContent />
        </Suspense>
        <p>
          {/* Don&apos;t have an account? <a href="/auth/register">Register</a> */}
          Don&apos;t have an account? <a href="/plans">Register</a>
        </p>
      </div>
    </section>
  )
}
