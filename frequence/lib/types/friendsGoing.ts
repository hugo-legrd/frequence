export type FriendGoing = {
  user_id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  status: 'going' | 'interested';
}