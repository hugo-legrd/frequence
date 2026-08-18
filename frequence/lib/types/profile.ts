export type MyProfile = {
  display_name: string;
  member_since: string;
  concerts_count: number;
  artists_count: number;
  friends_count: number;
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
}