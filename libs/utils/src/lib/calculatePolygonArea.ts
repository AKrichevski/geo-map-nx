import * as turf from '@turf/turf';
import { coordinates } from '@geo-map-app/types';

// Define the interface for area calculation results
export interface AreaResult {
  value: number;
  unit: 'km²' | 'm²';
}

/**
 * Calculates the area of a polygon on a spherical surface (Earth) using Turf.js
 * @param coords Array of coordinates as [longitude, latitude] pairs
 * @returns Object containing area value and unit (km² or m²) or number for backward compatibility
 */
export const calculatePolygonArea = (coords: coordinates): AreaResult => {
  // Validate input
  if (!coords) {
    console.warn('calculatePolygonArea received undefined coordinates');
    return { value: 0, unit: 'm²' };
  }

  if (!Array.isArray(coords)) {
    console.warn(`calculatePolygonArea expected array, got ${typeof coords}`);
    return { value: 0, unit: 'm²' };
  }

  if (coords.length < 3) {
    console.warn(`calculatePolygonArea needs at least 3 points, got ${coords.length}`);
    return { value: 0, unit: 'm²' }; // A polygon needs at least 3 points
  }

  try {
    // IMPORTANT: Verify coordinate ordering
    // Mapbox GL and Turf both use [longitude, latitude] format
    // Let's validate the range to make sure they're not reversed
    const hasValidCoordinates = coords.every(point => {
      // Longitude range: -180 to 180
      // Latitude range: -90 to 90
      const lon = point[0];
      const lat = point[1];
      return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
    });

    if (!hasValidCoordinates) {
      console.warn("Invalid coordinates detected. Longitude should be in range -180 to 180, latitude -90 to 90");
    }

    // Create a closed polygon if it's not already closed
    let closedCoords = [...coords];
    const firstPoint = coords[0];
    const lastPoint = coords[coords.length - 1];

    // Add the first point at the end to close the polygon if needed
    if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
      closedCoords.push(firstPoint);
    }

    // Create a proper GeoJSON polygon
    const polygon = turf.polygon([closedCoords]);

    // Calculate area in square meters
    const areaInSqMeters = turf.area(polygon);

    // Determine appropriate unit based on size
    // If area is smaller than 1 km² (1,000,000 m²), return in m²
    if (areaInSqMeters < 1000000) {
      // Round to nearest integer for m²
      const roundedAreaInSqMeters = Math.max(1, Math.round(areaInSqMeters));
      console.log(`Area calculated: ${roundedAreaInSqMeters} m²`);
      return { value: roundedAreaInSqMeters, unit: 'm²' };
    } else {
      // Convert to km² for larger areas and round to 2 decimal places
      const areaInSqKm = parseFloat((areaInSqMeters / 1000000).toFixed(2));
      console.log(`Area calculated: ${areaInSqKm} km²`);
      return { value: areaInSqKm, unit: 'km²' };
    }
  } catch (error) {
    console.error('Error calculating polygon area with Turf.js:', error);
    return { value: 0, unit: 'm²' };
  }
};

/**
 * For backward compatibility - returns just the area value in km²
 * @param coords Array of coordinates as [longitude, latitude] pairs
 * @returns Area in square kilometers
 */
export function getAreaInSquareKilometers(coords: coordinates): number {
  const result = calculatePolygonArea(coords);
  // Convert to km² if in m²
  return result.unit === 'm²' ? result.value / 1000000 : result.value;
}
