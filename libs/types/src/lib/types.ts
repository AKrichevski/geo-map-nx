export type coordinates = number[][]

export interface Layer {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface LayerInput {
  name: string;
}

export interface Polygon {
  id: number;
  layerId: number;
  name: string;
  color: string;
  coordinates: coordinates;
  sizeKm2: number;
  createdAt: string;
  updatedAt: string;
}

export interface PolygonInput {
  layerId: number;
  name: string;
  color: string;
  coordinates: coordinates;
  sizeKm2?: number;
}

// Map related interfaces
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// WebSocket interfaces
export interface UserInfo {
  id: string;
  username: string;
  isOnline: boolean;
  lastActive: string;
}


// User activity types
export interface UserActivity {
  type: 'drawing' | 'editing';
  polygonId?: number;
  coordinates?: [number, number];
}

export interface SavePolygonData {
  userId?: string;
  username?: string;
  layerId: number;
  name: string;
  color: string;
  points?: coordinates;
  coordinates?: coordinates;
  sizeKm2?: number;
}

export interface DeletePolygonData {
  polygonId: number | string; // Accept either format
}

export interface PolygonEditingData {
  polygonId: number;
  userId: string;
  username: string;
  action: 'start' | 'end';
  coordinates?: [number, number]; // Added coordinates for location tracking
}

export interface PolygonCoordinateUpdateData {
  polygonId: number;
  coordinates: number[][];
}

export interface LayerData {
  id?: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PolygonData {
  id: number;
  layerId: number;
  name: string;
  color: string;
  coordinates: coordinates;
  sizeKm2?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserActivityData {
  userId: string;
  username: string;
  activity: UserActivity | null;
}

export interface LayerData {
  id?: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PolygonData {
  id: number;
  layerId: number;
  name: string;
  color: string;
  coordinates: coordinates;
  sizeKm2?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AreaInput {
  name: string;
  userId: string;
  points: coordinates;
  sizeKm2: number;
}

export interface Area extends AreaInput {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
