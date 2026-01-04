import request from '@/api/request'
import type { 
  KnowledgeBase, 
  CreateKBParams, 
  KBSearchResponse, 
  KBFile 
} from '@/types/kb'

// 1. 创建知识库
export function createKB(data: CreateKBParams) {
  return request.post<any, KnowledgeBase>('/nexus/kb/create/', data)
}

// 2. 获取知识库列表
export function getKBList() {
  return request.get<any, KnowledgeBase[]>('/nexus/kb/list/')
}

// 3. 搜索知识库
export function searchKB(id: string, query: string, top_k: number = 10) {
  return request.post<any, KBSearchResponse>(`/nexus/kb/${id}/search/`, {
    query,
    top_k
  })
}

// 4. 清空知识库
export function clearKB(id: string) {
  return request.delete<any, { message: string; count: number }>(`/nexus/kb/${id}/clear/`)
}

// 5. 上传文件到知识库
export function uploadFileToKB(kbId: string, file: File) {
  const formData = new FormData()
  formData.append('knowledge_base_id', kbId)
  formData.append('file', file)
  
  return request.post<any, KBFile>('/nexus/kb/upload_to_kb/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 6. 获取文件列表
// 注意：API 文档中 /nexus/kb/files/ 似乎是获取所有文件，或者可能支持过滤？
// 通常会有 query param 过滤 kb_id，但文档没写。
// 假设它返回所有文件，或者我们需要在前端过滤，或者文档省略了参数。
// 暂时按文档写。
export function getKBFiles(kbId?: string) {
  // 如果后端支持 query param，可以加上 params: { knowledge_base_id: kbId }
  return request.get<any, KBFile[]>('/nexus/kb/files/', {
    params: kbId ? { knowledge_base: kbId } : {}
  })
}

// 7. 删除文件
export function deleteKBFile(fileId: string) {
  return request.delete<any, void>(`/nexus/kb/${fileId}/delete_file/`)
}
