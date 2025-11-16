<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()
const mobileMenuOpen = ref(false)

const menu = computed(() => menuStore.menuList)

const isActive = (path: string) => {
  const p = path.startsWith('/') ? path : '/' + path
  return route.path === p || route.path.startsWith(p + '/')
}

const handleNavClick = (path: string) => {
  const p = path.startsWith('/') ? path : '/' + path
  router.push(p)
  mobileMenuOpen.value = false
}
</script>

<template>
  <nav class="bg-white border-b border-gray-300 shadow-md">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="relative flex h-16 items-center justify-between">
        <!-- Mobile menu button -->
        <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
          <button
            type="button"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span class="sr-only">打开菜单</span>
            <svg v-if="!mobileMenuOpen" class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Logo and Desktop Navigation -->
        <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
          <div class="flex shrink-0 items-center">
            <h1 class="text-xl font-bold text-blue-700">Admin</h1>
          </div>
          <div class="hidden sm:ml-6 sm:block">
            <div class="flex space-x-4">
              <button
                v-for="item in menu"
                :key="item.path"
                @click="handleNavClick(item.path)"
                :class="[
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-600 hover:bg-blue-600 hover:text-white'
                ]"
              >
                {{ item.title }}
              </button>
            </div>
          </div>
        </div>

        <!-- Right side actions -->
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
          <button class="p-2 rounded-full text-gray-400 hover:text-gray-600">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    <div v-if="mobileMenuOpen" class="sm:hidden">
      <div class="space-y-1 px-2 pb-3 pt-2">
        <button
          v-for="item in menu"
          :key="item.path"
          @click="handleNavClick(item.path)"
          :class="[
            'block w-full text-left rounded-md px-3 py-2 text-base font-medium transition-colors',
            isActive(item.path)
              ? 'bg-blue-700 text-white'
              : 'text-blue-600 hover:bg-blue-600 hover:text-white'
          ]"
        >
          {{ item.title }}
        </button>
      </div>
    </div>
  </nav>
</template>
