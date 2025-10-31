<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { userApi } from '@/api/modules/user'

const name = ref('')
const email = ref('')
const error = ref('')
const loading = ref(false)

const router = useRouter()

const handleSubmit = async () => {
  loading.value = true
  try {
    await userApi.create({ name: name.value, email: email.value })
    router.push('/users')
  } catch (e) {
    error.value = '创建失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h1 class="text-xl font-bold mb-4">添加用户</h1>
    <div class="space-y-4 max-w-md">
      <div>
        <label class="block mb-1 text-sm text-gray-600">名称</label>
        <input v-model="name" class="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label class="block mb-1 text-sm text-gray-600">邮箱</label>
        <input v-model="email" type="email" class="w-full border rounded px-3 py-2" />
      </div>
      <div v-if="error" class="text-sm text-red-600">{{ error }}</div>
      <div class="flex gap-2">
        <button :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded" @click="handleSubmit">
          {{ loading ? '提交中...' : '提交' }}
        </button>
        <button class="px-4 py-2 bg-gray-200 rounded" @click="router.back()">返回</button>
      </div>
    </div>
  </div>
</template>
