import { useRouter } from "next/navigation";

export function useAuthFetch() {
  const router = useRouter();

  return async function authFetch(
    input: RequestInfo,
    init?: RequestInit
  ) {
    const res = await fetch(input, {
      ...init,
      credentials: "include",
    });

    if (res.status === 401) {
      router.replace("/login");
      throw new Error("Session expired");
    }

    return res;
  };
}
