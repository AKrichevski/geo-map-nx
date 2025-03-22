import Dexie, { Table } from 'dexie';
import socketService from '../services/socket';
import { DbSyncManager } from './dbSync';
import { LayerData, PolygonData } from '@geo-map-app/types';

class GeoMapDatabase extends Dexie {
    layers!: Table<LayerData, number>;
    polygons!: Table<PolygonData, number>;
    syncManager: DbSyncManager;

    constructor() {
        super('GeoMapDB');
        this.version(2).stores({
            layers: '++id, name, createdAt, updatedAt',
            polygons: '++id, layerId, name, color, sizeKm2, createdAt, updatedAt'
        });

        this.syncManager = new DbSyncManager(this);
        this.on('ready', () => {
            console.log('IndexedDB opened successfully');
            this.setupSyncIfSocketConnected();
        });
    }

    setupSyncIfSocketConnected() {
        const socket = socketService.getSocket();
        if (socket) {
            this.syncManager.setSocket(socket);
            this.syncManager.performInitialSync()
              .then(() => console.log('Initial sync complete'))
              .catch(err => console.error('Initial sync failed:', err));
        } else {
            const unsubscribe = socketService.on('connect', () => {
                this.syncManager.setSocket(socketService.getSocket()!);
                this.syncManager.performInitialSync()
                  .then(() => console.log('Initial sync complete after socket connection'))
                  .catch(err => console.error('Initial sync failed after socket connection:', err));
                unsubscribe();
            });
        }
    }

    async createLayer(layer: Omit<LayerData, 'id'>): Promise<number> {
        try {
            const now = new Date().toISOString();
            const layerWithTimestamps = {
                ...layer,
                createdAt: now,
                updatedAt: now
            };

            const createdLayer = await this.syncManager.createLayer(layerWithTimestamps);
            return createdLayer.id!;
        } catch (error) {
            return await this.layers.add({
                ...layer,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    }

    async deleteLayer(id: number): Promise<boolean> {
        try {
            await this.syncManager.removeLayer(id);
            return true;
        } catch (error) {
            try {
                await this.transaction('rw', this.layers, this.polygons, async () => {
                    await this.polygons.where('layerId').equals(id).delete();
                    await this.layers.delete(id);
                });
                return true;
            } catch (error) {
                return false;
            }
        }
    }

    async createPolygon(polygon: any): Promise<number> {
        try {
            console.log('DB createPolygon called with:', JSON.stringify({
                layerId: polygon.layerId,
                name: polygon.name,
                color: polygon.color,
                hasCoordinates: !!polygon.coordinates,
                hasPoints: !!polygon.points,
                coordinatesLength: polygon.coordinates?.length,
                pointsLength: polygon.points?.length
            }));

            let dataToSync = { ...polygon };

            if (!polygon.coordinates && polygon.points) {
                dataToSync.coordinates = polygon.points;
                delete dataToSync.points;
            }

            const now = new Date().toISOString();
            dataToSync = {
                ...dataToSync,
                createdAt: now,
                updatedAt: now
            };

            const createdPolygon = await this.syncManager.createPolygon(dataToSync);
            return createdPolygon.id;
        } catch (error) {
            let dataToSave: any = { ...polygon };

            if (!polygon.coordinates && polygon.points) {
                dataToSave.coordinates = polygon.points;
                delete dataToSave.points;
            }

            return await this.polygons.add({
                ...dataToSave,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as PolygonData);
        }
    }

    async updatePolygon(id: number, updates: Partial<PolygonData>): Promise<boolean> {
        try {
            const updatesWithTimestamp = {
                ...updates,
                updatedAt: new Date().toISOString()
            };
            await this.syncManager.updatePolygon(id, updatesWithTimestamp);

            return true;
        } catch (error) {
            const count = await this.polygons.update(id, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
            return count > 0;
        }
    }

    async deletePolygon(id: number): Promise<boolean> {
        try {
            await this.syncManager.removePolygon(id);

            return true;
        } catch (error) {
            const count = await this.polygons.delete(id);

            return count > 0;
        }
    }

    isOnline(): boolean {
        return this.syncManager.isOnline();
    }
}

export const db = new GeoMapDatabase();
