export type MyProfile = {
  id: string;
  display_name: string;
  member_since: string;
  city: string | null;
  avatar_url: string | null;
  concerts_count: number;
  artists_count: number;
  follower_count: number;
  following_count: number;
  genres: { id: string; name: string }[] | null;
};

export type MyEventRow = {
  event_id: string;
  event_name: string;
  artist_name: string | null;
  venue_name: string | null;
  starts_at: string | null;
  status: 'interested' | 'going';
  is_past: boolean;
  image_url: string | null;
  style: string [] | null;
}