<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const auth = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  loading.value = true
  try {
    // 这里可调用真实登录接口，示例直接设置 token
    if (username.value && password.value) {
      auth.login('mock-token', ['dashboard:view', 'users:manage'])
      router.push('/dashboard')
    } else {
      error.value = '请输入用户名和密码'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="w-full max-w-md bg-white p-6 rounded shadow">
      <h1 class="text-2xl font-bold mb-6 text-center">登录</h1>
      <div class="space-y-4">
        <div>
          <label class="block mb-1 text-sm text-gray-600">用户名</label>
          <input v-model="username" type="text" class="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block mb-1 text-sm text-gray-600">密码</label>
          <input v-model="password" type="password" class="w-full border rounded px-3 py-2" />
        </div>
        <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>
        <button
          :disabled="loading"
          @click="handleLogin"
          class="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </div>
    </div>
  </div>
</template>
