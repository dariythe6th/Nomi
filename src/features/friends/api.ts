import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../shared/lib/firebase';
import type { UserSearchResult, FriendRequest } from './types';

/** Составить id для friendships — сортируем uid, чтобы (A,B) и (B,A) давали один id */
function makeFriendshipId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('_');
}

/**
 * Поиск пользователя по email (точное совпадение).
 * Вернёт только одного, потому что email уникален.
 */
export async function findUserByEmail(
  email: string,
): Promise<UserSearchResult | null> {
  const q = query(
    collection(db, 'users'),
    where('email', '==', email.toLowerCase().trim()),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const d = snap.docs[0];
  const data = d.data();
  return {
    uid: d.id,
    name: data.name ?? 'Гость',
    email: data.email ?? '',
    avatarUrl: data.avatarUrl ?? null,
  };
}

/**
 * Отправить заявку в друзья.
 * Если обратная заявка уже есть — сразу делаем друзьями.
 */
export async function sendFriendRequest(
  fromUid: string,
  fromName: string,
  fromAvatar: string | null,
  toUid: string,
): Promise<void> {
  if (fromUid === toUid) throw new Error('Нельзя добавить себя в друзья');

  // Проверяем, нет ли уже дружбы
  const friendshipId = makeFriendshipId(fromUid, toUid);
  const friendshipRef = doc(db, 'friendships', friendshipId);
  const friendshipSnap = await getDoc(friendshipRef);
  if (friendshipSnap.exists()) {
    throw new Error('Вы уже друзья');
  }

  // Проверяем, нет ли уже входящей заявки от него — тогда сразу принимаем
  const reverseQ = query(
    collection(db, 'friendRequests'),
    where('from', '==', toUid),
    where('to', '==', fromUid),
    where('status', '==', 'pending'),
  );
  const reverseSnap = await getDocs(reverseQ);

  if (!reverseSnap.empty) {
    // Взаимная заявка — сразу друзья
    await updateDoc(reverseSnap.docs[0].ref, { status: 'accepted' });
    await addDoc(collection(db, 'friendships'), {
      users: [fromUid, toUid].sort() as [string, string],
      createdAt: Date.now(),
    });
    return;
  }

  // Проверяем, не отправляли ли уже заявку
  const existingQ = query(
    collection(db, 'friendRequests'),
    where('from', '==', fromUid),
    where('to', '==', toUid),
    where('status', '==', 'pending'),
  );
  const existingSnap = await getDocs(existingQ);
  if (!existingSnap.empty) {
    throw new Error('Заявка уже отправлена');
  }

  // Создаём новую заявку
  await addDoc(collection(db, 'friendRequests'), {
    from: fromUid,
    to: toUid,
    fromName,
    fromAvatar,
    status: 'pending',
    createdAt: Date.now(),
  });
}

/** Получить входящие заявки (кому я должен ответить) */
export async function getIncomingRequests(uid: string): Promise<FriendRequest[]> {
  const q = query(
    collection(db, 'friendRequests'),
    where('to', '==', uid),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest));
}

/** Получить список uid моих друзей */
export async function getFriendIds(uid: string): Promise<string[]> {
  const q = query(
    collection(db, 'friendships'),
    where('users', 'array-contains', uid),
  );
  const snap = await getDocs(q);
  const ids: string[] = [];
  snap.forEach((d) => {
    const data = d.data();
    const users = data.users as [string, string];
    const friend = users[0] === uid ? users[1] : users[0];
    ids.push(friend);
  });
  return ids;
}

/** Загрузить профили нескольких пользователей по uid */
export async function getProfilesByIds(
  uids: string[],
): Promise<UserSearchResult[]> {
  if (uids.length === 0) return [];
  const results: UserSearchResult[] = [];

  // Firestore не умеет `where in` больше чем на 30 элементов, но для диплома хватит
  for (const uid of uids) {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) continue;
    const data = snap.data();
    results.push({
      uid,
      name: data.name ?? 'Гость',
      email: data.email ?? '',
      avatarUrl: data.avatarUrl ?? null,
    });
  }
  return results;
}

/** Принять заявку — обновить статус и создать friendship */
export async function acceptFriendRequest(
  requestId: string,
  fromUid: string,
  toUid: string,
): Promise<void> {
  // Обновляем статус заявки
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });

  // Создаём friendship
  await addDoc(collection(db, 'friendships'), {
    users: [fromUid, toUid].sort() as [string, string],
    createdAt: Date.now(),
  });
}

/** Отклонить заявку */
export async function declineFriendRequest(requestId: string): Promise<void> {
  await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' });
}

/** Удалить друга (обе стороны) */
export async function removeFriend(uid: string, friendUid: string): Promise<void> {
  const friendshipId = makeFriendshipId(uid, friendUid);
  await updateDoc(doc(db, 'friendships', friendshipId), {
    deletedAt: serverTimestamp(),
  });
}


/**
 * Создать friendship с ботом (для тестов).
 * Если friendship уже есть — молча ничего не делает.
 */
export async function friendWithBot(uid: string, botUid: string): Promise<void> {
  const friendshipId = makeFriendshipId(uid, botUid);
  const ref = doc(db, 'friendships', friendshipId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    users: [uid, botUid].sort() as [string, string],
    createdAt: Date.now(),
    isBot: true,
  });
}