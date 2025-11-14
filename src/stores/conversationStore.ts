import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/modules/sa'

interface Conversation {
  id: string
  title?: string
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  conversation_id: string
  role: string
  content: string
  type: string
  created_at: string
}

export const useConversationStore = defineStore('conversation', () => {
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<string>('')
  const currentMessages = ref<Message[]>([])

  const setCurrentConversation = (id: string) => {
    currentConversationId.value = id
  }

  const addConversation = (conv: Conversation) => {
    conversations.value.unshift(conv)
  }

  const addMessage = (msg: Message) => {
    currentMessages.value.push(msg)
  }

  const loadConversations = async () => {
    try {
      const response = await api.get('/chat/conversations', {
        params: { page: 1, per_page: 50 }
      })
      if (response.data.status === 'success') {
        conversations.value = response.data.conversations
        if (conversations.value.length > 0) {
          currentConversationId.value = conversations.value[0].id
        }
      }
    } catch (error) {
      console.error('加载对话列表失败:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/chat/history/${conversationId}`, {
        params: { limit: 100, offset: 0 }
      })
      if (response.data.status === 'success') {
        currentMessages.value = response.data.messages.reverse()
      }
    } catch (error) {
      console.error('加载消息失败:', error)
    }
  }

  return {
    conversations,
    currentConversationId,
    currentMessages,
    setCurrentConversation,
    addConversation,
    addMessage,
    loadConversations,
    loadMessages
  }
})