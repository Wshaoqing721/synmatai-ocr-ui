<template>
  <div class="border rounded p-3 bg-white hover:shadow-md transition">
    <!-- 标题和状态 -->
    <div class="flex justify-between items-start mb-2">
      <span class="font-semibold text-sm">{{ job.name }}</span>
      <span :class="['text-xs px-2 py-1 rounded', statusClasses]">
        {{ statusText }}
      </span>
    </div>

    <!-- 进度条 -->
    <div v-if="job.status === 'running'" class="mb-2">
      <div class="w-full bg-gray-300 rounded h-1.5">
        <div
          class="bg-blue-500 h-1.5 rounded transition-all"
          :style="{ width: `${job.progress}%` }"
        />
      </div>
      <p class="text-xs text-gray-600 mt-1">{{ job.progress }}%</p>
    </div>

    <!-- 类型和优先级 -->
    <div class="text-xs text-gray-600 space-y-1">
      <p>类型: <span class="font-mono">{{ job.type }}</span></p>
      <p>优先级: 
        <span class="font-mono">{{ '⭐'.repeat(job.priority) }}</span>
      </p>
      <p v-if="job.execution_time">
        耗时: {{ job.execution_time }}s
      </p>
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-2 mt-3">
      <button
        v-if="job.status === 'running'"
        @click="cancelJob"
        class="flex-1 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
      >
        取消
      </button>
      <button
        v-if="job.status === 'failed'"
        @click="retryJob"
        class="flex-1 text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
      >
        重试
      </button>
      <button
        v-if="job.status === 'completed'"
        @click="viewDetails"
        class="flex-1 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
      >
        详情
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useJobStore } from '../stores/jobStore'

interface Job {
  id: string
  name: string
  type: string
  status: string
  progress: number
  priority: number
  execution_time?: number
}

defineProps<{ job: Job }>()

const jobStore = useJobStore()

const statusText = computed(() => {
  const map: Record<string, string> = {
    pending: '待处理',
    running: '执行中',
    completed: '已完成',
    failed: '失败'
  }
  return map[props.job.status] || props.job.status
})

const statusClasses = computed(() => {
  const map: Record<string, string> = {
    pending: 'bg-gray-200 text-gray-800',
    running: 'bg-blue-200 text-blue-800',
    completed: 'bg-green-200 text-green-800',
    failed: 'bg-red-200 text-red-800'
  }
  return map[props.job.status] || ''
})

const props = defineProps<{ job: Job }>()

const cancelJob = () => {
  console.log('取消Job:', props.job.id)
}

const retryJob = () => {
  console.log('重试Job:', props.job.id)
}

const viewDetails = () => {
  console.log('查看详情:', props.job.id)
}
</script>