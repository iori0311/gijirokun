import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import { AuthApiError } from '@supabase/supabase-js'

export type AuthError = {
  message: string
  code?: string
  type?: string
}

// Supabaseクライアントの作成
const supabase = createClientComponentClient()

// Supabaseのエラーをアプリケーションのエラー形式に変換する
const formatAuthError = (error: Error | AuthApiError): AuthError => {
  if (error instanceof AuthApiError) {
    return {
      message: error.message,
      code: error.code,
      type: 'auth_api_error'
    }
  }
  
  return {
    message: error.message || 'エラーが発生しました',
    type: 'unknown_error'
  }
}

/**
 * メールアドレスとパスワードでログインする
 */
export const login = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { error: formatAuthError(error) }
  }

  return { error: null }
}

/**
 * Google認証でログインする
 */
export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) {
    return { error: formatAuthError(error) }
  }

  return { error: null }
}

/**
 * メールアドレスとパスワードで登録する
 */
export const register = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) {
    return { error: formatAuthError(error) }
  }

  return { error: null }
}

/**
 * ログアウトする
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: formatAuthError(error) }
  }
  
  redirect('/')
} 