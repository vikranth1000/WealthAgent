const DISCLAIMER =
  '\u26a0\ufe0f AI-generated. Not financial advice. Consult a qualified advisor before making investment decisions.'

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
        <code key={idx++} className="bg-gray-200 px-1 rounded text-xs font-mono">
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
          className="bg-gray-100 rounded-lg p-3 my-2 text-xs font-mono overflow-x-auto whitespace-pre"
        >
          {codeLines.join('\n')}
        </pre>
      )
      i++ // skip closing ```
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
        <ul key={k++} className="list-disc list-inside my-1 space-y-0.5">
          {items.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Empty line → spacer
    if (line.trim() === '') {
      elements.push(<br key={k++} />)
      i++
      continue
    }

    // Regular line with inline formatting
    elements.push(<p key={k++} className="my-0.5">{parseInline(line)}</p>)
    i++
  }
  return elements
}

// Props: role ('user' | 'assistant'), content (string), streaming (bool)
export default function MessageBubble({ role, content, streaming }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-[80%]">
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-navy text-white rounded-br-sm whitespace-pre-wrap'
              : 'bg-light-gray text-gray-800 border border-gray-200 rounded-bl-sm'
          }`}
        >
          {isUser ? content : renderMarkdown(content)}
          {streaming && (
            <span className="inline-block w-1 h-4 bg-teal ml-1 animate-pulse rounded align-text-bottom" />
          )}
        </div>
        {!isUser && (
          <p className="text-xs text-gray-400 mt-1 ml-1 leading-snug">{DISCLAIMER}</p>
        )}
      </div>
    </div>
  )
}
