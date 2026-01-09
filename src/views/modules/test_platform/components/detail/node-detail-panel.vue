<script setup lang="ts">
import { computed, ref } from "vue"
import type { NodeExecutionState } from "@/types/tester"
import { Clock, Upload, Download, Warning } from "@element-plus/icons-vue"

const props = defineProps<{
  nodeState: NodeExecutionState | null
  nodeName?: string
}>()

const activeTab = ref<"request" | "response" | "error">("request")

const statusTagType = computed(() => {
  const s = props.nodeState?.status
  if (s === "success") return "success"
  if (s === "failed") return "danger"
  if (s === "running") return "warning"
  return "info"
})
</script>

<template>
  <el-card class="h-full" body-class="h-full">
    <template v-if="!nodeState">
      <div class="h-full flex items-center justify-center text-muted-foreground">
        选择一个节点查看详情
      </div>
    </template>

    <template v-else>
      <div class="flex flex-col h-full">
        <div class="flex items-start justify-between mb-2">
          <div>
            <div class="text-lg font-semibold">
              {{ nodeName || nodeState.nodeId }}
            </div>
            <div v-if="nodeState.duration" class="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <el-icon><Clock /></el-icon>
              耗时: {{ nodeState.duration }}ms
            </div>
          </div>
          <el-tag :type="statusTagType" effect="light">{{ nodeState.status }}</el-tag>
        </div>

        <el-tabs v-model="activeTab" class="flex-1">
          <el-tab-pane name="request" label="请求">
            <div class="max-h-[320px] overflow-auto pr-1">
              <div v-if="nodeState.request" class="space-y-4">
                <div>
                  <div class="text-sm font-medium mb-1">方法 & URL</div>
                  <code class="block p-2 bg-muted rounded text-sm">
                    {{ nodeState.request.method }} {{ nodeState.request.url }}
                  </code>
                </div>
                <div>
                  <div class="text-sm font-medium mb-1">Headers</div>
                  <pre class="p-2 bg-muted rounded text-xs overflow-x-auto">{{ JSON.stringify(nodeState.request.headers, null, 2) }}</pre>
                </div>
                <div v-if="nodeState.request.body">
                  <div class="text-sm font-medium mb-1">Body</div>
                  <pre class="p-2 bg-muted rounded text-xs overflow-x-auto">{{ nodeState.request.body }}</pre>
                </div>
              </div>
              <div v-else class="text-muted-foreground text-center py-8">
                <el-icon class="mr-1"><Upload /></el-icon>
                无请求数据
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane name="response" label="响应">
            <div class="max-h-[320px] overflow-auto pr-1">
              <div v-if="nodeState.response" class="space-y-4">
                <div>
                  <div class="text-sm font-medium mb-1">状态</div>
                  <el-tag :type="nodeState.response.status < 400 ? 'success' : 'danger'">
                    {{ nodeState.response.status }} {{ nodeState.response.statusText }}
                  </el-tag>
                </div>
                <div>
                  <div class="text-sm font-medium mb-1">Headers</div>
                  <pre class="p-2 bg-muted rounded text-xs overflow-x-auto">{{ JSON.stringify(nodeState.response.headers, null, 2) }}</pre>
                </div>
                <div v-if="nodeState.response.body">
                  <div class="text-sm font-medium mb-1">Body</div>
                  <pre class="p-2 bg-muted rounded text-xs overflow-x-auto">{{ nodeState.response.body }}</pre>
                </div>
              </div>
              <div v-else class="text-muted-foreground text-center py-8">
                <el-icon class="mr-1"><Download /></el-icon>
                无响应数据
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane name="error" label="错误">
            <div v-if="nodeState.error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-center gap-2 text-red-600 font-medium mb-2">
                <el-icon><Warning /></el-icon>
                错误信息
              </div>
              <pre class="text-sm text-red-800 whitespace-pre-wrap">{{ nodeState.error }}</pre>
            </div>
            <div v-else class="text-muted-foreground text-center py-8">无错误信息</div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
  </el-card>
</template>
