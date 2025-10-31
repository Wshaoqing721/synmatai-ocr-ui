<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ocrApi } from '@/api/modules/ocr'
import ProcessProgress from '../components/ProcessProgress.vue'
import type { OCRTask, OCRResult } from '@/types/ocr'

const props = defineProps<{
  task: OCRTask | null
}>()

const emit = defineEmits<{
  complete: [result: OCRResult]
  back: []
}>()

const currentTask = ref<OCRTask>(props.task!)
const progressLogs = ref<Array<{ time: string; step: string; status: 'info' | 'success' }>>([])
const pollingInterval = ref<NodeJS.Timer | null>(null)
const error = ref('')

// 格式化时间
const formatTime = () => {
  return new Date().toLocaleTimeString('zh-CN')
}

// 添加日志
const addLog = (step: string, status: 'info' | 'success' = 'info') => {
  progressLogs.value.push({
    time: formatTime(),
    step,
    status
  })
}

// 轮询查询处理结果
const pollResults = async () => {
  try {
    const response = await ocrApi.getResults(currentTask.value.task_id)

    if (response.status === 'processing') {
      currentTask.value.progress = response.progress
      currentTask.value.current_step = response.current_step

      // 添加进度日志
      if (!progressLogs.value.find(log => log.step === response.current_step)) {
        addLog(response.current_step, 'info')
      }
    } else if (response.status === 'completed') {
      currentTask.value.progress = 100
      currentTask.value.status = 'completed'
      addLog('处理完成！', 'success')

      // 停止轮询
      if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
      }

      // 发送完成事件
      emit('complete', response as OCRResult)
    } else if (response.status === 'failed') {
      currentTask.value.status = 'failed'
      currentTask.value.error = response.error
      error.value = `处理失败：${response.error?.message}`

      if (pollingInterval.value) {
        clearInterval(pollingInterval.value)
      }
    }
  } catch (err) {
    error.value = `查询失败：${err instanceof Error ? err.message : '未知错误'}`
  }
}

onMounted(() => {
  addLog('已进入队列', 'info')
  addLog('初始化处理...', 'info')

  // 开始轮询（每 1 秒查询一次）
  pollingInterval.value = setInterval(pollResults, 1000)

  // 立即查询一次
  pollResults()
})

onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- 左侧：进度条 & 文件信息 -->
    <div class="lg:col-span-2">
      <div class="bg-white rounded-lg shadow-md p-8">
        <h2 class="text-2xl font-bold mb-6">⏳ 处理中</h2>

        <!-- 进度条 -->
        <ProcessProgress
          :progress="currentTask.progress || 0"
          :status="currentTask.status"
          :current-step="currentTask.current_step"
        />

        <!-- 文件信息卡片 -->
        <div class="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-900 mb-4">📋 文件信息</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">文件名：</span>
              <span class="font-medium">{{ currentTask.filename }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">文件类型：</span>
              <span class="font-medium">{{ currentTask.file_type === 'photo' ? '图片' : 'PDF' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">文件大小：</span>
              <span class="font-medium">{{ (currentTask.file_size / 1024).toFixed(2) }} KB</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">识别语言：</span>
              <span class="font-medium">{{ currentTask.languages.join('、') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">任务 ID：</span>
              <span class="font-mono text-xs text-gray-500">{{ currentTask.task_id }}</span>
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="mt-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
          {{ error }}
        </div>

        <!-- 操作按钮 -->
        <div v-if="currentTask.status === 'failed'" class="mt-6 flex space-x-4">
          <button
            @click="emit('back')"
            class="flex-1 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
          >
            ← 返回上传
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧：处理日志 -->
    <div class="bg-white rounded-lg shadow-md p-6 max-h-96 overflow-hidden flex flex-col">
      <h3 class="font-bold text-lg mb-4">📝 处理日志</h3>

      <div class="flex-1 overflow-y-auto space-y-3">
        <div
          v-for="(log, index) in progressLogs"
          :key="index"
          class="flex items-start space-x-3 text-sm"
        >
          <div
            :class="[
              'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs text-white font-bold',
              log.status === 'success' ? 'bg-green-600' : 'bg-blue-600'
            ]"
          >
            {{ log.status === 'success' ? '✓' : '→' }}
          </div>
          <div class="flex-1">
            <p class="text-gray-900">{{ log.step }}</p>
            <p class="text-gray-500 text-xs">{{ log.time }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
