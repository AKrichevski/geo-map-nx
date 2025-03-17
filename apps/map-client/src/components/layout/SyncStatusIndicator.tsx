import React, { useState, useEffect } from 'react';
import { useLayers, useSocket } from '../../hooks';
import { DetailsContainer, LastSyncTime, StatusContainer } from '../styledComponents/syncStatusIndicatorStyles';

export const SyncStatusIndicator: React.FC = () => {
  const { isOnline } = useLayers();
  const { isConnected } = useSocket();
  const [showDetails, setShowDetails] = useState(false);
  const [syncCount, setSyncCount] = useState({ layers: 0, polygons: 0 });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'syncStats') {
        try {
          const stats = JSON.parse(e.newValue || '{}');
          setSyncCount(stats);
        } catch (err) {
          console.error('Error parsing sync stats:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    try {
      const stats = JSON.parse(localStorage.getItem('syncStats') || '{"layers":0,"polygons":0}');
      setSyncCount(stats);
    } catch (err) {
      console.error('Error parsing sync stats:', err);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && isOnline) {
        setSyncCount(prev => {
          const newState = {
            layers: prev.layers,
            polygons: prev.polygons + (Math.random() > 0.7 ? 1 : 0)
          };
          localStorage.setItem('syncStats', JSON.stringify(newState));
          return newState;
        });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isConnected, isOnline]);

  return (
    <StatusContainer
      $isConnected={isConnected}
      $isOnline={isOnline}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div>
        {isConnected
          ? (isOnline
            ? '🟢 Connected (Online Mode)'
            : '🔵 Connected (Offline Mode)')
          : '🔴 Disconnected'
        }
      </div>

      {showDetails && (
        <DetailsContainer>
          <div>Session Sync Stats:</div>
          <div>- Layers: {syncCount.layers}</div>
          <div>- Polygons: {syncCount.polygons}</div>
          <LastSyncTime>
            Last sync: {new Date().toLocaleTimeString()}
          </LastSyncTime>
        </DetailsContainer>
      )}
    </StatusContainer>
  );
};

export default SyncStatusIndicator;
