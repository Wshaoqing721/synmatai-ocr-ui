<template>
  <el-container class="w-full h-full overflow-hidden">
    <!-- 左侧：对话历史 -->
    <el-aside width="320px" class="h-full border-r bg-white shadow-sm overflow-y-auto flex-none">
      <ChatHistory />
    </el-aside>

    <!-- 中间：对话框 -->
    <el-main class="h-full flex flex-col bg-white overflow-hidden min-w-0 !p-0">
      <ConversationArea />
    </el-main>

    <!-- 右侧：Job列表 -->
    <el-aside width="384px" class="h-full border-l bg-gray-50 shadow-sm overflow-y-auto flex-none">
      <JobPanel />
    </el-aside>
  </el-container>
</template>

<script setup lang="ts">
import ChatHistory from './components/ChatHistory.vue'
import ConversationArea from './components/ConversationArea.vue'
import JobPanel from './components/JobPanel.vue'
</script>