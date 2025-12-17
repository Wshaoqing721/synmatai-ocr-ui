<template>
  <div class="data-source-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>Data Sources</span>
          <el-button type="primary" @click="openCreateDialog">Add New Source</el-button>
        </div>
      </template>
<!-- 搜索栏 -->
      <el-input v-model="searchQuery" placeholder="Search by name or type" class="mb-4" />
<!-- 数据源列表 -->
      <el-table :data="filteredSources" style="width: 100%">
        <el-table-column prop="name" label="Name" width="150" />
        <el-table-column prop="system_type" label="System Type" width="120" />
        <el-table-column prop="api_endpoint" label="Endpoint" />
        <el-table-column label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? 'Active' : 'Inactive' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
<!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? 'Edit Data Source' : 'Create Data Source'" width="40%">
      <el-form :model="currentSource" label-width="120px">
        <el-form-item label="Source Name" :rules="{ required: true, message: 'Name is required'}">
          <el-input v-model="currentSource.name" />
        </el-form-item>
        <el-form-item label="System Type" :rules="{ required: true, message: 'Type is required'}">
          <el-select v-model="currentSource.system_type" placeholder="Select type">
            <el-option label="Django" value="Django" />
            <el-option label="SAP" value="SAP" />
            <el-option label="CRM" value="CRM" />
          </el-select>
        </el-form-item>
        <el-form-item label="API Endpoint">
          <el-input v-model="currentSource.api_endpoint" />
        </el-form-item>
        <el-form-item label="Auth Details (Encrypted)" :rules="{ required: true, message: 'Auth is required'}">
          <el-input v-model="currentSource.encrypted_auth_details" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="saveSource">Save</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
const sources = ref([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const currentSource = ref({});
// 模拟数据或从 API 获取
onMounted(() => {
  // 在实际项目中，此处应调用 sync-api 获取数据源列表
  // 示例数据：
  sources.value = [
    { id: 1, name: 'Main Django DB', system_type: 'Django', api_endpoint: 'http://django:8000', is_active: true },
    { id: 2, name: 'External CRM', system_type: 'CRM', api_endpoint: 'https://crm.example.com', is_active: false }
  ];
});
const searchQuery = ref('');
const filteredSources = computed(() => {
  if (!searchQuery.value) return sources.value;
  const q = searchQuery.value.toLowerCase();
  return sources.value.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.system_type.toLowerCase().includes(q)
  );
});
const openCreateDialog = () => {
  currentSource.value = { id: null, name: '', system_type: '', api_endpoint: '', encrypted_auth_details: '' };
  isEdit.value = false;
  dialogVisible.value = true;
};
const handleEdit = (row) => {
  currentSource.value = { ...row };
  isEdit.value = true;
  dialogVisible.value = true;
};
const handleDelete = (id) => {
  // 实际开发中需确认
  ElMessage.warning(`Deleting source ${id}...`);
};
const saveSource = () => {
  if (!currentSource.value.name || !currentSource.value.system_type) return;
if (isEdit.value) {
    // 更新逻辑
    const index = sources.value.findIndex(s => s.id === currentSource.value.id);
    if (index !== -1) sources.value[index] = currentSource.value;
  } else {
    // 新增逻辑
    const newId = Math.max(...sources.value.map(s => s.id), 0) + 1;
    currentSource.value.id = newId;
    sources.value.push(currentSource.value);
  }
dialogVisible.value = false;
  ElMessage.success('Saved successfully.');
};
</script>
<style scoped>
.data-source-container .el-card__header .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
