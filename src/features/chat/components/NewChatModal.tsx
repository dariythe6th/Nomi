import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { getFriendIds, getProfilesByIds } from '../../friends/api';
import type { UserSearchResult } from '../../friends/types';

interface Props {
  onClose: () => void;
  onSelectChat: (chatId: string, friendName: string) => void;
  onStartChat: (friendId: string, friendName: string) => void;
}

export function NewChatModal({ onClose, onStartChat }: Props) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const ids = await getFriendIds(user.uid);
      const profiles = await getProfilesByIds(ids);
      setFriends(profiles);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: 'var(--bg-panel)', width: 400, maxHeight: '80vh', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--text)', fontSize: 18 }}>Новый чат</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', padding: 12 }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</p>
          ) : friends.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>У вас пока нет друзей.</p>
          ) : (
            friends.map(f => (
              <div
                key={f.uid}
                onClick={() => onStartChat(f.uid, f.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, cursor: 'pointer', borderRadius: 8, transition: '0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, overflow: 'hidden' }}>
                  {f.avatarUrl ? <img src={f.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : f.name[0]}
                </div>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>{f.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}