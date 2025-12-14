import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/modules/sa'
import { useJobStore } from './jobStore'

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
      const tasks = data.tasks || data.data?.tasks || []
      if (Array.isArray(msgs)) {
        // Sort messages chronologically (oldest first) based on created_at.
        currentMessages.value = [...msgs].sort((a: any, b: any) => {
          const ta = new Date(a.created_at || 0).getTime()
          const tb = new Date(b.created_at || 0).getTime()
          return ta - tb
        })
      }

      // 如果返回了关联任务 (tasks)，同步到 jobStore
      if (Array.isArray(tasks) && tasks.length > 0) {
        const jobStore = useJobStore()
        for (const t of tasks) {
          try {
            const job = {
              id: t.id,
              name: t.name || t.task_type || '任务',
              type: t.task_type || t.type || 'task',
              status: t.status || 'pending',
              progress: typeof t.progress === 'number' ? t.progress : (t.progress ? Number(t.progress) : 0),
              priority: typeof t.priority === 'number' ? t.priority : 1,
              execution_time: t.execution_time
            }
            jobStore.addJob(job)
          } catch (e) {
            console.warn('同步 task 到 jobStore 失败', e)
          }
        }
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