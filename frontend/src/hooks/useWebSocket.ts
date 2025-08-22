import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

interface WebSocketMessage {
  type: string
  sessionId?: string
  message?: string
  timestamp?: string
  data?: any
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: any) => void
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clientRef = useRef<Client | null>(null)
  const subscriptionsRef = useRef<Map<string, any>>(new Map())

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      debug: (str) => {
        console.log('[WebSocket]', str)
      },
      onConnect: () => {
        console.log('[WebSocket] Connected')
        setConnected(true)
        setError(null)
        options.onConnect?.()
      },
      onDisconnect: () => {
        console.log('[WebSocket] Disconnected')
        setConnected(false)
        options.onDisconnect?.()
      },
      onStompError: (frame) => {
        console.error('[WebSocket] STOMP Error:', frame)
        setError(`STOMP Error: ${frame.headers.message}`)
        options.onError?.(frame)
      },
      onWebSocketError: (event) => {
        console.error('[WebSocket] WebSocket Error:', event)
        setError('WebSocket connection error')
        options.onError?.(event)
      }
    })

    clientRef.current = client
    client.activate()

    return () => {
      // Unsubscribe from all topics
      subscriptionsRef.current.forEach((subscription) => {
        subscription.unsubscribe()
      })
      subscriptionsRef.current.clear()
      
      client.deactivate()
    }
  }, [])

  const subscribe = (topic: string, callback?: (message: WebSocketMessage) => void) => {
    if (!clientRef.current || !connected) {
      console.warn('[WebSocket] Cannot subscribe - not connected')
      return null
    }

    const finalCallback = callback || options.onMessage
    if (!finalCallback) {
      console.warn('[WebSocket] No callback provided for subscription')
      return null
    }

    try {
      const subscription = clientRef.current.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body)
          console.log(`[WebSocket] Message received on ${topic}:`, data)
          finalCallback(data)
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e)
        }
      })

      subscriptionsRef.current.set(topic, subscription)
      console.log(`[WebSocket] Subscribed to ${topic}`)
      return subscription
    } catch (e) {
      console.error(`[WebSocket] Failed to subscribe to ${topic}:`, e)
      return null
    }
  }

  const unsubscribe = (topic: string) => {
    const subscription = subscriptionsRef.current.get(topic)
    if (subscription) {
      subscription.unsubscribe()
      subscriptionsRef.current.delete(topic)
      console.log(`[WebSocket] Unsubscribed from ${topic}`)
    }
  }

  const publish = (destination: string, body: any) => {
    if (!clientRef.current || !connected) {
      console.warn('[WebSocket] Cannot publish - not connected')
      return false
    }

    try {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body)
      })
      console.log(`[WebSocket] Published to ${destination}:`, body)
      return true
    } catch (e) {
      console.error(`[WebSocket] Failed to publish to ${destination}:`, e)
      return false
    }
  }

  return {
    connected,
    error,
    subscribe,
    unsubscribe,
    publish
  }
}

export default useWebSocket