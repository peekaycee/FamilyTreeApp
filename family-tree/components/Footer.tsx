/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import styles from './components.module.css'
import Link from 'next/link'
import Image from 'next/image'
import Logo from '../public/images/logo.png'
import FacebookIcon from '../public/images/facebook.svg'
import InstagramIcon from '../public/images/instagram.svg'
import TiktokIcon from '../public/images/tiktok.svg'
import Badge from '../public/images/badge.png'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Button from './Button'
import { ArrowUp } from 'lucide-react'
import useGlobalAuth from '@/app/hooks/useGlobalAuth'
import emailjs from '@emailjs/browser'
import { useRef, useState } from 'react'

type ToastType = 'success' | 'error'

export default function Footer() {
  const loggedIn = useGlobalAuth()
  const router = useRouter()

  /* ================= TOAST (REUSED SYSTEM) ================= */
  const pushToast = (message: string, type: ToastType = 'success') => {
    const toast = document.createElement('div')
    toast.className = `${styles.toast} ${styles[type]}`
    toast.innerHTML = `<p>${message}</p>`
    document.body.appendChild(toast)

    setTimeout(() => toast.remove(), 3500)
  }

  /* ================= NEWSLETTER ================= */
  const newsletterRef = useRef<HTMLFormElement | null>(null)
  const [sending, setSending] = useState(false)

  const handleNewsletterSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault()
    if (!newsletterRef.current) return

    /* Honeypot spam protection */
    const botField = (
      newsletterRef.current.querySelector(
        'input[name="company"]'
      ) as HTMLInputElement
    )?.value

    if (botField) return

    const emailInput = newsletterRef.current.querySelector(
      'input[name="user_email"]'
    ) as HTMLInputElement

    if (!emailInput?.value) {
      pushToast('Please enter a valid email address.', 'error')
      return
    }

    setSending(true)
    
    try {
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          user_email: emailInput.value,
          message: 'Newsletter subscription request',
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      )

      newsletterRef.current.reset()
      pushToast('You have successfully subscribed to our newsletter.')
    } catch (err) {
      console.error('Newsletter EmailJS error:', err)
      pushToast('Subscription failed. Please try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error:', err)
    }

    try {
      localStorage.removeItem('ft_logged_in')
      localStorage.setItem('ft_last_changed', String(Date.now()))
    } catch {}

    window.dispatchEvent(new Event('authChange'))
    router.push('/')
  }

  return (
    <section>
      <footer className={styles.footer}>
        {loggedIn ? (
          <>
            <div className={styles.footerContent}>
              <div className={styles.footerLogo}>
                <Link href="/basic/homePage">
                  <Image src={Logo} alt="Footer Logo" width={150} height={150} />
                </Link>
              </div>

              <div className={styles.navLinks}>
                <h3>Links</h3>
                <Link href="/basic/homePage">Home</Link>
                <Link href="/basic/stories">Our Story</Link>
                <Link href="/basic/legacy">Legacy</Link>
                <Link href="/basic/members">Family Album</Link>
                <Link href="/basic/achievements">Achievements</Link>
                <Link href="/basic/events">Ceremonies</Link>
                <Link href="/basic/memorials">Memorials</Link>
                <Link href="/basic/dashboard">Dashboard</Link>
                <Link href="/basic/settings">Settings</Link>
                <Button
                  onClick={handleLogout}
                  tag="Logout"
                  className={styles.logout}
                />
              </div>

              <div className={styles.footerText}>
                <p>
                  We Reserve Our Family Legacy and Follow Up on Our Linage and
                  Heritage.
                </p>
                <div className={styles.socials}>
                  <Link href="/" className={styles.socialsLink}>
                    <Image src={FacebookIcon} alt="Facebook" width={0} height={0} />
                  </Link>
                  <Link href="/" className={styles.socialsLink}>
                    <Image src={InstagramIcon} alt="Instagram" width={0} height={0} />
                  </Link>
                  <Link href="/" className={styles.socialsLink}>
                    <Image src={TiktokIcon} alt="Tiktok" width={0} height={0} />
                  </Link>
                </div>
                <p className={styles.connect}>
                  Connect With Us On Social Media.
                </p>
              </div>

              <div className={styles.footerPlanLogo}>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 2,
                    ease: 'easeInOut',
                    repeat: Infinity,
                  }}
                >
                  <Link href="/familyLegacyPlan">
                    <Image src={Badge} alt="Plan Badge" width={150} height={150} />
                  </Link>
                </motion.div>
                <p className={styles.upgrade}>
                  Click to upgrade to Family Legacy Plan for more features.
                </p>
              </div>

              <motion.div
                className={styles.moveUp}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              >
                <ArrowUp size={24} strokeWidth={2.5} />
              </motion.div>
            </div>

            <div className={styles.copyright}>
              <p>© 2025 TheFamilyTree - Produced By Homes &apos;N&apos; Codes.</p>
            </div>
          </>
        ) : (
          <>
            <div className={styles.footerContent}>
              <div className={styles.footerLogo}>
                <Link href="/">
                  <Image src={Logo} alt="Footer Logo" width={100} height={100} />
                </Link>
              </div>

              <div className={styles.navLinks}>
                <h3>Links</h3>
                <Link href="/">Home</Link>
                <Link href="/about">About</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/auth/login">Login</Link>
                <Link href="/auth/register">Register</Link>
                <Link href="/admin/password" className={styles.adminLink}>
                  Admin
                </Link>
              </div>

              <div className={styles.plans}>
                <h3>Plans</h3>
                <Link href="/familyHeritagePlan">Family Heritage</Link>
                <Link href="/familyLegacyPlan">Family Legacy</Link>
                <Link href="/familyPremiumPlan">Family Premium</Link>
              </div>

              <div className={styles.footerText}>
                <p>
                  Reserve Your Family Legacy and Follow Up on Your Linage and
                  Heritage.
                </p>

                <div className={styles.socials}>
                  <Link href="/" className={styles.socialsLink}>
                    <Image src={FacebookIcon} alt="Facebook" width={0} height={0} />
                  </Link>
                  <Link href="/" className={styles.socialsLink}>
                    <Image src={InstagramIcon} alt="Instagram" width={0} height={0} />
                  </Link>
                  <Link href="/" className={styles.socialsLink}>
                    <Image src={TiktokIcon} alt="Tiktok" width={0} height={0} />
                  </Link>
                </div>

                <p className={styles.connect}>
                  Connect With Us On Social Media.
                </p>

                {/* NEWSLETTER FORM */}
                <form
                  ref={newsletterRef}
                  className={styles.newsLetter}
                  onSubmit={handleNewsletterSubmit}
                >
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    className={styles.honeypot}
                  />

                  <input
                    type="email"
                    name="user_email"
                    placeholder="Add email to subscribe to our newsletter"
                    className={styles.subscribeEmail}
                  />
                  <input
                    type="submit"
                    value={sending ? 'Submitting…' : 'Submit'}
                    className={styles.subscribeSubmit}
                    disabled={sending}
                  />
                </form>
              </div>

              <motion.div
                className={styles.moveUp}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                onClick={() =>
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              >
                <ArrowUp size={24} strokeWidth={2.5} />
              </motion.div>
            </div>

            <div className={styles.copyright}>
              <p>© 2025 TheFamilyTree - Produced By Homes &apos;N&apos; Codes.</p>
            </div>
          </>
        )}
      </footer>
    </section>
  )
}
