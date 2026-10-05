import { useEffect, useRef, useState } from 'react';
import { useGeolocated } from 'react-geolocated';
import {
  socket,
  getOrCreateUserId,
  getOrCreateUserName,
  saveUserName,
} from '../../shared/lib/socket';
import type { RemoteUser } from './types';

export function useLocationTracker() {
  const [connected, setConnected] = useState(false);
  const [others, setOthers] = useState<RemoteUser[]>([]);
  const [userName, setUserNameState] = useState(getOrCreateUserName());

  const userId = useRef(getOrCreateUserId());
  const userNameRef = useRef(userName);

  const { coords, isGeolocationAvailable, isGeolocationEnabled } = useGeolocated({
    positionOptions: { enableHighAccuracy: true },
    watchPosition: true,
  });

  // Синхронизируем имя в ref, чтобы использовать актуальное в socket-событиях
  useEffect(() => {
    userNameRef.current = userName;
  }, [userName]);

  // Подключение к серверу
  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      setConnected(true);
      socket.emit('register', {
        id: userId.current,
        name: userNameRef.current,
      });
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
      setOthers((prev) => {
        const idx = prev.findIndex((u) => u.id === data.id);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...data };
        return updated;
      });
    };

    const onUserLeft = ({ id }: { id: string }) => {
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
      socket.disconnect();
    };
  }, []);

  // Отправка своих координат при каждом обновлении от браузера
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