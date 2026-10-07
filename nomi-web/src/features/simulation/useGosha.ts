import { useEffect, useRef, useState } from 'react';
import { goshaSocket, GOSHA_ID, GOSHA_NAME } from './goshaSocket';

export interface LatLng {
  lat: number;
  lng: number;
}

export const GOSHA_DEFAULT_START: LatLng = { lat: 55.7558, lng: 37.6173 };
export const GOSHA_DEFAULT_END: LatLng = { lat: 55.765, lng: 37.635 };

const TICK_MS = 150;
const HEARTBEAT_MS = 3000;

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

export function useGosha() {
  const [isRunning, setIsRunning] = useState(false);
  const [speedKmh, setSpeedKmh] = useState(5);
  const [start, setStart] = useState<LatLng>(GOSHA_DEFAULT_START);
  const [end, setEnd] = useState<LatLng>(GOSHA_DEFAULT_END);
  const [connected, setConnected] = useState(false);

  // Мутабельное состояние в одном ref — чтобы интервал всегда видел актуальное
  const ref = useRef({
    isRunning: false,
    speedKmh: 5,
    start: GOSHA_DEFAULT_START,
    end: GOSHA_DEFAULT_END,
    t: 0,
    direction: 'forward' as 'forward' | 'backward',
    lastPos: null as LatLng | null,
    lastHeartbeat: 0,
  });

  // Синхронизация state → ref
  useEffect(() => {
    ref.current.isRunning = isRunning;
  }, [isRunning]);
  useEffect(() => {
    ref.current.speedKmh = speedKmh;
  }, [speedKmh]);
  useEffect(() => {
    ref.current.start = start;
  }, [start]);
  useEffect(() => {
    ref.current.end = end;
  }, [end]);

  // Подключение к сокету
  useEffect(() => {
    goshaSocket.connect();

    const onConnect = () => {
      setConnected(true);
      goshaSocket.emit('register', { id: GOSHA_ID, name: GOSHA_NAME });
    };
    const onDisconnect = () => setConnected(false);

    goshaSocket.on('connect', onConnect);
    goshaSocket.on('disconnect', onDisconnect);

    // Если сокет уже подключён (singleton живёт дольше компонента)
    if (goshaSocket.connected) onConnect();

    return () => {
      goshaSocket.off('connect', onConnect);
      goshaSocket.off('disconnect', onDisconnect);
      // НЕ отключаем сокет — он singleton
    };
  }, []);

  // Основной цикл
  useEffect(() => {
    const interval = window.setInterval(() => {
      const s = ref.current;

      // === Стоит: heartbeat раз в 3 секунды ===
      if (!s.isRunning) {
        if (!s.lastPos) return;
        const now = Date.now();
        if (now - s.lastHeartbeat < HEARTBEAT_MS) return;
        s.lastHeartbeat = now;
        if (goshaSocket.connected) {
          goshaSocket.emit('location', {
            id: GOSHA_ID,
            lat: s.lastPos.lat,
            lng: s.lastPos.lng,
            accuracy: 10,
          });
        }
        return;
      }

      // === Идёт: интерполяция ===
      const from = s.direction === 'forward' ? s.start : s.end;
      const to = s.direction === 'forward' ? s.end : s.start;
      const segLen = distanceMeters(from.lat, from.lng, to.lat, to.lng);
      if (segLen < 0.5) return;

      const speedMps = (s.speedKmh * 1000) / 3600;
      const stepMeters = speedMps * (TICK_MS / 1000);
      s.t += stepMeters / segLen;

      if (s.t >= 1) {
        s.t = 0;
        s.direction = s.direction === 'forward' ? 'backward' : 'forward';
        return;
      }

      const lat = from.lat + (to.lat - from.lat) * s.t;
      const lng = from.lng + (to.lng - from.lng) * s.t;
      s.lastPos = { lat, lng };
      s.lastHeartbeat = Date.now();

      if (goshaSocket.connected) {
        goshaSocket.emit('location', { id: GOSHA_ID, lat, lng, accuracy: 10 });
      }
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, []);

  /** Запустить движение */
  const startMovement = () => {
    const s = ref.current;
    // При первом запуске или после смены маршрута — сбрасываем прогресс
    if (!s.lastPos) {
      s.t = 0;
      s.direction = 'forward';
      s.lastPos = { ...s.start };
      if (goshaSocket.connected) {
        goshaSocket.emit('location', {
          id: GOSHA_ID,
          lat: s.start.lat,
          lng: s.start.lng,
          accuracy: 10,
        });
      }
    }
    setIsRunning(true);
  };

  /** Остановить — Гоша остаётся стоять на последней позиции */
  const stopMovement = () => {
    setIsRunning(false);
    const s = ref.current;
    if (s.lastPos && goshaSocket.connected) {
      goshaSocket.emit('location', {
        id: GOSHA_ID,
        lat: s.lastPos.lat,
        lng: s.lastPos.lng,
        accuracy: 10,
      });
    }
  };

  /** Сбросить прогресс, чтобы следующий запуск начался с start */
  const resetRoute = () => {
    const s = ref.current;
    s.t = 0;
    s.direction = 'forward';
    s.lastPos = null;
    setIsRunning(false);
  };

  return {
    isRunning,
    speedKmh,
    start,
    end,
    connected,
    setSpeed: setSpeedKmh,
    setStart: (latLng: LatLng) => {
      setStart(latLng);
      resetRoute();
    },
    setEnd: (latLng: LatLng) => {
      setEnd(latLng);
      resetRoute();
    },
    startMovement,
    stopMovement,
    getCurrentPos: (): LatLng => ref.current.lastPos ?? ref.current.start,
  };
}