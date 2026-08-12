export type EventDetail = {
  id: string;
  name: string;
  starts_at: string | null;
  image_url: string | null;
  ticket_link: string | null;
  source: string | null;
  venues: {
    id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  artists: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
};

export type InterestStatus = 'interested' | 'going' | null;