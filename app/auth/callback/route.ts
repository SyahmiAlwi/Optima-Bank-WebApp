import { NextResponse, type NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  // Let the client handle the OAuth flow
  // This route just redirects to let the client-side auth complete
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  
  if (!code) {
    return NextResponse.redirect(new URL("/auth", req.url))
  }
  
  // Redirect to a client-side page that will handle the OAuth completion
  return NextResponse.redirect(new URL("/auth/callback/client", req.url))
}