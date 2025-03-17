import React from 'react';
import { MouseCoordinatesDisplay } from '../styledComponents/backgroundMapStyles';

export interface MouseCoordinatesDisplayProps {
  lng: number;
  lat: number;
}

export const MouseCoordinates: React.FC<MouseCoordinatesDisplayProps> = ({ lng, lat }) => (
  <MouseCoordinatesDisplay>
    Lng: {lng} | Lat: {lat}
  </MouseCoordinatesDisplay>
);
