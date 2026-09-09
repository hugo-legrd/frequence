import { supabase } from "./supabase";

export type SearchResult = {
  id: string;
  name: string;
  type: 'event' | 'artist' | 'venue' | 'store';
  starts_at?: string;
  address?: string;
};

export type SearchResults = {
  events?: SearchResult[] | null;
  artists: SearchResult[] | null;
  venues: SearchResult[] | null;
  record_stores: SearchResult[] | null;
};

type SearchAllResult = {
    events?: any[];
    artists?: any[];
    venues?: any[];
    record_stores?: any[];
};

export async function searchAll(query: string): Promise<SearchResults> {
  const { data, error } = await supabase.rpc('search_all', { query });
  if (error) throw error;

  const result = (data ?? {}) as SearchAllResult;

  return {
    events: (result?.events ?? []).map((r: any) => ({  ...r, type: 'event' as const})),
    artists: (result?.artists ?? []).map((r: any) => ({ ...r, type: 'artist' as const})),
    venues: (result?.venues ?? []).map((r: any) => ({ ...r, type: 'venue' as const})),
    record_stores: (result?.record_stores ?? []).map((r: any) => ({ ...r, type: 'store' as const })),
  };
}