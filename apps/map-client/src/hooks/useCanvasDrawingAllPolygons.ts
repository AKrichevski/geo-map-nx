import { useRef, useCallback } from "react";
import { Map } from "mapbox-gl";
import { coordinates, PolygonData } from '@geo-map-app/types';
import colors from '../consts/colors';

export function useCanvasDrawingAllPolygons() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawAllPolygons = useCallback(
    (params: { mapInstance: Map; polygons: PolygonData[] }) => {
      const { mapInstance, polygons } = params;
      const canvas = canvasRef.current;
      if (!canvas || !mapInstance) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      polygons.forEach((polygon) => {
        if (!polygon.coordinates || !Array.isArray(polygon.coordinates) || polygon.coordinates.length === 0) {
          return;
        }

        let polygonCoords: coordinates;

        if (Array.isArray(polygon.coordinates[0]) &&
          Array.isArray(polygon.coordinates[0][0])) {
          polygonCoords = polygon.coordinates[0];
        } else if (Array.isArray(polygon.coordinates[0]) &&
          typeof polygon.coordinates[0][0] === 'number') {
          polygonCoords = polygon.coordinates;
        } else {
          return;
        }

        if (polygonCoords.length < 2) {
          return;
        }

        ctx.beginPath();
        ctx.strokeStyle = polygon.color || colors.black;
        ctx.lineWidth = 2;

        try {
          const firstPoint = mapInstance.project([
            polygonCoords[0][0],
            polygonCoords[0][1]
          ]);

          ctx.moveTo(firstPoint.x, firstPoint.y);

          polygonCoords.slice(1).forEach(coord => {
            if (!Array.isArray(coord) || coord.length < 2) {
              return;
            }

            try {
              const pos = mapInstance.project([coord[0], coord[1]]);
              ctx.lineTo(pos.x, pos.y);
            } catch (err) {
              console.error("Error projecting coordinate:", coord, err);
            }
          });

          if (polygonCoords.length >= 3) {
            ctx.closePath();
          }

          ctx.fillStyle = `${polygon.color}66`; // 40% opacity
          ctx.fill();
          ctx.stroke();
        } catch (error) {
          console.error("Error drawing polygon:", error, polygon);
        }
      });
    },
    []
  );

  return {
    canvasRef,
    drawAllPolygons,
  };
}
