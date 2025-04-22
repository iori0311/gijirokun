import React, { InputHTMLAttributes, forwardRef } from 'react'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  error?: string
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  id,
  label,
  error,
  required,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <input
        id={id}
        className={`
          w-full h-10 px-3.5 py-2.5
          border rounded-md
          text-sm
          focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-[#E4E4E7]'}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        required={required}
        ref={ref}
        {...props}
      />
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 text-xs text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  )
})

// 表示名を設定
InputField.displayName = 'InputField'

export default InputField 