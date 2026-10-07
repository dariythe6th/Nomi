import { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useLocationTracker } from '../../location/useLocationTracker';
import { createAvatarIcon } from '../lib/avatarIcon';
import { UserActionsPanel } from './UserActionsPanel';
import { GoshaPanel } from '../../simulation/GoshaPanel';
import { focusOnMap, panSmoothlyTo } from '../lib/mapFocus';

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '© OpenStreetMap contributors';
const FOCUS_ZOOM = 17;

interface MapProps {
  routePoints?: [number, number][];
}

export function Map({ routePoints }: MapProps) {
  const { connected, others, myCoords, userName } = useLocationTracker();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const selectedUser = others.find((u) => u.id === selectedUserId) ?? null;
  const center: [number, number] = [55.7558, 37.6173];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%', background: '#fafafa' }}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer url={TILES} attribution={ATTR} />

        <MapRefSaver mapRef={mapRef} />

        <CenterOnMe coords={myCoords ?? null} />

        <FollowUser user={selectedUser} />

        <MapClickHandler onMapClick={() => setSelectedUserId(null)} />

        {myCoords && (
          <Marker
            position={[myCoords.latitude, myCoords.longitude]}
            icon={createAvatarIcon({
              name: userName,
              avatarUrl: null,
              online: true,
              theme: 'light',
            })}
          >
              {/* <Popup>
                <strong>{userName}</strong>
                <br />
                Это ты
              </Popup> */}
          </Marker>
        )}

        {others.map(
          (user) =>
            user.lat !== null &&
            user.lng !== null && (
              <Marker
                key={user.id}
                position={[user.lat, user.lng]}
                icon={createAvatarIcon({
                  name: user.name,
                  avatarUrl: null,
                  online: true,
                  theme: 'light',
                })}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    setSelectedUserId(user.id);
                  },
                }}
              />
            ),
        )}

        {routePoints && routePoints.length > 1 && (
          <Polyline positions={routePoints} color="#0ABAB5" weight={5} />
        )}

        <ZoomControls myCoords={myCoords ?? null} />
        <ZoomIndicator />
      </MapContainer>

      {selectedUser && <UserActionsPanel user={selectedUser} />}

      {/* Индикатор подключения */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: 'var(--bg-header)',
          color: 'var(--text-header)',
          borderRadius: 12,
          fontSize: 13,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          zIndex: 1100,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: connected ? '#0ABAB5' : '#ff4444',
            boxShadow: connected ? '0 0 8px #0ABAB5' : 'none',
          }}
        />
        {connected ? `В сети · ${others.length + 1} чел.` : 'Не подключено'}
      </div>

      {/* Атрибуция */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          right: 8,
          background: 'rgba(255, 255, 255, 0.85)',
          color: '#555',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        {ATTR} | Leaflet
      </div>

      {/* Панель симуляции Гоши */}
      <GoshaPanel
        onFocus={(pos) => {
          const map = mapRef.current;
          if (!map) return;
          focusOnMap(map, pos.lat, pos.lng, { minZoom: 15 });
        }}
      />
    </div>
  );
}

/* ==================== Вспомогательные компоненты ==================== */

function CenterOnMe({
  coords,
}: {
  coords: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (!coords || done.current) return;
    focusOnMap(map, coords.latitude, coords.longitude, {
      zoom: 15,
      duration: 1.5,
    });
    done.current = true;
  }, [coords, map]);

  return null;
}

/**
 * Слежение за выбранным пользователем.
 * - Первый клик — flyTo с зумом.
 * - Дальше — panTo с throttle (не чаще 1 раза в 500 мс)
 *   и порогом по расстоянию (минимум 2 м сдвига).
 */
function FollowUser({
  user,
}: {
  user: { id: string; lat: number | null; lng: number | null } | null;
}) {
  const map = useMap();
  const prevId = useRef<string | null>(null);
  const lastCenter = useRef<{ lat: number; lng: number } | null>(null);
  const nextPanAllowed = useRef(0);

  useEffect(() => {
    if (!user || user.lat === null || user.lng === null) {
      prevId.current = null;
      lastCenter.current = null;
      nextPanAllowed.current = 0;
      return;
    }

    const isNewSelection = prevId.current !== user.id;
    prevId.current = user.id;

    // Первый клик — плавный полёт с зумом
    if (isNewSelection) {
      focusOnMap(map, user.lat, user.lng, { zoom: FOCUS_ZOOM });
      lastCenter.current = { lat: user.lat, lng: user.lng };
      nextPanAllowed.current = Date.now() + 1300;
      return;
    }

    // Последующие обновления — panTo
    const now = Date.now();
    if (now < nextPanAllowed.current) return;

    const last = lastCenter.current;
    if (last) {
      const moved = distanceMeters(last.lat, last.lng, user.lat, user.lng);
      if (moved < 2) return; // игнорируем мелкий GPS-шум
    }

    lastCenter.current = { lat: user.lat, lng: user.lng };
    nextPanAllowed.current = now + 500;

    panSmoothlyTo(map, user.lat, user.lng, 0.6);
  }, [user?.id, user?.lat, user?.lng, map]);

  return null;
}

/* Расстояние между координатами в метрах */
function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
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

/* Описание скорости в человекочитаемом виде */
function describeSpeed(speedMps: number): string {
  const kmh = speedMps * 3.6;
  if (kmh < 7) return `🚶 идёт · ${kmh.toFixed(1)} км/ч`;
  if (kmh < 25) return `🚴 едет · ${kmh.toFixed(1)} км/ч`;
  return `🚗 едет · ${kmh.toFixed(1)} км/ч`;
}

/** Сбрасывает выбор при клике по пустому месту карты */
function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
  const map = useMap();

  useEffect(() => {
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);

  return null;
}

/** Показывает зум в левом нижнем углу на 2 секунды после изменения */
function ZoomIndicator() {
  const map = useMap();
  const [zoom, setZoom] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const onZoomEnd = () => {
      setZoom(map.getZoom());
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setZoom(null), 2000);
    };

    map.on('zoomend', onZoomEnd);
    return () => {
      map.off('zoomend', onZoomEnd);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [map]);

  if (zoom === null) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        padding: '8px 14px',
        background: 'var(--bg-header)',
        color: 'var(--text-header)',
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        zIndex: 1100,
        pointerEvents: 'none',
      }}
    >
      Масштаб: {zoom}
    </div>
  );
}

/* ==================== Кнопки зума ==================== */

function ZoomControls({
  myCoords,
}: {
  myCoords: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();

  const btnStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'var(--bg-header)',
    color: 'var(--text-header)',
    border: '1px solid var(--border-strong)',
    fontSize: 22,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
    transition: '0.15s',
    padding: 0,
    lineHeight: 1,
    userSelect: 'none',
  };

  const handleCenter = () => {
    if (myCoords) {
      focusOnMap(map, myCoords.latitude, myCoords.longitude, { minZoom: 15 });
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        right: 20,
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1100,
      }}
    >
      <button
        style={btnStyle}
        onClick={() => map.zoomIn()}
        title="Приблизить"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-header)')}
      >
        +
      </button>

      <button
        style={btnStyle}
        onClick={() => map.zoomOut()}
        title="Отдалить"
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-header)')}
      >
        −
      </button>

      <button
        style={{
          ...btnStyle,
          fontSize: 0,
          color: myCoords ? 'var(--text-header)' : 'var(--text-muted)',
          cursor: myCoords ? 'pointer' : 'not-allowed',
          opacity: myCoords ? 1 : 0.5,
        }}
        onClick={handleCenter}
        disabled={!myCoords}
        title={myCoords ? 'Найти меня' : 'Геолокация недоступна'}
        onMouseEnter={(e) => {
          if (myCoords) e.currentTarget.style.background = 'var(--accent)';
        }}
        onMouseLeave={(e) => {
          if (myCoords) e.currentTarget.style.background = 'var(--bg-header)';
        }}
      >
        <TargetIcon />
      </button>
    </div>
  );
}

const TargetIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="1" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="23" />
    <line x1="1" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="23" y2="12" />
  </svg>
);

/** Сохраняет экземпляр карты Leaflet в ref родителя */
function MapRefSaver({
  mapRef,
}: {
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}