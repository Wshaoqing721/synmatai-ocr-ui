<template>
  <div class="mapping-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">数据映射</span>
          <el-button type="primary" @click="createMapping">
            <el-icon><Plus /></el-icon>
            新建映射
          </el-button>
        </div>
      </template>

      <el-table :data="mappings" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="数据源">
          <template #default="{ row }">
            {{ getDataSourceName(row.datasource) }}
          </template>
        </el-table-column>
        <el-table-column label="本体">
          <template #default="{ row }">
            {{ getOntologyName(row.ontology) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button link type="success" @click="triggerSync(row)" :loading="syncingIds.includes(row.id)">
              执行同步
            </el-button>
            <el-button link type="primary" @click="viewMapping(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- View Mapping Dialog -->
    <el-dialog v-model="showViewDialog" title="映射详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="数据源">
          {{ getDataSourceName(currentMapping?.datasource) }}
        </el-descriptions-item>
        <el-descriptions-item label="本体">
          {{ getOntologyName(currentMapping?.ontology) }}
        </el-descriptions-item>
        <el-descriptions-item label="字段映射">
          <pre>{{ JSON.stringify(currentMapping?.field_mapping, null, 2) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { api } from '@/api/modules/ontology'

const router = useRouter()
const loading = ref(false)
const mappings = ref([])
const dataSources = ref([])
const ontologies = ref([])
const showViewDialog = ref(false)
const currentMapping = ref(null)
const syncingIds = ref([])

const loadMappings = async () => {
  loading.value = true
  try {
    mappings.value = await api.getMappings()
    dataSources.value = await api.getDataSources()
    ontologies.value = await api.getOntologies()
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const getDataSourceName = (id) => {
  return dataSources.value.find(ds => ds.id === id)?.name || `数据源 ${id}`
}

const getOntologyName = (id) => {
  return ontologies.value.find(o => o.id === id)?.name || `本体 ${id}`
}

const createMapping = () => {
  router.push('/ontology/mappings/create')
}

const viewMapping = (mapping) => {
  currentMapping.value = mapping
  showViewDialog.value = true
}

const triggerSync = async (mapping) => {
  syncingIds.value.push(mapping.id)
  try {
    await api.triggerSync(mapping.id)
    ElMessage.success('同步完成')
  } catch (error) {
    ElMessage.error('同步失败')
  } finally {
    syncingIds.value = syncingIds.value.filter(id => id !== mapping.id)
  }
}

onMounted(() => {
  loadMappings()
})
</script>

<style scoped>
.mapping-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

pre {
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow: auto;
  margin: 0;
}
</style>
