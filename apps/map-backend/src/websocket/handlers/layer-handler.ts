import { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@geo-map-app/constants';
import { LayerInput, Layer } from '@geo-map-app/types';
import { layerModel } from '@geo-map-app/db';
import { SocketHandlerState } from '../socket-types';

/**
 * Handles all layer-related socket events
 */
export const setupLayerHandler = (socket: Socket, state: SocketHandlerState): void => {
  socket.on(SOCKET_EVENTS.GET_ALL_LAYERS, async (_, callback) => {
    try {
      const layers = await layerModel.getAllLayers();
      callback({ layers });
    } catch (error) {
      console.error('Error fetching all layers:', error);
      callback({ error: 'Failed to fetch layers' });
    }
  });

  socket.on(SOCKET_EVENTS.CREATE_LAYER, async (layerInput: LayerInput, callback) => {
    try {
      const user = state.connectedUsers.get(socket.id);
      if (!user) {
        callback({ error: 'User not found' });
        return;
      }

      const layer = await layerModel.saveLayer(layerInput);

      state.io.emit('layer-created', layer);

      callback({ layer });
    } catch (error) {
      console.error('Error creating layer:', error);
      callback({ error: 'Failed to create layer' });
    }
  });

  socket.on(SOCKET_EVENTS.UPDATE_LAYER, async ({ layerId, updates }: { layerId: number, updates: Partial<Layer> }, callback) => {
    try {
      const user = state.connectedUsers.get(socket.id);
      if (!user) {
        callback({ error: 'User not found' });
        return;
      }

      if (!updates.name) {
        callback({ error: 'Layer name is required' });
        return;
      }

      const updatedLayer = await layerModel.updateLayer(layerId, updates.name);

      if (!updatedLayer) {
        callback({ error: 'Layer not found' });
        return;
      }

      state.io.emit('layer-updated', updatedLayer);

      callback({ layer: updatedLayer });
    } catch (error) {
      console.error('Error updating layer:', error);
      callback({ error: 'Failed to update layer' });
    }
  });

  socket.on(SOCKET_EVENTS.DELETE_LAYER, async ({ layerId }: { layerId: number }, callback) => {
    try {
      const user = state.connectedUsers.get(socket.id);
      if (!user) {
        callback({ error: 'User not found' });
        return;
      }

      const deleted = await layerModel.deleteLayer(layerId);

      if (!deleted) {
        callback({ error: 'Layer not found or could not be deleted' });
        return;
      }

      state.io.emit('layer-deleted', layerId);

      callback({ success: true });
    } catch (error) {
      console.error('Error deleting layer:', error);
      callback({ error: 'Failed to delete layer' });
    }
  });
};
