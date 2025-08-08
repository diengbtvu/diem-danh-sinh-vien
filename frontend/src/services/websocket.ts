import { Client } from '@stomp/stompjs'
import * as SockJS from 'sockjs-client'

export interface AttendanceNotification {
  type: string
  sessionId: string
  mssv: string
  hoTen: string
  status: string
  timestamp: string
  data?: any
}

export interface SessionNotification {
  type: string
  sessionId: string
  message: string
  timestamp: string
  data?: any
}

export interface GlobalNotification {
  type: string
  message: string
  timestamp: string
  data?: any
}

class WebSocketService {
  private client: Client | null = null
  private connected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve()
        return
      }

      this.client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        connectHeaders: {},
        debug: (str) => {
          console.log('STOMP: ' + str)
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      })

      this.client.onConnect = () => {
        console.log('WebSocket connected')
        this.connected = true
        this.reconnectAttempts = 0
        resolve()
      }

      this.client.onStompError = (frame) => {
        console.error('STOMP error:', frame)
        this.connected = false
        reject(new Error('WebSocket connection failed'))
      }

      this.client.onWebSocketError = (error) => {
        console.error('WebSocket error:', error)
        this.connected = false
        reject(error)
      }

      this.client.onDisconnect = () => {
        console.log('WebSocket disconnected')
        this.connected = false
        this.handleReconnect()
      }

      this.client.activate()
    })
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      setTimeout(() => {
        this.connect().catch(console.error)
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate()
      this.client = null
      this.connected = false
    }
  }

  subscribeToAttendance(sessionId: string, callback: (notification: AttendanceNotification) => void) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected')
      return null
    }

    return this.client.subscribe(`/topic/attendance/${sessionId}`, (message) => {
      try {
        const notification: AttendanceNotification = JSON.parse(message.body)
        callback(notification)
      } catch (error) {
        console.error('Error parsing attendance notification:', error)
      }
    })
  }

  subscribeToSession(sessionId: string, callback: (notification: SessionNotification) => void) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected')
      return null
    }

    return this.client.subscribe(`/topic/session/${sessionId}`, (message) => {
      try {
        const notification: SessionNotification = JSON.parse(message.body)
        callback(notification)
      } catch (error) {
        console.error('Error parsing session notification:', error)
      }
    })
  }

  subscribeToGlobal(callback: (notification: GlobalNotification) => void) {
    if (!this.client || !this.connected) {
      console.error('WebSocket not connected')
      return null
    }

    return this.client.subscribe('/topic/global', (message) => {
      try {
        const notification: GlobalNotification = JSON.parse(message.body)
        callback(notification)
      } catch (error) {
        console.error('Error parsing global notification:', error)
      }
    })
  }

  isConnected(): boolean {
    return this.connected
  }
}

export const websocketService = new WebSocketService()
