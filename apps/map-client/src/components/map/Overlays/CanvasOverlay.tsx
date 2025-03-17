import React, { useRef, useEffect, useState } from 'react';
import { PolygonTooltip } from '../Tooltips/PolygonTooltip';
import { isPointInPolygon } from '@geo-map-app/frontend-utils';
import colors from '../../../consts/colors';

interface CanvasOverlayProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  polygons: any[];
  mapInstance: any;
}

export const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
                                                              canvasRef,
                                                              polygons = [],
                                                              mapInstance
                                                            }) => {
  const [hoveredPolygon, setHoveredPolygon] = useState<any>(null);
  const tooltipId = useRef(`polygon-tooltip-${Date.now()}`);

  useEffect(() => {
    if (!canvasRef.current || !mapInstance) return;

    const canvas = canvasRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const lngLat = mapInstance.unproject([x, y]);
      const point: [number, number] = [lngLat.lng, lngLat.lat];

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

      if (foundPolygon !== hoveredPolygon) {
        setHoveredPolygon(foundPolygon);

        if (foundPolygon) {
          canvas.setAttribute('data-tooltip-id', tooltipId.current);
          canvas.setAttribute('data-tooltip-html', 'true');
        } else {
          canvas.removeAttribute('data-tooltip-id');
          canvas.removeAttribute('data-tooltip-html');
        }
      }
    };

    const handleMouseLeave = () => {
      setHoveredPolygon(null);
      canvas.removeAttribute('data-tooltip-id');
      canvas.removeAttribute('data-tooltip-html');
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [canvasRef, mapInstance, polygons, hoveredPolygon]);

  const getTooltipData = () => {
    if (!hoveredPolygon) return null;

    const formattedAreaData = (() => {
      if (hoveredPolygon.sizeKm2 === undefined || hoveredPolygon.sizeKm2 === null) {
        return { areaValue: 0, areaUnit: 'km²' };
      }

      if (hoveredPolygon.sizeKm2 < 0.1) {
        const sizeM2 = Math.round(hoveredPolygon.sizeKm2 * 1000000);
        return {
          areaValue: sizeM2,
          areaUnit: 'm²'
        };
      }

      return {
        areaValue: parseFloat(hoveredPolygon.sizeKm2.toFixed(2)),
        areaUnit: 'km²'
      };
    })();

    return {
      name: hoveredPolygon.name || 'Unnamed Polygon',
      color: hoveredPolygon.color || colors.black,
      areaValue: formattedAreaData.areaValue,
      areaUnit: formattedAreaData.areaUnit,
      layerId: hoveredPolygon.layerId,
      createdAt: hoveredPolygon.createdAt
    };
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          width: "100%",
          height: "100%",
        }}
        data-tooltip-id={hoveredPolygon ? tooltipId.current : undefined}
      />

      {hoveredPolygon && (
        <PolygonTooltip
          polygonId={tooltipId.current}
          data={getTooltipData()}
        />
      )}
    </>
  );
};
