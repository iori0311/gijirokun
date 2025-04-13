import React, { ButtonHTMLAttributes } from 'react'
import GoogleIcon from './GoogleIcon'

type ButtonVariant = 'primary' | 'secondary' | 'google'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-[#18181B] text-[#FAFAFA] hover:bg-zinc-800',
    secondary: 'bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50',
    google: 'flex items-center justify-center bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
  }
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`

  return (
    <button 
      className={combinedClasses}
      {...props}
    >
      {variant === 'google' && <GoogleIcon className="mr-2" />}
      {children}
    </button>
  )
}

export default Button 