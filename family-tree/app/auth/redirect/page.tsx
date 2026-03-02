'use client'
import { useSearchParams } from 'next/navigation'

export default function AuthRedirect() {
  const params = useSearchParams()
  const next = params.get('next') || '/basic/homePage'

  if (typeof window !== 'undefined') {
    window.location.replace(next)
  }

  return null
}