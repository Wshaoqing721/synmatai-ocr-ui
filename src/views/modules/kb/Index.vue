<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Delete, Document } from '@element-plus/icons-vue'
import { getKBList, createKB, clearKB } from '@/api/modules/kb'
import type { KnowledgeBase, CreateKBParams } from '@/types/kb'

const router = useRouter()
const loading = ref(false)
const kbList = ref<KnowledgeBase[]>([])
const dialogVisible = ref(false)
const createFormLoading = ref(false)

const form = ref<CreateKBParams>({
  name: '',
  description: '',
  chunk_size: 500,
  chunk_overlap: 50
})

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getKBList()
    kbList.value = res || []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取知识库列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!form.value.name) {
    ElMessage.warning('请输入知识库名称')
    return
  }
  createFormLoading.value = true
  try {
    await createKB(form.value)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    fetchList()
    // 重置表单
    form.value = {
      name: '',
      description: '',
      chunk_size: 500,
      chunk_overlap: 50
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('创建失败')
  } finally {
    createFormLoading.value = false
  }
}

const handleClear = async (row: KnowledgeBase) => {
  try {
    await ElMessageBox.confirm(
      `确定要清空知识库 "${row.name}" 中的所有文件吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await clearKB(row.id)
    ElMessage.success('清空成功')
    fetchList()
  } catch (e) {
    // cancel or error
  }
}

const goToDetail = (row: KnowledgeBase) => {
  router.push({
    name: 'KBDetail',
    params: { id: row.id },
    query: { name: row.name }
  })
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="p-6 h-full flex flex-col bg-gray-50">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">知识库管理</h1>
        <p class="text-gray-500 mt-1">管理您的知识库集合，上传文档并进行智能检索。</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="dialogVisible = true">
        新建知识库
      </el-button>
    </div>

    <el-card class="flex-1 flex flex-col min-h-0 shadow-sm" :body-style="{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column' }">
      <el-table :data="kbList" v-loading="loading" style="width: 100%; flex: 1" stripe>
        <el-table-column prop="name" label="名称" min-width="150">
          <template #default="{ row }">
            <span class="font-medium text-blue-600 cursor-pointer hover:underline" @click="goToDetail(row)">
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="files_count" label="文件数" width="100" align="center" />
        <el-table-column prop="chunks_count" label="分块数" width="100" align="center" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ row.created_at ? new Date(row.created_at).toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Search" @click="goToDetail(row)">
              检索与管理
            </el-button>
            <el-button link type="danger" :icon="Delete" @click="handleClear(row)">
              清空
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无知识库" />
        </template>
      </el-table>
    </el-card>

    <!-- 创建对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新建知识库"
      width="500px"
      destroy-on-close
    >
      <el-form :model="form" label-position="top">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="请输入知识库名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="分块大小 (Chunk Size)">
            <el-input-number v-model="form.chunk_size" :min="100" :step="100" class="w-full" />
          </el-form-item>
          <el-form-item label="重叠大小 (Overlap)">
            <el-input-number v-model="form.chunk_overlap" :min="0" :step="10" class="w-full" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="createFormLoading" @click="handleCreate">
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
