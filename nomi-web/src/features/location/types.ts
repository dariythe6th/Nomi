export interface RemoteUser {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  lastSeen: number;
}