<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"

import AppHeader from "../../../components/layout/app-header.vue"
import SummaryCards from "../../../components/results/summary-cards.vue"
import ResponseTimeChart from "../../../components/results/response-time-chart.vue"
import FailedNodesTable from "../../../components/results/failed-nodes-table.vue"

import { getTestRun, getTestSummary } from "@/api/modules/tester"
import type { TestRun, TestSummary } from "@/types/tester"

import {
  ArrowLeft,
  Download,
  Loading,
} from "@element-plus/icons-vue"

/* ---------------- route ---------------- */

const route = useRoute()
const router = useRouter()

const runId = route.params.runId as string

/* ---------------- state ---------------- */

const run = ref<TestRun | null>(null)
const summary = ref<TestSummary | null>(null)
const loading = ref(true)

/* ---------------- lifecycle ---------------- */

async function loadData() {
  loading.value = true
  try {
    const [runData, summaryData] = await Promise.all([
      getTestRun(runId),
      getTestSummary(runId),
    ])
    run.value = runData
    summary.value = summaryData
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

watch(
  () => route.params.runId,
  () => loadData(),
)
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="min-h-screen bg-background">
    <AppHeader />
    <div class="flex items-center justify-center py-20">
      <el-icon class="is-loading text-muted-foreground" size="32">
        <Loading />
      </el-icon>
    </div>
  </div>

  <!-- Not Found -->
  <div
    v-else-if="!run || !summary"
    class="min-h-screen bg-background"
  >
    <AppHeader />
    <div class="container py-8">
      <p>测试结果不存在</p>
    </div>
  </div>

  <!-- Content -->
  <div v-else class="min-h-screen bg-background">
    <AppHeader />

    <main class="container py-8">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <el-button text circle @click="router.push(`/test-platform/runs/${runId}`)">
          <ArrowLeft />
        </el-button>

        <div class="flex-1">
          <h1 class="text-2xl font-bold">
            {{ run.name }} - 测试报告
          </h1>
          <p class="text-muted-foreground">
            运行时间:
            {{ new Date(run.startTime).toLocaleString("zh-CN") }}
            <span v-if="run.endTime">
              -
              {{ new Date(run.endTime).toLocaleString("zh-CN") }}
            </span>
          </p>
        </div>

        <el-button
          type="default"
          plain
          class="gap-2"
        >
          <Download />
          导出报告
        </el-button>
      </div>

      <!-- Summary -->
      <SummaryCards :summary="summary" />

      <!-- Charts -->
      <div class="grid gap-6 mt-6 lg:grid-cols-2">
        <ResponseTimeChart
          :node-stats="summary.nodeStats"
        />
        <FailedNodesTable
          :failed-nodes="summary.failedNodes"
        />
      </div>

      <!-- Percentiles -->
      <el-card class="mt-6">
        <template #header>
          <span class="font-bold">响应时间百分位</span>
        </template>

        <div class="grid grid-cols-5 gap-4">
            <div
              v-for="item in [
                { label: '最小值', value: summary.minResponseTime },
                { label: 'P50', value: summary.p50ResponseTime },
                { label: 'P95', value: summary.p95ResponseTime },
                { label: 'P99', value: summary.p99ResponseTime },
                { label: '最大值', value: summary.maxResponseTime },
              ]"
              :key="item.label"
              class="text-center p-4 bg-muted rounded-lg"
            >
              <p class="text-sm text-muted-foreground">
                {{ item.label }}
              </p>
              <p class="text-2xl font-bold">
                {{ item.value }}ms
              </p>
            </div>
          </div>
      </el-card>
    </main>
  </div>
</template>
