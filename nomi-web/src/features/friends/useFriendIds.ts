import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { getFriendIds } from './api';

/**
 * Загружает список uid друзей текущего пользователя.
 * Возвращает Set — быстрая проверка "этот uid — мой друг?"
 */
export function useFriendIds() {
  const { user } = useAuth();
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Откладываем setState на микротаск, чтобы избежать синхронного обновления
      queueMicrotask(() => {
        setFriendIds(new Set());
        setLoading(false);
      });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const ids = await getFriendIds(user.uid);
        if (!cancelled) setFriendIds(new Set(ids));
      } catch (e) {
        console.error('Ошибка загрузки друзей:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { friendIds, loading };
}