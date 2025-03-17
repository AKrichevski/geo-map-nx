import socketService from '../services/socket';
import { DrawingData } from '@geo-map-app/types';

/**
 * Utility functions for managing realtime drawing state
 */
export const realtimeDrawingUtils = {
  /**
   * Clear the current user's drawing data
   * This should be called when canceling a drawing or after saving
   */
  clearCurrentDrawing(): void {
    // Send drawing-ended event to notify other clients
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('drawing-ended', { userId: socket.id });
    }

    // Clear current drawing activity
    socketService.setUserActivity(null);
  },

  /**
   * Update a drawing with new points
   * @param points The current points in the drawing
   * @param isCompleted Whether the drawing is completed
   */
  updateDrawing(points: [number, number][], isCompleted: boolean = false): void {
    const socket = socketService.getSocket();
    if (!socket) return;

    const drawingData: DrawingData = {
      points,
      isCompleted,
      userId: socket.id // Will be overridden by server but included for completeness
    };

    // Update activity status if we have points
    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      socketService.setUserActivity({
        type: 'drawing',
        coordinates: lastPoint
      });
    }

    // Emit drawing update
    socket.emit('drawing-update', drawingData);
  },

  /**
   * Add a single point to the current drawing
   * @param point The point to add
   */
  addDrawingPoint(point: [number, number]): void {
    socketService.addDrawingPoint(point);
  }
};

export default realtimeDrawingUtils;
