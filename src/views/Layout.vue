<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'

const menuStore = useMenuStore()
const route = useRoute()

onMounted(() => {
  menuStore.generateMenu()
})
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-gray-50">
    <!-- Sidebar (Fixed Left) -->
    <Sidebar class="flex-none z-20" />

    <!-- Main Content Wrapper -->
    <div class="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
      <!-- Header (Top) -->
      <Header class="flex-none z-10" />

      <!-- Content Area -->
      <main 
        :class="[
          'flex-1 overflow-y-auto scroll-smooth',
          route.meta.noPadding ? '' : 'p-4 sm:p-6'
        ]"
      >
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
