import { useId } from 'react'

// Поле форми авторизації (макет «Portal — Login», Portal UI kit): підпис над полем,
// поле 44px, межа border-input, фокус primary; помилка — під полем.
// labelAside — елемент праворуч від підпису (напр. посилання «Забули пароль?»).
export default function FormField({ label, error, labelAside, id, className = '', ...inputProps }) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-gray-600">
          {label}
        </label>
        {labelAside}
      </div>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`h-11 w-full rounded-md border bg-white px-3 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-300 ${
          error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 hover:border-gray-400 focus:border-blue-600'
        } ${className}`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="m-0 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
