<template>
  <div class="h-full flex flex-col">
    <!-- 标题 -->
    <div class="p-4 border-b">
      <h2 class="text-lg font-bold">对话历史</h2>
      <button
        @click="createNewConversation"
        class="mt-2 w-full bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm"
      >
        + 新建对话
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="p-3">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索对话..."
        class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
      />
    </div>

    <!-- 对话列表 -->
    <div class="flex-1 overflow-y-auto">
      <div
        v-for="conv in filteredConversations"
        :key="conv.id"
        @click="selectConversation(conv.id)"
        :class="[
          'p-3 border-b cursor-pointer hover:bg-gray-50 transition',
          currentConversationId === conv.id ? 'bg-blue-50' : ''
        ]"
      >
        <p class="font-semibold text-sm truncate">{{ conv.title || '新对话' }}</p>
        <p class="text-xs text-gray-500 mt-1">
          {{ formatDate(conv.updated_at) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConversationStore } from '@/stores/conversationStore'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import api from '@/api/modules/sa'

const conversationStore = useConversationStore()
const searchQuery = ref('')

const currentConversationId = computed(
  () => conversationStore.currentConversationId
)

const filteredConversations = computed(() => {
  if (!searchQuery.value) {
    return conversationStore.conversations
  }
  return conversationStore.conversations.filter(
    conv => 
      (conv.title || '').includes(searchQuery.value) ||
      conv.id.includes(searchQuery.value)
  )
})

const formatDate = (date: string) => {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true,
    locale: zhCN
  })
}

const selectConversation = (id: string) => {
  conversationStore.setCurrentConversation(id)
}

const createNewConversation = async () => {
  try {
    const response = await api.post('/chat/conversations', {
      title: `对话 ${new Date().toLocaleString()}`
    })
    if (response.data.status === 'success') {
      conversationStore.addConversation({
        id: response.data.conversation_id,
        title: `对话 ${new Date().toLocaleString()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      selectConversation(response.data.conversation_id)
    }
  } catch (error) {
    console.error('创建对话失败:', error)
  }
}

// 初始化：加载对话列表
conversationStore.loadConversations()
</script>