
<script setup lang="ts">
import { useMenuStore } from '@/stores/menu'
import { useRouter, useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'

const menuStore = useMenuStore()
const router = useRouter()
const route = useRoute()
const menuList = computed(() => menuStore.menuList)
onMounted(() => menuStore.generateMenu())

// 获取所有子路由（dashboard、ocr、sa等）
const childRoutes = computed(() => {
  const allRoutes = router.getRoutes()
  const mainRoute = allRoutes.find(r => r.path === '/')
  const res: any[] = []

  if (mainRoute?.children) {
    mainRoute.children.forEach(route => {
      if ((route.meta as any)?.hideInMenu) return

      if (route.children && route.children.length > 0) {
        route.children.forEach(child => {
          if (!(child.meta as any)?.hideInMenu) {
            const fullChild = allRoutes.find(r => r.name === child.name)
            if (fullChild) res.push(fullChild)
          }
        })
      } else {
        const fullRoute = allRoutes.find(r => r.name === route.name)
        if (fullRoute) res.push(fullRoute)
      }
    })
  }
  return res
})

const dashboardRoute = computed(() => childRoutes.value.find(r => r.name === 'Dashboard'))

const handleCardClick = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-3xl sm:text-4xl font-bold text-blue-700">
        {{ dashboardRoute?.meta?.title || '仪表板' }}
      </h1>
      <p class="text-gray-500 mt-4 text-sm sm:text-base">
        {{ dashboardRoute?.meta?.slogan || '欢迎来到管理后台。' }}
      </p>
    </div>

    <!-- Features Section -->
    <el-row :gutter="24">
      <el-col
        v-for="item in childRoutes"
        :key="item.path"
        :xs="24"
        :sm="12"
        :lg="6"
        class="mb-6"
      >
        <el-card 
          shadow="hover" 
          class="h-full cursor-pointer transition-all transform hover:scale-105 text-center flex flex-col items-center"
          @click="handleCardClick(item.path)"
        >
          <!-- Icon -->
          <div class="text-4xl mb-4">🔹</div>
          
          <!-- Title -->
          <h2 class="text-lg font-semibold text-gray-800">
            {{ item.meta?.title || item.name }}
          </h2>
          
          <!-- Description/Slogan -->
          <p class="text-gray-500 mt-3 text-sm">
            {{ item.meta?.slogan || item.meta?.description || '点击进入' }}
          </p>
          
          <!-- Button -->
          <div class="mt-6 w-full">
            <el-button type="primary" round>
              {{ item.meta?.buttonText || '进入' }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
