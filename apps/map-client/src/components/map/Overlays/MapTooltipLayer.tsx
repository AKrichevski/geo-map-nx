import React, { useState, useEffect, useRef } from 'react';
import {
  AreaInfo,
  ColorIndicator, CreatedInfo,
  LayerInfo,
  PolygonName, TooltipContainer, TooltipContent,
  TooltipHeader
} from '../../styledComponents/toolTips/mapTooltipLayerStyles';

interface MapTooltipLayerProps {
  mapInstance: any;
  polygons: any[];
}

interface TooltipState {
  visible: boolean;
  content: React.ReactNode;
  x: number;
  y: number;
}


export const MapTooltipLayer: React.FC<MapTooltipLayerProps> = ({
                                                                  mapInstance,
                                                                  polygons
                                                                }) => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    content: null,
    x: 0,
    y: 0
  });

  const containerRef = useRef<HTMLDivElement>(null);

  function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
    const x = point[0];
    const y = point[1];

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  }

  useEffect(() => {
    if (!mapInstance) return;

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!containerRef.current) return;

      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      let foundPolygon = null;

      for (let i = polygons.length - 1; i >= 0; i--) {
        const polygon = polygons[i];
        let polygonCoords: number[][];

        if (Array.isArray(polygon.coordinates[0]) &&
          Array.isArray(polygon.coordinates[0][0])) {
          polygonCoords = polygon.coordinates[0];
        } else {
          polygonCoords = polygon.coordinates;
        }

        if (isPointInPolygon(point, polygonCoords)) {
          foundPolygon = polygon;
          break;
        }
      }

      if (foundPolygon) {
        let areaDisplay = '';
        if (foundPolygon.sizeKm2 !== undefined && foundPolygon.sizeKm2 !== null) {
          if (foundPolygon.sizeKm2 < 0.1) {
            const sizeM2 = Math.round(foundPolygon.sizeKm2 * 1000000);
            areaDisplay = `${sizeM2.toLocaleString()} m²`;
          } else {
            areaDisplay = `${foundPolygon.sizeKm2.toFixed(2)} km²`;
          }
        }

        const dateDisplay = foundPolygon.createdAt
          ? new Date(foundPolygon.createdAt).toLocaleDateString()
          : 'Unknown';

        const content = (
          <div>
            <TooltipHeader>
              <ColorIndicator $color={foundPolygon.color} />
              <PolygonName>{foundPolygon.name || 'Unnamed Polygon'}</PolygonName>
            </TooltipHeader>
            {areaDisplay && (
              <AreaInfo>
                <strong>Area:</strong> {areaDisplay}
              </AreaInfo>
            )}
            {foundPolygon.layerId && (
              <LayerInfo>
                <strong>Layer ID:</strong> {foundPolygon.layerId}
              </LayerInfo>
            )}
            <CreatedInfo>
              <strong>Created:</strong> {dateDisplay}
            </CreatedInfo>
          </div>
        );

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.originalEvent.clientX - rect.left + 10;
        const y = e.originalEvent.clientY - rect.top - 100;

        setTooltip({
          visible: true,
          content,
          x,
          y
        });
      } else {
        if (tooltip.visible) {
          setTooltip(prev => ({ ...prev, visible: false }));
        }
      }
    };

    const handleMouseLeave = () => {
      setTooltip(prev => ({ ...prev, visible: false }));
    };

    mapInstance.on('mousemove', handleMouseMove);
    mapInstance.on('mouseout', handleMouseLeave);

    return () => {
      mapInstance.off('mousemove', handleMouseMove);
      mapInstance.off('mouseout', handleMouseLeave);
    };
  }, [mapInstance, polygons, tooltip.visible]);

  return (
    <TooltipContainer ref={containerRef}>
      {tooltip.visible && (
        <TooltipContent $x={tooltip.x} $y={tooltip.y}>
          {tooltip.content}
        </TooltipContent>
      )}
    </TooltipContainer>
  );
};

export default MapTooltipLayer;
