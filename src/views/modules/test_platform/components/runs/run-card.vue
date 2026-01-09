<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

import RunStatusBadge from "./run-status-badge.vue"
import type { TestRun } from "@/types/tester"
import { User, Calendar, VideoPlay, VideoPause, ArrowRight } from "@element-plus/icons-vue"

const props = defineProps<{
  run: TestRun
}>()

const emit = defineEmits<{
  (e: "start", runId: string): void
  (e: "stop", runId: string): void
}>()

const router = useRouter()

const formattedTime = computed(() =>
  formatDistanceToNow(new Date(props.run.createdAt), {
    addSuffix: true,
    locale: zhCN,
  }),
)

function goDetail() {
  router.push(`/test-platform/runs/${props.run.id}`)
}
</script>

<template>
  <el-card class="hover:shadow-lg transition-shadow">
    <template #header>
      <div class="flex items-start justify-between">
        <div class="space-y-1">
          <div class="text-lg font-semibold">{{ run.name }}</div>
          <p class="text-sm text-muted-foreground">{{ run.scenarioName }}</p>
        </div>
        <RunStatusBadge :status="run.status" />
      </div>
    </template>

    <div class="space-y-4">
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">执行进度</span>
          <span class="font-medium">{{ run.progress }}%</span>
        </div>
        <el-progress :percentage="run.progress" :stroke-width="8" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex items-center gap-2 text-sm">
          <el-icon class="text-muted-foreground"><User /></el-icon>
          <span class="text-muted-foreground">并发用户:</span>
          <span class="font-medium">{{ run.currentUsers }} / {{ run.totalUsers }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm">
          <el-icon class="text-muted-foreground"><Calendar /></el-icon>
          <span class="text-muted-foreground">{{ formattedTime }}</span>
        </div>
      </div>

      <div class="flex items-center gap-2 pt-2">
        <el-button
          v-if="run.status === 'pending'"
          size="small"
          type="primary"
          @click="emit('start', run.id)"
        >
          <el-icon class="mr-1"><VideoPlay /></el-icon>
          启动
        </el-button>
        <el-button
          v-else-if="run.status === 'running'"
          size="small"
          type="danger"
          @click="emit('stop', run.id)"
        >
          <el-icon class="mr-1"><VideoPause /></el-icon>
          停止
        </el-button>

        <el-button
          class="ml-auto"
          size="small"
          plain
          @click="goDetail"
        >
          查看详情
          <el-icon class="ml-1"><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>
  </el-card>
</template>
