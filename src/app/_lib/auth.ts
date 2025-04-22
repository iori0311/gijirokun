import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import { AuthApiError } from '@supabase/supabase-js'

export type AuthError = {
  message: string
  code?: string
  type?: string
}

// Supabaseクライアントのインスタンス (遅延初期化)
let supabaseInstance: SupabaseClient | null = null;

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

// Supabaseクライアント取得関数
const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient();
  }
  return supabaseInstance;
}

/**
 * メールアドレスとパスワードでログインする
 */
export const login = async (email: string, password: string) => {
  const supabase = getSupabaseClient();
  try {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { error: formatAuthError(error) }
  }

  return { error: null }
  } catch (error) {
     return { error: formatAuthError(error as Error) }
  }
}

/**
 * Google認証でログインする
 */
export const loginWithGoogle = async () => {
  const supabase = getSupabaseClient();
  try {
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
  } catch (error) {
    return { error: formatAuthError(error as Error) }
  }
}

/**
 * メールアドレスとパスワードで登録する
 */
export const register = async (email: string, password: string) => {
  const supabase = getSupabaseClient();
  try {
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
  } catch (error) {
    return { error: formatAuthError(error as Error) }
  }
}

/**
 * ログアウトする
 */
export const logout = async () => {
  const supabase = getSupabaseClient(); 
  let logoutError: AuthError | null = null; // エラー保持用変数
  try {
    const { error } = await supabase.auth.signOut(); // data を削除
    
    if (error) {
        logoutError = formatAuthError(error); // エラーを保持
    }
  } catch (error) {
     logoutError = formatAuthError(error as Error); // エラーを保持
  } finally {
      redirect('/');
  }
  // テスト用: ログアウト処理のエラー結果を返す (本番環境では redirect が先に実行される想定)
  return { error: logoutError }; 
} 