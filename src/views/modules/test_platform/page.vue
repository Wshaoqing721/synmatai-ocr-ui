<script setup lang="ts">
import { ref, onMounted } from "vue"
import { ElMessage } from "element-plus"

import AppHeader from "./components/layout/app-header.vue"
import RunCard from "./components/runs/run-card.vue"
import CreateRunDialog from "./components/runs/create-run-dialog.vue"

import {
  getTestRuns,
  getScenarios,
  createTestRun,
  startTestRun,
  stopTestRun,
} from "@/api/modules/tester"

import type { TestRun, Scenario } from "@/types/tester"
import { Loading } from "@element-plus/icons-vue"

const runs = ref<TestRun[]>([])
const scenarios = ref<Scenario[]>([])
const loading = ref(true)

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const [runsData, scenariosData] = await Promise.all([
      getTestRuns(),
      getScenarios(),
    ])
    runs.value = runsData
    scenarios.value = scenariosData
  } catch {
    ElMessage.error("无法加载测试数据")
  } finally {
    loading.value = false
  }
}

async function handleCreateRun(data: {
  scenarioId: string
  name: string
  userCount: number
}) {
  const newRun = await createTestRun(data.scenarioId, {
    name: data.name,
    userCount: data.userCount,
  })

  runs.value = [newRun, ...runs.value]
  await startTestRun(newRun.id)

  runs.value = runs.value.map((r) =>
    r.id === newRun.id ? { ...r, status: "running" } : r,
  )

  ElMessage.success(`${data.name} 已开始运行`)
}

async function handleStart(runId: string) {
  await startTestRun(runId)
  runs.value = runs.value.map((r) =>
    r.id === runId ? { ...r, status: "running" } : r,
  )
  ElMessage.success("测试已启动")
}

async function handleStop(runId: string) {
  await stopTestRun(runId)
  runs.value = runs.value.map((r) =>
    r.id === runId
      ? { ...r, status: "failed", endTime: new Date().toISOString() }
      : r,
  )
  ElMessage.warning("测试已停止")
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppHeader />

    <main class="container py-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold">测试运行列表</h1>
          <p class="text-muted-foreground mt-1">
            管理和监控所有自动化测试运行
          </p>
        </div>
        <CreateRunDialog :scenarios="scenarios" :on-submit="handleCreateRun" />
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <el-icon class="is-loading text-muted-foreground" size="32">
          <Loading />
        </el-icon>
      </div>

      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RunCard
          v-for="run in runs"
          :key="run.id"
          :run="run"
          @start="handleStart"
          @stop="handleStop"
        />
      </div>
    </main>
  </div>
</template>
