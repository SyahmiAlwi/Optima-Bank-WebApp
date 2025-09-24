






import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


export async function middleware(req: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Allow OAuth callback to pass through without redirects
  if (req.nextUrl.pathname === '/auth/callback') {
    return response
  }

  // Redirect authenticated users away from auth page (except callback)
  if (req.nextUrl.pathname.startsWith('/auth') && req.nextUrl.pathname !== '/auth/callback') {
    if (session) {
      return NextResponse.redirect(new URL('/home', req.url))
    }
  }

  // Protect /home route - redirect to auth if not logged in
  if (req.nextUrl.pathname.startsWith('/home')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth', req.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/home/:path*', '/auth/:path*']
}


