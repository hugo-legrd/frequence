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

  return {
    events: (data?.events ?? []).map((r: any) => ({  ...r, type: 'event' as const})),
    artists: (data?.artists ?? []).map((r: any) => ({ ...r, type: 'artist' as const})),
    venues: (data?.venues ?? []).map((r: any) => ({ ...r, type: 'venue' as const})),
    record_stores: (data?.record_stores ?? []).map((r: any) => ({ ...r, type: 'store' as const })),
  };
}