<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
    <div class="font-semibold text-gray-800">顶部导航</div>
    <div class="flex items-center gap-4">
      <span class="text-gray-600 text-sm" v-if="auth.isAuthenticated">已登录</span>
      <el-button
        v-if="auth.isAuthenticated"
        type="info"
        size="small"
        @click="handleLogout"
      >退出</el-button>
    </div>
  </div>
</template>
