import { DivIcon } from 'leaflet';

interface AvatarIconOptions {
  name: string;
  avatarUrl?: string | null;
  online?: boolean;
  theme?: 'light' | 'dark';
}

export function createAvatarIcon({
  name,
  online = true,
  theme = 'light',
}: AvatarIconOptions): DivIcon {
  const initial = (name.trim()[0] || '?').toUpperCase();
  const strokeColor = theme === 'dark' ? '#000000' : '#ffffff';

  const html = `
    <div style="
      width:48px;
      height:60px;
      background:transparent;
      border:none;
      display:block;
    ">
      <svg xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 48 60"
           width="48"
           height="60"
           style="display:block; overflow:visible;">
        <ellipse cx="24" cy="57" rx="7" ry="2.5" fill="rgba(0,0,0,0.25)"/>
        <path d="M24 2 C11 2 1 12 1 25 C1 38 24 58 24 58 C24 58 47 38 47 25 C47 12 37 2 24 2 Z"
              fill="#0ABAB5"
              stroke="${strokeColor}"
              stroke-width="2"/>
        <text x="24" y="31"
              text-anchor="middle"
              font-family="Arial, sans-serif"
              font-size="18"
              font-weight="700"
              fill="#ffffff"
              style="user-select:none;">${initial}</text>
        ${
          online
            ? `<circle cx="40" cy="10" r="7" fill="#ffffff" stroke="#0ABAB5" stroke-width="2.5"/>`
            : ''
        }
      </svg>
    </div>
  `;

  return new DivIcon({
    html,
    className: 'nomi-pin-icon',
    iconSize: [48, 60],
    iconAnchor: [24, 58],
    popupAnchor: [0, -58],
  });
}