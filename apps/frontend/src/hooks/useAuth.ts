function decodeJwt(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return {} }
}

export function useAuth() {
  const token = localStorage.getItem('token')
  const payload = token ? decodeJwt(token) : {}
  const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : false
  if (isExpired) localStorage.removeItem('token')
  const role = payload.role || 'vendedor'
  return {
    isAuthenticated: !!token && !isExpired,
    isAdmin: role === 'admin',
    user: {
      name: payload.name || payload.email?.split('@')[0] || 'Usuario',
      email: payload.email || '',
      role,
    },
  }
}
