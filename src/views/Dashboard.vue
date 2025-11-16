
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
  const mainRoute = router.getRoutes().find(r => r.path === '/')
  return mainRoute?.children?.filter(r => !(r.meta as any)?.hideInMenu) || []
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
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="item in childRoutes"
        :key="item.path"
        class="cursor-pointer bg-white rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105 p-6 flex flex-col items-center border border-gray-100 hover:border-blue-400"
        @click="handleCardClick(item.path)"
      >
        <!-- Icon -->
        <div class="text-4xl mb-4 text-center">🔹</div>
        
        <!-- Title -->
        <h2 class="text-lg font-semibold text-gray-800 text-center">
          {{ item.meta?.title || item.name }}
        </h2>
        
        <!-- Description/Slogan -->
        <p class="text-gray-500 mt-3 text-center text-sm">
          {{ item.meta?.slogan || item.meta?.description || '点击进入' }}
        </p>
        
        <!-- Button -->
        <div class="mt-6 text-center w-full">
          <span class="inline-block px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition">
            {{ item.meta?.buttonText || '进入' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
