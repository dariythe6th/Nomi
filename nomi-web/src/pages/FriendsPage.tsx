export function FriendsPage() {
  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      <h1 style={{ color: 'var(--text)', marginBottom: 16 }}>Друзья</h1>

      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
        Здесь будет список друзей и построение маршрута до встречи.
      </p>

      <div
        style={{
          padding: 16,
          background: 'var(--bg-panel)',
          border: '1px dashed var(--border)',
          borderRadius: 10,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        🚧 Раздел в разработке
      </div>
    </div>
  );
}