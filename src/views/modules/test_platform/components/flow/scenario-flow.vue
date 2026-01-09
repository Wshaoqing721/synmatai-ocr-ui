<script setup lang="ts">
import { computed } from "vue"
import type { ScenarioNode, NodeStatus } from "@/types/tester"
import {
  VideoPlay,
  Box,
  CircleCheckFilled,
  CircleCloseFilled,
  Share,
  Loading,
  Clock,
} from "@element-plus/icons-vue"

type NodeStateLite = { status: NodeStatus; duration?: number }

const props = withDefaults(
  defineProps<{
    nodes: ScenarioNode[]
    nodeStates?: Record<string, NodeStateLite | { status?: NodeStatus; duration?: number }>
    className?: string
  }>(),
  { nodeStates: () => ({}) },
)

const emit = defineEmits<{
  (e: "node-click", nodeId: string): void
}>()

const nodeTypeConfig = {
  start: { icon: VideoPlay, color: "bg-emerald-500" },
  action: { icon: Box, color: "bg-blue-500" },
  assertion: { icon: CircleCheckFilled, color: "bg-amber-500" },
  condition: { icon: Share, color: "bg-purple-500" },
  end: { icon: Box, color: "bg-slate-500" },
} as const

const statusColors: Record<NodeStatus, string> = {
  pending: "border-slate-300 bg-slate-50",
  running: "border-blue-500 bg-blue-50 ring-2 ring-blue-200",
  success: "border-emerald-500 bg-emerald-50",
  failed: "border-red-500 bg-red-50",
  skipped: "border-amber-500 bg-amber-50",
}

const positionedNodes = computed(() => {
  const nodes = props.nodes
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const levels: string[][] = []
  const visited = new Set<string>()

  const assignLevel = (nodeId: string, level: number) => {
    if (visited.has(nodeId)) return
    visited.add(nodeId)

    if (!levels[level]) levels[level] = []
    levels[level].push(nodeId)

    nodes
      .filter((n) => n.dependencies.includes(nodeId))
      .forEach((n) => assignLevel(n.id, level + 1))
  }

  nodes
    .filter((n) => n.dependencies.length === 0)
    .forEach((n) => assignLevel(n.id, 0))

  return levels.map((levelIds, levelIndex) =>
    levelIds
      .map((nodeId) => nodeMap.get(nodeId))
      .filter(Boolean)
      .map((node) => ({ node: node!, level: levelIndex })),
  )
})

function getStatus(nodeId: string): NodeStatus {
  const state = props.nodeStates?.[nodeId]
  return (state?.status as NodeStatus) || "pending"
}

function getDuration(nodeId: string): number | undefined {
  const state = props.nodeStates?.[nodeId]
  return state?.duration
}

function onNodeClick(nodeId: string) {
  emit("node-click", nodeId)
}
</script>

<template>
  <div :class="['relative p-6 overflow-x-auto', className]">
    <div class="flex flex-col gap-4 min-w-fit">
      <div v-for="(level, levelIndex) in positionedNodes" :key="levelIndex" class="flex items-center gap-4">
        <div
          class="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0"
        >
          {{ levelIndex + 1 }}
        </div>

        <div class="flex gap-4 flex-wrap">
          <el-tooltip
            v-for="{ node } in level"
            :key="node.id"
            placement="right"
            :content="node.description ? `${node.name} · ${node.description}` : `${node.name}`"
          >
            <button
              type="button"
              class="flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer min-w-[180px]"
              :class="statusColors[getStatus(node.id)]"
              @click="onNodeClick(node.id)"
            >
              <div
                class="h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0"
                :class="nodeTypeConfig[node.type].color"
              >
                <el-icon v-if="getStatus(node.id) === 'running'" class="is-loading">
                  <Loading />
                </el-icon>
                <el-icon v-else>
                  <component :is="nodeTypeConfig[node.type].icon" />
                </el-icon>
              </div>

              <div class="text-left">
                <div class="font-medium text-sm">{{ node.name }}</div>
                <div v-if="getDuration(node.id)" class="flex items-center gap-1 text-xs text-muted-foreground">
                  <el-icon><Clock /></el-icon>
                  {{ getDuration(node.id) }}ms
                </div>
              </div>

              <el-icon v-if="getStatus(node.id) === 'failed'" class="text-red-500 ml-auto">
                <CircleCloseFilled />
              </el-icon>
              <el-icon v-else-if="getStatus(node.id) === 'success'" class="text-emerald-500 ml-auto">
                <CircleCheckFilled />
              </el-icon>
            </button>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>
