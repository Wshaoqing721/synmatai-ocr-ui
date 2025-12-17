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
    <el-card class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-center">登录</h1>
      </template>
      <el-form label-position="top" @submit.prevent="handleLogin">
        <el-form-item label="用户名">
          <el-input v-model="username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="password" type="password" show-password placeholder="请输入密码" @keyup.enter="handleLogin" />
        </el-form-item>
        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" class="mb-4" />
        <el-button
          type="primary"
          class="w-full"
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>
