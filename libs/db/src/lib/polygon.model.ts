// libs/db/src/lib/polygon.model.ts
import { getDb } from './connection';
import { Polygon, PolygonInput, MapBounds } from '@geo-map-app/types';
import { getAreaInSquareKilometers } from '@geo-map-app/utils';

interface PolygonDbResult {
  id: number;
  layerId: number;
  name: string;
  color: string;
  sizeKm2: number;
  geometryJson: string;
  createdAt: string;
  updatedAt: string;
}

// Polygon model operations
export const polygonModel = {
  // In libs/db/src/lib/polygon.model.ts - update the savePolygon method

  savePolygon: async (polygon: PolygonInput): Promise<Polygon> => {
    const db = await getDb();

    try {
      // Validate the coordinates
      if (!polygon.coordinates || !Array.isArray(polygon.coordinates) || polygon.coordinates.length < 3) {
        throw new Error('Invalid polygon coordinates: A polygon needs at least 3 points');
      }

      // Store geometry as JSON
      const geometryJson = JSON.stringify({
        type: 'Polygon',
        coordinates: [polygon.coordinates],
      });

      let sizeKm2 = polygon.sizeKm2;
      if (sizeKm2 === undefined) {
        sizeKm2 = getAreaInSquareKilometers(polygon.coordinates);
      }

      console.log(`Saving polygon '${polygon.name}' with area: ${sizeKm2} ${'km²'} and ${polygon.coordinates.length} points`);

      // Insert the polygon
      const result = await db.run(
        `INSERT INTO polygons (layer_id, name, color, size_km2, geometry_json)
       VALUES (?, ?, ?, ?, ?)`,
        polygon.layerId,
        polygon.name,
        polygon.color,
        sizeKm2,
        geometryJson
      );

      const id = result.lastID;

      // Fetch the created polygon
      const savedPolygon = await db.get<PolygonDbResult>(
        `SELECT id, layer_id as layerId, name, color, size_km2 as sizeKm2,
              geometry_json as geometryJson, created_at as createdAt, updated_at as updatedAt
       FROM polygons WHERE id = ?`,
        id
      );

      if (!savedPolygon) {
        throw new Error(`Failed to retrieve created polygon with ID ${id}`);
      }

      // Parse the JSON geometry
      const geometryData = JSON.parse(savedPolygon.geometryJson);
      const coordinates = geometryData.coordinates[0];

      return {
        ...savedPolygon,
        coordinates,
        geometryJson: undefined,
      } as Polygon;
    } catch (error: any) {
      console.error('Error saving polygon:', error);
      throw error;
    } finally {
      await db.close();
    }
  },

  updatePolygon: async (id: number, updates: Partial<PolygonInput>): Promise<Polygon | null> => {
    const db = await getDb();

    try {
      // Build the query parts
      let query = 'UPDATE polygons SET updated_at = CURRENT_TIMESTAMP';
      const params: any[] = [];

      // Add fields that need to be updated
      if (updates.name !== undefined) {
        query += ', name = ?';
        params.push(updates.name);
      }

      if (updates.color !== undefined) {
        query += ', color = ?';
        params.push(updates.color);
      }

      if (updates.layerId !== undefined) {
        query += ', layer_id = ?';
        params.push(updates.layerId);
      }

      if (updates.sizeKm2 !== undefined) {
        query += ', size_km2 = ?';
        params.push(updates.sizeKm2);
      }

      // Handle coordinates update
      if (updates.coordinates !== undefined) {
        const geometryJson = JSON.stringify({
          type: 'Polygon',
          coordinates: [updates.coordinates],
        });
        query += ', geometry_json = ?';
        params.push(geometryJson);

        // Recalculate area if coordinates changed and sizeKm2 wasn't explicitly provided
        if (updates.sizeKm2 === undefined) {
          // Use the helper function that returns a number in km²
          const newSizeKm2 = getAreaInSquareKilometers(updates.coordinates);
          query += ', size_km2 = ?';
          params.push(newSizeKm2);
        }
      }

      // Complete the query
      query += ' WHERE id = ?';
      params.push(id);

      // Execute update
      const result = await db.run(query, ...params);

      if ((result.changes ?? 0) === 0) {
        return null;
      }

      // Fetch the updated polygon
      return await polygonModel.getPolygonById(id);
    } finally {
      await db.close();
    }
  },

  getPolygonById: async (id: number): Promise<Polygon | null> => {
    const db = await getDb();

    try {
      const polygon = await db.get<PolygonDbResult>(
        `SELECT id, layer_id as layerId, name, color, size_km2 as sizeKm2,
                geometry_json as geometryJson, created_at as createdAt, updated_at as updatedAt
         FROM polygons
         WHERE id = ?`,
        id
      );

      if (!polygon) return null;

      // Parse the JSON geometry
      const geometryData = JSON.parse(polygon.geometryJson);
      const coordinates = geometryData.coordinates[0];

      return {
        ...polygon,
        coordinates,
        geometryJson: undefined,
      } as Polygon;
    } finally {
      await db.close();
    }
  },

  getAllPolygons: async (): Promise<Polygon[]> => {
    const db = await getDb();

    try {
      const polygons = await db.all<PolygonDbResult[]>(
        `SELECT id, layer_id as layerId, name, color, size_km2 as sizeKm2,
                geometry_json as geometryJson, created_at as createdAt, updated_at as updatedAt
         FROM polygons`
      );

      // Parse the JSON geometry for each polygon
      return polygons.map(polygon => {
        const geometryData = JSON.parse(polygon.geometryJson);
        const coordinates = geometryData.coordinates[0];

        return {
          ...polygon,
          coordinates,
          geometryJson: undefined,
        } as Polygon;
      });
    } finally {
      await db.close();
    }
  },

  getPolygonsByLayerId: async (layerId: number): Promise<Polygon[]> => {
    const db = await getDb();

    try {
      const polygons = await db.all<PolygonDbResult[]>(
        `SELECT id, layer_id as layerId, name, color, size_km2 as sizeKm2,
                geometry_json as geometryJson, created_at as createdAt, updated_at as updatedAt
         FROM polygons
         WHERE layer_id = ?`,
        layerId
      );

      // Parse the JSON geometry for each polygon
      return polygons.map(polygon => {
        const geometryData = JSON.parse(polygon.geometryJson);
        const coordinates = geometryData.coordinates[0];

        return {
          ...polygon,
          coordinates,
          geometryJson: undefined,
        } as Polygon;
      });
    } finally {
      await db.close();
    }
  },

  deletePolygon: async (id: number): Promise<boolean> => {
    const db = await getDb();

    try {
      const result = await db.run(
        'DELETE FROM polygons WHERE id = ?',
        id
      );

      return (result.changes ?? 0) > 0;
    } finally {
      await db.close();
    }
  },

  getPolygonsInBounds: async (bounds: MapBounds): Promise<Polygon[]> => {
    // With regular SQLite, we need to fetch all polygons and filter them in memory
    const allPolygons = await polygonModel.getAllPolygons();

    // Filter polygons by bounds
    return allPolygons.filter((polygon: Polygon) => {
      // Simple check if any point is within bounds
      return polygon.coordinates.some(
        (point: number[]) =>
          point[0] >= bounds.south &&
          point[0] <= bounds.north &&
          point[1] >= bounds.west &&
          point[1] <= bounds.east
      );
    });
  },
};
