<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/menu'
import { Document, Cpu, User, Menu as IconMenu, Expand, Fold, DataLine } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()

const menu = computed(() => menuStore.menuList)
const collapsed = ref(false)

const absPath = (p: string) => (p.startsWith('/') ? p : '/' + p)

const resolvePath = (parentPath: string, childPath: string) => {
  const p = parentPath.startsWith('/') ? parentPath : `/${parentPath}`
  const c = childPath.startsWith('/') ? childPath : `/${childPath}`
  return `${p}${c}`.replace(/\/\//g, '/')
}

onMounted(() => {
  menuStore.generateMenu()
})
</script>

<template>
  <div class="h-full flex flex-col bg-white border-r border-gray-200 transition-all duration-300" :class="collapsed ? 'w-[64px]' : 'w-[220px]'">
    <!-- Logo / Header Area -->
    <div class="h-14 flex items-center justify-between px-4 border-b border-gray-100 flex-none overflow-hidden">
      <div v-show="!collapsed" class="font-bold text-xl text-blue-600 truncate tracking-tight">
        SynMaTai
      </div>
      <el-button
        link
        @click="collapsed = !collapsed"
        class="!p-0"
      >
        <el-icon :size="20" class="text-gray-500">
          <Expand v-if="collapsed" />
          <Fold v-else />
        </el-icon>
      </el-button>
    </div>

    <!-- Navigation -->
    <el-scrollbar class="flex-1">
      <el-menu
        :default-active="route.path"
        class="border-none"
        :collapse="collapsed"
        router
        :collapse-transition="false"
      >
        <template v-for="item in menu" :key="item.path">
          <el-sub-menu v-if="item.children && item.children.length > 0" :index="absPath(item.path)">
            <template #title>
              <el-icon>
                <Document v-if="item.title.includes('OCR')" />
                <Cpu v-else-if="item.title.includes('Agent')" />
                <User v-else-if="item.title.includes('User')" />
                <DataLine v-else-if="item.title.includes('PLM')" />
                <IconMenu v-else />
              </el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item 
              v-for="child in item.children" 
              :key="child.path" 
              :index="resolvePath(item.path, child.path)"
            >
              {{ child.title }}
            </el-menu-item>
          </el-sub-menu>
          
          <el-menu-item v-else :index="absPath(item.path)">
            <el-icon>
              <Document v-if="item.title.includes('OCR')" />
              <Cpu v-else-if="item.title.includes('Agent')" />
              <User v-else-if="item.title.includes('User')" />
              <DataLine v-else-if="item.title.includes('PLM')" />
              <IconMenu v-else />
            </el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<style scoped>
:deep(.el-menu) {
  border-right: none;
}
</style>
