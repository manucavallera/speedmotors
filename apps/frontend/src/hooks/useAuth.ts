function decodeJwt(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return {} }
}

export function useAuth() {
  const token = localStorage.getItem('token')
  const payload = token ? decodeJwt(token) : {}
  const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : false
  if (isExpired) localStorage.removeItem('token')
  return {
    isAuthenticated: !!token && !isExpired,
    user: {
      name: payload.name || payload.email?.split('@')[0] || 'Usuario',
      email: payload.email || '',
      role: payload.role || 'vendedor',
    },
  }
}
