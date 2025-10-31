# Vue3 通用脚手架完整实现指南

## 项目初始化

```bash
npm create vite@latest my-admin -- --template vue-ts
cd my-admin
npm install
npm install vue-router@4 pinia axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 核心文件结构

```
src/
├── api/
│   ├── request.ts           # Axios 实例配置
│   └── modules/
│       └── user.ts          # API 模块示例
├── router/
│   ├── index.ts             # 路由配置
│   └── routes.ts            # 路由定义
├── stores/
│   ├── index.ts             # Pinia store
│   └── menu.ts              # 菜单 store
├── views/
│   ├── Layout.vue           # 主布局
│   ├── Dashboard.vue        # 仪表板
│   └── modules/
│       └── users/
│           ├── List.vue     # 列表页
│           ├── Add.vue      # 添加页
│           └── Edit.vue     # 编辑页
├── components/
│   ├── Sidebar.vue          # 侧边栏菜单
│   ├── Header.vue           # 顶部导航
│   └── common/              # 通用组件
├── types/
│   ├── api.ts               # API 类型定义
│   └── menu.ts              # 菜单类型定义
├── utils/
│   ├── auth.ts              # 认证工具
│   └── storage.ts           # 本地存储工具
├── App.vue
└── main.ts
```

## 关键实现文件

### 1. API 请求配置 (src/api/request.ts)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const authStore = useAuthStore()
    
    // 处理 401 未授权
    if (error.response?.status === 401) {
      authStore.logout()
      router.push('/login')
    }
    
    // 处理其他错误
    const message = error.response?.data?.message || '请求失败'
    console.error('Response error:', message)
    
    return Promise.reject(error)
  }
)

export default service
```

### 2. 菜单路由配置 (src/router/routes.ts)

```typescript
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
        path: 'users',
        name: 'Users',
        component: () => import('@/views/modules/users/List.vue'),
        meta: {
          title: '用户管理',
          icon: 'users',
          requiresAuth: true
        }
      },
      {
        path: 'users/add',
        name: 'UserAdd',
        component: () => import('@/views/modules/users/Add.vue'),
        meta: {
          title: '添加用户',
          parentPath: '/users',
          hideInMenu: true,
          requiresAuth: true
        }
      },
      {
        path: 'users/:id/edit',
        name: 'UserEdit',
        component: () => import('@/views/modules/users/Edit.vue'),
        meta: {
          title: '编辑用户',
          parentPath: '/users',
          hideInMenu: true,
          requiresAuth: true
        }
      }
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
```

### 3. 动态菜单 Store (src/stores/menu.ts)

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
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

  // 从路由生成菜单
  const generateMenu = () => {
    const routes = router.getRoutes()
    const mainRoute = routes.find(r => r.path === '/')
    
    if (mainRoute?.children) {
      menuList.value = mainRoute.children
        .filter((route) => !route.meta?.hideInMenu)
        .map((route) => ({
          name: route.name as string,
          title: (route.meta?.title as string) || route.name as string,
          path: route.path,
          icon: (route.meta?.icon as string) || 'default',
          children: (route.children || [])
            .filter((child) => !child.meta?.hideInMenu)
            .map((child) => ({
              name: child.name as string,
              title: (child.meta?.title as string) || child.name as string,
              path: child.path,
              icon: (child.meta?.icon as string) || 'default'
            }))
        }))
    }
  }

  return {
    menuList: computed(() => menuList.value),
    generateMenu
  }
})
```

### 4. 侧边栏菜单组件 (src/components/Sidebar.vue)

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()

const menu = computed(() => menuStore.menuList)

const isActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const handleNavClick = (path: string) => {
  router.push(path)
}
</script>

<template>
  <aside class="w-64 bg-gray-900 text-white h-screen overflow-y-auto">
    <!-- 顶部 Logo -->
    <div class="p-4 border-b border-gray-800">
      <h1 class="text-2xl font-bold">Admin</h1>
    </div>

    <!-- 菜单列表 -->
    <nav class="p-4">
      <ul class="space-y-2">
        <li v-for="item in menu" :key="item.path">
          <!-- 主菜单项 -->
          <button
            @click="handleNavClick(item.path)"
            :class="[
              'w-full text-left px-4 py-2 rounded transition-colors',
              isActive(item.path)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            ]"
          >
            <span v-if="item.icon" class="mr-3">🔹</span>
            {{ item.title }}
          </button>

          <!-- 子菜单 -->
          <ul v-if="item.children?.length" class="ml-4 space-y-1">
            <li v-for="child in item.children" :key="child.path">
              <button
                @click="handleNavClick(child.path)"
                :class="[
                  'w-full text-left px-4 py-2 text-sm rounded transition-colors',
                  isActive(child.path)
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800'
                ]"
              >
                {{ child.title }}
              </button>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<style scoped>
/* Tailwind 已处理所有样式 */
</style>
```

### 5. 主布局页面 (src/views/Layout.vue)

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useMenuStore } from '@/stores/menu'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'

const menuStore = useMenuStore()

onMounted(() => {
  menuStore.generateMenu()
})
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <!-- 侧边栏 -->
    <Sidebar />

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 头部 -->
      <Header />

      <!-- 页面内容 -->
      <main class="flex-1 overflow-y-auto">
        <div class="p-6">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>
```

### 6. API 模块示例 (src/api/modules/user.ts)

```typescript
import service from '../request'

export interface User {
  id: number
  name: string
  email: string
  createdAt: string
}

export const userApi = {
  // 获取用户列表
  getList: (page = 1, limit = 10) => 
    service.get<{ data: User[]; total: number }>('/users', { 
      params: { page, limit } 
    }),

  // 获取单个用户
  getById: (id: number) => 
    service.get<User>(`/users/${id}`),

  // 创建用户
  create: (data: Omit<User, 'id' | 'createdAt'>) => 
    service.post<User>('/users', data),

  // 更新用户
  update: (id: number, data: Partial<User>) => 
    service.put<User>(`/users/${id}`, data),

  // 删除用户
  delete: (id: number) => 
    service.delete(`/users/${id}`)
}
```

### 7. 用户列表页面 (src/views/modules/users/List.vue)

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi, type User } from '@/api/modules/user'

const router = useRouter()
const users = ref<User[]>([])
const loading = ref(false)
const error = ref('')

const fetchUsers = async () => {
  loading.value = true
  try {
    const result = await userApi.getList()
    users.value = result.data
    error.value = ''
  } catch (err) {
    error.value = '加载用户失败'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: number) => {
  if (confirm('确定删除此用户？')) {
    try {
      await userApi.delete(id)
      await fetchUsers()
    } catch (err) {
      error.value = '删除失败'
    }
  }
}

const handleEdit = (id: number) => {
  router.push(`/users/${id}/edit`)
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-md">
    <!-- 标题和操作按钮 -->
    <div class="p-6 border-b border-gray-200 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
      <button
        @click="router.push('/users/add')"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + 添加用户
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="p-4 bg-red-100 text-red-700">
      {{ error }}
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="p-6 text-center text-gray-500">
      加载中...
    </div>

    <!-- 用户表格 -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">名称</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">邮箱</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">创建时间</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">{{ user.id }}</td>
            <td class="px-6 py-4 text-sm text-gray-900">{{ user.name }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ user.email }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">
              {{ new Date(user.createdAt).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4 text-sm space-x-2">
              <button
                @click="handleEdit(user.id)"
                class="text-blue-600 hover:text-blue-900 font-medium"
              >
                编辑
              </button>
              <button
                @click="handleDelete(user.id)"
                class="text-red-600 hover:text-red-900 font-medium"
              >
                删除
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
```

## 快速添加新菜单指南

### 第一步：添加路由

在 `src/router/routes.ts` 中添加新路由：

```typescript
{
  path: 'products',
  name: 'Products',
  component: () => import('@/views/modules/products/List.vue'),
  meta: {
    title: '产品管理',
    icon: 'shopping-bag',
    requiresAuth: true
  }
}
```

### 第二步：创建页面文件

在 `src/views/modules/products/` 目录下创建相应组件。

### 第三步：重启应用

菜单会自动更新！

## 环境配置

创建 `.env.development` 文件：

```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Admin Dashboard
```

## package.json 依赖

```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^4.3.0",
    "@vitejs/plugin-vue": "^4.2.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

## 常见扩展

### 添加权限控制

在 `src/utils/auth.ts` 中：

```typescript
export const hasPermission = (requiredPermission: string): boolean => {
  const authStore = useAuthStore()
  return authStore.permissions?.includes(requiredPermission) ?? false
}
```

在路由守卫中使用：

```typescript
router.beforeEach((to, from, next) => {
  if (to.meta.requiredPermission) {
    if (hasPermission(to.meta.requiredPermission as string)) {
      next()
    } else {
      next('/403')
    }
  } else {
    next()
  }
})
```

### 添加表单验证

推荐使用 VeeValidate：

```bash
npm install vee-validate yup
```

### 状态管理

使用 Pinia 替代 Vuex，更轻量级。创建 store：

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMyStore = defineStore('my-store', () => {
  const state = ref('')
  
  const setState = (value: string) => {
    state.value = value
  }
  
  return { state, setState }
})
```

## 生产部署

构建：

```bash
npm run build
```

输出在 `dist/` 目录，部署到任意静态服务器。

## 总结

这个脚手架提供了：
- ✅ 快速后端 API 集成
- ✅ 自动生成的动态菜单
- ✅ 完整的 CRUD 示例
- ✅ 现代化的 UI（Tailwind）
- ✅ TypeScript 支持
- ✅ 模块化结构，易于扩展
