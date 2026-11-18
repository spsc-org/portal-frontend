// Еквівалент x-auth-session-status — банер про успішну дію (лист надіслано, пароль змінено...).
// Portal UI kit: світла картка-повідомлення з межею (success).
export function StatusAlert({ status }) {
  if (!status) return null

  return (
    <div role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
      {status}
    </div>
  )
}
