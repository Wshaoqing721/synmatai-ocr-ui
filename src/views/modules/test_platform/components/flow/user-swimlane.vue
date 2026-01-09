<script setup lang="ts">
import type { UserExecution, ScenarioNode, NodeStatus } from "@/types/tester"
import { UserFilled, ArrowRight } from "@element-plus/icons-vue"

const props = withDefaults(
  defineProps<{
    users: UserExecution[]
    nodes: ScenarioNode[]
    runId: string
    className?: string
  }>(),
  { className: "" },
)

const statusColors: Record<NodeStatus, string> = {
  pending: "bg-slate-200",
  running: "bg-blue-500 animate-pulse",
  success: "bg-emerald-500",
  failed: "bg-red-500",
  skipped: "bg-amber-500",
}

function userLink(userId: string) {
  return `/test-platform/runs/${props.runId}/users/${userId}`
}
</script>

<template>
  <div :class="['overflow-x-auto', className]">
    <div class="min-w-[800px]">
      <div class="flex border-b bg-muted/50 sticky top-0">
        <div class="w-48 px-4 py-3 font-medium text-sm shrink-0 border-r">用户</div>
        <div
          v-for="node in nodes"
          :key="node.id"
          class="flex-1 px-3 py-3 font-medium text-sm text-center min-w-[120px] border-r last:border-r-0"
        >
          {{ node.name }}
        </div>
        <div class="w-24 px-3 py-3 font-medium text-sm text-center shrink-0">操作</div>
      </div>

      <div class="divide-y">
        <div v-for="user in users" :key="user.userId" class="flex items-center hover:bg-muted/30 transition-colors">
          <div class="w-48 px-4 py-3 shrink-0 border-r">
            <div class="flex items-center gap-2">
              <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <el-icon class="text-primary"><UserFilled /></el-icon>
              </div>
              <div>
                <div class="font-medium text-sm">{{ user.userName }}</div>
                <div class="text-xs text-muted-foreground">{{ user.userId }}</div>
              </div>
            </div>
          </div>

          <div
            v-for="node in nodes"
            :key="node.id"
            class="flex-1 px-3 py-3 min-w-[120px] border-r last:border-r-0"
          >
            <div class="flex items-center justify-center gap-2">
              <div
                class="h-6 w-6 rounded-full flex items-center justify-center"
                :class="statusColors[user.nodeStates[node.id]?.status ?? 'pending']"
              >
                <div
                  v-if="(user.nodeStates[node.id]?.status ?? 'pending') === 'running'"
                  class="h-2 w-2 bg-white rounded-full"
                />
              </div>
              <span v-if="user.nodeStates[node.id]?.duration" class="text-xs text-muted-foreground">
                {{ user.nodeStates[node.id]?.duration }}ms
              </span>
            </div>
          </div>

          <div class="w-24 px-3 py-3 shrink-0 flex justify-center">
            <router-link :to="userLink(user.userId)" class="text-primary hover:text-primary/80 transition-colors">
              <el-icon><ArrowRight /></el-icon>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
