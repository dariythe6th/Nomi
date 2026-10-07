import { useState } from 'react';
import { useGosha, type LatLng } from './useGosha';

interface Props {
  onFocus?: (pos: LatLng) => void;
}

const TargetIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="1" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="23" />
    <line x1="1" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="23" y2="12" />
  </svg>
);

export function GoshaPanel({ onFocus }: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const {
    isRunning,
    speedKmh,
    start,
    end,
    connected,
    setSpeed,
    setStart,
    setEnd,
    startMovement,
    stopMovement,
    getCurrentPos,
  } = useGosha();

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    background: 'rgba(255, 255, 255, 0.08)',
    color: 'var(--text-header)',
    border: '1px solid var(--border-strong)',
    borderRadius: 6,
    fontSize: 12,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: 'var(--text-header-muted)',
    marginBottom: 4,
    display: 'block',
  };

  /** Обработчик кнопки «Перенести на Гошу» */
  const handleFocus = () => {
    if (!onFocus) return;
    const pos = getCurrentPos();
    onFocus(pos);
  };

  // Кнопка-прицел (переиспользуется в обоих состояниях)
  const focusButton = (
    <button
      onClick={handleFocus}
      title="Перенести карту на Гошу"
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: 'var(--bg-header)',
        color: 'var(--text-header)',
        border: '1px solid var(--border-strong)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        transition: '0.15s',
        padding: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-header)')}
    >
      <TargetIcon />
    </button>
  );

  // ===== Свёрнутое состояние =====
  if (collapsed) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          zIndex: 1100,
        }}
      >
        {focusButton}

        <button
          onClick={() => setCollapsed(false)}
          title="Открыть панель симуляции"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'var(--bg-header)',
            color: 'var(--text-header)',
            border: '1px solid var(--border-strong)',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          }}
        >
          <span style={{ fontSize: 16 }}>🐕</span>
          <span>Гоша</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isRunning ? '#0ABAB5' : '#888',
              boxShadow: isRunning ? '0 0 6px #0ABAB5' : 'none',
            }}
          />
        </button>
      </div>
    );
  }

  // ===== Развёрнутое состояние =====
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 260,
        background: 'var(--bg-header)',
        color: 'var(--text-header)',
        border: '1px solid var(--border-strong)',
        borderRadius: 14,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        zIndex: 1100,
        overflow: 'hidden',
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: '1px solid var(--border-strong)',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <span>🐕</span>
        <span>Гоша</span>
        <span
          title={connected ? 'Подключён к серверу' : 'Нет связи с сервером'}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: connected ? '#0ABAB5' : '#ff4444',
            boxShadow: connected ? '0 0 6px #0ABAB5' : 'none',
          }}
        />
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: 'var(--text-header-muted)',
            fontWeight: 400,
          }}
        >
          {isRunning ? '🚶 идёт' : '⏸ стоит'}
        </span>

        {/* Кнопка «перенести на Гошу» в шапке */}
        <button
          onClick={handleFocus}
          title="Перенести карту на Гошу"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'transparent',
            color: 'var(--text-header)',
            border: '1px solid var(--border-strong)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: '0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'transparent')
          }
        >
          <TargetIcon />
        </button>

        <button
          onClick={() => setCollapsed(true)}
          title="Свернуть"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-header-muted)',
            cursor: 'pointer',
            fontSize: 16,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Тело */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Скорость */}
        <div>
          <label style={labelStyle}>Скорость, км/ч</label>
          <input
            type="number"
            min={1}
            max={60}
            value={speedKmh}
            onChange={(e) => setSpeed(Math.max(1, Number(e.target.value) || 1))}
            style={inputStyle}
          />
        </div>

        {/* Старт */}
        <div>
          <label style={labelStyle}>Старт</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <input
              type="number"
              step="0.0001"
              value={start.lat}
              onChange={(e) =>
                setStart({ ...start, lat: Number(e.target.value) || 0 })
              }
              style={inputStyle}
            />
            <input
              type="number"
              step="0.0001"
              value={start.lng}
              onChange={(e) =>
                setStart({ ...start, lng: Number(e.target.value) || 0 })
              }
              style={inputStyle}
            />
          </div>
        </div>

        {/* Финиш */}
        <div>
          <label style={labelStyle}>Финиш</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <input
              type="number"
              step="0.0001"
              value={end.lat}
              onChange={(e) =>
                setEnd({ ...end, lat: Number(e.target.value) || 0 })
              }
              style={inputStyle}
            />
            <input
              type="number"
              step="0.0001"
              value={end.lng}
              onChange={(e) =>
                setEnd({ ...end, lng: Number(e.target.value) || 0 })
              }
              style={inputStyle}
            />
          </div>
        </div>

        {/* Кнопки */}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <button
            onClick={startMovement}
            disabled={isRunning}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: isRunning ? 'transparent' : 'var(--accent)',
              color: isRunning ? 'var(--text-header-muted)' : '#fff',
              border: isRunning ? '1px solid var(--border-strong)' : 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.5 : 1,
            }}
          >
            ▶ Пустить
          </button>
          <button
            onClick={stopMovement}
            disabled={!isRunning}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'transparent',
              color: !isRunning ? 'var(--text-header-muted)' : 'var(--text-header)',
              border: '1px solid var(--border-strong)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: !isRunning ? 'not-allowed' : 'pointer',
              opacity: !isRunning ? 0.5 : 1,
            }}
          >
            ⏹ Стоп
          </button>
        </div>
      </div>
    </div>
  );
}