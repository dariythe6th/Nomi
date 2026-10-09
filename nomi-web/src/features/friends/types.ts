export interface UserSearchResult {
  uid: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface FriendRequest {
  id: string;
  from: string;
  to: string;
  fromName: string;
  fromAvatar: string | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface Friendship {
  id: string;
  users: [string, string];
  createdAt: number;
}