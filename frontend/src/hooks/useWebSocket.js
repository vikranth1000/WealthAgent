import { useEffect, useRef, useCallback, useState } from 'react'
import { api } from '../services/api'

const WS_BASE = `ws://${window.location.host}/ws/chat`

// Module-level chat history cache: clientId -> messages[]
const chatCache = new Map()

// Hook for WebSocket chat streaming
// Returns: { send, stop, messages, activeAgent, isConnected }
export function useWebSocket(clientId) {
  const ws = useRef(null)
  const [messages, setMessages] = useState([])
  const [activeAgent, setActiveAgent] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const reconnectTimer = useRef(null)
  const retryDelay = useRef(1000)
  const lastSentRef = useRef('')
  const sessionRef = useRef(0)
  const connectRef = useRef(null) // stores the current connect function
  const clientIdRef = useRef(clientId)
  clientIdRef.current = clientId

  // Persist messages to cache whenever they change
  useEffect(() => {
    if (clientIdRef.current && messages.length > 0) {
      chatCache.set(clientIdRef.current, messages)
    }
  }, [messages])

  useEffect(() => {
    const session = ++sessionRef.current

    // Clear state immediately
    setActiveAgent(null)
    setIsConnected(false)
    setSuggestions([])
    lastSentRef.current = ''

    // Cleanup previous connection
    clearTimeout(reconnectTimer.current)
    if (ws.current) {
      ws.current.onclose = null
      ws.current.close()
      ws.current = null
    }

    if (!clientId) {
      setMessages([])
      connectRef.current = null
      return
    }

    // Restore from cache immediately if available
    const cached = chatCache.get(clientId)
    if (cached && cached.length > 0) {
      setMessages(cached)
    } else {
      setMessages([])
    }

    // Load persisted chat history from server (reconciles with cache)
    api.getChatHistory(clientId)
      .then((data) => {
        if (sessionRef.current !== session) return
        const loaded = (data.messages ?? []).map((m) => ({
          role: m.role,
          content: m.content,
          agent: m.agent,
        }))
        // Only update if server has data and it differs from cache
        if (loaded.length > 0) {
          setMessages(loaded)
          chatCache.set(clientId, loaded)
        }
      })
      .catch(() => {})

    let shouldReconnect = true

    function connect() {
      if (sessionRef.current !== session || !shouldReconnect) return

      const socket = new WebSocket(`${WS_BASE}/${clientId}`)

      socket.onopen = () => {
        if (sessionRef.current !== session) { socket.close(); return }
        setIsConnected(true)
        retryDelay.current = 1000
      }

      socket.onclose = () => {
        if (sessionRef.current !== session) return
        setIsConnected(false)
        if (shouldReconnect) {
          reconnectTimer.current = setTimeout(() => {
            retryDelay.current = Math.min(retryDelay.current * 2, 8000)
            connect()
          }, retryDelay.current)
        }
      }

      socket.onmessage = (event) => {
        if (sessionRef.current !== session) return
        const data = JSON.parse(event.data)

        if (data.type === 'agent_start') {
          setActiveAgent(data.agent)
        } else if (data.type === 'chunk') {
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === 'assistant' && last.streaming) {
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + data.content },
              ]
            }
            return [...prev, { role: 'assistant', content: data.content, streaming: true }]
          })
        } else if (data.type === 'done') {
          setActiveAgent(null)
          lastSentRef.current = ''
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions)
          }
          setMessages((prev) =>
            prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, streaming: false, report: data.report } : m
            )
          )
        } else if (data.type === 'error') {
          setActiveAgent(null)
          lastSentRef.current = ''
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.message ?? 'An error occurred. Please try again.',
              error: true,
            },
          ])
        }
      }

      ws.current = socket
    }

    connectRef.current = connect
    connect()

    return () => {
      shouldReconnect = false
      clearTimeout(reconnectTimer.current)
      if (ws.current) {
        ws.current.onclose = null
        ws.current.close()
        ws.current = null
      }
      connectRef.current = null
    }
  }, [clientId])

  const send = useCallback((message, persona) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return

    const trimmed = message.trim()
    if (trimmed === lastSentRef.current) return
    lastSentRef.current = trimmed

    setSuggestions([])
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    ws.current.send(JSON.stringify({ message: trimmed, persona }))
  }, [])

  const stop = useCallback(() => {
    if (!ws.current) return

    // Prevent auto-reconnect from the old socket, then close
    ws.current.onclose = null
    ws.current.close()
    ws.current = null

    // Finalize any streaming message
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && last.streaming) {
        return [
          ...prev.slice(0, -1),
          { ...last, streaming: false, stopped: true },
        ]
      }
      return prev
    })

    setActiveAgent(null)
    setIsConnected(false)
    lastSentRef.current = ''

    // Reconnect after a short delay using the stored connect function
    setTimeout(() => {
      connectRef.current?.()
    }, 300)
  }, [])

  // Clear chat: wipes messages locally + server-side, returns a restore function
  const clearChat = useCallback(async () => {
    let backup
    setMessages((prev) => {
      backup = [...prev]
      return []
    })
    setSuggestions([])
    chatCache.delete(clientId)

    try {
      await api.clearChatHistory(clientId)
    } catch {
      // If server delete fails, restore messages
      setMessages(backup)
      chatCache.set(clientId, backup)
      return null
    }

    // Return a restore function the caller can use for undo
    return () => {
      setMessages(backup)
      chatCache.set(clientId, backup)
    }
  }, [clientId])

  return { send, stop, messages, activeAgent, isConnected, suggestions, clearChat }
}
