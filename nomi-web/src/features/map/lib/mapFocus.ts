import type { Map as LeafletMap } from 'leaflet';

interface FocusOptions {
  /** Целевой зум. Если не указан — берётся max(текущий зум, minZoom). */
  zoom?: number;
  /** Минимальный зум, до которого точно нужно приблизиться. По умолчанию 15 */
  minZoom?: number;
  /** Длительность анимации в секундах. По умолчанию 1.2 */
  duration?: number;
  /**
   * Кривая анимации (0–1):
   *   - 0.1 — очень плавно, с долгим торможением
   *   - 0.25 — баланс (по умолчанию)
   *   - 0.5 — резко
   */
  easeLinearity?: number;
}

/**
 * Красивая анимация перелёта к точке на карте.
 * Leaflet сам рисует «пролёт» — карта как бы приближается по дуге.
 */
export function focusOnMap(
  map: LeafletMap,
  lat: number,
  lng: number,
  options: FocusOptions = {},
) {
  const {
    zoom,
    minZoom = 15,
    duration = 1.2,
    easeLinearity = 0.25,
  } = options;

  // Если зум не задан — берём максимум из текущего и минимального,
  // чтобы не «отдаляться», если пользователь уже приблизил карту
  const targetZoom = zoom ?? Math.max(map.getZoom(), minZoom);

  map.flyTo([lat, lng], targetZoom, {
    duration,
    easeLinearity,
  });
}

/**
 * Короткая анимация перемещения без изменения зума.
 * Используется, когда нужно мягко сместить центр (например, слежение).
 */
export function panSmoothlyTo(
  map: LeafletMap,
  lat: number,
  lng: number,
  duration = 0.6,
) {
  map.panTo([lat, lng], {
    animate: true,
    duration,
    easeLinearity: 0.5,
  });
}