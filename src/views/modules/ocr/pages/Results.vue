<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { ocrApi } from '@/api/modules/ocr'
import ProcessProgress from '../components/ProcessProgress.vue'
import type { OCRTask } from '@/types/ocr'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import renderMathInElement from 'katex/contrib/auto-render'
import 'katex/contrib/mhchem'
import 'katex/dist/katex.min.css'
import { useRoute } from 'vue-router'

const props = defineProps<{
  task: OCRTask | null
}>()

const emit = defineEmits<{
  restart: []
  back: []
}>()

// 状态
const route = useRoute()
const currentTask = ref<OCRTask | null>(props.task)
type PollProcessing = { status: 'processing'; task_id: string; progress?: number; current_step?: string; error?: any }
type PollFailed = { status: 'failed'; task_id: string; error?: any }
type PollCompleted = { status: 'completed'; task_id: string; data: { json: any; markdown: string }; meta?: any }

const completedData = ref<{ json: any; markdown: string; meta?: any } | null>(null)
const error = ref('')

// 处理中的弹窗控制
const showProcessing = ref<boolean>(!!currentTask.value)
const progressLogs = ref<Array<{ time: string; step: string; status: 'info' | 'success' }>>([])
const pollingInterval = ref<number | null>(null)

// 右侧视图切换：markdown | json
const viewMode = ref<'markdown' | 'json'>('markdown')

const formatTime = () => new Date().toLocaleTimeString('zh-CN')
const addLog = (step: string, status: 'info' | 'success' = 'info') => {
  progressLogs.value.push({ time: formatTime(), step, status })
}

// 构建 Markdown 文本（客户端渲染）
// 简单转义文本，避免构建 HTML 时注入
const escapeHtml = (str: string) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// 当后端 markdown 为空时，从 json 直接构造 HTML（不走 Markdown 解析，保证表格原生渲染）
const buildHtmlFromJson = (j: any): string => {
  const parts: string[] = []
  parts.push(`<h1 class="text-xl font-bold">识别结果 - ${escapeHtml(j?.file_name || '')}</h1>`) 
  if (j?.processing_time) {
    parts.push(`<p class="mt-1 text-gray-600">用时：${escapeHtml(j.processing_time.toFixed ? j.processing_time.toFixed(2) : j.processing_time)}</p>`)
  }
  if (Array.isArray(j?.pages)) {
    parts.push(`<p class="mt-2">共 ${j.pages.length} 页</p>`) 
    j.pages.forEach((p: any, pi: number) => {
      parts.push(`<h2 class="mt-4 text-lg font-semibold">第 ${pi + 1} 页</h2>`) 
      const res = p?.res
      const blocks = res?.parsing_res_list || []
      blocks.forEach((b: any, bi: number) => {
        const label = String(b.block_label || '')
        const content = String(b.block_content || '')
        if (label === 'table') {
          // 直接插入表格 HTML，后续统一做 sanitize
          parts.push(`<div class="my-3 overflow-x-auto">${content}</div>`) 
        } else if (label.includes('formula') || label.toLowerCase().includes('chem')) {
          // 直接保留 $...$ 或 $$...$$，交给 KaTeX auto-render 渲染
          parts.push(`<div class=\"my-2 math-block\">${content}</div>`) 
        } else {
          const text = content.trim()
          if (text) {
            parts.push(`<p class="my-2">${escapeHtml(text)}</p>`) 
          }
        }
      })
    })
  }
  return parts.join('')
}

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
  const htmlFromJson = buildHtmlFromJson(completedData.value.json)
  return DOMPurify.sanitize(htmlFromJson, {
    ADD_TAGS: ['table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th'],
    ADD_ATTR: ['style', 'border', 'colspan', 'rowspan', 'align', 'cellpadding', 'cellspacing']
  })
})

// 渲染 KaTeX：在 HTML 注入后对容器进行自动渲染
const mdContainer = ref<HTMLElement | null>(null)

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
    // 忽略 KaTeX 渲染错误，避免影响整体展示
  }
}

// 监听 HTML 内容变化后渲染数学公式
watch(markdownHtml, async () => {
  await nextTick()
  renderMath()
})

// 轮询查询处理结果
const pollResults = async () => {
  if (!currentTask.value) return
  try {
    const data = await ocrApi.getResults(currentTask.value.task_id)
    // 使用类型保护判断返回结构
    if (typeof data === 'object' && data && 'status' in data) {
      const s = (data as PollProcessing | PollFailed | PollCompleted).status
      if (s === 'processing') {
        const d = data as PollProcessing
        currentTask.value.progress = d.progress
        currentTask.value.current_step = d.current_step
        if (d.current_step && !progressLogs.value.find(log => log.step === d.current_step)) {
          addLog(d.current_step, 'info')
        }
      } else if (s === 'completed') {
        const d = data as PollCompleted
        currentTask.value.progress = 100
        currentTask.value.status = 'completed'
        addLog('处理完成！', 'success')
        completedData.value = {
          json: d.data?.json ?? null,
          markdown: d.data?.markdown ?? '',
          meta: (data as any).meta
        }
        showProcessing.value = false
        if (pollingInterval.value) clearInterval(pollingInterval.value)
      } else if (s === 'failed') {
        const d = data as PollFailed
        currentTask.value.status = 'failed'
        currentTask.value.error = d.error as any
        error.value = `处理失败：${(d.error as any)?.message || '未知错误'}`
        if (pollingInterval.value) clearInterval(pollingInterval.value)
        showProcessing.value = false
      }
    }
  } catch (err) {
    error.value = `查询失败：${err instanceof Error ? err.message : '未知错误'}`
  }
}

onMounted(() => {
  // 读取路由参数：task_id 和 view
  const queryTaskId = (route.query.task_id as string) || ''
  const queryView = (route.query.view as string) || ''
  if (queryView === 'json' || queryView === 'markdown') {
    viewMode.value = queryView as 'markdown' | 'json'
  }

  // 若未传入任务，则使用 mock task id 开始轮询
  if (!currentTask.value) {
    const tid = queryTaskId || 'ocr-0c622e63-20251104_110623'
    currentTask.value = {
      task_id: tid,
      status: 'processing',
      filename: 'mock.jpg',
      file_type: 'photo',
      file_size: 0,
      languages: ['zh'],
      created_at: new Date().toISOString(),
      progress: 0
    }
  }

  if (currentTask.value) {
    addLog('已进入队列', 'info')
    addLog('初始化处理...', 'info')
    pollingInterval.value = setInterval(pollResults, 1000)
    pollResults()
  }
})

onUnmounted(() => {
  if (pollingInterval.value) clearInterval(pollingInterval.value)
})
</script>

<template>
  <div class="space-y-6">
    <!-- 错误提示 -->
    <div v-if="error" class="p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
      {{ error }}
    </div>

    <!-- 处理中的透明弹窗 -->
    <div v-if="showProcessing" class="fixed inset-0 z-20 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/30"></div>
      <div class="relative z-30 w-full max-w-2xl mx-auto bg-white/90 backdrop-blur rounded-xl shadow-xl p-6">
        <h2 class="text-xl font-bold mb-4">⏳ 正在处理…</h2>
        <ProcessProgress
          :progress="currentTask?.progress || 0"
          :status="currentTask?.status || 'processing'"
          :current-step="currentTask?.current_step"
        />
        <div class="mt-4 h-40 overflow-y-auto bg-gray-50 rounded-md p-3">
          <div
            v-for="(log, index) in progressLogs"
            :key="index"
            class="flex items-start space-x-3 text-sm py-1"
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

  <!-- 结果展示 -->
  <div v-if="completedData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：原始图片 -->
      <div class="bg-white rounded-lg shadow-md p-4 flex items-center justify-center min-h-[360px]">
        <template v-if="currentTask?.file_type === 'photo' && currentTask?.preview_url">
          <img :src="currentTask.preview_url" alt="原始图片" class="max-h-[70vh] w-auto object-contain rounded" />
        </template>
        <template v-else>
          <div class="text-center text-gray-500">
            <div class="text-5xl mb-2">📄</div>
            <p>暂无图片预览 {{ currentTask?.file_type === 'pdf' ? '（PDF 预览未实现）' : '' }}</p>
          </div>
        </template>
      </div>

      <!-- 右侧：切换视图 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">🧾 结果内容</h3>
          <div class="inline-flex rounded-md shadow-sm" role="group">
            <button
              @click="viewMode = 'markdown'"
              :class="['px-4 py-2 text-sm font-medium border', viewMode === 'markdown' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300']"
            >
              Markdown
            </button>
            <button
              @click="viewMode = 'json'"
              :class="['px-4 py-2 text-sm font-medium border -ml-px', viewMode === 'json' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300']"
            >
              JSON
            </button>
          </div>
        </div>

        <div v-if="viewMode === 'markdown'">
          <div class="h-[70vh] overflow-auto border border-gray-200 rounded-md bg-white p-4">
            <div ref="mdContainer" class="md-content text-sm leading-6" v-html="markdownHtml"></div>
          </div>
        </div>
        <div v-else>
          <pre class="h-[70vh] whitespace-pre text-xs leading-5 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-auto">{{ JSON.stringify(completedData.json, null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="flex space-x-4">
      <button
        @click="emit('back')"
        class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
      >
        ← 返回上传
      </button>
      <button
        @click="emit('restart')"
        class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
      >
        🔄 开始新任务
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 强化 Markdown 内容在容器内的表现和表格边框样式 */
::v-deep(.md-content) table {
  border-collapse: collapse;
  margin-left: auto;
  margin-right: auto;
}
::v-deep(.md-content) table,
::v-deep(.md-content) th,
::v-deep(.md-content) td {
  border: 1px solid #e5e7eb; /* gray-200 */
}
::v-deep(.md-content) th,
::v-deep(.md-content) td {
  padding: 0.5rem; /* 8px */
}
::v-deep(.md-content) pre {
  background: #f9fafb; /* gray-50 */
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem; /* rounded-md */
  padding: 0.5rem 0.75rem;
  overflow: auto;
}
::v-deep(.md-content) .math-block {
  overflow-x: auto;
}
</style>
