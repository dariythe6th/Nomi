import { useCallback, useState } from 'react';
import { itineraryToPoints } from './decodePolyline';

interface Options {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}

interface State {
  loading: boolean;
  error: string | null;
  points: [number, number][];
  /** Расстояние в метрах */
  distance: number | null;
  /** Длительность в секундах */
  duration: number | null;
}

const OSRM_URL = 'https://router.project-osrm.org/route/v1';

/**
 * Публичный OSRM-сервер. Маршрут по улицам через OpenStreetMap.
 * Профили: foot, bike, car.
 */
export function useRoutingTo() {
  const [state, setState] = useState<State>({
    loading: false,
    error: null,
    points: [],
    distance: null,
    duration: null,
  });

  const buildRoute = useCallback(
    async ({ fromLat, fromLng, toLat, toLng }: Options) => {
      setState({ loading: true, error: null, points: [], distance: null, duration: null });

      // OSRM ждёт координаты в порядке lon,lat
      const url = `${OSRM_URL}/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      console.log('[OSRM URL]', url);

      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`OSRM error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log('[OSRM response]', data);

        if (!data.routes?.length) {
          setState({
            loading: false,
            error: 'Маршрут не найден',
            points: [],
            distance: null,
            duration: null,
          });
          return;
        }

        const route = data.routes[0];
        // GeoJSON координаты: [[lng, lat], ...] — переворачиваем в [lat, lng]
        const coordinates = route.geometry.coordinates as [number, number][];
        const points: [number, number][] = coordinates.map(([lng, lat]) => [lat, lng]);

        setState({
          loading: false,
          error: null,
          points,
          distance: route.distance,
          duration: route.duration,
        });
      } catch (e) {
        console.error('[OSRM error]', e);
        setState({
          loading: false,
          error: (e as Error).message,
          points: [],
          distance: null,
          duration: null,
        });
      }
    },
    [],
  );

  const clear = useCallback(() => {
    setState({ loading: false, error: null, points: [], distance: null, duration: null });
  }, []);

  return { ...state, buildRoute, clear };
}