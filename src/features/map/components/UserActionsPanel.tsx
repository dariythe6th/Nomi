import { useEffect, useState } from 'react';
import type { RemoteUser } from '../../location/types';
import { getUserProfile } from '../../profile/api';
import type { UserProfile } from '../../profile/types';

interface Props {
  user: RemoteUser;
  onBuildRoute?: () => void;
  onClearRoute?: () => void;
  routeLoading?: boolean;
  routeError?: string | null;
  hasRoute?: boolean;
}

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

const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const RouteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="19" r="3" />
    <circle cx="18" cy="5" r="3" />
    <path d="M9 19h6a4 4 0 0 0 4-4v-1" />
    <path d="M15 5H9a4 4 0 0 0-4 4v1" />
  </svg>
);

const STATIONARY_SPEED_MPS = 0.3;

function describeSpeed(speedMps: number): string {
  const kmh = speedMps * 3.6;
  if (kmh < 7) return `🚶 идёт · ${kmh.toFixed(1)} км/ч`;
  if (kmh < 25) return `🚴 едет · ${kmh.toFixed(1)} км/ч`;
  return `🚗 едет · ${kmh.toFixed(1)} км/ч`;
}

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

export function UserActionsPanel({
  user,
  onBuildRoute,
  onClearRoute,
  routeLoading,
  routeError,
  hasRoute,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    getUserProfile(user.id)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => console.warn('Не удалось загрузить профиль:', e));
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const isStationary = !user.speed || user.speed < STATIONARY_SPEED_MPS;

  const statusText = isStationary
    ? `🪶 кукует на месте ${formatStationary(
        now - (user.stationarySince ?? now),
      )}`
    : describeSpeed(user.speed ?? 0);

  const displayName = profile?.name || user.name;

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
        maxWidth: '90vw',
      }}
    >
      {/* Имя + статус */}
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
        <span>{displayName}</span>
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

      {/* Статус из профиля */}
      <div
        style={{
          padding: '6px 16px',
          background: 'var(--bg-header)',
          color: 'var(--text-header-muted)',
          border: '1px solid var(--border-strong)',
          borderRadius: 12,
          fontSize: 13,
          maxWidth: 360,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {profile?.status ? (
          `💬 ${profile.status}`
        ) : (
          <span style={{ opacity: 0.5 }}>— статус не указан —</span>
        )}
      </div>

      {/* Ошибка маршрута */}
      {routeError && (
        <div
          style={{
            padding: '8px 16px',
            background: '#ff4444',
            color: '#ffffff',
            border: '2px solid #ffffff',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            textAlign: 'center',
          }}
        >
          ⚠️ {routeError}
        </div>
      )}

      {/* Кнопки */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 8,
          background: 'var(--bg-header)',
          border: '1px solid var(--border-strong)',
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {/* Кнопка маршрута */}
        {onBuildRoute && (
          hasRoute ? (
            <button
              onClick={onClearRoute}
              title="Убрать маршрут"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'transparent',
                color: '#ff4444',
                border: '1px solid #ff4444',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                transition: '0.15s',
                boxShadow: '0 0 12px rgba(255, 68, 68, 0.35)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.15)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 68, 68, 0.35)';
              }}
            >
              <RouteIcon />
              <span>Убрать маршрут</span>
            </button>
          ) : (
            <button
              onClick={routeLoading ? undefined : onBuildRoute}
              title="Построить маршрут"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: routeLoading ? 'wait' : 'pointer',
                transition: '0.15s',
                boxShadow: '0 0 12px var(--accent-glow)',
              }}
            >
              <RouteIcon />
              <span>{routeLoading ? 'Строим…' : 'Маршрут'}</span>
            </button>
          )
        )}

        {/* Остальные кнопки — пока заморожены */}
        {[
          { label: 'Написать', Icon: MessageIcon },
          { label: 'Вызов', Icon: CallIcon },
          { label: 'Реакции', Icon: ReactionIcon },
          { label: 'Профиль', Icon: ProfileIcon },
        ].map(({ label, Icon }) => (
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