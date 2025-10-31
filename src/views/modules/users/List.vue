<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi, type User } from '@/api/modules/user'

const router = useRouter()
const users = ref<User[]>([])
const loading = ref(false)
const error = ref('')

const fetchUsers = async () => {
  loading.value = true
  try {
    const result = await userApi.getList()
    users.value = result.data
    error.value = ''
  } catch (err) {
    error.value = '加载用户失败'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: number) => {
  if (confirm('确定删除此用户？')) {
    try {
      await userApi.delete(id)
      await fetchUsers()
    } catch (err) {
      error.value = '删除失败'
    }
  }
}

const handleEdit = (id: number) => {
  router.push(`/users/${id}/edit`)
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-md">
    <div class="p-6 border-b border-gray-200 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">用户管理</h1>
      <button
        @click="router.push('/users/add')"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        + 添加用户
      </button>
    </div>

    <div v-if="error" class="p-4 bg-red-100 text-red-700">{{ error }}</div>
    <div v-if="loading" class="p-6 text-center text-gray-500">加载中...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">名称</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">邮箱</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">创建时间</th>
            <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">{{ user.id }}</td>
            <td class="px-6 py-4 text-sm text-gray-900">{{ user.name }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ user.email }}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{ new Date(user.createdAt).toLocaleDateString() }}</td>
            <td class="px-6 py-4 text-sm space-x-2">
              <button @click="handleEdit(user.id)" class="text-blue-600 hover:text-blue-900 font-medium">编辑</button>
              <button @click="handleDelete(user.id)" class="text-red-600 hover:text-red-900 font-medium">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
