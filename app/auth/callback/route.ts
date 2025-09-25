import { NextResponse, type NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next")

  if (!code) {
    return NextResponse.redirect(new URL("/auth", req.url))
  }

  // Defer the exchange to the client page to use the client-side flow state (PKCE)
  // IMPORTANT: preserve ALL original query params (including `code`, `state`, etc.)
  const dest = new URL("/auth/callback/client", req.url)
  dest.search = url.search
  return NextResponse.redirect(dest)
}