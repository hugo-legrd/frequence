const EMAIL_RE = /^[^\s@]+@[^s@]+\.[^\s@]{2,}$/;

export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const isValidEmail = (value: string) => EMAIL_RE.test(normalizeEmail(value));

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

const LABELS = ['Trop court', 'Faible', 'Correct', 'Bon', 'Excellent'] as const;

export function passwordStrength(pw: string): Strength {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if(/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const s = Math.min(score, 4) as Strength['score'];
  return { score: s, label: LABELS[s] };
}