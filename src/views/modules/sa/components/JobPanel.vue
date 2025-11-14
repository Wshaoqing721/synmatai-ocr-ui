<template>
  <div class="h-full flex flex-col">
    <!-- 标题 -->
    <div class="p-4 border-b">
      <h2 class="text-lg font-bold">执行任务 ({{ jobStore.jobs.length }})</h2>
    </div>

    <!-- Job列表 -->
    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      <div v-if="jobStore.jobs.length === 0" class="text-center text-gray-500 py-8">
        暂无任务
      </div>
      <JobCard v-for="job in jobStore.jobs" :key="job.id" :job="job" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useJobStore } from '@/stores/jobStore'
import JobCard from './JobCard.vue'

const jobStore = useJobStore()
</script>