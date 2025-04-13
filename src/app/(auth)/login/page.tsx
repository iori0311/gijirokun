import { Metadata } from 'next'
import AuthCard from '../../_components/ui/AuthCard'
import LoginForm from '../../_components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'ログイン | 議事録くん',
  description: 'ログインして議事録くんの機能をご利用ください',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Gijirokun
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          会議の文字起こしと要約を簡単に
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthCard
          title="アカウントにログイン"
          description="メールアドレスとパスワード、またはGoogleアカウントでログインしてください"
        >
          <LoginForm />
        </AuthCard>
      </div>
    </div>
  )
} 