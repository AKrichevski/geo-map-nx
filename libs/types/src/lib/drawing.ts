export interface DrawingData {
  userId: string;
  username?: string;
  points: [number, number][];
  isCompleted: boolean;
  areaSize?: number;
}
