import { apiFetch } from '../../../lib/api.js'

// "Мій профіль" — JSON-аналог Blade-сторінки /profile (бекенд: routes/api/spa.php,
// SpaProfileController + JSON-методи аватара ProfileController).

export const PROFILE_KEYS = {
  profile: ['profile'],
}

/** { id, name, email, initials, avatar, avatar_url } */
export const fetchProfile = () => apiFetch('/api/spa/profile').then((payload) => payload?.data ?? null)

export const updateProfile = ({ name, email }) =>
  apiFetch('/api/spa/profile', { method: 'PATCH', body: { name, email } }).then((payload) => payload?.data ?? null)

export const updatePassword = ({ current_password, password, password_confirmation }) =>
  apiFetch('/api/spa/profile/password', {
    method: 'PUT',
    body: { current_password, password, password_confirmation },
  })

/** blob — уже обрізаний квадрат (Cropper.js). Відповідь: { avatar } — шлях у сховищі. */
export const uploadAvatar = (blob) => {
  const body = new FormData()
  body.append('avatar', blob, 'avatar.jpg')
  return apiFetch('/api/spa/profile/avatar', { method: 'POST', body }).then((payload) => payload?.data ?? null)
}

export const deleteAvatar = () => apiFetch('/api/spa/profile/avatar', { method: 'DELETE' })

export const avatarUrl = (path) => (path ? `/files?path=${encodeURIComponent(path)}` : null)

/** Ініціали як у Blade: перші літери двох перших слів імені. */
export const nameInitials = (name) => {
  const parts = String(name ?? '').trim().split(/\s+/)
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase() || '?'
}

/** 422 → { field: 'перше повідомлення' }. */
export const fieldErrors = (error) =>
  Object.fromEntries(
    Object.entries(error?.payload?.errors ?? {}).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : messages,
    ]),
  )
