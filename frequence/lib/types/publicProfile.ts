export type PublicProfile = {
  id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  profile_visibility: 'public' | 'followers';
  can_view: boolean;
  is_following: boolean;
  followers_count: number;
  following_count: number;
  events_count: number;
};