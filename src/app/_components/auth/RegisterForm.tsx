'use client'

import { useState } from 'react'
import Link from 'next/link'
import InputField from '../ui/InputField'
import Button from '../ui/Button'
import { register as registerUser, loginWithGoogle, AuthError } from '../../_lib/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// zodによるバリデーションスキーマを定義
const registerSchema = z.object({
  email: z.string().min(1, 'メールアドレスを入力してください').email('有効なメールアドレスを入力してください'),
  password: z.string()
    .min(1, 'パスワードを入力してください')
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/[A-Z]/, 'パスワードは大文字を含む必要があります')
    .regex(/[a-z]/, 'パスワードは小文字を含む必要があります')
    .regex(/[0-9]/, 'パスワードは数字を含む必要があります')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'パスワードは特殊文字を含む必要があります'),
  confirmPassword: z.string().min(1, '確認用パスワードを入力してください'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'パスワードが一致していません',
  path: ['confirmPassword'],
})

// フォームの型定義
type RegisterFormValues = z.infer<typeof registerSchema>

const RegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    setGeneralError(null)
    
    try {
      const { error } = await registerUser(data.email, data.password)
      
      if (error) {
        handleAuthError(error)
      } else {
        setIsSuccess(true)
      }
    } catch {
      setGeneralError('登録中にエラーが発生しました。後でもう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    setGeneralError(null)
    
    try {
      await loginWithGoogle()
    } catch {
      setIsLoading(false)
      setGeneralError('登録中にエラーが発生しました。後でもう一度お試しください。')
    }
  }

  const handleAuthError = (error: AuthError) => {
    if (error.type === 'auth_api_error') {
      // エラーコードで判定
      if (error.code === 'user-already-exists' || error.message.includes('already registered')) {
        setGeneralError('このメールアドレスは既に登録されています')
      } else if (error.message.includes('password')) {
        setGeneralError(error.message)
      } else {
        setGeneralError(error.message)
      }
    } else {
      setGeneralError(error.message)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-green-50 p-6 rounded-md">
        <h3 className="text-lg font-medium text-green-800">登録メールを送信しました</h3>
        <p className="mt-2 text-sm text-green-700">
          {watch('email')} 宛に確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。
        </p>
        <div className="mt-4">
          <Link href="/login" className="text-sm font-medium text-green-600 hover:underline">
            ログインページに戻る
          </Link>
        </div>
      </div>
    )
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
      
      <InputField
        id="confirmPassword"
        type="password"
        label="パスワード（確認）"
        error={errors.confirmPassword?.message}
        required
        disabled={isLoading}
        {...register('confirmPassword')}
      />
      
      <div className="pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? '処理中...' : '新規登録'}
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
        onClick={handleGoogleSignup}
        disabled={isLoading}
        className="w-full"
      >
        Googleで登録
      </Button>
      
      <p className="text-center text-sm mt-4">
        既にアカウントをお持ちの場合は{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          ログイン
        </Link>
      </p>
    </form>
  )
}

export default RegisterForm