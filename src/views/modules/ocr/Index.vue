<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Upload from './pages/Upload.vue'
import Processing from './pages/Processing.vue'
import Results from './pages/Results.vue'
import type { OCRTask, OCRResult } from '@/types/ocr'

const router = useRouter()
const currentPhase = ref<'upload' | 'processing' | 'results'>('upload')
const currentTask = ref<OCRTask | null>(null)
const currentResult = ref<OCRResult | null>(null)

// 当前阶段的标题
const phaseTitle = computed(() => {
  const titles = {
    upload: '📤 上传文件',
    processing: '⏳ 处理中',
    results: '✅ 处理完成'
  }
  return titles[currentPhase.value]
})

// 处理上传完成事件
const handleUploadComplete = (task: OCRTask) => {
  currentTask.value = task
  currentPhase.value = 'processing'
}

// 处理处理完成事件
const handleProcessingComplete = (result: OCRResult) => {
  currentResult.value = result
  currentPhase.value = 'results'
}

// 处理重新开始
const handleRestart = () => {
  currentPhase.value = 'upload'
  currentTask.value = null
  currentResult.value = null
}

// 处理返回
const handleBack = () => {
  if (currentPhase.value === 'results') {
    currentPhase.value = 'processing'
  } else if (currentPhase.value === 'processing') {
    currentPhase.value = 'upload'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- 页头 -->
    <div class="bg-white shadow-sm sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">🤖 OCR 文档识别</h1>
            <p class="text-sm text-gray-600 mt-1">支持图片、PDF、公式、化学方程式、表格识别</p>
          </div>
          <div class="hidden md:flex items-center space-x-2 text-sm">
            <span
              :class="[
                'px-3 py-1 rounded-full font-medium transition-colors',
                currentPhase === 'upload'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              ]"
            >
              1. 上传
            </span>
            <span class="text-gray-400">→</span>
            <span
              :class="[
                'px-3 py-1 rounded-full font-medium transition-colors',
                currentPhase === 'processing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              ]"
            >
              2. 处理
            </span>
            <span class="text-gray-400">→</span>
            <span
              :class="[
                'px-3 py-1 rounded-full font-medium transition-colors',
                currentPhase === 'results'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              ]"
            >
              3. 结果
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="max-w-6xl mx-auto px-6 py-8">
      <!-- 上传阶段 -->
      <Upload
        v-if="currentPhase === 'upload'"
        @complete="handleUploadComplete"
      />

      <!-- 处理阶段 -->
      <Processing
        v-else-if="currentPhase === 'processing'"
        :task="currentTask"
        @complete="handleProcessingComplete"
        @back="handleBack"
      />

      <!-- 结果阶段 -->
      <Results
        v-else-if="currentPhase === 'results'"
        :result="currentResult"
        @restart="handleRestart"
        @back="handleBack"
      />
    </div>

    <!-- 页脚 -->
    <div class="bg-white border-t border-gray-200 mt-12">
      <div class="max-w-6xl mx-auto px-6 py-6 text-center text-gray-600 text-sm">
        <p>📊 支持的格式：JPG、PNG、PDF | 🔤 支持语言：中文、英文、日语等 80+ 种</p>
        <p class="mt-2">🚀 由 PaddleOCR 和 Mathpix API 提供支持</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
