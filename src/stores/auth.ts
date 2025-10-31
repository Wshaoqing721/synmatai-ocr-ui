import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>('')
  const permissions = ref<string[]>([])
  const isAuthenticated = computed(() => !!token.value)

  const login = (newToken: string, perms: string[] = []) => {
    token.value = newToken
    permissions.value = perms
    localStorage.setItem('token', newToken)
    localStorage.setItem('permissions', JSON.stringify(perms))
  }

  const logout = () => {
    token.value = ''
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('permissions')
  }

  // 初始化从 localStorage 恢复
  const init = () => {
    const saved = localStorage.getItem('token')
    const perms = localStorage.getItem('permissions')
    if (saved) token.value = saved
    if (perms) permissions.value = JSON.parse(perms)
  }

  init()

  return { token, permissions, isAuthenticated, login, logout }
})
