/**
 * Описание ботов-«кукушек», которые ходят по карте.
 * ⚠️ Только для тестов и демонстрации.
 */

export interface BotDefinition {
  id: string;
  name: string;
  /** Центр маршрута: широта */
  centerLat: number;
  /** Центр маршрута: долгота */
  centerLng: number;
  /** Радиус блуждания в метрах */
  radiusMeters: number;
  /** Скорость пешехода, км/ч */
  speedKmh: number;
}

export const BOTS: BotDefinition[] = [
  {
    id: 'bot-anya',
    name: 'Аня',
    // Проспект Вернадского, Москва (метро)
    centerLat: 55.6770,
    centerLng: 37.5158,
    radiusMeters: 400,
    speedKmh: 5,
  },
  {
    id: 'bot-boris',
    name: 'Борис',
    // Наро-Фоминск, Московская область
    centerLat: 55.3875,
    centerLng: 36.7300,
    radiusMeters: 500,
    speedKmh: 6,
  },
  {
    id: 'bot-vika',
    name: 'Вика',
    // Парк Горького
    centerLat: 55.7448,
    centerLng: 37.6054,
    radiusMeters: 600,
    speedKmh: 4,
  },
  {
    id: 'bot-grisha',
    name: 'Гриша',
    // Арбат
    centerLat: 55.7649,
    centerLng: 37.6048,
    radiusMeters: 350,
    speedKmh: 7,
  },
];