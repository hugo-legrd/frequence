export type FriendsPick = {
  event_id: string;
  event_name: string;
  artist_name: string | null; 
  venue_name: string | null;
  friend_names: string[];
  friends_count: number;
};
