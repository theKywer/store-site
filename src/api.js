const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/i, '')

export function apiFetch(path, options) {
  const url = API_BASE_URL
    ? `${API_BASE_URL}${path.replace(/^\/api/, '')}`
    : path

  return fetch(url, options)
}

export async function fetchReviews(gameId, page = 1, limit = 10) {
  const response = await apiFetch(`/api/games/${gameId}/reviews?page=${page}&limit=${limit}`)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('Сервер отзывов недоступен. Проверьте адрес API и его запуск.')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'Не удалось загрузить отзывы')
  return data
}
