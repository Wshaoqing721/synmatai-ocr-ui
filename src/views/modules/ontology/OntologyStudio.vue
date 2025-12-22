<template>
  <div class="ontology-studio">
    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <div class="toolbar-left">
        <h2>Ontology Studio</h2>
        <div class="schema-version">
          <span>Schema Version: v{{ schemaVersion }}</span>
          <el-tag :type="hasUnpublished ? 'warning' : 'success'" size="small">
            {{ hasUnpublished ? '未发布' : '已发布' }}
          </el-tag>
        </div>
      </div>
      <div class="toolbar-right">
        <el-button @click="showVersionHistory">查看历史</el-button>
        <el-button type="primary" @click="publishSchema" :disabled="!hasUnpublished">
          发布版本
        </el-button>
        <el-button @click="saveCanvas">保存</el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="studio-content">
      <!-- 左侧资源面板 -->
      <div class="left-panel">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="本体列表" name="ontologies">
            <div class="resource-list">
              <el-button type="primary" size="small" @click="createOntology" style="width: 100%; margin-bottom: 10px">
                <el-icon><Plus /></el-icon>
                新建本体
              </el-button>
              <div
                v-for="ontology in ontologies"
                :key="ontology.id"
                class="resource-item"
                draggable="true"
                @dragstart="onDragStart($event, 'ontology', ontology)"
                @click="addNodeToCanvas(ontology)"
              >
                <el-icon><Document /></el-icon>
                <span>{{ ontology.name }}</span>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="数据源" name="datasources">
            <div class="resource-list">
              <div
                v-for="ds in dataSources"
                :key="ds.id"
                class="resource-item datasource"
                draggable="true"
                @dragstart="onDragStart($event, 'datasource', ds)"
                @click="addDataSourceToCanvas(ds)"
              >
                <el-icon><Connection /></el-icon>
                <span>{{ ds.name }}</span>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 中间图谱画布 -->
      <div class="canvas-container" @drop="onCanvasDrop" @dragover.prevent>
        <div class="canvas-toolbar">
          <el-button-group>
            <el-button size="small" @click="zoomIn">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button size="small" @click="zoomOut">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button size="small" @click="resetZoom">重置</el-button>
          </el-button-group>
          <span style="margin-left: 10px">{{ Math.round(zoom * 100) }}%</span>
        </div>
        <div
          ref="canvasWrapper"
          class="canvas-wrapper"
          @mousedown="onCanvasMouseDown"
          @mousemove="onCanvasMouseMove"
          @mouseup="onCanvasMouseUp"
        >
          <svg
            ref="canvas"
            class="graph-canvas"
            :style="{ transform: `scale(${zoom})` }"
            @click="onCanvasClick"
          >
            <!-- 简化关系线显示 - DataSource到Ontology只显示虚线 -->
            <g class="edges">
              <g v-for="edge in edges" :key="edge.id" @click.stop="selectEdge(edge)">
                <line
                  :x1="edge.x1"
                  :y1="edge.y1"
                  :x2="edge.x2"
                  :y2="edge.y2"
                  :class="[
                    'edge', 
                    { 
                      selected: selectedEdge?.id === edge.id,
                      'data-supply': edge.type === 'data-supply'
                    }
                  ]"
                  :stroke-dasharray="edge.type === 'data-supply' ? '8,4' : '0'"
                  marker-end="url(#arrowhead)"
                />
                <!-- 数据供应关系显示简单标签 -->
                <text
                  v-if="edge.type === 'data-supply'"
                  :x="(edge.x1 + edge.x2) / 2"
                  :y="(edge.y1 + edge.y2) / 2 - 5"
                  class="edge-label data-supply-label"
                  text-anchor="middle"
                  @click.stop="enterMappingMode(edge)"
                  style="cursor: pointer"
                >
                  可供数
                </text>
                <text
                  v-else
                  :x="(edge.x1 + edge.x2) / 2"
                  :y="(edge.y1 + edge.y2) / 2 - 5"
                  class="edge-label"
                  text-anchor="middle"
                >
                  {{ edge.relationType }}
                </text>
              </g>
            </g>

            <!-- 节点 -->
            <g class="nodes">
              <g
                v-for="node in nodes"
                :key="node.id"
                :transform="`translate(${node.x}, ${node.y})`"
                @mousedown.stop="onNodeMouseDown($event, node)"
                @dblclick.stop="toggleNodeExpand(node)"
                @click.stop="selectNode(node)"
                @contextmenu.prevent="showNodeContextMenu($event, node)"
              >
                <!-- 本体节点 - 简化显示，不自动展开字段 -->
                <rect
                  v-if="node.type === 'ontology'"
                  :width="node.expanded ? 240 : 160"
                  :height="node.expanded ? 180 + (node.data.fields?.length || 0) * 25 : 60"
                  :class="['node-rect', { selected: selectedNode?.id === node.id, expanded: node.expanded }]"
                  rx="8"
                />
                <!-- 数据源节点 - 六边形简洁样式 -->
                <polygon
                  v-else-if="node.type === 'datasource'"
                  :points="getHexagonPoints(120, 60)"
                  :class="['node-datasource', { selected: selectedNode?.id === node.id }]"
                />

                <!-- 节点内容 -->
                <text v-if="node.type === 'ontology'" x="80" y="38" class="node-title" text-anchor="middle">
                  {{ node.data.name }}
                </text>
                <text v-else x="60" y="38" class="node-title" text-anchor="middle">
                  {{ node.data.name }}
                </text>

                <!-- 展开的字段列表 - 仅在手动展开时显示 -->
                <g v-if="node.type === 'ontology' && node.expanded">
                  <line x1="10" :x2="230" y1="50" y2="50" class="divider" />
                  <text x="10" y="70" class="field-header">字段列表</text>
                  <g v-for="(field, idx) in node.data.fields" :key="field.field_id">
                    <text :x="15" :y="95 + idx * 25" class="field-text">
                      {{ field.field_name }}
                      <tspan class="field-type">({{ field.field_type }})</tspan>
                    </text>
                  </g>
                  <text x="10" :y="100 + (node.data.fields?.length || 0) * 25" class="add-field" @click.stop="addFieldToNode(node)">
                    + 添加字段
                  </text>
                </g>

                <!-- 连接点 - 用于创建关系 -->
                <circle
                  :cx="node.type === 'ontology' ? 160 : 120"
                  :cy="30"
                  r="6"
                  class="connection-point"
                  @mousedown.stop="startConnection($event, node)"
                />
              </g>
            </g>

            <!-- 箭头标记 -->
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#409eff" />
              </marker>
            </defs>

            <!-- 正在拖拽的连接线 -->
            <line
              v-if="connectingLine"
              :x1="connectingLine.x1"
              :y1="connectingLine.y1"
              :x2="connectingLine.x2"
              :y2="connectingLine.y2"
              class="connecting-line"
              stroke-dasharray="5,5"
            />
          </svg>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="right-panel">
        <el-card v-if="selectedNode" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>{{ selectedNode.type === 'ontology' ? '本体属性' : '数据源属性' }}</span>
              <el-button link type="danger" @click="deleteNode">删除</el-button>
            </div>
          </template>

          <el-form label-width="80px" size="small">
            <el-form-item label="名称">
              <el-input v-model="selectedNode.data.name" @change="markAsUnpublished" />
            </el-form-item>
            <el-form-item v-if="selectedNode.type === 'ontology'" label="字段数量">
              <span>{{ selectedNode.data.fields?.length || 0 }}</span>
            </el-form-item>
            <!-- 数据源节点增加映射配置入口 -->
            <el-form-item v-if="selectedNode.type === 'datasource'" label="数据映射">
              <el-select v-model="tempMappingTarget" placeholder="选择目标本体" @change="quickCreateMapping">
                <el-option
                  v-for="node in nodes.filter(n => n.type === 'ontology')"
                  :key="node.id"
                  :label="node.data.name"
                  :value="node.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 数据供应关系可进入映射模式 -->
        <el-card v-else-if="selectedEdge" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>{{ selectedEdge.type === 'data-supply' ? '数据供应关系' : '关系属性' }}</span>
              <el-button link type="danger" @click="deleteEdge">删除</el-button>
            </div>
          </template>

          <el-form label-width="80px" size="small">
            <el-form-item label="起点">
              <span>{{ getNodeName(selectedEdge.from) }}</span>
            </el-form-item>
            <el-form-item label="终点">
              <span>{{ getNodeName(selectedEdge.to) }}</span>
            </el-form-item>
            <!-- 数据供应关系显示配置映射按钮 -->
            <el-form-item v-if="selectedEdge.type === 'data-supply'" label="字段映射">
              <el-button type="primary" @click="enterMappingMode(selectedEdge)">
                配置字段映射
              </el-button>
            </el-form-item>
            <el-form-item v-else label="关系类型">
              <el-select v-model="selectedEdge.relationType" @change="updateEdge">
                <el-option label="HAS_PART" value="HAS_PART" />
                <el-option label="BELONGS_TO" value="BELONGS_TO" />
                <el-option label="DERIVED_FROM" value="DERIVED_FROM" />
                <el-option label="自定义" value="CUSTOM" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="selectedEdge.relationType === 'CUSTOM' && selectedEdge.type !== 'data-supply'" label="自定义名称">
              <el-input v-model="selectedEdge.customType" placeholder="输入关系名称" @change="updateEdge" />
            </el-form-item>
          </el-form>
        </el-card>

        <div v-else class="empty-state">
          <el-empty description="选择节点或关系以查看属性" />
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.show"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div v-if="contextMenu.node?.type === 'ontology'" class="menu-item" @click="editNodeProperties">编辑本体</div>
      <div class="menu-item" @click="createRelationFromMenu">创建关系</div>
      <!-- 数据源右键菜单增加配置映射选项 -->
      <div v-if="contextMenu.node?.type === 'datasource'" class="menu-item" @click="showMappingOptionsFromMenu">配置数据映射</div>
      <div class="menu-item danger" @click="deleteNodeFromMenu">删除节点</div>
    </div>

    <!-- 字段编辑对话框 -->
    <el-dialog v-model="showFieldDialog" title="编辑字段" width="500px">
      <el-form :model="fieldForm" label-width="100px">
        <el-form-item label="字段ID">
          <el-input v-model="fieldForm.field_id" />
        </el-form-item>
        <el-form-item label="字段名称">
          <el-input v-model="fieldForm.field_name" />
        </el-form-item>
        <el-form-item label="字段类型">
          <el-select v-model="fieldForm.field_type">
            <el-option label="字符串" value="string" />
            <el-option label="整数" value="integer" />
            <el-option label="浮点数" value="float" />
            <el-option label="布尔" value="boolean" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否主键">
          <el-switch v-model="fieldForm.is_key" />
        </el-form-item>
        <el-form-item label="是否必填">
          <el-switch v-model="fieldForm.is_required" />
        </el-form-item>
        <el-form-item label="校验规则">
          <el-input v-model="validationRuleText" type="textarea" :rows="3" placeholder='{"min": 0, "max": 100}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFieldDialog = false">取消</el-button>
        <el-button type="primary" @click="saveField">保存</el-button>
      </template>
    </el-dialog>

    <!-- 创建关系对话框 -->
    <el-dialog v-model="showRelationDialog" title="创建关系" width="400px">
      <el-form label-width="100px">
        <el-form-item label="目标节点">
          <el-select v-model="relationForm.targetNodeId" placeholder="选择目标节点">
            <el-option
              v-for="node in nodes.filter(n => n.id !== contextMenu.node?.id && n.id !== connectingFrom?.id)"
              :key="node.id"
              :label="node.data.name"
              :value="node.id"
            />
          </el-select>
        </el-form-item>
        <!-- 根据节点类型决定关系类型 -->
        <el-form-item v-if="isDataSupplyRelation" label="关系类型">
          <el-input value="数据供应" disabled />
        </el-form-item>
        <el-form-item v-else label="关系类型">
          <el-select v-model="relationForm.relationType">
            <el-option label="HAS_PART" value="HAS_PART" />
            <el-option label="BELONGS_TO" value="BELONGS_TO" />
            <el-option label="DERIVED_FROM" value="DERIVED_FROM" />
            <el-option label="自定义" value="CUSTOM" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="relationForm.relationType === 'CUSTOM' && !isDataSupplyRelation" label="自定义名称">
          <el-input v-model="relationForm.customType" placeholder="输入关系名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRelationDialog = false">取消</el-button>
        <el-button type="primary" @click="createRelation">创建</el-button>
      </template>
    </el-dialog>

    <!-- 版本历史对话框 -->
    <el-dialog v-model="showVersionDialog" title="Schema 版本历史" width="800px">
      <el-timeline>
        <el-timeline-item
          v-for="version in versionHistory"
          :key="version.version"
          :timestamp="version.timestamp"
          placement="top"
        >
          <el-card>
            <h4>v{{ version.version }}</h4>
            <p>{{ version.description }}</p>
            <el-tag v-if="version.version === schemaVersion" type="success" size="small">当前版本</el-tag>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  Plus,
  Document,
  Connection,
  ZoomIn,
  ZoomOut,
  Key
} from '@element-plus/icons-vue'
import { api } from '@/api/modules/ontology'

const router = useRouter()

interface GraphNode {
  id: string
  type: 'ontology' | 'datasource'
  x: number
  y: number
  data: any
  expanded?: boolean
}

interface GraphEdge {
  id: string
  from: string
  to: string
  type?: 'data-supply' | 'relation'
  relationType?: string
  customType?: string
  x1: number
  y1: number
  x2: number
  y2: number
}

const activeTab = ref('ontologies')
const ontologies = ref<any[]>([])
const dataSources = ref<any[]>([])
const nodes = ref<GraphNode[]>([])
const edges = ref<GraphEdge[]>([])
const selectedNode = ref<GraphNode | null>(null)
const selectedEdge = ref<GraphEdge | null>(null)
const zoom = ref(1)
const schemaVersion = ref(1)
const hasUnpublished = ref(false)
const versionHistory = ref<any[]>([
  { version: 1, timestamp: '2025-01-15 10:00', description: '初始版本' }
])

const draggingNode = ref<GraphNode | null>(null)
const dragOffset = ref({ x: 0, y: 0 })
const connectingLine = ref<any>(null)
const connectingFrom = ref<GraphNode | null>(null)
const tempMappingTarget = ref('')

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  node: null as GraphNode | null
})

const showFieldDialog = ref(false)
const showRelationDialog = ref(false)
const showVersionDialog = ref(false)
const fieldForm = ref<any>({})
const validationRuleText = ref('')
const editingNode = ref<GraphNode | null>(null)
const editingFieldIndex = ref(-1)
const relationForm = ref({
  targetNodeId: '',
  relationType: 'HAS_PART',
  customType: ''
})

const canvas = ref<SVGElement | null>(null)
const canvasWrapper = ref<HTMLElement | null>(null)

const isDataSupplyRelation = computed(() => {
  if (!connectingFrom.value || !relationForm.value.targetNodeId) return false
  
  const fromNode = connectingFrom.value
  const toNode = nodes.value.find(n => n.id === relationForm.value.targetNodeId)
  
  if (!toNode) return false
  
  return (fromNode.type === 'datasource' && toNode.type === 'ontology') ||
         (fromNode.type === 'ontology' && toNode.type === 'datasource')
})

const loadData = async () => {
  try {
    ontologies.value = await api.getOntologies()
    dataSources.value = await api.getDataSources()
    
    // 初始化一些节点用于演示
    if (nodes.value.length === 0 && ontologies.value.length > 0) {
      nodes.value = [
        {
          id: `ont-${ontologies.value[0].id}`,
          type: 'ontology',
          x: 100,
          y: 100,
          data: ontologies.value[0],
          expanded: false
        }
      ]
    }
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const addNodeToCanvas = (ontology: any) => {
  const existingNode = nodes.value.find(n => n.id === `ont-${ontology.id}`)
  if (existingNode) {
    selectedNode.value = existingNode
    return
  }

  const newNode: GraphNode = {
    id: `ont-${ontology.id}`,
    type: 'ontology',
    x: 150 + nodes.value.length * 50,
    y: 150 + nodes.value.length * 50,
    data: ontology,
    expanded: false
  }
  nodes.value.push(newNode)
  selectedNode.value = newNode
  markAsUnpublished()
}

const addDataSourceToCanvas = (ds: any) => {
  const newNode: GraphNode = {
    id: `ds-${ds.id}`,
    type: 'datasource',
    x: 400 + nodes.value.length * 50,
    y: 150 + nodes.value.length * 50,
    data: ds
  }
  nodes.value.push(newNode)
  selectedNode.value = newNode
  markAsUnpublished()
}

const selectNode = (node: GraphNode) => {
  selectedNode.value = node
  selectedEdge.value = null
}

const selectEdge = (edge: GraphEdge) => {
  selectedEdge.value = edge
  selectedNode.value = null
}

const toggleNodeExpand = (node: GraphNode) => {
  if (node.type === 'ontology') {
    node.expanded = !node.expanded
    updateEdgePositions()
  }
}

const onNodeMouseDown = (event: MouseEvent, node: GraphNode) => {
  draggingNode.value = node
  const rect = (event.target as SVGElement).getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - node.x * zoom.value,
    y: event.clientY - node.y * zoom.value
  }
}

const onCanvasMouseMove = (event: MouseEvent) => {
  if (draggingNode.value) {
    draggingNode.value.x = (event.clientX - dragOffset.value.x) / zoom.value
    draggingNode.value.y = (event.clientY - dragOffset.value.y) / zoom.value
    updateEdgePositions()
  }

  if (connectingLine.value) {
    const rect = canvasWrapper.value?.getBoundingClientRect()
    if (rect) {
      connectingLine.value.x2 = (event.clientX - rect.left) / zoom.value
      connectingLine.value.y2 = (event.clientY - rect.top) / zoom.value
    }
  }
}

const onCanvasMouseUp = (event: MouseEvent) => {
  draggingNode.value = null
  
  if (connectingLine.value && connectingFrom.value) {
    // 检查是否连接到了某个节点
    const target = nodes.value.find(n => {
      const distance = Math.sqrt(
        Math.pow(n.x - connectingLine.value.x2, 2) + 
        Math.pow(n.y - connectingLine.value.y2, 2)
      )
      return distance < 50 && n.id !== connectingFrom.value?.id
    })
    
    if (target) {
      showRelationDialog.value = true
      relationForm.value.targetNodeId = target.id
    }
    
    connectingLine.value = null
    connectingFrom.value = null
  }
}

const startConnection = (event: MouseEvent, node: GraphNode) => {
  event.stopPropagation()
  connectingFrom.value = node
  const width = node.type === 'ontology' ? (node.expanded ? 240 : 160) : 120
  connectingLine.value = {
    x1: node.x + width,
    y1: node.y + 30,
    x2: node.x + width,
    y2: node.y + 30
  }
}

const createRelation = () => {
  const fromNode = connectingFrom.value || contextMenu.value.node
  if (!fromNode || !relationForm.value.targetNodeId) return

  const toNode = nodes.value.find(n => n.id === relationForm.value.targetNodeId)
  if (!toNode) return

  const isDataSupply = (fromNode.type === 'datasource' && toNode.type === 'ontology') ||
                       (fromNode.type === 'ontology' && toNode.type === 'datasource')

  const fromWidth = fromNode.type === 'ontology' ? (fromNode.expanded ? 240 : 160) : 120
  
  const newEdge: GraphEdge = {
    id: `edge-${Date.now()}`,
    from: fromNode.id,
    to: toNode.id,
    type: isDataSupply ? 'data-supply' : 'relation',
    relationType: isDataSupply ? undefined : (relationForm.value.relationType === 'CUSTOM' 
      ? relationForm.value.customType 
      : relationForm.value.relationType),
    x1: fromNode.x + fromWidth,
    y1: fromNode.y + 30,
    x2: toNode.x,
    y2: toNode.y + 30
  }

  edges.value.push(newEdge)
  showRelationDialog.value = false
  relationForm.value = { targetNodeId: '', relationType: 'HAS_PART', customType: '' }
  connectingFrom.value = null
  markAsUnpublished()
}

const createRelationFromMenu = () => {
  showRelationDialog.value = true
}

const enterMappingMode = (edge: GraphEdge) => {
  const fromNode = nodes.value.find(n => n.id === edge.from)
  const toNode = nodes.value.find(n => n.id === edge.to)
  
  if (!fromNode || !toNode) return
  
  const dsNode = fromNode.type === 'datasource' ? fromNode : toNode
  const ontNode = fromNode.type === 'ontology' ? fromNode : toNode
  const query = {
      datasource: dsNode.data.id,
      ontology: ontNode.data.id,
      edge: edge.id
    }
  console.log('Entering mapping mode with query:', query)
  router.push({
    path: '/ontology/mapping-workspace',
    query: query
  })
}

const quickCreateMapping = () => {
  if (!selectedNode.value || !tempMappingTarget.value) return
  
  const targetNode = nodes.value.find(n => n.id === tempMappingTarget.value)
  if (!targetNode) return
  
  const fromWidth = selectedNode.value.type === 'ontology' ? 160 : 120
  
  const newEdge: GraphEdge = {
    id: `edge-${Date.now()}`,
    from: selectedNode.value.id,
    to: targetNode.id,
    type: 'data-supply',
    x1: selectedNode.value.x + fromWidth,
    y1: selectedNode.value.y + 30,
    x2: targetNode.x,
    y2: targetNode.y + 30
  }
  
  edges.value.push(newEdge)
  tempMappingTarget.value = ''
  markAsUnpublished()
  
  enterMappingMode(newEdge)
}

const showMappingOptionsFromMenu = () => {
  contextMenu.value.show = false
  if (!contextMenu.value.node) return
  
  const ontologyNodes = nodes.value.filter(n => n.type === 'ontology')
  if (ontologyNodes.length === 0) {
    ElMessage.warning('请先添加本体节点')
    return
  }
  
  showRelationDialog.value = true
}

const updateEdgePositions = () => {
  edges.value.forEach(edge => {
    const fromNode = nodes.value.find(n => n.id === edge.from)
    const toNode = nodes.value.find(n => n.id === edge.to)
    
    if (fromNode && toNode) {
      const fromWidth = fromNode.type === 'ontology' ? (fromNode.expanded ? 240 : 160) : 120
      edge.x1 = fromNode.x + fromWidth
      edge.y1 = fromNode.y + 30
      edge.x2 = toNode.x
      edge.y2 = toNode.y + 30
    }
  })
}

const updateEdge = () => {
  markAsUnpublished()
}

const deleteEdge = () => {
  if (selectedEdge.value) {
    edges.value = edges.value.filter(e => e.id !== selectedEdge.value?.id)
    selectedEdge.value = null
    markAsUnpublished()
  }
}

const deleteNode = () => {
  if (selectedNode.value) {
    nodes.value = nodes.value.filter(n => n.id !== selectedNode.value?.id)
    edges.value = edges.value.filter(e => 
      e.from !== selectedNode.value?.id && e.to !== selectedNode.value?.id
    )
    selectedNode.value = null
    markAsUnpublished()
  }
}

const deleteNodeFromMenu = () => {
  contextMenu.value.show = false
  if (contextMenu.value.node) {
    nodes.value = nodes.value.filter(n => n.id !== contextMenu.value.node?.id)
    edges.value = edges.value.filter(e => 
      e.from !== contextMenu.value.node?.id && e.to !== contextMenu.value.node?.id
    )
    contextMenu.value.node = null
  }
}

const getNodeName = (nodeId: string) => {
  const node = nodes.value.find(n => n.id === nodeId)
  return node?.data.name || 'Unknown'
}

const getHexagonPoints = (width: number, height: number) => {
  const w = width
  const h = height
  return `${w/4},${0} ${w*3/4},${0} ${w},${h/2} ${w*3/4},${h} ${w/4},${h} ${0},${h/2}`
}

const zoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.1, 2)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.1, 0.5)
}

const resetZoom = () => {
  zoom.value = 1
}

const onCanvasClick = () => {
  selectedNode.value = null
  selectedEdge.value = null
  contextMenu.value.show = false
}

const onCanvasMouseDown = (event: MouseEvent) => {
  if (event.target === canvas.value || event.target === canvasWrapper.value) {
    selectedNode.value = null
    selectedEdge.value = null
  }
}

const showNodeContextMenu = (event: MouseEvent, node: GraphNode) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    node
  }
}

const editNodeProperties = () => {
  contextMenu.value.show = false
  if (contextMenu.value.node) {
    selectedNode.value = contextMenu.value.node
  }
}

const markAsUnpublished = () => {
  hasUnpublished.value = true
}

const publishSchema = () => {
  schemaVersion.value++
  hasUnpublished.value = false
  versionHistory.value.unshift({
    version: schemaVersion.value,
    timestamp: new Date().toLocaleString('zh-CN'),
    description: `发布版本 v${schemaVersion.value}`
  })
  ElMessage.success('Schema 已发布')
}

const saveCanvas = () => {
  ElMessage.success('画布已保存')
}

const showVersionHistory = () => {
  showVersionDialog.value = true
}

const createOntology = () => {
  ElMessageBox.prompt('请输入本体名称', '新建本体', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(async ({ value }) => {
    if (!value) return
    try {
      const newOntology = await api.createOntology({
        name: value,
        fields: []
      })
      ontologies.value.push(newOntology)
      addNodeToCanvas(newOntology)
      ElMessage.success('创建成功')
    } catch (error) {
      ElMessage.error('创建失败')
    }
  }).catch(() => {})
}

const addFieldToNode = (node: GraphNode) => {
  editingNode.value = node
  editingFieldIndex.value = -1
  fieldForm.value = {
    field_id: '',
    field_name: '',
    field_type: 'string',
    is_key: false,
    is_required: false,
    validation_rule: {}
  }
  validationRuleText.value = ''
  showFieldDialog.value = true
}

const editField = (node: GraphNode, field: any) => {
  editingNode.value = node
  editingFieldIndex.value = node.data.fields.findIndex((f: any) => f.field_id === field.field_id)
  fieldForm.value = { ...field }
  validationRuleText.value = JSON.stringify(field.validation_rule || {}, null, 2)
  showFieldDialog.value = true
}

const saveField = () => {
  if (!editingNode.value) return
  
  try {
    if (validationRuleText.value) {
      fieldForm.value.validation_rule = JSON.parse(validationRuleText.value)
    }
  } catch (error) {
    ElMessage.error('校验规则格式错误')
    return
  }
  
  if (editingFieldIndex.value >= 0) {
    editingNode.value.data.fields[editingFieldIndex.value] = { ...fieldForm.value }
  } else {
    if (!editingNode.value.data.fields) {
      editingNode.value.data.fields = []
    }
    editingNode.value.data.fields.push({ ...fieldForm.value })
  }
  
  showFieldDialog.value = false
  markAsUnpublished()
  ElMessage.success('保存成功')
}

const onDragStart = (event: DragEvent, type: string, data: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('type', type)
    event.dataTransfer.setData('data', JSON.stringify(data))
  }
}

const onCanvasDrop = (event: DragEvent) => {
  event.preventDefault()
  const type = event.dataTransfer?.getData('type')
  const data = JSON.parse(event.dataTransfer?.getData('data') || '{}')
  
  const rect = canvasWrapper.value?.getBoundingClientRect()
  if (!rect) return
  
  const x = (event.clientX - rect.left) / zoom.value
  const y = (event.clientY - rect.top) / zoom.value
  
  if (type === 'ontology') {
    const existingNode = nodes.value.find(n => n.id === `ont-${data.id}`)
    if (existingNode) return
    
    const newNode: GraphNode = {
      id: `ont-${data.id}`,
      type: 'ontology',
      x,
      y,
      data,
      expanded: false
    }
    nodes.value.push(newNode)
  } else if (type === 'datasource') {
    const newNode: GraphNode = {
      id: `ds-${data.id}`,
      type: 'datasource',
      x,
      y,
      data
    }
    nodes.value.push(newNode)
  }
  
  markAsUnpublished()
}

onMounted(() => {
  loadData()
  
  // 全局点击关闭右键菜单
  document.addEventListener('click', () => {
    contextMenu.value.show = false
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', () => {
    contextMenu.value.show = false
  })
})
</script>

<style scoped>
.ontology-studio {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.top-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.toolbar-left h2 {
  margin: 0;
  font-size: 20px;
}

.schema-version {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.toolbar-right {
  display: flex;
  gap: 12px;
}

.studio-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 260px;
  background: white;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.resource-list {
  padding: 16px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.resource-item:hover {
  background: #e8edf3;
  transform: translateX(4px);
}

.resource-item.datasource {
  background: #fef0f0;
}

.resource-item.datasource:hover {
  background: #fde2e2;
}

.canvas-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.canvas-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.canvas-wrapper {
  flex: 1;
  overflow: auto;
  background: 
    linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
    linear-gradient(#f0f0f0 1px, transparent 1px);
  background-size: 20px 20px;
}

.graph-canvas {
  width: 3000px;
  height: 2000px;
  transform-origin: 0 0;
}

.edge {
  stroke: #409eff;
  stroke-width: 2;
  fill: none;
  cursor: pointer;
  transition: stroke-width 0.2s;
}

.edge:hover,
.edge.selected {
  stroke-width: 3;
}

/* 数据供应关系虚线样式 */
.edge.data-supply {
  stroke: #909399;
  stroke-width: 2;
}

.edge.data-supply:hover,
.edge.data-supply.selected {
  stroke: #409eff;
  stroke-width: 3;
}

.edge-label {
  font-size: 12px;
  fill: #606266;
  pointer-events: none;
}

/* 数据供应标签可点击 */
.data-supply-label {
  fill: #909399;
  font-size: 14px;
  pointer-events: all;
  cursor: pointer;
}

.data-supply-label:hover {
  fill: #409eff;
  font-weight: bold;
}

.node-rect {
  fill: white;
  stroke: #409eff;
  stroke-width: 2;
  cursor: move;
  transition: all 0.2s;
}

.node-rect:hover,
.node-rect.selected {
  stroke-width: 3;
  filter: drop-shadow(0 4px 8px rgba(64, 158, 255, 0.3));
}

.node-rect.expanded {
  fill: #f0f9ff;
}

.node-datasource {
  fill: #fef0f0;
  stroke: #f56c6c;
  stroke-width: 2;
  cursor: move;
  transition: all 0.2s;
}

.node-datasource:hover,
.node-datasource.selected {
  stroke-width: 3;
  filter: drop-shadow(0 4px 8px rgba(245, 108, 108, 0.3));
}

.node-title {
  font-size: 14px;
  font-weight: 600;
  fill: #303133;
  pointer-events: none;
}

.divider {
  stroke: #e4e7ed;
  stroke-width: 1;
}

.field-header {
  font-size: 12px;
  fill: #909399;
  font-weight: 600;
  pointer-events: none;
}

.field-text {
  font-size: 12px;
  fill: #606266;
  cursor: pointer;
}

.field-text:hover {
  fill: #409eff;
}

.field-type {
  fill: #909399;
  font-size: 11px;
}

.add-field {
  font-size: 12px;
  fill: #409eff;
  cursor: pointer;
}

.add-field:hover {
  font-weight: bold;
}

.connection-point {
  fill: #67c23a;
  stroke: white;
  stroke-width: 2;
  cursor: crosshair;
}

.connection-point:hover {
  r: 8;
}

.connecting-line {
  stroke: #409eff;
  stroke-width: 2;
  pointer-events: none;
}

.right-panel {
  width: 320px;
  background: white;
  border-left: 1px solid #e4e7ed;
  overflow-y: auto;
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 140px;
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s;
}

.menu-item:hover {
  background: #f5f7fa;
}

.menu-item.danger {
  color: #f56c6c;
}

.menu-item.danger:hover {
  background: #fef0f0;
}
</style>
