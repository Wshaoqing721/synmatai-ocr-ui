import request from '@/api/request'
import type { 
  KnowledgeBase, 
  CreateKBParams, 
  KBSearchResponse, 
  KBFile,
  KBFilesResponse
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

// 6. 获取文件列表（支持分页）
export function getKBFiles(kbId?: string, page: number = 1, pageSize: number = 10) {
  return request.get<any, KBFilesResponse>('/nexus/kb/files/', {
    params: {
      ...(kbId ? { knowledge_base_id: kbId } : {}),
      page,
      page_size: pageSize
    }
  })
}

// 7. 删除文件
export function deleteKBFile(fileId: string) {
  return request.delete<any, void>(`/nexus/kb/${fileId}/delete_file/`)
}
