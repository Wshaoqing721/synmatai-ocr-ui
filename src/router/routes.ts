import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '仪表板',
          icon: 'dashboard',
          requiresAuth: true
        }
      },
    {
        path: 'ocr',
        name: 'Ocr',
        component: () => import('@/views/modules/ocr/Index.vue'),
        meta: {
          title: 'OCR',
          icon: 'ocr',
          requiresAuth: true
        }
      },
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      requiresAuth: false
    }
  }
]
