<template>
  <el-container class="graph-explorer">
    <el-header height="auto" class="header">
      <el-input
        v-model="cypherQuery"
        placeholder="Enter Cypher Query... e.g., MATCH (n:Project) RETURN n LIMIT 25"
        class="input-with-select"
      >
        <template #append>
          <el-button @click="executeQuery">Query</el-button>
        </template>
      </el-input>
      <div class="insight-buttons">
        <el-button @click="fetchKeyAssets">Key Assets (PageRank)</el-button>
        <!-- 其他 "一键洞察" 按钮 -->
      </div>
    </el-header>
    <el-main class="main-content">
      <GraphVisualization
        :nodes="graphData.nodes"
        :edges="graphData.edges"
        :highlighted-node-id="selectedNodeIdForHighlight"
        @node-click="handleNodeClick"
        v-loading="loading"
      />
    </el-main>
    <NodeDetailSidebar :node-id="selectedNodeIdForSidebar" @close="selectedNodeIdForSidebar = null" />
  </el-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import GraphVisualization from './components/GraphVisualization.vue';
import NodeDetailSidebar from './components/NodeDetailSidebar.vue';
import { queryGraph } from '@/api/modules/plm';

const cypherQuery = ref('MATCH (p:Project)-[r]->(t:Task) RETURN p, r, t LIMIT 10');
const loading = ref(false);
const graphData = reactive({ nodes: [], edges: [] });
const selectedNodeIdForSidebar = ref(null);
const selectedNodeIdForHighlight = ref(null);

const executeQuery = async () => {
  if (!cypherQuery.value) {
    ElMessage.warning('Query cannot be empty.');
    return;
  }
  loading.value = true;
  try {
    const response = await queryGraph(cypherQuery.value);
    graphData.nodes = response.data.nodes;
    graphData.edges = response.data.edges;
  } catch (error) {
    ElMessage.error('Failed to execute query: ' + error.response?.data?.error || error.message);
    graphData.nodes = [];
    graphData.edges = [];
  } finally {
    loading.value = false;
  }
};

const handleNodeClick = (nodeId) => {
  selectedNodeIdForSidebar.value = nodeId;
  // 点选高亮逻辑
  if (selectedNodeIdForHighlight.value === nodeId) {
    selectedNodeIdForHighlight.value = null; //再次点击取消高亮
  } else {
    selectedNodeIdForHighlight.value = nodeId;
  }
};

// "一键洞察" API 调用示例
const fetchKeyAssets = async () => {
    // 假设后端有一个封装好的 PageRank API
    // cypherQuery.value = 'CALL gds.pageRank.stream({ nodeProjection: "*", relationshipProjection: "*" }) YIELD nodeId, score RETURN gds.util.asNode(nodeId) AS node, score ORDER BY score DESC LIMIT 10';
    // 实际应调用封装的API，如 /api/v1/insight/key_assets/
    cypherQuery.value = 'MATCH (n) RETURN n, rand() as r ORDER BY r LIMIT 15' // 简单示例
    await executeQuery();
    ElMessage.success('Displaying key assets.');
}

// Initial load
executeQuery();
</script>

<style scoped>
.graph-explorer {
  height: calc(100vh - 60px); /* 假设有 60px 的顶部导航栏 */
}
.header {
  padding: 10px;
  background-color: #f5f7fa;
  display: flex;
  gap: 20px;
  align-items: center;
}
.main-content {
  padding: 10px;
}
</style>
