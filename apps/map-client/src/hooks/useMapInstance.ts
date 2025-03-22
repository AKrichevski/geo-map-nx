import { useRef, useState, useEffect } from 'react';
import mapboxgl, { Map } from 'mapbox-gl';
import { coordinates } from '@geo-map-app/types';

const mapboxToken = import.meta.env.VITE_MAPBOX_API_KEY;

if (!mapboxgl.accessToken && mapboxToken) {
    mapboxgl.accessToken = mapboxToken;
} else if (!mapboxgl.accessToken) {
    console.error('Mapbox API key not found. Please set VITE_MAPBOX_API_KEY in your .env file.');
}

interface MapOptions {
    initialCenter?: [number, number];
    initialZoom?: number;
    style?: string;
}

export const useMapInstance = ({
                                   initialCenter = [-74.5, 40],
                                   initialZoom = 2,
                                   style = 'mapbox://styles/mapbox/streets-v11'
                               }: MapOptions = {}) => {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [mapInstance, setMapInstance] = useState<Map | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    const mapRef = useRef<Map | null>(null);
    const lastStyle = useRef<string>(style);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        if (!mapboxgl.accessToken) {
            setMapError('Mapbox API key not set. Map functionality will be limited.');
            return;
        }

        try {
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style,
                center: initialCenter,
                zoom: initialZoom,
            });

            map.on("load", () => {
                mapRef.current = map;
                setMapInstance(map);
                setMapError(null);
                lastStyle.current = style;
            });

            map.on("error", (e) => {
                console.error('Mapbox error:', e);
                setMapError(`Map error: ${e.error?.message || 'Unknown error'}`);
            });

            return () => {
                map.remove();
                mapRef.current = null;
            };
        } catch (error) {
            setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [initialCenter, initialZoom, style]);

    useEffect(() => {
        if (!mapRef.current || style === lastStyle.current) return;

        try {
            mapRef.current.setStyle(style);
            lastStyle.current = style;
        } catch (error) {
            console.error('Error changing map style:', error);
        }
    }, [style]);

    const jumpToLocation = (center: [number, number], zoom: number = 12, options: any = {}) => {
        if (!mapInstance) {
            return false;
        }

        try {
            mapInstance.flyTo({
                center,
                zoom,
                essential: true,
                duration: 1500,
                ...options
            });

            return true;
        } catch (error) {
            return false;
        }
    };

    const jumpToPolygon = (coordinates: coordinates) => {
        if (!mapInstance || !coordinates || coordinates.length < 3) {
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

            const bounds = coordinates.reduce(
              (box, coord) => {
                  return {
                      minLng: Math.min(box.minLng, coord[0]),
                      maxLng: Math.max(box.maxLng, coord[0]),
                      minLat: Math.min(box.minLat, coord[1]),
                      maxLat: Math.max(box.maxLat, coord[1])
                  };
              },
              { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
            );

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

    return {
        mapContainerRef,
        mapInstance,
        mapError,
        jumpToLocation,
        jumpToPolygon
    };
};
