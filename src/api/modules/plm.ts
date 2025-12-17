import axios from 'axios';

// src/api/mockData.js

export const mockGraphResponse = {
  data: {
    // 节点数据：模拟 Neo4j 返回的节点
    nodes: [
      {
        id: "101",
        label: "AI 知识图谱平台",
        group: "Project", // 对应 Neo4j Label
        properties: {
          name: "AI 知识图谱平台",
          status: "Running",
          start_date: "2023-01-01",
          budget: 500000
        }
      },
      {
        id: "201",
        label: "后端架构设计",
        group: "Task",
        properties: {
          name: "后端架构设计",
          status: "Completed",
          priority: "High"
        }
      },
      {
        id: "202",
        label: "数据同步模块开发",
        group: "Task",
        properties: {
          name: "数据同步模块开发",
          status: "In Progress",
          priority: "Medium"
        }
      },
      {
        id: "301",
        label: "张三 (Tech Lead)",
        group: "Person",
        properties: {
          name: "张三",
          role: "Tech Lead",
          department: "研发部"
        }
      },
      {
        id: "302",
        label: "李四 (Dev)",
        group: "Person",
        properties: {
          name: "李四",
          role: "Developer",
          department: "研发部"
        }
      }
    ],
    // 边数据：模拟 Neo4j 返回的关系
    edges: [
      {
        id: "rel1",
        source: "201", // 对应节点的 id
        target: "101",
        type: "BELONGS_TO", // 关系类型
        properties: { created_at: "2023-01-05" }
      },
      {
        id: "rel2",
        source: "202",
        target: "101",
        type: "BELONGS_TO",
        properties: { created_at: "2023-01-10" }
      },
      {
        id: "rel3",
        source: "301",
        target: "201",
        type: "MANAGES",
        properties: { role: "Owner" }
      },
      {
        id: "rel4",
        source: "302",
        target: "202",
        type: "ASSIGNED_TO",
        properties: { percent: "100%" }
      },
      // 增加一个循环引用或复杂关系以测试图谱布局
      {
        id: "rel5",
        source: "301",
        target: "302",
        type: "MENTORS",
        properties: {}
      }
    ]
  }
};
const apiClient = axios.create({
  baseURL: import.meta.env.VUE_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 封装图查询接口
export const queryGraph = async (cypher) => {
  // return apiClient.post('/graph/query/', { query, params });
  console.log('[Mock API] Executing Cypher:', cypher);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockGraphResponse);
      }, 800); // 模拟 800ms 网络延迟
    });
};
export const getSyncRules = async () => {
  // return apiClient.get('/rules/');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: [
          { id: 1, source: { name: 'SAP' }, entity_name: 'Material', sync_frequency: 'Daily', is_active: true },
          { id: 2, source: { name: 'Salesforce' }, entity_name: 'Customer', sync_frequency: 'Hourly', is_active: false },
        ]
      });
    }, 500);
  });
};

export const createSyncRule = (rule) => apiClient.post('/rules/', rule);

export const getMappingsForRule = async (ruleId) => {
  // return apiClient.get(`/rules/${ruleId}/mappings`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: [
          { source_field: 'code', target_label: 'Project', target_property: 'code', is_identifier: true },
          { source_field: 'name', target_label: 'Project', target_property: 'name', is_identifier: false },
          { source_field: 'status', target_label: 'Project', target_property: 'status', is_identifier: false },
        ]
      });
    }, 500);
  });
};

export default apiClient;

