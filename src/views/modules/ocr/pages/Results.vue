<script setup lang="ts">
import { ref } from 'vue'
import { ocrApi } from '@/api/modules/ocr'
import ResultPreview from '../components/ResultPreview.vue'
import FormulaViewer from '../components/FormulaViewer.vue'
import TableViewer from '../components/TableViewer.vue'
import ChemistryViewer from '../components/ChemistryViewer.vue'
import type { OCRResult, ExportFormat } from '@/types/ocr'

const props = defineProps<{
  result: OCRResult | null
}>()

const emit = defineEmits<{
  restart: []
  back: []
}>()

const activeTab = ref<'text' | 'formulas' | 'chemistry' | 'tables' | 'graphics'>('text')
const exporting = ref(false)
const exportFormat = ref<ExportFormat>('json')
const error = ref('')
const success = ref('')

// 导出结果
const handleExport = async () => {
  if (!props.result) return

  exporting.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await ocrApi.export({
      task_id: props.result.task_id,
      format: exportFormat.value,
      options: {
        include_images: false,
        include_confidence: true,
        include_bbox: true
      }
    })

    success.value = `文件已准备好下载（${response.format}）`

    // 下载文件
    const link = document.createElement('a')
    link.href = response.download_url
    link.download = `ocr-${props.result.task_id}.${exportFormat.value}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    error.value = `导出失败：${err instanceof Error ? err.message : '未知错误'}`
  } finally {
    exporting.value = false
  }
}

// 复制文本
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  success.value = '已复制到剪贴板'
  setTimeout(() => {
    success.value = ''
  }, 2000)
}
</script>

<template>
  <div class="space-y-6">
    <!-- 成功/错误提示 -->
    <div v-if="success" class="p-4 bg-green-100 text-green-700 rounded-lg border border-green-300">
      {{ success }}
    </div>
    <div v-if="error" class="p-4 bg-red-100 text-red-700 rounded-lg border border-red-300">
      {{ error }}
    </div>

    <!-- 统计信息 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-lg shadow-sm">
        <p class="text-gray-600 text-sm">识别文本</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">
          {{ result?.results.full_text.length || 0 }}
        </p>
        <p class="text-xs text-gray-500 mt-1">字符</p>
      </div>

      <div class="bg-white p-4 rounded-lg shadow-sm">
        <p class="text-gray-600 text-sm">识别公式</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">
          {{ result?.results.formulas.length || 0 }}
        </p>
        <p class="text-xs text-gray-500 mt-1">个</p>
      </div>

      <div class="bg-white p-4 rounded-lg shadow-sm">
        <p class="text-gray-600 text-sm">识别表格</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">
          {{ result?.results.tables.length || 0 }}
        </p>
        <p class="text-xs text-gray-500 mt-1">张</p>
      </div>

      <div class="bg-white p-4 rounded-lg shadow-sm">
        <p class="text-gray-600 text-sm">处理用时</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">
          {{ result?.processing_time.toFixed(2) || 0 }}
        </p>
        <p class="text-xs text-gray-500 mt-1">秒</p>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="bg-white rounded-lg shadow-md">
      <!-- 标签页选项 -->
      <div class="flex border-b border-gray-200 overflow-x-auto">
        <button
          @click="activeTab = 'text'"
          :class="[
            'px-6 py-3 font-semibold whitespace-nowrap transition-colors',
            activeTab === 'text'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          ]"
        >
          📝 原始文本
        </button>
        <button
          v-if="result?.results.formulas.length"
          @click="activeTab = 'formulas'"
          :class="[
            'px-6 py-3 font-semibold whitespace-nowrap transition-colors',
            activeTab === 'formulas'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          ]"
        >
          🧮 公式 ({{ result?.results.formulas.length }})
        </button>
        <button
          v-if="result?.results.chemistry.length"
          @click="activeTab = 'chemistry'"
          :class="[
            'px-6 py-3 font-semibold whitespace-nowrap transition-colors',
            activeTab === 'chemistry'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          ]"
        >
          ⚗️ 化学 ({{ result?.results.chemistry.length }})
        </button>
        <button
          v-if="result?.results.tables.length"
          @click="activeTab = 'tables'"
          :class="[
            'px-6 py-3 font-semibold whitespace-nowrap transition-colors',
            activeTab === 'tables'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-700 hover:text-gray-900'
          ]"
        >
          📊 表格 ({{ result?.results.tables.length }})
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="p-6">
        <!-- 原始文本 -->
        <ResultPreview
          v-if="activeTab === 'text'"
          :text="result?.results.full_text || ''"
          @copy="copyToClipboard"
        />

        <!-- 公式 -->
        <FormulaViewer
          v-if="activeTab === 'formulas'"
          :formulas="result?.results.formulas || []"
        />

        <!-- 化学 -->
        <ChemistryViewer
          v-if="activeTab === 'chemistry'"
          :chemistry="result?.results.chemistry || []"
        />

        <!-- 表格 -->
        <TableViewer
          v-if="activeTab === 'tables'"
          :tables="result?.results.tables || []"
        />
      </div>
    </div>

    <!-- 导出选项 & 操作按钮 -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="font-bold text-lg mb-4">💾 导出结果</h3>

      <div class="flex flex-col md:flex-row gap-4">
        <select
          v-model="exportFormat"
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="json">JSON (结构化数据)</option>
          <option value="latex">LaTeX (数学排版)</option>
          <option value="markdown">Markdown (文档格式)</option>
          <option value="pdf">PDF (可搜索 PDF)</option>
          <option value="html">HTML (网页格式)</option>
        </select>

        <button
          @click="handleExport"
          :disabled="exporting"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold"
        >
          {{ exporting ? '导出中...' : '📥 导出' }}
        </button>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="flex space-x-4">
      <button
        @click="emit('back')"
        class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
      >
        ← 返回处理
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

<style scoped></style>
