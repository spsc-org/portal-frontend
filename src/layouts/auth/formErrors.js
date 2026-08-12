export function fieldError(errors, field) {
  const value = errors?.[field]

  if (!value) return null

  return Array.isArray(value) ? value.join(', ') : String(value)
}