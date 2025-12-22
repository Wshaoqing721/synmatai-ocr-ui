<template>
  <div class="create-mapping">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">创建数据映射</span>
          <el-button @click="$router.back()">返回</el-button>
        </div>
      </template>

      <el-steps :active="currentStep" align-center style="margin-bottom: 30px">
        <el-step title="选择本体" />
        <el-step title="选择数据源" />
        <el-step title="预览数据" />
        <el-step title="字段映射" />
      </el-steps>

      <!-- Step 1: Select Ontology -->
      <div v-if="currentStep === 0">
        <el-table :data="ontologies" @row-click="selectOntology" highlight-current-row>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="本体名称" />
          <el-table-column label="字段数量">
            <template #default="{ row }">
              {{ row.fields?.length || 0 }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Step 2: Select DataSource -->
      <div v-if="currentStep === 1">
        <el-table :data="dataSources" @row-click="selectDataSource" highlight-current-row>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="数据源名称" />
          <el-table-column prop="url" label="URL" />
        </el-table>
      </div>

      <!-- Step 3: Preview Data -->
      <div v-if="currentStep === 2">
        <el-alert title="数据预览" type="info" :closable="false" style="margin-bottom: 20px">
          点击"预览数据"按钮查看数据源返回的数据结构
        </el-alert>
        <el-button type="primary" @click="previewData" :loading="previewing">预览数据</el-button>
        <div v-if="previewResult" style="margin-top: 20px">
          <pre>{{ JSON.stringify(previewResult, null, 2) }}</pre>
        </div>
      </div>

      <!-- Step 4: Field Mapping -->
      <div v-if="currentStep === 3">
        <!-- 改进映射界面，使用三栏布局 -->
        <div class="mapping-container-v2">
          <div class="mapping-column">
            <h4>数据源字段</h4>
            <div class="field-tree">
              <div v-for="field in externalFields" :key="field" class="source-field">
                <el-icon><Document /></el-icon>
                <span>{{ field }}</span>
              </div>
            </div>
          </div>
          
          <div class="mapping-column mapping-lines">
            <h4>映射关系</h4>
            <div class="connection-area">
              <svg width="100%" height="400" style="border: 1px dashed #ddd; border-radius: 4px">
                <line
                  v-for="(targetField, sourceField) in activeMapping"
                  :key="sourceField"
                  x1="0"
                  :y1="getSourceY(sourceField)"
                  x2="100%"
                  :y2="getTargetY(targetField)"
                  stroke="#409eff"
                  stroke-width="2"
                />
              </svg>
            </div>
          </div>
          
          <div class="mapping-column">
            <h4>本体字段</h4>
            <div class="field-tree">
              <div v-for="field in selectedOntology?.fields" :key="field.field_id" class="target-field">
                <el-select 
                  v-model="fieldMapping[field.field_id]" 
                  placeholder="选择源字段" 
                  clearable
                  size="small"
                  style="width: 100%"
                >
                  <el-option v-for="extField in externalFields" :key="extField" :label="extField" :value="extField" />
                </el-select>
                <span class="field-label">{{ field.field_name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: 30px; text-align: center">
        <el-button v-if="currentStep > 0" @click="currentStep--">上一步</el-button>
        <el-button v-if="currentStep < 3" type="primary" @click="currentStep++" :disabled="!canProceed">下一步</el-button>
        <el-button v-if="currentStep === 3" type="success" @click="saveMapping" :loading="saving">保存映射</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Right, Document } from '@element-plus/icons-vue'
import { api } from '@/api/modules/ontology'

const router = useRouter()
const currentStep = ref(0)
const ontologies = ref([])
const dataSources = ref([])
const selectedOntology = ref(null)
const selectedDataSource = ref(null)
const previewResult = ref(null)
const previewing = ref(false)
const saving = ref(false)
const fieldMapping = ref({})

const externalFields = computed(() => {
  if (!previewResult.value?.data?.[0]) return []
  return Object.keys(previewResult.value.data[0])
})

const canProceed = computed(() => {
  if (currentStep.value === 0) return !!selectedOntology.value
  if (currentStep.value === 1) return !!selectedDataSource.value
  if (currentStep.value === 2) return !!previewResult.value
  return true
})

const loadData = async () => {
  try {
    ontologies.value = await api.getOntologies()
    dataSources.value = await api.getDataSources()
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const selectOntology = (row) => {
  selectedOntology.value = row
}

const selectDataSource = (row) => {
  selectedDataSource.value = row
}

const previewData = async () => {
  previewing.value = true
  try {
    previewResult.value = await api.previewData(selectedDataSource.value.id)
  } catch (error) {
    ElMessage.error('预览失败')
  } finally {
    previewing.value = false
  }
}

const saveMapping = async () => {
  saving.value = true
  try {
    // Convert mapping object to expected format
    const mappingData = {}
    for (const [ontologyField, externalField] of Object.entries(fieldMapping.value)) {
      if (externalField) {
        mappingData[externalField] = ontologyField
      }
    }

    await api.createMapping({
      datasource: selectedDataSource.value.id,
      ontology: selectedOntology.value.id,
      field_mapping: mappingData
    })
    
    ElMessage.success('映射创建成功')
    router.push('/mappings')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const getSourceY = (field) => {
  const index = externalFields.value.indexOf(field)
  return 30 + index * 40
}

const getTargetY = (fieldId) => {
  const index = selectedOntology.value?.fields.findIndex((f) => f.field_id === fieldId)
  return 30 + (index || 0) * 40
}

const activeMapping = computed(() => {
  const result = {}
  for (const [ontologyField, externalField] of Object.entries(fieldMapping.value)) {
    if (externalField) {
      result[externalField] = ontologyField
    }
  }
  return result
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.create-mapping {
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

.mapping-container {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.mapping-section {
  flex: 1;
}

.mapping-center {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 50px;
}

.field-item {
  margin-bottom: 10px;
  cursor: pointer;
}

.mapping-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.field-label {
  min-width: 200px;
  font-weight: 500;
}

pre {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow: auto;
  max-height: 400px;
}

/* 添加新的映射界面样式 */
.mapping-container-v2 {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.mapping-column {
  flex: 1;
  min-width: 0;
}

.mapping-column h4 {
  text-align: center;
  margin-bottom: 15px;
  color: #606266;
}

.mapping-lines {
  flex: 0.5;
}

.field-tree {
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 15px;
  min-height: 400px;
}

.source-field,
.target-field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.target-field {
  flex-direction: column;
  align-items: stretch;
}

.field-label {
  font-weight: 500;
  color: #303133;
  margin-top: 5px;
}

.connection-area {
  background: #fafafa;
  border-radius: 4px;
  padding: 10px;
}
</style>
