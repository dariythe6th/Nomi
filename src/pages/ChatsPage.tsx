export function ChatsPage() {
  const demos = [
    { name: 'Анна', preview: 'Ты где сейчас?', time: '12:34', online: true },
    { name: 'Дима', preview: 'Давай в 7 вечера у метро', time: '11:02', online: false },
    { name: 'Катя', preview: 'Кружочек отправила 👀', time: 'Вчера', online: true },
  ];

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      <h1 style={{ color: 'var(--text)', marginBottom: 16 }}>Чаты</h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          maxWidth: 640,
        }}
      >
        {demos.map((chat) => (
          <div
            key={chat.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 12,
              borderRadius: 10,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: '0.15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--bg-hover)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'var(--bg-panel)')
            }
          >
            {/* Аватар */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: 18,
                  border: '2px solid var(--accent)',
                  boxShadow: '0 0 8px var(--accent-glow)',
                }}
              >
                {chat.name[0]}
              </div>

              {/* Индикатор онлайн */}
              {chat.online && (
                <span
                  style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: '2px solid var(--bg-panel)',
                  }}
                />
              )}
            </div>

            {/* Текст */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: 'var(--text)',
                }}
              >
                {chat.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {chat.preview}
              </div>
            </div>

            {/* Время */}
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {chat.time}
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: 24,
            padding: 16,
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--text-muted)',
            border: '1px dashed var(--border)',
            borderRadius: 10,
          }}
        >
          🚧 Список чатов появится позже
        </div>
      </div>
    </div>
  );
}