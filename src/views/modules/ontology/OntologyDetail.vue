<template>
  <div class="ontology-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span class="title">{{ ontology?.name }}</span>
          <div>
            <el-button @click="$router.back()">返回</el-button>
            <el-button type="primary" @click="showAddFieldDialog = true">
              <el-icon><Plus /></el-icon>
              添加字段
            </el-button>
            <el-button type="success" @click="showBindActionDialog = true">
              绑定Action
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="sortedFields" row-key="field_id">
        <el-table-column label="排序" width="80">
          <template #default="{ $index }">
            <el-icon style="cursor: move"><Rank /></el-icon>
            {{ $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="field_id" label="字段ID" />
        <el-table-column prop="field_name" label="字段名称" />
        <el-table-column prop="field_type" label="类型" />
        <el-table-column label="属性">
          <template #default="{ row }">
            <el-tag v-if="row.is_key" type="danger" size="small">主键</el-tag>
            <el-tag v-if="row.is_required" type="warning" size="small">必填</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="校验规则">
          <template #default="{ row }">
            <el-button v-if="row.validation_rule" link type="primary" @click="showValidationRule(row)">
              查看
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="editField(row)">编辑</el-button>
            <el-button link type="danger" @click="deleteField(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Add/Edit Field Dialog -->
    <el-dialog v-model="showAddFieldDialog" :title="editingField ? '编辑字段' : '添加字段'" width="600px">
      <el-form :model="fieldForm" label-width="100px">
        <el-form-item label="字段ID">
          <el-input v-model="fieldForm.field_id" placeholder="field_id" />
        </el-form-item>
        <el-form-item label="字段名称">
          <el-input v-model="fieldForm.field_name" placeholder="字段显示名称" />
        </el-form-item>
        <el-form-item label="字段类型">
          <el-select v-model="fieldForm.field_type" placeholder="选择类型">
            <el-option label="字符串" value="string" />
            <el-option label="整数" value="integer" />
            <el-option label="浮点数" value="float" />
            <el-option label="布尔" value="boolean" />
            <el-option label="日期" value="date" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否主键">
          <el-switch v-model="fieldForm.is_key" />
        </el-form-item>
        <el-form-item label="是否必填">
          <el-switch v-model="fieldForm.is_required" />
        </el-form-item>
        <el-form-item label="校验规则">
          <el-input
            v-model="validationRuleText"
            type="textarea"
            :rows="4"
            placeholder='{"min": 0, "max": 100}'
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddFieldDialog = false">取消</el-button>
        <el-button type="primary" @click="saveField">保存</el-button>
      </template>
    </el-dialog>

    <!-- Validation Rule Dialog -->
    <el-dialog v-model="showRuleDialog" title="校验规则" width="500px">
      <pre>{{ JSON.stringify(currentRule, null, 2) }}</pre>
    </el-dialog>

    <!-- Bind Action Dialog -->
    <el-dialog v-model="showBindActionDialog" title="绑定Action" width="800px">
      <div class="bind-container">
        <div class="bind-left">
          <h4>本体字段</h4>
          <el-card v-for="field in ontology?.fields" :key="field.field_id" shadow="hover" class="field-card">
            {{ field.field_name }} ({{ field.field_id }})
          </el-card>
        </div>
        <div class="bind-middle">
          <el-icon size="30"><Right /></el-icon>
        </div>
        <div class="bind-right">
          <h4>Action参数</h4>
          <el-select v-model="selectedAction" placeholder="选择Action" style="width: 100%; margin-bottom: 10px" @change="loadActionSchema">
            <el-option v-for="action in actions" :key="action.id" :label="action.name" :value="action.id" />
          </el-select>
          <div v-if="selectedAction">
            <el-form label-width="120px">
              <el-form-item v-for="(type, param) in actionSchema" :key="param" :label="param">
                <el-select v-model="fieldMapping[param]" placeholder="选择字段或静态值">
                  <el-option label="静态值" value="static" />
                  <el-option v-for="field in ontology?.fields" :key="field.field_id" :label="field.field_name" :value="field.field_id" />
                </el-select>
                <el-input v-if="fieldMapping[param] === 'static'" v-model="staticValues[param]" placeholder="输入静态值" style="margin-top: 5px" />
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showBindActionDialog = false">取消</el-button>
        <el-button type="primary" @click="saveBinding">保存绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Rank, Right } from '@element-plus/icons-vue'
import { api } from '@/api/modules/ontology'

const route = useRoute()
const loading = ref(false)
const ontology = ref(null)
const showAddFieldDialog = ref(false)
const showRuleDialog = ref(false)
const showBindActionDialog = ref(false)
const editingField = ref(null)
const currentRule = ref(null)
const validationRuleText = ref('')
const actions = ref([])
const selectedAction = ref(null)
const actionSchema = ref({})
const fieldMapping = ref({})
const staticValues = ref({})

const fieldForm = ref({
  field_id: '',
  field_name: '',
  field_type: 'string',
  is_key: false,
  is_required: false
})

const sortedFields = computed(() => {
  if (!ontology.value?.fields) return []
  return [...ontology.value.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
})

const loadOntology = async () => {
  loading.value = true
  try {
    const id = parseInt(route.params.id)
    ontology.value = await api.getOntology(id)
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadActions = async () => {
  try {
    actions.value = await api.getActions()
  } catch (error) {
    ElMessage.error('加载Action列表失败')
  }
}

const loadActionSchema = () => {
  const action = actions.value.find(a => a.id === selectedAction.value)
  if (action) {
    actionSchema.value = action.input_schema
    fieldMapping.value = {}
    staticValues.value = {}
  }
}

const editField = (field) => {
  editingField.value = field
  fieldForm.value = { ...field }
  validationRuleText.value = field.validation_rule ? JSON.stringify(field.validation_rule, null, 2) : ''
  showAddFieldDialog.value = true
}

const deleteField = async (field) => {
  try {
    await ElMessageBox.confirm('确定要删除这个字段吗？', '警告', { type: 'warning' })
    const newFields = ontology.value.fields.filter(f => f.field_id !== field.field_id)
    await api.updateOntology(ontology.value.id, { fields: newFields })
    ElMessage.success('删除成功')
    loadOntology()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const saveField = async () => {
  try {
    let validationRule = null
    if (validationRuleText.value.trim()) {
      try {
        validationRule = JSON.parse(validationRuleText.value)
      } catch {
        ElMessage.error('校验规则JSON格式错误')
        return
      }
    }

    const fieldData = { ...fieldForm.value, validation_rule: validationRule }
    let newFields = [...ontology.value.fields]
    
    if (editingField.value) {
      const index = newFields.findIndex(f => f.field_id === editingField.value.field_id)
      newFields[index] = fieldData
    } else {
      fieldData.order = newFields.length
      newFields.push(fieldData)
    }

    await api.updateOntology(ontology.value.id, { fields: newFields })
    ElMessage.success('保存成功')
    showAddFieldDialog.value = false
    editingField.value = null
    fieldForm.value = { field_id: '', field_name: '', field_type: 'string', is_key: false, is_required: false }
    validationRuleText.value = ''
    loadOntology()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const showValidationRule = (field) => {
  currentRule.value = field.validation_rule
  showRuleDialog.value = true
}

const saveBinding = async () => {
  try {
    const mapping = {}
    for (const [param, value] of Object.entries(fieldMapping.value)) {
      if (value === 'static') {
        mapping[param] = `static:${staticValues.value[param]}`
      } else {
        mapping[param] = value
      }
    }
    
    await api.bindAction(ontology.value.id, selectedAction.value, mapping)
    ElMessage.success('绑定成功')
    showBindActionDialog.value = false
    selectedAction.value = null
    fieldMapping.value = {}
    staticValues.value = {}
  } catch (error) {
    ElMessage.error('绑定失败')
  }
}

onMounted(() => {
  loadOntology()
  loadActions()
})
</script>

<style scoped>
.ontology-detail {
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

.field-card {
  margin-bottom: 10px;
  cursor: pointer;
}

.bind-container {
  display: flex;
  gap: 20px;
}

.bind-left,
.bind-right {
  flex: 1;
}

.bind-middle {
  display: flex;
  align-items: center;
  justify-content: center;
}

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
}
</style>
