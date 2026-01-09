<script setup lang="ts">
import type { Component } from "vue"
import type { TestSummary } from "@/types/tester"
import {
  UserFilled,
  CircleCheckFilled,
  CircleCloseFilled,
  TrendCharts,
  Timer,
  DataAnalysis,
} from "@element-plus/icons-vue"

defineProps<{
  summary: TestSummary
}>()

type SummaryCard = {
  title: string
  key: keyof TestSummary
  icon: Component
  bg: string
  color: string
  suffix?: string
}

const cards: SummaryCard[] = [
  {
    title: "总用户数",
    key: "totalUsers",
    icon: UserFilled,
    bg: "bg-blue-100",
    color: "text-blue-600",
  },
  {
    title: "成功用户",
    key: "successUsers",
    icon: CircleCheckFilled,
    bg: "bg-emerald-100",
    color: "text-emerald-600",
  },
  {
    title: "失败用户",
    key: "failedUsers",
    icon: CircleCloseFilled,
    bg: "bg-red-100",
    color: "text-red-600",
  },
  {
    title: "成功率",
    key: "successRate",
    suffix: "%",
    icon: TrendCharts,
    bg: "bg-purple-100",
    color: "text-purple-600",
  },
  {
    title: "平均响应时间",
    key: "avgResponseTime",
    suffix: "ms",
    icon: Timer,
    bg: "bg-amber-100",
    color: "text-amber-600",
  },
  {
    title: "P95 响应时间",
    key: "p95ResponseTime",
    suffix: "ms",
    icon: DataAnalysis,
    bg: "bg-cyan-100",
    color: "text-cyan-600",
  },
] 
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    <el-card v-for="c in cards" :key="c.title">
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium text-muted-foreground">
          {{ c.title }}
        </div>
        <div class="h-8 w-8 rounded-full flex items-center justify-center" :class="c.bg">
          <el-icon :class="c.color"><component :is="c.icon" /></el-icon>
        </div>
      </div>
      <div class="text-2xl font-bold mt-2">
        {{ summary[c.key] }}{{ c.suffix || "" }}
      </div>
    </el-card>
  </div>
</template>
