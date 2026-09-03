const MAP: ReadonlyArray<[RegExp, string]> = [
  [/invalid login credentials/i, 'Email ou mot de passe incorrect.'],
  [/email not confirmed/i, "Ton adresse n'est pas encore confirmée. Vérifie ta boîte mail."],
  [/user already registered|already been registered/i, 'Un compte existe déjà avec cette adresse.'],
  [/password should be at least/i, 'Le mot de passe doit contenir au moins 8 caractères.'],
  [/weak password/i, 'Mot de passe trop faible.'],
  [/unable to validate email|invalid email/i, 'Adresse email invalide.'],
  [/rate limit|for security purposes/i, 'Trop de tentatives/ Réessaie dans quelques instants.'],
  [/network request failed|fetch failed|timeout/i, 'Connexion impossible. Vérifie ton réseau.'],
];

export function authErrorMessage(error: unknown): string {
  const raw = typeof error === 'string' ? error : ((error as { message?: string })?.message ?? '');
  return MAP.find(([re]) => re.test(raw))?.[1] ?? 'Une erreur est survenue. Réessaie.';
}