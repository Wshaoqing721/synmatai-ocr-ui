<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Synchronization Rules & Mappings</span>
          <el-button type="primary" @click="openCreateDialog">New Rule</el-button>
        </div>
      </template>

      <el-table :data="rules" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="source.name" label="Data Source" />
        <el-table-column prop="entity_name" label="Entity" />
        <el-table-column prop="sync_frequency" label="Frequency" />
        <el-table-column prop="is_active" label="Status">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? 'Active' : 'Inactive' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions">
          <template #default="{ row }">
            <el-button size="small" @click="openMappingDialog(row)">Mappings</el-button>
            <el-button size="small" type="danger">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Mapping Dialog -->
    <el-dialog v-model="mappingDialogVisible" title="Data Mappings">
        <!-- 
          此处应实现一个复杂的表格或可视化界面，用于编辑 DataMapping 实体。
          左侧是源字段（可从数据源 API 动态获取），右侧是目标图谱的 Label 和 Property。
          需要支持设置 is_identifier, is_relation 等。
        -->
        <p>Mapping configuration for rule ID: {{ selectedRule?.id }}</p>
        <el-table :data="mappings" height="400">
            <el-table-column property="source_field" label="Source Field" />
            <el-table-column property="target_label" label="Target Label" />
            <el-table-column property="target_property" label="Target Property" />
            <el-table-column property="is_identifier" label="Is Identifier?" />
        </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getSyncRules, getMappingsForRule } from '@/api/modules/plm';

const rules = ref([]);
const mappings = ref([]);
const mappingDialogVisible = ref(false);
const selectedRule = ref(null);

onMounted(async () => {
  rules.value = (await getSyncRules()).data;
});

const openMappingDialog = async (rule) => {
    selectedRule.value = rule;
    mappings.value = (await getMappingsForRule(rule.id)).data; // 加载映射数据
    mappingDialogVisible.value = true;
}

const openCreateDialog = () => {
    // 弹出创建新规则的对话框
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
