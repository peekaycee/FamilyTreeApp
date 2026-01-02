// 'use client'

// import { useState, Suspense } from 'react'
// import { useRouter } from 'next/navigation'
// import styles from '../auth.module.css'

// type ToastType = 'success' | 'error'

// function LoginContent() {
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [loading, setLoading] = useState(false)
//   const router = useRouter()

//   /* ================= TOAST ================= */
//   const pushToast = (message: string, type: ToastType = 'error') => {
//     const toast = document.createElement('div')
//     toast.className = `${styles.toast} ${styles[type]}`
//     toast.innerHTML = `<p>${message}</p>`
//     document.body.appendChild(toast)

//     setTimeout(() => toast.remove(), 3500)
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     /* Soft validation via toast only */
//     if (!email.trim() || !password.trim()) {
//       pushToast('Please fill all required fields.', 'error')
//       return
//     }

//     setLoading(true)

//     try {
//       const res = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//       })

//       const result = await res.json().catch(() => ({}))
//       setLoading(false)

//       if (!res.ok) {
//         throw new Error(result?.message || 'Login failed')
//       }

//       const { session } = result

//       if (session) {
//         localStorage.setItem('supabase_session', JSON.stringify(session))
//         localStorage.setItem('ft_logged_in', '1')
//         localStorage.setItem('ft_last_changed', String(Date.now()))
//         window.dispatchEvent(new Event('authChange'))
//       }

//       localStorage.setItem('ft_logged_in', '1')
//       localStorage.setItem('ft_last_changed', String(Date.now()))
//       window.dispatchEvent(new Event('authChange'))

//       pushToast('Login successful.', 'success')

//       /* Preserve navigation logic */
//       setTimeout(() => {
//         router.push('/basic/homePage')
//       }, 1200)

//     } catch {
//       pushToast('Login failed. Please check your credentials.', 'error')
//       setLoading(false)
//     }
//   }

//   return (
//     <form className={styles.form} onSubmit={handleSubmit}>
//       <input
//         value={email}
//         onChange={e => setEmail(e.target.value)}
//         type="text"
//         placeholder="Email"
//         autoFocus
//       />

//       <input
//         value={password}
//         onChange={e => setPassword(e.target.value)}
//         type="password"
//         placeholder="Password"
//       />

//       <button type="submit" disabled={loading}>
//         {loading ? 'Logging in…' : 'Login'}
//       </button>
//     </form>
//   )
// }

// export default function Login() {
//   return (
//     <section className={styles.authPage}>
//       <h2>Login to Your Account</h2>

//       <div className={styles.Container}>
//         <Suspense fallback={<div>Loading...</div>}>
//           <LoginContent />
//         </Suspense>

//         <p>
//           {/* Don&apos;t have an account? <a href="/auth/register">Register</a> */}
//           Don&apos;t have an account? <a href="/plans">Register</a>
//         </p>
//       </div>
//     </section>
//   )
// }


'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../auth.module.css'
import { setSession } from '@/utils/session'  // <-- import helper

type ToastType = 'success' | 'error'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  /* ================= TOAST ================= */
  const pushToast = (message: string, type: ToastType = 'error') => {
    const toast = document.createElement('div')
    toast.className = `${styles.toast} ${styles[type]}`
    toast.innerHTML = `<p>${message}</p>`
    document.body.appendChild(toast)

    setTimeout(() => toast.remove(), 3500)
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
      })

      const result = await res.json().catch(() => ({}))
      setLoading(false)

      if (!res.ok) {
        throw new Error(result?.message || 'Login failed')
      }

      const { session } = result

      if (session) {
        setSession(session)  // <-- central session storage
      }

      pushToast('Login successful.', 'success')

      setTimeout(() => {
        router.push('/basic/homePage')
      }, 1200)

    } catch {
      pushToast('Login failed. Please check your credentials.', 'error')
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        type="text"
        placeholder="Email"
        autoFocus
      />
      <input
        value={password}
        onChange={e => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in…' : 'Login'}
      </button>
    </form>
  )
}

export default function Login() {
  return (
    <section className={styles.authPage}>
      <h2>Login to Your Account</h2>
      <div className={styles.Container}>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginContent />
        </Suspense>
        <p>
          Don&apos;t have an account? <a href="/plans">Register</a>
        </p>
      </div>
    </section>
  )
}
