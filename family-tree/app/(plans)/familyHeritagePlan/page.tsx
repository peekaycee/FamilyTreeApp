'use client'
import styles from '../plans.module.css'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../../../components/Button'

export default function Register() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [number, setNumber] = useState('')

  const submitPlanForm = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !number.trim()) {
      alert('Please fill out all fields before submitting.')
      return
    }

    // ✅ Check login status accurately
    const isLoggedIn =
      typeof window !== 'undefined' &&
      localStorage.getItem('ft_logged_in') === '1' &&
      !!localStorage.getItem('ft_last_changed')

    if (isLoggedIn) {
      router.push('/homePage')
    } else {
      router.push('/')
    }
  }

  return (
    <section className={styles.authPage}>
      <div className={styles.Container}>
        <h2>Family Heritage Plan</h2>
        <form className={styles.form} onSubmit={submitPlanForm}>
          <input
            type="text"
            value={"Family Heritage Plan"}
            readOnly
          />
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
            type="text"
            placeholder="Phone Number"
            value={number}
            onChange={e => setNumber(e.target.value)}
            required
          />
          <Button type="submit" tag="Subscribe" />
        </form>
      </div>
    </section>
  )
}
