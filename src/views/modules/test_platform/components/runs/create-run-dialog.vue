<script setup lang="ts">
import { ref, computed } from "vue"
import type { Scenario } from "@/types/tester"
import { Plus, Loading } from "@element-plus/icons-vue"

const props = defineProps<{
  scenarios: Scenario[]
  onSubmit: (data: { scenarioId: string; name: string; userCount: number }) => Promise<void>
}>()

const open = ref(false)
const loading = ref(false)
const name = ref("")
const scenarioId = ref("")
const userCount = ref(50)

const canSubmit = computed(() => !!name.value && !!scenarioId.value && !loading.value)

async function handleSubmit() {
  if (!canSubmit.value) return
  loading.value = true
  try {
    await props.onSubmit({
      scenarioId: scenarioId.value,
      name: name.value,
      userCount: userCount.value,
    })
    open.value = false
    name.value = ""
    scenarioId.value = ""
    userCount.value = 50
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-button type="primary" class="gap-2" @click="open = true">
    <el-icon><Plus /></el-icon>
    新建测试
  </el-button>

  <el-dialog v-model="open" title="创建新测试运行" width="460px">
    <div class="text-sm text-muted-foreground mb-4">
      配置测试参数并启动新的测试运行
    </div>

    <el-form label-position="top" class="space-y-3">
      <el-form-item label="测试名称">
        <el-input v-model="name" placeholder="例如: 登录流程压力测试" />
      </el-form-item>

      <el-form-item label="测试场景">
        <el-select v-model="scenarioId" placeholder="选择测试场景" filterable>
          <el-option
            v-for="s in props.scenarios"
            :key="s.id"
            :label="s.name"
            :value="s.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item>
        <template #label>
          <div class="flex justify-between">
            <span>并发用户数</span>
            <span class="text-sm text-muted-foreground">{{ userCount }} 用户</span>
          </div>
        </template>
        <el-slider v-model="userCount" :min="1" :max="500" :step="1" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="open = false">取消</el-button>
      <el-button type="primary" :disabled="!canSubmit" @click="handleSubmit">
        <el-icon v-if="loading" class="is-loading mr-1"><Loading /></el-icon>
        创建并运行
      </el-button>
    </template>
  </el-dialog>
</template>
