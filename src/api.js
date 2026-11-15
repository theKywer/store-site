const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export function apiFetch(path, options) {
  const url = API_BASE_URL
    ? `${API_BASE_URL}${path.replace(/^\/api/, '')}`
    : path

  return fetch(url, options)
}
