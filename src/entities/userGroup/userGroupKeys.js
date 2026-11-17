// Query keys сутності "група користувачів" — ті самі, що в queries.js
// (react-query хуки для ще не перенесених на MVVM споживачів, напр. SharePicker).
export const USER_GROUP_KEYS = {
  list: ['user-groups'],
  options: ['user-group-options'],
}

/** Перше повідомлення валідації (422) або message відповіді (axios-помилка). */
export function userGroupErrorMessage(error, fallback) {
  const data = error?.response?.data
  if (!data) return fallback
  if (data.errors) {
    const first = Object.values(data.errors)[0]
    if (first) return Array.isArray(first) ? first[0] : first
  }
  return data.message || fallback
}
