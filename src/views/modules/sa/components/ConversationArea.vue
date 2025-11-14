<template>
  <div class="flex flex-col h-full">
    <!-- 消息列表 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-for="msg in conversationStore.currentMessages" :key="msg.id">
        <MessageBubble :message="msg" />
      </div>
      <div ref="messagesEnd" />
    </div>

    <!-- 输入框 -->
    <div class="border-t bg-white p-4 space-y-2">
      <textarea
        v-model="inputMessage"
        @keydown.enter.ctrl="sendMessage"
        placeholder="输入你的问题...（Ctrl+Enter 发送）"
        class="w-full p-3 border rounded focus:outline-none focus:ring-2 resize-none"
        rows="3"
        :disabled="loading"
      />
      <div class="flex justify-between">
        <span class="text-xs text-gray-500">
          {{ inputMessage.length }} / 5000
        </span>
        <button
          @click="sendMessage"
          :disabled="loading || !inputMessage.trim()"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 text-sm font-semibold"
        >
          {{ loading ? '处理中...' : '发送' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useConversationStore } from '@/stores/conversationStore'
import { useJobStore } from '@/stores/jobStore'
import MessageBubble from './MessageBubble.vue'
import api from '@/api/modules/sa'

const conversationStore = useConversationStore()
const jobStore = useJobStore()
const inputMessage = ref('')
const loading = ref(false)
const messagesEnd = ref<HTMLElement>()

const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const message = inputMessage.value
  inputMessage.value = ''
  loading.value = true

  try {
    const response = await api.post('/chat/send', {
      message,
      conversation_id: conversationStore.currentConversationId
    })

    if (response.data.status === 'success') {
      const data = response.data
      
      // 添加用户消息
      conversationStore.addMessage({
        id: 'msg-' + Date.now(),
        conversation_id: conversationStore.currentConversationId,
        role: 'user',
        content: message,
        type: 'query',
        created_at: new Date().toISOString()
      })

      // 添加Agent响应
      conversationStore.addMessage({
        id: data.message_id,
        conversation_id: conversationStore.currentConversationId,
        role: 'assistant',
        content: data.agent_response,
        type: 'thinking',
        created_at: new Date().toISOString()
      })

      // 添加Jobs到store
      for (const job of data.jobs) {
        jobStore.addJob(job)
      }

      // 滚动到底部
      await nextTick()
      messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    alert('发送失败，请重试')
  } finally {
    loading.value = false
  }
}

// 监听对话切换
watch(
  () => conversationStore.currentConversationId,
  async (newId) => {
    if (newId) {
      await conversationStore.loadMessages(newId)
      await nextTick()
      messagesEnd.value?.scrollIntoView()
    }
  }
)
</script>