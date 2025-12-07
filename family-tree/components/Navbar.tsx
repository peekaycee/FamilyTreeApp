/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import Logo from '../public/images/logo.png';
import styles from './components.module.css'
import Button from './Button'
import useGlobalAuth from "@/app/hooks/useGlobalAuth";


export default function Navbar() {
  // const [loggedIn, setLoggedIn] = useState(false)
  const loggedIn = useGlobalAuth();
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Check login status
  // const checkLoginStatus = () => {
  //   try {
  //     const flag = localStorage.getItem('ft_logged_in')
  //     if (flag === '1') { setLoggedIn(true); return }
  //   } catch {}
  //   const cookies =
  //     typeof document !== 'undefined'
  //       ? document.cookie.split(';').map(c => c.trim())
  //       : []
  //   const hasSession = cookies.some(c => c.startsWith('familytree_session='))
  //   setLoggedIn(hasSession)
  // }

  // useEffect(() => {
  //   checkLoginStatus()
  //   const onAuthChange = () => setTimeout(checkLoginStatus, 120)
  //   const onStorage = (e: StorageEvent) => {
  //     if (e.key === 'ft_last_changed') setTimeout(checkLoginStatus, 60)
  //   }
  //   window.addEventListener('authChange', onAuthChange)
  //   window.addEventListener('storage', onStorage)
  //   return () => {
  //     window.removeEventListener('authChange', onAuthChange)
  //     window.removeEventListener('storage', onStorage)
  //   }
  // }, [pathname])

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const drawer = drawerRef.current
      const hamburger = document.querySelector(`.${styles.hamburger}`)
      if (
        menuOpen &&
        drawer &&
        !drawer.contains(e.target as Node) &&
        !hamburger?.contains(e.target as Node)
      ) setMenuOpen(false)
    }
    // document.addEventListener('click', handleClickOutside, true)
    // return () => document.removeEventListener('click', handleClickOutside, true)
  }, [menuOpen])

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    try {
      localStorage.removeItem('ft_logged_in')
      localStorage.setItem('ft_last_changed', String(Date.now()))
    } catch {}
    localStorage.setItem("ft_last_changed", String(Date.now()));
    window.dispatchEvent(new Event("authChange"));
    router.push('/')
  }

  const toggleMenu = () => setMenuOpen(!menuOpen)
  const toggleDropdown = (name: string) =>
    setDropdownOpen(dropdownOpen === name ? null : name)
  const closeMenu = () => setMenuOpen(false)

  // Nav items for logged in users
  const navItems = loggedIn
    ? [
        { name: 'Home', href: '/basic/homePage' },
        {
          name: 'About',
          children: [
            { name: 'Our Story', href: '/basic/stories' },
            { name: 'Legacy', href: '/basic/legacy' },
          ],
        },
        {
          name: 'Gallery',
          children: [
            // { name: 'Album', href: '/basic/gallery' },
            { name: 'Family Album', href: '/basic/members' },
            { name: 'Achievements', href: '/basic/achievements' },
          ],
        },
        {
          name: 'Events',
          children: [
            { name: 'Ceremonies', href: '/basic/events' },
            { name: 'Memorials', href: '/basic/memorials' },
          ],
        },
      ]
    : [
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'Login', href: '/auth/login' },
      ]

  // Active page indicator
  const isActive = (href: string) => pathname === href

  const categoryIsActive = (item: any) => {
  if (!item.children) return false
  return item.children.some((c: any) => pathname === c.href)
}

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <Link href={loggedIn ? '/basic/homePage' : '/'}>
          <Image src={Logo} alt="Logo" width={80} height={80} />
        </Link>
      </div>

      {/* Desktop Links */}
      <div className={styles.links}>
        {navItems.map(item =>
          item.children ? (
            <div
              key={item.name}
              className={styles.dropdown}
              onMouseEnter={() => setDropdownOpen(item.name)}
              onMouseLeave={() => setDropdownOpen(null)}
            >
              <button
                className={`${styles.dropdownButton} ${
                  categoryIsActive(item) ? styles.active : ''
                } ${dropdownOpen === item.name ? styles.open : ''}`}
              >
                {item.name} <ChevronDown size={14} className={styles.chevron} />
              </button>
              <div
                className={`${styles.dropdownMenu} ${
                  dropdownOpen === item.name ? styles.showDropdown : ''
                }`}
              >
                {item.children.map(child => (
                  <Link
                    className={styles.dropLinks}
                    key={child.name}
                    href={child.href}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              key={item.name}
              href={item.href}
              className={isActive(item.href) ? styles.active : ''}
            >
              {item.name}
            </Link>
          )
        )}

        {loggedIn && (
          <>
            <Button onClick={handleLogout} tag="Logout" className={styles.logout} />
            <Link 
              href="/basic/settings" 
              className={isActive('/basic/settings') ? styles.active : ''}
            >
              Settings
            </Link>
          </>
        )}
      </div>

      {/* Hamburger Icon */}
      <div className={styles.hamburger} onClick={toggleMenu}>
        {menuOpen ? <X size={28} /> : <Menu size={28} />}
      </div>

      {/* Mobile Drawer */}
      <div
        ref={drawerRef}
        className={`${styles.mobileDrawer} ${menuOpen ? styles.showDrawer : ''}`}
      >
        {navItems.map(item =>
          item.children ? (
            <div key={item.name} className={styles.mobileDropdown}>
              <button
                onClick={() => toggleDropdown(item.name)}
                className={dropdownOpen === item.name ? styles.mobileDropdownOpen : ''}
              >
                {item.name} <ChevronDown size={16} />
              </button>
              {dropdownOpen === item.name &&
                item.children.map(child => (
                  <Link key={child.name} href={child.href} onClick={closeMenu}>
                    {child.name}
                  </Link>
                ))}
            </div>
          ) : (
            <Link key={item.name} href={item.href} onClick={closeMenu}>
              {item.name}
            </Link>
          )
        )}

        {loggedIn && (
          <>
            <button
              onClick={() => { handleLogout(); closeMenu() }}
              className={styles.mobileLogout}
            >
              Logout
            </button>
            <Link href="/basic/settings" onClick={closeMenu}>
              Settings
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
