export type RecordStore = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  opening_hours: string | null;
  website: string | null;
};

export async function fetchRecordStores(
  lat: number,
  lon: number,
  radiusMeters = 5000
): Promise<RecordStore[]> {
  const query = `
  [out:json];
  node[shop=music](around:${radiusMeters},${lat},${lon});
  outbody;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const data = await res.json();

  return (data.elements ?? []).map((el: any) => ({
    id: String(el.id),
    name: el.tags?.name ?? 'Disquaire',
    latitude: el.lat,
    longitude: el.lon,
    address: el.tags?.['addr:street']
      ? `${el.tags['addr:housenumber'] ?? ''} ${el.tags['addr:street']}`.trim()
      : null,
    opening_hours: el.tags?.opening_hours ?? null,
    website: el.tags?.website ?? null,
  }));
}