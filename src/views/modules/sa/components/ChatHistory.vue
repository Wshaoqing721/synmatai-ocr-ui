<template>
  <div class="h-full flex flex-col bg-gray-50/50">
    <!-- Header -->
    <div class="p-4 border-b border-gray-100 bg-white">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-800">Conversations</h2>
        <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{{ filteredConversations.length }}</span>
      </div>
      
      <button
        @click="createNewConversation"
        class="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        New Chat
      </button>
    </div>

    <!-- Search -->
    <div class="p-3 bg-white border-b border-gray-100">
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search history..."
          class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
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
      <div v-if="filteredConversations.length === 0" class="text-center py-8">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p class="text-sm text-gray-500">No conversations found</p>
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
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}
</style>
