 import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../../shared/lib/firebase';

export async function registerUser(
  email: string,
  password: string,
  name: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser() {
  await fbSignOut(auth);
}

/** Человекочитаемые сообщения об ошибках Firebase */
export function describeAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Некорректный email';
    case 'auth/user-not-found':
      return 'Пользователь не найден';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Неверный пароль';
    case 'auth/email-already-in-use':
      return 'Этот email уже зарегистрирован';
    case 'auth/weak-password':
      return 'Пароль слишком короткий (минимум 6 символов)';
    case 'auth/network-request-failed':
      return 'Нет соединения с сервером';
    default:
      return 'Ошибка авторизации: ' + code;
  }
}