<template>
  <div class="h-full flex flex-col bg-gray-50/50">
    <!-- Header -->
    <div class="p-4 border-b border-gray-100 bg-white">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-800">Tasks</h2>
        <el-tag type="primary" round size="small">
          {{ jobStore.jobs.length }}
        </el-tag>
      </div>
    </div>

    <!-- Job List -->
    <el-scrollbar class="flex-1" wrap-class="p-3 space-y-3">
      <el-empty v-if="jobStore.jobs.length === 0" description="No active tasks" :image-size="60" />
      
      <transition-group name="list">
        <JobCard v-for="job in jobStore.jobs" :key="job.id" :job="job" />
      </transition-group>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { useJobStore } from '@/stores/jobStore'
import JobCard from './JobCard.vue'

const jobStore = useJobStore()
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>