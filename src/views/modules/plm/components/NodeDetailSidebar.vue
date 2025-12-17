<template>
  <el-drawer
    :model-value="!!nodeId"
    title="Node Details"
    direction="rtl"
    @close="$emit('close')"
  >
    <el-tabs v-if="nodeData" v-model="activeTab">
      <el-tab-pane label="Graph Properties" name="graph">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="Element ID">{{ nodeData.id }}</el-descriptions-item>
          <el-descriptions-item label="Label">{{ nodeData.label }}</el-descriptions-item>
          <template v-for="(value, key) in nodeData.properties" :key="key">
            <el-descriptions-item :label="key">{{ value }}</el-descriptions-item>
          </template>
        </el-descriptions>
      </el-tab-pane>
      <el-tab-pane label="Relational Data" name="relational">
        <p>Loading relational data...</p>
        <!-- 这里需要实现一个 API 调用，根据 nodeData.properties.id 和 nodeData.label -->
        <!-- 回查 Django 的 /api/v1/projects/{id}/ 等接口 -->
      </el-tab-pane>
      <el-tab-pane label="Sync History" name="sync">
        <p>Loading sync history...</p>
        <!-- 这里需要实现一个 API 调用，根据 nodeData.properties.source_id -->
        <!-- 回查 FastAPI 的 /sync-api/logs/by_source/{id} 等接口 -->
      </el-tab-pane>
    </el-tabs>
    <el-empty v-else description="No node selected or data not found"></el-empty>
  </el-drawer>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { queryGraph } from '@/api/modules/plm';

const props = defineProps({
  nodeId: {
    type: String,
    default: null,
  },
});
const emit = defineEmits(['close']);

const activeTab = ref('graph');
const nodeData = ref(null);

watch(() => props.nodeId, async (newId) => {
  if (newId) {
    await fetchNodeDetails(newId);
  } else {
    nodeData.value = null;
  }
});

async function fetchNodeDetails(id) {
  try {
    const cypher = 'MATCH (n) WHERE elementId(n) = $id RETURN n';
    const response = await queryGraph(cypher, { id });
    if (response.data.nodes && response.data.nodes.length > 0) {
      nodeData.value = response.data.nodes[[24]];
    } else {
      nodeData.value = null;
    }
  } catch (error) {
    console.error('Failed to fetch node details:', error);
    nodeData.value = null;
  }
}
</script>
