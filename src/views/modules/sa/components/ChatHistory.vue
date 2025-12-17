<template>
  <div class="h-full flex flex-col bg-gray-50/50">
    <!-- Header -->
    <div class="p-4 border-b border-gray-100 bg-white">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-800">Conversations</h2>
        <el-tag type="info" round size="small">{{ filteredConversations.length }}</el-tag>
      </div>
      
      <el-button
        type="primary"
        class="w-full"
        @click="createNewConversation"
      >
        <el-icon class="mr-2"><Plus /></el-icon>
        New Chat
      </el-button>
    </div>

    <!-- Search -->
    <div class="p-3 bg-white border-b border-gray-100">
      <el-input
        v-model="searchQuery"
        placeholder="Search history..."
        prefix-icon="Search"
        clearable
      />
    </div>

    <!-- List -->
    <el-scrollbar class="flex-1" wrap-class="p-2 space-y-1">
      <div
        v-for="conv in filteredConversations"
        :key="conv.id"
        @click="selectConversation(conv.id)"
        :class="[
          'group p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent',
          currentConversationId === conv.id 
            ? 'bg-white border-gray-200 shadow-sm' 
            : 'hover:bg-white hover:border-gray-100 hover:shadow-sm'
        ]"
      >
        <div class="flex items-start justify-between gap-2">
          <h3 
            :class="[
              'font-medium text-sm truncate flex-1',
              currentConversationId === conv.id ? 'text-blue-700' : 'text-gray-700'
            ]"
          >
            {{ conv.title || 'New Conversation' }}
          </h3>
          <span class="text-[10px] text-gray-400 whitespace-nowrap flex-none mt-0.5">
            {{ formatDate(conv.updated_at) }}
          </span>
        </div>
        
        <p class="text-xs text-gray-400 mt-1 line-clamp-1 group-hover:text-gray-500">
          {{ conv.id }}
        </p>
      </div>
      
      <!-- Empty State -->
      <el-empty v-if="filteredConversations.length === 0" description="No conversations found" :image-size="60" />
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useConversationStore } from '@/stores/conversationStore'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import api from '@/api/modules/sa'
import { Plus, Search } from '@element-plus/icons-vue'

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
      (conv.title || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      conv.id.includes(searchQuery.value)
  )
})

const formatDate = (date: string) => {
  try {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: zhCN
    })
  } catch (e) {
    return ''
  }
}

const selectConversation = (id: string) => {
  conversationStore.setCurrentConversation(id)
}

const createNewConversation = async () => {
  try {
    const response = await api.post('/nexus/chat/conversations', {
      title: `Chat ${new Date().toLocaleString()}`
    })
    if (response.data.status === 'success') {
      conversationStore.addConversation({
        id: response.data.conversation_id,
        title: `Chat ${new Date().toLocaleString()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      selectConversation(response.data.conversation_id)
    }
  } catch (error) {
    console.error('Failed to create conversation:', error)
  }
}

// Initialize
conversationStore.loadConversations()
</script>

<style scoped>
</style>
