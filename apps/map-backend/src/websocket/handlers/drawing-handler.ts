import { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@geo-map-app/constants';
import { DrawingData } from '@geo-map-app/types';
import { SocketHandlerState } from '../socket-types';
import { updateUserActivity } from '../socket-utils';

/**
 * Handles all drawing-related socket events
 */
export const setupDrawingHandler = (socket: Socket, state: SocketHandlerState): void => {
  socket.on('get-current-drawings', () => {
    for (const [userId, drawingData] of state.currentDrawings.entries()) {
      socket.emit('drawing-update', drawingData);
    }
  });

  socket.on('request-user-drawing', (targetUserId: string) => {
    const user = state.connectedUsers.get(socket.id);
    if (!user) return;

    const targetDrawing = state.currentDrawings.get(targetUserId);

    if (targetDrawing) {
      socket.emit('drawing-update', targetDrawing);
    } else {
      socket.emit('user-drawing-status', {
        userId: targetUserId,
        hasDrawing: false
      });
    }
  });

  socket.on('drawing-completed', () => {
    const user = state.connectedUsers.get(socket.id);
    if (!user) return;

    const drawing = state.currentDrawings.get(socket.id);
    if (drawing) {
      const completedDrawing = {
        ...drawing,
        isCompleted: true
      };

      state.currentDrawings.set(socket.id, completedDrawing);
      state.io.emit('drawing-update', completedDrawing);
    }

    socket.broadcast.emit('drawing-ended', { userId: socket.id });
  });

  socket.on(SOCKET_EVENTS.DRAWING_UPDATE, (drawingData: DrawingData) => {
    const user = state.connectedUsers.get(socket.id);
    if (!user) return;

    if (drawingData.points && drawingData.points.length > 0) {
      const lastPoint = drawingData.points[drawingData.points.length - 1];

      updateUserActivity(state, socket.id, {
        type: 'drawing',
        coordinates: [lastPoint[0], lastPoint[1]] as [number, number]
      });
    }

    const updatedDrawingData = {
      ...drawingData,
      userId: socket.id,
      username: user.username,
      timestamp: Date.now() // Add timestamp for tracking updates
    };

    state.currentDrawings.set(socket.id, updatedDrawingData);
    state.io.emit('drawing-update', updatedDrawingData);
  });

  socket.on('drawing-point-changed', (data: {
    action: 'add' | 'edit' | 'delete',
    pointIndex?: number,
    point?: [number, number]
  }) => {
    const user = state.connectedUsers.get(socket.id);
    if (!user) return;

    const currentDrawing = state.currentDrawings.get(socket.id);
    if (!currentDrawing || !currentDrawing.points) return;

    let updatedPoints = [...currentDrawing.points];

    switch(data.action) {
      case 'add':
        if (data.point) {
          updatedPoints.push(data.point);
        }
        break;

      case 'edit':
        if (data.pointIndex !== undefined && data.point) {
          if (updatedPoints[data.pointIndex]) {
            updatedPoints[data.pointIndex] = data.point;
          }
        }
        break;

      case 'delete':
        if (data.pointIndex !== undefined) {
          updatedPoints = updatedPoints.filter((_, i) => i !== data.pointIndex);
        }
        break;
    }

    const updatedDrawing = {
      ...currentDrawing,
      points: updatedPoints,
      timestamp: Date.now()
    };

    state.currentDrawings.set(socket.id, updatedDrawing);
    state.io.emit('drawing-update', updatedDrawing);

    if (updatedPoints.length > 0) {
      const lastPoint = updatedPoints[updatedPoints.length - 1];
      updateUserActivity(state, socket.id, {
        type: 'drawing',
        coordinates: [lastPoint[0], lastPoint[1]] as [number, number]
      });
    }
  });
};
