import { Socket } from 'socket.io';
import { SOCKET_EVENTS, MEASURE_NAMES } from '@geo-map-app/constants';
import {
  PolygonEditingData,
  PolygonCoordinateUpdateData,
  SavePolygonData,
  DeletePolygonData,
  MapBounds,
  coordinates,
  PolygonInput,
  Polygon
} from '@geo-map-app/types';
import { polygonModel } from '@geo-map-app/db';
import { calculatePolygonArea } from '@geo-map-app/utils';
import { SocketHandlerState } from '../socket-types';
import { updateUserActivity } from '../socket-utils';

/**
 * Handles all polygon-related socket events
 */
export const setupPolygonHandler = (socket: Socket, state: SocketHandlerState): void => {
  socket.on(SOCKET_EVENTS.GET_ALL_POLYGONS, async (_, callback) => {
    try {
      const polygons = await polygonModel.getAllPolygons();
      callback({ polygons });
    } catch (error) {
      console.error('Error fetching all polygons:', error);
      callback({ error: 'Failed to fetch polygons' });
    }
  });

  socket.on(SOCKET_EVENTS.GET_POLYGONS_BY_LAYER, async ({ layerId }: { layerId: number }, callback) => {
    try {
      const polygons = await polygonModel.getPolygonsByLayerId(layerId);
      callback({ polygons });
    } catch (error) {
      console.error(`Error fetching polygons for layer ${layerId}:`, error);
      callback({ error: 'Failed to fetch polygons' });
    }
  });

  socket.on(SOCKET_EVENTS.EDITING_POLYGON, (data: PolygonEditingData) => {
    const user = state.connectedUsers.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    const { polygonId, action } = data;

    if (action === 'start') {
      state.polygonEditingStatus.set(polygonId, { userId: socket.id, username: user.username });

      if (data.coordinates) {
        updateUserActivity(state, socket.id, {
          type: 'editing',
          polygonId: polygonId,
          coordinates: data.coordinates as [number, number]
        });
      } else {
        updateUserActivity(state, socket.id, {
          type: 'editing',
          polygonId: polygonId
        });
      }
    } else if (action === 'end') {
      state.polygonEditingStatus.delete(polygonId);
      updateUserActivity(state, socket.id, null);
    }

    const editingData = {
      polygonId,
      action,
      userId: socket.id,
      username: user.username,
      coordinates: data.coordinates
    };

    state.io.emit('polygon-editing', editingData);
  });

  socket.on(SOCKET_EVENTS.POLYGON_COORDINATES_UPDATE, (data: PolygonCoordinateUpdateData) => {
    const editingInfo = state.polygonEditingStatus.get(data.polygonId);
    const user = state.connectedUsers.get(socket.id);

    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    if (editingInfo && editingInfo.userId === socket.id) {
      if (data.coordinates && data.coordinates.length > 0 && user.activity) {
        const point = data.coordinates[data.coordinates.length - 1];

        updateUserActivity(state, socket.id, {
          ...user.activity,
          coordinates: [point[0], point[1]] as [number, number]
        });
      }

      socket.broadcast.emit('polygon-coordinates-update', data);
    } else {
      socket.emit('error', {
        message: 'You are not authorized to edit this polygon'
      });
    }
  });

  socket.on(SOCKET_EVENTS.CALCULATE_AREA, (data: { coordinates: coordinates }, callback) => {
    try {
      if (!data || !data.coordinates || !Array.isArray(data.coordinates)) {
        callback({ error: 'Invalid coordinates format' });
        return;
      }

      if (data.coordinates.length < 3) {
        callback({ error: 'A polygon needs at least 3 points for area calculation' });
        return;
      }

      for (let i = 0; i < data.coordinates.length; i++) {
        const point = data.coordinates[i];
        if (!Array.isArray(point) || point.length !== 2 ||
          typeof point[0] !== 'number' || typeof point[1] !== 'number') {
          callback({ error: `Invalid coordinate at index ${i}` });
          return;
        }

        const lon = point[0];
        const lat = point[1];
        if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
          console.warn(`Potentially invalid coordinate at index ${i}: [${lon}, ${lat}]`);
        }
      }

      const closedCoords = [...data.coordinates];
      const areaResult = calculatePolygonArea(closedCoords);

      console.log(`Area calculation for polygon with ${closedCoords.length} points: ${areaResult.value} ${areaResult.unit}`);

      callback({
        areaValue: areaResult.value,
        areaUnit: areaResult.unit,
        sizeKm2: areaResult.unit === MEASURE_NAMES.SQUARE_KILOMETER ? areaResult.value : areaResult.value / 1000000
      });
    } catch (error) {
      console.error('Error calculating area:', error);
      callback({ error: 'Failed to calculate area: ' + (error instanceof Error ? error.message : String(error)) });
    }
  });

  socket.on(SOCKET_EVENTS.SAVE_POLYGON, async (polygonData: SavePolygonData, callback) => {
    try {
      const user = state.connectedUsers.get(socket.id);
      if (!user) {
        callback({ error: 'User not found' });
        return;
      }

      console.log('Received save-polygon data:', JSON.stringify({
        userId: polygonData.userId,
        layerId: polygonData.layerId,
        name: polygonData.name,
        color: polygonData.color,
        pointsLength: polygonData.points?.length || 0,
        sizeKm2: polygonData.sizeKm2
      }));

      if (!polygonData) {
        callback({ error: 'Missing polygon data' });
        return;
      }

      if (!polygonData.layerId || typeof polygonData.layerId !== 'number') {
        callback({ error: 'Missing or invalid layerId' });
        return;
      }

      if (!polygonData.name || typeof polygonData.name !== 'string') {
        callback({ error: 'Missing or invalid name' });
        return;
      }

      if (!polygonData.color || typeof polygonData.color !== 'string') {
        callback({ error: 'Missing or invalid color' });
        return;
      }

      let points: coordinates = [];
      if (polygonData.points && Array.isArray(polygonData.points)) {
        points = polygonData.points;
      } else if (polygonData.coordinates && Array.isArray(polygonData.coordinates)) {
        points = polygonData.coordinates;
      } else {
        callback({ error: 'Missing or invalid points/coordinates data' });
        return;
      }

      if (points.length < 3) {
        callback({ error: 'A polygon needs at least 3 points' });
        return;
      }

      // Check each point is a valid [lng, lat] pair
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (!Array.isArray(point) || point.length !== 2 ||
          typeof point[0] !== 'number' || typeof point[1] !== 'number') {
          callback({ error: `Invalid coordinate at index ${i}: ${JSON.stringify(point)}` });
          return;
        }
      }

      console.log('Valid polygon data received:', {
        layerId: polygonData.layerId,
        name: polygonData.name,
        color: polygonData.color,
        pointsCount: points.length
      });

      let sizeKm2 = polygonData.sizeKm2;
      if (sizeKm2 === undefined) {
        try {
          const areaResult = calculatePolygonArea(points);
          if (typeof areaResult === 'number') {
            sizeKm2 = areaResult;
          } else if (areaResult && typeof areaResult === 'object' && 'value' in areaResult) {
            sizeKm2 = areaResult.unit === MEASURE_NAMES.SQUARE_KILOMETER ? areaResult.value : areaResult.value / 1000000;
          }
          console.log(`Calculated polygon area: ${sizeKm2} ${MEASURE_NAMES.SQUARE_KILOMETER}`);
        } catch (error) {
          console.error('Error calculating area:', error);
          sizeKm2 = 0; // Default to zero if calculation fails
        }
      }

      const polygonInput: PolygonInput = {
        layerId: polygonData.layerId,
        name: polygonData.name,
        color: polygonData.color,
        coordinates: points,
        sizeKm2: sizeKm2
      };

      const savedPolygon = await polygonModel.savePolygon(polygonInput);

      updateUserActivity(state, socket.id, null);

      state.currentDrawings.delete(user.id);
      state.io.emit('polygon-saved', savedPolygon);

      console.log(`Polygon saved by ${user.username}: ${savedPolygon.id}`);

      if (state.polygonEditingStatus.has(savedPolygon.id)) {
        state.polygonEditingStatus.delete(savedPolygon.id);
      }

      callback({ polygon: savedPolygon });
    } catch (err) {
      console.error('Error saving polygon:', err);
      callback({ error: 'Failed to save polygon: ' + (err instanceof Error ? err.message : String(err)) });
    }
  });

  socket.on(SOCKET_EVENTS.UPDATE_POLYGON, async ({ polygonId, updates }: { polygonId: number, updates: Partial<Polygon> }, callback) => {
    try {
      const user = state.connectedUsers.get(socket.id);
      if (!user) {
        callback({ error: 'User not found' });
        return;
      }

      const editingInfo = state.polygonEditingStatus.get(polygonId);
      if (editingInfo && editingInfo.userId !== socket.id) {
        callback({
          error: `Polygon is being edited by ${editingInfo.username}`
        });
        return;
      }

      const updatedPolygon = await polygonModel.updatePolygon(polygonId, updates);

      if (!updatedPolygon) {
        callback({ error: 'Polygon not found or could not be updated' });
        return;
      }

      updateUserActivity(state, socket.id, null);
      state.io.emit('polygon-updated', updatedPolygon);
      callback({ polygon: updatedPolygon });
    } catch (error) {
      console.error('Error updating polygon:', error);
      callback({ error: 'Failed to update polygon' });
    }
  });

  socket.on(SOCKET_EVENTS.DELETE_POLYGON, async (data: DeletePolygonData, callback) => {
    try {
      if (!data) {
        callback({ error: 'Missing data for polygon deletion' });
        return;
      }

      const user = state.connectedUsers.get(socket.id);
      if (!user) {
        callback({ error: 'User not found' });
        return;
      }

      let polygonId: number;
      if (typeof data.polygonId === 'string') {
        polygonId = parseInt(data.polygonId, 10);
        if (isNaN(polygonId)) {
          callback({ error: 'Invalid polygon ID format' });
          return;
        }
      } else if (typeof data.polygonId === 'number') {
        polygonId = data.polygonId;
      } else {
        callback({ error: 'Invalid polygon ID' });
        return;
      }

      const editingInfo = state.polygonEditingStatus.get(polygonId);
      if (editingInfo && editingInfo.userId !== socket.id) {
        callback({
          error: `Cannot delete: polygon is being edited by ${editingInfo.username}`
        });
        return;
      }

      const deleted = await polygonModel.deletePolygon(polygonId);

      if (!deleted) {
        callback({ error: 'Polygon not found or could not be deleted' });
        return;
      }

      state.polygonEditingStatus.delete(polygonId);

      if (user.activity && user.activity.polygonId === polygonId) {
        updateUserActivity(state, socket.id, null);
      }

      state.io.emit('polygon-deleted', polygonId);
      console.log(`Polygon ${polygonId} successfully deleted by ${user.username}`);
      callback({ success: true });
    } catch (err) {
      console.error('Error deleting polygon:', err);
      callback({
        error: 'Failed to delete polygon: ' +
          (err instanceof Error ? err.message : String(err)),
      });
    }
  });

  socket.on(SOCKET_EVENTS.MAP_BOUNDS, async (bounds: MapBounds) => {
    try {
      if (
        !bounds ||
        !bounds.north ||
        !bounds.south ||
        !bounds.east ||
        !bounds.west
      ) {
        socket.emit('error', { message: 'Invalid bounds format' });
        return;
      }

      const polygons = await polygonModel.getPolygonsInBounds(bounds);
      socket.emit('polygons-in-bounds', polygons);
    } catch (err) {
      console.error('Error getting polygons in bounds:', err);
      socket.emit('error', { message: 'Failed to get polygons in bounds' });
    }
  });
};
