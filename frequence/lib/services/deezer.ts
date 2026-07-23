export async function getArtistImage(artistName: string): Promise<string | null> {
  try {
    const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&limit=10`;
    const res = await fetch(url);
    const data = await res.json();

    const artists = data.data ?? [];

    const exactMatches = artists.filter(
      (a: any) => a.name.toLowerCase() === artistName.toLowerCase()
    );

    const candidates = exactMatches.length > 0 ? exactMatches : artists.filter(
      (a: any) => a.name.toLowerCase().includes(artistName.toLowerCase())
    );

    if (candidates.length === 0) return null;

    const best = candidates.sort((a: any, b: any) => b.nb_fan - a.nb_fan)[0];

    console.log(`🎵 ${artistName} → "${best.name}" (${best.nb_fan} fans)`);

    const image = best.picture_medium;
    if (!image || image.includes('d41d8cd98f00b204e9800998ecf8427e')) return null; // placeholder vide
  
    return image;
  } catch (err) {
    console.warn(`🎵 Deezer error for ${artistName}:`, err);
    return null;
  }
}