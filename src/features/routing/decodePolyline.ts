import polyline from '@mapbox/polyline';

/**
 * Декодирует Google encoded polyline в массив [lat, lng].
 * MOTIS 2 / Transitous возвращают геометрию в этом формате.
 */
export function decodeLegGeometry(encoded: string): [number, number][] {
  try {
    return polyline.decode(encoded) as [number, number][];
  } catch (e) {
    console.warn('Не удалось декодировать полилинию:', e);
    return [];
  }
}

/** Собрать все точки маршрута из itinerary */
export function itineraryToPoints(
  legs: { legGeometry?: { points?: string } }[],
): [number, number][] {
  const points: [number, number][] = [];
  for (const leg of legs) {
    const encoded = leg.legGeometry?.points;
    if (!encoded) continue;
    const decoded = decodeLegGeometry(encoded);
    points.push(...decoded);
  }
  return points;
}