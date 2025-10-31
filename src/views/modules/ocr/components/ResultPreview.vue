<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  text: string
}>()

const emit = defineEmits<{
  copy: [text: string]
}>()

const copyMode = ref(false)

const handleCopy = () => {
  emit('copy', text)
  copyMode.value = true
  setTimeout(() => {
    copyMode.value = false
  }, 2000)
}
</script>

<template>
  <div class="space-y-4">
    <!-- 操作栏 -->
    <div class="flex items-center justify-between">
      <div class="text-sm text-gray-600">
        共 {{ text.length }} 字符
      </div>
      <button
        @click="handleCopy"
        :class="[
          'px-4 py-2 rounded-lg font-semibold transition-colors',
          copyMode
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        {{ copyMode ? '✓ 已复制' : '📋 复制全文' }}
      </button>
    </div>

    <!-- 文本框 -->
    <textarea
      :value="text"
      readonly
      class="w-full h-96 p-4 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm resize-none focus:outline-none"
    />

    <!-- 文本统计 -->
    <div class="grid grid-cols-4 gap-4 text-center text-sm">
      <div class="p-2 bg-gray-100 rounded">
        <p class="text-gray-600">字符数</p>
        <p class="text-lg font-bold">{{ text.length }}</p>
      </div>
      <div class="p-2 bg-gray-100 rounded">
        <p class="text-gray-600">行数</p>
        <p class="text-lg font-bold">{{ text.split('\n').length }}</p>
      </div>
      <div class="p-2 bg-gray-100 rounded">
        <p class="text-gray-600">词数</p>
        <p class="text-lg font-bold">{{ text.split(/\s+/).filter(w => w).length }}</p>
      </div>
      <div class="p-2 bg-gray-100 rounded">
        <p class="text-gray-600">段落数</p>
        <p class="text-lg font-bold">{{ text.split(/\n\n+/).filter(p => p).length }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
