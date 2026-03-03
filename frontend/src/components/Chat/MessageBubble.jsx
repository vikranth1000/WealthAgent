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
    if (match[2]) parts.push(<strong key={idx++} className="text-slate-200 font-semibold">{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={idx++} className="text-slate-400 italic">{match[3]}</em>)
    else if (match[4])
      parts.push(
        <code key={idx++} className="bg-white/[0.08] text-slate-300 font-mono text-[13px] px-1.5 py-0.5 rounded">
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

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={k++} className="my-2 overflow-hidden rounded-lg border border-white/[0.08]">
          {lang && (
            <div className="bg-white/[0.06] px-3 py-1 text-[10px] font-medium text-slate-500 uppercase tracking-wide border-b border-white/[0.08]">
              {lang}
            </div>
          )}
          <pre className="bg-black/40 text-slate-300 border border-white/[0.08] font-mono text-[13px] rounded-lg p-3 overflow-x-auto whitespace-pre">
            {codeLines.join('\n')}
          </pre>
        </div>
      )
      i++ // skip closing ```
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={k++} className="text-slate-300 font-display font-semibold text-sm mt-2.5 mb-1">
          {parseInline(line.slice(4))}
        </h3>
      )
      i++
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={k++} className="text-slate-200 font-display font-bold text-base mt-3 mb-1.5">
          {parseInline(line.slice(3))}
        </h2>
      )
      i++
      continue
    }

    // Bullet list (collect consecutive items)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={k++} className="ml-1 my-1.5 list-inside list-disc space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-slate-400 leading-relaxed">{parseInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list (collect consecutive items)
    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={k++} className="ml-1 my-1.5 list-inside list-decimal space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-slate-400 leading-relaxed">{parseInline(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Horizontal rule / disclaimer separator
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={k++} className="my-3 border-white/[0.08]" />)
      i++
      continue
    }

    // Empty line -> spacer
    if (line.trim() === '') {
      elements.push(<div key={k++} className="h-2" />)
      i++
      continue
    }

    // Regular line with inline formatting
    elements.push(<p key={k++} className="my-0.5 leading-6 text-slate-300">{parseInline(line)}</p>)
    i++
  }
  return elements
}

const cursor = (
  <span
    className="inline-block ml-0.5 h-3.5 w-0.5 rounded-full animate-pulse"
    style={{ background: 'var(--persona-primary)' }}
  />
)

function appendCursor(elements) {
  if (!elements.length) return [cursor]
  const last = elements[elements.length - 1]
  // Append cursor inside the last block element so it stays inline with text
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
      if (Block) {
        elements.push(
          <div key={idx} className="my-2 -mx-1">
            <Block data={seg.data} />
          </div>
        )
      }
    }
  })

  return elements
}

// Props: role ('user' | 'assistant'), content (string), streaming (bool), error (bool)
export default function MessageBubble({ role, content, streaming, error }) {
  const isUser = role === 'user'

  let rendered = isUser ? null : renderContent(content, streaming)
  if (streaming && rendered) rendered = appendCursor(rendered)

  if (isUser) {
    return (
      <div className="flex justify-end mb-3 animate-slide-up">
        <div
          className="max-w-[68%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm text-slate-100 font-sans leading-relaxed"
          style={{
            background: 'color-mix(in srgb, var(--persona-primary) 14%, rgba(255,255,255,0.04))',
            border: '1px solid color-mix(in srgb, var(--persona-primary) 28%, rgba(255,255,255,0.06))',
          }}
        >
          {content}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-start mb-4 animate-slide-up">
        <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-rose-400 font-sans border border-rose-500/20 bg-rose-500/[0.06]">
          {rendered}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-4 animate-slide-up">
      <div
        className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-300 font-sans leading-relaxed shadow-glass"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderLeft: '3px solid color-mix(in srgb, var(--persona-primary) 55%, transparent)',
        }}
      >
        {rendered}
      </div>
    </div>
  )
}
