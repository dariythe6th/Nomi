export interface RemoteUser {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  lastSeen: number;
  /** Скорость в м/с (0 = стоит) */
  speed?: number;
  /** Unix-время, с которого пользователь стоит на месте (если speed === 0) */
  stationarySince?: number;
}