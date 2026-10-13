import { useState } from 'react';
import { useRoutePlan } from '../useRoutePlan';
import type { Itinerary } from '../types';

interface RouteSearchProps {
  onSelect?: (itinerary: Itinerary) => void;
}

export function RouteSearch({ onSelect }: RouteSearchProps) {
  const [fromLat, setFromLat] = useState('55.7558');
  const [fromLon, setFromLon] = useState('37.6173');
  const [toLat, setToLat] = useState('55.7600');
  const [toLon, setToLon] = useState('37.6200');

  const { loading, error, itineraries, findRoute } = useRoutePlan();

  const handleSearch = () => {
    findRoute({
      from: { lat: parseFloat(fromLat), lon: parseFloat(fromLon) },
      to: { lat: parseFloat(toLat), lon: parseFloat(toLon) },
      transitModes: ['METRO', 'SUBWAY', 'TRAM', 'BUS'],
    });
  };

  return (
    <div>
      <h2>Маршрут</h2>

      <label>Откуда</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={fromLat} onChange={(e) => setFromLat(e.target.value)} placeholder="Широта" />
        <input value={fromLon} onChange={(e) => setFromLon(e.target.value)} placeholder="Долгота" />
      </div>

      <label>Куда</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={toLat} onChange={(e) => setToLat(e.target.value)} placeholder="Широта" />
        <input value={toLon} onChange={(e) => setToLon(e.target.value)} placeholder="Долгота" />
      </div>

      <button onClick={handleSearch} disabled={loading} style={{ width: '100%' }}>
        {loading ? 'Ищем...' : 'Найти маршрут'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}

      {itineraries.map((it, i) => (
        <div
          key={i}
          onClick={() => onSelect?.(it)}
          style={{
            border: '1px solid #ddd',
            borderRadius: 4,
            padding: 8,
            marginTop: 8,
            cursor: 'pointer',
          }}
        >
          <strong>Вариант {i + 1}</strong>
          <div>
            ~{Math.round(it.duration / 60)} мин · пересадок: {it.transfers}
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Сегментов: {it.legs.length}
          </div>
        </div>
      ))}
    </div>
  );
}