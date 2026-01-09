<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useRouter } from "vue-router"

import AppHeader from "../components/layout/app-header.vue"
import RunStatusBadge from "../components/runs/run-status-badge.vue"

import { getTestRuns } from "@/api/modules/tester"
import type { TestRun } from "@/types/tester"

import {
  ElTable,
  ElTableColumn,
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElLoading,
} from "element-plus"

import { Search, ArrowRight } from "@element-plus/icons-vue"

/* ---------------- state ---------------- */

const runs = ref<TestRun[]>([])
const loading = ref(true)
const search = ref("")
const statusFilter = ref("all")

const router = useRouter()

/* ---------------- lifecycle ---------------- */

onMounted(() => {
  loadData()
})

async function loadData() {
  try {
    const runsData = await getTestRuns()
    // 只显示已完成的测试
    runs.value = runsData.filter(
      (r) => r.status === "done" || r.status === "failed",
    )
  } finally {
    loading.value = false
  }
}

/* ---------------- computed ---------------- */

const filteredRuns = computed(() => {
  return runs.value.filter((run) => {
    const matchesSearch =
      run.name.toLowerCase().includes(search.value.toLowerCase()) ||
      run.scenarioName.toLowerCase().includes(search.value.toLowerCase())

    const matchesStatus =
      statusFilter.value === "all" || run.status === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

function goToResult(runId: string) {
  router.push(`/test-platform/runs/${runId}/result`)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppHeader />

    <main class="container py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">历史记录</h1>
        <p class="text-muted-foreground mt-1">
          查看所有已完成的测试运行记录
        </p>
      </div>

      <!-- Filters -->
      <div class="flex gap-4 mb-6">
        <el-input
          v-model="search"
          placeholder="搜索测试名称或场景..."
          clearable
          style="max-width: 320px"
        >
          <template #prefix>
            <Search />
          </template>
        </el-input>

        <el-select
          v-model="statusFilter"
          placeholder="状态筛选"
          style="width: 150px"
        >
          <el-option label="全部状态" value="all" />
          <el-option label="已完成" value="done" />
          <el-option label="已失败" value="failed" />
        </el-select>
      </div>

      <!-- Table -->
      <el-table
        v-loading="loading"
        :data="filteredRuns"
        border
        style="width: 100%"
      >
        <el-table-column
          prop="name"
          label="测试名称"
        />

        <el-table-column
          prop="scenarioName"
          label="场景"
        />

        <el-table-column
          label="状态"
          width="120"
        >
          <template #default="{ row }">
            <RunStatusBadge
              :status="row.status"
              size="sm"
            />
          </template>
        </el-table-column>

        <el-table-column
          prop="totalUsers"
          label="用户数"
          width="100"
          align="center"
        />

        <el-table-column
          label="开始时间"
          width="180"
        >
          <template #default="{ row }">
            {{
              format(
                new Date(row.startTime),
                "yyyy-MM-dd HH:mm",
                { locale: zhCN },
              )
            }}
          </template>
        </el-table-column>

        <el-table-column
          label="结束时间"
          width="180"
        >
          <template #default="{ row }">
            {{
              row.endTime
                ? format(
                    new Date(row.endTime),
                    "yyyy-MM-dd HH:mm",
                    { locale: zhCN },
                  )
                : "-"
            }}
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="140"
          align="right"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              @click="goToResult(row.id)"
            >
              查看报告
              <ArrowRight />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </main>
  </div>
</template>
