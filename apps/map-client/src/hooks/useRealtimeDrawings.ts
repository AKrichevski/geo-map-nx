import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { DrawingData } from '@geo-map-app/types';

export interface RealtimeDrawingState {
  drawings: Record<string, DrawingData>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for managing real-time drawing data from all users
 * Efficiently updates and provides access to drawing information
 * with optimizations to prevent excessive re-rendering
 */
export function useRealtimeDrawings() {
  const [state, setState] = useState<RealtimeDrawingState>({
    drawings: {},
    isLoading: true,
    error: null
  });

  const { socket, isConnected, subscribe } = useSocket();

  const drawingsRef = useRef<Record<string, DrawingData>>({});
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<Record<string, number>>({});
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (isConnected && socket && !initialLoadDone.current) {
      setState(prev => ({ ...prev, isLoading: true }));
      socket.emit('get-current-drawings');
      initialLoadDone.current = true;
    }
  }, [isConnected, socket]);

  useEffect(() => {
    if (!isConnected) return;

    const updateState = () => {
      setState(prev => ({
        ...prev,
        drawings: { ...drawingsRef.current },
        isLoading: false
      }));
    };

    const throttledUpdateState = () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }

      throttleTimerRef.current = setTimeout(updateState, 16);
    };

    const handleDrawingUpdate = (data: DrawingData) => {
      if (!data || !data.userId) return;

      const timestamp = data.timestamp || Date.now();
      const lastUpdate = lastUpdateTimeRef.current[data.userId] || 0;

      if (timestamp <= lastUpdate && lastUpdate !== 0) {
        return;
      }

      lastUpdateTimeRef.current[data.userId] = timestamp;

      drawingsRef.current = {
        ...drawingsRef.current,
        [data.userId]: data
      };

      throttledUpdateState();
    };

    const handleDrawingEnded = (data: { userId: string }) => {
      if (!data || !data.userId) return;

      const newDrawings = { ...drawingsRef.current };
      delete newDrawings[data.userId];
      drawingsRef.current = newDrawings;
      delete lastUpdateTimeRef.current[data.userId];

      throttledUpdateState();
    };

    const drawingUpdateUnsubscribe = subscribe<DrawingData>('drawing-update', handleDrawingUpdate);
    const drawingEndedUnsubscribe = subscribe<{ userId: string }>('drawing-ended', handleDrawingEnded);

    if (!initialLoadDone.current && socket) {
      socket.emit('get-current-drawings');
      initialLoadDone.current = true;
    }

    return () => {
      drawingUpdateUnsubscribe();
      drawingEndedUnsubscribe();

      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [isConnected, subscribe, socket]);

  /**
   * Get drawing data for a specific user
   * @param userId The ID of the user whose drawing to retrieve
   * @returns Drawing data for the specified user, or null if not found
   */
  const getUserDrawing = useCallback((userId: string): DrawingData | null => {
    return drawingsRef.current[userId] || null;
  }, []);

  /**
   * Get all current drawings
   * @returns All current drawings as an array
   */
  const getAllDrawings = useCallback((): DrawingData[] => {
    return Object.values(drawingsRef.current);
  }, []);

  /**
   * Clear a specific user's drawing data
   * @param userId The ID of the user whose drawing to clear
   */
  const clearUserDrawing = useCallback((userId: string): void => {
    if (drawingsRef.current[userId]) {
      const newDrawings = { ...drawingsRef.current };
      delete newDrawings[userId];
      drawingsRef.current = newDrawings;

      setState(prev => ({
        ...prev,
        drawings: newDrawings
      }));
    }
  }, []);

  /**
   * Clear all drawing data
   */
  const clearAllDrawings = useCallback((): void => {
    drawingsRef.current = {};
    setState(prev => ({
      ...prev,
      drawings: {}
    }));
  }, []);

  return {
    ...state,
    getUserDrawing,
    getAllDrawings,
    clearUserDrawing,
    clearAllDrawings
  };
}

export default useRealtimeDrawings;
