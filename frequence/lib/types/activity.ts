export type FriendActivityRow = {
  actor_id: string;
  actor_display_name: string | null;
  status: 'interested' | 'going';
  event_id: string;
  event_name: string;
  artist_name: string | null;
  venue_name: string | null;
  starts_at: string | null;
  created_at: string;
};