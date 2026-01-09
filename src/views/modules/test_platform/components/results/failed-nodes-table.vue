<script setup lang="ts">
import type { FailedNodeStat } from "@/types/tester"
import { Warning } from "@element-plus/icons-vue"

defineProps<{
  failedNodes: FailedNodeStat[]
}>()
</script>

<template>
  <el-card>
    <template #header>
      <span class="font-bold">失败节点分布</span>
    </template>

    <div v-if="failedNodes.length === 0" class="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <el-icon size="48" class="opacity-50 mb-2"><Warning /></el-icon>
      <p>没有失败的节点</p>
    </div>

    <el-table v-else :data="failedNodes" size="small" style="width: 100%">
      <el-table-column prop="nodeName" label="节点名称" min-width="140" />
      <el-table-column label="失败次数" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="danger">{{ row.failCount }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="错误信息" min-width="220">
        <template #default="{ row }">
          <div class="flex flex-wrap gap-1">
            <el-tag v-for="(e, i) in row.errors" :key="i" size="small" effect="plain">{{ e }}</el-tag>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
