<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()

const menu = computed(() => menuStore.menuList)
const collapsed = ref(false)

const absPath = (p: string) => (p.startsWith('/') ? p : '/' + p)
const isActive = (path: string) => {
  const p = absPath(path)
  return route.path === p || route.path.startsWith(p + '/')
}

const handleNavClick = (path: string) => {
  router.push(absPath(path))
}

onMounted(() => {
  menuStore.generateMenu()
})
</script>

<template>
  <aside :class="[collapsed ? 'w-16' : 'w-64', 'bg-white text-gray-900 h-screen overflow-y-auto border-r border-gray-200 transition-all duration-200']">
    <div class="p-4 border-b border-gray-100 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-blue-700" v-show="!collapsed">Admin</h1>
      <button
        class="w-8 h-8 flex items-center justify-center rounded hover:bg-blue-50"
        @click="collapsed = !collapsed"
        :title="collapsed ? '展开' : '收起'"
      >
        <span class="text-lg text-blue-700">{{ collapsed ? '»' : '«' }}</span>
      </button>
    </div>

    <nav class="p-4">
      <ul class="space-y-2">
        <li v-for="item in menu" :key="item.path">
          <button
            @click="handleNavClick(item.path)"
            :class="[
              'w-full text-left px-4 py-2 rounded transition-colors flex items-center',
              isActive(item.path)
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-blue-50'
            ]"
            :title="collapsed ? item.title : ''"
          >
            <span class="mr-3">🔹</span>
            <span v-show="!collapsed" class="truncate">{{ item.title }}</span>
          </button>

          <ul v-if="item.children?.length && !collapsed" class="ml-4 space-y-1">
            <li v-for="child in item.children" :key="child.path">
              <button
                @click="handleNavClick(child.path)"
                :class="[
                  'w-full text-left px-4 py-2 text-sm rounded transition-colors',
                  isActive(child.path)
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-500 hover:bg-blue-50'
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
