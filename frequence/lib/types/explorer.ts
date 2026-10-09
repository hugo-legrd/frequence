export type Venue = {
  id: string;
  name: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
};

export type Store = {
  id: string;
  name: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  schedule: string | null;
  website: string | null;
};