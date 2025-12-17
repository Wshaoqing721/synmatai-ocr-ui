<template>
  <div
    class="w-full flex mb-6 gap-4"
    :class="isUser ? 'flex-row-reverse' : 'flex-row'"
  >
    <!-- Avatar -->
    <el-avatar 
      :size="32"
      :class="isUser ? '!bg-blue-600' : '!bg-green-600'"
      class="flex-none text-sm font-bold shadow-sm text-white"
    >
      {{ isUser ? 'U' : 'AI' }}
    </el-avatar>

    <!-- Message Content -->
    <div
      class="max-w-[85%] min-w-0"
    >
      <div 
        class="prose prose-sm max-w-none break-words rounded-2xl px-5 py-3.5 shadow-sm"
        :class="[
          isUser 
            ? 'bg-blue-600 text-white prose-invert' 
            : 'bg-white text-gray-800 border border-gray-100'
        ]"
      >
        <div v-if="message.type === 'thinking' && !message.content" class="flex items-center gap-1 h-6">
          <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
          <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
          <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
        </div>
        <div v-else v-html="renderedHtml"></div>
        
        <!-- Streaming Cursor -->
        <span v-if="message.isStreaming" class="inline-block w-1.5 h-4 ml-1 align-middle bg-gray-400 animate-pulse"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css' // Use dark theme for code blocks

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

// 判断消息来源
const isUser = computed(() => {
  return props.message.role === 'user' && props.message.type === 'message'
})

const isAssistant = computed(() => {
  return props.message.role === 'assistant' && props.message.type === 'response'
})

// markdown 渲染
const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return `<pre class="hljs !bg-gray-900 !text-gray-100 !rounded-md !p-3 !my-2 !text-xs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
    }
    return `<pre class="hljs !bg-gray-900 !text-gray-100 !rounded-md !p-3 !my-2 !text-xs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

const renderedHtml = computed(() => md.render(props.message.content || ''))
</script>

<style>
/* Custom Prose Overrides */
.prose p {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
.prose p:first-child {
  margin-top: 0;
}
.prose p:last-child {
  margin-bottom: 0;
}
.prose pre {
  margin: 0.5em 0;
}
</style>
