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
  <el-card class="box-card">
    <template #header>
      <h1 class="text-xl font-bold">添加用户</h1>
    </template>
    <el-form label-position="top" class="max-w-md">
      <el-form-item label="名称">
        <el-input v-model="name" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="email" type="email" />
      </el-form-item>
      <el-alert v-if="error" :title="error" type="error" show-icon class="mb-4" />
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ loading ? '提交中...' : '提交' }}
        </el-button>
        <el-button @click="router.back()">返回</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>
