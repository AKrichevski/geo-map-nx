import { Request, Response } from 'express';
import { polygonModel } from '@geo-map-app/db';
import { MapBounds } from '@geo-map-app/types';

export class PolygonController {
  async getAllPolygons(req: Request, res: Response): Promise<void> {
    try {
      const polygons = await polygonModel.getAllPolygons();
      res.status(200).json(polygons);
    } catch (error) {
      console.error('Error fetching polygons:', error);
      res.status(500).json({ message: 'Failed to retrieve polygons' });
    }
  }

  async getPolygonsByLayerId(req: Request, res: Response): Promise<void> {
    try {
      const layerId = parseInt(req.params.layerId, 10);

      if (isNaN(layerId)) {
        res.status(400).json({ message: 'Invalid layer ID' });
        return;
      }

      const polygons = await polygonModel.getPolygonsByLayerId(layerId);
      res.status(200).json(polygons);
    } catch (error) {
      console.error('Error fetching polygons by layer ID:', error);
      res.status(500).json({ message: 'Failed to retrieve polygons' });
    }
  }

  async getPolygonById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid polygon ID' });
        return;
      }

      const polygon = await polygonModel.getPolygonById(id);

      if (!polygon) {
        res.status(404).json({ message: 'Polygon not found' });
        return;
      }

      res.status(200).json(polygon);
    } catch (error) {
      console.error('Error fetching polygon:', error);
      res.status(500).json({ message: 'Failed to retrieve polygon' });
    }
  }

  async createPolygon(req: Request, res: Response): Promise<void> {
    try {
      const { layerId, name, color, coordinates } = req.body;

      if (!layerId || !name || !color || !coordinates || !Array.isArray(coordinates)) {
        res.status(400).json({ message: 'Missing required polygon data' });
        return;
      }

      const sizeKm2 = req.body.sizeKm2

      const polygon = await polygonModel.savePolygon({
        layerId,
        name,
        color,
        coordinates,
        sizeKm2
      });

      res.status(201).json(polygon);
    } catch (error) {
      console.error('Error creating polygon:', error);
      res.status(500).json({ message: 'Failed to create polygon' });
    }
  }

  async updatePolygon(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid polygon ID' });
        return;
      }

      // Check if polygon exists
      const existingPolygon = await polygonModel.getPolygonById(id);

      if (!existingPolygon) {
        res.status(404).json({ message: 'Polygon not found' });
        return;
      }

      const updates: any = {};

      // Only update fields that are provided
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.color !== undefined) updates.color = req.body.color;
      if (req.body.layerId !== undefined) updates.layerId = req.body.layerId;

      if (req.body.coordinates) {
        updates.coordinates = req.body.coordinates;
        // Recalculate area if coordinates change
        // updates.sizeKm2 = polygonModel.calculateAreaSize(req.body.coordinates);
      }

      const updatedPolygon = await polygonModel.updatePolygon(id, updates);

      if (!updatedPolygon) {
        res.status(500).json({ message: 'Failed to update polygon' });
        return;
      }

      res.status(200).json(updatedPolygon);
    } catch (error) {
      console.error('Error updating polygon:', error);
      res.status(500).json({ message: 'Failed to update polygon' });
    }
  }

  async deletePolygon(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid polygon ID' });
        return;
      }

      const deleted = await polygonModel.deletePolygon(id);

      if (!deleted) {
        res.status(404).json({ message: 'Polygon not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting polygon:', error);
      res.status(500).json({ message: 'Failed to delete polygon' });
    }
  }

  async getPolygonsInBounds(req: Request, res: Response): Promise<void> {
    try {
      const { north, south, east, west } = req.query;

      // Validate bounds parameters
      if (!north || !south || !east || !west) {
        res.status(400).json({ message: 'Missing bounds parameters' });
        return;
      }

      const bounds: MapBounds = {
        north: parseFloat(north as string),
        south: parseFloat(south as string),
        east: parseFloat(east as string),
        west: parseFloat(west as string),
      };

      // Validate parsed values
      if (
        isNaN(bounds.north) ||
        isNaN(bounds.south) ||
        isNaN(bounds.east) ||
        isNaN(bounds.west)
      ) {
        res.status(400).json({ message: 'Invalid bounds parameters' });
        return;
      }

      const polygons = await polygonModel.getPolygonsInBounds(bounds);
      res.status(200).json(polygons);
    } catch (error) {
      console.error('Error fetching polygons in bounds:', error);
      res.status(500).json({ message: 'Failed to retrieve polygons in bounds' });
    }
  }
}

export const polygonController = new PolygonController();
