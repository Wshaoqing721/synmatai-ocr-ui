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
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main class="flex-1 overflow-y-auto">
        <div class="p-6">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>
