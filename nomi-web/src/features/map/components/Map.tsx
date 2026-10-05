import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useTheme } from '../../../shared/theme/useTheme';

/* Светлые тайлы — OpenStreetMap */
const LIGHT_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const LIGHT_ATTR = '© OpenStreetMap contributors';

/* Тёмные тайлы — CARTO Dark Matter (бесплатно, без ключа) */
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '© OpenStreetMap contributors © CARTO';

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapProps {
  routePoints?: [number, number][];
}

export function Map({ routePoints }: MapProps) {
  const { theme } = useTheme();
  const center: [number, number] = [55.7558, 37.6173];

  const isDark = theme === 'dark';
  const tileUrl = isDark ? DARK_TILES : LIGHT_TILES;
  const attribution = isDark ? DARK_ATTR : LIGHT_ATTR;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%', background: isDark ? '#000' : '#fafafa' }}
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer key={theme} url={tileUrl} attribution={attribution} />

        <Marker position={center} icon={defaultIcon}>
          <Popup>Ты здесь</Popup>
        </Marker>

        {routePoints && routePoints.length > 1 && (
          <Polyline positions={routePoints} color="#0ABAB5" weight={5} />
        )}

        {/* Кастомный zoom control — справа, напротив меню */}
        <ZoomControls />
      </MapContainer>

      {/* Атрибуция — в правом нижнем углу */}
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
        {attribution} | Leaflet
      </div>
    </div>
  );
}

/* ===== Кастомные кнопки зума ===== */

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
    </div>
  );
}