<script setup lang="ts">
const props = defineProps<{
  progress: number
  status: string
  currentStep?: string
}>()

const statusText = {
  queued: '排队中...',
  processing: '处理中',
  completed: '已完成',
  failed: '处理失败'
}

const statusColor = {
  queued: 'from-yellow-400 to-yellow-600',
  processing: 'from-blue-400 to-blue-600',
  completed: 'from-green-400 to-green-600',
  failed: 'from-red-400 to-red-600'
}
</script>

<template>
  <div class="space-y-4">
    <!-- 进度百分比 -->
    <div class="text-center">
      <div class="text-5xl font-bold text-gray-900">{{ progress }}%</div>
      <p class="text-gray-600 mt-2">{{ statusText[status] || '未知状态' }}</p>
    </div>

    <!-- 进度条 -->
    <div class="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
      <div
        :style="{ width: progress + '%' }"
        :class="['h-full transition-all duration-500 bg-gradient-to-r', statusColor[status]]"
      />
    </div>

    <!-- 当前步骤 -->
    <div v-if="currentStep" class="text-center">
      <p class="text-sm text-gray-600">当前步骤</p>
      <p class="text-lg font-semibold text-gray-900 mt-1">{{ currentStep }}</p>
    </div>

    <!-- 里程碑 -->
    <div class="flex justify-between mt-8">
      <div
        v-for="(label, index) in ['已上传', '预处理', 'OCR识别', '结果整理', '完成']"
        :key="index"
        class="flex flex-col items-center"
      >
        <div
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all',
            progress >= (index + 1) * 20
              ? 'bg-green-600 scale-110'
              : 'bg-gray-400'
          ]"
        >
          {{ index + 1 }}
        </div>
        <p class="text-xs text-gray-600 mt-2 text-center w-20">{{ label }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
