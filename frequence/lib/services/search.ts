import { supabase } from "./supabase";

export type SearchResult = {
  id: string;
  name: string;
  type: 'event' | 'artist' | 'venue' | 'store';
  starts_at?: string;
  address?: string;
};

export type SearchResults = {
  events: SearchResult[] | null;
  artists: SearchResult[] | null;
  venues: SearchResult[] | null;
  record_stores: SearchResult[] | null;
};

export async function searchAll(query: string): Promise<SearchResults> {
  const { data, error } = await supabase.rpc('search_all', { query });
  if (error) throw error;
  return data as SearchResults;
}