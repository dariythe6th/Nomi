import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { useMyProfile } from '../features/profile/useMyProfile';
import {
  findUserByEmail,
  sendFriendRequest,
  getIncomingRequests,
  getFriendIds,
  getProfilesByIds,
  acceptFriendRequest,
  declineFriendRequest,
} from '../features/friends/api';
import type { UserSearchResult, FriendRequest } from '../features/friends/types';

/* ==== Иконки действий ==== */

const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export function FriendsPage() {
  const { user } = useAuth();
  const { profile } = useMyProfile();
  const navigate = useNavigate();

  // Поиск
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  // Входящие заявки
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);

  // Друзья
  const [friends, setFriends] = useState<UserSearchResult[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const refresh = async () => {
    if (!user) return;
    setLoadingLists(true);
    try {
      const [reqs, friendIds] = await Promise.all([
        getIncomingRequests(user.uid),
        getFriendIds(user.uid),
      ]);
      setIncoming(reqs);
      const profiles = await getProfilesByIds(friendIds);
      setFriends(profiles);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleSearch = async () => {
    setSearchError(null);
    setSearchResult(null);
    setRequestSent(false);
    const email = searchEmail.trim();
    if (!email) return;

    setSearching(true);
    try {
      const found = await findUserByEmail(email);
      if (!found) {
        setSearchError('Пользователь с таким email не найден');
      } else if (found.uid === user?.uid) {
        setSearchError('Это вы сами');
      } else if (friends.some((f) => f.uid === found.uid)) {
        setSearchError('Этот пользователь уже у вас в друзьях');
      } else {
        setSearchResult(found);
      }
    } catch (e) {
      setSearchError((e as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user || !searchResult || !profile) return;
    try {
      await sendFriendRequest(
        user.uid,
        profile.name,
        profile.avatarUrl,
        searchResult.uid,
      );
      setRequestSent(true);
      setSearchResult(null);
      setSearchEmail('');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleAccept = async (req: FriendRequest) => {
    if (!user) return;
    await acceptFriendRequest(req.id, req.from, user.uid);
    refresh();
  };

  const handleDecline = async (req: FriendRequest) => {
    await declineFriendRequest(req.id);
    refresh();
  };

  const handleChat = (friend: UserSearchResult) => {
    alert(`Чат с ${friend.name} будет в следующем обновлении`);
  };

  const handleShowOnMap = (friend: UserSearchResult) => {
    navigate(`/map?focus=${friend.uid}`);
  };

  /* Стили */
  const cardStyle: React.CSSProperties = {
    padding: 20,
    background: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    marginBottom: 20,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 12px',
    background: 'var(--input-bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const primaryBtnStyle: React.CSSProperties = {
    padding: '10px 18px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  };

  const secondaryBtnStyle: React.CSSProperties = {
    padding: '8px 14px',
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  };

  const iconBtnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'transparent',
    color: 'var(--accent)',
    border: '1px solid var(--accent)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.15s',
    flexShrink: 0,
  };

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto', maxWidth: 720 }}>
      <h1 style={{ color: 'var(--text)', marginBottom: 20 }}>Друзья</h1>

      {/* === Поиск === */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>
          Найти пользователя
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="email@example.com"
            style={inputStyle}
          />
          <button onClick={handleSearch} disabled={searching} style={primaryBtnStyle}>
            {searching ? 'Ищем…' : 'Найти'}
          </button>
        </div>

        {searchError && (
          <p style={{ color: '#ff8080', fontSize: 13, marginTop: 10 }}>{searchError}</p>
        )}

        {requestSent && (
          <p style={{ color: 'var(--accent)', fontSize: 13, marginTop: 10 }}>
            ✓ Заявка отправлена
          </p>
        )}

        {searchResult && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              marginTop: 12,
              background: 'var(--bg-hover)',
              borderRadius: 10,
            }}
          >
            <Avatar user={searchResult} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                {searchResult.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {searchResult.email}
              </div>
            </div>
            <button onClick={handleSendRequest} style={primaryBtnStyle}>
              Добавить
            </button>
          </div>
        )}
      </div>

      {/* === Входящие заявки === */}
      {incoming.length > 0 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>
            Входящие заявки ({incoming.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {incoming.map((req) => (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: 'var(--bg-hover)',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {req.fromAvatar ? (
                    <img
                      src={req.fromAvatar}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <UserSilhouette />
                  )}
                </div>
                <div style={{ flex: 1, color: 'var(--text)', fontWeight: 500 }}>
                  {req.fromName}
                </div>
                <button
                  onClick={() => handleAccept(req)}
                  style={{ ...primaryBtnStyle, padding: '8px 14px', fontSize: 13 }}
                >
                  Принять
                </button>
                <button onClick={() => handleDecline(req)} style={secondaryBtnStyle}>
                  Отклонить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === Список друзей === */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>
          Мои друзья ({friends.length})
        </h2>

        {loadingLists ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Загружаем…</p>
        ) : friends.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Пока никого нет. Найдите друга по email выше.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {friends.map((f) => (
              <div
                key={f.uid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: 'var(--bg-hover)',
                  borderRadius: 10,
                }}
              >
                <Avatar user={f} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{f.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {f.email}
                  </div>
                </div>

                {/* Кнопки действий */}
                <button
                  onClick={() => handleChat(f)}
                  title="Написать в чат"
                  style={iconBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                >
                  <MessageIcon />
                </button>

                <button
                  onClick={() => handleShowOnMap(f)}
                  title="Показать на карте"
                  style={iconBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                >
                  <MapPinIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* Кружок с аватаром или силуэтом */
function Avatar({ user }: { user: UserSearchResult }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        border: '2px solid var(--accent)',
      }}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <UserSilhouette />
      )}
    </div>
  );
}

const UserSilhouette = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21 C4 15 8 13 12 13 C16 13 20 15 20 21 Z" />
  </svg>
);