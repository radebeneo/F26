/**
 * src/middleware.ts
 *
 * Supabase session-refresh middleware.
 * Required by @supabase/ssr — keeps the user's session alive across
 * Server Component renders by refreshing expired tokens via cookies.
 *
 * Protects /dashboard and /squad routes: unauthenticated users are
 * redirected to /auth/login.
 *
 * Also enforces the @ogilvy.co.za domain allowlist for authenticated
 * sessions — last line of defence against accounts created outside the app.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedDomain } from "@/lib/domain";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — do NOT remove this line.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Domain enforcement for authenticated users.
  // If a session exists but the email is not from an allowed domain,
  // sign the user out and send them back to the login page.
  if (user && user.email && !isAllowedDomain(user.email)) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("error", "unauthorised_domain");
    return NextResponse.redirect(url);
  }

  // Protected routes
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/squad");

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

