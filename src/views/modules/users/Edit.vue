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
  <el-card class="box-card">
    <template #header>
      <h1 class="text-xl font-bold">编辑用户</h1>
    </template>
    <el-alert v-if="error" :title="error" type="error" show-icon class="mb-4" />
    <div v-if="loading && !user">加载中...</div>
    <el-form v-else-if="user" label-position="top" class="max-w-md">
      <el-form-item label="名称">
        <el-input v-model="name" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="email" type="email" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ loading ? '提交中...' : '保存' }}
        </el-button>
        <el-button @click="router.back()">返回</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>
