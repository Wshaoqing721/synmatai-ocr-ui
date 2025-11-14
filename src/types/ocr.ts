// OCR 处理选项
export interface OCROptions {
  extract_formulas?: boolean
  extract_chemistry?: boolean
  extract_tables?: boolean
  preserve_layout?: boolean
  formula_format?: string[]
}

// 任务信息
export interface OCRTask {
  task_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  filename: string
  file_type: 'photo' | 'pdf'
  file_size: number
  languages: string[]
  created_at: string
  progress?: number
  current_step?: string
  error?: {
    code: string
    message: string
    details?: string
  }
  // 本地预览地址（仅用于前端展示原始图片/文档封面）
  preview_url?: string
}

// 公式数据
export interface Formula {
  formula_id: string
  page: number
  mode: 'inline' | 'display'
  latex: string
  mathml: string
  confidence: number
  bbox: [number, number, number, number]
}

// 化学公式
export interface Chemistry {
  chemistry_id: string
  page: number
  type: 'molecule_formula' | 'reaction_equation'
  latex: string
  smiles: string
  inchi: string
  description: string
  bbox: [number, number, number, number]
}

// 表格数据
export interface Table {
  table_id: string
  page: number
  headers: string[]
  rows: string[][]
  html: string
  csv: string
  bbox: [number, number, number, number]
}

// OCR 结果
export interface OCRResult {
  task_id: string
  source: {
    filename: string
    type: string
    pages: number
  }
  processing_time: number
  results: {
    full_text: string
    formulas: Formula[]
    chemistry: Chemistry[]
    tables: Table[]
    graphics: any[]
  }
  quality_metrics: {
    overall_confidence: number
    text_confidence: number
    formula_confidence: number
    table_confidence: number
  }
  completed_at: string
}

// 导出格式
export type ExportFormat = 'json' | 'latex' | 'markdown' | 'pdf' | 'html'

// 导出请求
export interface ExportRequest {
  task_id: string
  format: ExportFormat
  options?: {
    include_images?: boolean
    include_confidence?: boolean
    include_bbox?: boolean
  }
}
