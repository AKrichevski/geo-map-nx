// libs/db/src/lib/layer.model.ts
import { getDb } from './connection';
import { Layer, LayerInput } from '@geo-map-app/types';

// Layer model operations
export const layerModel = {
  saveLayer: async (layer: LayerInput): Promise<Layer> => {
    const db = await getDb();

    try {
      const result = await db.run(
        `INSERT INTO layers (name) VALUES (?)`,
        layer.name
      );

      const id = result.lastID;

      // Fetch the created layer
      const createdLayer = await db.get<Layer>(
        `SELECT id, name, created_at as createdAt, updated_at as updatedAt
         FROM layers WHERE id = ?`,
        id
      );

      if (!createdLayer) {
        throw new Error(`Failed to retrieve created layer with ID ${id}`);
      }

      return createdLayer;
    } finally {
      await db.close();
    }
  },

  getAllLayers: async (): Promise<Layer[]> => {
    const db = await getDb();

    try {
      return await db.all<Layer[]>(
        `SELECT id, name, created_at as createdAt, updated_at as updatedAt
         FROM layers
         ORDER BY created_at DESC`
      );
    } finally {
      await db.close();
    }
  },

  getLayerById: async (id: number): Promise<Layer | null> => {
    const db = await getDb();

    try {
      const layer = await db.get<Layer>(
        `SELECT id, name, created_at as createdAt, updated_at as updatedAt
         FROM layers
         WHERE id = ?`,
        id
      );

      return layer || null;
    } finally {
      await db.close();
    }
  },

  updateLayer: async (id: number, name: string): Promise<Layer | null> => {
    const db = await getDb();

    try {
      // Update the layer
      const result = await db.run(
        `UPDATE layers 
         SET name = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        name, id
      );

      if (result.changes === 0) {
        return null;
      }

      // Fetch the updated layer
      const updatedLayer = await db.get<Layer>(
        `SELECT id, name, created_at as createdAt, updated_at as updatedAt
         FROM layers
         WHERE id = ?`,
        id
      );

      return updatedLayer || null;
    } finally {
      await db.close();
    }
  },

  deleteLayer: async (id: number): Promise<boolean> => {
    const db = await getDb();

    try {
      // Begin transaction
      await db.run('BEGIN TRANSACTION');

      try {
        // Delete all polygons in this layer first
        await db.run(
          'DELETE FROM polygons WHERE layer_id = ?',
          id
        );

        // Delete the layer
        const result = await db.run(
          'DELETE FROM layers WHERE id = ?',
          id
        );

        // Commit transaction
        await db.run('COMMIT');

        return (result.changes ?? 0) > 0;
      } catch (error) {
        // Rollback on error
        console.error('Error in delete transaction:', error);
        await db.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteLayer:', error);
      return false;
    } finally {
      await db.close();
    }
  }
};
