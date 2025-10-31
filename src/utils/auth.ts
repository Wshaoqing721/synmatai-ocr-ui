import { useAuthStore } from '@/stores/auth'

export const hasPermission = (requiredPermission: string): boolean => {
  const authStore = useAuthStore()
  return authStore.permissions?.includes(requiredPermission) ?? false
}
