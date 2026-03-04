import { cloneElement } from 'react'
import { motion } from 'framer-motion'
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
    if (match[2]) parts.push(<strong key={idx++} style={{ color: '#1c1c1e', fontWeight: 600 }}>{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={idx++} style={{ color: '#48484a' }}>{match[3]}</em>)
    else if (match[4])
      parts.push(
        <code
          key={idx++}
          className="font-mono text-[12px] px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.06)', color: '#1c1c1e' }}
        >
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
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <div key={k++} className="my-2 overflow-hidden rounded-lg" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
          {lang && (
            <div
              className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide"
              style={{
                background: 'rgba(0,0,0,0.04)',
                color: '#6e6e73',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              {lang}
            </div>
          )}
          <pre
            className="font-mono text-[12px] p-3 overflow-x-auto whitespace-pre"
            style={{ background: 'rgba(0,0,0,0.03)', color: '#1c1c1e' }}
          >
            {codeLines.join('\n')}
          </pre>
        </div>
      )
      i++
      continue
    }

    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={k++} className="font-semibold text-sm mt-2.5 mb-1" style={{ color: '#1c1c1e' }}>
          {parseInline(line.slice(4))}
        </h3>
      )
      i++
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={k++} className="font-bold text-base mt-3 mb-1.5" style={{ color: '#1c1c1e' }}>
          {parseInline(line.slice(3))}
        </h2>
      )
      i++
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={k++} className="ml-1 my-1.5 list-inside list-disc space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed" style={{ color: '#48484a' }}>{parseInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      elements.push(
        <ol key={k++} className="ml-1 my-1.5 list-inside list-decimal space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed" style={{ color: '#48484a' }}>{parseInline(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={k++} className="my-3" style={{ borderColor: 'rgba(0,0,0,0.08)' }} />)
      i++
      continue
    }

    if (line.trim() === '') {
      elements.push(<div key={k++} className="h-2" />)
      i++
      continue
    }

    elements.push(
      <p key={k++} className="my-0.5 leading-6" style={{ color: '#48484a' }}>
        {parseInline(line)}
      </p>
    )
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

const bubbleSpring = { type: 'spring', stiffness: 300, damping: 30 }

export default function MessageBubble({ role, content, streaming, error }) {
  const isUser = role === 'user'

  let rendered = isUser ? null : renderContent(content, streaming)
  if (streaming && rendered) rendered = appendCursor(rendered)

  if (isUser) {
    return (
      <motion.div
        className="flex justify-end mb-3"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={bubbleSpring}
      >
        <div
          className="max-w-[68%] rounded-2xl rounded-br-sm px-4 py-2.5 text-[13px] font-sans leading-relaxed text-white"
          style={{ background: 'var(--persona-primary)' }}
        >
          {content}
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="flex justify-start mb-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={bubbleSpring}
      >
        <div
          className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-[13px] font-sans"
          style={{
            color: '#FF3B30',
            border: '1px solid rgba(255,59,48,0.20)',
            background: 'rgba(255,59,48,0.06)',
          }}
        >
          {rendered}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex justify-start mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={bubbleSpring}
    >
      <div className="relative max-w-[78%] flex">
        {/* Left accent border */}
        <motion.div
          className="w-[3px] rounded-full shrink-0 mr-3 self-stretch"
          style={{
            background: 'color-mix(in srgb, var(--persona-primary) 50%, transparent)',
            originY: 0,
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
        />
        <div
          className="rounded-2xl rounded-bl-sm px-4 py-3 text-[13px] font-sans leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.80)',
            border: '1px solid rgba(0,0,0,0.08)',
            color: '#48484a',
          }}
        >
          {rendered}
        </div>
      </div>
    </motion.div>
  )
}
