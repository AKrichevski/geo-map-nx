import React, { useEffect, useState } from 'react';
import { useLayers, useMapInstance } from '../../hooks';
import { BaseMap } from './BaseMap';
import { CanvasOverlay } from './Overlays/CanvasOverlay';
import { MapTooltipLayer } from './Overlays/MapTooltipLayer';
import { useCanvasDrawingAllPolygons } from '../../hooks';
import { MAPBOX_CONFIG } from '../../config/config';
import { useMapContext } from '../../contexts/MapContext';
import MapStyleSwitcher from '../styledComponents/MapStyleSwitcher';

import {
CancelButton, JumpButton, JumpInput, JumpInputContainer, JumpToPointButton,
    JumpToPointContainer,
    MapContainer, MouseCoordinatesDisplay
} from '../styledComponents/backgroundMapStyles';

interface BackgroundMapProps {
    selectedUserId?: string | null;
}

const BackgroundMap: React.FC<BackgroundMapProps> = ({
                                                         selectedUserId = null
                                                     }) => {
    const { polygons } = useLayers();
    const { mapStyle, setMapStyle } = useMapContext();

    const { mapContainerRef, mapInstance } = useMapInstance({
        initialCenter: MAPBOX_CONFIG.DEFAULT_CENTER,
        initialZoom: MAPBOX_CONFIG.DEFAULT_ZOOM,
        style: mapStyle
    });

    const { setMapInstance } = useMapContext();

    const { canvasRef, drawAllPolygons } = useCanvasDrawingAllPolygons();
    const [showJumpInput, setShowJumpInput] = useState(false);
    const [coordinates, setCoordinates] = useState({ lng: '', lat: '' });
    const [mouseCoordinates, setMouseCoordinates] = useState<{ lng: number; lat: number } | null>(null);

    useEffect(() => {
        if (mapInstance) {
            setMapInstance(mapInstance);
        }

        return () => {
            setMapInstance(null);
        };
    }, [mapInstance, setMapInstance]);

    useEffect(() => {
        if (!mapInstance) return;

        const onMouseMove = (e: mapboxgl.MapMouseEvent) => {
            setMouseCoordinates({
                lng: Number(e.lngLat.lng.toFixed(4)),
                lat: Number(e.lngLat.lat.toFixed(4))
            });
        };

        mapInstance.on('mousemove', onMouseMove);

        return () => {
            mapInstance.off('mousemove', onMouseMove);
        };
    }, [mapInstance]);

    useEffect(() => {
        if (!mapInstance || polygons.length === 0) return;

        const renderPolygons = () => {
            drawAllPolygons({
                mapInstance,
                polygons,
            });
        };

        renderPolygons();
        mapInstance.on('move', renderPolygons);
        mapInstance.on('zoom', renderPolygons);

        return () => {
            mapInstance.off('move', renderPolygons);
            mapInstance.off('zoom', renderPolygons);
        };
    }, [mapInstance, polygons, drawAllPolygons]);

    useEffect(() => {
        if (mapInstance && mapStyle) {
            const currentStyle = mapInstance.getStyle();
            const currentStyleUrl = currentStyle && currentStyle.name ?
              currentStyle.name :
              (mapInstance as any)._requestManager?._requestTransformStyle?.styleUrl;

            if (currentStyleUrl !== mapStyle) {
                mapInstance.setStyle(mapStyle);
            }
        }
    }, [mapStyle, mapInstance]);

    const handleJump = () => {
        if (!mapInstance) return;

        const lng = parseFloat(coordinates.lng);
        const lat = parseFloat(coordinates.lat);

        if (isNaN(lng) || isNaN(lat)) {
            alert('Please enter valid coordinates');
            return;
        }

        mapInstance.flyTo({
            center: [lng, lat],
            zoom: 12,
            essential: true
        });

        setShowJumpInput(false);
        setCoordinates({ lng: '', lat: '' });
    };

    return (
      <MapContainer>
          <BaseMap mapContainerRef={mapContainerRef}>
              <CanvasOverlay canvasRef={canvasRef} />

              {mapInstance && (
                <MapTooltipLayer
                  mapInstance={mapInstance}
                  polygons={polygons}
                />
              )}
              <MapStyleSwitcher
                currentStyle={mapStyle}
                onStyleChange={setMapStyle}
              />
              <JumpToPointContainer>
                  {showJumpInput ? (
                    <JumpInputContainer>
                        <JumpInput
                          type="text"
                          placeholder="Longitude"
                          value={coordinates.lng}
                          onChange={(e) => setCoordinates(prev => ({ ...prev, lng: e.target.value }))}
                        />
                        <JumpInput
                          type="text"
                          placeholder="Latitude"
                          value={coordinates.lat}
                          onChange={(e) => setCoordinates(prev => ({ ...prev, lat: e.target.value }))}
                        />
                        <JumpButton onClick={handleJump}>
                            Go
                        </JumpButton>
                        <CancelButton
                          onClick={() => {
                              setShowJumpInput(false);
                              setCoordinates({ lng: '', lat: '' });
                          }}
                        >
                            Cancel
                        </CancelButton>
                    </JumpInputContainer>
                  ) : (
                    <JumpToPointButton onClick={() => setShowJumpInput(true)}>
                        Jump To Point
                    </JumpToPointButton>
                  )}
              </JumpToPointContainer>

              {mouseCoordinates && (
                <MouseCoordinatesDisplay>
                    Lng: {mouseCoordinates.lng} | Lat: {mouseCoordinates.lat}
                </MouseCoordinatesDisplay>
              )}
          </BaseMap>
      </MapContainer>
    );
};

export default BackgroundMap;
