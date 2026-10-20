const CATEGORY_LABELS: Record<string, string> = {
  gig: 'Concert',
  dj: 'DJ Set',
  talks: 'Rencontre',
  theatre: 'Théâtre',
  podcast: 'Podcast',
  foodanddrink: 'Food & Drink',
  playback: 'Écoute',
  artistsigning: 'Dédicace',
  social: 'Soirée',
  workshop: 'Atelier',
  art: 'Art',
};

export function getCategoryLabel(category?: string | null): string {
  if (!category) return 'Événement';
  return CATEGORY_LABELS[category.toLowerCase()] ?? 'Événement';
}