import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../shared/lib/firebase';

/** 
 * Создает чат между двумя пользователями или возвращает существующий.
 * Использует детерминированный ID (uid1_uid2), чтобы нельзя было создать два одинаковых чата.
 */
export async function getOrCreateChat(uid1: string, uid2: string): Promise<string> {
  const sortedUids = [uid1, uid2].sort();
  const chatId = `${sortedUids[0]}_${sortedUids[1]}`;
  const chatRef = doc(db, 'chats', chatId);
  const snap = await getDoc(chatRef);

  if (!snap.exists()) {
    await setDoc(chatRef, {
      participants: sortedUids,
      lastMessage: '',
      lastMessageAt: Date.now(),
      lastMessageSenderId: '',
    });
  }
  return chatId;
}

/** Отправка сообщения */
export async function sendMessage(chatId: string, senderId: string, text: string) {
  const chatRef = doc(db, 'chats', chatId);
  const messagesRef = collection(chatRef, 'messages');

  // 1. Добавляем сообщение в подколлекцию
  await addDoc(messagesRef, {
    senderId,
    text,
    createdAt: Date.now(),
  });

  // 2. Обновляем последнее сообщение в самом чате (для списка чатов)
  await updateDoc(chatRef, {
    lastMessage: text,
    lastMessageAt: Date.now(),
    lastMessageSenderId: senderId,
  });
}