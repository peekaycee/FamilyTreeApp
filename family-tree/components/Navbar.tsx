'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Button from './Button'
import styles from './components.module.css'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const checkLoginStatus = () => {
    try {
      const flag = localStorage.getItem('ft_logged_in')
      if (flag === '1') {
        setLoggedIn(true)
        return
      }
    } catch (e) {}

    const cookies =
      typeof document !== 'undefined'
        ? document.cookie.split(';').map((c) => c.trim())
        : []
    const hasSession = cookies.some((c) => c.startsWith('familytree_session='))
    setLoggedIn(hasSession)
  }

  useEffect(() => {
    checkLoginStatus()

    const onAuthChange = () => setTimeout(checkLoginStatus, 120)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ft_last_changed') setTimeout(checkLoginStatus, 60)
    }

    window.addEventListener('authChange', onAuthChange)
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('authChange', onAuthChange)
      window.removeEventListener('storage', onStorage)
    }
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const drawer = drawerRef.current
      const hamburger = document.querySelector(`.${styles.hamburger}`)
      if (
        menuOpen &&
        drawer &&
        !drawer.contains(e.target as Node) &&
        !hamburger?.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    // use 'click' instead of 'mousedown' for better outside detection
    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [menuOpen])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error:', err)
    }

    try {
      localStorage.removeItem('ft_logged_in')
      localStorage.setItem('ft_last_changed', String(Date.now()))
    } catch (e) {}

    window.dispatchEvent(new Event('authChange'))
    router.push('/')
  }

  const toggleMenu = () => setMenuOpen(!menuOpen)
  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        {loggedIn ? (
          <Link href="/basic/homePage">TheFamilyTree</Link>
        ) : (
          <Link href="/">TheFamilyTree</Link>
        )}
      </div>

      {/* Desktop Links */}
      <div className={styles.links}>
        {loggedIn ? (
          <>
            <Link href="/basic/homePage">Home</Link>
            <Link href="/basic/stories">Our Story</Link>
            <Link href="/basic/members">Family Members</Link>
            <Link href="/basic/gallery">Gallery</Link>
            <Link href="/basic/legacy">Legacy</Link>
            <Link href="/basic/events">Events</Link>
            <Link href="/basic/memorials">Memorials</Link>
            <Link href="/basic/achievements">Achievements</Link>

            <Button
              onClick={handleLogout}
              tag={'Logout'}
              className={styles.logout}
            />
            <Link href='/basic/settings'>SetIcon</Link>
          </>
        ) : (
          <>
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/auth/login">Login</Link>
          </>
        )}
      </div>

      {/* Hamburger Icon */}
      <div className={styles.hamburger} onClick={toggleMenu}>
        {menuOpen ? <X size={28} /> : <Menu size={28} />}
      </div>

      {/* Slide-in Side Menu */}
      <div
        ref={drawerRef}
        className={`${styles.mobileDrawer} ${menuOpen ? styles.showDrawer : ''}`}
      >
        {loggedIn ? (
          <>
            <Link href="/basic/homePage" onClick={closeMenu}>Home</Link>
            <Link href="/basic/stories" onClick={closeMenu}>Our Story</Link>
            <Link href="/basic/members" onClick={closeMenu}>Family Members</Link>
            <Link href="/basic/gallery" onClick={closeMenu}>Gallery</Link>
            <Link href="/basic/legacy" onClick={closeMenu}>Legacy</Link>
            <Link href="/basic/events" onClick={closeMenu}>Events</Link>
            <Link href="/basic/memorials" onClick={closeMenu}>Memorials</Link>
            <Link href="/basic/achievements" onClick={closeMenu}>Achievements</Link>
            <button
              onClick={() => { handleLogout(); closeMenu(); }}
              className={styles.mobileLogout}
              id={styles.navMobileLogout}
            >
              Logout
            </button>
            <Link href='/basic/settings' onClick={closeMenu}>Settings</Link>
          </>
        ) : (
          <>
            <Link href="/" onClick={closeMenu}>Home</Link>
            <Link href="/about" onClick={closeMenu}>About</Link>
            <Link href="/contact" onClick={closeMenu}>Contact</Link>
            <Link href="/auth/login" onClick={closeMenu}>Login</Link>
          </>
        )}
      </div>
    </nav>
  )
}
