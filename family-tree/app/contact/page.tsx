'use client'
import { useState } from 'react'
import styles from './contact.module.css'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSent(true)
  }
  return (
    <div className={styles.container}>
      <h1>Contact & Support</h1>
      <p>For help, send us a message and we'll get back to you.</p>
      {sent ? <p>Thanks — we'll reply soon.</p> : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <input placeholder="Your name" required autoFocus/>
          <input placeholder="Email" type="email" required/>
          <textarea placeholder="How can we help?" required/>
          <button type="submit">Send</button>
        </form>
      )}
    </div>
  )
}
