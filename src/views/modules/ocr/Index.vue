<template>
  <div class="flex h-full bg-gray-50" style="min-height:0;">
    <!-- 左侧：图片上传和预览 -->
    <div class="w-1/2 flex flex-col p-6 border-r border-gray-200 bg-white h-full min-h-0">
      <h2 class="text-lg font-bold mb-4">📤 上传图片</h2>
      
      <!-- 上传区域 -->
      <el-upload
        v-if="!selectedFile"
        class="flex-1 flex flex-col justify-center"
        drag
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        accept=".jpg,.jpeg,.png"
        :on-change="handleFileChange"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽或点击上传图片
          <div class="text-xs text-gray-500 mt-1">支持 JPG、PNG 格式</div>
        </div>
      </el-upload>

      <!-- 已选择图片预览 -->
      <div v-else class="flex-1 flex flex-col min-h-0">
        <div class="flex-1 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden relative">
          <el-image 
            :src="previewUrl || undefined" 
            fit="contain" 
            class="w-full h-full"
            :preview-src-list="previewUrl ? [previewUrl] : []"
          />
          <div class="absolute top-2 right-2">
             <el-button type="danger" circle size="small" @click="clearFile">
               <el-icon><Close /></el-icon>
             </el-button>
          </div>
        </div>
        <div class="mt-3 p-3 bg-blue-50 rounded-lg text-sm flex justify-between items-center">
          <div>
            <p class="text-gray-700 font-bold">{{ selectedFile.name }}</p>
            <p class="text-gray-600 text-xs mt-1">大小: {{ formatFileSize(selectedFile.size) }}</p>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="mt-4 flex gap-2">
        <el-button
          v-if="selectedFile"
          @click="handleSubmit"
          :loading="loading"
          type="primary"
          class="w-full"
        >
          {{ loading ? '处理中...' : '开始识别' }}
        </el-button>
      </div>

      <!-- 错误提示 -->
      <el-alert v-if="error" :title="error" type="error" show-icon class="mt-3" :closable="false" />
    </div>

    <!-- 右侧：OCR结果展示 -->
    <div class="w-1/2 flex flex-col p-6 bg-white h-full min-h-0" v-loading="loading && !completedData" element-loading-text="处理中...">
      <h2 class="text-lg font-bold mb-4">🧾 识别结果</h2>

      <!-- 结果展示 -->
      <div v-if="completedData" class="flex-1 flex flex-col overflow-hidden">
        <el-tabs v-model="viewMode" class="flex-1 flex flex-col h-full">
          <el-tab-pane label="Markdown" name="markdown" class="h-full">
             <el-scrollbar class="h-full bg-gray-50 rounded-lg p-4">
                <div ref="mdContainer" class="md-content text-sm leading-relaxed" v-html="markdownHtml"></div>
             </el-scrollbar>
          </el-tab-pane>
          <el-tab-pane label="JSON" name="json" class="h-full">
             <el-scrollbar class="h-full bg-gray-50 rounded-lg p-4">
                <pre class="text-xs leading-relaxed whitespace-pre-wrap break-words">{{ JSON.stringify(completedData.json, null, 2) }}</pre>
             </el-scrollbar>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <!-- 空状态 -->
      <el-empty v-else-if="!loading" description="上传图片后显示结果" />

      <!-- 重新开始按钮 -->
      <el-button
        v-if="completedData"
        @click="resetAll"
        type="success"
        class="mt-4"
      >
        🔄 开始新任务
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import 'katex/dist/katex.min.css'
import { normalizeLatex, hasMathDelimiters } from '@/utils/latex'
import { renderMathInContainer } from '@/utils/math'
import type { OCRTask, OCROptions } from '@/types/ocr'
import { ocrApi } from '@/api/modules/ocr'
import { UploadFilled, Close } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'

// 使用全局类型定义，避免重复定义

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
const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    processFile(uploadFile.raw)
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
const isOCRResult = (x: any) => x && typeof x === 'object' && 'results' in x && 'source' in x
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
    } else if (isOCRResult(data)) {
      // 后端直接返回最终 OCRResult（无 status 字段）
      completedData.value = {
        json: data as any,
        markdown: ''
      }
      currentTask.value.status = 'completed'
      loading.value = false
      if (pollingInterval.value) clearInterval(pollingInterval.value)
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
    const mdToParse = hasMathDelimiters(md) ? normalizeLatex(md) : md
    const html = marked.parse(mdToParse) as string
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
    renderMathInContainer(mdContainer.value)
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

<style>
body {
  overflow: hidden;
}
</style>