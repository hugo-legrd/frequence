import * as Calendar from 'expo-calendar';
import { Alert, Linking, Platform} from 'react-native';

type CalendarEventInput =  {
  title: string;
  startsAt: string;
  venueName?: string | null;
  address?: string | null;
  ticketLink?: string | null;
};

// On ne connaît pas l'heure de fin des soirées: durée par d"faut
const DEFAULT_DURATION_HOURS = 4;


// Trouve le calendrier dans lequel ajouter l'événement.
// - iOS: le calendrier par défaut choisi par l'utilisateur dans ses réglages.
// - Android: pas de calendrier " par défaut ", on prend le principal modifiable,
// sinon le premier calnedrier modifiable.
async function getWritableCalendar() {
  if (Platform.OS === 'ios') {
    return Calendar.getDefaultCalendarSync();
  }

  const calendars = await Calendar.getCalendars();
  return (
    calendars.find(c => c.isPrimary && c.allowsModifications) ??
    calendars.find(c => c.allowsModifications) ??
    null
  );
}


// Ouvre la fenêtre "Nouvel événement" du calendrier du téléphone, déjà remplie.
// L'utilisateur peut tout vérifier (et choisir son calendrier) avant d'enregistrer.
// Renvoie true si l'événement a bien été enregistré.
export async function addEventToCalendar(input: CalendarEventInput): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissions();

  if (status !== 'granted') {
    Alert.alert(
      'Accès au calendrier refusé',
      'Autorise Fréquence à accéder à ton calendrier dans les réglages pour ajouter cet événement.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }

  const calendar = await getWritableCalendar();
  if (!calendar) {
    Alert.alert(
      'Aucun calendrier disponible',
      "Ajoute un calendrier sur ton téléphone (Google, iCloud...) pour pouvoir y enregistre des événements."
    );
    return false;
  }

  const start = new Date(input.startsAt);
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
  const location = [input.venueName, input.address].filter(Boolean).join(', ');

  const result = await calendar.addEventWithForm({
    title: input.title,
    startDate: start,
    endDate: end,
    location: location || undefined,
    notes: input.ticketLink ? `Billets : ${input.ticketLink}` : undefined,
    url: input.ticketLink ?? undefined,
  });

  // Android répond toujours « done » (il ne dit pas si l'utilisateur a enregistré ou annulé)
  return result.action !== 'canceled';
}