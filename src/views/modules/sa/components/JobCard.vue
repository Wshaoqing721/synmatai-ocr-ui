<template>
  <div class="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 relative overflow-hidden">
    <!-- Status Indicator Strip -->
    <div 
      class="absolute left-0 top-0 bottom-0 w-1"
      :class="statusColorClass"
    ></div>

    <!-- Header -->
    <div class="flex justify-between items-start mb-3 pl-2">
      <div>
        <h3 class="font-semibold text-sm text-gray-900 line-clamp-1" :title="job.name">{{ job.name }}</h3>
        <p class="text-xs text-gray-500 mt-0.5 font-mono">{{ job.id.slice(0, 8) }}...</p>
      </div>
      <el-tag 
        size="small" 
        :type="statusType"
        effect="light"
        class="uppercase tracking-wide"
      >
        {{ statusText }}
      </el-tag>
    </div>

    <!-- Progress Bar -->
    <div v-if="job.status === 'running'" class="mb-3 pl-2">
      <div class="flex justify-between text-xs text-gray-500 mb-1">
        <span>Progress</span>
      </div>
      <el-progress :percentage="job.progress" :stroke-width="6" :show-text="true" />
    </div>

    <!-- Metadata -->
    <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 pl-2 mb-3">
      <div class="flex items-center gap-1">
        <span class="text-gray-400">Type:</span>
        <span class="font-medium text-gray-700">{{ job.type }}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-gray-400">Priority:</span>
        <span class="text-yellow-500 text-[10px]">{{ '★'.repeat(job.priority) }}</span>
      </div>
      <div v-if="job.execution_time" class="col-span-2 flex items-center gap-1">
        <span class="text-gray-400">Time:</span>
        <span class="font-medium text-gray-700">{{ job.execution_time }}s</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 pl-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <el-button
        v-if="job.status === 'running'"
        @click="cancelJob"
        type="danger"
        size="small"
        plain
        class="flex-1"
      >
        Cancel
      </el-button>
      <el-button
        v-if="job.status === 'failed'"
        @click="retryJob"
        type="warning"
        size="small"
        plain
        class="flex-1"
      >
        Retry
      </el-button>
      <el-button
        v-if="job.status === 'completed'"
        @click="viewDetails"
        type="success"
        size="small"
        plain
        class="flex-1"
      >
        Details
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useJobStore } from '@/stores/jobStore'

interface Job {
  id: string
  name: string
  type: string
  status: string
  progress: number
  priority: number
  execution_time?: number
}

const props = defineProps<{ job: Job }>()
const jobStore = useJobStore()

const statusText = computed(() => {
  const map: Record<string, string> = {
    pending: 'Pending',
    running: 'Running',
    completed: 'Done',
    failed: 'Failed'
  }
  return map[props.job.status] || props.job.status
})

const statusType = computed(() => {
  const map: Record<string, string> = {
    pending: 'info',
    running: 'primary',
    completed: 'success',
    failed: 'danger'
  }
  return map[props.job.status] || 'info'
})

const statusColorClass = computed(() => {
  const map: Record<string, string> = {
    pending: 'bg-gray-300',
    running: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500'
  }
  return map[props.job.status] || 'bg-gray-300'
})

const cancelJob = () => {
  console.log('Cancel Job:', props.job.id)
}

const retryJob = () => {
  console.log('Retry Job:', props.job.id)
}

const viewDetails = () => {
  console.log('View Details:', props.job.id)
}
</script>