<template>
  <div ref="visNetwork" class="graph-container"></div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Network } from 'vis-network'
import { DataSet } from 'vis-data'
import 'vis-network/styles/vis-network.css'

const props = defineProps({
  nodes: {
    type: Array,
    required: true,
  },
  edges: {
    type: Array,
    required: true,
  },
  highlightedNodeId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['node-click'])

const visNetwork = ref(null)
let networkInstance = null

// 使用 DataSet，避免 setData 时状态错乱
let nodeDataSet = null
let edgeDataSet = null

const options = {
  nodes: {
    shape: 'dot',
    size: 20,
    font: {
      size: 14,
      color: '#333',
    },
    borderWidth: 2,
  },
  edges: {
    width: 2,
    arrows: 'to',
    font: {
      align: 'middle',
    },
  },
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based',
    forceAtlas2Based: {
      gravitationalConstant: -50,
      centralGravity: 0.01,
      springLength: 100,
      springConstant: 0.08,
    },
  },
  interaction: {
    hover: true,
    tooltipDelay: 200,
  },
  layout: {
    improvedLayout: true,
  },
}

onMounted(() => {
  if (!visNetwork.value) return

  nodeDataSet = new DataSet(
    props.nodes.map(n => ({
      id: n.id,
      label: n.properties?.name || n.label,
      title: formatTooltip(n.properties || {}),
      group: n.group || n.label,
    }))
  )

  edgeDataSet = new DataSet(
    props.edges.map(e => ({
      from: e.source,
      to: e.target,
      label: e.type,
    }))
  )

  networkInstance = new Network(
    visNetwork.value,
    { nodes: nodeDataSet, edges: edgeDataSet },
    options
  )

  networkInstance.on('click', (params) => {
    if (params.nodes.length > 0) {
      emit('node-click', params.nodes[0])
    } else {
      emit('node-click', null)
    }
  })
})

/**
 * 数据更新（nodes / edges）
 */
watch(
  () => [props.nodes, props.edges],
  ([newNodes, newEdges]) => {
    if (!networkInstance) return

    nodeDataSet.clear()
    edgeDataSet.clear()

    nodeDataSet.add(
      newNodes.map(n => ({
        id: n.id,
        label: n.properties?.name || n.label,
        title: formatTooltip(n.properties || {}),
        group: n.group || n.label,
      }))
    )

    edgeDataSet.add(
      newEdges.map(e => ({
        from: e.source,
        to: e.target,
        label: e.type,
      }))
    )
  },
  { deep: true }
)

/**
 * III. 点选高亮逻辑（安全版）
 */
watch(() => props.highlightedNodeId, (newId) => {
  if (!networkInstance || !nodeDataSet) return

  const allNodes = nodeDataSet.get()

  if (newId) {
    const connected = networkInstance.getConnectedNodes(newId)
    const highlightSet = new Set([...connected, newId])

    nodeDataSet.update(
      allNodes.map(node => ({
        id: node.id,
        color: highlightSet.has(node.id)
          ? undefined
          : { background: 'rgba(200,200,200,0.5)', border: 'rgba(200,200,200,0.5)' },
        font: highlightSet.has(node.id)
          ? undefined
          : { size: 10, color: '#999' },
      }))
    )
  } else {
    // 重置
    nodeDataSet.update(
      allNodes.map(node => ({
        id: node.id,
        color: undefined,
        font: undefined,
      }))
    )
  }
})

function formatTooltip(properties) {
  let tooltip = '<strong>Properties:</strong><br>'
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value !== 'object' && value !== null) {
      tooltip += `<b>${key}:</b> ${value}<br>`
    }
  }
  return tooltip
}

onUnmounted(() => {
  if (networkInstance) {
    networkInstance.destroy()
    networkInstance = null
  }
})
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 600px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
}
</style>
