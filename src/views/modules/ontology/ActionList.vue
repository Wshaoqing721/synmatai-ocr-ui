<template>
  <div class="action-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">Action工具库</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            新建Action
          </el-button>
        </div>
      </template>

      <el-table :data="actions" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="Action名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="method" label="方法" width="100" />
        <el-table-column prop="api_url" label="API地址" />
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewSchema(row)">Schema</el-button>
            <el-button link type="success" @click="testAction(row)">测试</el-button>
            <el-button link type="primary" @click="editAction(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteAction(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog v-model="showCreateDialog" :title="editingAction ? '编辑Action' : '新建Action'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="API地址">
          <el-input v-model="form.api_url" />
        </el-form-item>
        <el-form-item label="请求方法">
          <el-select v-model="form.method">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="输入Schema">
          <el-input v-model="inputSchemaText" type="textarea" :rows="4" placeholder='{"param1": "string", "param2": "number"}' />
        </el-form-item>
        <el-form-item label="输出Schema">
          <el-input v-model="outputSchemaText" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAction">保存</el-button>
      </template>
    </el-dialog>

    <!-- Schema Dialog -->
    <el-dialog v-model="showSchemaDialog" title="Schema详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="输入Schema">
          <pre>{{ JSON.stringify(currentSchema?.input_schema, null, 2) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="输出Schema">
          <pre>{{ JSON.stringify(currentSchema?.output_schema, null, 2) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- Test Dialog -->
    <el-dialog v-model="showTestDialog" title="测试Action" width="600px">
      <el-form label-width="100px">
        <el-form-item v-for="(type, param) in testingAction?.input_schema" :key="param" :label="param">
          <el-input v-model="testParams[param]" :placeholder="`类型: ${type}`" />
        </el-form-item>
      </el-form>
      <div v-if="testResult" style="margin-top: 20px">
        <el-divider>测试结果</el-divider>
        <el-alert :type="testResult.success ? 'success' : 'error'" :closable="false">
          <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="showTestDialog = false">关闭</el-button>
        <el-button type="primary" @click="runTest" :loading="testing">执行测试</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { api } from '@/api/modules/ontology'

const loading = ref(false)
const actions = ref([])
const showCreateDialog = ref(false)
const showSchemaDialog = ref(false)
const showTestDialog = ref(false)
const editingAction = ref(null)
const currentSchema = ref(null)
const testingAction = ref(null)
const testParams = ref({})
const testResult = ref(null)
const testing = ref(false)
const inputSchemaText = ref('')
const outputSchemaText = ref('')

const form = ref({
  name: '',
  description: '',
  api_url: '',
  method: 'POST',
  input_schema: {},
  output_schema: {}
})

const loadActions = async () => {
  loading.value = true
  try {
    actions.value = await api.getActions()
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const editAction = (action) => {
  editingAction.value = action
  form.value = { ...action }
  inputSchemaText.value = JSON.stringify(action.input_schema, null, 2)
  outputSchemaText.value = action.output_schema ? JSON.stringify(action.output_schema, null, 2) : ''
  showCreateDialog.value = true
}

const deleteAction = async (action) => {
  try {
    await ElMessageBox.confirm('确定要删除这个Action吗？', '警告', { type: 'warning' })
    await api.deleteAction(action.id)
    ElMessage.success('删除成功')
    loadActions()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const saveAction = async () => {
  try {
    let inputSchema = {}
    let outputSchema = {}
    
    if (inputSchemaText.value.trim()) {
      try {
        inputSchema = JSON.parse(inputSchemaText.value)
      } catch {
        ElMessage.error('输入Schema JSON格式错误')
        return
      }
    }
    
    if (outputSchemaText.value.trim()) {
      try {
        outputSchema = JSON.parse(outputSchemaText.value)
      } catch {
        ElMessage.error('输出Schema JSON格式错误')
        return
      }
    }

    const data = {
      ...form.value,
      input_schema: inputSchema,
      output_schema: outputSchema
    }

    if (editingAction.value) {
      await api.updateAction(editingAction.value.id, data)
      ElMessage.success('更新成功')
    } else {
      await api.createAction(data)
      ElMessage.success('创建成功')
    }
    
    showCreateDialog.value = false
    editingAction.value = null
    form.value = { name: '', description: '', api_url: '', method: 'POST', input_schema: {}, output_schema: {} }
    inputSchemaText.value = ''
    outputSchemaText.value = ''
    loadActions()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const viewSchema = (action) => {
  currentSchema.value = action
  showSchemaDialog.value = true
}

const testAction = (action) => {
  testingAction.value = action
  testParams.value = {}
  testResult.value = null
  showTestDialog.value = true
}

const runTest = async () => {
  testing.value = true
  try {
    testResult.value = await api.testAction(testingAction.value.id, testParams.value)
  } catch (error) {
    testResult.value = { success: false, error: error.message }
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  loadActions()
})
</script>

<style scoped>
.action-list {
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

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
  margin: 0;
}
</style>
