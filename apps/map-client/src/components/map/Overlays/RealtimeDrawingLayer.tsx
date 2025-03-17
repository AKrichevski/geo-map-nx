import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../../hooks';
import { DrawingData } from '@geo-map-app/types';
import colors from '../../../consts/colors';

interface RealtimeDrawingLayerProps {
  mapInstance: mapboxgl.Map | null;
}

const RealtimeDrawingLayer: React.FC<RealtimeDrawingLayerProps> = ({ mapInstance }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { subscribe, isConnected } = useSocket();
  const [drawings, setDrawings] = useState<Record<string, DrawingData>>({});

  useEffect(() => {
    if (!isConnected) return;

    const handleDrawingUpdate = (data: DrawingData) => {
      if (!data || !data.userId || !Array.isArray(data.points)) return;

      setDrawings(prev => ({
        ...prev,
        [data.userId]: data
      }));
    };

    const handleDrawingEnded = (data: { userId: string }) => {
      if (!data || !data.userId) return;

      setDrawings(prev => {
        const newDrawings = { ...prev };
        delete newDrawings[data.userId];
        return newDrawings;
      });
    };

    const drawingUpdateUnsubscribe = subscribe<DrawingData>('drawing-update', handleDrawingUpdate);
    const drawingEndedUnsubscribe = subscribe<{ userId: string }>('drawing-ended', handleDrawingEnded);

    return () => {
      drawingUpdateUnsubscribe();
      drawingEndedUnsubscribe();
    };
  }, [isConnected, subscribe]);

  useEffect(() => {
    if (!mapInstance || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Object.values(drawings).forEach((drawing, index) => {
      if (!drawing.points || drawing.points.length < 2) return;

      try {
        const hue = ((drawing.userId.charCodeAt(0) || 0) * 137.5) % 360;
        const drawingColor = `hsl(${hue}, 80%, 50%)`;

        ctx.beginPath();
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = 3;

        const firstPoint = mapInstance.project(drawing.points[0]);
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < drawing.points.length; i++) {
          const point = mapInstance.project(drawing.points[i]);
          ctx.lineTo(point.x, point.y);
        }

        if (drawing.isCompleted && drawing.points.length >= 3) {
          ctx.lineTo(firstPoint.x, firstPoint.y);
          ctx.fillStyle = `${drawingColor}33`;
          ctx.fill();
        }

        ctx.stroke();

        if (drawing.username && drawing.points.length > 0) {
          const lastPoint = drawing.points[drawing.points.length - 1];
          const projectedPoint = mapInstance.project(lastPoint);

          ctx.beginPath();
          ctx.arc(projectedPoint.x, projectedPoint.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = drawingColor;
          ctx.fill();

          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = colors.white;
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.strokeText(drawing.username, projectedPoint.x, projectedPoint.y - 10);
          ctx.fillText(drawing.username, projectedPoint.x, projectedPoint.y - 10);
        }
      } catch (error) {
        console.error('Error drawing user path:', error);
      }
    });
  }, [drawings, mapInstance]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!mapInstance) return;

    const handleMapMove = () => {
      if (Object.keys(drawings).length > 0) {
        setDrawings(prev => ({ ...prev }));
      }
    };

    mapInstance.on('move', handleMapMove);
    mapInstance.on('zoom', handleMapMove);

    return () => {
      mapInstance.off('move', handleMapMove);
      mapInstance.off('zoom', handleMapMove);
    };
  }, [mapInstance, drawings]);

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
};

export default RealtimeDrawingLayer;
