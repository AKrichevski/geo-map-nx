import { Request, Response } from 'express';
import { layerModel } from '@geo-map-app/db';

export class LayerController {
  async getAllLayers(req: Request, res: Response): Promise<void> {
    try {
      const layers = await layerModel.getAllLayers();
      res.status(200).json(layers);
    } catch (error) {
      console.error('Error fetching layers:', error);
      res.status(500).json({ message: 'Failed to retrieve layers' });
    }
  }

  async getLayerById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid layer ID' });
        return;
      }

      const layer = await layerModel.getLayerById(id);

      if (!layer) {
        res.status(404).json({ message: 'Layer not found' });
        return;
      }

      res.status(200).json(layer);
    } catch (error) {
      console.error('Error fetching layer:', error);
      res.status(500).json({ message: 'Failed to retrieve layer' });
    }
  }

  async createLayer(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.body;

      if (!name) {
        res.status(400).json({ message: 'Layer name is required' });
        return;
      }

      const layer = await layerModel.saveLayer({ name });

      res.status(201).json(layer);
    } catch (error) {
      console.error('Error creating layer:', error);
      res.status(500).json({ message: 'Failed to create layer' });
    }
  }

  async updateLayer(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { name } = req.body;

      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid layer ID' });
        return;
      }

      if (!name) {
        res.status(400).json({ message: 'Layer name is required' });
        return;
      }

      const layer = await layerModel.updateLayer(id, name);

      if (!layer) {
        res.status(404).json({ message: 'Layer not found' });
        return;
      }

      res.status(200).json(layer);
    } catch (error) {
      console.error('Error updating layer:', error);
      res.status(500).json({ message: 'Failed to update layer' });
    }
  }

  async deleteLayer(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid layer ID' });
        return;
      }

      const deleted = await layerModel.deleteLayer(id);

      if (!deleted) {
        res.status(404).json({ message: 'Layer not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting layer:', error);
      res.status(500).json({ message: 'Failed to delete layer' });
    }
  }
}

export const layerController = new LayerController();
