<template>
  <div class="log-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>Synchronization Logs</span>
          <el-button type="warning" @click="filterStatus('FAILED')">Show Failed Only</el-button>
          <el-button @click="filterStatus('ALL')">Show All</el-button>
        </div>
      </template>
<!-- 日志列表 -->
      <el-table :data="filteredLogs" style="width: 100%">
        <el-table-column prop="trace_id" label="Trace ID" width="180" />
        <el-table-column prop="rule_id" label="Rule ID" width="100" />
        <el-table-column prop="start_time" label="Start Time" width="160">
          <template #default="{ row }">
            {{ new Date(row.start_time).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="End Time" width="160">
          <template #default="{ row }">
            {{ row.end_time ? new Date(row.end_time).toLocaleString() : 'Running...' }}
          </template>
        </el-table-column>
        <el-table-column label="Duration" width="100">
          <template #default="{ row }">
            {{ calculateDuration(row) }}
          </template>
        </el-table-column>
        <el-table-column label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'SUCCESS' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Action" width="100">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row)" v-if="row.status === 'FAILED'">View Error</el-button>
          </template>
        </el-table-column>
      </el-table>
<!-- 分页器 -->
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
          layout="prev, pager, next"
          :total="100"
          :page-size="10"
        />
      </div>
    </el-card>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
const logs = ref([]);
const activeFilter = ref('ALL');
// 模拟数据或从 API 获取
onMounted(() => {
  // 在实际项目中，此处应调用 sync-api 获取日志列表
  // 示例数据：
  logs.value = [
    {
      id: 1,
      trace_id: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8',
      rule_id: 1,
      start_time: '2024-05-20T10:00:00Z',
      end_time: '2024-05-20T10:00:15Z',
      status: 'SUCCESS',
      processed_count: 100,
      error_details: null
    },
    {
      id: 2,
      trace_id: 'x1y2z3w4-v5u6-t7s8-r9q0-p1o2n3m4l5k6',
      rule_id: 2,
      start_time: '2024-05-20T10:05:00Z',
      end_time: null,
      status: 'FAILED',
      processed_count: 0,
      error_details: 'Connection refused to SAP endpoint.'
    }
  ];
});
const filteredLogs = computed(() => {
  if (activeFilter.value === 'ALL') return logs.value;
  return logs.value.filter(log => log.status === 'FAILED');
});
const calculateDuration = (log) => {
  if (!log.end_time) return '--';
  const start = new Date(log.start_time);
  const end = new Date(log.end_time);
  const diffMs = Math.abs(end - start);
  const seconds = Math.floor(diffMs / 1000);
  return `${seconds}s`;
};
const viewDetails = (log) => {
  if (log.error_details) {
    ElMessage.error(`Error Details:\n${log.error_details}`);
  } else {
    ElMessage.info('No error details available.');
  }
};
const filterStatus = (status) => {
  activeFilter.value = status;
};
</script>
<style scoped>
.log-container .el-card__header .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
