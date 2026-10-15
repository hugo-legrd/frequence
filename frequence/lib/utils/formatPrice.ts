export function formatPrice(price?: number | null, currency?: string | null) : string | null {
  if (price == null) return null;
  if (price === 0) return 'Gratuit';
  const formatted = price.toLocaleString('fr-FR', {
    style: 'currency',
    currency: currency ?? 'EUR',
    maximumFractionDigits: price % 1 === 0 ? 0 : 2,
  });
  return `À partir de ${formatted}`;
}