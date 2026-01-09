<script setup lang="ts">
import { computed } from "vue"
import type { NodeStat } from "@/types/tester"

const props = defineProps<{
  nodeStats: NodeStat[]
}>()

const rows = computed(() =>
  props.nodeStats.map((s) => {
    const successRate = s.totalExecutions > 0 ? (s.successCount / s.totalExecutions) * 100 : 0
    return {
      nodeId: s.nodeId,
      nodeName: s.nodeName,
      avgDuration: s.avgDuration,
      successRate: Number(successRate.toFixed(1)),
    }
  }),
)

const maxDuration = computed(() => Math.max(1, ...rows.value.map((r) => r.avgDuration)))
</script>

<template>
  <el-card>
    <template #header>
      <span class="font-bold">节点响应时间分布</span>
    </template>

    <el-table :data="rows" size="small" style="width: 100%">
      <el-table-column prop="nodeName" label="节点" min-width="140" />
      <el-table-column label="平均耗时" min-width="220">
        <template #default="{ row }">
          <div class="flex items-center gap-3">
            <div class="w-[140px]">
              <el-progress
                :percentage="Math.round((row.avgDuration / maxDuration) * 100)"
                :stroke-width="10"
                :show-text="false"
                :status="row.successRate >= 90 ? 'success' : 'exception'"
              />
            </div>
            <span class="text-sm">{{ row.avgDuration }}ms</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="成功率" width="120" align="right">
        <template #default="{ row }">{{ row.successRate }}%</template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
