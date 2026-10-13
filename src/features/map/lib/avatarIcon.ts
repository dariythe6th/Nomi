import { DivIcon } from 'leaflet';

interface AvatarIconOptions {
  name: string;
  avatarUrl?: string | null;
  /** Больше не используется, оставлен для совместимости */
  online?: boolean;
  theme?: 'light' | 'dark';
}

export function createAvatarIcon({
  avatarUrl,
  theme = 'light',
}: AvatarIconOptions): DivIcon {
  const strokeColor = theme === 'dark' ? '#000000' : '#ffffff';

  // Уникальный id клипа для каждой картинки, чтобы SVG-клипы не конфликтовали
  const clipId = `pin-clip-${Math.random().toString(36).slice(2, 8)}`;

  // Что показываем внутри круга: реальную аватарку или иконку-заглушку
  const inner = avatarUrl
    ? `
      <defs>
        <clipPath id="${clipId}">
          <circle cx="26" cy="26" r="22" />
        </clipPath>
      </defs>
      <image
        href="${avatarUrl}"
        x="4" y="4" width="44" height="44"
        clip-path="url(#${clipId})"
        preserveAspectRatio="xMidYMid slice"
      />
    `
    : `
      <!-- Иконка-заглушка: силуэт человека -->
      <g fill="#ffffff">
        <circle cx="26" cy="19" r="7" />
        <path d="M13 41 C13 33 19 29 26 29 C33 29 39 33 39 41 Z" />
      </g>
    `;

  const html = `
    <div style="width:52px;height:52px;background:transparent;border:none;display:block;pointer-events:none;">
      <svg xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 52 52" width="52" height="52"
           style="display:block; overflow:visible; pointer-events:none;">
        <circle cx="26" cy="26" r="24"
                fill="#0ABAB5"
                stroke="${strokeColor}"
                stroke-width="2"/>
        ${inner}
      </svg>
    </div>
  `;

  return new DivIcon({
    html,
    className: 'nomi-pin-icon',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -28],
  });
}