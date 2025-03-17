import React, { useEffect, useState } from 'react';
import { useLayers, useMapInstance, useSocket } from '../../hooks';
import { BaseMap } from './BaseMap';
import { CanvasOverlay } from './Overlays/CanvasOverlay';
import { MapTooltipLayer } from './Overlays/MapTooltipLayer';
import { RealtimeDrawingOverlay } from './Overlays/RealtimeDrawingOverlay';
import { useCanvasDrawingAllPolygons } from '../../hooks';
import { GeolocateControl,  } from 'mapbox-gl';
import socketService from '../../services/socket';
import { MAPBOX_CONFIG } from '../../config/config';
import { useMapContext } from '../../contexts/MapContext';
import MapStyleSwitcher from '../styledComponents/MapStyleSwitcher';

import {
    ActiveUsersContainer,
    ActiveUsersTitle, CancelButton, JumpButton, JumpInput, JumpInputContainer, JumpToPointButton,
    JumpToPointContainer,
    MapContainer, MouseCoordinatesDisplay
} from '../styledComponents/backgroundMapStyles';

interface BackgroundMapProps {
    stopMouseTracking: boolean;
    selectedUserId?: string | null;
}

const BackgroundMap: React.FC<BackgroundMapProps> = ({
                                                         stopMouseTracking = false,
                                                         selectedUserId = null
                                                     }) => {
    const { polygons } = useLayers();
    const { isConnected } = useSocket();
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
    const [activeUsers, setActiveUsers] = useState<string[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const socket = socketService.getSocket();
        if (socket) {
            setCurrentUserId(socket.id);
        }

        return () => {
            setCurrentUserId(null);
        };
    }, [isConnected]);

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
                <RealtimeDrawingOverlay
                  mapInstance={mapInstance}
                  selectedUserId={selectedUserId}
                  currentUserId={currentUserId}
                  hideDrawingInProgress={true}
                />
              )}

              {mapInstance && (
                <MapTooltipLayer
                  mapInstance={mapInstance}
                  polygons={polygons}
                />
              )}

              {/* Add Map Style Switcher */}
              <MapStyleSwitcher
                currentStyle={mapStyle}
                onStyleChange={setMapStyle}
              />

              {/*{activeUsers.length > 0 && (*/}
              {/*  <ActiveUsersContainer>*/}
              {/*      <ActiveUsersTitle>*/}
              {/*          Active Users ({activeUsers.length})*/}
              {/*      </ActiveUsersTitle>*/}
              {/*      {activeUsers.map((user, index) => (*/}
              {/*        <div key={index}>{user}</div>*/}
              {/*      ))}*/}
              {/*  </ActiveUsersContainer>*/}
              {/*)}*/}

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
