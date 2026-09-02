export type RandomEvent ={
  event_id: string;
  event_name: string;
  artist_name: string | null;
  venue_name: string | null;
  starts_at: string | null;
  image_url: string | null;
  genre_names: string[] | null;
};

export type FriendsPick = {
  event_id: string;
  event_name: string;
  artist_name: string | null; 
  venue_name: string | null;
  friend_names: string[];
  friends_count: number;
};

export type LatestEvent = {
  id: string;
  image_url: string | null;
}