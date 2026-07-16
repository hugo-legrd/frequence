const BASE_URL = 'https://ws.audioscrobbler.com/2.0';
const API_KEY = process.env.EXPO_PUBLIC_LASTFM_API_KEY;

export type LastFmArtist = {
  name: string;
  match: number;
  tags: string[];
};

// Artistes similaires à un artiste donnée
export async function getSimilarArtists(
  artistName: string,
  limit = 6
) : Promise<LastFmArtist[]> {
  const url = `${BASE_URL}/?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.similarartists?.artist ?? []).map((a: any) => ({
    name: a.name,
    match: parseFloat(a.match),
    tags: [],
  }));
}

// Top artists par tag (genre)
export async function getTopArtistsByTag(
  tag: string,
  limit = 5
): Promise<LastFmArtist[]> {
  const url = `${BASE_URL}/?method=tag.gettopartists&tag=${encodeURIComponent(tag)}&api_key=${API_KEY}&format=json&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.topartists?.artist ?? []).map((a: any) => ({
    name: a.name,
    match: 1,
    tags: [tag],
  }));
}

// Top tags d'un artiste
export async function getArtistTopTags(artistName: string): Promise<string[]> {
  const url = `${BASE_URL}/?method=artist.gettoptags&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json&limit=3`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.toptags?.tag ?? []).map((t: any) => t.name as string);
}