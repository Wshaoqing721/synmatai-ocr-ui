<template>
  <div class="mapping-workspace">
    <!-- 顶部导航栏 -->
    <div class="workspace-header">
      <div class="header-left">
        <el-button link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回画布
        </el-button>
        <h2>字段映射工作区</h2>
        <el-tag type="info">{{ dataSourceName }} → {{ ontologyName }}</el-tag>
      </div>
      <div class="header-right">
        <el-button @click="autoMap">智能映射</el-button>
        <el-button @click="clearMappings">清除映射</el-button>
        <el-button type="primary" @click="saveMappings">保存映射</el-button>
      </div>
    </div>

    <!-- 三栏布局：数据源 JSON 树 + 映射关系区 + 本体字段列表 -->
    <div class="workspace-content">
      <!-- 左侧：数据源 JSON 树 -->
      <div class="left-column">
        <div class="column-header">
          <h3>数据源结构</h3>
          <el-button size="small" @click="fetchPreviewData">刷新数据</el-button>
        </div>
        <div class="json-tree-container">
          <el-tree
            ref="jsonTree"
            :data="jsonTreeData"
            :props="treeProps"
            node-key="path"
            :expand-on-click-node="false"
            draggable
            @node-drag-start="onNodeDragStart"
          >
            <template #default="{ node, data }">
              <div 
                class="tree-node-content"
                :class="{ 'is-mapped': isMapped(data.path) }"
                @click="selectSourceField(data)"
              >
                <span class="node-label">{{ node.label }}</span>
                <span class="node-type">{{ data.type }}</span>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 中间：映射关系可视化区域 -->
      <div class="middle-column">
        <div class="column-header">
          <h3>映射关系</h3>
          <span class="mapping-count">{{ mappings.length }} 条映射</span>
        </div>
        <div class="mapping-canvas-container" ref="mappingCanvas">
          <svg class="mapping-canvas" :width="canvasWidth" :height="canvasHeight">
            <!-- 映射连线 -->
            <g class="mapping-lines">
              <g v-for="(mapping, idx) in mappings" :key="idx">
                <path
                  :d="getMappingPath(mapping)"
                  class="mapping-line"
                  :class="{ selected: selectedMapping?.source === mapping.source }"
                  @click="selectMapping(mapping)"
                />
                <circle
                  :cx="20"
                  :cy="getMappingY(idx, 'source')"
                  r="4"
                  class="mapping-dot source"
                />
                <circle
                  :cx="canvasWidth - 20"
                  :cy="getMappingY(idx, 'target')"
                  r="4"
                  class="mapping-dot target"
                />
              </g>
            </g>

            <!-- 拖拽中的临时连线 -->
            <path
              v-if="draggingLine"
              :d="draggingLine.path"
              class="mapping-line dragging"
              stroke-dasharray="5,5"
            />
          </svg>

          <!-- 映射规则说明 -->
          <div v-if="selectedMapping" class="mapping-detail">
            <div class="detail-header">
              <span>映射详情</span>
              <el-button link type="danger" size="small" @click="removeMapping(selectedMapping)">
                删除
              </el-button>
            </div>
            <div class="detail-content">
              <p><strong>源字段:</strong> {{ selectedMapping.source }}</p>
              <p><strong>目标字段:</strong> {{ selectedMapping.target }}</p>
              <el-form size="small" style="margin-top: 12px">
                <el-form-item label="转换规则">
                  <el-select v-model="selectedMapping.transform" placeholder="选择转换规则">
                    <el-option label="直接映射" value="direct" />
                    <el-option label="字符串转数字" value="toNumber" />
                    <el-option label="时间格式化" value="formatDate" />
                    <el-option label="自定义函数" value="custom" />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="selectedMapping.transform === 'custom'" label="转换函数">
                  <el-input
                    v-model="selectedMapping.customTransform"
                    type="textarea"
                    :rows="3"
                    placeholder="value => { return value.toUpperCase(); }"
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：本体字段列表 -->
      <div class="right-column">
        <div class="column-header">
          <h3>本体字段</h3>
          <el-tag size="small">{{ ontologyFields.length }} 个字段</el-tag>
        </div>
        <div class="field-list-container">
          <div
            v-for="(field, idx) in ontologyFields"
            :key="field.field_id"
            class="field-item"
            :class="{ 'is-mapped': isFieldMapped(field.field_id), required: field.is_required }"
            @drop="onFieldDrop($event, field)"
            @dragover.prevent
            @click="selectTargetField(field)"
          >
            <div class="field-header">
              <span class="field-name">
                {{ field.field_name }}
                <el-icon v-if="field.is_key" color="#f56c6c"><Key /></el-icon>
              </span>
              <el-tag size="small" :type="field.is_required ? 'danger' : 'info'">
                {{ field.field_type }}
              </el-tag>
            </div>
            <div class="field-id">{{ field.field_id }}</div>
            <div v-if="getFieldMapping(field.field_id)" class="field-mapping-info">
              <el-icon><Link /></el-icon>
              <span>{{ getFieldMapping(field.field_id).source }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Key, Link } from '@element-plus/icons-vue'
import { api } from '@/api/modules/ontology'

const router = useRouter()
const route = useRoute()

interface FieldMapping {
  source: string
  target: string
  transform?: string
  customTransform?: string
}

interface TreeNode {
  label: string
  path: string
  type: string
  value?: any
  children?: TreeNode[]
}

const dataSourceId = ref(Number(route.query.datasource))
const ontologyId = ref(Number(route.query.ontology))
const edgeId = ref(route.query.edge as string)

const dataSourceName = ref('')
const ontologyName = ref('')
const jsonTreeData = ref<TreeNode[]>([])
const ontologyFields = ref<any[]>([])
const mappings = ref<FieldMapping[]>([])

const selectedMapping = ref<FieldMapping | null>(null)
const selectedSourceField = ref<any>(null)
const selectedTargetField = ref<any>(null)

const canvasWidth = ref(400)
const canvasHeight = ref(600)
const mappingCanvas = ref<HTMLElement | null>(null)

const draggingLine = ref<any>(null)
const draggingSourcePath = ref('')

const treeProps = {
  label: 'label',
  children: 'children'
}

const loadData = async () => {
  try {
    const ds = await api.getDataSource(dataSourceId.value)
    console.log('Data Source:', ds)
    const ont = await api.getOntology(ontologyId.value)
    console.log('Ontology:', ont)
    dataSourceName.value = ds.name
    ontologyName.value = ont.name
    ontologyFields.value = ont.fields || []
    console.log('Ontology Fields:', ontologyFields.value)
    await fetchPreviewData()
    console.log('Preview Data:', jsonTreeData.value)
    const existingMappings = await api.getMappings()
    const currentMapping = existingMappings.find(
      (m: any) => m.datasource === dataSourceId.value && m.ontology === ontologyId.value
    )
    console.log('Current Mapping:', currentMapping)
    if (currentMapping?.field_mapping) {
      // Convert Record<string, string> to FieldMapping[]
      // API format: { [externalField]: ontologyField }
      mappings.value = Object.entries(currentMapping.field_mapping).map(([source, target]) => ({
        source,
        target: target as string,
        transform: 'direct'
      }))
    }
  } catch (error) {
    ElMessage.error(`加载数据失败: ${error}`)
  }
}

const fetchPreviewData = async () => {
  try {
    const previewData = await api.previewData(dataSourceId.value)
    
    if (previewData && previewData.data && previewData.data.length > 0) {
      jsonTreeData.value = buildJsonTree(previewData.data[0], '')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取预览数据失败')
  }
}

const buildJsonTree = (data: any, parentPath: string): TreeNode[] => {
  if (typeof data !== 'object' || data === null) {
    return []
  }
  
  return Object.keys(data).map(key => {
    const value = data[key]
    const path = parentPath ? `${parentPath}.${key}` : key
    const type = Array.isArray(value) ? 'array' : typeof value
    
    const node: TreeNode = {
      label: key,
      path,
      type,
      value
    }
    
    if (type === 'object' && value !== null) {
      node.children = buildJsonTree(value, path)
    } else if (type === 'array' && value.length > 0) {
      node.children = buildJsonTree(value[0], `${path}[0]`)
    }
    
    return node
  })
}

const isMapped = (path: string) => {
  return mappings.value.some(m => m.source === path)
}

const isFieldMapped = (fieldId: string) => {
  return mappings.value.some(m => m.target === fieldId)
}

const getFieldMapping = (fieldId: string) => {
  return mappings.value.find(m => m.target === fieldId)
}

const selectSourceField = (data: any) => {
  selectedSourceField.value = data
  selectedMapping.value = mappings.value.find(m => m.source === data.path) || null
}

const selectTargetField = (field: any) => {
  selectedTargetField.value = field
  selectedMapping.value = mappings.value.find(m => m.target === field.field_id) || null
}

const onNodeDragStart = (node: any, ev: DragEvent) => {
  draggingSourcePath.value = node.data.path
  
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'copy'
    ev.dataTransfer.setData('sourcePath', node.data.path)
  }
}

const onFieldDrop = (ev: DragEvent, field: any) => {
  ev.preventDefault()
  const sourcePath = ev.dataTransfer?.getData('sourcePath') || draggingSourcePath.value
  
  if (!sourcePath) return
  
  const existingMapping = mappings.value.find(m => m.target === field.field_id)
  if (existingMapping) {
    existingMapping.source = sourcePath
  } else {
    mappings.value.push({
      source: sourcePath,
      target: field.field_id,
      transform: 'direct'
    })
  }
  
  draggingSourcePath.value = ''
  ElMessage.success('映射已创建')
}

const selectMapping = (mapping: FieldMapping) => {
  selectedMapping.value = mapping
}

const removeMapping = (mapping: FieldMapping) => {
  mappings.value = mappings.value.filter(m => m !== mapping)
  selectedMapping.value = null
  ElMessage.success('映射已删除')
}

const getMappingPath = (mapping: FieldMapping) => {
  const idx = mappings.value.indexOf(mapping)
  const sourceY = getMappingY(idx, 'source')
  const targetY = getMappingY(idx, 'target')
  
  const startX = 20
  const endX = canvasWidth.value - 20
  const midX = canvasWidth.value / 2
  
  return `M ${startX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${endX} ${targetY}`
}

const getMappingY = (idx: number, side: 'source' | 'target') => {
  const spacing = 40
  const offset = 60
  return offset + idx * spacing
}

const autoMap = () => {
  let count = 0
  
  ontologyFields.value.forEach(field => {
    if (isFieldMapped(field.field_id)) return
    
    const matchedPath = findMatchingPath(field.field_id, field.field_name)
    if (matchedPath) {
      mappings.value.push({
        source: matchedPath,
        target: field.field_id,
        transform: 'direct'
      })
      count++
    }
  })
  
  if (count > 0) {
    ElMessage.success(`自动映射了 ${count} 个字段`)
  } else {
    ElMessage.info('未找到可自动映射的字段')
  }
}

const findMatchingPath = (fieldId: string, fieldName: string): string | null => {
  const searchInTree = (nodes: TreeNode[]): string | null => {
    for (const node of nodes) {
      if (node.label.toLowerCase() === fieldId.toLowerCase() ||
          node.label.toLowerCase() === fieldName.toLowerCase()) {
        return node.path
      }
      
      if (node.children) {
        const found = searchInTree(node.children)
        if (found) return found
      }
    }
    return null
  }
  
  return searchInTree(jsonTreeData.value)
}

const clearMappings = () => {
  mappings.value = []
  selectedMapping.value = null
  ElMessage.success('已清除所有映射')
}

const saveMappings = async () => {
  try {
    // Convert FieldMapping[] to Record<string, string>
    const fieldMappingRecord: Record<string, string> = {}
    mappings.value.forEach(m => {
      fieldMappingRecord[m.source] = m.target
    })

    const mappingData = {
      datasource: dataSourceId.value,
      ontology: ontologyId.value,
      field_mapping: fieldMappingRecord
    }
    
    await api.createMapping(mappingData)
    ElMessage.success('映射已保存')
  } catch (error) {
    console.error(error)
    ElMessage.error('保存失败')
  }
}

const goBack = () => {
  router.push('/ontology/ontologies')
}

const updateCanvasSize = () => {
  if (mappingCanvas.value) {
    const rect = mappingCanvas.value.getBoundingClientRect()
    canvasWidth.value = rect.width
    canvasHeight.value = Math.max(600, mappings.value.length * 40 + 120)
  }
}

onMounted(async () => {
  await loadData()
  await nextTick()
  updateCanvasSize()
  
  window.addEventListener('resize', updateCanvasSize)
})
</script>

<style scoped>
.mapping-workspace {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  font-size: 18px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.workspace-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-column,
.right-column {
  width: 320px;
  background: white;
  display: flex;
  flex-direction: column;
}

.left-column {
  border-right: 1px solid #e4e7ed;
}

.right-column {
  border-left: 1px solid #e4e7ed;
}

.middle-column {
  flex: 1;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  position: relative;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.column-header h3 {
  margin: 0;
  font-size: 16px;
}

.mapping-count {
  font-size: 14px;
  color: #909399;
}

.json-tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.tree-node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.tree-node-content:hover {
  background: #f5f7fa;
}

.tree-node-content.is-mapped {
  background: #e8f4ff;
  border-left: 3px solid #409eff;
}

.node-label {
  font-size: 14px;
  color: #303133;
}

.node-type {
  font-size: 12px;
  color: #909399;
  padding: 2px 6px;
  background: #f5f7fa;
  border-radius: 3px;
}

.mapping-canvas-container {
  flex: 1;
  position: relative;
  overflow: auto;
}

.mapping-canvas {
  display: block;
}

.mapping-line {
  fill: none;
  stroke: #409eff;
  stroke-width: 2;
  cursor: pointer;
  transition: all 0.2s;
}

.mapping-line:hover,
.mapping-line.selected {
  stroke: #66b1ff;
  stroke-width: 3;
}

.mapping-line.dragging {
  stroke: #909399;
}

.mapping-dot {
  fill: #409eff;
}

.mapping-dot.source {
  fill: #67c23a;
}

.mapping-dot.target {
  fill: #f56c6c;
}

.mapping-detail {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 300px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.detail-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.field-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.field-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border: 2px dashed transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.field-item:hover {
  background: #e8edf3;
  border-color: #409eff;
}

.field-item.is-mapped {
  background: #e8f4ff;
  border-color: #409eff;
  border-style: solid;
}

.field-item.required {
  border-left: 3px solid #f56c6c;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.field-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-id {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.field-mapping-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #409eff;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
}
</style>
