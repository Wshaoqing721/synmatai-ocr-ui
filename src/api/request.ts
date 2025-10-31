import axios, { AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token

    if (token) {
      config.headers = config.headers || {}
      ;(config.headers as any).Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const authStore = useAuthStore()

    if (error.response?.status === 401) {
      authStore.logout()
      router.push('/login')
    }

    const message = error.response?.data?.message || '请求失败'
    console.error('Response error:', message)

    return Promise.reject(error)
  }
)

export default service
