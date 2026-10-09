/**
 * Сохранённые аккаунты для быстрого входа.
 * ⚠️ Только для разработки и тестирования! Пароли хранятся в localStorage.
 * В продакшне так делать НЕЛЬЗЯ.
 */

const STORAGE_KEY = 'nomi-saved-accounts';

export interface SavedAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  color: string;
}

/** Палитра для кружков */
const COLORS = [
  '#0ABAB5',
  '#ff6b9d',
  '#6c63ff',
  '#ffb84d',
  '#4dd0e1',
  '#a855f7',
];

export function getSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAccount(email: string, password: string, name: string): void {
  const accounts = getSavedAccounts();
  const trimmedEmail = email.trim().toLowerCase();

  // Если такой email уже есть — обновляем пароль и имя
  const existing = accounts.find((a) => a.email === trimmedEmail);
  if (existing) {
    existing.password = password;
    existing.name = name;
  } else {
    accounts.push({
      id: crypto.randomUUID(),
      email: trimmedEmail,
      password,
      name: name || trimmedEmail,
      color: COLORS[accounts.length % COLORS.length],
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

export function removeAccount(id: string): void {
  const accounts = getSavedAccounts().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}