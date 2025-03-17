import { ExtendedUserInfo, SocketHandlerState } from './socket-types';

/**
 * Gets a list of unique users from the connected users map
 * Ensures each username appears only once in the returned list
 */
export const getUniqueUsersList = (state: SocketHandlerState): ExtendedUserInfo[] => {
  const uniqueUsersByUsername = new Map<string, ExtendedUserInfo>();

  for (const user of state.connectedUsers.values()) {
    uniqueUsersByUsername.set(user.username, user);
  }

  return Array.from(uniqueUsersByUsername.values());
};

/**
 * Broadcasts updated user list to all connected clients
 */
export const broadcastUserList = (state: SocketHandlerState): void => {
  const uniqueUsers = getUniqueUsersList(state);
  state.io.emit('users-updated', uniqueUsers);
};

/**
 * Updates a user's activity and broadcasts the updated user list
 */
export const updateUserActivity = (
  state: SocketHandlerState,
  socketId: string,
  activity: ExtendedUserInfo['activity'] | null
): void => {
  const user = state.connectedUsers.get(socketId);
  if (!user) return;

  if (activity) {
    user.activity = activity;
    console.log(`User ${user.username} activity: ${activity.type}${activity.polygonId ? ` polygon #${activity.polygonId}` : ''}`);
  } else {
    delete user.activity;
    console.log(`User ${user.username} cleared activity`);
  }

  state.connectedUsers.set(socketId, user);

  broadcastUserList(state);
};

/**
 * Handles user disconnection and cleans up resources
 */
export const handleUserDisconnect = (state: SocketHandlerState, socketId: string): void => {
  const user = state.connectedUsers.get(socketId);

  if (user) {
    console.log(`User disconnected: ${user.username} (${socketId})`);

    if (state.usernameToSocketMap.get(user.username) === socketId) {
      state.usernameToSocketMap.delete(user.username);
    }

    for (const [polygonId, editingInfo] of state.polygonEditingStatus.entries()) {
      if (editingInfo.userId === socketId) {
        state.polygonEditingStatus.delete(polygonId);

        state.io.emit('polygon-editing', {
          polygonId,
          action: 'end',
          userId: socketId,
          username: user.username
        });
      }
    }

    state.currentDrawings.delete(socketId);

    if (user.activity) {
      if (user.activity.type === 'drawing') {
        state.io.emit('drawing-ended', { userId: socketId, username: user.username });
      }
    }

    state.connectedUsers.delete(socketId);

    broadcastUserList(state);
  } else {
    console.log(`Unknown client disconnected: ${socketId}`);
  }
};
