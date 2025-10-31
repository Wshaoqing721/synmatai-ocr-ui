<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { userApi, type User } from '@/api/modules/user'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const user = ref<User | null>(null)
const name = ref('')
const email = ref('')
const loading = ref(false)
const error = ref('')

const fetchUser = async () => {
  loading.value = true
  try {
    const data = await userApi.getById(id)
    user.value = data
    name.value = data.name
    email.value = data.email
  } catch (e) {
    error.value = '加载失败'
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  loading.value = true
  try {
    await userApi.update(id, { name: name.value, email: email.value })
    router.push('/users')
  } catch (e) {
    error.value = '更新失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchUser)
</script>

<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h1 class="text-xl font-bold mb-4">编辑用户</h1>
    <div v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="user" class="space-y-4 max-w-md">
      <div>
        <label class="block mb-1 text-sm text-gray-600">名称</label>
        <input v-model="name" class="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label class="block mb-1 text-sm text-gray-600">邮箱</label>
        <input v-model="email" type="email" class="w-full border rounded px-3 py-2" />
      </div>
      <div class="flex gap-2">
        <button :disabled="loading" class="px-4 py-2 bg-blue-600 text-white rounded" @click="handleSubmit">
          {{ loading ? '提交中...' : '保存' }}
        </button>
        <button class="px-4 py-2 bg-gray-200 rounded" @click="router.back()">返回</button>
      </div>
    </div>
  </div>
</template>
