import { io, Socket } from 'socket.io-client';

/**
 * URL сервера трекера.
 * По умолчанию — то же имя хоста, что и у страницы, но порт 3001.
 * Например, если сайт открыт на 192.168.1.10:5173 — сокет пойдёт на 192.168.1.10:3001.
 * Можно переопределить через переменную окружения VITE_TRACKER_URL.
 */
const SERVER_URL =
  import.meta.env.VITE_TRACKER_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket'],
});

/** Стабильный ID пользователя (сохраняется в localStorage) */
export function getOrCreateUserId(): string {
  let id = localStorage.getItem('nomi-user-id');
  if (!id) {
    id = 'user-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('nomi-user-id', id);
  }
  return id;
}

/** Имя пользователя из localStorage или сгенерированное */
export function getOrCreateUserName(): string {
  let name = localStorage.getItem('nomi-user-name');
  if (!name) {
    name = 'Гость-' + Math.floor(Math.random() * 1000);
    localStorage.setItem('nomi-user-name', name);
  }
  return name;
}

export function saveUserName(name: string) {
  localStorage.setItem('nomi-user-name', name);
}