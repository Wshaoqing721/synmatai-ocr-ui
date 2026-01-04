<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Search, Delete, Document, ArrowLeft } from '@element-plus/icons-vue'
import { getKBFiles, uploadFileToKB, deleteKBFile, searchKB } from '@/api/modules/kb'
import type { KBFile, KBSearchResult } from '@/types/kb'

const route = useRoute()
const router = useRouter()
const kbId = route.params.id as string
const kbName = route.query.name as string

const activeTab = ref('files')
const loading = ref(false)
const fileList = ref<KBFile[]>([])
const searchQuery = ref('')
const searchResults = ref<KBSearchResult[]>([])
const searchLoading = ref(false)
const uploadDialogVisible = ref(false)
const uploading = ref(false)

const fetchFiles = async () => {
  loading.value = true
  try {
    const res = await getKBFiles(kbId)
    // 简单的客户端过滤，如果后端不支持过滤
    fileList.value = res
  } catch (error) {
    console.error(error)
    ElMessage.error('获取文件列表失败')
  } finally {
    loading.value = false
  }
}

const handleUpload = async (options: any) => {
  const { file } = options
  uploading.value = true
  try {
    await uploadFileToKB(kbId, file)
    ElMessage.success(`文件 ${file.name} 上传成功`)
    uploadDialogVisible.value = false
    fetchFiles()
  } catch (error) {
    console.error(error)
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

const handleDeleteFile = async (file: KBFile) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${file.file_name}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteKBFile(file.id)
    ElMessage.success('删除成功')
    fetchFiles()
  } catch (e) {
    // cancel
  }
}

const handleSearch = async () => {
  if (!searchQuery.value) return
  searchLoading.value = true
  try {
    const res = await searchKB(kbId, searchQuery.value)
    searchResults.value = res.results
  } catch (error) {
    console.error(error)
    ElMessage.error('搜索失败')
  } finally {
    searchLoading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'KBIndex' })
}

const statusTagType = (status: string) => {
  switch (status) {
    case 'embedded': return 'success'
    case 'processing': return 'warning'
    case 'error': return 'danger'
    default: return 'info'
  }
}

onMounted(() => {
  if (kbId) {
    fetchFiles()
  }
})
</script>

<template>
  <div class="p-6 h-full flex flex-col bg-gray-50">
    <!-- Header -->
    <div class="flex items-center mb-6">
      <el-button :icon="ArrowLeft" circle class="mr-4" @click="goBack" />
      <div>
        <h1 class="text-2xl font-bold text-gray-800">{{ kbName || '知识库详情' }}</h1>
        <p class="text-gray-500 text-sm mt-1">ID: {{ kbId }}</p>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col min-h-0 bg-white rounded-lg shadow-sm overflow-hidden">
      <el-tabs v-model="activeTab" class="h-full flex flex-col px-4 pt-2">
        
        <!-- 文件管理 Tab -->
        <el-tab-pane label="文件管理" name="files" class="h-full flex flex-col">
          <div class="flex justify-between items-center mb-4 mt-2">
            <span class="text-gray-600">共 {{ fileList.length }} 个文件</span>
            <el-button type="primary" :icon="UploadFilled" @click="uploadDialogVisible = true">
              上传文件
            </el-button>
          </div>
          
          <el-table :data="fileList" v-loading="loading" style="width: 100%; flex: 1" height="100%">
            <el-table-column prop="file_name" label="文件名" min-width="200">
              <template #default="{ row }">
                <div class="flex items-center">
                  <el-icon class="mr-2 text-gray-400"><Document /></el-icon>
                  {{ row.file_name }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="chunk_count" label="分块数" width="100" align="center" />
            <el-table-column prop="file_size" label="大小" width="120">
              <template #default="{ row }">
                {{ row.file_size ? (row.file_size / 1024).toFixed(2) + ' KB' : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="danger" :icon="Delete" @click="handleDeleteFile(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无文件，请上传" />
            </template>
          </el-table>
        </el-tab-pane>

        <!-- 搜索测试 Tab -->
        <el-tab-pane label="检索测试" name="search" class="h-full flex flex-col">
          <div class="flex gap-2 mb-6 mt-2 max-w-3xl mx-auto w-full">
            <el-input 
              v-model="searchQuery" 
              placeholder="输入问题或关键词进行检索..." 
              @keyup.enter="handleSearch"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" :loading="searchLoading" @click="handleSearch">搜索</el-button>
          </div>

          <div class="flex-1 overflow-y-auto px-4 pb-4">
            <div v-if="searchResults.length > 0" class="max-w-3xl mx-auto space-y-4">
              <div v-for="(result, index) in searchResults" :key="index" class="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-2">
                  <div class="flex items-center gap-2">
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">Score: {{ result.score.toFixed(4) }}</span>
                    <span class="text-gray-500 text-xs">{{ result.metadata.file_name }} (Page {{ result.metadata.page }})</span>
                  </div>
                </div>
                <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{{ result.content }}</p>
              </div>
            </div>
            <el-empty v-else-if="!searchLoading && searchQuery" description="未找到相关内容" />
            <div v-else-if="!searchQuery" class="flex flex-col items-center justify-center h-64 text-gray-400">
              <el-icon size="48" class="mb-2"><Search /></el-icon>
              <p>输入关键词开始检索</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 上传弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="上传文件" width="400px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :http-request="handleUpload"
        :show-file-list="false"
        accept=".pdf,.txt,.md,.docx"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 PDF, TXT, MD, DOCX 格式文件
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<style scoped>
:deep(.el-tabs__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
:deep(.el-tabs__header) {
  margin-bottom: 0;
}
</style>
