import { Server, Socket } from 'socket.io';
import { UserInfo } from '@geo-map-app/types';

export interface ExtendedUserInfo extends UserInfo {
  activity?: {
    type: 'drawing' | 'editing';
    polygonId?: number;
    coordinates?: [number, number];
  };
}

export interface DrawingState {
  userId: string;
  username: string;
  points: [number, number][];
  isCompleted: boolean;
  timestamp?: number;
}

export interface SocketHandlerState {
  io: Server;
  connectedUsers: Map<string, ExtendedUserInfo>;
  currentDrawings: Map<string, DrawingState>;
  polygonEditingStatus: Map<number, { userId: string, username: string }>;
  usernameToSocketMap: Map<string, string>;
}

export type SocketHandler = (socket: Socket, state: SocketHandlerState) => void;
