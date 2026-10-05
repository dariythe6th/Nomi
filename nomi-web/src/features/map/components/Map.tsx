import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import { useEffect, useRef } from 'react';
import { useTheme } from '../../../shared/theme/useTheme';
import { useLocationTracker } from '../../location/useLocationTracker';
import { createAvatarIcon } from '../lib/avatarIcon'; // ← ЭТО ДОБАВЬ

const LIGHT_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const LIGHT_ATTR = '© OpenStreetMap contributors';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '© OpenStreetMap contributors © CARTO';

interface MapProps {
  routePoints?: [number, number][];
}

export function Map({ routePoints }: MapProps) {
  const { theme } = useTheme();
  // ← ЭТО ЗАМЕНИ: добавили userName
  const { connected, others, myCoords, userName } = useLocationTracker();

  const isDark = theme === 'dark';
  const center: [number, number] = [55.7558, 37.6173];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%', background: isDark ? '#000' : '#fafafa' }}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer
          key={theme}
          url={isDark ? DARK_TILES : LIGHT_TILES}
          attribution={isDark ? DARK_ATTR : LIGHT_ATTR}
        />

        <CenterOnMe coords={myCoords ?? null} />

        {/* ← ЭТО ЗАМЕНИ: свой маркер теперь — круглая аватарка */}
        {myCoords && (
          <Marker
            position={[myCoords.latitude, myCoords.longitude]}
            icon={createAvatarIcon({
              name: userName,
              avatarUrl: null,
              online: true,
              theme,
            })}
          >
            <Popup>
              <strong>{userName}</strong>
              <br />
              Это ты
            </Popup>
          </Marker>
        )}

        {/* Маркеры других пользователей — тоже кружки */}
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
                  online: Date.now() - user.lastSeen < 60_000,
                  theme,
                })}
              >
                <Popup>
                  <strong>{user.name}</strong>
                  <br />
                  Точность: ±{Math.round(user.accuracy ?? 0)} м
                </Popup>
              </Marker>
            ),
        )}

        {routePoints && routePoints.length > 1 && (
          <Polyline positions={routePoints} color="#0ABAB5" weight={5} />
        )}

        <ZoomControls />
      </MapContainer>

      {/* Индикатор состояния подключения */}
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
          background: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.85)',
          color: isDark ? '#aaa' : '#555',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        {(isDark ? DARK_ATTR : LIGHT_ATTR)} | Leaflet
      </div>
    </div>
  );
}

/* ===== Вспомогательные компоненты ===== */

function CenterOnMe({
  coords,
}: {
  coords: { latitude: number; longitude: number } | null;
}) {
  const map = useMap();
  const done = useRef(false);

  useEffect(() => {
    if (!coords || done.current) return;
    map.setView([coords.latitude, coords.longitude], 15);
    done.current = true;
  }, [coords, map]);

  return null;
}

function ZoomControls() {
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
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-header)')}
      >
        +
      </button>
      <button
        style={btnStyle}
        onClick={() => map.zoomOut()}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-header)')}
      >
        −
      </button>
    </div>
  );
}