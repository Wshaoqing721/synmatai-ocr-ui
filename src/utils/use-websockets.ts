import { ref, watch, onUnmounted, unref } from "vue"
import type { ComputedRef, Ref } from "vue"
import { createWebSocketConnection } from "@/api/modules/tester"
import type { WSEvent } from "@/types/tester"

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

interface UseWebSocketOptions {
  runId: MaybeRef<string>
  onEvent?: (event: WSEvent) => void
  enabled?: MaybeRef<boolean>
}

export function useWebSocket(options: UseWebSocketOptions) {
  const { onEvent } = options

  const wsRef = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const lastEvent = ref<WSEvent | null>(null)

  const handleEvent = (event: WSEvent) => {
    lastEvent.value = event
    onEvent?.(event)
  }

  const closeSocket = () => {
    wsRef.value?.close()
    wsRef.value = null
    isConnected.value = false
  }

  const connect = () => {
    const enabled = unref(options.enabled ?? true)
    const runId = unref(options.runId)
    if (!enabled || !runId) return

    closeSocket()

    const ws = createWebSocketConnection(
      runId,
      handleEvent,
      () => (isConnected.value = false),
      () => (isConnected.value = false),
    )

    if (ws) {
      wsRef.value = ws
      isConnected.value = true
    }
  }

  // 监听 runId / enabled 变化（等价于 React useEffect）
  watch(
    () => [unref(options.runId), unref(options.enabled ?? true)] as const,
    ([newRunId, isEnabled]) => {
      if (!isEnabled || !newRunId) {
        closeSocket()
        return
      }
      connect()
    },
    { immediate: true },
  )

  // 组件卸载时自动关闭
  onUnmounted(() => {
    closeSocket()
  })

  return {
    isConnected,
    lastEvent,
  }
}
