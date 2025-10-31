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
    <div class="p-4 border-b border-gray-800">
      <h1 class="text-2xl font-bold">Admin</h1>
    </div>

    <nav class="p-4">
      <ul class="space-y-2">
        <li v-for="item in menu" :key="item.path">
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
