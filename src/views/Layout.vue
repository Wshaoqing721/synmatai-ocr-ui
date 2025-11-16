<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMenuStore } from '@/stores/menu'
import Sidebar from '@/components/Sidebar.vue'
import TopNavbar from '@/components/TopNavbar.vue'
import Header from '@/components/Header.vue'

const menuStore = useMenuStore()
const navMode = ref<'top' | 'left'>('left') // 导航模式：top 顶部 / left 左侧

onMounted(() => {
  menuStore.generateMenu()
  // 从 localStorage 读取导航模式
  const savedMode = localStorage.getItem('navMode') as 'top' | 'left' | null
  if (savedMode) navMode.value = savedMode
})

const toggleNavMode = () => {
  navMode.value = navMode.value === 'left' ? 'top' : 'left'
  localStorage.setItem('navMode', navMode.value)
}
</script>

<template>
  <!-- 顶部导航模式 -->
  <div v-if="navMode === 'top'" class="flex flex-col h-screen bg-gray-100">
    <TopNavbar />
    <main class="flex-1 overflow-y-auto">
      <div class="max-w-7xl mx-auto p-6">
        <div class="mb-4 flex justify-end">
          <button
            @click="toggleNavMode"
            class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            切换到左侧导航
          </button>
        </div>
        <router-view />
      </div>
    </main>
  </div>

  <!-- 左侧导航模式 -->
  <div v-else class="flex h-screen bg-gray-100">
    <Sidebar />
    <div class="flex-1 flex flex-col h-screen overflow-hidden">
      <Header />
      <main class="flex-1 min-h-0 overflow-y-auto">
        <div class="p-6">
          <div class="mb-4 flex justify-end">
            <button
              @click="toggleNavMode"
              class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              切换到顶部导航
            </button>
          </div>
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
body {
  overflow: hidden;
}
</style>
