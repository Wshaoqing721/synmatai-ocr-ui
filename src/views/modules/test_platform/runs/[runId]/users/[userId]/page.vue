<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

import AppHeader from "../../../../components/layout/app-header.vue"
import ScenarioFlow from "../../../../components/flow/scenario-flow.vue"
import NodeDetailPanel from "../../../../components/detail/node-detail-panel.vue"
import RunStatusBadge from "../../../../components/runs/run-status-badge.vue"

import {
  getUserExecution,
  getScenario,
  getTestRun,
} from "@/api/modules/tester"

import type {
  UserExecution,
  Scenario,
  TestRun,
} from "@/types/tester"

import {
  ArrowLeft,
  User,
  Clock,
  Check,
  Close,
  Loading,
} from "@element-plus/icons-vue"

/* ---------------- route ---------------- */

const route = useRoute()
const router = useRouter()

const runId = route.params.runId as string
const userId = route.params.userId as string

/* ---------------- state ---------------- */

const run = ref<TestRun | null>(null)
const user = ref<UserExecution | null>(null)
const scenario = ref<Scenario | null>(null)
const loading = ref(true)

const selectedNodeId = ref<string | null>(null)

/* ---------------- data loading ---------------- */

async function loadData() {
  loading.value = true
  try {
    const runData = await getTestRun(runId)
    run.value = runData

    const [userData, scenarioData] = await Promise.all([
      getUserExecution(runId, userId),
      getScenario(runData.scenarioId),
    ])

    user.value = userData
    scenario.value = scenarioData
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

watch(
  () => [route.params.runId, route.params.userId],
  () => loadData(),
)

/* ---------------- computed ---------------- */

const selectedNodeState = computed(() => {
  if (!selectedNodeId.value || !user.value) return null
  return user.value.nodeStates[selectedNodeId.value] || null
})

const selectedNodeName = computed(() => {
  if (!selectedNodeId.value || !scenario.value) return undefined
  return scenario.value.nodes.find(
    (n) => n.id === selectedNodeId.value,
  )?.name
})

const stats = computed(() => {
  if (!user.value) return null

  const states = Object.values(user.value.nodeStates)

  const total = states.length
  const success = states.filter(
    (s) => s.status === "success",
  ).length
  const failed = states.filter(
    (s) => s.status === "failed",
  ).length
  const totalDuration = states.reduce(
    (sum, s) => sum + (s.duration || 0),
    0,
  )

  return {
    total,
    success,
    failed,
    totalDuration,
    avgDuration:
      total > 0
        ? Math.round(totalDuration / total)
        : 0,
  }
})
</script>

<template>
  <!-- Loading -->
  <div
    v-if="loading"
    class="min-h-screen bg-background"
  >
    <AppHeader />
    <div class="flex items-center justify-center py-20">
      <el-icon
        class="is-loading text-muted-foreground"
        size="32"
      >
        <Loading />
      </el-icon>
    </div>
  </div>

  <!-- Not Found -->
  <div
    v-else-if="!run || !user || !scenario"
    class="min-h-screen bg-background"
  >
    <AppHeader />
    <div class="container py-8">
      <p>用户执行记录不存在</p>
    </div>
  </div>

  <!-- Content -->
  <div
    v-else
    class="min-h-screen bg-background"
  >
    <AppHeader />

    <main class="container py-8">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <el-button
          text
          circle
          @click="router.push(`/test-platform/runs/${runId}`)"
        >
          <ArrowLeft />
        </el-button>

        <div class="flex items-center gap-3">
          <div
            class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <User class="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 class="text-2xl font-bold">
              {{ user.userName }}
            </h1>
            <p class="text-muted-foreground">
              {{ run.name }}
            </p>
          </div>
        </div>

        <RunStatusBadge
          :status="user.status"
          size="lg"
        />
      </div>

      <!-- Stats -->
      <div
        v-if="stats"
        class="grid gap-4 md:grid-cols-4 mb-6"
      >
        <el-card>
          <div class="pt-6 flex items-center gap-3">
            <div
              class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"
            >
              <Clock class="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">
                总耗时
              </p>
              <p class="text-xl font-bold">
                {{ stats.totalDuration }}ms
              </p>
            </div>
          </div>
        </el-card>

        <el-card>
          <div class="pt-6 flex items-center gap-3">
            <div
              class="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center"
            >
              <Check class="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">
                成功节点
              </p>
              <p class="text-xl font-bold">
                {{ stats.success }} / {{ stats.total }}
              </p>
            </div>
          </div>
        </el-card>

        <el-card>
          <div class="pt-6 flex items-center gap-3">
            <div
              class="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center"
            >
              <Close class="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">
                失败节点
              </p>
              <p class="text-xl font-bold">
                {{ stats.failed }}
              </p>
            </div>
          </div>
        </el-card>

        <el-card>
          <div class="pt-6 flex items-center gap-3">
            <div
              class="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center"
            >
              <Clock class="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p class="text-sm text-muted-foreground">
                平均耗时
              </p>
              <p class="text-xl font-bold">
                {{ stats.avgDuration }}ms
              </p>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Flow & Detail -->
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <el-card>
            <template #header>
              <span class="font-bold">执行轨迹</span>
            </template>

            <div>
              <ScenarioFlow
                :nodes="scenario.nodes"
                :node-states="Object.fromEntries(
                  Object.entries(user.nodeStates).map(
                    ([id, state]) => [
                      id,
                      {
                        status: state.status,
                        duration: state.duration,
                      },
                    ],
                  ),
                )"
                @node-click="selectedNodeId = $event"
              />
            </div>
          </el-card>
        </div>

        <div class="lg:col-span-1">
          <NodeDetailPanel
            :node-state="selectedNodeState"
            :node-name="selectedNodeName"
          />
        </div>
      </div>
    </main>
  </div>
</template>
