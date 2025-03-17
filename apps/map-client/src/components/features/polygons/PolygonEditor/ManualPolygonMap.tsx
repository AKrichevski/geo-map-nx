import React, { useRef, useState, useEffect, useCallback } from 'react';
import mapboxgl, { Map, MapMouseEvent } from 'mapbox-gl';
import { useMapContext } from '../../../../contexts/MapContext';
import { getBoundsFromCoordinates } from '@geo-map-app/frontend-utils';
import socketService from '../../../../services/socket';
import MapStyleSwitcher from '../../../styledComponents/MapStyleSwitcher';
import { MapContainer } from '../../../styledComponents/backgroundMapStyles';
import { MapCanvasOverlay, MapDiv } from '../../../styledComponents/polygonEditor/manualPolygonMapStyles';
import { MouseCoordinates } from '../../../common/MouseCoordinates';

const mapboxToken = import.meta.env.VITE_MAPBOX_API_KEY;
if (mapboxToken) {
  mapboxgl.accessToken = mapboxToken;
}

export interface ManualPolygonMapProps {
  points: [number, number][];
  onPointsChange: (newPoints: [number, number][]) => void;
  updatePoints: (newPoints: [number, number][]) => void;
  strokeColor?: string;
  initialCenter?: [number, number] | null;
}

export const ManualPolygonMap: React.FC<ManualPolygonMapProps> = ({
                                                                    points,
                                                                    onPointsChange,
                                                                    updatePoints,
                                                                    strokeColor = '#3388ff',
                                                                    initialCenter = null
                                                                  }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragPointIndex, setDragPointIndex] = useState<number | null>(null);
  const [lastCursor, setLastCursor] = useState<string>('');

  const [mouseCoordinates, setMouseCoordinates] = useState<{ lng: number; lat: number } | null>(null);

  const { mapInstance: mainMapInstance, mapStyle, setMapStyle } = useMapContext();

  const bounds = getBoundsFromCoordinates(points)

  useEffect(() => {
    if (!mapContainerRef.current || mapInstance) return;
    let center;
    if (initialCenter && initialCenter.length === 2) {
      center = initialCenter;
    } else if (points && points.length > 0) {
      center = points[0];
    } else {
      center = mainMapInstance ? mainMapInstance.getCenter() : [-74.5, 40];
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: center,
      zoom: 10
    });

    map.on('load', () => {
      setMapInstance(map);

      if (points.length > 1 && bounds) {
        try {
          const mapboxBounds = new mapboxgl.LngLatBounds(
            [bounds.minLng, bounds.minLat],
            [bounds.maxLng, bounds.maxLat]
          );
          map.fitBounds(mapboxBounds, { padding: 50 });
        } catch (err) {
          console.error("Error fitting bounds:", err);
        }
      }
    });

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (mapInstance && mapStyle) {
      mapInstance.setStyle(mapStyle);
    }
  }, [mapStyle, mapInstance]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (context) setCtx(context);
  }, []);

  const getClickedPointIndex = useCallback((e: MapMouseEvent): number | null => {
    if (!mapInstance) return null;

    const CLICK_RADIUS = 10;
    const clickPoint = e.point;

    for (let i = 0; i < points.length; i++) {
      const pointScreen = mapInstance.project(points[i]);
      const distance = Math.sqrt(
        Math.pow(clickPoint.x - pointScreen.x, 2) +
        Math.pow(clickPoint.y - pointScreen.y, 2)
      );

      if (distance <= CLICK_RADIUS) {
        return i;
      }
    }
    return null;
  }, [mapInstance, points]);

  useEffect(() => {
    if (!mapInstance) return;

    const handleMouseDown = (e: MapMouseEvent) => {
      const pointIndex = getClickedPointIndex(e);

      if (pointIndex !== null) {
        setIsDragging(true);
        setDragPointIndex(pointIndex);
        setLastCursor(mapInstance.getCanvas().style.cursor);
        mapInstance.getCanvas().style.cursor = 'grab';
        mapInstance.dragPan.disable();
      }
    };

    const handleMouseMove = (e: MapMouseEvent) => {
      setMouseCoordinates({
        lng: Number(e.lngLat.lng.toFixed(4)),
        lat: Number(e.lngLat.lat.toFixed(4))
      });

      if (isDragging && dragPointIndex !== null) {
        const newPoints = [...points];
        newPoints[dragPointIndex] = [e.lngLat.lng, e.lngLat.lat];
        updatePoints(newPoints);
        mapInstance.getCanvas().style.cursor = 'grabbing';
      } else {
        const pointIndex = getClickedPointIndex(e);
        mapInstance.getCanvas().style.cursor = pointIndex !== null ? 'pointer' : '';
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragPointIndex(null);
        mapInstance.dragPan.enable();
        mapInstance.getCanvas().style.cursor = lastCursor;
      }
    };

    const handleClick = (e: MapMouseEvent) => {
      if (!isDragging) {
        const pointIndex = getClickedPointIndex(e);
        if (pointIndex === null) {
          socketService.addDrawingPoint([e.lngLat.lng, e.lngLat.lat]);
          onPointsChange([[e.lngLat.lng, e.lngLat.lat]]);
        }
      }
    };

    mapInstance.on('mousedown', handleMouseDown);
    mapInstance.on('mousemove', handleMouseMove);
    mapInstance.on('mouseup', handleMouseUp);
    mapInstance.on('click', handleClick);

    return () => {
      mapInstance.off('mousedown', handleMouseDown);
      mapInstance.off('mousemove', handleMouseMove);
      mapInstance.off('mouseup', handleMouseUp);
      mapInstance.off('click', handleClick);
    };
  }, [mapInstance, points, isDragging, dragPointIndex, lastCursor, getClickedPointIndex, onPointsChange, updatePoints]);

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !ctx || !mapInstance) return;
    const canvas = canvasRef.current;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    if (points.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;

      const firstPoint = mapInstance.project(points[0]);
      ctx.moveTo(firstPoint.x, firstPoint.y);

      for (let i = 1; i < points.length; i++) {
        const point = mapInstance.project(points[i]);
        ctx.lineTo(point.x, point.y);
      }

      if (points.length >= 3) {
        ctx.lineTo(firstPoint.x, firstPoint.y);
      }
      ctx.stroke();

      if (points.length >= 3) {
        ctx.fillStyle = `${strokeColor}33`;
        ctx.fill();
      }
    }

    points.forEach((point, index) => {
      const pos = mapInstance.project(point);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = dragPointIndex === index ? '#ffff00' : '#ff0000';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [mapInstance, points, ctx, strokeColor, dragPointIndex]);

  useEffect(() => {
    if (!mapInstance) return;

    const handleMapUpdate = () => {
      drawCanvas();
    };

    mapInstance.on('move', handleMapUpdate);
    mapInstance.on('zoom', handleMapUpdate);

    drawCanvas();

    return () => {
      mapInstance.off('move', handleMapUpdate);
      mapInstance.off('zoom', handleMapUpdate);
    };
  }, [mapInstance, ctx, drawCanvas]);

  useEffect(() => {
    if (mapInstance && ctx) {
      drawCanvas();
    }
  }, [mapInstance, ctx, points, drawCanvas]);

  return (
    <MapContainer>
      <MapDiv ref={mapContainerRef} />
      <MapCanvasOverlay ref={canvasRef} />
      {mapInstance && (
        <MapStyleSwitcher
          currentStyle={mapStyle}
          onStyleChange={setMapStyle}
        />
      )}
      {mouseCoordinates && (
        <MouseCoordinates
          lng={mouseCoordinates.lng}
          lat={mouseCoordinates.lat}
        />
      )}
    </MapContainer>
  );
};
