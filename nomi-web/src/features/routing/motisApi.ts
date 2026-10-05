import type { PlanResponse } from './types';

const MOTIS_BASE_URL = import.meta.env.DEV
  ? '/motis'
  : 'https://api.transitous.org/api/v2';

export interface PlanParams {
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  transitModes?: string[];
  numItineraries?: number;
}

export async function planRoute(params: PlanParams): Promise<PlanResponse> {
  const query = new URLSearchParams({
    fromPlace: `${params.from.lat},${params.from.lon}`,
    toPlace: `${params.to.lat},${params.to.lon}`,
    detailedTransfers: 'true',
    numItineraries: String(params.numItineraries ?? 3),
  });

  if (params.transitModes?.length) {
    query.set('transitModes', params.transitModes.join(','));
  }

  const url = `${MOTIS_BASE_URL}/plan?${query.toString()}`;

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