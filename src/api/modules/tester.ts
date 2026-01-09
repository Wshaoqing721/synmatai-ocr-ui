import type { TestRun, Scenario, ScenarioNode, UserExecution, NodeExecutionState, TestSummary, WSEvent } from '@/types/tester'
// ========================
// Mock 测试运行数据
// ========================

// ========================
// API 基础配置
// ========================

const RAW_API_BASE_URL = import.meta.env.VITE_TESTER_API_URL || "/api"
const API_BASE_URL = String(RAW_API_BASE_URL).replace(/\/$/, "")

// ========================
// Mock 开关（生产环境设为 false）
// ========================

const USE_MOCK = false
export const mockTestRuns: TestRun[] = [
  {
    id: "run-001",
    name: "登录流程压力测试",
    scenarioId: "scenario-001",
    scenarioName: "用户登录场景",
    status: "running",
    progress: 65,
    totalUsers: 100,
    currentUsers: 65,
    startTime: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: "run-002",
    name: "订单创建测试",
    scenarioId: "scenario-002",
    scenarioName: "订单创建流程",
    status: "done",
    progress: 100,
    totalUsers: 50,
    currentUsers: 0,
    startTime: new Date(Date.now() - 7200000).toISOString(),
    endTime: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 7800000).toISOString(),
  },
  {
    id: "run-003",
    name: "支付流程测试",
    scenarioId: "scenario-003",
    scenarioName: "支付场景",
    status: "failed",
    progress: 45,
    totalUsers: 30,
    currentUsers: 0,
    startTime: new Date(Date.now() - 1800000).toISOString(),
    endTime: new Date(Date.now() - 1200000).toISOString(),
    createdAt: new Date(Date.now() - 2400000).toISOString(),
  },
  {
    id: "run-004",
    name: "商品搜索测试",
    scenarioId: "scenario-004",
    scenarioName: "搜索场景",
    status: "pending",
    progress: 0,
    totalUsers: 200,
    currentUsers: 0,
    startTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
]

// ======================== 
// Mock 场景数据
// ========================

export const mockScenarioNodes: ScenarioNode[] = [
  { id: "node-1", name: "开始", type: "start", dependencies: [] },
  { id: "node-2", name: "发送登录请求", type: "action", description: "POST /api/auth/login", dependencies: ["node-1"] },
  {
    id: "node-3",
    name: "验证 Token",
    type: "assertion",
    description: "检查返回的 token 是否有效",
    dependencies: ["node-2"],
  },
  {
    id: "node-4",
    name: "获取用户信息",
    type: "action",
    description: "GET /api/user/profile",
    dependencies: ["node-3"],
  },
  { id: "node-5", name: "检查权限", type: "condition", description: "判断用户权限级别", dependencies: ["node-4"] },
  {
    id: "node-6",
    name: "访问受保护资源",
    type: "action",
    description: "GET /api/protected/data",
    dependencies: ["node-5"],
  },
  {
    id: "node-7",
    name: "验证数据完整性",
    type: "assertion",
    description: "校验返回数据格式",
    dependencies: ["node-6"],
  },
  { id: "node-8", name: "结束", type: "end", dependencies: ["node-7"] },
]

export const mockScenario: Scenario = {
  id: "scenario-001",
  name: "用户登录场景",
  description: "测试完整的用户登录流程，包括认证、授权和数据访问",
  nodes: mockScenarioNodes,
}

// ========================
// Mock 用户执行数据
// ========================

export function generateMockUserExecutions(count: number): UserExecution[] {
  const statuses: Array<"pending" | "running" | "success" | "failed"> = ["pending", "running", "success", "failed"]

  return Array.from({ length: count }, (_, i) => {
    const userStatus = statuses[Math.floor(Math.random() * 4)]
    const nodeStates: Record<string, NodeExecutionState> = {}

    mockScenarioNodes.forEach((node, nodeIndex) => {
      let nodeStatus: NodeExecutionState["status"] = "pending"
      let duration: number | undefined

      if (userStatus === "success") {
        nodeStatus = "success"
        duration = Math.floor(Math.random() * 500) + 100
      } else if (userStatus === "failed") {
        if (nodeIndex < 4) {
          nodeStatus = "success"
          duration = Math.floor(Math.random() * 500) + 100
        } else if (nodeIndex === 4) {
          nodeStatus = "failed"
          duration = Math.floor(Math.random() * 1000) + 500
        }
      } else if (userStatus === "running") {
        if (nodeIndex < 3) {
          nodeStatus = "success"
          duration = Math.floor(Math.random() * 500) + 100
        } else if (nodeIndex === 3) {
          nodeStatus = "running"
        }
      }

      nodeStates[node.id] = {
        nodeId: node.id,
        status: nodeStatus,
        duration,
        startTime: nodeStatus !== "pending" ? new Date(Date.now() - Math.random() * 60000).toISOString() : undefined,
        endTime: nodeStatus === "success" || nodeStatus === "failed" ? new Date().toISOString() : undefined,
        error: nodeStatus === "failed" ? "连接超时: ETIMEDOUT" : undefined,
        request:
          nodeStatus !== "pending"
            ? {
                method: "POST",
                url: "/api/auth/login",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: `user${i + 1}`, password: "***" }),
              }
            : undefined,
        response:
          nodeStatus === "success"
            ? {
                status: 200,
                statusText: "OK",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: "eyJ..." }),
                duration: duration || 0,
              }
            : undefined,
      }
    })

    return {
      userId: `user-${String(i + 1).padStart(3, "0")}`,
      userName: `虚拟用户 ${i + 1}`,
      status: userStatus,
      currentNodeId: userStatus === "running" ? "node-4" : undefined,
      nodeStates,
      startTime: new Date(Date.now() - Math.random() * 300000).toISOString(),
      endTime: userStatus === "success" || userStatus === "failed" ? new Date().toISOString() : undefined,
    }
  })
}

// ========================
// Mock 测试结果摘要
// ========================

export const mockTestSummary: TestSummary = {
  runId: "run-002",
  totalUsers: 50,
  successUsers: 45,
  failedUsers: 5,
  successRate: 90,
  avgResponseTime: 245,
  minResponseTime: 89,
  maxResponseTime: 1523,
  p50ResponseTime: 198,
  p95ResponseTime: 567,
  p99ResponseTime: 1234,
  failedNodes: [
    {
      nodeId: "node-5",
      nodeName: "检查权限",
      failCount: 3,
      errors: ["Permission denied", "Token expired"],
    },
    {
      nodeId: "node-6",
      nodeName: "访问受保护资源",
      failCount: 2,
      errors: ["Connection timeout"],
    },
  ],
  nodeStats: mockScenarioNodes.map((node) => ({
    nodeId: node.id,
    nodeName: node.name,
    totalExecutions: 50,
    successCount: node.type === "condition" ? 45 : 48,
    failCount: node.type === "condition" ? 5 : 2,
    avgDuration: Math.floor(Math.random() * 300) + 100,
  })),
}


// ========================
// 通用请求函数
// ========================

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// ========================
// 测试运行 API
// ========================

export async function getTestRuns(): Promise<TestRun[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return mockTestRuns
  }
  return fetchAPI<TestRun[]>("/runs")
}

export async function getTestRun(runId: string): Promise<TestRun> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const run = mockTestRuns.find((r) => r.id === runId)
    if (!run) throw new Error("Run not found")
    return run
  }
  return fetchAPI<TestRun>(`/runs/${runId}`)
}

export async function createTestRun(
  scenarioId: string,
  options: {
    name: string
    userCount: number
  },
): Promise<TestRun> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newRun: TestRun = {
      id: `run-${Date.now()}`,
      name: options.name,
      scenarioId,
      scenarioName: mockScenario.name,
      status: "pending",
      progress: 0,
      totalUsers: options.userCount,
      currentUsers: 0,
      startTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    mockTestRuns.unshift(newRun)
    return newRun
  }
  return fetchAPI<TestRun>("/runs", {
    method: "POST",
    body: JSON.stringify({ scenarioId, ...options }),
  })
}

export async function startTestRun(runId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const run = mockTestRuns.find((r) => r.id === runId)
    if (run) run.status = "running"
    return
  }
  await fetchAPI(`/runs/${runId}/start`, { method: "POST" })
}

export async function stopTestRun(runId: string): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const run = mockTestRuns.find((r) => r.id === runId)
    if (run) {
      run.status = "failed"
      run.endTime = new Date().toISOString()
    }
    return
  }
  await fetchAPI(`/runs/${runId}/stop`, { method: "POST" })
}

// ========================
// 场景 API
// ========================

export async function getScenario(scenarioId: string): Promise<Scenario> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return { ...mockScenario, id: scenarioId }
  }
  return fetchAPI<Scenario>(`/scenarios/${scenarioId}`)
}

export async function getScenarios(): Promise<Scenario[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return [mockScenario]
  }
  return fetchAPI<Scenario[]>("/scenarios")
}

// ========================
// 用户执行 API
// ========================

export async function getUserExecutions(runId: string): Promise<UserExecution[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    const run = mockTestRuns.find((r) => r.id === runId)
    return generateMockUserExecutions(run?.totalUsers || 10)
  }
  return fetchAPI<UserExecution[]>(`/runs/${runId}/users`)
}

export async function getUserExecution(runId: string, userId: string): Promise<UserExecution> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const executions = generateMockUserExecutions(1)
    return { ...executions[0], userId, userName: `用户 ${userId}` }
  }
  return fetchAPI<UserExecution>(`/runs/${runId}/users/${userId}`)
}

// ========================
// 测试结果 API
// ========================

export async function getTestSummary(runId: string): Promise<TestSummary> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return { ...mockTestSummary, runId }
  }
  return fetchAPI<TestSummary>(`/runs/${runId}/summary`)
}

// ========================
// WebSocket 连接
// ========================

export function createWebSocketConnection(
  runId: string,
  onEvent: (event: WSEvent) => void,
  onError?: (error: Event) => void,
  onClose?: () => void,
): WebSocket | null {
  const wsUrl =
    import.meta.env.VITE_WS_URL ||
    import.meta.env.NEXT_PUBLIC_WS_URL ||
    "ws://localhost:8080"

  if (USE_MOCK) {
    // Mock WebSocket - 模拟实时事件
    const mockInterval = setInterval(() => {
      const mockEvent: WSEvent = {
        type: "run_progress",
        runId,
        timestamp: new Date().toISOString(),
        data: {
          progress: Math.min(100, Math.floor(Math.random() * 10) + 60),
          currentUsers: Math.floor(Math.random() * 50) + 50,
        },
      }
      onEvent(mockEvent)
    }, 2000)

    // 返回一个模拟的 WebSocket 对象
    return {
      close: () => clearInterval(mockInterval),
      readyState: WebSocket.OPEN,
    } as unknown as WebSocket
  }

  try {
    const ws = new WebSocket(`${wsUrl}/runs/${runId}/ws`)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSEvent
        onEvent(data)
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      onError?.(error)
    }

    ws.onclose = () => {
      onClose?.()
    }

    return ws
  } catch (error) {
    console.error("Failed to create WebSocket connection:", error)
    return null
  }
}
