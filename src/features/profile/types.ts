export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  status: string;
  updatedAt: number;
}