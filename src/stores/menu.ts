import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'

export interface MenuItem {
  name: string
  title: string
  path: string
  icon?: string
  children?: MenuItem[]
}

export const useMenuStore = defineStore('menu', () => {
  const menuList = ref<MenuItem[]>([])

  const generateMenu = () => {
    const routes = router.getRoutes()
    const mainRoute = routes.find(r => r.path === '/')

    if (mainRoute?.children) {
      menuList.value = mainRoute.children
        .filter((route) => !(route.meta as any)?.hideInMenu)
        .map((route) => ({
          name: route.name as string,
          title: ((route.meta as any)?.title as string) || (route.name as string),
          path: route.path,
          icon: ((route.meta as any)?.icon as string) || 'default',
          children: (route.children || [])
            .filter((child) => !(child.meta as any)?.hideInMenu)
            .map((child) => ({
              name: child.name as string,
              title: ((child.meta as any)?.title as string) || (child.name as string),
              path: child.path,
              icon: ((child.meta as any)?.icon as string) || 'default'
            }))
        }))
    }
  }

  return {
    menuList: computed(() => menuList.value),
    generateMenu
  }
})
