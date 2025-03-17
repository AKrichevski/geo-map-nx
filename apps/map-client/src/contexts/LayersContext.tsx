import { createContext, useState, useCallback, useEffect, ReactNode, useMemo, useRef } from 'react';
import { db } from '../config/db';
import socketService from '../services/socket';
import { useSocket } from '../hooks/useSocket';
import { LayerData, PolygonData } from '@geo-map-app/types';

function debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function(...args: any[]) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

interface LayersContextType {
    layers: LayerData[];
    polygons: PolygonData[];
    selectedLayerId: number | null;
    isOnline: boolean;
    setSelectedLayerId: (id: number | null) => void;
    loadLayers: () => Promise<void>;
    loadPolygons: (layerId?: number | null) => Promise<void>;
    createLayer: (name: string) => Promise<number>;
    deleteLayer: (layerId: number) => Promise<void>;
    createPolygon: (p: Omit<PolygonData, 'id'>) => Promise<number>;
    updatePolygon: (id: number, updates: Partial<PolygonData>) => Promise<void>;
    deletePolygon: (id: number) => Promise<void>;
    isSyncing: boolean;
    lastSyncTime: Date | null;
    syncStats: { layers: number, polygons: number };
}

const LayersContext = createContext<LayersContextType | null>(null);

interface LayersProviderProps {
    children: ReactNode;
}

const LayersProvider = ({ children }: LayersProviderProps) => {
    const [layers, setLayers] = useState<LayerData[]>([]);
    const [polygons, setPolygons] = useState<PolygonData[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
    const { isConnected } = useSocket();
    const [isOnline, setIsOnline] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [syncStats, setSyncStats] = useState({ layers: 0, polygons: 0 });

    const initialLayersLoaded = useRef(false);
    const initialPolygonsLoaded = useRef(false);
    const loadingInProgress = useRef(false);
    const socketEventsInitialized = useRef(false);
    const socketEventHandlersRegistered = useRef(false);

    useEffect(() => {
        const newOnlineStatus = isConnected && db.isOnline();
        setIsOnline(newOnlineStatus);

        if (newOnlineStatus && !isOnline) {
            db.syncManager.performInitialSync()
              .then(() => {
                  setLastSyncTime(new Date());
                  if (!initialLayersLoaded.current) {
                      loadLayersImpl();
                  }
              })
              .catch(err => console.error('Error syncing after reconnect:', err));
        }
    }, [isConnected]);

    const loadLayersImpl = useCallback(async () => {
        if (loadingInProgress.current) return;

        try {
            loadingInProgress.current = true;
            setIsSyncing(true);
            const allLayers = await db.layers.toArray();

            setLayers(allLayers);
            setSyncStats(prev => ({ ...prev, layers: allLayers.length }));
            initialLayersLoaded.current = true;

            if (allLayers.length > 0 && !selectedLayerId) {
                setSelectedLayerId(allLayers[0].id);

                const firstLayerId = allLayers[0].id;
                if (firstLayerId) {
                    const layerPolygons = await db.polygons.where('layerId').equals(firstLayerId).toArray();
                    setPolygons(layerPolygons);
                    setSyncStats(prev => ({ ...prev, polygons: layerPolygons.length }));
                    initialPolygonsLoaded.current = true;
                }
            }

            setIsSyncing(false);
            setLastSyncTime(new Date());
        } catch (error) {
            setIsSyncing(false);
        } finally {
            loadingInProgress.current = false;
        }
    }, [selectedLayerId]);

    const loadLayers = useCallback(
      debounce(() => {
          if (!initialLayersLoaded.current) {
              loadLayersImpl();
          } else {
              loadLayersImpl();
          }
      }, 500),
      [loadLayersImpl]
    );

    const loadPolygonsImpl = useCallback(async (layerId?: number | null) => {
        if (loadingInProgress.current || !layerId) return;

        try {
            loadingInProgress.current = true;
            setIsSyncing(true);

            const filteredPolygons = await db.polygons.where('layerId').equals(layerId).toArray();

            setPolygons(filteredPolygons);
            setSyncStats(prev => ({ ...prev, polygons: filteredPolygons.length }));
            initialPolygonsLoaded.current = true;

            setIsSyncing(false);
            setLastSyncTime(new Date());
        } catch (error) {
            setIsSyncing(false);
        } finally {
            loadingInProgress.current = false;
        }
    }, []);

    const loadPolygons = useCallback(
      debounce((layerId?: number | null) => {
          if (layerId) {
              loadPolygonsImpl(layerId);
          } else {
              setPolygons([]);
          }
      }, 500),
      [loadPolygonsImpl]
    );

    useEffect(() => {
        const initialLoad = async () => {
            if (!initialLayersLoaded.current && !loadingInProgress.current) {
                try {
                    loadingInProgress.current = true;
                    setIsSyncing(true);

                    const allLayers = await db.layers.toArray();

                    setLayers(allLayers);
                    setSyncStats(prev => ({ ...prev, layers: allLayers.length }));
                    initialLayersLoaded.current = true;

                    if (allLayers.length > 0 && !selectedLayerId) {
                        const firstLayer = allLayers[0];
                        setSelectedLayerId(firstLayer.id);

                        const layerPolygons = await db.polygons.where('layerId').equals(firstLayer.id).toArray();

                        setPolygons(layerPolygons);
                        setSyncStats(prev => ({ ...prev, polygons: layerPolygons.length }));
                        initialPolygonsLoaded.current = true;
                    }

                    setIsSyncing(false);
                    setLastSyncTime(new Date());
                } catch (error) {
                    setIsSyncing(false);
                } finally {
                    loadingInProgress.current = false;
                }
            }
        };

        initialLoad();

        const updateLocalStorage = debounce(() => {
            localStorage.setItem('syncStats', JSON.stringify(syncStats));
        }, 60000);

        const interval = setInterval(updateLocalStorage, 60000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedLayerId) {
            loadPolygonsImpl(selectedLayerId);
        } else {
            setPolygons([]);
        }
    }, [selectedLayerId, loadPolygonsImpl]);

    useEffect(() => {
        if (!isConnected || socketEventHandlersRegistered.current) return;

        const socket = socketService.getSocket();
        if (!socket) return;

        socketEventHandlersRegistered.current = true;

        const initialDataHandler = (data: { layers: LayerData[], polygons: PolygonData[] }) => {
            if (data.layers && data.layers.length > 0) {
                setLayers(data.layers);
                setSyncStats(prev => ({ ...prev, layers: data.layers.length }));
                initialLayersLoaded.current = true;

                if (data.layers.length > 0 && !selectedLayerId) {
                    const firstLayer = data.layers[0];
                    setSelectedLayerId(firstLayer.id);

                    if (data.polygons && data.polygons.length > 0) {
                        const layerPolygons = data.polygons.filter(p => p.layerId === firstLayer.id);
                        setPolygons(layerPolygons);
                        setSyncStats(prev => ({ ...prev, polygons: layerPolygons.length }));
                        initialPolygonsLoaded.current = true;
                    }
                } else if (selectedLayerId && data.polygons) {
                    const layerPolygons = data.polygons.filter(p => p.layerId === selectedLayerId);
                    setPolygons(layerPolygons);
                }
            }

            setLastSyncTime(new Date());
        };

        const layerCreatedHandler = (data: LayerData) => {
            setLayers(prevLayers => {
                if (prevLayers.some(layer => layer.id === data.id)) {
                    return prevLayers;
                }
                return [...prevLayers, data];
            });

            setSyncStats(prev => ({ ...prev, layers: prev.layers + 1 }));
            setLastSyncTime(new Date());
        };

        const layerUpdatedHandler = (data: LayerData) => {
            setLayers(prevLayers =>
              prevLayers.map(layer =>
                layer.id === data.id ? data : layer
              )
            );

            setLastSyncTime(new Date());
        };

        const layerDeletedHandler = (layerId: number) => {
            if (selectedLayerId === layerId) {
                setSelectedLayerId(null);
            }
            setLayers(prevLayers => prevLayers.filter(layer => layer.id !== layerId));

            setSyncStats(prev => ({ ...prev, layers: Math.max(0, prev.layers - 1) }));
            setLastSyncTime(new Date());
        };

        const polygonSavedHandler = (data: PolygonData) => {
            if (selectedLayerId === data.layerId) {
                setPolygons(prevPolygons => {
                    if (prevPolygons.some(poly => poly.id === data.id)) {
                        return prevPolygons;
                    }
                    return [...prevPolygons, data];
                });
            }

            setSyncStats(prev => ({ ...prev, polygons: prev.polygons + 1 }));
            setLastSyncTime(new Date());
        };

        const polygonUpdatedHandler = (data: PolygonData) => {
            if (selectedLayerId === data.layerId) {
                setPolygons(prevPolygons =>
                  prevPolygons.map(poly =>
                    poly.id === data.id ? data : poly
                  )
                );
            }

            setLastSyncTime(new Date());
        };

        const polygonDeletedHandler = (polygonId: number) => {
            setPolygons(prevPolygons => prevPolygons.filter(poly => poly.id !== polygonId));

            setSyncStats(prev => ({ ...prev, polygons: Math.max(0, prev.polygons - 1) }));
            setLastSyncTime(new Date());
        };

        socket.on('initial-data', initialDataHandler);
        socket.on('layer-created', layerCreatedHandler);
        socket.on('layer-updated', layerUpdatedHandler);
        socket.on('layer-deleted', layerDeletedHandler);
        socket.on('polygon-saved', polygonSavedHandler);
        socket.on('polygon-updated', polygonUpdatedHandler);
        socket.on('polygon-deleted', polygonDeletedHandler);

        return () => {
            socket.off('initial-data', initialDataHandler);
            socket.off('layer-created', layerCreatedHandler);
            socket.off('layer-updated', layerUpdatedHandler);
            socket.off('layer-deleted', layerDeletedHandler);
            socket.off('polygon-saved', polygonSavedHandler);
            socket.off('polygon-updated', polygonUpdatedHandler);
            socket.off('polygon-deleted', polygonDeletedHandler);
            socketEventHandlersRegistered.current = false;
        };
    }, [isConnected, selectedLayerId]);

    const createLayer = useCallback(async (name: string): Promise<number> => {
        try {
            setIsSyncing(true);

            const id = await db.createLayer({ name });

            setIsSyncing(false);
            setLastSyncTime(new Date());
            return id;
        } catch (error) {
            setIsSyncing(false);
            throw error;
        }
    }, []);

    const deleteLayer = useCallback(async (layerId: number): Promise<void> => {
        try {
            setIsSyncing(true);
            const success = await db.deleteLayer(layerId);
            if (!success) {
                throw new Error('Failed to delete layer');
            }

            if (selectedLayerId === layerId) {
                setSelectedLayerId(null);
            }

            setIsSyncing(false);
            setLastSyncTime(new Date());
        } catch (error) {
            setIsSyncing(false);
            throw error;
        }
    }, [selectedLayerId]);

    const createPolygon = useCallback(async (polygon: Omit<PolygonData, 'id'>): Promise<number> => {
        try {
            setIsSyncing(true);
            const id = await db.createPolygon(polygon as PolygonData);
            setIsSyncing(false);
            setLastSyncTime(new Date());
            return id;
        } catch (error) {
            setIsSyncing(false);
            throw error;
        }
    }, []);

    const updatePolygon = useCallback(async (id: number, updates: Partial<PolygonData>): Promise<void> => {
        try {
            setIsSyncing(true);

            const polygon = await db.polygons.get(id);
            if (!polygon) {
                setIsSyncing(false);
                throw new Error('Polygon not found');
            }

            const success = await db.updatePolygon(id, updates);
            if (!success) {
                setIsSyncing(false);
                throw new Error('Failed to update polygon');
            }

            setIsSyncing(false);
            setLastSyncTime(new Date());
        } catch (error) {
            setIsSyncing(false);
            throw error;
        }
    }, []);

    const deletePolygon = useCallback(async (id: number): Promise<void> => {
        try {
            setIsSyncing(true);
            const polygon = await db.polygons.get(id);
            if (!polygon) {
                setIsSyncing(false);
                throw new Error('Polygon not found');
            }

            const success = await db.deletePolygon(id);
            if (!success) {
                setIsSyncing(false);
                throw new Error('Failed to delete polygon');
            }

            setIsSyncing(false);
            setLastSyncTime(new Date());
        } catch (error) {
            setIsSyncing(false);
            throw error;
        }
    }, []);

    const contextValue = useMemo(() => ({
        layers,
        polygons,
        selectedLayerId,
        isOnline,
        setSelectedLayerId,
        loadLayers,
        loadPolygons,
        createLayer,
        deleteLayer,
        createPolygon,
        updatePolygon,
        deletePolygon,
        isSyncing,
        lastSyncTime,
        syncStats
    }), [
        layers,
        polygons,
        selectedLayerId,
        isOnline,
        loadLayers,
        loadPolygons,
        createLayer,
        deleteLayer,
        createPolygon,
        updatePolygon,
        deletePolygon,
        isSyncing,
        lastSyncTime,
        syncStats
    ]);

    return (
      <LayersContext.Provider value={contextValue}>
          {children}
      </LayersContext.Provider>
    );
};

export { LayersContext, LayersProvider };
export type { LayersContextType };
