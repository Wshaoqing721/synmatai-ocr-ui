<script setup lang="ts">
import { computed } from "vue"
import type { RunStatus, NodeStatus } from "@/types/tester"
import {
  Clock,
  Loading,
  CircleCheckFilled,
  CircleCloseFilled,
  RemoveFilled,
} from "@element-plus/icons-vue"

const props = withDefaults(
  defineProps<{
    status: RunStatus | NodeStatus
    size?: "sm" | "md" | "lg"
    showLabel?: boolean
  }>(),
  {
    size: "md",
    showLabel: true,
  },
)

const statusConfig = {
  pending: {
    label: "等待中",
    icon: Clock,
    className: "bg-slate-100 text-slate-600",
    spin: false,
  },
  running: {
    label: "运行中",
    icon: Loading,
    className: "bg-blue-100 text-blue-600",
    spin: true,
  },
  done: {
    label: "已完成",
    icon: CircleCheckFilled,
    className: "bg-emerald-100 text-emerald-600",
    spin: false,
  },
  success: {
    label: "成功",
    icon: CircleCheckFilled,
    className: "bg-emerald-100 text-emerald-600",
    spin: false,
  },
  failed: {
    label: "失败",
    icon: CircleCloseFilled,
    className: "bg-red-100 text-red-600",
    spin: false,
  },
  skipped: {
    label: "跳过",
    icon: RemoveFilled,
    className: "bg-amber-100 text-amber-600",
    spin: false,
  },
} as const

const sizeConfig = {
  sm: { badge: "px-2 py-0.5 text-xs gap-1", icon: "text-xs" },
  md: { badge: "px-2.5 py-1 text-sm gap-1.5", icon: "text-sm" },
  lg: { badge: "px-3 py-1.5 text-base gap-2", icon: "text-base" },
} as const

const cfg = computed(() => statusConfig[props.status])
const sizeCls = computed(() => sizeConfig[props.size])
</script>

<template>
  <span
    class="inline-flex items-center rounded-full font-medium"
    :class="[cfg.className, sizeCls.badge]"
  >
    <el-icon :class="[sizeCls.icon, cfg.spin ? 'is-loading' : '']">
      <component :is="cfg.icon" />
    </el-icon>
    <span v-if="showLabel">{{ cfg.label }}</span>
  </span>
</template>
