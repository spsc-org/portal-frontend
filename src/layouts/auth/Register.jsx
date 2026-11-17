import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@material-tailwind/react'
import { useSession } from '../../stores/storeHooks.js'
import { ApiError } from '../../lib/api.js'
import AuthLayout from './AuthLayout.jsx'
import FormField from './FormField.jsx'
import { fieldError } from './formErrors.js'

// Еквівалент resources/views/auth/register.blade.php
export default function Register() {
  const { register } = useSession()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setErrors(null)

    try {
      await register(form)
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.payload?.errors ?? null)
      } else {
        setErrors({ email: ['Не вдалося зареєструватись'] })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Реєстрація">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Ім'я"
          value={form.name}
          onChange={updateField('name')}
          error={fieldError(errors, 'name')}
          required
          autoFocus
          autoComplete="name"
        />

        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={updateField('email')}
          error={fieldError(errors, 'email')}
          required
          autoComplete="username"
        />

        <FormField
          label="Пароль"
          type="password"
          value={form.password}
          onChange={updateField('password')}
          error={fieldError(errors, 'password')}
          required
          autoComplete="new-password"
        />

        <FormField
          label="Підтвердження паролю"
          type="password"
          value={form.password_confirmation}
          onChange={updateField('password_confirmation')}
          error={fieldError(errors, 'password_confirmation')}
          required
          autoComplete="new-password"
        />

        <div className="flex items-center justify-between gap-4">
          <Link to="/login" className="text-sm text-gray-600 hover:underline">
            Вже маєте акаунт?
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Реєстрація…' : 'Зареєструватись'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}