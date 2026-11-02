export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: number;
  lastMessageSenderId: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: number;
}