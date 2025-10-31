<script setup lang="ts">
import { ref } from 'vue'
import type { Table } from '@/types/ocr'

defineProps<{
  tables: Table[]
}>()

const selectedTableId = ref<string>(tables.length > 0 ? tables.table_id : '')
const copyMode = ref(false)

const currentTable = computed(() => {
  return tables.find(t => t.table_id === selectedTableId.value)
})

const copyCSV = () => {
  if (currentTable.value) {
    navigator.clipboard.writeText(currentTable.value.csv)
    copyMode.value = true
    setTimeout(() => {
      copyMode.value = false
    }, 2000)
  }
}

const downloadCSV = () => {
  if (currentTable.value) {
    const element = document.createElement('a')
    element.setAttribute(
      'href',
      'data:text/csv;charset=utf-8,' + encodeURIComponent(currentTable.value.csv)
    )
    element.setAttribute('download', `table-${currentTable.value.table_id}.csv`)
    element.click()
  }
}

import { computed } from 'vue'
</script>

<template>
  <div class="space-y-4">
    <div v-if="!tables.length" class="text-center py-12 text-gray-500">
      未识别到任何表格
    </div>

    <div v-else class="space-y-4">
      <!-- 表格选择 -->
      <div v-if="tables.length > 1" class="flex gap-2 overflow-x-auto">
        <button
          v-for="table in tables"
          :key="table.table_id"
          @click="selectedTableId = table.table_id"
          :class="[
            'px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors',
            selectedTableId === table.table_id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          ]"
        >
          表格 {{ tables.indexOf(table) + 1 }}
        </button>
      </div>

      <!-- 当前表格 -->
      <div v-if="currentTable" class="space-y-4">
        <!-- 操作栏 -->
        <div class="flex gap-2">
          <button
            @click="copyCSV"
            :class="[
              'px-4 py-2 rounded-lg font-semibold transition-colors',
              copyMode
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]"
          >
            {{ copyMode ? '✓ 已复制' : '📋 复制 CSV' }}
          </button>
          <button
            @click="downloadCSV"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
          >
            💾 下载 CSV
          </button>
        </div>

        <!-- 表格显示 -->
        <div class="overflow-x-auto border border-gray-200 rounded-lg">
          <table class="w-full">
            <thead class="bg-gray-100 border-b border-gray-200">
              <tr>
                <th
                  v-for="(header, i) in currentTable.headers"
                  :key="i"
                  class="px-4 py-3 text-left font-semibold text-sm text-gray-900"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(row, i) in currentTable.rows" :key="i" class="hover:bg-gray-50">
                <td v-for="(cell, j) in row" :key="j" class="px-4 py-3 text-sm text-gray-700">
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 表格信息 -->
        <div class="grid grid-cols-3 gap-2 text-sm">
          <div class="p-2 bg-gray-100 rounded text-center">
            <p class="text-gray-600">行数</p>
            <p class="font-bold">{{ currentTable.rows.length }}</p>
          </div>
          <div class="p-2 bg-gray-100 rounded text-center">
            <p class="text-gray-600">列数</p>
            <p class="font-bold">{{ currentTable.headers.length }}</p>
          </div>
          <div class="p-2 bg-gray-100 rounded text-center">
            <p class="text-gray-600">页面</p>
            <p class="font-bold">{{ currentTable.page }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
