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
  <aside 
    :class="[
      collapsed ? 'w-16' : 'w-64', 
      'bg-white text-gray-900 h-full flex flex-col border-r border-gray-200 transition-all duration-300 ease-in-out shadow-sm'
    ]"
  >
    <!-- Logo / Header Area -->
    <div class="h-14 flex items-center justify-between px-4 border-b border-gray-100 flex-none">
      <div v-show="!collapsed" class="font-bold text-xl text-blue-600 truncate tracking-tight">
        SynMaTai
      </div>
      <button
        class="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
        @click="collapsed = !collapsed"
        :title="collapsed ? 'Expand' : 'Collapse'"
      >
        <svg v-if="collapsed" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
      <div v-for="item in menu" :key="item.path">
        <button
          @click="handleNavClick(item.path)"
          :class="[
            'w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
            isActive(item.path)
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          ]"
          :title="collapsed ? item.title : ''"
        >
          <!-- Icon Placeholder (Replace with actual icons if available) -->
          <span class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-lg">
            <!-- Simple icon mapping based on title or just generic -->
            <span v-if="item.title.includes('OCR')">📄</span>
            <span v-else-if="item.title.includes('Agent')">🤖</span>
            <span v-else-if="item.title.includes('User')">👥</span>
            <span v-else>🔹</span>
          </span>
          
          <span 
            v-show="!collapsed" 
            class="ml-3 truncate text-sm"
          >
            {{ item.title }}
          </span>

          <!-- Tooltip for collapsed state (optional, browser title works too) -->
        </button>

        <!-- Submenu -->
        <div v-if="item.children?.length && !collapsed && isActive(item.path)" class="mt-1 ml-4 pl-2 border-l-2 border-gray-100 space-y-1">
          <button
            v-for="child in item.children"
            :key="child.path"
            @click.stop="handleNavClick(child.path)"
            :class="[
              'w-full text-left px-3 py-2 text-sm rounded-md transition-colors block truncate',
              isActive(child.path)
                ? 'text-blue-600 bg-blue-50/50 font-medium'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            ]"
          >
            {{ child.title }}
          </button>
        </div>
      </div>
    </nav>
    
    <!-- Footer / User Profile (Optional) -->
    <div class="p-4 border-t border-gray-100 flex-none" v-if="!collapsed">
      <div class="text-xs text-gray-400 text-center">
        v1.0.0
      </div>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}
</style>
