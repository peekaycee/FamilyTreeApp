'use client'
import { useRouter } from 'next/navigation'

export function useAuthFetch() {
  const router = useRouter()

  return async function authFetch(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, {
      ...init,
      credentials: "include",
    })

    if (res.status === 401) {
      const returnTo =
        window.location.pathname + window.location.search

      // store once (fallback only)
      if (!sessionStorage.getItem("auth:returnTo")) {
        sessionStorage.setItem("auth:returnTo", returnTo)
      }

      const encoded = encodeURIComponent(returnTo)
      router.replace(`/auth/login?next=${encoded}`)

      throw new Error("Unauthorized")
    }

    return res
  }
}