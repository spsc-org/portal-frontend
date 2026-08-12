import { Alert } from '@material-tailwind/react'

// Еквівалент x-auth-session-status — банер про успішну дію (лист надіслано, пароль змінено...).
export function StatusAlert({ status }) {
  if (!status) return null

  return (
    <Alert color="green" className="mb-4 py-2 text-sm">
      {status}
    </Alert>
  )
}