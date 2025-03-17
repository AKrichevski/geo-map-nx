import { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@geo-map-app/constants';
import { SocketHandlerState } from '../socket-types';
import { broadcastUserList, handleUserDisconnect } from '../socket-utils';

/**
 * Handles new user connections and disconnections
 */
export const setupConnectionHandler = (socket: Socket, state: SocketHandlerState): void => {
  console.log(`Client connected: ${socket.id}`);

  socket.on(SOCKET_EVENTS.USER_JOIN, (userData: { username: string }) => {
    const username = userData.username || `User-${socket.id.slice(0, 5)}`;

    if (state.usernameToSocketMap.has(username)) {
      const existingSocketId = state.usernameToSocketMap.get(username);

      if (existingSocketId && existingSocketId !== socket.id) {
        console.log(
          `Replacing existing connection for username: ${username}`
        );
        state.connectedUsers.delete(existingSocketId);

        const existingSocket = state.io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.disconnect(true);
        }
      }
    }

    state.usernameToSocketMap.set(username, socket.id);

    const userInfo = {
      id: socket.id,
      username: username,
      isOnline: true,
      lastActive: new Date().toISOString(),
    };

    state.connectedUsers.set(socket.id, userInfo);
    console.log(`User joined: ${userInfo.username} (${userInfo.id})`);

    broadcastUserList(state);
  });

  socket.on(SOCKET_EVENTS.USER_ACTIVITY, (data: {
    activity: {
      type: 'drawing' | 'editing';
      polygonId?: number;
      coordinates?: [number, number];
    } | null
  }) => {
    const user = state.connectedUsers.get(socket.id);
    if (!user) return;

    if (data.activity) {
      user.activity = data.activity;
      console.log(`User ${user.username} activity: ${data.activity.type}${data.activity.polygonId ? ` polygon #${data.activity.polygonId}` : ''}`);
    } else {
      delete user.activity;
      console.log(`User ${user.username} cleared activity`);
    }

    state.connectedUsers.set(socket.id, user);

    broadcastUserList(state);
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    handleUserDisconnect(state, socket.id);
  });
};
