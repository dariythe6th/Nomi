import type { PlanResponse } from './types';

const MOTIS_BASE_URL = import.meta.env.DEV
  ? '/motis'
  : 'https://api.transitous.org/api/v2';

export interface PlanParams {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  transitModes?: string[];
  numItineraries?: number;
  /** Максимальное время в пути в секундах. По умолчанию — 4 часа. */
  maxTravelTime?: number;
}

export async function planRoute(params: PlanParams): Promise<PlanResponse> {
  const now = new Date();
  const time = now.toISOString().replace(/\.\d{3}Z$/, 'Z');

  const query = new URLSearchParams({
    fromPlace: `${params.from.lat},${params.from.lon}`,
    toPlace: `${params.to.lat},${params.to.lon}`,
    time,
    // ⚠️ Ключевые параметры:
    directModes: 'WALK',            // разрешить пешком напрямую
    transitModes: 'TRANSIT',        // общественный транспорт
    detailedTransfers: 'true',
    numItineraries: '5',
    maxTravelTime: '360',           // 6 часов в МИНУТАХ
    maxDirectTime: '7200',          // 2 часа на прямой маршрут (в секундах!)
  });

  const url = `${MOTIS_BASE_URL}/plan?${query.toString()}`;
  console.log('[MOTIS URL]', url);

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Transitous API error: ${response.status} ${response.statusText}` +
        (text ? ` — ${text.slice(0, 200)}` : ''),
    );
  }

  return response.json() as Promise<PlanResponse>;
}