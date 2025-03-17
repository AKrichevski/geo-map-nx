// libs/frontend-utils/src/lib/geojson.ts

export type Position = [number, number]; // [longitude, latitude]
export type PositionArray = [number, number][]; // [longitude, latitude]

export type CoordinateArray = Position[]; // Array of positions for a LineString

/**
 * Checks if a point is inside a polygon
 * @param point - Point as [lng, lat]
 * @param polygon - Array of coordinates defining the polygon
 * @returns True if the point is inside the polygon
 */
export function isPointInPolygon(point: Position, polygon: CoordinateArray): boolean {
  // Ray casting algorithm
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

/**
 * Calculate bounding box from a set of coordinates
 * @param points - Array of [lng, lat] points
 * @returns Bounding box object with min/max lng/lat or null if no points
 */
export const getBoundsFromCoordinates = (points: PositionArray) => {
  return points.length > 0 ? points.reduce(
    (box, coord) => ({
      minLng: Math.min(box.minLng, coord[0]),
      maxLng: Math.max(box.maxLng, coord[0]),
      minLat: Math.min(box.minLat, coord[1]),
      maxLat: Math.max(box.maxLat, coord[1])
    }),
    { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
  ) : null;
}
