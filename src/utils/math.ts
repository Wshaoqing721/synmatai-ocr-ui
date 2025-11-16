import katex from 'katex'

// 提取公式内容（支持 $$...$$, $...$）
const extractMathContent = (text: string) => {
  // 先匹配块级 $$...$$ (非贪婪)
  const blockRegex = /\$\$([\s\S]*?)\$\$/g
  const blockMatches: Array<{ formula: string; delimiter: string; display: boolean }> = []
  
  Array.from(text.matchAll(blockRegex)).forEach(match => {
    blockMatches.push({
      formula: match[1],
      delimiter: '$$',
      display: true
    })
  })
  
  // 再匹配行内 $...$（排除已被 $$ 包裹的部分）
  let inlineText = text
  blockMatches.forEach(m => {
    const original = `$$${m.formula}$$`
    inlineText = inlineText.replace(original, '\x00'.repeat(original.length))
  })
  
  const inlineRegex = /\$(.*?)\$/g
  const inlineMatches: Array<{ formula: string; delimiter: string; display: boolean }> = []
  
  Array.from(inlineText.matchAll(inlineRegex)).forEach(match => {
    inlineMatches.push({
      formula: match[1],
      delimiter: '$',
      display: false
    })
  })
  
  return [...blockMatches, ...inlineMatches]
}

// 渲染 HTML 中的数学公式（参考你的 handleChemicalFormula 逻辑）
export const renderMathInHTML = (html: string): string => {
  let result = html
  const formulas = extractMathContent(html)
  
  formulas.forEach(({ formula, delimiter, display }) => {
    try {
      // 清洗公式：去除 <br>、解码 HTML 实体、修正转义
      const cleaned = formula
        .replace(/<br\s*\/?>/gi, '')  // 移除 <br> 标签
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/\\left\{/g, '\\left\\{')
        .replace(/\\right\}/g, '\\right\\}')
      
      // 判断是否为块级公式（包含 \begin、align、\[ 等）
      const isBlock = display || /\\begin|align|\\\[|\\\]/.test(cleaned)
      
      // 使用 katex.renderToString 渲染
      const rendered = katex.renderToString(cleaned, {
        throwOnError: false,
        displayMode: isBlock,
        strict: false as any,
        trust: true
      })
      
      // 替换原始公式（保留分隔符）
      const original = delimiter === '$$' ? `$$${formula}$$` : `$${formula}$`
      result = result.replace(original, rendered)
    } catch (e) {
      console.warn('KaTeX render failed for:', formula, e)
    }
  })
  
  return result
}

// 在容器元素上渲染数学公式
export const renderMathInContainer = (el: HTMLElement) => {
  if (!el) return
  try {
    el.innerHTML = renderMathInHTML(el.innerHTML)
  } catch (e) {
    console.error('Failed to render math in container:', e)
  }
}
