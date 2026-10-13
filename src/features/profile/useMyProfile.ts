import { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import {
  ensureUserProfile,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
} from './api';
import type { UserProfile } from './types';

export function useMyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => {
        setProfile(null);
        setLoading(false);
      });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const p = await ensureUserProfile(
          user.uid,
          user.displayName || 'Гость',
          user.email || '',
        );
        if (!cancelled) setProfile(p);
      } catch (e) {
        console.error('Ошибка загрузки профиля:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveProfile = async (patch: { name?: string; status?: string }) => {
    if (!user) return;
    await updateUserProfile(user.uid, patch);
    const fresh = await getUserProfile(user.uid);
    if (fresh) setProfile(fresh);
  };

  const changeAvatar = async (file: File) => {
    if (!user) return;
    const url = await uploadAvatar(user.uid, file);
    await updateUserProfile(user.uid, { avatarUrl: url });
    const fresh = await getUserProfile(user.uid);
    if (fresh) setProfile(fresh);
  };

  return { profile, loading, saveProfile, changeAvatar };
}