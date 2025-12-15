<template>
  <div class="h-full flex flex-col bg-gray-50/50">
    <!-- Header -->
    <div class="p-4 border-b border-gray-100 bg-white">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-800">Tasks</h2>
        <span class="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          {{ jobStore.jobs.length }}
        </span>
      </div>
    </div>

    <!-- Job List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
      <div v-if="jobStore.jobs.length === 0" class="flex flex-col items-center justify-center h-64 text-gray-400">
        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <p class="text-sm">No active tasks</p>
      </div>
      
      <transition-group name="list">
        <JobCard v-for="job in jobStore.jobs" :key="job.id" :job="job" />
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useJobStore } from '@/stores/jobStore'
import JobCard from './JobCard.vue'

const jobStore = useJobStore()
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}

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