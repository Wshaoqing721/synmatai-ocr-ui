<template>
  <div class="flex h-screen bg-gray-50">
    <!-- 左侧：图片上传和预览 -->
    <div class="w-1/2 flex flex-col p-6 border-r border-gray-200 bg-white">
      <h2 class="text-lg font-bold mb-4">📤 上传图片</h2>
      
      <!-- 上传区域 -->
      <div
        v-if="!selectedFile"
        @drop.prevent="handleFileDrop"
        @dragover.prevent
        class="relative flex-1 flex items-center justify-center border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 cursor-pointer transition hover:border-blue-600 focus-within:ring-2 focus-within:ring-blue-400"
      >
        <div class="text-center">
          <div class="text-4xl mb-2">📁</div>
          <p class="text-gray-700 font-medium">拖拽或点击上传图片</p>
          <p class="text-sm text-gray-500 mt-1">支持 JPG、PNG 格式</p>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            @change="handleFileSelected"
            class="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>

      <!-- 已选择图片预览 -->
      <div v-else class="flex-1 flex flex-col">
        <div class="flex-1 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
          <img :src="previewUrl || undefined" alt="预览图片" class="max-h-full max-w-full object-contain" />
        </div>
        <div class="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
          <p class="text-gray-700"><strong>{{ selectedFile.name }}</strong></p>
          <p class="text-gray-600 text-xs mt-1">大小: {{ formatFileSize(selectedFile.size) }}</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="mt-4 flex gap-2">
        <button
          v-if="selectedFile"
          @click="clearFile"
          class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm font-medium"
        >
          清除
        </button>
        <button
          v-if="selectedFile"
          @click="handleSubmit"
          :disabled="loading"
          class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm font-medium"
        >
          {{ loading ? '处理中...' : '开始识别' }}
        </button>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="mt-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
        {{ error }}
      </div>
    </div>

    <!-- 右侧：OCR结果展示 -->
    <div class="w-1/2 flex flex-col p-6 bg-white">
      <h2 class="text-lg font-bold mb-4">🧾 识别结果</h2>

      <!-- 处理中的状态（仅显示动画与提示，不展示进度） -->
      <div v-if="loading && !completedData" class="flex-1 flex flex-col items-center justify-center">
        <div class="animate-spin mb-4">
          <svg class="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p class="text-gray-600 font-medium">处理中...</p>
      </div>

      <!-- 结果展示 -->
      <div v-else-if="completedData" class="flex-1 flex flex-col overflow-hidden">
        <div class="flex gap-2 mb-3">
          <button
            @click="viewMode = 'markdown'"
            :class="['px-3 py-1.5 text-sm font-medium rounded transition', viewMode === 'markdown' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']"
          >
            Markdown
          </button>
          <button
            @click="viewMode = 'json'"
            :class="['px-3 py-1.5 text-sm font-medium rounded transition', viewMode === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']"
          >
            JSON
          </button>
        </div>

        <div v-if="viewMode === 'markdown'" class="flex-1 bg-gray-50 rounded-lg p-4 overflow-hidden">
          <div ref="mdContainer" class="md-content text-sm leading-relaxed overflow-y-auto h-full" v-html="markdownHtml"></div>
        </div>
        <div v-else class="flex-1 bg-gray-50 rounded-lg p-4 overflow-hidden">
          <pre class="text-xs leading-relaxed overflow-y-auto h-full whitespace-pre-wrap break-words">{{ JSON.stringify(completedData.json, null, 2) }}</pre>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="flex-1 flex items-center justify-center text-gray-500">
        <div class="text-center">
          <div class="text-5xl mb-2">📄</div>
          <p>上传图片后显示结果</p>
        </div>
      </div>

      <!-- 重新开始按钮 -->
      <button
        v-if="completedData"
        @click="resetAll"
        class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
      >
        🔄 开始新任务
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import renderMathInElement from 'katex/contrib/auto-render'
import 'katex/contrib/mhchem'
import 'katex/dist/katex.min.css'
import { ocrApi } from '@/api/modules/ocr'

// 类型定义
interface OCRTask {
  task_id: string
  status: string
  filename: string
  file_type: string
  file_size: number
  languages: string[]
  created_at: string
  progress: number
  current_step?: string
  preview_url?: string
}

interface OCROptions {
  extract_formulas: boolean
  extract_chemistry: boolean
  extract_tables: boolean
  preserve_layout: boolean
  formula_format: string[]
}

// 状态
const loading = ref(false)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const error = ref('')
const currentTask = ref<OCRTask | null>(null)
const completedData = ref<{ json: any; markdown: string } | null>(null)
const viewMode = ref<'markdown' | 'json'>('markdown')
const pollingInterval = ref<number | null>(null)
const mdContainer = ref<HTMLElement | null>(null)

const ocrOptions = ref<OCROptions>({
  extract_formulas: true,
  extract_chemistry: true,
  extract_tables: true,
  preserve_layout: true,
  formula_format: ['latex', 'mathml']
})

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// 处理文件选择
const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files?.[0]) {
    const file = target.files[0]
    processFile(file)
  }
}

// 处理拖拽
const handleFileDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    processFile(file)
  }
}

// 处理选中的文件
const processFile = (file: File) => {
  if (file.type.startsWith('image/')) {
    selectedFile.value = file
    error.value = ''
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(file)
  } else {
    error.value = '请选择图片文件（JPG、PNG）'
  }
}

// 清除文件
const clearFile = () => {
  selectedFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  error.value = ''
}

// 提交处理（对接后端 API）
const handleSubmit = async () => {
  if (!selectedFile.value) {
    error.value = '请选择文件'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 1) 调用上传接口
    const uploadResp = await ocrApi.upload(
      selectedFile.value,
      'photo',
      ['zh', 'en'],
      ocrOptions.value
    )

    // 2) 生成当前任务信息（用于 UI 展示）
    currentTask.value = {
      task_id: uploadResp.task_id,
      status: 'processing',
      filename: uploadResp.metadata?.filename || selectedFile.value.name,
      file_type: uploadResp.metadata?.file_type || 'photo',
      file_size: uploadResp.metadata?.file_size || selectedFile.value.size,
      languages: ['zh', 'en'],
      created_at: uploadResp.created_at,
      progress: 0,
      current_step: '已进入队列',
      preview_url: previewUrl.value || undefined
    }

    // 3) 开始轮询查询结果
    pollingInterval.value = setInterval(pollResults, 1000) as unknown as number
    await pollResults()
  } catch (err) {
    error.value = `处理失败：${err instanceof Error ? err.message : '未知错误'}`
    loading.value = false
  }
}

// 轮询查询结果（对接后端 API）
const pollResults = async () => {
  if (!currentTask.value) return

  try {
    const data = await ocrApi.getResults(currentTask.value.task_id)
    if (typeof data === 'object' && data && 'status' in data) {
      const status = (data as any).status as 'processing' | 'completed' | 'failed'
      if (status === 'processing') {
        // 仅保持轮询，不更新进度或步骤（UI不展示进度）
      } else if (status === 'completed') {
        // 完成，填充数据
        const d = data as { status: 'completed'; task_id: string; data: { json: any; markdown: string } }
        completedData.value = {
          json: d.data?.json ?? null,
          markdown: d.data?.markdown ?? ''
        }
        currentTask.value.status = 'completed'
        loading.value = false
        if (pollingInterval.value) clearInterval(pollingInterval.value)
      } else if (status === 'failed') {
        // 失败
        currentTask.value.status = 'failed'
        loading.value = false
        if (pollingInterval.value) clearInterval(pollingInterval.value)
        const errMsg = (data as any)?.error?.message || '处理失败'
        throw new Error(errMsg)
      }
    }
  } catch (err) {
    error.value = `查询失败：${err instanceof Error ? err.message : '未知错误'}`
    loading.value = false
    if (pollingInterval.value) clearInterval(pollingInterval.value)
  }
}

// Markdown HTML 转换
const markdownHtml = computed(() => {
  if (!completedData.value) return ''
  const md = (completedData.value.markdown || '').trim()
  if (md) {
    const html = marked.parse(md) as string
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th'],
      ADD_ATTR: ['style', 'border', 'colspan', 'rowspan', 'align', 'cellpadding', 'cellspacing']
    })
  }
  return ''
})

// 渲染 KaTeX
const renderMath = () => {
  if (!mdContainer.value) return
  try {
    renderMathInElement(mdContainer.value, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false
    })
  } catch (e) {
    // 忽略错误
  }
}

watch(markdownHtml, async () => {
  await nextTick()
  renderMath()
})

// 重置所有
const resetAll = () => {
  completedData.value = null
  currentTask.value = null
  clearFile()
}

onMounted(() => {
  // 组件初始化
})

onUnmounted(() => {
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<style scoped>
::v-deep(.md-content) table {
  border-collapse: collapse;
  margin: 0.5rem 0;
}

::v-deep(.md-content) table,
::v-deep(.md-content) th,
::v-deep(.md-content) td {
  border: 1px solid #e5e7eb;
}

::v-deep(.md-content) th,
::v-deep(.md-content) td {
  padding: 0.5rem;
}

::v-deep(.md-content) pre {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  overflow: auto;
}
</style>