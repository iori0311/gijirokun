import { Metadata } from 'next'
import AuthCard from '../../_components/ui/AuthCard'
import RegisterForm from '../../_components/auth/RegisterForm'

export const metadata: Metadata = {
  title: '新規登録 | Gijirokun',
  description: 'Gijirokunの新規会員登録ページです',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          GijiroKun
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          会議の文字起こしと要約を簡単に
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthCard
          title="新規アカウント作成"
          description="メールアドレスとパスワード、またはGoogleアカウントで登録してください"
        >
          <RegisterForm />
        </AuthCard>
      </div>
    </div>
  )
} 