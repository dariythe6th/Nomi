import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/useAuth';
import { useChats } from '../features/chat/useChats';
import { getOrCreateChat } from '../features/chat/api';
import { ChatWindow } from '../features/chat/components/ChatWindow';
import { NewChatModal } from '../features/chat/components/NewChatModal';
import { getProfilesByIds } from '../features/friends/api';

function formatChatTime(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Вчера';
  return `${diffDays} дн. назад`;
}

export function ChatsPage() {
  const { user } = useAuth();
  const { chats, loading } = useChats();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Храним имена собеседников для отображения в списке
  const [chatTitles, setChatTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user || chats.length === 0) return;
    
    const friendUids = chats.map(c => c.participants.find(p => p !== user.uid)!);
    const uniqueUids = [...new Set(friendUids)];
    
    getProfilesByIds(uniqueUids).then(profiles => {
      const titles: Record<string, string> = {};
      profiles.forEach(p => { titles[p.uid] = p.name; });
      setChatTitles(titles);
    });
  }, [chats, user]);

  const handleStartChat = async (friendId: string, friendName: string) => {
    if (!user) return;
    const chatId = await getOrCreateChat(user.uid, friendId);
    setChatTitles(prev => ({ ...prev, [friendId]: friendName }));
    setActiveChatId(chatId);
    setIsModalOpen(false);
  };

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeFriendId = activeChat?.participants.find(p => p !== user?.uid);
  const activeName = activeFriendId ? chatTitles[activeFriendId] : '';

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'hidden', boxSizing: 'border-box', display: 'flex' }}>
      
      {/* Левый сайдбар (Карточка) */}
      <aside 
        style={{ 
          width: 340, 
          background: 'var(--bg-panel)', 
          border: '1px solid var(--border)', 
          borderRadius: 14, 
          display: 'flex', 
          flexDirection: 'column', 
          flexShrink: 0,
          marginRight: 24,
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: 'var(--text)', fontSize: 18, margin: 0 }}>Чаты</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px var(--accent-glow)' }}
            title="Новый чат"
          >
            +
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <p style={{ padding: 20, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Загрузка...</p>
          ) : (
            chats.map(chat => {
              const friendId = chat.participants.find(p => p !== user?.uid);
              const friendName = friendId ? chatTitles[friendId] || 'Загрузка...' : 'Чат';
              const isUnread = chat.lastMessageSenderId !== user?.uid && chat.lastMessageSenderId !== '';
              
              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
                    cursor: 'pointer', background: activeChatId === chat.id ? 'var(--bg-hover)' : 'transparent',
                    borderBottom: '1px solid var(--border)', transition: '0.15s'
                  }}
                  onMouseEnter={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 18, flexShrink: 0, border: '2px solid var(--accent)' }}>
                    {friendName[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{friendName}</div>
                    <div style={{ fontSize: 13, color: isUnread ? 'var(--text)' : 'var(--text-muted)', fontWeight: isUnread ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {chat.lastMessage || 'Нет сообщений'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatChatTime(chat.lastMessageAt)}
                    </div>
                    {isUnread && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Правая часть (Карточка чата) */}
      <main 
        style={{ 
          flex: 1, 
          background: 'var(--bg-panel)', 
          border: '1px solid var(--border)', 
          borderRadius: 14, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {activeChatId && activeName ? (
          <ChatWindow chatId={activeChatId} chatName={activeName} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {chats.length === 0 ? (
               <button 
                  onClick={() => setIsModalOpen(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', gap: 16 }}
               >
                 <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)' }}>
                   <span style={{ fontSize: 32, color: 'var(--accent)' }}>+</span>
                 </div>
                 <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Начать чат с другом</span>
               </button>
             ) : (
               <div style={{ textAlign: 'center' }}>
                 <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                 <h2 style={{ fontSize: 20, margin: 0, color: 'var(--text)' }}>Выберите чат</h2>
                 <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Чтобы начать общение, выберите диалог слева.</p>
               </div>
             )}
          </div>
        )}
      </main>

      {isModalOpen && (
        <NewChatModal 
          onClose={() => setIsModalOpen(false)} 
          onSelectChat={() => {}} 
          onStartChat={handleStartChat} 
        />
      )}
    </div>
  );
}