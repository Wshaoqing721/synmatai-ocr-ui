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
      const response = await api.get('/nexus/chat/conversations', {
        params: { page: 1, per_page: 50 }
      })
      const data = response.data || {}
      const list = data.conversations || data.data?.conversations || []
      if (Array.isArray(list)) {
        conversations.value = list
        if (!currentConversationId.value && conversations.value.length > 0) {
          currentConversationId.value = conversations.value[0].id
        }
      }
    } catch (error) {
      console.error('加载对话列表失败:', error)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/nexus/chat/history/${conversationId}`, {
        params: { limit: 100, offset: 0 }
      })
      const data = response.data || {}
      const msgs = data.messages || data.data?.messages || []
      if (Array.isArray(msgs)) {
        // Sort messages chronologically (oldest first) based on created_at.
        currentMessages.value = [...msgs].sort((a: any, b: any) => {
          const ta = new Date(a.created_at || 0).getTime()
          const tb = new Date(b.created_at || 0).getTime()
          return ta - tb
        })
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