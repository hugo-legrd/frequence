// Une ligne du fil d'activité, telle que renvoyée par la RPC get_friends_activity.
// kind = 'interest' : un ami s'intéresse à / va à un concert (champs event_* remplis)
// kind = 'follow'   : un ami suit quelqu'un (champs target_* remplis)
export type FriendActivityRow = {
  kind: 'interest' | 'follow';
  actor_id: string;
  actor_name: string | null;
  actor_handle: string | null;
  actor_avatar_url: string | null;
  status: 'interested' | 'going' | null;
  event_id: string | null;
  event_name: string | null;
  artist_name: string | null;
  venue_name: string | null;
  starts_at: string | null;
  target_user_id: string | null;
  target_name: string | null;
  target_handle: string | null;
  activity_at: string; // ISO avec fuseau (timestamptz)
};