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
  error.value = ''
  try {
    if (!username.value || !password.value) {
      error.value = '请输入用户名和密码'
      // 仍然继续跳转，不阻塞其他功能
      router.push('/dashboard')
      return
    }

    const resp = await fetch('http://218.17.185.36:20244/post-token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username.value, password: password.value, rememberMe: false })
    })

    if (!resp.ok) {
      // 登录请求失败，记录错误但仍然跳转
      error.value = `登录接口返回 ${resp.status}`
      router.push('/dashboard')
      return
    }

    const data = await resp.json()
    // 期望返回 { access: '...', refresh: '...' }
    const token = (data && (data.access || data.token || data.access_token)) || ''
    if (token) {
      // 存储 token 到 auth store
      auth.login(token, [])
    } else {
      // 没有拿到 token，但仍继续前往 dashboard
      error.value = '未从接口获取到 token，已以游客身份继续'
    }

    router.push('/dashboard')
  } catch (e) {
    // 网络或解析错误，不阻塞，仍跳转
    // @ts-ignore
    error.value = e?.message || String(e)
    router.push('/dashboard')
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
