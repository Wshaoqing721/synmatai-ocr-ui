<template>
  <div class="flex flex-col h-full relative bg-white">
    <!-- Messages Area -->
    <el-scrollbar class="flex-1" wrap-class="overflow-x-hidden">
      <div class="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <!-- Welcome State -->
        <el-empty v-if="conversationStore.currentMessages.length === 0" description="How can I help you today?">
          <template #image>
             <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
               🤖
             </div>
          </template>
          <p class="text-gray-500">Ask me anything about your documents or tasks.</p>
        </el-empty>

        <!-- Message List -->
        <div v-for="msg in conversationStore.currentMessages" :key="msg.id">
          <MessageBubble :message="msg" />
        </div>
        
        <!-- Loading Indicator -->
        <div v-if="loading && !currentStreamMessage" class="flex justify-center py-4">
           <el-icon class="is-loading text-2xl text-gray-400"><Loading /></el-icon>
        </div>
        
        <div ref="messagesEnd" class="h-4" />
      </div>
    </el-scrollbar>

    <!-- Input Area -->
    <div class="flex-none p-4 bg-white border-t border-gray-100">
      <div class="max-w-3xl mx-auto">
        <div class="relative">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 6 }"
            placeholder="Message Super Agent..."
            @keydown.enter.ctrl="sendMessage"
            :disabled="loading"
            resize="none"
            class="w-full"
          />
          
          <!-- Send Button -->
          <el-button
            type="primary"
            circle
            @click="sendMessage"
            :disabled="loading || !inputMessage.trim()"
            class="absolute right-2 bottom-2 z-10"
          >
            <el-icon><Position /></el-icon>
          </el-button>
        </div>

        <!-- Footer Controls -->
        <div class="flex justify-between items-center mt-2 px-1">
          <div class="flex items-center gap-3">
             <div class="flex items-center gap-2">
               <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Model</span>
               <el-select v-model="apiVersion" size="small" class="w-32">
                 <el-option label="Standard (v1)" value="v1" />
                 <el-option label="Streaming (v2)" value="v2" />
                 <el-option label="Enhanced (v3)" value="v3" />
               </el-select>
             </div>
          </div>
          <span class="text-xs text-gray-400">{{ inputMessage.length }} / 5000</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useConversationStore } from '@/stores/conversationStore'
import { useJobStore } from '@/stores/jobStore'
import MessageBubble from './MessageBubble.vue'
import api from '@/api/modules/sa'
import { ElNotification } from 'element-plus'
import { Position, Loading } from '@element-plus/icons-vue'

const conversationStore = useConversationStore()
const jobStore = useJobStore()
const inputMessage = ref('')
const loading = ref(false)
const messagesEnd = ref<HTMLElement>()
const apiVersion = ref<'v1' | 'v2' | 'v3'>('v1')
const currentStreamMessage = ref<any>(null)

// WebSocket（聊天、任务、用户级任务） & SSE（LLM流）相关
const tasksWsRef = ref<WebSocket | null>(null)
const tasksWsConnected = ref(false)
const chatWsRef = ref<WebSocket | null>(null)
const chatWsConnected = ref(false)
const userWsRef = ref<WebSocket | null>(null)
const userWsConnected = ref(false)
const sseAbortRef = ref<AbortController | null>(null)
const streamingMessageId = ref<string | null>(null)
const streamingBuffer = ref('')
// 保存最近一次发送后返回的任务/会话信息
const lastTaskIdRef = ref<string | null>(null)
const lastConversationIdRef = ref<string | null>(null)

// Toast 通知 (Replaced with ElNotification)
const addNotice = (title: string, message: string, type: 'info' | 'error' = 'info') => {
  ElNotification({
    title,
    message,
    type,
    duration: 3000
  })
}

// 通用 WebSocket 基础部分（支持 VITE_API_URL_SA 的 host/path 推导）
const computeWsBase = () => {
  const envUrl = (import.meta as any).env?.VITE_API_URL_SA as string | undefined
  let wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  let host = location.host
  let basePath = ''
  if (envUrl) {
    try {
      const u = new URL(envUrl)
      wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:'
      host = u.host
      basePath = u.pathname.endsWith('/api') ? u.pathname.slice(0, -4) : u.pathname
      basePath = basePath.replace(/\/$/, '')
    } catch {/* ignore */}
  }
  const prefix = basePath ? `${basePath}` : ''
  return { wsProto, host, prefix }
}
// 三类 WebSocket 地址
const computeTasksWsUrl = (conversationId: string) => {
  const { wsProto, host, prefix } = computeWsBase(); return `${wsProto}//${host}${prefix}/nexus/ws/tasks/${conversationId}/`
}
const computeChatWsUrl = (conversationId: string) => {
  const { wsProto, host, prefix } = computeWsBase(); return `${wsProto}//${host}${prefix}/nexus/ws/chat/${conversationId}/`
}
const computeUserWsUrl = (userId: string | number) => {
  const { wsProto, host, prefix } = computeWsBase(); return `${wsProto}//${host}${prefix}/nexus/ws/user/${userId}/`
}

// 计算 SSE 地址（流式输出） /nexus/ws/chat/{conversationId}?job_id={taskId}
const computeSseUrl = (conversationId: string, taskId?: string | null) => {
  const envUrl = (import.meta as any).env?.VITE_API_URL_SA as string | undefined
  let baseOrigin = ''
  let basePath = ''
  if (envUrl) {
    try {
      const u = new URL(envUrl)
      baseOrigin = u.origin
      basePath = u.pathname.endsWith('/api') ? u.pathname.slice(0, -4) : u.pathname
      basePath = basePath.replace(/\/$/, '')
    } catch {
      /* ignore */
    }
  }
  if (!baseOrigin) {
    baseOrigin = location.origin
  }
  const prefix = basePath ? `${basePath}` : ''
  const params: string[] = []
  if (taskId) params.push(`job_id=${encodeURIComponent(taskId)}`)
  const query = params.length ? `?${params.join('&')}` : ''
  return `${baseOrigin}${prefix}/nexus/ws/chat/${conversationId}${query}`
}

const closeTasksWs = () => { try { tasksWsRef.value?.close() } catch {}; tasksWsRef.value = null; tasksWsConnected.value = false }
const closeChatWs = () => { try { chatWsRef.value?.close() } catch {}; chatWsRef.value = null; chatWsConnected.value = false }
const closeUserWs = () => { try { userWsRef.value?.close() } catch {}; userWsRef.value = null; userWsConnected.value = false }

const closeSse = () => {
  try { sseAbortRef.value?.abort() } catch {}
  sseAbortRef.value = null
}

// 打开任务状态 WebSocket
const openTasksWs = (conversationId: string) => {
  closeTasksWs()
  if (!conversationId) return
  const url = computeTasksWsUrl(conversationId)
  const ws = new WebSocket(url)
  tasksWsRef.value = ws
  ws.onopen = () => { tasksWsConnected.value = true; try { ws.send(JSON.stringify({ type: 'ping' })) } catch {} }
  ws.onmessage = (ev: MessageEvent) => {
    let msg: any; try { msg = JSON.parse(ev.data) } catch { return }
    if (msg.event === 'task_status') {
      const status = msg.status
      const taskId = msg.task_id || lastTaskIdRef.value || '未知任务'
      const taskType = msg.task_type || 'task'
      const progress = typeof msg.progress === 'number' ? `（${msg.progress}%）` : ''
      addNotice('任务状态更新', `${taskType} ${taskId}：${status}${progress}`, status === 'failed' ? 'error' : 'info')
      if (!lastTaskIdRef.value && msg.task_id) lastTaskIdRef.value = msg.task_id
      return
    }
    if (msg.type === 'task_update' || msg.type === 'job_update') {
      const status = msg.data?.status || msg.status
      const taskId = msg.data?.task_id || msg.task_id || lastTaskIdRef.value || '未知任务'
      addNotice('任务状态更新', `任务 ${taskId}：${status}`)
      try { if (msg.data?.job) jobStore.addJob?.(msg.data.job) } catch {}
    }
  }
  ws.onclose = () => { tasksWsConnected.value = false }
  ws.onerror = () => { tasksWsConnected.value = false }
}

// 打开聊天 WebSocket：接收后端推送的聊天消息（若后端开启）
const openChatWs = (conversationId: string) => {
  closeChatWs()
  if (!conversationId) return
  const url = computeChatWsUrl(conversationId)
  const ws = new WebSocket(url)
  chatWsRef.value = ws
  ws.onopen = () => { chatWsConnected.value = true }
  ws.onmessage = (ev: MessageEvent) => {
    let msg: any; try { msg = JSON.parse(ev.data) } catch { return }
    // 期待结构 { event: 'chat_message', message: {...} }
    if (msg.event === 'chat_message' && msg.message) {
      const m = msg.message
      if (!conversationStore.currentMessages.find(x => x.id === m.id)) {
        conversationStore.addMessage(m)
        nextTick().then(() => messagesEnd.value?.scrollIntoView({ behavior: 'smooth' }))
      }
      return
    }
    // 兼容直接消息结构 { id, role, content }
    if (msg.id && msg.content && msg.role) {
      if (!conversationStore.currentMessages.find(x => x.id === msg.id)) {
        conversationStore.addMessage({
          id: msg.id,
          conversation_id: conversationStore.currentConversationId,
          role: msg.role,
          content: msg.content,
          type: msg.type || 'answer',
          created_at: msg.created_at || new Date().toISOString()
        })
        nextTick().then(() => messagesEnd.value?.scrollIntoView({ behavior: 'smooth' }))
      }
    }
  }
  ws.onclose = () => { chatWsConnected.value = false }
  ws.onerror = () => { chatWsConnected.value = false }
}

// 打开用户级任务 WebSocket：监听该用户下全部任务广播
const DEFAULT_USER_ID = '2'
// Enhance WebSocket error handling for user-wide tasks
const openUserWs = (userId: string | number = DEFAULT_USER_ID, retryCount = 0, maxRetries = 5) => {
  // 如果 WebSocket 已存在且未关闭，则直接返回
  if (userWsRef.value && userWsRef.value.readyState !== WebSocket.CLOSED) {
    console.warn('WebSocket is already open or connecting.')
    return
  }

  closeUserWs() // 确保之前的连接已关闭

  const url = computeUserWsUrl(userId)
  const ws = new WebSocket(url)
  userWsRef.value = ws

  let pingInterval: number | undefined

  ws.onopen = () => {
    userWsConnected.value = true
    console.log(`WebSocket connected: ${url}`)

    // 延迟 5 秒后开始发送定期 ping 消息
    setTimeout(() => {
      pingInterval = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          const pingMessage = JSON.stringify({ type: 'ping' })
          console.log(`Sending ping: ${pingMessage}`)
          ws.send(pingMessage)
        }
      }, 30000)
    }, 5000)
  }

  ws.onmessage = (ev: MessageEvent) => {
    let msg: any
    try {
      msg = JSON.parse(ev.data)
      console.log('Received message:', msg)
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error, ev.data)
      return
    }

    if (msg.event === 'task_status') {
      const status = msg.status
      const taskId = msg.task_id || '未知任务'
      const taskType = msg.task_type || 'task'
      const progress = typeof msg.progress === 'number' ? `（${msg.progress}%）` : ''
      addNotice('用户任务更新', `${taskType} ${taskId}：${status}${progress}`, status === 'failed' ? 'error' : 'info')
    }
  }

  ws.onclose = (event) => {
    userWsConnected.value = false
    console.warn(`WebSocket closed: ${url}`, event)

    // 记录关闭原因
    console.warn(`Close code: ${event.code}, reason: ${event.reason}`)

    // Clear the ping interval
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = undefined
    }

    // 如果不是手动关闭且未超过最大重试次数，则尝试重连
    if (!event.wasClean && retryCount < maxRetries) {
      const nextRetry = retryCount + 1
      const retryDelay = 5000 * nextRetry // 指数级延迟
      console.log(`Reconnecting WebSocket in ${retryDelay / 1000}s (attempt ${nextRetry}/${maxRetries}): ${url}`)
      setTimeout(() => {
        openUserWs(userId, nextRetry, maxRetries)
      }, retryDelay)
    } else if (retryCount >= maxRetries) {
      console.error(`Max retries reached. Unable to reconnect WebSocket: ${url}`)
    }
  }

  ws.onerror = (event) => {
    userWsConnected.value = false
    console.error(`WebSocket error: ${url}`, event)
  }
}

// 打开 SSE 以接收流式 token（使用 fetch + ReadableStream，以便通过 Header 携带 token）
const openSseStream = async (conversationId: string, taskId?: string | null) => {
  closeSse()
  if (!conversationId) return
  const url = computeSseUrl(conversationId, taskId)
  const token = localStorage.getItem('token')
  const controller = new AbortController()
  sseAbortRef.value = controller

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      signal: controller.signal
    })
    if (!resp.ok || !resp.body) {
      closeSse()
      return
    }
    const reader = resp.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read()
      if (done) {
        closeSse()
        return
      }
      buffer += decoder.decode(value, { stream: true })

      let sepIndex: number
      while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex)
        buffer = buffer.slice(sepIndex + 2)
        const lines = rawEvent.split(/\r?\n/)
        const dataLines: string[] = []
        for (const line of lines) {
          if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart())
          }
        }
        const dataStr = dataLines.join('\n')
        if (dataStr) {
          let payload: any
          try { payload = JSON.parse(dataStr) } catch { payload = { type: 'token', token: dataStr } }
          if (payload.type === 'token') {
            const piece = payload.token || ''
            if (!streamingMessageId.value) {
              const newId = `stream-${Date.now()}`
              streamingMessageId.value = newId
              streamingBuffer.value = ''
              conversationStore.addMessage({
                id: newId,
                conversation_id: conversationStore.currentConversationId,
                role: 'assistant',
                content: '',
                type: 'thinking',
                created_at: new Date().toISOString()
              })
            }
            streamingBuffer.value += piece
            const target = conversationStore.currentMessages.find(m => m.id === streamingMessageId.value)
            if (target) target.content = streamingBuffer.value
            await nextTick()
            messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
          }
          if (payload.type === 'completed' || payload.type === 'done' || payload.type === 'llm_end') {
            if (streamingMessageId.value) {
              const target = conversationStore.currentMessages.find(m => m.id === streamingMessageId.value)
              if (target) (target as any).type = 'answer'
            }
            streamingMessageId.value = null
          }
        }
      }
      await pump()
    }
    pump()
  } catch (e) {
    closeSse()
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const message = inputMessage.value
  // 1) 立即添加用户消息并滚动到底部（乐观 UI）
  const userMsgId = 'msg-' + Date.now()
  conversationStore.addMessage({
    id: userMsgId,
    conversation_id: conversationStore.currentConversationId,
    role: 'user',
    content: message,
    type: 'query',
    created_at: new Date().toISOString()
  })
  await nextTick()
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
  // 1.5) 创建 AI 占位消息（所有版本通用）
  const assistantId = `stream-${Date.now()}`
  currentStreamMessage.value = {
    id: assistantId,
    conversation_id: conversationStore.currentConversationId,
    role: 'assistant',
    content: '',
    type: 'thinking',
    created_at: new Date().toISOString()
  }
  conversationStore.addMessage(currentStreamMessage.value)
  await nextTick()
  messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })

  // 2) 立即开始监听会话相关 WS（任务 + 聊天）
  const convId = conversationStore.currentConversationId
  if (convId) {
    lastConversationIdRef.value = convId
    if (!tasksWsConnected.value) openTasksWs(convId)
    if (!chatWsConnected.value) openChatWs(convId)
  }

  // 3) 清空输入，开始调用接口
  inputMessage.value = ''
  loading.value = true

  try {
    // Build request URL using configured SA API base if present
    let baseOrigin = ''
    let basePath = ''
    const envUrl = (import.meta as any).env?.VITE_API_URL_SA as string | undefined
    if (envUrl) {
      try {
        const u = new URL(envUrl)
        baseOrigin = u.origin
        basePath = u.pathname.endsWith('/api') ? u.pathname.slice(0, -4) : u.pathname
        basePath = basePath.replace(/\/$/, '')
      } catch {}
    }
    if (!baseOrigin) baseOrigin = location.origin
    const prefix = basePath ? `${basePath}` : ''

    // mark streaming flag
    if (currentStreamMessage.value) currentStreamMessage.value.isStreaming = true

    // v1: keep original axios-based (non-stream) call using `api`
    if (apiVersion.value === 'v1') {
      try {
        const resp = await api.post('/nexus/chat/ask/', {
          conversation_id: conversationStore.currentConversationId,
          message: message,
          files: []
        })
        const data = resp?.data
        // try several common shapes
        if (data) {
          if (typeof data === 'string') {
            currentStreamMessage.value.content += data
          } else if (data.message) {
            currentStreamMessage.value.content += data.message
          } else if (data.content) {
            currentStreamMessage.value.content += data.content
          } else if (data.choices && Array.isArray(data.choices) && data.choices[0]) {
            const c = data.choices[0]
            currentStreamMessage.value.content += c.text || c.message || JSON.stringify(c)
          } else {
            currentStreamMessage.value.content += JSON.stringify(data)
          }

          if (data.jobs && Array.isArray(data.jobs)) {
            for (const j of data.jobs) { try { jobStore.addJob(j) } catch (e) { console.warn('addJob failed', e) } }
          }
        }
        if (currentStreamMessage.value) currentStreamMessage.value.type = 'answer'
      } catch (e) {
        console.error('v1 请求失败', e)
        addNotice('发送失败', 'v1 接口请求失败', 'error')
        if (currentStreamMessage.value) currentStreamMessage.value.content = `[错误] 请求失败`
      }
    } else {
      // v2/v3: streaming NDJSON endpoints
      const endpoint = apiVersion.value === 'v3' ? '/nexuschat/enhancea-ask/' : '/nexus/chat/ask/'
      const url = `${baseOrigin}${prefix}${endpoint}`

      const token = localStorage.getItem('token')
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          conversation_id: conversationStore.currentConversationId,
          message: message,
          files: []
        })
      })

      if (!resp.ok || !resp.body) {
        const txt = await resp.text().catch(() => '')
        addNotice('发送失败', `接口返回 ${resp.status} ${txt}`, 'error')
        loading.value = false
        return
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      const processLine = (line: string) => {
        if (!line.trim()) return
        let chunk: any = null
        try { chunk = JSON.parse(line) } catch (e) { chunk = { type: 'agent_chunk', content: line } }

        const t = chunk.type
        if (t === 'start') {
          // optional: show route badge
        } else if (t === 'agent_chunk') {
          if (currentStreamMessage.value) {
            const content = chunk.content
            if (typeof content === 'string') {
              currentStreamMessage.value.content += content
            } else if (content && typeof content === 'object') {
              try { currentStreamMessage.value.content += JSON.stringify(content) } catch { currentStreamMessage.value.content += String(content) }
            }
          }
        } else if (t === 'done' || t === 'completed') {
          if (currentStreamMessage.value) currentStreamMessage.value.isStreaming = false
        } else if (t === 'error') {
          addNotice('流式错误', chunk.error || '未知错误', 'error')
          if (currentStreamMessage.value) {
            currentStreamMessage.value.content = `[错误] ${chunk.error || '未知错误'}`
            currentStreamMessage.value.isStreaming = false
          }
        }

        if (chunk.jobs && Array.isArray(chunk.jobs)) {
          for (const j of chunk.jobs) {
            try { jobStore.addJob(j) } catch (e) { console.warn('addJob failed', e) }
          }
        }
      }

      // Read stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          if (buffer.trim()) processLine(buffer)
          break
        }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) processLine(line)
      }

      if (currentStreamMessage.value) currentStreamMessage.value.isStreaming = false
    }

    // scroll
    await nextTick()
    messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
  } catch (error) {
    console.error('发送消息失败:', error)
    addNotice('发送失败', '消息发送失败，请重试', 'error')
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

// 初始化/销毁：根据当前会话连接 WS
onMounted(() => {
  const convId = conversationStore.currentConversationId
  if (convId) {
    lastConversationIdRef.value = convId
    openTasksWs(convId)
    openChatWs(convId)
  }
  // 用户任务监听（默认 userId=2，可后续替换为登录用户ID）
  openUserWs(DEFAULT_USER_ID)
})

onUnmounted(() => {
  closeTasksWs()
  closeChatWs()
  closeUserWs()
  closeSse()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #d1d5db;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>