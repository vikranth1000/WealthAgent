// Block parser for structured visual blocks in chat messages.
//
// Parses content into segments:
//   { type: 'text', content: '...' }
//   { type: 'metrics'|'allocation'|'bar-chart'|'table'|'callout', data: {...} }
//   { type: 'pending-block', blockType: '...' }  (streaming only)

const BLOCK_OPEN_RE = /^:::(metrics|allocation|bar-chart|table|callout)\s*$/

export function parseBlocks(content, isStreaming = false) {
  const lines = content.split('\n')
  const segments = []
  let textBuffer = []
  let i = 0

  function flushText() {
    if (textBuffer.length > 0) {
      const text = textBuffer.join('\n').trim()
      if (text) segments.push({ type: 'text', content: text })
      textBuffer = []
    }
  }

  while (i < lines.length) {
    const openMatch = lines[i].match(BLOCK_OPEN_RE)

    if (openMatch) {
      flushText()
      const blockType = openMatch[1]
      const jsonLines = []
      i++

      while (i < lines.length && lines[i].trim() !== ':::') {
        jsonLines.push(lines[i])
        i++
      }

      if (i < lines.length && lines[i].trim() === ':::') {
        // Complete block
        const raw = jsonLines.join('\n').trim()
        try {
          const data = JSON.parse(raw)
          segments.push({ type: blockType, data })
        } catch {
          // Malformed JSON: render as code block
          segments.push({ type: 'text', content: '```\n' + raw + '\n```' })
        }
        i++
      } else if (isStreaming) {
        // Incomplete block still streaming
        segments.push({ type: 'pending-block', blockType })
      } else {
        // Incomplete block in finished message: treat as text
        textBuffer.push(':::' + blockType)
        textBuffer.push(...jsonLines)
      }
    } else {
      textBuffer.push(lines[i])
      i++
    }
  }

  flushText()
  return segments
}
