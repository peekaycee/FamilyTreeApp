'use client'

import styles from '../plans.module.css'
import { useRef, useState } from 'react'
import Button from '../../../components/Button'
import emailjs from '@emailjs/browser'

type ToastType = 'success' | 'error'

export default function Register() {
  const formRef = useRef<HTMLFormElement | null>(null)

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const lastSentRef = useRef<number>(0)

  /* ================= TOAST ================= */
  const pushToast = (message: string, type: ToastType = 'success') => {
    const toast = document.createElement('div')
    toast.className = `${styles.toast} ${styles[type]}`
    toast.innerHTML = `<p>${message}</p>`
    document.body.appendChild(toast)

    setTimeout(() => toast.remove(), 3500)
  }

  /* ================= SUBMIT ================= */
  const submitPlanForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formRef.current) return

    /* Honeypot spam protection */
    const botField = (formRef.current.querySelector(
      'input[name="company"]'
    ) as HTMLInputElement)?.value
    if (botField) return

    /* Manual validation (toast only) */
    const name = (formRef.current.querySelector(
      'input[name="user_name"]'
    ) as HTMLInputElement)?.value.trim()

    const email = (formRef.current.querySelector(
      'input[name="user_email"]'
    ) as HTMLInputElement)?.value.trim()

    const phone = (formRef.current.querySelector(
      'input[name="phone"]'
    ) as HTMLInputElement)?.value.trim()

    if (!name || !email || !phone) {
      pushToast('Please fill in all fields.', 'error')
      return
    }

    /* Rate limit (30s) */
    const now = Date.now()
    if (now - lastSentRef.current < 30000) {
      pushToast('Please wait before submitting again.', 'error')
      return
    }

    /* EmailJS env guard */
    if (
      !process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ||
      !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ||
      !process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
    ) {
      pushToast('Service temporarily unavailable.', 'error')
      return
    }

    setLoading(true)

    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        {
          plan: 'Family Legacy Plan',
          user_name: name,
          user_email: email,
          phone,
          message: 'New Family Legacy Plan subscription request',
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      )

      lastSentRef.current = now
      setSubmitted(true)
      formRef.current.reset()

      pushToast('Subscription request sent successfully.')
    } catch (err) {
      console.error('EmailJS error:', err)
      pushToast('Failed to submit request. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className={styles.authPage}>
      {!submitted && <h2>Family Legacy Plan</h2>}
        {submitted ? (
          <div className={styles.acknowledge}>
            <h3>Thank you for your interest</h3>
            <p>
              We have received your subscription request for the
              <strong> Family Legacy Plan</strong>.  
              Our team will contact you shortly with the next steps.
            </p>
          </div>
        ) : (
          <div className={styles.Container}>
            <form
              ref={formRef}
              className={styles.form}
              onSubmit={submitPlanForm}
            >
              {/* Honeypot (hidden) */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                className={styles.honeypot}
              />

              {/* Prefilled, must remain */}
              <input
                type="text"
                name="plan"
                value="Family Legacy Plan"
                readOnly
              />

              <input
                type="text"
                name="user_name"
                placeholder="Full Name"
                autoFocus
              />

              <input
                type="email"
                name="user_email"
                placeholder="Email"
              />

              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
              />

              <Button
                type="submit"
                tag={loading ? 'Submitting…' : 'Subscribe'}
              />
            </form>
          </div>
        )}
    </section>
  )
}
