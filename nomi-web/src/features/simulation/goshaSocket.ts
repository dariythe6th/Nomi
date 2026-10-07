import { io, Socket } from 'socket.io-client';

/**
 * Отдельный сокет для симуляции «Гоши» — не пересекается с основным
 * пользовательским сокетом из shared/lib/socket.
 */
const SERVER_URL =
  import.meta.env.VITE_TRACKER_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

export const goshaSocket: Socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

export const GOSHA_ID = 'sim-gosha';
export const GOSHA_NAME = 'Гоша';