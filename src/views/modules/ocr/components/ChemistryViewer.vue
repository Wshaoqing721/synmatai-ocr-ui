<script setup lang="ts">
import { ref } from 'vue'
import type { Chemistry } from '@/types/ocr'

defineProps<{
  chemistry: Chemistry[]
}>()

const expandedId = ref<string | null>(null)

const toggleExpand = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="!chemistry.length" class="text-center py-12 text-gray-500">
      未识别到任何化学公式
    </div>

    <div v-for="(item, index) in chemistry" :key="item.chemistry_id" class="border rounded-lg">
      <!-- 化学式头部 -->
      <button
        @click="toggleExpand(item.chemistry_id)"
        class="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between cursor-pointer transition-colors"
      >
        <div class="text-left">
          <p class="font-mono text-lg text-green-600">{{ item.latex }}</p>
          <p class="text-xs text-gray-500 mt-1">
            {{ item.type === 'molecule_formula' ? '分子式' : '反应式' }}
            · 📄 第 {{ item.page }} 页
          </p>
        </div>
        <span class="text-xl">{{ expandedId === item.chemistry_id ? '▼' : '▶' }}</span>
      </button>

      <!-- 化学式详情 -->
      <div
        v-if="expandedId === item.chemistry_id"
        class="p-4 border-t border-gray-200 space-y-4"
      >
        <!-- SMILES -->
        <div>
          <p class="font-semibold text-sm text-gray-700 mb-2">SMILES</p>
          <div class="bg-gray-900 text-white p-3 rounded font-mono text-sm overflow-x-auto">
            {{ item.smiles }}
            <button
              @click="copyToClipboard(item.smiles)"
              class="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              📋 复制
            </button>
          </div>
        </div>

        <!-- InChI -->
        <div>
          <p class="font-semibold text-sm text-gray-700 mb-2">InChI</p>
          <div class="bg-gray-900 text-white p-3 rounded font-mono text-xs overflow-x-auto">
            {{ item.inchi }}
            <button
              @click="copyToClipboard(item.inchi)"
              class="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
            >
              📋 复制
            </button>
          </div>
        </div>

        <!-- 描述 -->
        <div v-if="item.description">
          <p class="font-semibold text-sm text-gray-700 mb-2">描述</p>
          <p class="text-gray-700 p-2 bg-gray-50 rounded">{{ item.description }}</p>
        </div>

        <!-- LaTeX -->
        <div>
          <p class="font-semibold text-sm text-gray-700 mb-2">LaTeX 表示</p>
          <p class="font-mono text-sm p-2 bg-gray-50 rounded">{{ item.latex }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
