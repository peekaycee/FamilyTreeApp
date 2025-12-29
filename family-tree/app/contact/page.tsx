'use client'

import { useRef, useState } from 'react'
import emailjs from '@emailjs/browser'
import styles from './contact.module.css'

type ToastType = 'success' | 'error'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const lastSentRef = useRef<number>(0)
  const formRef = useRef<HTMLFormElement | null>(null)

  /* ================= TOAST (LOCAL, NON-INTRUSIVE) ================= */
  const pushToast = (message: string, type: ToastType = 'success') => {
    const toast = document.createElement('div')
    toast.className = `${styles.toast} ${styles[type]}`
    toast.innerHTML = `<p>${message}</p>`
    document.body.appendChild(toast)

    setTimeout(() => toast.remove(), 3500)
  }

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formRef.current) return

    const form = formRef.current

    /* Required field validation (toast-based only) */
    const name = (form.querySelector('input[name="user_name"]') as HTMLInputElement)?.value.trim()
    const email = (form.querySelector('input[name="user_email"]') as HTMLInputElement)?.value.trim()
    const message = (form.querySelector('textarea[name="message"]') as HTMLTextAreaElement)?.value.trim()

    if (!name || !email || !message) {
      pushToast('Please fill in all required fields.', 'error')
      return
    }

    /* Honeypot (spam protection) */
    const botField = (form.querySelector(
      'input[name="company"]'
    ) as HTMLInputElement)?.value
    if (botField) return

    /* Rate limit: 1 submission per 30s */
    const now = Date.now()
    if (now - lastSentRef.current < 30000) {
      pushToast('Please wait before sending another message.', 'error')
      return
    }

    setLoading(true)

    try {
      await emailjs.sendForm(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        form,
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      )

      lastSentRef.current = now
      setSent(true)
      form.reset()
      pushToast('Message sent successfully.')
    } catch (err) {
      console.error('EmailJS error:', err)
      pushToast('Failed to send message. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1>Contact & Support</h1>

      {sent ? (
        <>
          <p>Thank you for contacting us and we&apos;ve received your message successfuly.</p>
          <p>We&apos;ll get back to you as soon as possible.</p>
        </>
      ) : (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={styles.form}
        >
          {/* Honeypot field (hidden) */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            className={styles.honeypot}
          />

          <input
            name="user_name"
            placeholder="Your name"
            autoFocus
          />

          <input
            name="user_email"
            type="email"
            placeholder="Email"
          />

          <textarea
            name="message"
            placeholder="How can we help?"
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}
    </div>
  )
}
