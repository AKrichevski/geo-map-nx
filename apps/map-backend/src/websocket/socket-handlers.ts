import { Server } from 'socket.io';
import { SocketHandlerState } from './socket-types';
import {
  setupConnectionHandler,
  setupDataHandler,
  setupDrawingHandler,
  setupLayerHandler,
  setupPolygonHandler
} from './handlers';

/**
 * Main function to set up all socket handlers
 */
export const setupSocketHandlers = (io: Server): void => {
  const state: SocketHandlerState = {
    io,
    connectedUsers: new Map(),
    currentDrawings: new Map(),
    polygonEditingStatus: new Map(),
    usernameToSocketMap: new Map()
  };

  io.on('connection', (socket) => {
    setupConnectionHandler(socket, state);
    setupDataHandler(socket, state);
    setupDrawingHandler(socket, state);
    setupLayerHandler(socket, state);
    setupPolygonHandler(socket, state);
  });
};
