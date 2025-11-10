<template>
  <div :class="['flex', message.role === 'user' ? 'justify-end' : 'justify-start']">
    <div
      :class="[
        'max-w-xs px-4 py-2 rounded-lg',
        message.role === 'user'
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-900'
      ]"
    >
      <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
      <p :class="['text-xs mt-1', message.role === 'user' ? 'text-blue-200' : 'text-gray-500']">
        {{ formatTime(message.created_at) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

defineProps<{ message: Message }>()

const formatTime = (date: string) => {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true,
    locale: zhCN
  })
}
</script>