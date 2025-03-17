// libs/utils/src/lib/socket-types.ts
import { Server, Socket } from 'socket.io';
import { UserInfo } from './types';


/**
 * Extended UserInfo interface with activity tracking
 */
export interface ExtendedUserInfo extends UserInfo {
  activity?: {
    type: 'drawing' | 'editing';
    polygonId?: number;
    coordinates?: [number, number];
  };
}

/**
 * Drawing point change event data structure
 */
export interface PointChangeData {
  action: 'add' | 'edit' | 'delete';
  pointIndex?: number;
  point?: [number, number];
}

/**
 * Shared state interface for socket handlers
 */
export interface SocketHandlerState {
  io: Server;
  connectedUsers: Map<string, ExtendedUserInfo>;
}

/**
 * Socket handler function type definition
 */
export type SocketHandler = (socket: Socket, state: SocketHandlerState) => void;
