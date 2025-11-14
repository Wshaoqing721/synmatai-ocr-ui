import service from '../request'
import type {
  OCRTask,
  OCRResult,
  ExportRequest,
  OCROptions
} from '@/types/ocr'

export const ocrApi = {
  /**
   * 上传文件进行 OCR 处理
   */
  upload: async (
    file: File,
    fileType: 'photo' | 'pdf',
    languages: string[] = ['zh', 'en'],
    options: OCROptions = {}
  ): Promise<{
    status: string
    task_id: string
    message: string
    metadata: Record<string, any>
    created_at: string
  }> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_type', fileType)
    formData.append('languages', languages.join(','))
    formData.append('options_json', JSON.stringify(options))

    return service.post<{
      status: string
      task_id: string
      message: string
      metadata: Record<string, any>
      created_at: string
    }>('/v1/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }) as unknown as Promise<{
      status: string
      task_id: string
      message: string
      metadata: Record<string, any>
      created_at: string
    }>
  },

  /**
   * 查询 OCR 处理结果
   */
  getResults: (taskId: string): Promise<
    | OCRResult
    | {
        status: string
        task_id: string
        progress?: number
        current_step?: string
        error?: any
      }
  > => {
    return service.get<
      | OCRResult
      | {
          status: string
          task_id: string
          progress?: number
          current_step?: string
          error?: any
        }
    >(`/v1/results/${taskId}`) as unknown as Promise<
      | OCRResult
      | {
          status: string
          task_id: string
          progress?: number
          current_step?: string
          error?: any
        }
    >
  },

  /**
   * 获取任务状态
   */
  getStatus: (taskId: string): Promise<OCRTask> => {
    return service.get<OCRTask>(`/v1/status/${taskId}`) as unknown as Promise<OCRTask>
  },

  /**
   * 批量查询任务状态
   */
  getStatusBatch: (taskIds: string[]): Promise<{
    status: string
    tasks: OCRTask[]
  }> => {
    return service.get<{
      status: string
      tasks: OCRTask[]
    }>('/v1/status', {
      params: { task_ids: taskIds.join(',') }
    }) as unknown as Promise<{
      status: string
      tasks: OCRTask[]
    }>
  },

  /**
   * 导出结果
   */
  export: (request: ExportRequest): Promise<{
    status: string
    download_url: string
    format: string
    file_size: number
    expires_in: number
  }> => {
    return service.post<{
      status: string
      download_url: string
      format: string
      file_size: number
      expires_in: number
    }>('/v1/export', request) as unknown as Promise<{
      status: string
      download_url: string
      format: string
      file_size: number
      expires_in: number
    }>
  },

  /**
   * 下载导出文件
   */
  download: (url: string): Promise<Blob> => {
    return service.get(url, {
      responseType: 'blob'
    }) as unknown as Promise<Blob>
  }
}
