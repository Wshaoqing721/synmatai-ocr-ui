<template>
  <div
    class="w-full flex mb-3"
    :class="isUser ? 'justify-end' : 'justify-start'"
  >
    <div
      class="p-3 rounded-lg max-w-[80%] whitespace-pre-wrap break-words"
      :class="isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'"
    >
      <div v-html="renderedHtml"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

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
      return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

const renderedHtml = computed(() => md.render(props.message.content || ''))
</script>

<style scoped>
.hljs {
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}
</style>
