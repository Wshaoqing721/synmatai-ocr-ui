<template>
  <div class="flex w-full h-full overflow-hidden">
    <!-- 左侧：对话历史 -->
    <div class="w-80 h-full border-r bg-white shadow-sm overflow-y-auto flex-none">
      <ChatHistory />
    </div>

    <!-- 中间：对话框 -->
    <div class="flex-1 h-full flex flex-col bg-white overflow-hidden min-w-0">
      <ConversationArea />
    </div>

    <!-- 右侧：Job列表 -->
    <div class="w-96 h-full border-l bg-gray-50 shadow-sm overflow-y-auto flex-none">
      <JobPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import ChatHistory from './components/ChatHistory.vue'
import ConversationArea from './components/ConversationArea.vue'
import JobPanel from './components/JobPanel.vue'
</script>