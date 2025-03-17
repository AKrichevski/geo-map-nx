export interface ActiveUser {
  id: string;
  username: string;
  isOnline: boolean;
  lastActive: string;
  activity?: {
    type: 'drawing' | 'editing';
    polygonId?: number;
    coordinates?: [number, number];
  };
}
