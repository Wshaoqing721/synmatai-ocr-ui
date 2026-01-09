<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import {
  Lightning,
  List,
  Clock,
  Setting,
  TrendCharts,
} from "@element-plus/icons-vue"

const route = useRoute()

const navItems = [
  { to: "/test-platform", label: "测试列表", icon: List },
  { to: "/test-platform/history", label: "历史记录", icon: Clock },
  { to: "/test-platform/settings", label: "设置", icon: Setting },
] as const

const activePath = computed(() => route.path)

function isActive(to: string) {
  if (to === "/test-platform") return activePath.value === to
  return activePath.value.startsWith(to)
}
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container flex h-16 items-center">
      <div class="flex items-center gap-2 mr-8">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary"
        >
          <el-icon class="text-primary-foreground">
            <Lightning />
          </el-icon>
        </div>
        <div class="flex flex-col">
          <span class="text-lg font-bold leading-none">Agent Test</span>
          <span class="text-xs text-muted-foreground">自动化测试平台</span>
        </div>
      </div>

      <nav class="flex items-center gap-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          "
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <div
          class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600"
        >
          <el-icon><TrendCharts /></el-icon>
          <span class="text-sm font-medium">系统正常</span>
        </div>
      </div>
    </div>
  </header>
</template>
