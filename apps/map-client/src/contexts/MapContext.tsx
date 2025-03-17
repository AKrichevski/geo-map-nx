import React, { createContext, useContext, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { getBoundsFromCoordinates } from '@geo-map-app/frontend-utils';
import { MAPBOX_CONFIG } from '../config/config';

interface MapContextType {
  mapInstance: mapboxgl.Map | null;
  setMapInstance: (map: mapboxgl.Map | null) => void;
  jumpToLocation: (center: [number, number], zoom: number) => boolean;
  jumpToPolygon: (coordinates: number[][]) => boolean;
  mapStyle: string;
  setMapStyle: (style: string) => void;
}

const MapContext = createContext<MapContextType>({
  mapInstance: null,
  setMapInstance: () => {},
  jumpToLocation: () => false,
  jumpToPolygon: () => false,
  mapStyle: MAPBOX_CONFIG.DEFAULT_STYLE,
  setMapStyle: () => {}
});

export const MapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [mapStyle, setMapStyle] = useState<string>(MAPBOX_CONFIG.DEFAULT_STYLE);

  const jumpToLocation = (center: [number, number], zoom: number = 12): boolean => {
    if (!mapInstance) {
      return false;
    }

    try {
      mapInstance.flyTo({
        center,
        zoom,
        essential: true,
        duration: 1500
      });

      return true;
    } catch (error) {
      return false;
    }
  };

  const jumpToPolygon = (coordinates: number[][]): boolean => {
    if (!mapInstance || coordinates.length < 3) {
      return false;
    }

    try {
      let sumX = 0;
      let sumY = 0;

      for (const point of coordinates) {
        if (Array.isArray(point) && point.length >= 2) {
          sumX += point[0];
          sumY += point[1];
        }
      }

      const center: [number, number] = [
        sumX / coordinates.length,
        sumY / coordinates.length
      ];

      const bounds = getBoundsFromCoordinates(coordinates)

      const lngDiff = bounds.maxLng - bounds.minLng;
      const latDiff = bounds.maxLat - bounds.minLat;
      const maxDiff = Math.max(lngDiff, latDiff);

      let zoomLevel = 14;

      if (maxDiff > 5) zoomLevel = 2;
      else if (maxDiff > 1) zoomLevel = 4;
      else if (maxDiff > 0.5) zoomLevel = 6;
      else if (maxDiff > 0.1) zoomLevel = 8;
      else if (maxDiff > 0.05) zoomLevel = 10;
      else if (maxDiff > 0.01) zoomLevel = 12;

      return jumpToLocation(center, zoomLevel);
    } catch (error) {
      return false;
    }
  };

  const handleSetMapStyle = (style: string) => {
    setMapStyle(style);
    if (mapInstance) {
      mapInstance.setStyle(style);
    }
  };

  return (
    <MapContext.Provider
      value={{
        mapInstance,
        setMapInstance,
        jumpToLocation,
        jumpToPolygon,
        mapStyle,
        setMapStyle: handleSetMapStyle
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => useContext(MapContext);
