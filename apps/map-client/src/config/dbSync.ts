import { Socket } from 'socket.io-client';
import Dexie from 'dexie';
import { LayerData, PolygonData } from '@geo-map-app/types';

export class DbSyncManager {
  private socket: Socket | null = null;
  private db: Dexie;
  private initialSyncComplete = false;
  private syncInProgress = false;
  private syncQueue: Array<() => Promise<void>> = [];

  constructor(db: Dexie) {
    this.db = db;
  }

  setSocket(socket: Socket): void {
    this.socket = socket;
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('layer-created', (layer: LayerData) => {
      this.syncLayer(layer);
    });

    this.socket.on('layer-updated', (layer: LayerData) => {
      this.syncLayer(layer);
    });

    this.socket.on('layer-deleted', (layerId: number) => {
      this.deleteLayer(layerId);
    });

    this.socket.on('polygon-saved', (polygon: PolygonData) => {
      this.syncPolygon(polygon);
    });

    this.socket.on('polygon-updated', (polygon: PolygonData) => {
      this.syncPolygon(polygon);
    });

    this.socket.on('polygon-deleted', (polygonId: number) => {
      this.deletePolygon(polygonId);
    });
  }

  async performInitialSync(): Promise<void> {
    if (this.initialSyncComplete || !this.socket) {
      return;
    }

    try {
      await this.queueSyncOperation(async () => {
        try {
          this.socket!.emit('request-initial-data');

          const initialData = await new Promise<{layers: any[], polygons: any[]}>((resolve, reject) => {
            this.socket!.once('initial-data', (data) => {
              resolve(data);
            });

            setTimeout(() => {
              reject(new Error('Timeout waiting for initial data'));
            }, 10000);
          });

          if (initialData.layers && initialData.layers.length > 0) {
            await this.syncLayers(initialData.layers);
            console.log(`Synced ${initialData.layers.length} layers to IndexedDB`);
          }

          if (initialData.polygons && initialData.polygons.length > 0) {
            await this.syncPolygons(initialData.polygons);
            console.log(`Synced ${initialData.polygons.length} polygons to IndexedDB`);
          }

          this.initialSyncComplete = true;
          console.log('Initial data sync completed');
        } catch (error) {
          console.error('Error during initial sync:', error);
          throw error;
        }
      });
    } catch (error) {
      console.error('Failed to perform initial sync:', error);
      throw error;
    }
  }

  private async queueSyncOperation(operation: () => Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const executeOperation = async () => {
        try {
          await operation();
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          this.syncInProgress = false;
          this.processQueue();
        }
      };

      this.syncQueue.push(executeOperation);
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    const nextOperation = this.syncQueue.shift();

    if (nextOperation) {
      nextOperation();
    }
  }

  private async fetchLayers(): Promise<LayerData[]> {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    return new Promise<LayerData[]>((resolve, reject) => {
      this.socket!.emit('get-all-layers', {}, (response: { layers?: LayerData[], error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.layers || []);
        }
      });
    });
  }

  private async fetchPolygons(): Promise<PolygonData[]> {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }

    return new Promise<PolygonData[]>((resolve, reject) => {
      this.socket!.emit('get-all-polygons', {}, (response: { polygons?: PolygonData[], error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.polygons || []);
        }
      });
    });
  }

  private async syncLayers(layers: LayerData[]): Promise<void> {
    try {
      await this.db.transaction('rw', this.db.table('layers'), async () => {
        if (layers.length > 0) {
          await this.db.table('layers').clear();
        }

        if (layers.length > 0) {
          await this.db.table('layers').bulkAdd(layers);
        }
      });
    } catch (error) {
      throw error;
    }
  }

  private async syncPolygons(polygons: PolygonData[]): Promise<void> {
    try {
      await this.db.transaction('rw', this.db.table('polygons'), async () => {
        if (polygons.length > 0) {
          await this.db.table('polygons').clear();
        }

        if (polygons.length > 0) {
          await this.db.table('polygons').bulkAdd(polygons);
        }
      });
    } catch (error) {
      throw error;
    }
  }

  private async syncLayer(layer: LayerData): Promise<void> {
    await this.queueSyncOperation(async () => {
      try {
        if (layer.id) {
          const existingLayer = await this.db.table('layers').get(layer.id);

          if (existingLayer) {
            await this.db.table('layers').update(layer.id, layer);
          } else {
            await this.db.table('layers').add(layer);
          }
        } else {
          const id = await this.db.table('layers').add(layer);
        }
      } catch (error) {
        throw error;
      }
    });
  }

  private async deleteLayer(layerId: number): Promise<void> {
    await this.queueSyncOperation(async () => {
      try {
        await this.db.table('polygons').where('layerId').equals(layerId).delete();
        await this.db.table('layers').delete(layerId);
      } catch (error) {
        throw error;
      }
    });
  }

  private async syncPolygon(polygon: PolygonData): Promise<void> {
    await this.queueSyncOperation(async () => {
      try {
        if (polygon.id) {
          const existingPolygon = await this.db.table('polygons').get(polygon.id);

          if (existingPolygon) {
            await this.db.table('polygons').update(polygon.id, polygon);
          } else {
            await this.db.table('polygons').add(polygon);
          }
        } else {
          const id = await this.db.table('polygons').add(polygon);
        }
      } catch (error) {
        throw error;
      }
    });
  }

  private async deletePolygon(polygonId: number): Promise<void> {
    await this.queueSyncOperation(async () => {
      try {
        await this.db.table('polygons').delete(polygonId);
      } catch (error) {
        throw error;
      }
    });
  }

  async createLayer(layer: Omit<LayerData, 'id'>): Promise<LayerData> {
    if (!this.socket) {
      // Offline mode - create only in IndexedDB
      const id = await this.db.table('layers').add(layer);
      const newLayer = { ...layer, id } as LayerData;
      return newLayer;
    }

    // Online mode - create on server
    return new Promise<LayerData>((resolve, reject) => {
      this.socket!.emit('create-layer', layer, async (response: { layer?: LayerData, error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else if (response.layer) {
          // Add to IndexedDB
          await this.syncLayer(response.layer);
          resolve(response.layer);
        } else {
          reject(new Error('No layer returned from server'));
        }
      });
    });
  }

  async updateLayer(layerId: number, updates: Partial<LayerData>): Promise<LayerData> {
    if (!this.socket) {
      // Offline mode - update only in IndexedDB
      await this.db.table('layers').update(layerId, updates);
      const updatedLayer = await this.db.table('layers').get(layerId) as LayerData;
      return updatedLayer;
    }

    return new Promise<LayerData>((resolve, reject) => {
      this.socket!.emit('update-layer', { layerId, updates }, async (response: { layer?: LayerData, error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else if (response.layer) {
          // Update in IndexedDB
          await this.syncLayer(response.layer);
          resolve(response.layer);
        } else {
          reject(new Error('No layer returned from server'));
        }
      });
    });
  }

  async removeLayer(layerId: number): Promise<void> {
    if (!this.socket) {
      await this.deleteLayer(layerId);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit('delete-layer', { layerId }, async (response: { success?: boolean, error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else if (response.success) {
          await this.deleteLayer(layerId);
          resolve();
        } else {
          reject(new Error('Failed to delete layer on server'));
        }
      });
    });
  }

  async createPolygon(polygon: Omit<PolygonData, 'id'>): Promise<PolygonData> {
    if (!this.socket) {
      const id = await this.db.table('polygons').add(polygon);
      const newPolygon = { ...polygon, id } as PolygonData;
      return newPolygon;
    }

    return new Promise<PolygonData>((resolve, reject) => {
      this.socket!.emit('save-polygon', polygon, async (response: { polygon?: PolygonData, error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else if (response.polygon) {
          await this.syncPolygon(response.polygon);
          resolve(response.polygon);
        } else {
          reject(new Error('No polygon returned from server'));
        }
      });
    });
  }

  async updatePolygon(polygonId: number, updates: Partial<PolygonData>): Promise<PolygonData> {
    if (!this.socket) {
      await this.db.table('polygons').update(polygonId, updates);
      const updatedPolygon = await this.db.table('polygons').get(polygonId) as PolygonData;
      return updatedPolygon;
    }

    return new Promise<PolygonData>((resolve, reject) => {
      this.socket!.emit('update-polygon', { polygonId, updates }, async (response: { polygon?: PolygonData, error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else if (response.polygon) {
          await this.syncPolygon(response.polygon);
          resolve(response.polygon);
        } else {
          reject(new Error('No polygon returned from server'));
        }
      });
    });
  }

  async removePolygon(polygonId: number): Promise<void> {
    if (!this.socket) {
      await this.deletePolygon(polygonId);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      this.socket!.emit('delete-polygon', { polygonId }, async (response: { success?: boolean, error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else if (response.success) {
          await this.deletePolygon(polygonId);
          resolve();
        } else {
          reject(new Error('Failed to delete polygon on server'));
        }
      });
    });
  }

  isOnline(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}
