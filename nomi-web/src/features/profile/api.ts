import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../shared/lib/firebase';
import type { UserProfile } from './types';

const COLLECTION = 'users';

/** Получить профиль пользователя */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

/**
 * Создать профиль, если его нет.
 * Вызывается при первой загрузке страницы профиля.
 */
export async function ensureUserProfile(
  uid: string,
  name: string,
  email: string,
): Promise<UserProfile> {
  const existing = await getUserProfile(uid);
  if (existing) return existing;

  const profile: UserProfile = {
    uid,
    name,
    email,
    avatarUrl: null,
    status: '',
    updatedAt: Date.now(),
  };
  await setDoc(doc(db, COLLECTION, uid), profile);
  return profile;
}

/** Обновить поля профиля */
export async function updateUserProfile(
  uid: string,
  patch: Partial<Omit<UserProfile, 'uid' | 'email'>>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, uid), {
    ...patch,
    updatedAt: Date.now(),
  });
}

/** Загрузить аватар на ImgBB и вернуть публичный URL */
export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) throw new Error('VITE_IMGBB_API_KEY не задан в .env.local');

  const formData = new FormData();
  formData.append('image', file);
  formData.append('name', `${uid}-${Date.now()}`);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ImgBB error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.data.url as string;
}