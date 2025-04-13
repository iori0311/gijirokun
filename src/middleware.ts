import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // セッションの更新
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 実際のパスを取得
  const pathname = request.nextUrl.pathname

  // ログイン必須のパスかどうか
  const isProtectedRoute = [
    '/home',     // ホーム画面
    '/meetings', // 議事録関連
  ].some(path => pathname.startsWith(path))

  // ログイン済みユーザーをリダイレクトするパスかどうか
  const isAuthRoute = [
    '/login',
    '/signup',
    '/reset-password'
  ].some(path => pathname.startsWith(path))

  if (isProtectedRoute && !session) {
    // 未認証ユーザーを認証ページにリダイレクト
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthRoute && session) {
    // 認証済みユーザーをホームにリダイレクト
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return res
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    '/home',
    '/meetings/:path*',
    '/login',
    '/signup',
  ],
} 