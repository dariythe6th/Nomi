import { useBotsContext } from './useBotsContext';
import { BOTS } from './bots';

export function BotsPanel() {
  const { running, ready, setRunning } = useBotsContext();

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 12,
        background: 'var(--bg-header)',
        color: 'var(--text-header)',
        border: '1px solid var(--border-strong)',
        borderRadius: 14,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        zIndex: 1100,
        minWidth: 180,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-header-muted)',
          marginBottom: 8,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        🧪 Боты ({BOTS.length})
      </div>

      <button
        onClick={() => setRunning(!running)}
        disabled={!ready}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: running ? 'transparent' : 'var(--accent)',
          color: running ? 'var(--text-header)' : '#fff',
          border: running ? '1px solid var(--border-strong)' : 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: ready ? 'pointer' : 'not-allowed',
          opacity: ready ? 1 : 0.5,
          transition: '0.15s',
        }}
      >
        {!ready ? 'Подготовка…' : running ? '⏹ Остановить' : '▶ Запустить'}
      </button>

      {running && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: 'var(--text-header-muted)',
          }}
        >
          {BOTS.map((b) => b.name).join(', ')} гуляют
        </div>
      )}
    </div>
  );
}