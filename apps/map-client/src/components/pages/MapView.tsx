import React, { useCallback, useEffect, useRef, useState } from 'react';
import BackgroundMap from '../map/BackgroundMap';
import Sidebar from '../layout/Sidebar/Sidebar';
import { AddLayerModal } from '../features/layers/AddLayerModal';
import { PolygonCreateEditModal } from '../features/polygons/PolygonEditor/PolygonCreateEditModal';
import { useApiHealth } from '../../hooks';
import socketService from '../../services/socket';
import SyncStatusIndicator from '../layout/SyncStatusIndicator';
import { MapProvider } from '../../contexts/MapContext';
import { ConnectionAlertContainer, DismissButton } from '../styledComponents/appContentStyles';

export default function MapView() {
  const [showAddLayerModal, setShowAddLayerModal] = useState(false);
  const [showCreatePolygonModal, setShowCreatePolygonModal] = useState(false);
  const [editPolygonId, setEditPolygonId] = useState<number | null>(null);
  const [showConnectionAlert, setShowConnectionAlert] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const createModalKey = useRef<number>(0);
  const editModalKey = useRef<number>(0);
  const { isAvailable, checking } = useApiHealth();
  const socketInitialized = useRef(false);

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
        onClose={() => handleOpenCreateModal(false)}
      />}

      {!!editPolygonId && <PolygonCreateEditModal
        onClose={() => handleSetEditPolygonId(null)}
        editPolygonId={editPolygonId}
      />}

      <SyncStatusIndicator />
    </MapProvider>
  );
}
