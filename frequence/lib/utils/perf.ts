// Mesure la durée d'un chargement et affiche le résultat dans le terminal Metro.
// Renvoie null (sans planter) si le chargement échoue, avec l'erreur dans les logs.
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    if (__DEV__) {
      // Au-delà de 2 secondes, on le signale clairement
      console.log(`${ms > 2000 ? '🐢' : '⏱️'} ${label} : ${ms} ms`);
    }
    return result;
  } catch (err) {
    console.error(`❌ ${label} a échoué après ${Date.now() - start} ms`, err);
    return null;
  }
}