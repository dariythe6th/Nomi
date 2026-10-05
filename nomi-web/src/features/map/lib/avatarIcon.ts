import { DivIcon } from 'leaflet';

interface AvatarIconOptions {
  name: string;
  avatarUrl?: string | null;
  online?: boolean;
  theme?: 'light' | 'dark';
}

export function createAvatarIcon({
  name,
  avatarUrl,
  online = true,
  theme = 'light',
}: AvatarIconOptions): DivIcon {
  const initial = (name.trim()[0] || '?').toUpperCase();

  const inner = avatarUrl
    ? `<img src="${avatarUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : initial;

  const textColor = theme === 'dark' ? '#000' : '#fff';

  const html = `
    <div class="nomi-avatar-marker">
      <div class="nomi-avatar-circle" style="color:${textColor};">
        ${inner}
      </div>
      ${online ? `<span class="nomi-avatar-online"></span>` : ''}
    </div>
  `;

  return new DivIcon({
    html,
    className: 'nomi-avatar-icon',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
    popupAnchor: [0, -28],
  });
}