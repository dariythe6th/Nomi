import { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useSearchParams } from 'react-router-dom';
import { useLocationTracker } from '../../location/useLocationTracker';
import { useMyProfile } from '../../profile/useMyProfile';
import { useFriendIds } from '../../friends/useFriendIds';
import { useRoutingTo } from '../../routing/useRoutingTo';
import { createAvatarIcon } from '../lib/avatarIcon';
import { UserActionsPanel } from './UserActionsPanel';
import { GoshaPanel } from '../../simulation/GoshaPanel';
import { BotsPanel } from '../../simulation/BotsPanel';
import { focusOnMap, panSmoothlyTo } from '../lib/mapFocus';

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTR = '© OpenStreetMap contributors';
const FOCUS_ZOOM = 17;

export function Map() {
  const { connected, others, myCoords, userName } = useLocationTracker();
  const { profile } = useMyProfile();
  const { friendIds } = useFriendIds();

  const {
    points: routePoints,
    loading: routeLoading,
    error,
    buildRoute,
    clear: clearRoute,
  } = useRoutingTo();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  // Фокус на пользователе, переданном через /map?focus=uid
  useEffect(() => {
    const focusUid = searchParams.get('focus');
    if (!focusUid) return;
    setSelectedUserId(focusUid);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Показываем: своих друзей + Гошу (для теста)
  const visibleOthers = others.filter(
    (u) => friendIds.has(u.id) || u.id === 'sim-gosha',
  );

  const selectedUser = visibleOthers.find((u) => u.id === selectedUserId) ?? null;
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

        {/* Подгоняет вид карты под маршрут */}
        <FitToRoute points={routePoints} />

        <MapClickHandler onMapClick={() => setSelectedUserId(null)} />

        {myCoords && (
          <Marker
            position={[myCoords.latitude, myCoords.longitude]}
            icon={createAvatarIcon({
              name: profile?.name || userName,
              avatarUrl: profile?.avatarUrl ?? null,
              theme: 'light',
            })}
          />
        )}

        {visibleOthers.map(
          (user) =>
            user.lat !== null &&
            user.lng !== null && (
              <Marker
                key={user.id}
                position={[user.lat, user.lng]}
                icon={createAvatarIcon({
                  name: user.name,
                  avatarUrl: null,
                  theme: 'light',
                })}
                riseOnHover
                keyboard={false}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    setSelectedUserId(user.id);
                  },
                }}
              />
            ),
        )}

        {/* Линия маршрута — красная с подсветкой */}
        {routePoints.length > 1 && (
          <>
            {/* Внешнее свечение */}
            <Polyline positions={routePoints} color="#ff4444" weight={16} opacity={0.25} />
            {/* Белая обводка */}
            <Polyline positions={routePoints} color="#ffffff" weight={9} opacity={0.9} />
            {/* Яркая красная линия */}
            <Polyline positions={routePoints} color="#ff4444" weight={5} />
          </>
        )}

        <ZoomControls myCoords={myCoords ?? null} />
        <ZoomIndicator />
      </MapContainer>

      {selectedUser && (
        <UserActionsPanel
          user={selectedUser}
          onBuildRoute={() => {
            if (
              !myCoords ||
              selectedUser.lat === null ||
              selectedUser.lng === null
            ) {
              return;
            }
            buildRoute({
              fromLat: myCoords.latitude,
              fromLng: myCoords.longitude,
              toLat: selectedUser.lat,
              toLng: selectedUser.lng,
            });
          }}
          onClearRoute={clearRoute}
          routeLoading={routeLoading}
          routeError={error}
          hasRoute={routePoints.length > 1}
        />
      )}

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
        {connected ? `Друзей онлайн: ${visibleOthers.length}` : 'Не подключено'}
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

            {/* Плавающая кнопка «Убрать маршрут» — показывается, когда панель скрыта, но маршрут есть */}
      {!selectedUser && routePoints.length > 1 && (
        <button
          onClick={clearRoute}
          title="Убрать маршрут"
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: 'var(--bg-header)',
            color: '#ff4444',
            border: '1px solid #ff4444',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(255, 68, 68, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)',
            zIndex: 1200,
            transition: '0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 68, 68, 0.15)';
            e.currentTarget.style.boxShadow =
              '0 0 32px rgba(255, 68, 68, 0.8), 0 8px 24px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-header)';
            e.currentTarget.style.boxShadow =
              '0 0 20px rgba(255, 68, 68, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <span>Убрать маршрут</span>
        </button>
      )}

      <BotsPanel />

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

    if (isNewSelection) {
      focusOnMap(map, user.lat, user.lng, { zoom: FOCUS_ZOOM });
      lastCenter.current = { lat: user.lat, lng: user.lng };
      nextPanAllowed.current = Date.now() + 1300;
      return;
    }

    const now = Date.now();
    if (now < nextPanAllowed.current) return;

    const last = lastCenter.current;
    if (last) {
      const moved = distanceMeters(last.lat, last.lng, user.lat, user.lng);
      if (moved < 2) return;
    }

    lastCenter.current = { lat: user.lat, lng: user.lng };
    nextPanAllowed.current = now + 500;

    panSmoothlyTo(map, user.lat, user.lng, 0.6);
  }, [user?.id, user?.lat, user?.lng, map]);

  return null;
}

/** Подгоняет вид карты под массив точек (например, под маршрут) */
function FitToRoute({ points }: { points: [number, number][] }) {
  const map = useMap();
  const lastFitKey = useRef<string>('');

  useEffect(() => {
    if (points.length < 2) return;

    // Ключ — по первой и последней точке, чтобы не дёргать fitBounds при каждом рендере
    const key = `${points[0][0]}_${points[0][1]}_${points[points.length - 1][0]}_${points[points.length - 1][1]}`;
    if (key === lastFitKey.current) return;
    lastFitKey.current = key;

    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, {
      padding: [80, 80],
      animate: true,
      duration: 0.9,
    });
  }, [points, map]);

  return null;
}

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