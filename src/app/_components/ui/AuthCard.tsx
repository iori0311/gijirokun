import React from 'react'

interface AuthCardProps {
  title: string
  description?: string
  children: React.ReactNode
}

const AuthCard: React.FC<AuthCardProps> = ({
  title,
  description,
  children
}) => {
  return (
    <div className="w-full max-w-md p-6 bg-white shadow-sm border border-[#E5E7EB] rounded-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-gray-600">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

export default AuthCard 