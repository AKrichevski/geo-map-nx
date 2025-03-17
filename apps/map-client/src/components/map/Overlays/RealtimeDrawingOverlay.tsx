import React, { useEffect, useRef, memo, useState, useCallback } from 'react';
import { Map } from 'mapbox-gl';
import { useSocket } from '../../../hooks';
import { useRealtimeDrawings } from '../../../hooks/useRealtimeDrawings';
import { DrawingData } from '@geo-map-app/types';
import colors from '../../../consts/colors';
import socketService from '../../../services/socket';

interface RealtimeDrawingOverlayProps {
  mapInstance: Map;
  selectedUserId?: string | null;
  currentUserId?: string | null;
  hideDrawingInProgress?: boolean;
}

/**
 * Component for rendering real-time drawing actions from all users
 * Only shows completed drawings on the main map, not drawings in progress
 */
export const RealtimeDrawingOverlay = memo(({
                                              mapInstance,
                                              selectedUserId,
                                              currentUserId,
                                              hideDrawingInProgress = false
                                            }: RealtimeDrawingOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { getAllDrawings } = useRealtimeDrawings();
  const animationFrameRef = useRef<number | null>(null);
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const { subscribe, isConnected } = useSocket();
  const mapInstanceRef = useRef<Map | null>(null);
  const isComponentMounted = useRef(true);
  const initialDrawingsLoaded = useRef(false);

  useEffect(() => {
    if (mapInstance) {
      mapInstanceRef.current = mapInstance;
    }

    return () => {
      isComponentMounted.current = false;
    };
  }, [mapInstance]);

  useEffect(() => {
    if (!isConnected) return;

    if (!initialDrawingsLoaded.current) {
      initialDrawingsLoaded.current = true;

      const allDrawings = getAllDrawings().filter(drawing =>
        drawing.isCompleted &&
        (!selectedUserId || drawing.userId !== selectedUserId) &&
        (!currentUserId || drawing.userId !== currentUserId)
      );

      setDrawings(allDrawings);
    }

    const handleDrawingUpdate = (data: DrawingData) => {
      if (!data || !data.userId) return;
      if (!data.isCompleted && hideDrawingInProgress) return;
      if (selectedUserId && data.userId === selectedUserId) return;
      if (currentUserId && data.userId === currentUserId) return;

      setDrawings(prev => {
        const existingIndex = prev.findIndex(d => d.userId === data.userId);

        if (existingIndex >= 0) {
          const newDrawings = [...prev];
          newDrawings[existingIndex] = data;
          return newDrawings;
        } else {
          return [...prev, data];
        }
      });
    };

    const handleDrawingEnded = (data: { userId: string }) => {
      if (!data || !data.userId) return;
      setDrawings(prev => prev.filter(d => d.userId !== data.userId));
    };

    const updateUnsubscribe = subscribe<DrawingData>('drawing-update', handleDrawingUpdate);
    const endedUnsubscribe = subscribe<{ userId: string }>('drawing-ended', handleDrawingEnded);

    return () => {
      updateUnsubscribe();
      endedUnsubscribe();
    };
  }, [isConnected, subscribe, getAllDrawings, selectedUserId, currentUserId, hideDrawingInProgress]);

  const drawAllDrawings = useCallback(() => {
    if (!canvasRef.current || !mapInstanceRef.current || drawings.length === 0) return;
    if (!isComponentMounted.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach(drawing => {
      if (!drawing.points || drawing.points.length < 1) return;
      if (selectedUserId && drawing.userId === selectedUserId) return;
      if (hideDrawingInProgress && !drawing.isCompleted) return;

      try {
        const hue = ((drawing.userId.charCodeAt(0) || 0) * 137.5) % 360;
        const drawingColor = `hsl(${hue}, 80%, 50%)`;

        if (drawing.points.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = drawingColor;
          ctx.lineWidth = 3;

          const firstPoint = mapInstanceRef.current.project(drawing.points[0]);
          ctx.moveTo(firstPoint.x, firstPoint.y);

          for (let i = 1; i < drawing.points.length; i++) {
            const point = mapInstanceRef.current.project(drawing.points[i]);
            ctx.lineTo(point.x, point.y);
          }

          // Close the polygon if completed
          if (drawing.isCompleted && drawing.points.length >= 3) {
            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.fillStyle = `${drawingColor}33`;
            ctx.fill();
          }

          ctx.stroke();
        }
      } catch (error) {
        // Silently handle drawing errors
      }
    });
  }, [drawings, selectedUserId, hideDrawingInProgress]);

  useEffect(() => {
    const animate = () => {
      drawAllDrawings();
      if (isComponentMounted.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (mapInstanceRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawAllDrawings]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const handleMapMove = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (isComponentMounted.current) {
        animationFrameRef.current = requestAnimationFrame(drawAllDrawings);
      }
    };

    mapInstanceRef.current.on('move', handleMapMove);
    mapInstanceRef.current.on('zoom', handleMapMove);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('move', handleMapMove);
        mapInstanceRef.current.off('zoom', handleMapMove);
      }
    };
  }, [drawAllDrawings]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && isComponentMounted.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
        drawAllDrawings();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawAllDrawings]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        zIndex: 5
      }}
    />
  );
});

export default RealtimeDrawingOverlay;
