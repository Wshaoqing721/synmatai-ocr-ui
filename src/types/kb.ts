export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  chunk_size?: number
  chunk_overlap?: number
  minio_bucket?: string
  created_at?: string
  updated_at?: string
  files_count?: number
  chunks_count?: number
  total_size_bytes?: number
}

export interface CreateKBParams {
  name: string
  description?: string
  chunk_size?: number
  chunk_overlap?: number
  minio_bucket?: string
}

export interface KBSearchResult {
  id: number | string
  content: string
  score: number
  metadata: {
    file_name: string
    page: number
    [key: string]: any
  }
}

export interface KBSearchResponse {
  query: string
  count: number
  results: KBSearchResult[]
}

export interface KBFile {
  id: string
  file_name: string
  knowledge_base: string
  status: 'processing' | 'embedded' | 'error'
  chunk_count?: number
  file_size?: number
  created_at?: string
}

export interface UploadFileParams {
  knowledge_base_id: string
  file: File
}
