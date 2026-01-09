<script setup lang="ts">
import { reactive, onMounted } from "vue"
import { ElMessage } from "element-plus"
import AppHeader from "../components/layout/app-header.vue"
import { Setting, Bell, Link as LinkIcon } from "@element-plus/icons-vue"

type Settings = {
  apiUrl: string
  wsUrl: string
  autoReconnect: boolean
  notifyOnComplete: boolean
  notifyOnFail: boolean
}

const STORAGE_KEY = "test_platform_settings"

const settings = reactive<Settings>({
  apiUrl: "http://localhost:8080",
  wsUrl: "ws://localhost:8080",
  autoReconnect: true,
  notifyOnComplete: true,
  notifyOnFail: true,
})

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<Settings>
    Object.assign(settings, parsed)
  } catch {
    // ignore
  }
})

function handleSave() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  ElMessage.success("设置已保存")
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppHeader />

    <main class="container py-8 max-w-3xl">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">设置</h1>
        <p class="text-muted-foreground mt-1">配置测试平台连接和通知选项</p>
      </div>

      <div class="space-y-6">
        <el-card>
          <template #header>
            <div class="flex items-center gap-2">
              <el-icon><LinkIcon /></el-icon>
              <span class="font-bold">服务器配置</span>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid gap-2">
              <label class="text-sm font-medium">API 地址</label>
              <el-input v-model="settings.apiUrl" placeholder="http://localhost:8080" />
            </div>

            <div class="grid gap-2">
              <label class="text-sm font-medium">WebSocket 地址</label>
              <el-input v-model="settings.wsUrl" placeholder="ws://localhost:8080" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-medium">自动重连</div>
                <p class="text-sm text-muted-foreground">断线后自动尝试重新连接</p>
              </div>
              <el-switch v-model="settings.autoReconnect" />
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <div class="flex items-center gap-2">
              <el-icon><Bell /></el-icon>
              <span class="font-bold">通知设置</span>
            </div>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-medium">测试完成通知</div>
                <p class="text-sm text-muted-foreground">测试成功完成时发送通知</p>
              </div>
              <el-switch v-model="settings.notifyOnComplete" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <div class="text-sm font-medium">测试失败通知</div>
                <p class="text-sm text-muted-foreground">测试失败时发送通知</p>
              </div>
              <el-switch v-model="settings.notifyOnFail" />
            </div>
          </div>
        </el-card>

        <el-button type="primary" class="gap-2" @click="handleSave">
          <el-icon><Setting /></el-icon>
          保存设置
        </el-button>
      </div>
    </main>
  </div>
</template>
