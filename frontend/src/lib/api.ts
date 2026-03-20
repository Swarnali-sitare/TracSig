import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tracsig_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
let refreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      if (refreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      refreshing = true
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const newToken = data.data.access_token
        localStorage.setItem('tracsig_token', newToken)
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        localStorage.removeItem('tracsig_token')
        localStorage.removeItem('tracsig_user')
        window.location.href = '/auth/login'
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api
