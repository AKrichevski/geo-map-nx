import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

class SocketService {
  private static instance: SocketService | null = null;
  private socket: Socket | null = null;
  private connecting = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;
  private username = `User-${Math.floor(Math.random() * 10000)}`;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private currentActivity: any = null;
  private initialDataRequested = false;
  private requestingInitialData = false;
  private initialDataResponse: any = null;
  private initialDataSubscribers: Array<(data: any) => void> = [];
  private drawingsInProgress: Set<string> = new Set();
  private userJoinSent = false;
  private clearActivityDebounceTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public getSocket(): Socket | null {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.connecting) {
      return null;
    }

    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      return null;
    }

    return this.initSocket();
  }

  private initSocket(): Socket | null {
    this.connecting = true;
    this.connectionAttempts++;

    try {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 5000
      });

      this.socket.on('connect', this.handleConnect.bind(this));
      this.socket.on('disconnect', this.handleDisconnect.bind(this));
      this.socket.on('connect_error', this.handleError.bind(this));

      this.setupSocketEventForwarding();

      return this.socket;
    } catch (error) {
      this.connecting = false;
      return null;
    }
  }

  private setupSocketEventForwarding(): void {
    if (!this.socket) return;

    const events = [
      'drawing-update', 'drawing-ended', 'drawing-point-changed',
      'polygon-coordinates-update', 'polygon-editing',
      'users-updated', 'user-activity', 'initial-data'
    ];

    events.forEach(eventName => {
      this.socket?.on(eventName, (data: any) => {
        this.notifyListeners(eventName, data);

        if (eventName === 'drawing-update' && data && data.userId) {
          if (!data.isCompleted) {
            this.drawingsInProgress.add(data.userId);
          } else {
            this.drawingsInProgress.delete(data.userId);
          }
        } else if (eventName === 'drawing-ended' && data && data.userId) {
          this.drawingsInProgress.delete(data.userId);
        }
      });
    });
  }

  private notifyListeners(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  private handleConnect(): void {
    this.connecting = false;

    if (!this.userJoinSent) {
      this.socket?.emit('user-join', { username: this.username });
      this.userJoinSent = true;
    }

    this.notifyListeners('connect');
  }

  private handleDisconnect(): void {
    this.notifyListeners('disconnect');
    this.resetInitialDataState();
    this.drawingsInProgress.clear();
  }

  public resetInitialDataState(): void {
    this.initialDataRequested = false;
    this.requestingInitialData = false;
    this.initialDataResponse = null;
    this.initialDataSubscribers = [];
  }

  private handleError(error: any): void {
    this.connecting = false;
    this.requestingInitialData = false;
    this.notifyListeners('error', error);
  }

  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  public connect(): Socket | null {
    return this.getSocket();
  }

  public async connectAndWait(timeout: number = 5000): Promise<Socket | null> {
    const socket = this.getSocket();

    if (!socket) return null;
    if (socket.connected) return socket;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        socket.off('connect', connectHandler);
        resolve(socket.connected ? socket : null);
      }, timeout);

      const connectHandler = () => {
        clearTimeout(timer);
        resolve(socket);
      };

      socket.once('connect', connectHandler);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionAttempts = 0;
      this.eventListeners.clear();
      this.resetInitialDataState();
      this.drawingsInProgress.clear();
      this.userJoinSent = false;
    }
  }

  public on<T = any>(event: string, callback: (data?: T) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)?.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  public emit(event: string, data?: any): void {
    const socket = this.getSocket();
    if (socket) {
      if (event === 'drawing-update' && data) {
        if (!data.isCompleted) {
          this.drawingsInProgress.add(socket.id);
        } else {
          this.drawingsInProgress.delete(socket.id);
        }
      } else if (event === 'drawing-ended') {
        if (data && data.userId) {
          this.drawingsInProgress.delete(data.userId);
        } else {
          this.drawingsInProgress.delete(socket.id);
        }
      }

      socket.emit(event, data);
    }
  }

  public requestInitialData(): Promise<any> {
    const socket = this.getSocket();

    if (this.initialDataResponse) {
      return Promise.resolve(this.initialDataResponse);
    }

    if (this.requestingInitialData) {
      return new Promise((resolve) => {
        this.initialDataSubscribers.push(resolve);
      });
    }

    if (socket && socket.connected && !this.initialDataRequested) {
      this.requestingInitialData = true;

      return new Promise((resolve) => {
        this.initialDataSubscribers.push(resolve);

        const timeoutId = setTimeout(() => {
          if (this.requestingInitialData) {
            this.requestingInitialData = false;
            this.initialDataSubscribers.forEach(sub => sub(null));
            this.initialDataSubscribers = [];
          }
        }, 10000);

        socket.once('initial-data', (data) => {
          clearTimeout(timeoutId);
          this.initialDataRequested = true;
          this.requestingInitialData = false;
          this.initialDataResponse = data;
          this.initialDataSubscribers.forEach(sub => sub(data));
          this.initialDataSubscribers = [];
        });

        socket.emit('request-initial-data');
      });
    }

    return Promise.resolve(null);
  }

  public setUserActivity(activity: {
    type: 'drawing' | 'editing';
    polygonId?: number;
    coordinates?: [number, number];
  } | null): void {
    const socket = this.getSocket();
    if (!socket || !socket.connected) return;

    this.currentActivity = activity;

    if (activity === null) {
      if (this.clearActivityDebounceTimer) {
        clearTimeout(this.clearActivityDebounceTimer);
      }

      this.clearActivityDebounceTimer = setTimeout(() => {
        socket.emit('user-activity', { activity: null });

        if (this.drawingsInProgress.has(socket.id)) {
          socket.emit('drawing-ended', { userId: socket.id });
          this.drawingsInProgress.delete(socket.id);
        }

        this.clearActivityDebounceTimer = null;
      }, 300);
    } else {
      if (JSON.stringify(this.currentActivity) !== JSON.stringify(activity)) {
        socket.emit('user-activity', { activity });
      }
    }
  }

  public addDrawingPoint(point: [number, number]): void {
    this.notifyPointChange('add', undefined, point);
  }

  public notifyPointChange(
    action: 'add' | 'edit' | 'delete',
    pointIndex?: number,
    point?: [number, number]
  ): void {
    const socket = this.getSocket();
    if (!socket) return;

    socket.emit('drawing-point-changed', {
      action,
      pointIndex,
      point
    });
  }

  public clearDrawing(): void {
    const socket = this.getSocket();
    if (!socket) return;

    if (this.drawingsInProgress.has(socket.id)) {
      socket.emit('drawing-ended', { userId: socket.id });
      this.drawingsInProgress.delete(socket.id);
    }

    this.setUserActivity(null);
  }
}

export const socketService = SocketService.getInstance();
export default socketService;
