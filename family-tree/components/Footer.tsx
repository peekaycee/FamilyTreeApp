/* eslint-disable react-hooks/set-state-in-effect */
'use client'
import styles from './components.module.css'
import Link from 'next/link'
import Image from 'next/image';
import Logo from '../public/images/logo.png';
import FacebookIcon from '../public/images/facebook.svg';
import InstagramIcon from '../public/images/instagram.svg';
import TiktokIcon from '../public/images/tiktok.svg';
import Badge from '../public/images/badge.png';
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Button from './Button';
import { ArrowUp } from "lucide-react";
import useGlobalAuth from "@/app/hooks/useGlobalAuth";


export default function Footer(){

  // const [loggedIn, setLoggedIn] = useState(false)
  const loggedIn = useGlobalAuth();
  const router = useRouter()

  // const checkLoginStatus = () => {
  //   try {
  //     const flag = localStorage.getItem('ft_logged_in')
  //     if (flag === '1') {
  //       setLoggedIn(true)
  //       return
  //     }
  //   } catch (e) {
  //     // ignore localStorage errors
  //   }

    // fallback: detect session cookie
  //   const cookies = typeof document !== 'undefined' ? document.cookie.split(';').map(c => c.trim()) : []
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

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error:', err)
    }

    // clear client flags
    try {
      localStorage.removeItem('ft_logged_in')
      localStorage.setItem('ft_last_changed', String(Date.now()))
    } catch (e) {}

    // notify UI
    localStorage.setItem("ft_last_changed", String(Date.now()));
    window.dispatchEvent(new Event("authChange"));

    // redirect home
    router.push('/')
  }

  return(
    <section>
      <footer className={styles.footer}>
        {loggedIn ? (
          <>
            <div className={styles.footerContent}>
              <div className={styles.footerLogo}>
                <Link href='/basic/homePage'><Image src={Logo} alt="Footer Logo" width={150} height={150}/></Link>  
              </div>  
              <div className={styles.navLinks}>
                <h3>Links</h3>
                <Link href='/basic/homePage'>Home</Link>  
                <Link href='/basic/stories'>Our Story</Link>  
                <Link href='/basic/legacy'>Legacy</Link>  
                <Link href='/basic/members'>Family Album</Link>  
                <Link href='/basic/achievements'>Achievements</Link>  
                <Link href='/basic/events'>Ceremonies</Link>  
                <Link href='/basic/memorials'>Memorials</Link>  
                <Link href='/basic/dashboard'>Dashboard</Link>  
                <Link href='/basic/settings'>Settings</Link>  
                <Button onClick={handleLogout} tag={'Logout'} className={styles.logout} />
              </div>  
              <div className={styles.footerText}>
                <p>We Reserve Our Family Legacy and Follow Up on Our Linage and Heritage.</p>
                <div className={styles.socials}>
                  <Link href={'/'} className={styles.socialsLink}>
                    <Image src={FacebookIcon} alt='Facebook' width={0} height={0}/>
                  </Link>
                  <Link href={'/'} className={styles.socialsLink}>
                    <Image src={InstagramIcon} alt='Instagram' width={0} height={0}/>
                  </Link>
                  <Link href={'/'} className={styles.socialsLink}>
                    <Image src={TiktokIcon} alt='Whatsapp' width={0} height={0}/>
                  </Link>
                </div>
                <p className={styles.connect}>Connect With Us On Social Media.</p>
              </div>
              <div className={styles.footerPlanLogo}>
                <motion.div 
                  animate={{
                      scale: [1, 1.2, 1], // zoom in then back
                    }}
                    transition={{
                      duration: 2,        // 2 seconds for one cycle
                      ease: 'easeInOut',  // smooth easing
                      repeat: Infinity,   // loop forever
                    }}
                    style={{
                      display: 'inline-block',
                    }}  
                  >
                    <Link href='/familyLegacyPlan'>
                      <Image src={Badge} alt="Footer Logo" width={150} height={150}/>
                    </Link> 
                </motion.div>
                <p className={styles.upgrade}>Click to upgrade to Family Legacy Plan for more features.</p> 
              </div>
              <motion.div
                className={styles.moveUp} 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <ArrowUp size={24} strokeWidth={2.5}/>
              </motion.div>
            </div>
            <div className={styles.copyright}>
              <p>© 2025 TheFamilyTree - Produced By Homes &apos;N&apos; Codes.</p>
            </div>
          </>
        )
        : (
          <>
            <div className={styles.footerContent}>
              <div className={styles.footerLogo}>
                <Link href='/'><Image src={Logo} alt="Footer Logo" width={100} height={100}/></Link>  
              </div>  
              <div className={styles.navLinks}>
                <h3>Links</h3>
                <Link href='/'>Home</Link>  
                <Link href='/about'>About</Link>  
                <Link href='/contact'>Contact</Link>  
                <Link href='/auth/login'>Login</Link>    
                <Link href='/auth/register'>Register</Link>    
                <Link href= '/admin/password' className={styles.adminLink}>Admin</Link>
              </div>  
              <div className={styles.plans}>
                <h3>Plans</h3>
                <Link href={'/familyHeritagePlan'}>Family Heritage</Link>
                <Link href={'/familyLegacyPlan'}>Family Legacy</Link>
                <Link href={'/familyPremiumPlan'}>Family Premium</Link>
              </div>
              <div className={styles.footerText}>
                <p>Reserve Your Family Legacy and Follow Up on Your Linage and Heritage.</p>
                <div className={styles.socials}>
                  <Link href={'/'} className={styles.socialsLink}>
                    <Image src={FacebookIcon} alt='Facebook' width={0} height={0}/>
                  </Link>
                  <Link href={'/'} className={styles.socialsLink}>
                    <Image src={InstagramIcon} alt='Instagram' width={0} height={0}/>
                  </Link>
                  <Link href={'/'} className={styles.socialsLink}>
                    <Image src={TiktokIcon} alt='Whatsapp' width={0} height={0}/>
                  </Link>
                </div>
                <p className={styles.connect}>Connect With Us On Social Media.</p>
                <form className={styles.newsLetter}>
                  <input type="text" placeholder="Add email to subscribe to our news letter" className={styles.subscribeEmail}/>
                  <input type="submit" value="Submit" className={styles.subscribeSubmit}/>
                </form>
              </div>
              <motion.div
                className={styles.moveUp} 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <ArrowUp size={24} strokeWidth={2.5}/>
              </motion.div>
            </div>
            <div className={styles.copyright}>
              <p>© 2025 TheFamilyTree - Produced By Homes &apos;N&apos; Codes.</p>
            </div>
          </>
        )
      }
      </footer>
    </section>
  )
}