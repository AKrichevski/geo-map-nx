import { Application } from 'express';
import { layerController } from './layer.controller';
import { polygonController } from './polygon.controller';

export const setupRoutes = (app: Application): void => {
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Layer routes
  app.get('/api/layers', layerController.getAllLayers.bind(layerController));
  app.get('/api/layers/:id', layerController.getLayerById.bind(layerController));
  app.post('/api/layers', layerController.createLayer.bind(layerController));
  app.put('/api/layers/:id', layerController.updateLayer.bind(layerController));
  app.delete('/api/layers/:id', layerController.deleteLayer.bind(layerController));

  // Polygon routes
  app.get('/api/polygons', polygonController.getAllPolygons.bind(polygonController));
  app.get('/api/polygons/layer/:layerId', polygonController.getPolygonsByLayerId.bind(polygonController));
  app.get('/api/polygons/in-bounds', polygonController.getPolygonsInBounds.bind(polygonController));
  app.get('/api/polygons/:id', polygonController.getPolygonById.bind(polygonController));
  app.post('/api/polygons', polygonController.createPolygon.bind(polygonController));
  app.put('/api/polygons/:id', polygonController.updatePolygon.bind(polygonController));
  app.delete('/api/polygons/:id', polygonController.deletePolygon.bind(polygonController));
};
