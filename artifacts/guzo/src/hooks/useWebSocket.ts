import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  autoConnect?: boolean;
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  autoConnect = true,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    setStatus('connecting');
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      setStatus('connected');
      reconnectAttempts.current = 0;
      onConnect?.();
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        setLastMessage(message);
        onMessage?.(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    socket.onclose = () => {
      setStatus('disconnected');
      onDisconnect?.();
      
      // Attempt reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        reconnectTimer.current = setTimeout(() => {
          connect();
        }, reconnectInterval * reconnectAttempts.current);
      }
    };

    socket.onerror = (error) => {
      setStatus('error');
      onError?.(error);
    };
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    ws.current?.close();
    ws.current = null;
  }, []);

  const sendMessage = useCallback((message: Record<string, unknown>) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    status,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    isConnected: status === 'connected',
  };
}

// Specialized hooks for common use cases
export function useNotificationsSocket() {
  const { sendMessage } = useWebSocket({
    url: `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws/notifications`,
  });

  const markAsRead = useCallback((notificationId: string) => {
    sendMessage({ type: 'MARK_READ', payload: { id: notificationId } });
  }, [sendMessage]);

  const subscribeToEntity = useCallback((entityType: string, entityId: string) => {
    sendMessage({ type: 'SUBSCRIBE', payload: { entityType, entityId } });
  }, [sendMessage]);

  return { markAsRead, subscribeToEntity };
}

export function usePresenceSocket(userId?: string) {
  const { sendMessage, isConnected } = useWebSocket({
    url: `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws/presence`,
    autoConnect: !!userId,
  });

  const updateStatus = useCallback((status: 'online' | 'away' | 'busy') => {
    if (isConnected) {
      sendMessage({ type: 'UPDATE_STATUS', payload: { status } });
    }
  }, [sendMessage, isConnected]);

  return { updateStatus, isConnected };
}
