import { useEffect, useRef, useCallback, useState } from 'react'

const WS_BASE = `ws://${window.location.host}/ws/chat`

// Hook for WebSocket chat streaming
// Returns: { send, messages, activeAgent, isConnected, reconnect }
export function useWebSocket(clientId) {
  const ws = useRef(null)
  const [messages, setMessages] = useState([])
  const [activeAgent, setActiveAgent] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimer = useRef(null)
  const retryDelay = useRef(1000)

  const connect = useCallback(() => {
    if (!clientId) return
    const url = `${WS_BASE}/${clientId}`
    const socket = new WebSocket(url)

    socket.onopen = () => {
      setIsConnected(true)
      retryDelay.current = 1000
    }

    socket.onclose = () => {
      setIsConnected(false)
      reconnectTimer.current = setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 8000)
        connect()
      }, retryDelay.current)
    }

    socket.onmessage = (event) => {
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
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, streaming: false, report: data.report } : m
          )
        )
      }
    }

    ws.current = socket
  }, [clientId])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  const send = useCallback((message, persona) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      setMessages((prev) => [...prev, { role: 'user', content: message }])
      ws.current.send(JSON.stringify({ message, persona }))
    }
  }, [])

  return { send, messages, activeAgent, isConnected, reconnect: connect }
}
