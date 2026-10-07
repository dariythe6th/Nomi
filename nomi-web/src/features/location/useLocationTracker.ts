import { useEffect, useRef, useState } from 'react';
import { useLocationContext } from './useLocationContext';
import {
  socket,
  getOrCreateUserId,
  getOrCreateUserName,
  saveUserName,
} from '../../shared/lib/socket';
import type { RemoteUser } from './types';

/** Порог, ниже которого считаем «стоит» (м/с) */
const STATIONARY_SPEED_MPS = 0.3;

/** Временное окно для расчёта скорости (мс) */
const SPEED_WINDOW_MS = 3000;

/** Расстояние между координатами в метрах (гаверсинус) */
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

interface Point {
  lat: number;
  lng: number;
  t: number;
}

export function useLocationTracker() {
  const [connected, setConnected] = useState(false);
  const [others, setOthers] = useState<RemoteUser[]>([]);
  const [userName, setUserNameState] = useState(getOrCreateUserName());

  const userId = useRef(getOrCreateUserId());
  const userNameRef = useRef(userName);

  /** История точек за последние 3 сек — для расчёта средней скорости */
  const historyRef = useRef<Map<string, Point[]>>(new Map());

  /** Время, с которого пользователь стоит на месте */
  const stationaryRef = useRef<Map<string, number>>(new Map());

  const {
    coords,
    isAvailable: isGeolocationAvailable,
    isEnabled: isGeolocationEnabled,
  } = useLocationContext();

  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      setConnected(true);
      socket.emit('register', { id: userId.current, name: userNameRef.current });
    };

    const onDisconnect = () => setConnected(false);

    const onInit = ({ others }: { others: RemoteUser[] }) => {
      setOthers(others);
    };

    const onUserJoined = (user: RemoteUser) => {
      setOthers((prev) => {
        const idx = prev.findIndex((u) => u.id === user.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = user;
          return updated;
        }
        return [...prev, user];
      });
    };

    const onLocationUpdate = (data: {
      id: string;
      lat: number;
      lng: number;
      accuracy: number;
      lastSeen: number;
    }) => {
      const now = Date.now();
      const history = historyRef.current;
      const stationaryMap = stationaryRef.current;

      // === Обновляем историю точек ===
      const list = history.get(data.id) ?? [];
      list.push({ lat: data.lat, lng: data.lng, t: now });

      // Оставляем только последние 3 секунды
      const cutoff = now - SPEED_WINDOW_MS;
      const recent = list.filter((p) => p.t > cutoff);
      history.set(data.id, recent);

      // === Считаем скорость по временному окну ===
      let speed = 0;
      if (recent.length >= 2) {
        const oldest = recent[0];
        const dt = (now - oldest.t) / 1000;
        const dist = distanceMeters(oldest.lat, oldest.lng, data.lat, data.lng);
        if (dt > 0) speed = dist / dt;
      }

      // === Время стояния ===
      let stationarySince: number;
      if (speed < STATIONARY_SPEED_MPS) {
        // Если уже стоял — сохраняем прежнее время; если нет — начинаем отсчёт
        stationarySince = stationaryMap.get(data.id) ?? now;
        stationaryMap.set(data.id, stationarySince);
        speed = 0;
      } else {
        // Движется — сбрасываем «время стояния»
        stationaryMap.delete(data.id);
        stationarySince = now;
      }

      setOthers((prevList) => {
        const idx = prevList.findIndex((u) => u.id === data.id);
        if (idx === -1) {
          return [
            ...prevList,
            {
              id: data.id,
              name: 'Гость',
              lat: data.lat,
              lng: data.lng,
              accuracy: data.accuracy,
              lastSeen: data.lastSeen,
              speed,
              stationarySince,
            },
          ];
        }
        const updated = [...prevList];
        updated[idx] = { ...updated[idx], ...data, speed, stationarySince };
        return updated;
      });
    };

    const onUserLeft = ({ id }: { id: string }) => {
      historyRef.current.delete(id);
      stationaryRef.current.delete(id);
      setOthers((prev) => prev.filter((u) => u.id !== id));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('init', onInit);
    socket.on('user-joined', onUserJoined);
    socket.on('location-update', onLocationUpdate);
    socket.on('user-left', onUserLeft);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('init', onInit);
      socket.off('user-joined', onUserJoined);
      socket.off('location-update', onLocationUpdate);
      socket.off('user-left', onUserLeft);
    };
  }, []);

  useEffect(() => {
    if (!connected || !coords) return;
    socket.emit('location', {
      id: userId.current,
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
    });
  }, [connected, coords]);

  return {
    connected,
    others,
    myCoords: coords,
    isGeolocationAvailable,
    isGeolocationEnabled,
    userName,
    setUserName: (name: string) => {
      setUserNameState(name);
      saveUserName(name);
      socket.emit('register', { id: userId.current, name });
    },
  };
}