import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface UseRealTimeDataOptions {
  refreshInterval?: number;
  enabled?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

interface UseRealTimeDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  lastUpdate: number | null;
  refresh: () => void;
  subscribe: (topic: string, callback: (data: any) => void) => () => void;
}

export function useRealTimeData<T = any>(
  endpoint: string,
  options: UseRealTimeDataOptions = {}
): UseRealTimeDataReturn<T> {
  const {
    refreshInterval = 0,
    enabled = true,
    retryAttempts = 3,
    retryDelay = 1000,
    onError,
    onConnect,
    onDisconnect
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const clientRef = useRef<Client | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map());

  // Fetch data from REST endpoint
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setLastUpdate(Date.now());
      retryCountRef.current = 0;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));

      // Retry logic
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData();
        }, retryDelay * retryCountRef.current);
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, enabled, retryAttempts, retryDelay, onError]);

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    if (!enabled || clientRef.current?.connected) return;

    try {
      const client = new Client({
        webSocketFactory: () => new SockJS('/ws'),
        connectHeaders: {},
        debug: (str) => {
          console.log('[WebSocket Debug]', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('[WebSocket] Connected');
          setIsConnected(true);
          setError(null);
          onConnect?.();
        },
        onDisconnect: () => {
          console.log('[WebSocket] Disconnected');
          setIsConnected(false);
          onDisconnect?.();
        },
        onStompError: (frame) => {
          console.error('[WebSocket] STOMP Error:', frame);
          setError(`WebSocket error: ${frame.headers['message']}`);
          setIsConnected(false);
        },
        onWebSocketError: (error) => {
          console.error('[WebSocket] WebSocket Error:', error);
          setError('WebSocket connection error');
          setIsConnected(false);
        }
      });

      clientRef.current = client;
      client.activate();
    } catch (err) {
      console.error('[WebSocket] Failed to initialize:', err);
      setError('Failed to initialize WebSocket connection');
    }
  }, [enabled, onConnect, onDisconnect]);

  // Subscribe to WebSocket topic
  const subscribe = useCallback((topic: string, callback: (data: any) => void) => {
    if (!clientRef.current?.connected) {
      console.warn('[WebSocket] Not connected, cannot subscribe to:', topic);
      return () => {};
    }

    const subscription = clientRef.current.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
        setLastUpdate(Date.now());
      } catch (err) {
        console.error('[WebSocket] Failed to parse message:', err);
      }
    });

    const unsubscribe = () => {
      subscription.unsubscribe();
      subscriptionsRef.current.delete(topic);
    };

    subscriptionsRef.current.set(topic, unsubscribe);
    return unsubscribe;
  }, []);

  // Refresh data manually
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Setup polling interval
  useEffect(() => {
    if (refreshInterval > 0 && enabled) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refreshInterval, enabled, fetchData]);

  // Initial data fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Initialize WebSocket
  useEffect(() => {
    if (enabled) {
      initializeWebSocket();
    }

    return () => {
      // Cleanup subscriptions
      subscriptionsRef.current.forEach((unsubscribe) => {
        unsubscribe();
      });
      subscriptionsRef.current.clear();

      // Cleanup WebSocket
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }

      // Cleanup interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, initializeWebSocket]);

  // Auto-subscribe to analytics updates if endpoint is analytics-related
  useEffect(() => {
    if (isConnected && endpoint.includes('/analytics/')) {
      const topic = '/topic/analytics';
      return subscribe(topic, (update) => {
        if (update.type === 'metrics_update') {
          setData(update.data);
        }
      });
    }
  }, [isConnected, endpoint, subscribe]);

  return {
    data,
    isLoading,
    error,
    isConnected,
    lastUpdate,
    refresh,
    subscribe
  };
}

// Specialized hooks for common use cases
export function useRealTimeMetrics(sessionId?: string) {
  const endpoint = sessionId 
    ? `/api/analytics/metrics?sessionId=${sessionId}`
    : '/api/analytics/metrics';

  return useRealTimeData(endpoint, {
    refreshInterval: 5000, // 5 seconds
    enabled: true
  });
}

export function useDashboardData() {
  return useRealTimeData('/api/analytics/dashboard/summary', {
    refreshInterval: 10000, // 10 seconds
    enabled: true
  });
}

export function useSessionAnalytics(sessionId: string) {
  const { subscribe, ...rest } = useRealTimeData(`/api/analytics/session/${sessionId}`, {
    refreshInterval: 3000, // 3 seconds
    enabled: !!sessionId
  });

  useEffect(() => {
    if (sessionId && rest.isConnected) {
      return subscribe(`/topic/session/${sessionId}`, (update) => {
        console.log('Session analytics update:', update);
      });
    }
  }, [sessionId, rest.isConnected, subscribe]);

  return { subscribe, ...rest };
}
