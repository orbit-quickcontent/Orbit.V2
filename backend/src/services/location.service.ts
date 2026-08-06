export interface LocationUpdate {
  partnerId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

export class LocationService {
  private static instance: LocationService;
  private locations: Map<string, LocationUpdate> = new Map();

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  updateLocation(partnerId: string, lat: number, lng: number, heading?: number, speed?: number): LocationUpdate {
    const update: LocationUpdate = {
      partnerId,
      lat,
      lng,
      heading,
      speed,
      timestamp: new Date().toISOString()
    };
    this.locations.set(partnerId, update);
    this.broadcastLocation(partnerId, lat, lng, update);
    return update;
  }

  getLocation(partnerId: string): LocationUpdate | undefined {
    return this.locations.get(partnerId);
  }

  getAllLocations(): LocationUpdate[] {
    return Array.from(this.locations.values());
  }

  broadcastLocation(partnerId: string, lat: number, lng: number, payload: LocationUpdate) {
    const wsServer = (global as any).wsServer;
    if (wsServer) {
      wsServer.emit('partner:location', { partnerId, lat, lng, payload });
    }
  }
}
