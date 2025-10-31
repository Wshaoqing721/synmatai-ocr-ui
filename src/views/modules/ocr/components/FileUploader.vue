<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  acceptedTypes?: string[]
}>()

const emit = defineEmits<{
  fileSelected: [file: File]
}>()

const isDragging = ref(false)

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    emit('fileSelected', file)
  }
}

const handleFileInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const file = input.files[0]
    emit('fileSelected', file)
  }
}
</script>

<template>
  <div
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop="handleDrop"
    :class="[
      'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
      isDragging
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
    ]"
  >
    <div class="text-5xl mb-4">📤</div>

    <p class="text-xl font-semibold text-gray-900 mb-2">
      {{ isDragging ? '释放以上传文件' : '拖拽或点击选择文件' }}
    </p>

    <p class="text-sm text-gray-600 mb-6">
      支持格式：JPG、PNG、PDF（最大 50MB）
    </p>

    <label>
      <input
        type="file"
        @change="handleFileInput"
        :accept="acceptedTypes?.join(',')"
        class="hidden"
      />
      <span class="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
        📁 选择文件
      </span>
    </label>
  </div>
</template>

<style scoped></style>
