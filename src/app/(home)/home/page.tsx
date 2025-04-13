'use client'

import { useAuth } from '../../_contexts/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        ようこそ、{user?.email}さん！
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">最近の議事録</h2>
          <p className="text-gray-600">
            まだ議事録がありません。新しい議事録を作成してみましょう！
          </p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">クイックアクション</h2>
          <div className="space-y-4">
            <button
              onClick={() => {/* TODO: 新規議事録作成 */}}
              className="w-full bg-zinc-900 text-white px-4 py-2 rounded-md hover:bg-zinc-800"
            >
              新規議事録を作成
            </button>
          </div>
        </div>
      </div>
    </main>
  )
} 