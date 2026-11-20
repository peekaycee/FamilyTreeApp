// 'use client'

// import { useState } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import styles from '../auth.module.css'
// import { setSession } from '@/utils/session'

// export default function Login() {
//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [loading, setLoading] = useState(false)

//   const router = useRouter()
//   const searchParams = useSearchParams()
//   const next = searchParams.get('next')

//   const pushToast = (message: string, type: 'success' | 'error' = 'error') => {
//     const toast = document.createElement('div')
//     toast.className = `${styles.toast} ${styles[type]}`
//     toast.innerHTML = `<p>${message}</p>`
//     document.body.appendChild(toast)
//     setTimeout(() => toast.remove(), 5500)
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

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
//         credentials: 'include',
//       })

//       const result = await res.json()

//       if (!res.ok) {
//         throw new Error(result?.message || 'Login failed')
//       }

//       if (result.session) {
//         setSession(result.session)
//       }

//       pushToast('Login successful.', 'success')

//       // ✅ single source of truth
//       const target =
//         next ||
//         sessionStorage.getItem('auth:returnTo') ||
//         '/basic/homePage'

//       sessionStorage.removeItem('auth:returnTo')

//       router.replace(target)
//     } catch (err: any) {
//       pushToast(err.message || 'Login failed.', 'error')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <section className={styles.authPage}>
//       <h1>Login</h1>

//       <form className={styles.form} onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Email"
//           value={email}
//           onChange={e => setEmail(e.target.value)}
//           autoFocus
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={e => setPassword(e.target.value)}
//         />
//         <button type="submit" disabled={loading}>
//           {loading ? 'Logging in…' : 'Login'}
//         </button>
//       </form>
//       <p className={styles.instruction}>
//         Don&apos;t have an account? <a href="/plans">Choose a plan | </a>
//         <a href="/password">Forgot password</a>
//       </p>
//     </section>
//   )
// }



'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from '../auth.module.css'
import { setSession } from '@/utils/session'
import { createSupabaseBrowserClient } from '@/lib/supabase/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  const pushToast = (message: string, type: 'success' | 'error' = 'error') => {
    const toast = document.createElement('div')
    toast.className = `${styles.toast} ${styles[type]}`
    toast.innerHTML = `<p>${message}</p>`
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 5500)
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
        credentials: 'include',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result?.message || 'Login failed')
      }

      if (result.session) {
        setSession(result.session)
      }

      // =======================================================
      // PRELOAD ALL TENANT WEBSITE CONTENT AFTER LOGIN
      // =======================================================

      const userId = result.user?.id || result.session?.user?.id

      if (
        userId &&
        result.session?.access_token &&
        result.session?.refresh_token
      ) {

        try {

          const supabase = createSupabaseBrowserClient()

          // Establish the authenticated browser session.
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
          })

          if (sessionError) {
            console.error(
              'Browser session initialization failed:',
              sessionError
            )
          }

          // =====================================================
          // FETCH ALL TENANT CONTENT CONCURRENTLY
          // =====================================================

          const [
            contentResult,
            storiesResult,
            membersResult,
            unionsResult
          ] = await Promise.all([

            // CMS CONTENT
            (async () => {
              try {

                const response = await fetch('/api/family-site-content', {
                  method: 'GET',
                  cache: 'no-store',
                  credentials: 'include',
                })

                if (!response.ok) {
                  throw new Error('Unable to preload tenant CMS content.')
                }

                return await response.json()

              } catch (error) {

                console.error('CMS preloading failed:', error)

                return null
              }
            })(),

            // FAMILY STORIES
            (async () => {
              try {

                const { data, error } = await supabase
                  .from('family_stories')
                  .select('*')
                  .order('created_at', { ascending: false })

                if (error) {
                  throw error
                }

                return data || []

              } catch (error) {

                console.error('Family stories preloading failed:', error)

                return null
              }
            })(),

            // FAMILY MEMBERS
            (async () => {
              try {

                const { data, error } = await supabase
                  .from('family_members')
                  .select('*')
                  .eq('user_id', userId)
                  .order('created_at', { ascending: true })

                if (error) {
                  throw error
                }

                return data || []

              } catch (error) {

                console.error('Family members preloading failed:', error)

                return null
              }
            })(),

            // FAMILY UNIONS
            (async () => {
              try {

                const { data, error } = await supabase
                  .from('family_unions')
                  .select('*')
                  .eq('user_id', userId)

                if (error) {
                  throw error
                }

                return data || []

              } catch (error) {

                console.error('Family unions preloading failed:', error)

                return null
              }
            })(),

          ])


          // =====================================================
          // SAVE CMS CONTENT FOR EACH PAGE
          // =====================================================

          if (contentResult?.content) {

            const cacheKey = (page: string) =>
              `ft_${page}_${userId}`

            try {

              // HOMEPAGE
              if (contentResult.content.homepage) {
                localStorage.setItem(
                  cacheKey('homepage_content'),
                  JSON.stringify(contentResult)
                )
              }

              // OUR STORY
              if (contentResult.content.our_family) {
                localStorage.setItem(
                  cacheKey('our_family_images'),
                  JSON.stringify(contentResult)
                )
              }

              // LEGACY
              if (contentResult.content.legacy) {
                localStorage.setItem(
                  cacheKey('legacy_content'),
                  JSON.stringify(contentResult)
                )
              }

            } catch (cacheError) {

              console.error('CMS cache saving failed:', cacheError)

            }

          }


          // =====================================================
          // SAVE FAMILY STORIES
          // =====================================================

          if (storiesResult !== null) {

            try {

              localStorage.setItem(
                `ft_family_stories_${userId}`,
                JSON.stringify(storiesResult)
              )

            } catch (cacheError) {

              console.error(
                'Family stories cache saving failed:',
                cacheError
              )

            }

          }


          // =====================================================
          // PRELOAD FAMILY MEMBERS
          // =====================================================

          if (membersResult !== null) {

            try {

              localStorage.setItem(
                `ft_family_members_${userId}`,
                JSON.stringify(membersResult)
              )

            } catch (cacheError) {

              console.error(
                'Family members cache saving failed:',
                cacheError
              )

            }

          }


          // =====================================================
          // PRELOAD FAMILY UNIONS
          // =====================================================

          if (unionsResult !== null) {

            try {

              localStorage.setItem(
                `ft_family_unions_${userId}`,
                JSON.stringify(unionsResult)
              )

            } catch (cacheError) {

              console.error(
                'Family unions cache saving failed:',
                cacheError
              )

            }

          }

        } catch (preloadError) {

          console.error(
            'Tenant content preloading failed:',
            preloadError
          )

        }

      }

      pushToast('Login successful.', 'success')

      // ✅ single source of truth
      const target =
        next ||
        sessionStorage.getItem('auth:returnTo') ||
        '/basic/homePage'

      sessionStorage.removeItem('auth:returnTo')

      router.replace(target)

    } catch (err: any) {

      pushToast(err.message || 'Login failed.', 'error')

    } finally {

      setLoading(false)

    }
  }

  return (
    <section className={styles.authPage}>
      <h1>Login</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoFocus
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <p className={styles.instruction}>
        Don&apos;t have an account? <a href="/plans">Choose a plan | </a>
        <a href="/password">Forgot password</a>
      </p>
    </section>
  )
}
