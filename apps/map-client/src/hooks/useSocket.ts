import { useEffect, useState, useCallback } from 'react';
import socketService from '../services/socket';

export const useSocket = <T = any>(eventName?: string, initialState?: T) => {
  const [isConnected, setIsConnected] = useState(socketService.isConnected());
  const [data, setData] = useState<T | undefined>(initialState);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const socket = socketService.connect();
    setIsConnected(socketService.isConnected());

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err: any) => setError(err instanceof Error ? err : new Error(String(err)));

    const connectUnsub = socketService.on('connect', handleConnect);
    const disconnectUnsub = socketService.on('disconnect', handleDisconnect);
    const errorUnsub = socketService.on('error', handleError);

    return () => {
      connectUnsub();
      disconnectUnsub();
      errorUnsub();
    };
  }, []);

  useEffect(() => {
    if (!eventName) return;

    const handleEvent = (eventData: T) => {
      setData(eventData);
    };

    const unsubscribe = socketService.on<T>(eventName, handleEvent);

    return () => {
      unsubscribe();
    };
  }, [eventName]);

  const emit = useCallback((event: string, data?: any) => {
    socketService.emit(event, data);
  }, []);

  const subscribe = useCallback(<EventData = any>(
    event: string,
    callback: (data: EventData) => void
  ): (() => void) => {
    return socketService.on<EventData>(event, callback);
  }, []);

  return {
    socket: socketService.getSocket(),
    isConnected,
    data,
    error,
    emit,
    subscribe
  };
};

export default useSocket;
