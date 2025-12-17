<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { userApi, type User } from '@/api/modules/user'
import { ElMessageBox, ElMessage } from 'element-plus'

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
  try {
    await ElMessageBox.confirm('确定删除此用户？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userApi.delete(id)
    ElMessage.success('删除成功')
    await fetchUsers()
  } catch (err) {
    if (err !== 'cancel') {
      error.value = '删除失败'
      ElMessage.error('删除失败')
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
  <el-card class="box-card">
    <template #header>
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-bold">用户管理</h1>
        <el-button type="primary" @click="router.push('/users/add')">
          + 添加用户
        </el-button>
      </div>
    </template>

    <el-alert v-if="error" :title="error" type="error" show-icon class="mb-4" />

    <el-table v-loading="loading" :data="users" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column label="创建时间">
        <template #default="scope">
          {{ new Date(scope.row.createdAt).toLocaleDateString() }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row.id)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
