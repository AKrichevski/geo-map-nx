import React, { useCallback, useEffect, useRef, useState } from 'react';
import BackgroundMap from '../map/BackgroundMap';
import Sidebar from '../layout/Sidebar/Sidebar';
import { AddLayerModal } from '../features/layers/AddLayerModal';
import { PolygonCreateEditModal } from '../features/polygons/PolygonEditor/PolygonCreateEditModal';
import { useApiHealth, useSocket } from '../../hooks';
import socketService from '../../services/socket';
import SyncStatusIndicator from '../layout/SyncStatusIndicator';
import { MapProvider } from '../../contexts/MapContext';
import { ConnectionAlertContainer, DismissButton } from '../styledComponents/appContentStyles';

export default function MapView() {
  const [showAddLayerModal, setShowAddLayerModal] = useState(false);
  const [showCreatePolygonModal, setShowCreatePolygonModal] = useState(false);
  const [editPolygonId, setEditPolygonId] = useState<number | null>(null);
  const [showConnectionAlert, setShowConnectionAlert] = useState(false);
  const [activeUserCoordinates, setActiveUserCoordinates] = useState<[number, number] | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const createModalKey = useRef<number>(0);
  const editModalKey = useRef<number>(0);
  const { isAvailable, checking } = useApiHealth();
  const { subscribe } = useSocket();
  const socketInitialized = useRef(false);
  console.log("render MapView")

  useEffect(() => {
    if (!subscribe) return;
    console.log("render MapView subscribe", subscribe);
    const handleUsersUpdated = (users: any[]) => {
      const activeUser = users.find(user => user.activity && user.activity.coordinates);
      if (activeUser && activeUser.activity && activeUser.activity.coordinates) {
        setActiveUserCoordinates(activeUser.activity.coordinates);
      }
    };

    return subscribe('users-updated', handleUsersUpdated);
  }, [subscribe]);

  useEffect(() => {
    if (isAvailable && !socketInitialized.current) {
      socketInitialized.current = true;
    }

    const timeoutId = setTimeout(() => {
      const connected = socketService.isConnected();
      if (!connected) {
        setShowConnectionAlert(true);
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleOpenCreateModal = useCallback((show: boolean) => {
    createModalKey.current += 1;
    setShowCreatePolygonModal(show);
  }, []);

  const handleSetEditPolygonId = useCallback((id: number | null) => {
    if (editPolygonId !== null && id === null) {
      socketService.getSocket()?.emit('editing-polygon', {
        polygonId: editPolygonId,
        action: 'end'
      });
      socketService.setUserActivity(null);
    }

    editModalKey.current += 1;
    setEditPolygonId(id);
  }, [editPolygonId]);

  return (
    <MapProvider>
      {showConnectionAlert && !isAvailable && !checking && (
        <ConnectionAlertContainer>
          Backend server not available. Working in offline mode with limited functionality.
          <DismissButton onClick={() => setShowConnectionAlert(false)}>
            Dismiss
          </DismissButton>
        </ConnectionAlertContainer>
      )}

      <BackgroundMap
        stopMouseTracking={editPolygonId !== null || showCreatePolygonModal}
        selectedUserId={selectedUserId}
      />

      <Sidebar
        setEditPolygonId={handleSetEditPolygonId}
        setShowCreatePolygonModal={handleOpenCreateModal}
        setShowAddLayerModal={setShowAddLayerModal}
        setSelectedUserId={setSelectedUserId}
      />

      {showAddLayerModal && <AddLayerModal
        onClose={() => setShowAddLayerModal(false)}
      />}

      {showCreatePolygonModal && <PolygonCreateEditModal
        key={`create-${createModalKey.current}`}
        onClose={() => handleOpenCreateModal(false)}
        initialCenter={activeUserCoordinates}
      />}

      {!!editPolygonId && <PolygonCreateEditModal
        key={`edit-${editModalKey.current}`}
        onClose={() => handleSetEditPolygonId(null)}
        editPolygonId={editPolygonId}
        initialCenter={activeUserCoordinates}
      />}

      <SyncStatusIndicator />
    </MapProvider>
  );
}
