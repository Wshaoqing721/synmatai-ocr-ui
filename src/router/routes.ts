import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '仪表板',
          slogan: '欢迎来到管理后台，探索强大的 OCR 识别和智能助手功能。',
          icon: 'dashboard',
          requiresAuth: true
        }
      },
    {
        path: 'ocr',
        name: 'Ocr',
        component: () => import('@/views/modules/ocr/Index.vue'),
        meta: {
          title: 'OCR 识别',
          slogan: '智能图片识别，提取文字、公式、化学式和表格。',
          description: '上传图片，一键识别文字、公式、化学式和表格',
          buttonText: '开始识别',
          icon: 'ocr',
          requiresAuth: true
        }
      },
      {
        path: 'ocr/results',
        name: 'OcrResultsDirect',
        component: () => import('@/views/modules/ocr/pages/Results.vue'),
        meta: {
          title: 'OCR 结果',
          icon: 'ocr',
          requiresAuth: true
        }
      },   
      {
        path: 'sa',
        name: 'super-aagent',
        component: () => import('@/views/modules/sa/index.vue'),
        meta: {
          title: 'Super Agent',
          slogan: '智能对话助手，为您提供专业的问答服务。',
          description: '与 AI 助手对话，获取专业解答',
          buttonText: '开始对话',
          icon: 'sa',
          requiresAuth: true,
          noPadding: true
        }
      },
      {
        path: 'plm',
        name: 'PLM',
        meta: {
          title: 'PLM 管理',
          icon: 'plm',
          requiresAuth: true
        },
        children: [
          {
            path: 'sync-logs',
            name: 'SyncLogs',
            component: () => import('@/views/modules/plm/SyncLogs.vue'),
            meta: { title: '同步记录' }
          },
          {
            path: 'graph-explorer',
            name: 'GraphExplorer',
            component: () => import('@/views/modules/plm/GraphExplorer.vue'),
            meta: { title: '数据视图' }
          },
          {
            path: 'data-source',
            name: 'DataSourceManagement',
            component: () => import('@/views/modules/plm/DataSourceManagement.vue'),
            meta: { title: '数据源管理' }
          },
          {
            path: 'sync-rules',
            name: 'SyncRuleManagement',
            component: () => import('@/views/modules/plm/SyncRuleManagement.vue'),
            meta: { title: '同步规则' }
          }
        ]
      },
      {
        path: 'ontology',
        name: 'Ontology',
        meta: {
          title: '本体管理',
          icon: 'ontology',
          requiresAuth: true
        },
        children: [
          {
            path: 'ontologies',
            name: 'OntologyStudio',
            component: () => import('@/views/modules/ontology/OntologyStudio.vue'),
            meta: { title: '本体列表' }
          },
          {
            path: 'ontologies/:id',
            name: 'OntologyDetail',
            component: () => import('@/views/modules/ontology/OntologyDetail.vue'),
            meta: { title: '本体详情', hideInMenu: true }
          },
          {
            path: 'actions',
            name: 'ActionList',
            component: () => import('@/views/modules/ontology/ActionList.vue'),
            meta: { title: 'Action库' }
          },
          {
            path: 'datasources',
            name: 'DataSourceList',
            component: () => import('@/views/modules/ontology/DataSourceList.vue'),
            meta: { title: '数据源管理' }
          },
          {
            path: 'mappings',
            name: 'MappingList',
            component: () => import('@/views/modules/ontology/MappingList.vue'),
            meta: { title: '数据映射' }
          },
          {
            path: "mapping-workspace",
            name: "MappingWorkspace",
            component: () => import("@/views/modules/ontology/MappingWorkspace.vue"),
            meta: { title: '新建映射', hideInMenu: true }
          },
          {
            path: 'mappings/create',
            name: 'CreateMapping',
            component: () => import('@/views/modules/ontology/CreateMapping.vue'),
            meta: { title: '新建映射', hideInMenu: true }
          }
        ]
      },
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      requiresAuth: false
    }
  }
]
