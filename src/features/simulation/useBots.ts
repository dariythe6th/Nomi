import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../shared/lib/firebase';
import { useAuth } from '../auth/useAuth';
import { friendWithBot } from '../friends/api';
import { BOTS, type BotDefinition } from './bots';

const SERVER_URL =
  import.meta.env.VITE_TRACKER_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

const TICK_MS = 200;

/** Расстояние между координатами в метрах */
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Случайная точка внутри радиуса от центра */
function randomPointInRadius(lat: number, lng: number, radiusM: number): { lat: number; lng: number } {
  const r = Math.sqrt(Math.random()) * radiusM;
  const theta = Math.random() * 2 * Math.PI;
  const dLat = (r * Math.cos(theta)) / 111320;
  const dLng = (r * Math.sin(theta)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

interface BotState {
  def: BotDefinition;
  socket: Socket;
  current: { lat: number; lng: number };
  target: { lat: number; lng: number };
  distanceToTarget: number;
}

export function useBots() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const botsRef = useRef<Map<string, BotState>>(new Map());

  /** Один раз при загрузке — создать профили ботов и дружбу */
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        // Создаём профили ботов (если ещё нет)
        for (const bot of BOTS) {
          await setDoc(
            doc(db, 'users', bot.id),
            {
              uid: bot.id,
              name: bot.name,
              email: `${bot.id}@nomi.bot`,
              avatarUrl: null,
              status: 'гуляю',
              isBot: true,
              updatedAt: Date.now(),
            },
            { merge: true },
          );
        }
        // Делаем их друзьями текущего пользователя
        for (const bot of BOTS) {
          await friendWithBot(user.uid, bot.id);
        }
        if (!cancelled) {
          setReady(true);
          setRunning(true); // ← автозапуск при загрузке
        }
      } catch {
        // 
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /** Управление движением */
  useEffect(() => {
    if (!running) {
      // Отключаем все сокеты ботов
      botsRef.current.forEach((bot) => {
        try {
          bot.socket.disconnect();
        } catch {}
      });
      botsRef.current.clear();
      return;
    }

    // Создаём сокет и состояние для каждого бота
    for (const def of BOTS) {
      const socket = io(SERVER_URL, {
        autoConnect: false,
        transports: ['websocket'],
      });
      socket.connect();

      socket.on('connect', () => {
        socket.emit('register', { id: def.id, name: def.name });
      });

      const start = randomPointInRadius(def.centerLat, def.centerLng, def.radiusMeters);
      const target = randomPointInRadius(def.centerLat, def.centerLng, def.radiusMeters);

      botsRef.current.set(def.id, {
        def,
        socket,
        current: start,
        target,
        distanceToTarget: distanceMeters(start.lat, start.lng, target.lat, target.lng),
      });
    }

    // Тик движения
    const interval = window.setInterval(() => {
      botsRef.current.forEach((bot) => {
        if (!bot.socket.connected) return;

        const { def, current, target } = bot;

        const dist = distanceMeters(current.lat, current.lng, target.lat, target.lng);
        const speedMps = (def.speedKmh * 1000) / 3600;
        const stepMeters = speedMps * (TICK_MS / 1000);

        if (dist < 5 || dist < stepMeters) {
          // Дошли до цели — генерируем новую
          const newTarget = randomPointInRadius(def.centerLat, def.centerLng, def.radiusMeters);
          bot.target = newTarget;
          return;
        }

        // Двигаемся к цели
        const ratio = stepMeters / dist;
        bot.current = {
          lat: current.lat + (target.lat - current.lat) * ratio,
          lng: current.lng + (target.lng - current.lng) * ratio,
        };

        bot.socket.emit('location', {
          id: def.id,
          lat: bot.current.lat,
          lng: bot.current.lng,
          accuracy: 10,
        });
      });
    }, TICK_MS);

    return () => {
      window.clearInterval(interval);
      botsRef.current.forEach((bot) => {
        try {
          bot.socket.disconnect();
        } catch {}
      });
      botsRef.current.clear();
    };
  }, [running]);

  return { running, ready, setRunning };
}