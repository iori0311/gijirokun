'use client'

import { useAuth } from '../../_contexts/AuthContext'
import { logout } from '../../_lib/auth'
import Button from '../ui/Button'

export default function Header() {
  const { user } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gijirokun</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button
              onClick={handleLogout}
              variant="secondary"
              className="px-3 py-1 text-sm"
            >
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
} 