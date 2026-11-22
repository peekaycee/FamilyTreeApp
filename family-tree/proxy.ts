// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export function proxy(req: NextRequest) {
//   const token = req.cookies.get('familytree_session')?.value
//   const { pathname } = req.nextUrl

//   // const isAuthPath = pathname.startsWith('/auth')
//   const isApi = pathname.startsWith('/api')
//   const isDashboard = pathname.startsWith('/dashboard')

//   // --- Prevent caching globally ---
//   const response = NextResponse.next()
//   response.headers.set(
//     "Cache-Control",
//     "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
//   )
//   response.headers.set("Pragma", "no-cache")
//   response.headers.set("Expires", "0")

//   // Allow API, _next, static
//   if (isApi || pathname.startsWith('/_next') || pathname.includes('.') || pathname.startsWith('/static')) {
//     return response
//   }

//   if ((!token || token === "expired") && isDashboard) {
//   const loginUrl = req.nextUrl.clone()
//   loginUrl.pathname = "/auth/login"
//   loginUrl.searchParams.set(
//     "next",
//     req.nextUrl.pathname + req.nextUrl.search
//   )
//   return NextResponse.redirect(loginUrl)
// }

//   return response
// }

// export const config = {
//   matcher: ['/dashboard/:path*', '/auth/:path*'],
// }



// proxy.ts

// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function proxy(req: NextRequest) {
//   const token = req.cookies.get("sb-access-token")?.value;

//   const { pathname } = req.nextUrl;

//   const isApi = pathname.startsWith("/api");
//   const isDashboard = pathname.startsWith("/dashboard");

//   const response = NextResponse.next();

//   response.headers.set(
//     "Cache-Control",
//     "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
//   );

//   response.headers.set("Pragma", "no-cache");
//   response.headers.set("Expires", "0");

//   if (
//     isApi ||
//     pathname.startsWith("/_next") ||
//     pathname.includes(".") ||
//     pathname.startsWith("/static")
//   ) {
//     return response;
//   }

//   if (isDashboard && !token) {
//     const loginUrl = req.nextUrl.clone();

//     loginUrl.pathname = "/auth/login";

//     loginUrl.searchParams.set(
//       "next",
//       req.nextUrl.pathname + req.nextUrl.search
//     );

//     return NextResponse.redirect(loginUrl);
//   }

//   return response;
// }

// export const config = {
//   matcher: [
//     "/dashboard/:path*",
//     "/auth/:path*",
//   ],
// };



// proxy.ts

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  let response = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });

          response = NextResponse.next({
            request: req,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Validate the actual Supabase session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Retrieve the refreshed session after validation.
  const {
    data: { session },
  } = user
    ? await supabase.auth.getSession()
    : { data: { session: null } };

  const secure = process.env.NODE_ENV === "production";

  if (session) {
    // Keep API authentication cookies synchronized.
    response.cookies.set(
      "sb-access-token",
      session.access_token,
      {
        path: "/",
        httpOnly: true,
        secure,
        sameSite: "lax",
        expires: session.expires_at
          ? new Date(session.expires_at * 1000)
          : undefined,
      }
    );

    response.cookies.set(
      "sb-refresh-token",
      session.refresh_token,
      {
        path: "/",
        httpOnly: true,
        secure,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      }
    );
  } else {
    response.cookies.set("sb-access-token", "", {
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("sb-refresh-token", "", {
      path: "/",
      maxAge: 0,
    });
  }

  response.headers.set(
    "Cache-Control",
    "private, no-store, no-cache, max-age=0"
  );

  response.headers.set("Pragma", "no-cache");

  // Protect dashboard navigation.
  if (!user && req.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = req.nextUrl.clone();

    loginUrl.pathname = "/auth/login";

    loginUrl.searchParams.set(
      "next",
      req.nextUrl.pathname + req.nextUrl.search
    );

    const redirectResponse = NextResponse.redirect(loginUrl);

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
