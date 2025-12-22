<template>
  <div class="ontology-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">本体管理</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新建本体
          </el-button>
        </div>
      </template>

      <el-table :data="ontologies" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="本体名称" />
        <el-table-column label="字段数量">
          <template #default="{ row }">
            {{ row.fields?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="primary" @click="editOntology(row)">编辑</el-button>
            <el-button link type="primary" @click="viewDetail(row.id)">详情</el-button>
            <el-button link type="danger" @click="deleteOntology(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingOntology ? '编辑本体' : '新建本体'"
      width="50%"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="本体名称">
          <el-input v-model="form.name" placeholder="请输入本体名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveOntology">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { api } from '@/api/modules/ontology'

const router = useRouter()
const loading = ref(false)
const ontologies = ref([])
const showCreateDialog = ref(false)
const editingOntology = ref(null)
const form = ref({
  name: ''
})

const loadOntologies = async () => {
  loading.value = true
  try {
    ontologies.value = await api.getOntologies()
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const editOntology = (ontology) => {
  editingOntology.value = ontology
  form.value = { name: ontology.name }
  showCreateDialog.value = true
}

const viewDetail = (id) => {
  router.push(`/ontology/ontologies/${id}`)
}

const deleteOntology = async (ontology) => {
  try {
    await ElMessageBox.confirm('确定要删除这个本体吗？', '警告', {
      type: 'warning'
    })
    await api.deleteOntology(ontology.id)
    ElMessage.success('删除成功')
    loadOntologies()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const saveOntology = async () => {
  try {
    if (editingOntology.value) {
      await api.updateOntology(editingOntology.value.id, form.value)
      ElMessage.success('更新成功')
    } else {
      await api.createOntology({ ...form.value, fields: [] })
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    editingOntology.value = null
    form.value = { name: '' }
    loadOntologies()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadOntologies()
})
</script>

<style scoped>
.ontology-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}
</style>
