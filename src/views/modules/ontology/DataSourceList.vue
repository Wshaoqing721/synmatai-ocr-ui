<template>
  <div class="datasource-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">数据源管理</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新建数据源
          </el-button>
        </div>
      </template>

      <el-table :data="dataSources" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="数据源名称" />
        <el-table-column prop="url" label="URL" />
        <el-table-column prop="auth_type" label="认证类型" width="120" />
        <el-table-column prop="schedule" label="调度策略" width="150" />
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button link type="success" @click="testConnection(row)">测试连接</el-button>
            <el-button link type="primary" @click="editDataSource(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteDataSource(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="showCreateDialog" :title="editingDS ? '编辑数据源' : '新建数据源'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="URL">
          <el-input v-model="form.url" />
        </el-form-item>
        <el-form-item label="认证类型">
          <el-select v-model="form.auth_type">
            <el-option label="Bearer Token" value="Bearer" />
            <el-option label="API Key" value="ApiKey" />
            <el-option label="Basic Auth" value="Basic" />
            <el-option label="无" value="None" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证配置">
          <el-input v-model="authConfigText" type="textarea" :rows="3" placeholder='{"token": "your-api-key"}' />
        </el-form-item>
        <el-form-item label="调度策略">
          <el-input v-model="form.schedule" placeholder="Cron表达式，如: 0 0 * * *">
            <template #append>
              <el-button @click="showCronDialog = true">可视化编辑</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDataSource">保存</el-button>
      </template>
    </el-dialog>

    <!-- Cron Dialog -->
    <el-dialog v-model="showCronDialog" title="Cron表达式编辑器" width="500px">
      <el-form label-width="80px">
        <el-form-item label="分钟">
          <el-input v-model="cronParts.minute" placeholder="0-59 或 *" />
        </el-form-item>
        <el-form-item label="小时">
          <el-input v-model="cronParts.hour" placeholder="0-23 或 *" />
        </el-form-item>
        <el-form-item label="日">
          <el-input v-model="cronParts.day" placeholder="1-31 或 *" />
        </el-form-item>
        <el-form-item label="月">
          <el-input v-model="cronParts.month" placeholder="1-12 或 *" />
        </el-form-item>
        <el-form-item label="星期">
          <el-input v-model="cronParts.weekday" placeholder="0-6 或 *" />
        </el-form-item>
      </el-form>
      <el-alert :title="`生成的Cron: ${generatedCron}`" type="info" :closable="false" />
      <template #footer>
        <el-button @click="showCronDialog = false">取消</el-button>
        <el-button type="primary" @click="applyCron">应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { api } from '@/api/modules/ontology'

const loading = ref(false)
const dataSources = ref([])
const showCreateDialog = ref(false)
const showCronDialog = ref(false)
const editingDS = ref(null)
const authConfigText = ref('')

const form = ref({
  name: '',
  url: '',
  auth_type: 'Bearer',
  auth_config: {},
  schedule: ''
})

const cronParts = ref({
  minute: '0',
  hour: '0',
  day: '*',
  month: '*',
  weekday: '*'
})

const generatedCron = computed(() => {
  return `${cronParts.value.minute} ${cronParts.value.hour} ${cronParts.value.day} ${cronParts.value.month} ${cronParts.value.weekday}`
})

const loadDataSources = async () => {
  loading.value = true
  try {
    dataSources.value = await api.getDataSources()
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const editDataSource = (ds) => {
  editingDS.value = ds
  form.value = { ...ds }
  authConfigText.value = ds.auth_config ? JSON.stringify(ds.auth_config, null, 2) : ''
  showCreateDialog.value = true
}

const deleteDataSource = async (ds) => {
  try {
    await ElMessageBox.confirm('确定要删除这个数据源吗？', '警告', { type: 'warning' })
    await api.deleteDataSource(ds.id)
    ElMessage.success('删除成功')
    loadDataSources()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const saveDataSource = async () => {
  try {
    let authConfig = {}
    if (authConfigText.value.trim()) {
      try {
        authConfig = JSON.parse(authConfigText.value)
      } catch {
        ElMessage.error('认证配置JSON格式错误')
        return
      }
    }

    const data = { ...form.value, auth_config: authConfig }

    if (editingDS.value) {
      await api.updateDataSource(editingDS.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await api.createDataSource(data)
      ElMessage.success('创建成功')
    }
    
    showCreateDialog.value = false
    editingDS.value = null
    form.value = { name: '', url: '', auth_type: 'Bearer', auth_config: {}, schedule: '' }
    authConfigText.value = ''
    loadDataSources()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const testConnection = async (ds) => {
  const loading = ElMessage.info('正在测试连接...')
  try {
    const result = await api.testDataSource(ds.id)
    loading.close()
    if (result.success) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error('连接失败')
    }
  } catch (error) {
    loading.close()
    ElMessage.error('测试失败')
  }
}

const applyCron = () => {
  form.value.schedule = generatedCron.value
  showCronDialog.value = false
}

onMounted(() => {
  loadDataSources()
})
</script>

<style scoped>
.datasource-list {
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
