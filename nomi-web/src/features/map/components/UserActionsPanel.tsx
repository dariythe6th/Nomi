import { useEffect, useState } from 'react';
import type { RemoteUser } from '../../location/types';

interface Props {
  user: RemoteUser;
}

const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CallIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ReactionIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const buttons = [
  { label: 'Профиль', Icon: ProfileIcon },
  { label: 'Написать', Icon: MessageIcon },
  { label: 'Вызов', Icon: CallIcon },
  { label: 'Реакции', Icon: ReactionIcon },
];

/** Порог, ниже которого считаем «стоит» (м/с) */
const STATIONARY_SPEED_MPS = 0.3;

/** Описание скорости для движущегося пользователя */
function describeSpeed(speedMps: number): string {
  const kmh = speedMps * 3.6;
  if (kmh < 7) return `🚶 идёт · ${kmh.toFixed(1)} км/ч`;
  if (kmh < 25) return `🚴 едет · ${kmh.toFixed(1)} км/ч`;
  return `🚗 едет · ${kmh.toFixed(1)} км/ч`;
}

/** Форматирует «сколько стоит на месте»: секунды → минуты → часы → дни */
function formatStationary(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));

  if (totalSec < 60) return `${totalSec} сек`;
  if (totalSec < 3600) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return s > 0 ? `${m} мин ${s} сек` : `${m} мин`;
  }
  if (totalSec < 86400) {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
  }
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  return h > 0 ? `${d} д ${h} ч` : `${d} д`;
}

export function UserActionsPanel({ user }: Props) {
  // Храним текущее время в state — обновляем раз в секунду
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const isStationary = !user.speed || user.speed < STATIONARY_SPEED_MPS;

  const statusText = isStationary
    ? `🪶 кукует на месте ${formatStationary(
        now - (user.stationarySince ?? now),
      )}`
    : describeSpeed(user.speed ?? 0);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        zIndex: 1200,
      }}
    >
      {/* Информационная плашка над кнопками */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 16px',
          background: 'var(--bg-header)',
          color: 'var(--text-header)',
          border: '1px solid var(--border-strong)',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          whiteSpace: 'nowrap',
        }}
      >
        <span>{user.name}</span>
        <span
          style={{
            width: 1,
            height: 16,
            background: 'var(--border-strong)',
          }}
        />
        <span
          style={{
            color: isStationary ? 'var(--text-header-muted)' : 'var(--accent)',
            fontWeight: 500,
            fontSize: 13,
          }}
        >
          {statusText}
        </span>
      </div>

      {/* Панель с кнопками */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 8,
          background: 'var(--bg-header)',
          border: '1px solid var(--border-strong)',
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        }}
      >
        {buttons.map(({ label, Icon }) => (
          <button
            key={label}
            disabled
            title={`${label} — в разработке`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'transparent',
              color: 'var(--text-header)',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              cursor: 'not-allowed',
              opacity: 0.6,
              transition: '0.15s',
            }}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}