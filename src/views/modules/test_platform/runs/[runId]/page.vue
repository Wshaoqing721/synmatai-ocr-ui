<template>
  <div class="min-h-screen bg-background">
    <AppHeader />

    <main v-if="loading || !run || !scenario" class="container py-20 flex items-center justify-center">
      <el-icon class="is-loading text-muted-foreground" size="32">
        <Loading />
      </el-icon>
    </main>

    <main v-else class="container py-8">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <router-link to="/test-platform">
          <el-button text circle>
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
        </router-link>

        <div class="flex-1">
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold">{{ run.name }}</h1>
            <RunStatusBadge :status="run.status" />
            <span
              v-if="isConnected"
              class="flex items-center gap-1 text-sm text-emerald-600"
            >
              <el-icon class="animate-pulse"><Connection /></el-icon>
              实时连接中
            </span>
          </div>
          <p class="text-muted-foreground">{{ scenario.name }}</p>
        </div>

        <router-link :to="`/test-platform/runs/${runId}/result`">
          <el-button plain>查看结果报告</el-button>
        </router-link>
      </div>

      <!-- Stats -->
      <el-row :gutter="16" class="mb-6">
        <el-col :md="6" v-for="card in statCards" :key="card.label">
          <el-card>
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full flex items-center justify-center" :class="card.bg">
                <el-icon :class="card.color">
                  <component :is="card.icon" />
                </el-icon>
              </div>
              <div>
                <p class="text-sm text-muted-foreground">{{ card.label }}</p>
                <p class="text-2xl font-bold">{{ card.value }}</p>
              </div>
            </div>
            <el-progress
              v-if="card.progress !== undefined"
              :percentage="card.progress"
              :stroke-width="6"
              class="mt-3"
            />
          </el-card>
        </el-col>
      </el-row>

      <!-- Main -->
      <el-row :gutter="24">
        <el-col :lg="16">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="流程视图" name="flow">
              <el-card>
                <template #header>场景流程</template>
                <ScenarioFlow
                  :nodes="scenario.nodes"
                  :nodeStates="users[0]?.nodeStates"
                  @node-click="handleNodeClick"
                />
              </el-card>
            </el-tab-pane>

            <el-tab-pane label="泳道视图" name="swimlane">
              <el-card>
                <template #header>用户执行泳道</template>
                <UserSwimlane
                  :users="users.slice(0, 20)"
                  :nodes="scenario.nodes"
                  :runId="runId"
                />
              </el-card>
            </el-tab-pane>
          </el-tabs>
        </el-col>

        <el-col :lg="8">
          <NodeDetailPanel
            :nodeState="selectedNodeState"
            :nodeName="selectedNodeName"
          />
        </el-col>
      </el-row>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute } from "vue-router"

import AppHeader from "../../components/layout/app-header.vue"
import ScenarioFlow from "../../components/flow/scenario-flow.vue"
import UserSwimlane from "../../components/flow/user-swimlane.vue"
import NodeDetailPanel from "../../components/detail/node-detail-panel.vue"
import RunStatusBadge from "../../components/runs/run-status-badge.vue"

import { useWebSocket } from "@/utils/use-websockets"

import {
  getTestRun,
  getScenario,
  getUserExecutions,
} from "@/api/modules/tester"

import type {
  TestRun,
  Scenario,
  UserExecution,
  WSEvent,
  RunProgressData,
} from "@/types/tester"

import {
  ArrowLeft,
  User,
  TrendCharts,
  Share,
  Connection,
  Loading,
} from "@element-plus/icons-vue"

const route = useRoute()
const runId = route.params.runId as string

const run = ref<TestRun | null>(null)
const scenario = ref<Scenario | null>(null)
const users = ref<UserExecution[]>([])
const loading = ref(true)

const selectedNodeId = ref<string | null>(null)
const selectedUserId = ref<string | null>(null)
const activeTab = ref("flow")

const handleWSEvent = (event: WSEvent) => {
  if (event.type === "run_progress" && run.value) {
    const data = event.data as RunProgressData
    run.value.progress = data.progress
    run.value.currentUsers = data.currentUsers
  }
}

const { isConnected } = useWebSocket({
  runId,
  enabled: computed(() => run.value?.status === "running"),
  onEvent: handleWSEvent,
})

onMounted(async () => {
  try {
    const runData = await getTestRun(runId)
    run.value = runData

    const [scenarioData, usersData] = await Promise.all([
      getScenario(runData.scenarioId),
      getUserExecutions(runId),
    ])

    scenario.value = scenarioData
    users.value = usersData
  } finally {
    loading.value = false
  }
})

const selectedNodeState = computed(() => {
  if (!selectedUserId.value || !selectedNodeId.value) return null
  return (
    users.value.find(u => u.userId === selectedUserId.value)
      ?.nodeStates[selectedNodeId.value] || null
  )
})

const selectedNodeName = computed(() =>
  scenario.value?.nodes.find(n => n.id === selectedNodeId.value)?.name
)

function handleNodeClick(nodeId: string) {
  selectedNodeId.value = nodeId
  if (!selectedUserId.value && users.value.length) {
    selectedUserId.value = users.value[0].userId
  }
}

const statCards = computed(() => [
  {
    label: "进度",
    value: `${run.value?.progress ?? 0}%`,
    progress: run.value?.progress,
    icon: TrendCharts,
    bg: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    label: "并发用户",
    value: `${run.value?.currentUsers} / ${run.value?.totalUsers}`,
    icon: User,
    bg: "bg-emerald-100",
    color: "text-emerald-600",
  },
  {
    label: "节点数",
    value: scenario.value?.nodes.length ?? 0,
    icon: Share,
    bg: "bg-purple-100",
    color: "text-purple-600",
  },
  {
    label: "状态",
    value: run.value?.status,
    icon: TrendCharts,
    bg: "bg-amber-100",
    color: "text-amber-600",
  },
])
</script>
