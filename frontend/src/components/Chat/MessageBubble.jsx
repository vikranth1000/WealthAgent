function parseInline(text) {
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g
  let lastIndex = 0
  let match
  let idx = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[2]) parts.push(<strong key={idx++}>{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={idx++}>{match[3]}</em>)
    else if (match[4])
      parts.push(
        <code key={idx++} className="rounded bg-gray-200/60 px-1 py-0.5 text-xs font-mono">
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
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre
          key={k++}
          className="my-2 overflow-x-auto whitespace-pre rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs font-mono"
        >
          {codeLines.join('\n')}
        </pre>
      )
      i++ // skip closing ```
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={k++} className="mb-1 mt-3 text-sm font-semibold text-gray-800">
          {parseInline(line.slice(4))}
        </h4>
      )
      i++
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={k++} className="mb-1 mt-3 text-sm font-bold text-navy">
          {parseInline(line.slice(3))}
        </h3>
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
            <li key={idx} className="leading-relaxed">{parseInline(item)}</li>
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
            <li key={idx} className="leading-relaxed">{parseInline(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Horizontal rule / disclaimer separator
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={k++} className="my-3 border-gray-200" />)
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
    elements.push(<p key={k++} className="my-0.5 leading-6">{parseInline(line)}</p>)
    i++
  }
  return elements
}

// Props: role ('user' | 'assistant'), content (string), streaming (bool), error (bool)
export default function MessageBubble({ role, content, streaming, error }) {
  const isUser = role === 'user'

  return (
    <div className={`mb-3 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'max-w-[68%]' : 'max-w-[78%]'}`}>
        <div
          className={`px-4 py-3 text-sm leading-6 ${
            isUser
              ? 'whitespace-pre-wrap rounded-2xl rounded-br-md bg-navy text-white shadow-sm'
              : error
                ? 'rounded-2xl rounded-bl-md border border-red-200 bg-red-50 text-red-800'
                : 'rounded-2xl rounded-bl-md border border-gray-200 bg-white text-gray-800'
          }`}
        >
          {isUser ? content : renderMarkdown(content)}
          {streaming && (
            <span className="ml-1 inline-block h-4 w-0.5 animate-pulse rounded-full bg-teal align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  )
}
