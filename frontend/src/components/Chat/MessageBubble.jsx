import { cloneElement } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { parseBlocks } from './blockParser'
import { BLOCK_COMPONENTS, BlockSkeleton } from './blocks'

const cursor = (
  <span className="inline-block ml-1 h-4 w-1 animate-pulse bg-white/70 rounded-full align-middle my-auto" />
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
      elements.push(
        <div key={idx} className="prose prose-invert prose-sm max-w-none text-white prose-p:leading-relaxed prose-pre:bg-panel prose-pre:border prose-pre:border-border prose-a:text-white prose-a:underline prose-headings:font-display prose-headings:font-medium">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {seg.content}
          </ReactMarkdown>
        </div>
      )
    } else if (seg.type === 'pending-block') {
      elements.push(<BlockSkeleton key={idx} blockType={seg.blockType} />)
    } else {
      const Block = BLOCK_COMPONENTS[seg.type]
      if (Block) elements.push(<div key={idx} className="my-3"><Block data={seg.data} /></div>)
    }
  })
  return elements
}

export default function MessageBubble({ role, content, streaming, error }) {
  const isUser = role === 'user'
  
  // Minimal parsing for user messages, rich for assistant
  let rendered = isUser 
    ? <div className="text-sm font-medium text-white/80">{content}</div>
    : renderContent(content, streaming)

  if (streaming && !isUser && rendered) rendered = appendCursor(rendered)

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 pr-2">
        <div className="bg-[#2A2A2E] px-5 py-3 rounded-3xl max-w-[85%] text-[15px] shadow-md border border-white/5">
          <div className="text-sm font-medium text-white">{content}</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-4 text-sm font-medium text-danger bg-danger/10 border border-danger/20 px-4 py-3 rounded-xl max-w-[90%]">
        <span className="font-bold mr-2">Error:</span> {content || "Failed to generate response"}
      </div>
    )
  }

  return (
    <div className="mb-6 flex gap-3">
      <div className="w-8 h-8 rounded-full border border-border bg-white/5 shrink-0 mt-1" />
      <div className="flex-1 min-w-0 pr-4 mt-1.5">
        {rendered}
      </div>
    </div>
  )
}

