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
  <aside :class="[collapsed ? 'w-16' : 'w-64', 'bg-gray-900 text-white h-screen overflow-y-auto transition-all duration-200']">
    <div class="p-4 border-b border-gray-800 flex items-center justify-between">
      <h1 class="text-2xl font-bold" v-show="!collapsed">Admin</h1>
      <button
        class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-800"
        @click="collapsed = !collapsed"
        :title="collapsed ? '展开' : '收起'"
      >
        <span>{{ collapsed ? '»' : '«' }}</span>
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
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
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
