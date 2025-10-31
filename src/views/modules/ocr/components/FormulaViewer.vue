<script setup lang="ts">
import { ref } from 'vue'
import type { Formula } from '@/types/ocr'

defineProps<{
  formulas: Formula[]
}>()

const expandedId = ref<string | null>(null)

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}

const copyLatex = (latex: string) => {
  navigator.clipboard.writeText(latex)
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!formulas.length" class="text-center py-12 text-gray-500">
      未识别到任何公式
    </div>

    <div v-for="(formula, index) in formulas" :key="formula.formula_id" class="border rounded-lg">
      <!-- 公式头部 -->
      <button
        @click="toggleExpand(formula.formula_id)"
        class="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between cursor-pointer transition-colors"
      >
        <div class="text-left">
          <p class="font-mono text-sm text-blue-600">{{ formula.latex }}</p>
          <p class="text-xs text-gray-500 mt-1">
            📄 第 {{ formula.page }} 页 · {{ formula.mode === 'inline' ? '行内' : '展示' }}
            · 置信度 {{ (formula.confidence * 100).toFixed(0) }}%
          </p>
        </div>
        <span class="text-xl">{{ expandedId === formula.formula_id ? '▼' : '▶' }}</span>
      </button>

      <!-- 公式详情 -->
      <div
        v-if="expandedId === formula.formula_id"
        class="p-4 border-t border-gray-200 space-y-4"
      >
        <!-- LaTeX 源码 -->
        <div>
          <p class="font-semibold text-sm text-gray-700 mb-2">LaTeX 源码</p>
          <div class="bg-gray-900 text-white p-3 rounded font-mono text-sm overflow-x-auto">
            {{ formula.latex }}
            <button
              @click="copyLatex(formula.latex)"
              class="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              📋 复制
            </button>
          </div>
        </div>

        <!-- MathML -->
        <div>
          <p class="font-semibold text-sm text-gray-700 mb-2">MathML</p>
          <div class="bg-gray-50 p-3 rounded font-mono text-xs overflow-x-auto">
            <code>{{ formula.mathml.substring(0, 100) }}...</code>
          </div>
        </div>

        <!-- 位置信息 -->
        <div class="grid grid-cols-4 gap-2 text-xs">
          <div>
            <p class="text-gray-600">X1</p>
            <p class="font-semibold">{{ formula.bbox }}</p>
          </div>
          <div>
            <p class="text-gray-600">Y1</p>
            <p class="font-semibold">{{ formula.bbox }}</p>
          </div>
          <div>
            <p class="text-gray-600">X2</p>
            <p class="font-semibold">{{ formula.bbox }}</p>
          </div>
          <div>
            <p class="text-gray-600">Y2</p>
            <p class="font-semibold">{{ formula.bbox }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
