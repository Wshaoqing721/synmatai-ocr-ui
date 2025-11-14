<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { ocrApi } from '@/api/modules/ocr'
import FileUploader from '../components/FileUploader.vue'
import type { OCRTask, OCROptions } from '@/types/ocr'

const emit = defineEmits<{
  complete: [task: OCRTask]
}>()

const loading = ref(false)
const selectedFile = ref<File | null>(null)
const fileType = ref<'photo' | 'pdf'>('photo')
const selectedLanguages = ref<string[]>(['zh', 'en'])
const error = ref('')
const previewUrl = ref<string | null>(null)

// OCR 处理选项
const ocrOptions = ref<OCROptions>({
  extract_formulas: true,
  extract_chemistry: true,
  extract_tables: true,
  preserve_layout: true,
  formula_format: ['latex', 'mathml']
})

// 可用语言列表
const availableLanguages = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: '英文' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'es', label: '西班牙语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' }
]

// 文件大小格式化
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// 语言选择切换
const toggleLanguage = (code: string) => {
  const index = selectedLanguages.value.indexOf(code)
  if (index > -1) {
    selectedLanguages.value.splice(index, 1)
  } else {
    selectedLanguages.value.push(code)
  }
}

// 处理文件选择
const handleFileSelected = (file: File) => {
  selectedFile.value = file
  error.value = ''

  // 自动检测文件类型
  if (file.type.startsWith('image/')) {
    fileType.value = 'photo'
    // 生成本地预览地址
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = URL.createObjectURL(file)
  } else if (file.type === 'application/pdf') {
    fileType.value = 'pdf'
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }
}

// 提交处理
const handleSubmit = async () => {
  if (!selectedFile.value) {
    error.value = '请选择文件'
    return
  }

  if (selectedLanguages.value.length === 0) {
    error.value = '请至少选择一种语言'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await ocrApi.upload(
      selectedFile.value,
      fileType.value,
      selectedLanguages.value,
      ocrOptions.value
    )

    // 构建 OCRTask 对象
    const task: OCRTask = {
      task_id: response.task_id,
      status: 'queued',
      filename: selectedFile.value.name,
      file_type: fileType.value,
      file_size: selectedFile.value.size,
      languages: selectedLanguages.value,
      created_at: response.created_at,
      progress: 0,
      preview_url: previewUrl.value || undefined
    }

    emit('complete', task)
  } catch (err) {
    error.value = `上传失败：${err instanceof Error ? err.message : '未知错误'}`
    console.error(err)
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- 左侧：文件上传 -->
    <div class="lg:col-span-2">
      <div class="bg-white rounded-lg shadow-md p-8">
        <h2 class="text-2xl font-bold mb-6">📁 选择文件</h2>

        <!-- 文件上传器 -->
        <FileUploader
          @file-selected="handleFileSelected"
          :accepted-types="['.jpg', '.png', '.pdf']"
        />

        <!-- 已选择文件信息 -->
        <div v-if="selectedFile" class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-start space-x-4">
            <div class="text-3xl">📄</div>
            <div class="flex-1">
              <p class="font-semibold text-gray-900">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-600 mt-1">
                大小：{{ formatFileSize(selectedFile.size) }}
              </p>
              <p class="text-sm text-gray-600">
                类型：{{ fileType === 'photo' ? '图片' : 'PDF 文档' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="mt-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
          {{ error }}
        </div>

        <!-- 处理选项 -->
        <div class="mt-8 space-y-4">
          <h3 class="font-semibold text-gray-900">🔧 处理选项</h3>

          <label class="flex items-center space-x-3">
            <input
              v-model="ocrOptions.extract_formulas"
              type="checkbox"
              class="w-4 h-4 text-blue-600 rounded"
            />
            <span class="text-gray-700">提取数学公式（LaTeX、MathML）</span>
          </label>

          <label class="flex items-center space-x-3">
            <input
              v-model="ocrOptions.extract_chemistry"
              type="checkbox"
              class="w-4 h-4 text-blue-600 rounded"
            />
            <span class="text-gray-700">提取化学公式（SMILES、InChI）</span>
          </label>

          <label class="flex items-center space-x-3">
            <input
              v-model="ocrOptions.extract_tables"
              type="checkbox"
              class="w-4 h-4 text-blue-600 rounded"
            />
            <span class="text-gray-700">提取表格数据</span>
          </label>

          <label class="flex items-center space-x-3">
            <input
              v-model="ocrOptions.preserve_layout"
              type="checkbox"
              class="w-4 h-4 text-blue-600 rounded"
            />
            <span class="text-gray-700">保留原始布局</span>
          </label>
        </div>

        <!-- 提交按钮 -->
        <div class="mt-8 flex space-x-4">
          <button
            @click="handleSubmit"
            :disabled="loading || !selectedFile"
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {{ loading ? '上传中...' : '开始识别' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧：语言选择 & 说明 -->
    <div class="space-y-6">
      <!-- 语言选择 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="font-bold text-lg mb-4">🌐 识别语言</h3>
        <div class="space-y-3">
          <label v-for="lang in availableLanguages" :key="lang.code" class="flex items-center">
            <input
              type="checkbox"
              :checked="selectedLanguages.includes(lang.code)"
              @change="toggleLanguage(lang.code)"
              class="w-4 h-4 text-blue-600 rounded"
            />
            <span class="ml-3 text-gray-700">{{ lang.label }}</span>
          </label>
        </div>
      </div>

      <!-- 功能说明 -->
      <div class="bg-indigo-50 rounded-lg shadow-md p-6 border border-indigo-200">
        <h3 class="font-bold text-lg mb-3">✨ 功能特性</h3>
        <ul class="space-y-2 text-sm text-gray-700">
          <li class="flex items-start">
            <span class="mr-2">✓</span>
            <span><strong>文本识别</strong> - 准确提取文档中的所有文本</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">✓</span>
            <span><strong>公式识别</strong> - 支持数学公式 LaTeX 格式</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">✓</span>
            <span><strong>化学识别</strong> - 识别化学分子式和反应方程式</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">✓</span>
            <span><strong>表格提取</strong> - 自动识别并转换表格格式</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">✓</span>
            <span><strong>多格式导出</strong> - JSON、PDF、LaTeX、Markdown</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
