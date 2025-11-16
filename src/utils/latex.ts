// Utilities for LaTeX normalization and detection

// Quick check if string seems to contain math delimiters
export const hasMathDelimiters = (s: string): boolean => {
  if (!s) return false
  return /\$\$|\$(?:[^$]|\$\$)*\$|\\\(|\\\)|\\\[|\\\]/.test(s)
}

// Normalize OCR-produced LaTeX to improve KaTeX rendering success
export const normalizeLatex = (s: string): string => {
  if (!s) return s
  let out = s
  
  // 1) 逃逸未转义的百分号（最优先，避免后续内容被当注释吞掉）
  out = out.replace(/(^|[^\\])%/g, '$1\\%')
  
  // 2) 修正 \left{ / \right} 为 \left\{ / \right\}
  out = out.replace(/\\left\{/g, '\\left\\{')
  out = out.replace(/\\right\}/g, '\\right\\}')
  
  // 3) 替换中文括号为英文括号
  out = out.replace(/[（]/g, '(').replace(/[）]/g, ')')
  
  // 4) 将中文字符包裹为 \text{...}（避免直接处于数学模式）
  out = out.replace(/[\u4e00-\u9fa5]+/g, (m) => `\\text{${m}}`)
  
  // 5) 修复可能被误拆的 LaTeX 命令（如果 'g' 被包装导致命令断裂）
  out = out.replace(/\\xri\\text\{g\}htarrow/g, '\\xrightarrow')
  out = out.replace(/\\ri\\text\{g\}ht\b/g, '\\right')
  out = out.replace(/\\be\\text\{g\}in\{/g, '\\begin{')
  
  return out
}
