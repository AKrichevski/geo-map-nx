// libs/utils/src/lib/geojson.ts

import { calculatePolygonArea } from './calculatePolygonArea';

/**
 * Types for GeoJSON objects according to the GeoJSON specification
 * @see https://tools.ietf.org/html/rfc7946
 */

export type Position = [number, number]; // [longitude, latitude]
export type CoordinateArray = Position[]; // Array of positions for a LineString
export type PolygonCoordinates = CoordinateArray[]; // Array of LinearRings (first is exterior, rest are holes)

export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export type GeoJSON = GeoJSONGeometry | GeoJSONFeature | GeoJSONFeatureCollection;

/**
 * Creates a GeoJSON Polygon feature from an array of coordinates
 * @param coordinates - Array of [lng, lat] positions defining the polygon
 * @param properties - Optional properties to include in the GeoJSON feature
 * @returns GeoJSON Feature with Polygon geometry
 */
export function createPolygonFeature(
  coordinates: CoordinateArray,
  properties: Record<string, any> = {}
): GeoJSONFeature {
  // Make sure the polygon is closed (first point equals last point)
  const closedCoords = ensureClosedPolygon(coordinates);

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [closedCoords]
    },
    properties
  };
}

/**
 * Creates a GeoJSON FeatureCollection containing multiple polygon features
 * @param polygons - Array of polygon data with coordinates and properties
 * @returns GeoJSON FeatureCollection
 */
export function createFeatureCollection(
  polygons: Array<{
    coordinates: CoordinateArray;
    properties: Record<string, any>;
  }>
): GeoJSONFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: polygons.map(({ coordinates, properties }) =>
      createPolygonFeature(coordinates, properties)
    )
  };
}

/**
 * Ensures a polygon is closed (first point equals last point)
 * @param coordinates - Array of coordinates
 * @returns Closed array of coordinates
 */
export function ensureClosedPolygon(coordinates: CoordinateArray): CoordinateArray {
  if (coordinates.length === 0) return coordinates;

  const firstPoint = coordinates[0];
  const lastPoint = coordinates[coordinates.length - 1];

  // Check if the polygon is already closed
  if (
    firstPoint[0] === lastPoint[0] &&
    firstPoint[1] === lastPoint[1]
  ) {
    return coordinates;
  }

  // Close the polygon by adding the first point at the end
  return [...coordinates, firstPoint];
}

/**
 * Extracts coordinates from a GeoJSON Feature or Geometry
 * @param geojson - GeoJSON Polygon feature or geometry
 * @returns Array of coordinates or null if invalid input
 */
export function extractCoordinatesFromGeoJSON(
  geojson: GeoJSON
): CoordinateArray | null {
  try {
    if (!geojson) return null;

    // Handle Feature
    if ('type' in geojson && geojson.type === 'Feature' && 'geometry' in geojson) {
      const geometry = geojson.geometry;
      if (geometry.type !== 'Polygon') return null;

      // Get the first linear ring (exterior ring)
      return geometry.coordinates[0] as CoordinateArray;
    }

    // Handle Geometry
    if ('type' in geojson && geojson.type === 'Polygon' && 'coordinates' in geojson) {
      return geojson.coordinates[0] as CoordinateArray;
    }

    return null;
  } catch (error) {
    console.error('Error extracting coordinates from GeoJSON:', error);
    return null;
  }
}

/**
 * Parses a GeoJSON string and returns a GeoJSON object
 * @param jsonString - GeoJSON string to parse
 * @returns Parsed GeoJSON object or null if parsing fails
 */
export function parseGeoJSON(jsonString: string): GeoJSON | null {
  try {
    const parsed = JSON.parse(jsonString);

    // Validate basic GeoJSON structure
    if (!parsed || !parsed.type) {
      console.error('Invalid GeoJSON: missing type property');
      return null;
    }

    return parsed as GeoJSON;
  } catch (error) {
    console.error('Error parsing GeoJSON string:', error);
    return null;
  }
}

/**
 * Calculates the area of a polygon in square kilometers
 * @param coordinates - Array of coordinates defining the polygon
 * @returns Area in square kilometers
 */
export function calculatePolygonAreaFromCoordinates(
  coordinates: CoordinateArray
): number {
  // Get the AreaResult object from the calculation function
  const areaResult = calculatePolygonArea(coordinates);

  // If the result is already in km², return the value directly
  if (typeof areaResult === 'number') {
    return areaResult;
  }

  // If the result is an object with value and unit properties
  if (areaResult && typeof areaResult === 'object' && 'value' in areaResult && 'unit' in areaResult) {
    // Convert to km² if necessary
    if (areaResult.unit === 'm²') {
      return areaResult.value / 1000000; // Convert m² to km²
    } else {
      return areaResult.value; // Already in km²
    }
  }

  // Fallback to 0 if we can't determine the area
  return 0;
}

/**
 * Calculates the centroid of a polygon
 * @param coordinates - Array of coordinates defining the polygon
 * @returns Centroid as [lng, lat] or null if calculation fails
 */
export function calculatePolygonCentroid(
  coordinates: CoordinateArray
): Position | null {
  try {
    if (coordinates.length < 3) return null;

    let sumX = 0;
    let sumY = 0;

    // Simple centroid calculation (average of all coordinates)
    for (const point of coordinates) {
      sumX += point[0];
      sumY += point[1];
    }

    return [
      sumX / coordinates.length,
      sumY / coordinates.length
    ];
  } catch (error) {
    console.error('Error calculating polygon centroid:', error);
    return null;
  }
}

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
 * Simplifies a polygon by reducing the number of points while preserving shape
 * Uses the Ramer-Douglas-Peucker algorithm
 * @param coordinates - Array of coordinates defining the polygon
 * @param tolerance - Tolerance for simplification (higher = more simplification)
 * @returns Simplified array of coordinates
 */
export function simplifyPolygon(
  coordinates: CoordinateArray,
  tolerance: number = 0.00001
): CoordinateArray {
  if (coordinates.length <= 2) return coordinates;

  // Implementation of Ramer-Douglas-Peucker algorithm
  const findPerpendicularDistance = (p: Position, p1: Position, p2: Position): number => {
    const [x, y] = p;
    const [x1, y1] = p1;
    const [x2, y2] = p2;

    // If p1 and p2 are the same point, return distance from p to p1
    if (x1 === x2 && y1 === y2) {
      return Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
    }

    // Calculate perpendicular distance
    const numerator = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
    const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

    return numerator / denominator;
  };

  const douglasPeucker = (points: CoordinateArray, startIndex: number, endIndex: number): CoordinateArray => {
    // Find the point with the maximum distance
    let maxDistance = 0;
    let maxDistanceIndex = 0;

    for (let i = startIndex + 1; i < endIndex; i++) {
      const distance = findPerpendicularDistance(
        points[i],
        points[startIndex],
        points[endIndex]
      );

      if (distance > maxDistance) {
        maxDistance = distance;
        maxDistanceIndex = i;
      }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance) {
      const results1 = douglasPeucker(points, startIndex, maxDistanceIndex);
      const results2 = douglasPeucker(points, maxDistanceIndex, endIndex);

      // Combine the results (remove duplicate point)
      return [...results1.slice(0, -1), ...results2];
    } else {
      // Remove all points between startIndex and endIndex
      return [points[startIndex], points[endIndex]];
    }
  };

  // Make sure the polygon is closed
  const closedCoords = ensureClosedPolygon(coordinates);

  // Apply the algorithm to the closed polygon
  const simplified = douglasPeucker(closedCoords, 0, closedCoords.length - 1);

  return simplified;
}

/**
 * Converts Mapbox bounds to a GeoJSON polygon
 * @param bounds - Mapbox bounds object with north, south, east, west properties
 * @returns GeoJSON Polygon feature representing the bounds
 */
export function boundsToPolygon(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): GeoJSONFeature {
  const { north, south, east, west } = bounds;

  // Create a polygon from the bounds (counterclockwise)
  const coordinates: CoordinateArray = [
    [west, south], // bottom-left
    [west, north], // top-left
    [east, north], // top-right
    [east, south], // bottom-right
    [west, south]  // back to start (closed polygon)
  ];

  return createPolygonFeature(coordinates, { source: 'map-bounds' });
}

/**
 * Creates a GeoJSON WGS84 bounding box from a set of coordinates
 * @param coordinates - Array of coordinates
 * @returns Bounding box as [west, south, east, north]
 */
export function getBoundingBox(coordinates: CoordinateArray): [number, number, number, number] {
  if (coordinates.length === 0) {
    throw new Error('Cannot calculate bounding box for empty coordinates');
  }

  let west = coordinates[0][0];
  let south = coordinates[0][1];
  let east = coordinates[0][0];
  let north = coordinates[0][1];

  for (const point of coordinates) {
    const [lng, lat] = point;

    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }

  return [west, south, east, north];
}

/**
 * Converts DB polygon format to GeoJSON feature
 * @param polygon - Polygon from database
 * @returns GeoJSON Feature
 */
export function dbPolygonToGeoJSON(polygon: {
  id: number;
  layerId: number;
  name: string;
  color: string;
  coordinates: CoordinateArray;
  sizeKm2: number;
  createdAt: string;
  updatedAt: string;
}): GeoJSONFeature {
  return createPolygonFeature(polygon.coordinates, {
    id: polygon.id,
    layerId: polygon.layerId,
    name: polygon.name,
    color: polygon.color,
    sizeKm2: polygon.sizeKm2,
    createdAt: polygon.createdAt,
    updatedAt: polygon.updatedAt
  });
}

/**
 * Converts GeoJSON feature to DB polygon format
 * @param feature - GeoJSON Feature
 * @param layerId - Layer ID for the polygon
 * @returns Polygon in DB format
 */
export function geoJSONToDbPolygon(
  feature: GeoJSONFeature,
  layerId: number
): {
  layerId: number;
  name: string;
  color: string;
  coordinates: CoordinateArray;
  sizeKm2: number;
} {
  if (feature.geometry.type !== 'Polygon') {
    throw new Error('GeoJSON feature must be a Polygon');
  }

  const coordinates = feature.geometry.coordinates[0] as CoordinateArray;
  const props = feature.properties || {};

  // Convert area to number
  const areaResult = calculatePolygonArea(coordinates);
  let sizeKm2: number;

  if (typeof areaResult === 'number') {
    sizeKm2 = areaResult;
  } else if (areaResult && typeof areaResult === 'object' && 'value' in areaResult && 'unit' in areaResult) {
    // Convert to km² if necessary
    sizeKm2 = areaResult.unit === 'm²' ? areaResult.value / 1000000 : areaResult.value;
  } else {
    sizeKm2 = props.sizeKm2 || 0;
  }

  return {
    layerId,
    name: props.name || 'Unnamed Polygon',
    color: props.color || '#3388ff',
    coordinates,
    sizeKm2
  };
}
