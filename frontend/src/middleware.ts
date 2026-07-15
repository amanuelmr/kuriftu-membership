import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Presence-only guard: it keeps unauthenticated users out of member pages and
// logged-in users off the auth pages. The backend's JWT validation remains the
// real authorization check on every API call.
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value
  const { pathname } = request.nextUrl

  const isAuthPage = pathname === "/login" || pathname === "/register"

  if (!token && !isAuthPage) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/survey", "/login", "/register"],
}
