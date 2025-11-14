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
      {
        path: 'ocr/results',
        name: 'OcrResultsDirect',
        component: () => import('@/views/modules/ocr/pages/Results.vue'),
        meta: {
          title: 'OCR 结果',
          icon: 'ocr',
          requiresAuth: true
        }
      },   
      {
        path: 'sa',
        name: 'super-aagent',
        component: () => import('@/views/modules/sa/index.vue'),
        meta: {
          title: 'Super Agent',
          icon: 'sa',
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
