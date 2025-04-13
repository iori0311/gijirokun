'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import InputField from '../ui/InputField'
import Button from '../ui/Button'
import { login, loginWithGoogle, AuthError } from '../../_lib/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// zodによるバリデーションスキーマを定義
const loginSchema = z.object({
  email: z.string().min(1, 'メールアドレスを入力してください').email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

// フォームの型定義
type LoginFormValues = z.infer<typeof loginSchema>

const LoginForm = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setGeneralError(null)
    
    try {
      const { error } = await login(data.email, data.password)
      
      if (error) {
        handleAuthError(error)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setGeneralError('ログイン中にエラーが発生しました。後でもう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setGeneralError(null)
    
    try {
      await loginWithGoogle()
      // リダイレクトされるので何も行わない
    } catch {
      setIsLoading(false)
      setGeneralError('ログイン中にエラーが発生しました。後でもう一度お試しください。')
    }
  }

  const handleAuthError = (error: AuthError) => {
    if (error.type === 'auth_api_error') {
      // エラーコードやエラーメッセージで判定
      if (error.code === 'invalid-credentials' || error.message.includes('Invalid login credentials')) {
        setGeneralError('メールアドレスまたはパスワードが正しくありません')
      } else if (error.code === 'email-not-confirmed' || error.message.includes('Email not confirmed')) {
        setGeneralError('メールアドレスが確認されていません。メールを確認してください。')
      } else {
        setGeneralError(error.message)
      }
    } else {
      setGeneralError(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {generalError && (
        <div className="bg-red-50 p-3 rounded-md">
          <p className="text-sm text-red-500">{generalError}</p>
        </div>
      )}
      
      <InputField
        id="email"
        type="email"
        label="メールアドレス"
        error={errors.email?.message}
        required
        disabled={isLoading}
        {...register('email')}
      />
      
      <InputField
        id="password"
        type="password"
        label="パスワード"
        error={errors.password?.message}
        required
        disabled={isLoading}
        {...register('password')}
      />
      
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </div>
      
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">または</span>
        </div>
      </div>
      
      <Button
        type="button"
        variant="google"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full"
      >
        Googleでログイン
      </Button>
      
      <p className="text-center text-sm mt-4">
        アカウントをお持ちでない場合は{' '}
        <Link href="/register" className="text-blue-600 hover:underline">
          新規登録
        </Link>
      </p>
    </form>
  )
}

export default LoginForm 