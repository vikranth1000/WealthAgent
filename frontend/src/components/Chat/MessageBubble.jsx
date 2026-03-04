import { cloneElement } from 'react'
import { parseBlocks } from './blockParser'
import { BLOCK_COMPONENTS, BlockSkeleton } from './blocks'

function parseInline(text) {
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g
  let lastIndex = 0
  let match
  let idx = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[2]) parts.push(<strong key={idx++} style={{ color: '#FFFFFF', fontWeight: 700 }}>{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={idx++} style={{ color: '#FF9900' }}>{match[3]}</em>)
    else if (match[4])
      parts.push(
        <code key={idx++} className="font-mono text-[12px] px-1" style={{ color: '#FF9900', background: '#1A1A1A' }}>
          {match[4]}
        </code>
      )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function renderMarkdown(content) {
  const lines = content.split('\n')
  const elements = []
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      elements.push(
        <div key={k++} className="my-2" style={{ border: '1px solid #1E1E1E' }}>
          {lang && (
            <div className="px-3 py-1 text-[10px] uppercase tracking-wide font-mono"
              style={{ background: '#1A1A1A', color: '#FF9900', borderBottom: '1px solid #1E1E1E' }}>
              {lang}
            </div>
          )}
          <pre className="font-mono text-[12px] p-3 overflow-x-auto whitespace-pre"
            style={{ background: '#0D0D0D', color: '#FFFFFF' }}>
            {codeLines.join('\n')}
          </pre>
        </div>
      )
      i++; continue
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={k++} className="font-bold text-sm mt-2.5 mb-1 font-mono" style={{ color: '#FF9900' }}>{parseInline(line.slice(4))}</h3>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={k++} className="font-bold text-base mt-3 mb-1.5 font-mono" style={{ color: '#FF9900' }}>{parseInline(line.slice(3))}</h2>)
      i++; continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2)); i++
      }
      elements.push(
        <ul key={k++} className="ml-2 my-1 space-y-0.5">
          {items.map((item, idx) => (
            <li key={idx} className="text-[13px] font-mono" style={{ color: '#CCCCCC' }}>
              <span style={{ color: '#FF9900' }}>- </span>{parseInline(item)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, '')); i++
      }
      elements.push(
        <ol key={k++} className="ml-2 my-1 space-y-0.5">
          {items.map((item, idx) => (
            <li key={idx} className="text-[13px] font-mono" style={{ color: '#CCCCCC' }}>
              <span style={{ color: '#FF9900' }}>{idx + 1}. </span>{parseInline(item)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={k++} className="my-2" style={{ borderColor: '#1E1E1E' }} />)
      i++; continue
    }
    if (line.trim() === '') { elements.push(<div key={k++} className="h-1.5" />); i++; continue }

    elements.push(
      <p key={k++} className="my-0.5 leading-6 text-[13px] font-mono" style={{ color: '#CCCCCC' }}>
        {parseInline(line)}
      </p>
    )
    i++
  }
  return elements
}

const cursor = (
  <span className="inline-block ml-0.5 h-3.5 w-0.5 animate-pulse" style={{ background: '#FF9900' }} />
)

function appendCursor(elements) {
  if (!elements.length) return [cursor]
  const last = elements[elements.length - 1]
  if (last && last.props?.children != null) {
    const children = Array.isArray(last.props.children) ? last.props.children : [last.props.children]
    const patched = cloneElement(last, {}, ...children, cursor)
    return [...elements.slice(0, -1), patched]
  }
  return [...elements, cursor]
}

function renderContent(content, isStreaming) {
  const segments = parseBlocks(content, isStreaming)
  const elements = []
  segments.forEach((seg, idx) => {
    if (seg.type === 'text') {
      elements.push(<div key={idx}>{renderMarkdown(seg.content)}</div>)
    } else if (seg.type === 'pending-block') {
      elements.push(<BlockSkeleton key={idx} blockType={seg.blockType} />)
    } else {
      const Block = BLOCK_COMPONENTS[seg.type]
      if (Block) elements.push(<div key={idx} className="my-2"><Block data={seg.data} /></div>)
    }
  })
  return elements
}

export default function MessageBubble({ role, content, streaming, error }) {
  const isUser = role === 'user'
  let rendered = isUser ? null : renderContent(content, streaming)
  if (streaming && rendered) rendered = appendCursor(rendered)

  if (isUser) {
    return (
      <div className="flex justify-end mb-2">
        <div className="text-[13px] font-mono" style={{ color: '#FF9900' }}>
          {'> '}{content}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-3 text-[13px] font-mono" style={{ color: '#FF3B30' }}>
        ERROR: {rendered}
      </div>
    )
  }

  return (
    <div className="mb-3 pl-3" style={{ borderLeft: '2px solid #FF9900' }}>
      {rendered}
    </div>
  )
}
