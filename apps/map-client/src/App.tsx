import React, { useEffect, useState, useRef } from 'react';
import { LayersProvider } from './contexts/LayersContext';
import MapView from './components/pages/MapView';
import socketService from './services/socket';
import { LayersDebug } from './components/common/LayersDebug';
import { LoadingScreen } from './components/common/LoadingScreen';

function AppWithoutContext() {
  const [socketInitialized, setSocketInitialized] = useState(false);
  const initialDataRequestedRef = useRef(false);
  const [showDebug, setShowDebug] = useState(false);
  const socketInitializationAttempted = useRef(false);

  useEffect(() => {
    if (socketInitializationAttempted.current) return;

    socketInitializationAttempted.current = true;

    const initSocket = async () => {
      try {
        const socket = await socketService.connectAndWait(5000);

        if (socket && socket.connected && !initialDataRequestedRef.current) {
          socketService.requestInitialData();
          initialDataRequestedRef.current = true;
        }
      } catch (err) {
        // Silently handle socket initialization error
      } finally {
        setSocketInitialized(true);
      }
    };

    initSocket();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!socketInitialized) {
    return <LoadingScreen />;
  }

  return (
    <>
      {showDebug && <LayersDebug />}
      <MapView />
    </>
  );
}

function App() {
  return (
    <LayersProvider>
      <AppWithoutContext />
    </LayersProvider>
  );
}

export default App;
