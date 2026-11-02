import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useMessages } from '../useMessages';
import { sendMessage } from '../api';

interface Props {
  chatId: string;
  chatName: string;
}

export function ChatWindow({ chatId, chatName }: Props) {
  const { user } = useAuth();
  const messages = useMessages(chatId);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Авто-скролл вниз при новом сообщении
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const msg = text.trim();
    setText('');
    await sendMessage(chatId, user.uid, msg);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Шапка чата */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>{chatName}</h2>
      </div>

      {/* Сообщения */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 'auto', marginBottom: 'auto', fontSize: 14 }}>
            Напишите первое сообщение!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  padding: '10px 14px',
                  background: isMe ? 'var(--accent)' : 'var(--bg-hover)',
                  color: isMe ? '#fff' : 'var(--text)',
                  borderRadius: 16,
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: !isMe ? 4 : 16,
                  border: isMe ? 'none' : '1px solid var(--border)',
                  fontSize: 14,
                  lineHeight: 1.4,
                }}
              >
                {msg.text}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <form onSubmit={handleSend} style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Сообщение..."
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: 'var(--input-bg)',
            color: 'var(--text)',
            outline: 'none',
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          style={{
            padding: '0 20px',
            borderRadius: 20,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            opacity: text.trim() ? 1 : 0.5,
            transition: '0.15s',
            boxShadow: text.trim() ? '0 0 10px var(--accent-glow)' : 'none',
          }}
        >
          Отправить
        </button>
      </form>
    </div>
  );
}