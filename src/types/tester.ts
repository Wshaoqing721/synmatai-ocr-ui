// ========================
// 核心类型定义
// ========================

// 测试运行状态
export type RunStatus = "pending" | "running" | "done" | "failed"

// 节点状态
export type NodeStatus = "pending" | "running" | "success" | "failed" | "skipped"

// 测试运行
export interface TestRun {
  id: string
  name: string
  scenarioId: string
  scenarioName: string
  status: RunStatus
  progress: number // 0-100
  totalUsers: number
  currentUsers: number
  startTime: string
  endTime?: string
  createdAt: string
}

// 场景节点
export interface ScenarioNode {
  id: string
  name: string
  type: "start" | "action" | "assertion" | "condition" | "end"
  description?: string
  dependencies: string[] // 依赖的节点 ID
}

// 场景定义
export interface Scenario {
  id: string
  name: string
  description: string
  nodes: ScenarioNode[]
}

// 用户执行状态
export interface UserExecution {
  userId: string
  userName: string
  status: NodeStatus
  currentNodeId?: string
  nodeStates: Record<string, NodeExecutionState>
  startTime: string
  endTime?: string
}

// 节点执行状态
export interface NodeExecutionState {
  nodeId: string
  status: NodeStatus
  startTime?: string
  endTime?: string
  duration?: number // 毫秒
  error?: string
  request?: RequestDetail
  response?: ResponseDetail
}

// 请求详情
export interface RequestDetail {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
}

// 响应详情
export interface ResponseDetail {
  status: number
  statusText: string
  headers: Record<string, string>
  body?: string
  duration: number
}

// 测试结果摘要
export interface TestSummary {
  runId: string
  totalUsers: number
  successUsers: number
  failedUsers: number
  successRate: number
  avgResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  failedNodes: FailedNodeStat[]
  nodeStats: NodeStat[]
}

// 失败节点统计
export interface FailedNodeStat {
  nodeId: string
  nodeName: string
  failCount: number
  errors: string[]
}

// 节点统计
export interface NodeStat {
  nodeId: string
  nodeName: string
  totalExecutions: number
  successCount: number
  failCount: number
  avgDuration: number
}

// ========================
// WebSocket 事件类型
// ========================

export type WSEventType =
  | "run_started"
  | "run_progress"
  | "run_completed"
  | "run_failed"
  | "user_started"
  | "user_completed"
  | "node_started"
  | "node_completed"
  | "node_failed"

export interface WSEvent {
  type: WSEventType
  runId: string
  timestamp: string
  data: WSEventData
}

export type WSEventData =
  | RunStartedData
  | RunProgressData
  | RunCompletedData
  | UserStartedData
  | UserCompletedData
  | NodeStartedData
  | NodeCompletedData
  | NodeFailedData

export interface RunStartedData {
  scenarioId: string
  scenarioName: string
  totalUsers: number
}

export interface RunProgressData {
  progress: number
  currentUsers: number
}

export interface RunCompletedData {
  summary: TestSummary
}

export interface UserStartedData {
  userId: string
  userName: string
}

export interface UserCompletedData {
  userId: string
  status: "success" | "failed"
  duration: number
}

export interface NodeStartedData {
  userId: string
  nodeId: string
  nodeName: string
}

export interface NodeCompletedData {
  userId: string
  nodeId: string
  nodeName: string
  duration: number
  request?: RequestDetail
  response?: ResponseDetail
}

export interface NodeFailedData {
  userId: string
  nodeId: string
  nodeName: string
  error: string
  request?: RequestDetail
  response?: ResponseDetail
}
