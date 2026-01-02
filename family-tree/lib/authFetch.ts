// "use client"
// import { useRouter } from "next/navigation"
// import { useToast } from "@/app/ToastContext" // import your global toast

// export function useAuthFetch() {
//   const router = useRouter()
//   const { showToast } = useToast()

//   return async function authFetch(input: RequestInfo, init?: RequestInit) {
//     const res = await fetch(input, {
//       ...init,
//       credentials: "include", // send cookies
//     })

//     // If session expired / missing cookie
//     if (res.status === 401) {
//       // Show global toast
//       showToast("Session expired. Try to login.", "error")

//       // Replace navigation to login, preventing back button
//       window.location.replace("/auth/login")

//       // Throw to stop execution
//       throw new Error("Session expired")
//     }

//     return res
//   }
// }

'use client'
import { useRouter } from 'next/navigation'

export function useAuthFetch() {
  const router = useRouter()

  return async function authFetch(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, {
      ...init,
      credentials: "include", // send cookies
    });

    if (res.status === 401) {
      // Add a small delay so the toast is visible
      setTimeout(() => {
        router.replace("/auth/login"); // redirect to login
      }, 100); 
      throw new Error("Session expired");
    }

    return res;
  }
}
