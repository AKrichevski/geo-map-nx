import { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@geo-map-app/constants';
import { layerModel, polygonModel } from '@geo-map-app/db';
import { SocketHandlerState } from '../socket-types';

/**
 * Handles initial data loading and synchronization
 */
export const setupDataHandler = (socket: Socket, state: SocketHandlerState): void => {
  socket.on(SOCKET_EVENTS.REQUEST_INITIAL_DATA, async () => {
    try {
      const [layers, polygons] = await Promise.all([
        layerModel.getAllLayers(),
        polygonModel.getAllPolygons(),
      ]);

      socket.emit("initial-data", { layers, polygons });

      console.log(
        `Sent initial data to client ${socket.id}: ${layers.length} layers, ${polygons.length} polygons`
      );
    } catch (error) {
      console.error("Error sending initial data:", error);
      socket.emit("error", { message: "Failed to load initial data" });
    }
  });
};
