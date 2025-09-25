






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

  // Always allow auth routes (including callback) to pass through.
  // This avoids race conditions while Supabase sets session cookies.
  if (req.nextUrl.pathname.startsWith('/auth')) {
    return response
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
  matcher: ['/home/:path*', '/admin/:path*', '/auth/:path*']
}


