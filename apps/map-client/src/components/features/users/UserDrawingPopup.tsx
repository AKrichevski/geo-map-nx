import React, { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl, { Map } from 'mapbox-gl';
import { DraggableModal } from '../../common/Modal/DraggableModal';
import { ActiveUser } from '@geo-map-app/types';
import { useSocket } from '../../../hooks';
import { useMapContext } from '../../../contexts/MapContext';
import { DrawingData } from '@geo-map-app/types';
import colors from '../../../consts/colors';
import MapStyleSwitcher from '../../styledComponents/MapStyleSwitcher';
import {
  CloseButton, DrawingInfoOverlay,
  HeaderTitle,
  MapCanvas,
  NoDataOverlay,
  PopupHeader,
  MapContainer
} from '../../styledComponents/popups/userDrawingPopupStyles';

interface UserDrawingPopupProps {
  user: ActiveUser;
  onClose: () => void;
}

export const UserDrawingPopup: React.FC<UserDrawingPopupProps> = ({
                                                                    user,
                                                                    onClose,
                                                                  }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [userDrawing, setUserDrawing] = useState<DrawingData | null>(null);
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const { socket, subscribe } = useSocket();
  const { mapStyle, setMapStyle } = useMapContext();
  const animationFrameRef = useRef<number | null>(null);
  const [isEditingPolygon, setIsEditingPolygon] = useState<boolean>(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstance) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_API_KEY;
    if (mapboxToken && !mapboxgl.accessToken) {
      mapboxgl.accessToken = mapboxToken;
    }

    const center = user.activity?.coordinates || [-74.5, 40];
    setInitialCenter(center);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center,
      zoom: 14
    });

    map.on('load', () => {
      setMapInstance(map);
    });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (mapInstance && mapStyle) {
      mapInstance.setStyle(mapStyle);
    }
  }, [mapStyle, mapInstance]);

  useEffect(() => {
    setIsEditingPolygon(user.activity?.type === 'editing' && !!user.activity.polygonId);
  }, [user.activity]);

  useEffect(() => {
    if (!socket) return;
    if (isEditingPolygon && user.activity?.polygonId) {
      const handlePolygonCoordinateUpdate = (data: {
        polygonId: number,
        coordinates: [number, number][]
      }) => {
        if (data.polygonId === user.activity?.polygonId) {
          setPolygonCoordinates(data.coordinates);
          const timestamp = Date.now();
          setLastUpdateTime(timestamp);
        }
      };

      const polygonCoordinateUnsubscribe = subscribe(
        'polygon-coordinates-update',
        handlePolygonCoordinateUpdate
      );

      return () => {
        polygonCoordinateUnsubscribe();
      };
    } else {
      socket.emit('request-user-drawing', user.id);

      const pollingInterval = setInterval(() => {
        socket.emit('request-user-drawing', user.id);
      }, 3000);

      return () => {
        clearInterval(pollingInterval);
      };
    }
  }, [user.id, socket, user.activity, isEditingPolygon, subscribe]);

  useEffect(() => {
    const handleDrawingUpdate = (data: DrawingData) => {
      if (!data || data.userId !== user.id) return;

      const timestamp = data.timestamp || Date.now();
      if (timestamp <= lastUpdateTime) return;

      setLastUpdateTime(timestamp);
      setUserDrawing(data);

      if (mapInstance && data.points && data.points.length > 0) {
        const lastPoint = data.points[data.points.length - 1];

        if (initialCenter) {
          const currentCenter = mapInstance.getCenter();
          const distanceX = Math.abs(lastPoint[0] - currentCenter.lng);
          const distanceY = Math.abs(lastPoint[1] - currentCenter.lat);

          if (distanceX > 0.01 || distanceY > 0.01) {
            mapInstance.panTo(lastPoint);
          }
        } else {
          mapInstance.panTo(lastPoint);
          setInitialCenter(lastPoint);
        }
      }
    };

    const handleDrawingPointChanged = (data: {
      action: 'add' | 'edit' | 'delete',
      pointIndex?: number,
      point?: [number, number],
      userId?: string
    }) => {
      if (data.userId && data.userId !== user.id) return;

      socket?.emit('request-user-drawing', user.id);
    };

    const handleDrawingEnded = (data: { userId: string }) => {
      if (data && data.userId === user.id) {
        setUserDrawing(prev => prev ? { ...prev, isCompleted: true } : null);
      }
    };

    const drawingUpdateUnsubscribe = subscribe<DrawingData>('drawing-update', handleDrawingUpdate);
    const drawingPointChangedUnsubscribe = subscribe('drawing-point-changed', handleDrawingPointChanged);
    const drawingEndedUnsubscribe = subscribe<{ userId: string }>('drawing-ended', handleDrawingEnded);

    socket?.emit('request-user-drawing', user.id);

    return () => {
      drawingUpdateUnsubscribe();
      drawingPointChangedUnsubscribe();
      drawingEndedUnsubscribe();
    };
  }, [user.id, mapInstance, subscribe, socket, initialCenter, lastUpdateTime]);

  const drawUserDrawing = useCallback(() => {
    if (!canvasRef.current || !mapInstance) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isEditingPolygon && polygonCoordinates && polygonCoordinates.length > 0) {
      const drawingColor = `hsl(200, 80%, 50%)`;

      try {
        polygonCoordinates.forEach((point, index) => {
          const pos = mapInstance.project(point);

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = drawingColor;
          ctx.fill();
          ctx.strokeStyle = colors.white;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.font = '12px Arial';
          ctx.fillStyle = colors.white;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((index + 1).toString(), pos.x, pos.y);
        });

        if (polygonCoordinates.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = drawingColor;
          ctx.lineWidth = 3;

          const firstPoint = mapInstance.project(polygonCoordinates[0]);
          ctx.moveTo(firstPoint.x, firstPoint.y);

          for (let i = 1; i < polygonCoordinates.length; i++) {
            const point = mapInstance.project(polygonCoordinates[i]);
            ctx.lineTo(point.x, point.y);
          }

          if (polygonCoordinates.length >= 3) {
            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.fillStyle = `${drawingColor}33`;
            ctx.fill();
          }

          ctx.stroke();
        }

        return;
      } catch (error) {
        console.error("Error drawing edited polygon:", error);
      }
    }

    if (!userDrawing || !userDrawing.points || userDrawing.points.length < 1) return;

    const hue = ((user.id.charCodeAt(0) || 0) * 137.5) % 360;
    const drawingColor = `hsl(${hue}, 80%, 50%)`;

    try {
      userDrawing.points.forEach((point, index) => {
        const pos = mapInstance.project(point);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = drawingColor;
        ctx.fill();
        ctx.strokeStyle = colors.white;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = '12px Arial';
        ctx.fillStyle = colors.white;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index + 1).toString(), pos.x, pos.y);
      });

      if (userDrawing.points.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = drawingColor;
        ctx.lineWidth = 3;

        const firstPoint = mapInstance.project(userDrawing.points[0]);
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < userDrawing.points.length; i++) {
          const point = mapInstance.project(userDrawing.points[i]);
          ctx.lineTo(point.x, point.y);
        }

        if (userDrawing.points.length >= 3) {
          if (userDrawing.isCompleted) {
            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.fillStyle = `${drawingColor}33`;
            ctx.fill();
          } else {
            const lastPoint = mapInstance.project(userDrawing.points[userDrawing.points.length - 1]);
            ctx.stroke();
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(firstPoint.x, firstPoint.y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        } else {
          ctx.stroke();
        }
      }
    } catch (error) {
      console.error("Error drawing user path:", error);
    }
  }, [mapInstance, userDrawing, user.id, isEditingPolygon, polygonCoordinates]);

  useEffect(() => {
    if (!mapInstance) return;

    const animate = () => {
      drawUserDrawing();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    const handleMapChange = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    mapInstance.on('move', handleMapChange);
    mapInstance.on('zoom', handleMapChange);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      mapInstance.off('move', handleMapChange);
      mapInstance.off('zoom', handleMapChange);
    };
  }, [drawUserDrawing]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
        drawUserDrawing();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawUserDrawing]);

  useEffect(() => {
    if (!mapInstance) return;

    if (isEditingPolygon && polygonCoordinates && polygonCoordinates.length >= 2) {
      try {
        const bounds = new mapboxgl.LngLatBounds();
        polygonCoordinates.forEach(point => {
          bounds.extend(point);
        });

        mapInstance.fitBounds(bounds, {
          padding: 50,
          duration: 0
        });
      } catch (err) {
        // Silently handle any errors with bounds
      }
      return;
    }

    if (userDrawing && userDrawing.points && userDrawing.points.length >= 2) {
      try {
        const bounds = new mapboxgl.LngLatBounds();

        userDrawing.points.forEach(point => {
          bounds.extend(point);
        });

        mapInstance.fitBounds(bounds, {
          padding: 50,
          duration: 0
        });
      } catch (err) {
        // Silently handle any errors with bounds
      }
    }
  }, [mapInstance, userDrawing, isEditingPolygon, polygonCoordinates]);

  const hasValidData = isEditingPolygon
    ? (polygonCoordinates && polygonCoordinates.length > 0)
    : (userDrawing && userDrawing.points && userDrawing.points.length > 0);

  return (
    <DraggableModal
      isResizable={true}
      defaultWidth="600px"
      defaultHeight="400px"
    >
      <PopupHeader className="popup-header">
        <HeaderTitle>
          {user.username}'s Drawing
          {user.activity?.type === 'drawing' && " (Drawing in progress)"}
          {user.activity?.type === 'editing' && ` (Editing polygon #${user.activity.polygonId})`}
        </HeaderTitle>
        <CloseButton onClick={onClose}>
          Close
        </CloseButton>
      </PopupHeader>
      <MapContainer>
        <div ref={mapContainerRef} style={{ position: 'absolute', inset: 0 }}></div>
        <MapCanvas ref={canvasRef} />

        {mapInstance && (
          <MapStyleSwitcher
            currentStyle={mapStyle}
            onStyleChange={setMapStyle}
          />
        )}

        {!hasValidData && (
          <NoDataOverlay>
            Waiting for drawing data...
          </NoDataOverlay>
        )}

        {hasValidData && (
          <DrawingInfoOverlay>
            {isEditingPolygon ? (
              <>
                <div><strong>Editing Polygon:</strong> #{user.activity?.polygonId}</div>
                <div><strong>Points:</strong> {polygonCoordinates?.length || 0}</div>
              </>
            ) : (
              <>
                <div><strong>Points:</strong> {userDrawing?.points?.length || 0}</div>
                <div><strong>Status:</strong> {userDrawing?.isCompleted ? 'Completed' : 'In Progress'}</div>
              </>
            )}
            <div><strong>Last Update:</strong> {new Date(lastUpdateTime).toLocaleTimeString()}</div>
          </DrawingInfoOverlay>
        )}
      </MapContainer>
    </DraggableModal>
  );
};
